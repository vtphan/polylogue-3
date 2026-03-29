import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import { SessionActivityViewer } from "./session-activity-viewer";
import { FeedbackView } from "@/components/feedback/feedback-view";
import { LearnMode } from "@/components/modes/learn-mode";
import { RecognizeMode } from "@/components/modes/recognize-mode";
import { LocateMode } from "@/components/modes/locate-mode";
import { RecognizeStage } from "@/components/stages/recognize-stage";
import { ExplainStage } from "@/components/stages/explain-stage";
import { CollaborateStage } from "@/components/stages/collaborate-stage";
import { LocateStage } from "@/components/stages/locate-stage";
import { ResultsView } from "@/components/stages/results-view";
import { WaitingScreen } from "@/components/stages/waiting-screen";
import { ModeChangeListener } from "./mode-change-listener";
import { computeMatches } from "@/lib/matching";
import { extractTurns } from "@/lib/transcript";
import { selectExplainTurns, selectCollaborateTurns } from "@/lib/turn-selection";
import { getLocateTargets } from "@/lib/locate-trigger";
import type {
  Agent,
  Annotation,
  AnnotationLocation,
  DifficultyMode,
  PresentationTranscript,
  DiscussionTranscript,
  FlawIndexEntry,
  Transcript,
  SessionStage,
} from "@/lib/types";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function StudentSessionPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user || session.user.role !== "student") {
    redirect("/auth/login");
  }

  const { id } = await params;

  // Find the session and the student's group
  const classSession = await prisma.session.findUnique({
    where: { id },
    include: {
      activity: true,
      groups: {
        where: {
          members: { some: { userId: session.user.id } },
          name: { not: { startsWith: "solo_" } },
        },
        include: {
          members: {
            include: { user: { select: { id: true, displayName: true } } },
          },
          annotations: {
            orderBy: { createdAt: "asc" },
            include: {
              comments: {
                select: { id: true, text: true, isBonus: true },
              },
            },
          },
          scaffolds: {
            where: { acknowledgedAt: null },
            orderBy: { createdAt: "desc" },
          },
          flawResponses: {
            select: { flawId: true, typeAnswer: true, typeCorrect: true, hintLevel: true, stage: true, userId: true },
            orderBy: { createdAt: "asc" },
          },
          hintUsages: {
            select: { turnId: true, hintLevel: true, stage: true, studentId: true, targetSection: true },
            orderBy: { createdAt: "asc" },
          },
          explanations: {
            include: { author: { select: { id: true, displayName: true } } },
            orderBy: { createdAt: "asc" },
          },
        },
      },
    },
  });

  if (!classSession || classSession.groups.length === 0) {
    notFound();
  }

  const group = classSession.groups[0];
  const activity = classSession.activity;
  const agents = activity.agents as unknown as Agent[];
  const groupPhase = group.phase;
  const groupStage = group.stage as SessionStage;
  const isReviewing = groupPhase === "reviewing" || classSession.status === "complete";

  // Filter annotations: in individual phase, show only own; in group/reviewing, show all
  const showAllAnnotations = groupPhase === "group" || groupPhase === "reviewing" || classSession.status === "complete";

  const annotations: Annotation[] = group.annotations
    .filter((a) => showAllAnnotations || a.userId === session.user.id)
    .map((a) => ({
      id: a.id,
      location: a.location as unknown as AnnotationLocation,
      flawType: a.flawType as Annotation["flawType"],
      createdAt: a.createdAt.toISOString(),
      hinted: a.hinted,
      hintLevel: a.hintLevel,
      targetSection: a.targetSection || undefined,
      isGroupAnswer: a.isGroupAnswer,
      confirmedBy: (a.confirmedBy as string[]) || [],
      userId: a.userId,
      comments: (a as unknown as { comments?: { id: string; text: string; isBonus: boolean }[] }).comments || [],
    }));

  const pendingScaffolds = group.scaffolds.map((s) => ({
    id: s.id,
    text: s.text,
    level: s.level,
    type: s.type,
  }));

  // Extract evaluation/flaw data
  const flawIndex = (activity.flawIndex || []) as unknown as FlawIndexEntry[];

  const evaluationData = activity.evaluation as {
    flaws: {
      flaw_id: string;
      flaw_type: string;
      severity: string;
      description: string;
      evidence: string;
      explanation: string;
      location: { type: string; references: string[] };
    }[];
    summary: { total_flaws: number; key_patterns: string };
  } | null;

  // --- NEW FLOW: Route by group.stage ---
  // For new sessions (no difficulty_mode in config), use stage-based routing
  const groupConfig = group.config as Record<string, unknown> | null;
  const hasDifficultyMode = groupConfig?.difficulty_mode !== undefined;

  if (!hasDifficultyMode) {
    const sessionConfig = classSession.config as Record<string, unknown> | null;
    const thresholds = ((sessionConfig?.thresholds ?? {}) as Record<string, number>);

    const transcript = activity.transcript as unknown as Transcript;
    const allTurns = extractTurns(transcript);

    // Existing recognize responses — own (for recognize stage) and all (for explain stage turn selection)
    const ownRecognizeResponses = group.flawResponses
      .filter((r) => r.stage === "recognize" && r.userId === session.user.id)
      .map((r) => ({
        flawId: r.flawId,
        typeAnswer: r.typeAnswer,
        typeCorrect: r.typeCorrect,
        hintLevel: r.hintLevel,
      }));

    const allRecognizeResponses = group.flawResponses
      .filter((r) => r.stage === "recognize")
      .map((r) => ({
        flawId: r.flawId,
        userId: r.userId,
        typeAnswer: r.typeAnswer,
        typeCorrect: r.typeCorrect,
      }));

    const ownRecognizeHints = group.hintUsages
      .filter((h) => h.stage === "recognize" && h.studentId === session.user.id)
      .map((h) => ({
        turnId: h.turnId,
        hintLevel: h.hintLevel,
      }));

    // Explain stage data (teach back — unanimously correct turns)
    const explainHints = group.hintUsages
      .filter((h) => h.stage === "explain")
      .map((h) => ({ turnId: h.turnId, hintLevel: h.hintLevel }));

    const allExplanations = group.explanations.map((e) => ({
      id: e.id,
      turnId: e.turnId,
      authorId: e.authorId,
      authorName: e.author.displayName,
      text: e.text,
      stage: (e as { stage?: string | null }).stage || undefined,
      revisionOf: e.revisionOf || undefined,
      createdAt: e.createdAt.toISOString(),
    }));

    // Split explanations by stage (null/undefined/"explain" = explain, "collaborate" = collaborate)
    const explainExplanations = allExplanations.filter((e) => e.stage === "explain" || !e.stage);
    const collaborateExplanations = allExplanations.filter((e) => e.stage === "collaborate");

    // Collaborate stage data (team building — any-error turns)
    const collaborateGroupSelections = group.flawResponses
      .filter((r) => r.stage === "collaborate")
      .map((r) => ({
        turnId: r.flawId,
        flawId: r.flawId,
        typeAnswer: r.typeAnswer,
      }));

    const collaborateHints = group.hintUsages
      .filter((h) => h.stage === "collaborate")
      .map((h) => ({ turnId: h.turnId, hintLevel: h.hintLevel }));

    // Compute turn sets
    const explainTurns = selectExplainTurns(allTurns, flawIndex, allRecognizeResponses);
    const collaborateTurns = selectCollaborateTurns(allTurns, flawIndex, allRecognizeResponses);

    const groupMembersList = group.members.map((m) => ({
      id: m.user.id,
      displayName: m.user.displayName,
    }));

    // Check if student has completed all recognize turns
    const allRecognizeComplete = (() => {
      if (groupStage !== "recognize") return true;
      const answeredTurns = new Set(ownRecognizeResponses.map((r) => r.flawId));
      return answeredTurns.size > 0 && answeredTurns.size >= flawIndex.length;
    })();

    return (
      <div>
        <ModeChangeListener sessionId={id} groupId={group.id} groupPhase={groupPhase} sessionActive={classSession.status === "active"} />
        <div className="mb-4">
          <a href="/student" className="text-sm text-blue-600 hover:text-blue-800">
            &larr; Back to activities
          </a>
        </div>

        {/* Session info */}
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-medium">
            {group.name}
          </span>
          <span className="text-xs text-gray-400">
            {group.members.map((m) => m.user.displayName).join(", ")}
          </span>
        </div>

        <h1 className="text-xl font-bold text-gray-900 leading-snug">
          {activity.topic}
        </h1>
        <div className="flex items-center gap-2 mt-1.5 mb-6">
          <span className={`text-xs font-medium px-2 py-0.5 rounded ${
            activity.type === "presentation"
              ? "bg-emerald-100 text-emerald-700"
              : "bg-sky-100 text-sky-700"
          }`}>
            {activity.type}
          </span>
          <span className={`text-xs px-2 py-0.5 rounded font-medium ${
            groupStage === "results" ? "bg-purple-100 text-purple-700"
              : groupStage === "locate" ? "bg-orange-100 text-orange-700"
              : groupStage === "collaborate" ? "bg-teal-100 text-teal-700"
              : groupStage === "explain" ? "bg-amber-100 text-amber-700"
              : "bg-blue-100 text-blue-700"
          }`}>
            {groupStage === "recognize" ? "Recognize (individual)"
              : groupStage === "explain" ? "Explain (group)"
              : groupStage === "collaborate" ? "Collaborate (group)"
              : groupStage === "locate" ? "Locate (group)"
              : "Results"}
          </span>
        </div>

        {/* Stage-based rendering */}
        {groupStage === "results" ? (
          (() => {
            // Build results data
            const memberMap = new Map(groupMembersList.map((m) => [m.id, m.displayName]));

            // Recognize results per student
            const recognizeByStudent = new Map<string, typeof ownRecognizeResponses>();
            for (const resp of allRecognizeResponses) {
              const existing = recognizeByStudent.get(resp.userId) || [];
              existing.push({ ...resp, hintLevel: 0 });
              recognizeByStudent.set(resp.userId, existing);
            }

            const recognizeResults = groupMembersList.map((m) => {
              const responses = recognizeByStudent.get(m.id) || [];
              const correct = responses.filter((r) => r.typeCorrect).length;
              const withHints = group.hintUsages
                .filter((h) => h.studentId === m.id && h.stage === "recognize").length;

              return {
                studentId: m.id,
                studentName: m.displayName,
                turns: responses.map((r) => ({
                  turnId: r.flawId,
                  correct: r.typeCorrect,
                  hintsUsed: r.hintLevel || 0,
                  productiveFailure: false, // legacy field — false positives removed
                })),
                summary: {
                  total: responses.length,
                  correct,
                  independent: correct - withHints,
                  withSupport: withHints,
                },
              };
            });

            // Explain results (teach back — unanimously correct turns)
            const explainResultsData = explainTurns.map((turn) => {
              const turnExplanations = explainExplanations
                .filter((e) => e.turnId === turn.id)
                .map((e) => ({
                  authorId: e.authorId,
                  authorName: e.authorName,
                  text: e.text,
                }));
              const turnHints = explainHints.filter((h) => h.turnId === turn.id);

              return {
                turnId: turn.id,
                speaker: turn.speaker,
                content: turn.content,
                correctType: turn.correctFlawType,
                groupTypeAnswer: turn.correctFlawType, // always correct in Explain
                explanations: turnExplanations,
                hintsUsed: turnHints.length > 0 ? Math.max(...turnHints.map((h) => h.hintLevel)) : 0,
                hasDisagreement: false, // no disagreement in Explain (all correct)
              };
            });

            // Collaborate results (team building — any-error turns)
            const collaborateResultsData = collaborateTurns.map((turn) => {
              const groupSel = collaborateGroupSelections.find((s) => s.flawId === turn.flawId);
              const turnExplanations = collaborateExplanations
                .filter((e) => e.turnId === turn.id)
                .map((e) => ({
                  authorId: e.authorId,
                  authorName: e.authorName,
                  text: e.text,
                }));
              const turnHints = collaborateHints.filter((h) => h.turnId === turn.id);

              return {
                turnId: turn.id,
                speaker: turn.speaker,
                content: turn.content,
                correctType: turn.correctFlawType,
                groupTypeAnswer: groupSel?.typeAnswer || "",
                explanations: turnExplanations,
                hintsUsed: turnHints.length > 0 ? Math.max(...turnHints.map((h) => h.hintLevel)) : 0,
                hasDisagreement: turn.hasDisagreement,
              };
            });

            // Locate results — uses Collaborate selections (not Explain)
            const locateTargetsData = getLocateTargets(flawIndex, allRecognizeResponses, collaborateGroupSelections);
            const locateAnnotations = group.annotations
              .filter((a) => a.hintLevel > 0 || group.stage === "results")
              .map((a) => ({
                turnId: (a.location as unknown as { item_id: string }).item_id,
                hintLevel: a.hintLevel,
              }));

            const locateResult = {
              triggered: locateTargetsData.length > 0,
              totalTargets: locateTargetsData.length,
              found: locateTargetsData.filter((t) =>
                t.locations.some((loc) => locateAnnotations.some((a) => a.turnId === loc))
              ).length,
              perFlaw: locateTargetsData.map((t) => {
                const ann = locateAnnotations.find((a) => t.locations.includes(a.turnId));
                return {
                  flawId: t.flawId,
                  flawType: t.flawType,
                  hintsUsed: ann?.hintLevel || 0,
                };
              }),
            };

            return (
              <ResultsView
                recognizeResults={recognizeResults}
                explainResults={explainResultsData}
                collaborateResults={collaborateResultsData}
                locateResult={locateResult}
                totalFlaws={flawIndex.length}
              />
            );
          })()
        ) : groupStage === "recognize" ? (
          allRecognizeComplete ? (
            <WaitingScreen
              sessionId={id}
              groupId={group.id}
              stats={{
                totalTurns: ownRecognizeResponses.length,
                correct: ownRecognizeResponses.filter((r) => r.typeCorrect).length,
                hintsUsed: ownRecognizeHints.length,
              }}
            />
          ) : (
            <RecognizeStage
              sessionId={id}
              groupId={group.id}
              userId={session.user.id}
              turns={allTurns}
              flawIndex={flawIndex}
              evaluationFlaws={(evaluationData?.flaws ?? []).map((f) => ({
                flaw_id: f.flaw_id,
                evidence: f.evidence,
                flaw_type: f.flaw_type,
              }))}
              existingResponses={ownRecognizeResponses}
              existingHints={ownRecognizeHints}
              threshold={thresholds.recognize ?? null}
            />
          )
        ) : groupStage === "explain" ? (
          <ExplainStage
            sessionId={id}
            groupId={group.id}
            userId={session.user.id}
            explainTurns={explainTurns}
            flawIndex={flawIndex}
            groupMembers={groupMembersList}
            existingExplanations={explainExplanations}
            existingHints={explainHints}
            threshold={thresholds.explain ?? null}
          />
        ) : groupStage === "collaborate" ? (
          <CollaborateStage
            sessionId={id}
            groupId={group.id}
            userId={session.user.id}
            collaborateTurns={collaborateTurns}
            flawIndex={flawIndex}
            groupMembers={groupMembersList}
            existingGroupSelections={collaborateGroupSelections}
            existingExplanations={collaborateExplanations}
            existingHints={collaborateHints}
            threshold={thresholds.collaborate ?? null}
          />
        ) : groupStage === "locate" ? (
          (() => {
            const locateTargetsData = getLocateTargets(flawIndex, allRecognizeResponses, collaborateGroupSelections);
            const locateAnnotations = group.annotations
              .filter((a) => a.hintLevel !== undefined)
              .map((a) => ({
                id: a.id,
                turnId: (a.location as unknown as { item_id: string }).item_id,
                flawType: a.flawType,
                hintLevel: a.hintLevel,
                userId: a.userId,
              }));
            const locateHints = group.hintUsages
              .filter((h) => h.stage === "locate")
              .map((h) => ({
                turnId: h.turnId,
                hintLevel: h.hintLevel,
                targetSection: h.targetSection || undefined,
              }));

            return (
              <LocateStage
                sessionId={id}
                groupId={group.id}
                userId={session.user.id}
                turns={allTurns}
                locateTargets={locateTargetsData}
                flawIndex={flawIndex}
                existingAnnotations={locateAnnotations}
                existingHints={locateHints}
                threshold={thresholds.locate ?? null}
              />
            );
          })()
        ) : null}
      </div>
    );
  }

  // --- LEGACY FLOW: Route by difficulty_mode ---
  const difficultyMode = (groupConfig?.difficulty_mode || "classify") as DifficultyMode;
  const maxAttempts = (groupConfig?.max_attempts as number) ?? 2;

  // Compute feedback if in reviewing mode
  let matchResult = null;
  let evaluation = null;
  if (isReviewing) {
    const hasGroupAnswers = annotations.some((a) => a.isGroupAnswer);
    const matchAnnotations = hasGroupAnswers
      ? annotations.filter((a) => a.isGroupAnswer)
      : annotations;

    matchResult = computeMatches(
      matchAnnotations.map((a) => ({
        id: a.id,
        location: { item_id: a.location.item_id },
        flawType: a.flawType,
      })),
      flawIndex,
      { locationOnly: difficultyMode === "locate" || (difficultyMode === "classify" && groupConfig?.categorization === "detect_only") }
    );

    evaluation = evaluationData;
  }

  return (
    <div>
      <ModeChangeListener sessionId={id} groupId={group.id} groupPhase={groupPhase} sessionActive={classSession.status === "active"} />
      <div className="mb-4">
        <a href="/student" className="text-sm text-blue-600 hover:text-blue-800">
          &larr; Back to activities
        </a>
      </div>

      {/* Session info */}
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-medium">
          {group.name}
        </span>
        <span className="text-xs text-gray-400">
          {group.members.map((m) => m.user.displayName).join(", ")}
        </span>
      </div>

      <h1 className="text-xl font-bold text-gray-900 leading-snug">
        {activity.topic}
      </h1>
      <div className="flex items-center gap-2 mt-1.5 mb-6">
        <span className={`text-xs font-medium px-2 py-0.5 rounded ${
          activity.type === "presentation"
            ? "bg-emerald-100 text-emerald-700"
            : "bg-sky-100 text-sky-700"
        }`}>
          {activity.type}
        </span>
        <span className={`text-xs px-2 py-0.5 rounded font-medium ${
          groupPhase === "reviewing" ? "bg-purple-100 text-purple-700"
            : groupPhase === "group" ? "bg-amber-100 text-amber-700"
            : "bg-blue-100 text-blue-700"
        }`}>
          {groupPhase === "individual" ? "Working individually" : groupPhase === "group" ? "Group discussion" : "Reviewing results"}
        </span>
      </div>

      {isReviewing && matchResult && evaluation ? (
        <FeedbackView
          annotations={annotations}
          matchResult={matchResult}
          evaluation={evaluation}
          transcript={activity.transcriptContent as unknown}
          activityType={activity.type}
          agents={agents}
        />
      ) : difficultyMode === "learn" ? (
        <LearnMode
          groupId={group.id}
          sessionId={id}
        />
      ) : difficultyMode === "recognize" && evaluationData ? (
        <RecognizeMode
          sessionId={id}
          groupId={group.id}
          userId={session.user.id}
          activityType={activity.type}
          transcript={activity.transcriptContent as { sections?: PresentationTranscript["sections"]; turns?: DiscussionTranscript["turns"] }}
          agents={agents}
          flaws={evaluationData.flaws}
          sessionPhase={groupPhase}
          pendingScaffolds={pendingScaffolds}
          maxAttempts={maxAttempts}
          responseFormat={groupConfig?.response_format as "ab" | "multiple_choice" | undefined}
          existingResponses={group.flawResponses as { flawId: string; typeAnswer: string; typeCorrect: boolean }[]}
        />
      ) : difficultyMode === "locate" ? (
        <LocateMode
          sessionId={id}
          groupId={group.id}
          userId={session.user.id}
          activityType={activity.type}
          transcript={activity.transcriptContent as unknown}
          agents={agents}
          flawIndex={flawIndex}
          initialAnnotations={annotations}
          pendingScaffolds={pendingScaffolds}
          readOnly={false}
          hintScope={groupConfig?.hint_scope as "sentence" | "section" | undefined}
          sessionPhase={groupPhase}
          existingNoFlawIds={
            (group.flawResponses as { flawId: string; typeAnswer: string; typeCorrect: boolean }[])
              .filter((r) => r.flawId.startsWith("fp_") && r.typeAnswer === "no_flaw")
              .map((r) => r.flawId)
          }
        />
      ) : (
        <SessionActivityViewer
          sessionId={id}
          groupId={group.id}
          activityId={activity.id}
          activityType={activity.type}
          transcript={activity.transcriptContent as unknown}
          agents={agents}
          initialAnnotations={annotations}
          pendingScaffolds={pendingScaffolds}
          readOnly={false}
          difficultyMode={difficultyMode}
          categorization={groupConfig?.categorization as "detect_only" | "assisted" | "full" | undefined}
          explanationFormat={groupConfig?.explanation_format as "guided" | "free_text" | undefined}
          flawIndex={flawIndex}
          sessionPhase={groupPhase}
          userId={session.user.id}
        />
      )}
    </div>
  );
}
