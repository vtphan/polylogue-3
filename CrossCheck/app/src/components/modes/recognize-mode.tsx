"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { FlawType, Agent, PresentationSection, DiscussionTurn } from "@/lib/types";
import { ResponseCard } from "./response-card";
import { useSessionSocket } from "@/hooks/useSessionSocket";
import type { PhaseChangedEvent, ScaffoldSentEvent } from "@/hooks/useSessionSocket";

interface EvaluationFlaw {
  flaw_id: string;
  flaw_type: string;
  severity: string;
  description: string;
  evidence: string;
  explanation: string;
  location: { type: string; references: string[] };
}

interface RecognizeModeProps {
  sessionId: string;
  groupId: string;
  userId: string;
  activityType: "presentation" | "discussion";
  transcript: {
    sections?: PresentationSection[];
    turns?: DiscussionTurn[];
  };
  agents: Agent[];
  flaws: EvaluationFlaw[];
  sessionPhase: string;
  pendingScaffolds: { id: string; text: string; level: number; type: string }[];
  maxAttempts?: number;
  existingResponses?: { flawId: string; typeAnswer: string; typeCorrect: boolean }[];
}

/** Normalize whitespace for fuzzy matching. */
function normalize(s: string) {
  return s.replace(/\s+/g, " ").trim().toLowerCase();
}

/** Strip enclosing quotes from evidence text. Evaluation YAML often wraps evidence in quotes. */
function stripQuotes(s: string): string {
  const trimmed = s.trim();
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) ||
      (trimmed.startsWith('\u201c') && trimmed.endsWith('\u201d'))) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
}

/** Check if evidence is a cross-section composite (e.g., 'Introduction: "..." Findings: "..."'). */
function isCrossSectionEvidence(evidence: string): boolean {
  return /^[A-Z][a-z]+:\s*[""\u201c]/.test(evidence.trim());
}

/** Try to find evidence in content. Returns { startIdx, matchLen } or null. */
function findEvidence(content: string, evidence: string): { startIdx: number; matchLen: number } | null {
  const lowerContent = content.toLowerCase();

  // Strip enclosing quotes (evaluation YAML often wraps evidence in quotes)
  const stripped = stripQuotes(evidence);

  // Try both the original trimmed and the stripped version
  for (const candidate of [stripped, evidence.trim()]) {
    if (!candidate) continue;

    // Exact match
    const exact = lowerContent.indexOf(candidate.toLowerCase());
    if (exact !== -1) return { startIdx: exact, matchLen: candidate.length };

    // Normalized match (collapse whitespace)
    const normContent = normalize(content);
    const normEvidence = normalize(candidate);
    const normIdx = normContent.indexOf(normEvidence);
    if (normIdx !== -1) {
      let origIdx = 0;
      let normPos = 0;
      while (normPos < normIdx && origIdx < content.length) {
        if (/\s/.test(content[origIdx])) {
          while (origIdx < content.length && /\s/.test(content[origIdx])) origIdx++;
          normPos++;
        } else {
          origIdx++;
          normPos++;
        }
      }
      return { startIdx: origIdx, matchLen: candidate.length };
    }

    // Prefix match (first 50 chars)
    const prefix = candidate.slice(0, 50).toLowerCase();
    if (prefix.length >= 20) {
      const prefixIdx = lowerContent.indexOf(prefix);
      if (prefixIdx !== -1) return { startIdx: prefixIdx, matchLen: candidate.length };
    }
  }

  return null;
}

interface FlawPosition {
  flaw: EvaluationFlaw;
  startIdx: number;
  endIdx: number;
}

/** Pre-compute flaw positions in content with fuzzy fallback. Returns matched, unmatched, and cross-section flaws. */
function computeFlawPositions(content: string, flaws: EvaluationFlaw[]) {
  const matched: FlawPosition[] = [];
  const unmatched: EvaluationFlaw[] = [];
  const crossSection: EvaluationFlaw[] = [];

  for (const flaw of flaws) {
    // Cross-section flaws (coherence flaws spanning multiple sections) can't be
    // highlighted inline — their evidence quotes from multiple sections.
    if (isCrossSectionEvidence(flaw.evidence)) {
      crossSection.push(flaw);
      continue;
    }

    const result = findEvidence(content, flaw.evidence);
    if (result) {
      matched.push({
        flaw,
        startIdx: result.startIdx,
        endIdx: Math.min(result.startIdx + result.matchLen, content.length),
      });
    } else {
      unmatched.push(flaw);
    }
  }

  matched.sort((a, b) => a.startIdx - b.startIdx);
  return { matched, unmatched, crossSection };
}

/** Render content with clickable highlighted evidence and popup response cards. */
function HighlightedContent({
  content,
  flaws,
  groupId,
  userId,
  onResponse,
  crossSectionOwner,
  itemId,
  activeFlawId,
  onHighlightClick,
  maxAttempts,
  existingResponses,
}: {
  content: string;
  flaws: EvaluationFlaw[];
  groupId: string;
  userId: string;
  onResponse: (flawId: string, typeAnswer: FlawType, typeCorrect: boolean) => void;
  /** Map of cross-section flawId -> the itemId that should render it. Only the owning item shows the badge. */
  crossSectionOwner?: Map<string, string>;
  /** This item's id — used to check cross-section flaw ownership. */
  itemId: string;
  activeFlawId: string | null;
  onHighlightClick: (flawId: string) => void;
  maxAttempts?: number;
  existingResponses?: { flawId: string; typeAnswer: string; typeCorrect: boolean }[];
}) {
  const effectiveMaxAttempts = maxAttempts ?? 2;
  const { matched, unmatched, crossSection } = useMemo(() => computeFlawPositions(content, flaws), [content, flaws]);

  // Build initial flawState from existing DB responses (survives page refresh)
  const initialFlawState = useMemo(() => {
    const map = new Map<string, { attempts: number; resolved: boolean; eliminatedTypes: FlawType[] }>();
    if (!existingResponses) return map;

    for (const r of existingResponses) {
      const current = map.get(r.flawId) || { attempts: 0, resolved: false, eliminatedTypes: [] as FlawType[] };
      current.attempts++;
      if (r.typeCorrect) {
        current.resolved = true;
      } else {
        current.eliminatedTypes.push(r.typeAnswer as FlawType);
        if (current.attempts >= effectiveMaxAttempts) {
          current.resolved = true;
        }
      }
      map.set(r.flawId, current);
    }
    return map;
  }, [existingResponses, effectiveMaxAttempts]);

  // Track per-flaw state across popup open/close cycles
  const [flawState, setFlawState] = useState<Map<string, {
    attempts: number;
    resolved: boolean;
    eliminatedTypes: FlawType[];
  }>>(initialFlawState);

  // Derive per-flaw badge status: "unanswered" | "attempted" | "correct" | "wrong"
  type BadgeStatus = "unanswered" | "attempted" | "correct" | "wrong";
  const flawBadgeStatus = useMemo(() => {
    const map = new Map<string, BadgeStatus>();
    for (const [id, state] of flawState) {
      if (!state.resolved) {
        map.set(id, state.attempts > 0 ? "attempted" : "unanswered");
      } else {
        // Resolved: check if any attempt was correct
        const wasCorrect = state.eliminatedTypes.length < effectiveMaxAttempts;
        map.set(id, wasCorrect ? "correct" : "wrong");
      }
    }
    return map;
  }, [flawState, effectiveMaxAttempts]);

  function handleAttempt(flawId: string, typeAnswer: FlawType, isCorrect: boolean, isResolved: boolean) {
    setFlawState((prev) => {
      const next = new Map(prev);
      const current = next.get(flawId) || { attempts: 0, resolved: false, eliminatedTypes: [] };
      next.set(flawId, {
        attempts: current.attempts + 1,
        resolved: isResolved,
        eliminatedTypes: isCorrect ? current.eliminatedTypes : [...current.eliminatedTypes, typeAnswer],
      });
      return next;
    });
    if (isResolved) {
      onResponse(flawId, typeAnswer, isCorrect);
    }
  }

  if (matched.length === 0 && unmatched.length === 0 && crossSection.length === 0) {
    return <p className="text-sm text-gray-800 leading-relaxed">{content}</p>;
  }

  let lastIdx = 0;
  let badgeNum = 0;
  const elements: React.ReactNode[] = [];

  for (const { flaw, startIdx, endIdx } of matched) {
    if (startIdx < lastIdx) continue;
    badgeNum++;
    const isActive = activeFlawId === flaw.flaw_id;
    const status = flawBadgeStatus.get(flaw.flaw_id) || "unanswered";

    if (startIdx > lastIdx) {
      elements.push(
        <span key={`text-${lastIdx}`} className="text-sm text-gray-800 leading-relaxed">
          {content.slice(lastIdx, startIdx)}
        </span>
      );
    }

    // Highlight background color by status
    const highlightBg = isActive
      ? "bg-yellow-200 ring-2 ring-yellow-400"
      : status === "correct" ? "bg-green-100 hover:bg-green-200"
      : status === "wrong" ? "bg-red-100 hover:bg-red-200"
      : status === "attempted" ? "bg-amber-100 hover:bg-amber-200"
      : "bg-yellow-100 hover:bg-yellow-200";

    // Badge icon and color by status
    const badgeStyle = status === "correct"
      ? "bg-green-500 text-white"
      : status === "wrong"
        ? "bg-red-500 text-white"
        : status === "attempted"
          ? "bg-amber-500 text-white"
          : "bg-yellow-400 text-yellow-900";

    const badgeIcon = status === "correct" ? "\u2713"    // checkmark
      : status === "wrong" ? "\u2717"                     // X
      : status === "attempted" ? "\u21BB"                 // retry arrow
      : String(badgeNum);

    elements.push(
      <span key={`hl-wrap-${flaw.flaw_id}`} className="relative inline">
        <mark
          onClick={(e) => { e.stopPropagation(); onHighlightClick(isActive ? "" : flaw.flaw_id); }}
          className={`cursor-pointer rounded px-0.5 transition-colors ${highlightBg}`}
        >
          {content.slice(startIdx, endIdx)}
          <span className={`inline-flex items-center justify-center ml-1 w-4 h-4 text-[10px] font-bold rounded-full align-middle ${badgeStyle}`}>
            {badgeIcon}
          </span>
        </mark>
      </span>
    );

    lastIdx = endIdx;
  }

  if (lastIdx < content.length) {
    elements.push(
      <span key="text-end" className="text-sm text-gray-800 leading-relaxed">
        {content.slice(lastIdx)}
      </span>
    );
  }

  // Unmatched + cross-section flaws: render as inline clickable badges
  // Only show cross-section flaws if this item is the designated owner
  const filteredCrossSection = crossSection.filter(
    (f) => !crossSectionOwner || crossSectionOwner.get(f.flaw_id) === itemId
  );
  const extraFlaws = [...unmatched, ...filteredCrossSection];

  for (const flaw of extraFlaws) {
    badgeNum++;
    const isActive = activeFlawId === flaw.flaw_id;
    const status = flawBadgeStatus.get(flaw.flaw_id) || "unanswered";
    const isCross = isCrossSectionEvidence(flaw.evidence);

    const extraBorderStyle = isActive
      ? "border-purple-400 bg-purple-100 ring-2 ring-purple-300"
      : status === "correct" ? "border-green-300 bg-green-50 text-green-700"
      : status === "wrong" ? "border-red-300 bg-red-50 text-red-700"
      : status === "attempted" ? "border-amber-300 bg-amber-50 text-amber-700"
      : isCross
        ? "border-purple-300 bg-purple-50 text-purple-700 hover:bg-purple-100"
        : "border-gray-300 bg-gray-50 text-gray-600 hover:bg-gray-100";

    const extraBadgeStyle = status === "correct" ? "bg-green-500 text-white"
      : status === "wrong" ? "bg-red-500 text-white"
      : status === "attempted" ? "bg-amber-500 text-white"
      : isCross ? "bg-purple-400 text-white"
      : "bg-gray-400 text-white";

    const extraBadgeIcon = status === "correct" ? "\u2713"
      : status === "wrong" ? "\u2717"
      : status === "attempted" ? "\u21BB"
      : String(badgeNum);

    elements.push(
      <span key={`extra-${flaw.flaw_id}`} className="relative inline-block ml-1">
        <button
          onClick={(e) => { e.stopPropagation(); onHighlightClick(isActive ? "" : flaw.flaw_id); }}
          className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border transition-all ${extraBorderStyle}`}
        >
          <span className={`w-4 h-4 text-[10px] font-bold rounded-full inline-flex items-center justify-center ${extraBadgeStyle}`}>
            {extraBadgeIcon}
          </span>
          {isCross ? "Compare sections" : "Find the flaw"}
        </button>

      </span>
    );
  }

  // Find the active flaw for the centered popup
  const activeFlaw = activeFlawId
    ? [...matched.map((m) => m.flaw), ...unmatched, ...filteredCrossSection].find((f) => f.flaw_id === activeFlawId)
    : null;
  const activeIsCross = activeFlaw ? isCrossSectionEvidence(activeFlaw.evidence) : false;

  return (
    <div>
      {elements}

      {/* Centered popup with backdrop */}
      {activeFlaw && (
        <>
          <div className="fixed inset-0 z-40 bg-black/20" onClick={() => onHighlightClick("")} />
          <div data-popup className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[min(24rem,90vw)] bg-white border border-gray-200 rounded-lg shadow-xl p-4">
            <button
              onClick={() => onHighlightClick("")}
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 text-lg leading-none"
            >
              &times;
            </button>
            {activeIsCross && (
              <p className="text-xs text-purple-600 mb-2 italic leading-relaxed">
                {activeFlaw.evidence}
              </p>
            )}
            <ResponseCard
              key={activeFlaw.flaw_id}
              flawId={activeFlaw.flaw_id}
              correctType={activeFlaw.flaw_type as FlawType}
              explanation={activeFlaw.explanation}
              groupId={groupId}
              userId={userId}
              onAttempt={handleAttempt}
              showDefinitions
              maxAttempts={maxAttempts}
              initialAttempts={flawState.get(activeFlaw.flaw_id)?.attempts ?? 0}
              initialEliminatedTypes={flawState.get(activeFlaw.flaw_id)?.eliminatedTypes ?? []}
              initialResolved={flawState.get(activeFlaw.flaw_id)?.resolved ?? false}
            />
          </div>
        </>
      )}
    </div>
  );
}

export function RecognizeMode({
  sessionId,
  groupId,
  userId,
  activityType,
  transcript,
  agents,
  flaws,
  sessionPhase,
  pendingScaffolds: initialScaffolds,
  maxAttempts,
  existingResponses = [],
}: RecognizeModeProps) {
  // Compute initial score from existing responses (deduplicated by flawId — count only the last response per flaw)
  const initialScore = useMemo(() => {
    const byFlaw = new Map<string, boolean>();
    for (const r of existingResponses) {
      if (!byFlaw.has(r.flawId) || r.typeCorrect) {
        byFlaw.set(r.flawId, r.typeCorrect);
      }
    }
    let correct = 0;
    let total = 0;
    for (const isCorrect of byFlaw.values()) {
      total++;
      if (isCorrect) correct++;
    }
    return { correct, total };
  }, [existingResponses]);

  const [score, setScore] = useState(initialScore);
  const [activeFlawId, setActiveFlawId] = useState<string | null>(null);
  const [scaffolds, setScaffolds] = useState(initialScaffolds);
  const [phaseNotice, setPhaseNotice] = useState<string | null>(null);
  const router = useRouter();

  const agentMap = useMemo(
    () => Object.fromEntries(agents.map((a) => [a.agent_id, a])),
    [agents]
  );

  const flawsByItem = useMemo(() => {
    const map = new Map<string, EvaluationFlaw[]>();
    for (const flaw of flaws) {
      for (const ref of flaw.location.references) {
        const list = map.get(ref) || [];
        list.push(flaw);
        map.set(ref, list);
      }
    }
    return map;
  }, [flaws]);

  // --- Socket.IO: phase changes + scaffolds ---
  const onPhaseChanged = useCallback((event: PhaseChangedEvent) => {
    const labels: Record<string, string> = {
      individual: "Individual Phase",
      group: "Group Phase — discuss with your team!",
      reviewing: "Review Phase — see how you did!",
      closed: "Session closed",
    };
    setPhaseNotice(labels[event.to] || `Phase: ${event.to}`);
    // Refresh so server component re-evaluates (switches to FeedbackView if reviewing)
    setTimeout(() => router.refresh(), 1500);
  }, [router]);

  const onScaffoldSent = useCallback((event: ScaffoldSentEvent) => {
    setScaffolds((prev) => {
      if (prev.some((s) => s.id === event.scaffold.id)) return prev;
      return [...prev, {
        id: event.scaffold.id,
        text: event.scaffold.text,
        level: event.scaffold.level,
        type: event.scaffold.type,
      }];
    });
  }, []);

  const { isConnected } = useSessionSocket(sessionId, groupId, {
    onPhaseChanged,
    onScaffoldSent,
  });

  const acknowledgeScaffold = useCallback(async (scaffoldId: string) => {
    await fetch(`/api/scaffolds/${scaffoldId}`, { method: "PATCH" });
    setScaffolds((prev) => prev.filter((s) => s.id !== scaffoldId));
  }, []);

  function handleResponse(_flawId: string, _typeAnswer: FlawType, typeCorrect: boolean) {
    setScore((s) => ({
      correct: s.correct + (typeCorrect ? 1 : 0),
      total: s.total + 1,
    }));
  }

  // Determine items (sections or turns)
  const items: { id: string; content: string; speaker: string; label: string; sublabel?: string }[] = useMemo(() => {
    if (activityType === "presentation" && transcript.sections) {
      return transcript.sections.map((s) => ({
        id: s.section_id,
        content: s.content,
        speaker: s.speaker,
        label: s.section,
        sublabel: s.role,
      }));
    }
    if (activityType === "discussion" && transcript.turns) {
      return transcript.turns.map((t) => ({
        id: t.turn_id,
        content: t.content,
        speaker: t.speaker,
        label: "",
        sublabel: t.role,
      }));
    }
    return [];
  }, [activityType, transcript]);

  if (items.length === 0) {
    return <div className="text-sm text-gray-500">No transcript data available.</div>;
  }

  return (
    <div className="max-w-3xl mx-auto">
      {!isConnected && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2 mb-4 text-xs text-yellow-700">
          Reconnecting to live updates...
        </div>
      )}

      {phaseNotice && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 mb-4 flex items-center justify-between">
          <p className="text-sm font-medium text-indigo-800">{phaseNotice}</p>
          <button onClick={() => setPhaseNotice(null)} className="text-indigo-400 hover:text-indigo-600 text-xs">&times;</button>
        </div>
      )}

      {scaffolds.length > 0 && (
        <div className="mb-4 space-y-2">
          {scaffolds.map((s) => (
            <div key={s.id} className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start justify-between">
              <div>
                <span className="text-xs font-medium text-blue-700">From your teacher:</span>
                <p className="text-sm text-blue-900 mt-0.5">{s.text}</p>
              </div>
              <button onClick={() => acknowledgeScaffold(s.id)} className="text-xs text-blue-500 hover:text-blue-700 shrink-0 ml-3">
                Dismiss
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="mb-6">
        <h2 className="text-lg font-bold text-gray-900">Recognize Mode</h2>
        <p className="text-sm text-gray-500 mt-1">
          Highlighted passages contain flaws. For each one, identify the flaw type.
        </p>
        {score.total > 0 && (
          <p className="text-xs text-gray-400 mt-1">
            Score: {score.correct}/{score.total}
          </p>
        )}
      </div>

      <div className={activityType === "presentation" ? "space-y-4" : "space-y-3"}>
        {(() => {
          // Pre-compute which section should render each cross-section flaw (first referenced section only)
          const crossSectionOwner = new Map<string, string>(); // flawId -> first itemId that should render it
          for (const flaw of flaws) {
            if (isCrossSectionEvidence(flaw.evidence)) {
              for (const ref of flaw.location.references) {
                // Find the first item that matches this reference
                const matchingItem = items.find((item) => item.id === ref || item.label === ref);
                if (matchingItem && !crossSectionOwner.has(flaw.flaw_id)) {
                  crossSectionOwner.set(flaw.flaw_id, matchingItem.id);
                }
              }
            }
          }

          return items.map((item) => {
          const agent = agentMap[item.speaker];
          // Match by section_id/turn_id OR by section name (e.g., "introduction")
          // because evaluation references may use either format
          const itemFlaws = [
            ...(flawsByItem.get(item.id) || []),
            ...(item.label && item.label !== item.id ? (flawsByItem.get(item.label) || []) : []),
          ].filter((flaw, i, arr) => arr.findIndex((f) => f.flaw_id === flaw.flaw_id) === i);

          return (
            <div
              key={item.id}
              id={item.id}
              className={`bg-white border border-gray-200 rounded-lg ${activityType === "presentation" ? "p-5" : "p-4"}`}
            >
              <div className="flex items-center gap-2 mb-2">
                {activityType === "presentation" ? (
                  <>
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      {item.label}
                    </span>
                    {agent && <span className="text-xs text-gray-400">&mdash; {agent.name}</span>}
                  </>
                ) : (
                  <>
                    {agent && <span className="text-sm font-medium text-gray-900">{agent.name}</span>}
                    {item.sublabel && <span className="text-xs text-gray-400">{item.sublabel}</span>}
                  </>
                )}
              </div>

              <HighlightedContent
                content={item.content}
                flaws={itemFlaws}
                groupId={groupId}
                userId={userId}
                onResponse={handleResponse}
                crossSectionOwner={crossSectionOwner}
                itemId={item.id}
                activeFlawId={activeFlawId}
                onHighlightClick={(id) => setActiveFlawId(id || null)}
                maxAttempts={maxAttempts}
                existingResponses={existingResponses}
              />
            </div>
          );
        });
        })()}
      </div>
    </div>
  );
}
