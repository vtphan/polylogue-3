"use client";

import { useState, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { FLAW_TYPES, DIFFICULTY_MODE_INFO } from "@/lib/types";
import type { DifficultyMode } from "@/lib/types";
import { computeMatches } from "@/lib/matching";
import { EvaluationPanel } from "@/components/evaluation/evaluation-panel";
import { PresentationView } from "@/components/transcript/presentation-view";
import { DiscussionView } from "@/components/transcript/discussion-view";
import { SCAFFOLD_TEMPLATES } from "@/lib/scaffold-templates";
import { useSessionSocket } from "@/hooks/useSessionSocket";
import type {
  AnnotationCreatedEvent,
  AnnotationDeletedEvent,
  AnnotationConfirmedEvent,
  ScaffoldSentEvent,
  ScaffoldAcknowledgedEvent,
  PhaseChangedEvent,
  UserConnectionEvent,
  ConnectionRosterEntry,
} from "@/hooks/useSessionSocket";
import type { FlawType, Agent, Annotation, AnnotationLocation, PresentationTranscript, DiscussionTranscript } from "@/lib/types";

interface SessionData {
  id: string;
  status: string;
  notes: string | null;
  activity: {
    id: string;
    topic: string;
    type: string;
    transcriptContent: unknown;
    evaluation: unknown;
    flawIndex: unknown;
    agents: unknown;
  };
  groups: GroupData[];
}

interface GroupData {
  id: string;
  name: string;
  config: { difficulty_mode?: string } | null;
  members: { user: { id: string; displayName: string } }[];
  annotations: {
    id: string;
    flawType: string;
    location: { item_id: string; highlighted_text?: string };
    userId: string;
    createdAt: string;
    isGroupAnswer: boolean;
    comments: { id: string; text: string; isBonus: boolean }[];
  }[];
  scaffolds: {
    id: string;
    level: number;
    type: string;
    text: string;
    createdAt: string;
    acknowledgedAt: string | null;
  }[];
  flawResponses: {
    id: string;
    userId: string;
    flawId: string;
    typeAnswer: string;
    typeCorrect: boolean;
    createdAt: string;
  }[];
}

const STATUS_FLOW = ["setup", "individual", "group", "reviewing", "closed"];
const STATUS_LABELS: Record<string, string> = {
  setup: "Setup",
  individual: "Individual",
  group: "Group",
  reviewing: "Reviewing",
  closed: "Closed",
};
const NEXT_BUTTON_LABELS: Record<string, string> = {
  individual: "Start Session",
  group: "Group Phase",
  reviewing: "Release Evaluation",
  closed: "Close Session",
};

interface FeedItem {
  id: string;
  type: "annotation" | "scaffold_ack";
  groupName: string;
  text: string;
  flawType?: string;
  timestamp: Date;
}

export function SessionDashboard({ session: initialSession }: { session: SessionData }) {
  const [session, setSession] = useState(initialSession);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [scaffoldText, setScaffoldText] = useState("");
  const [scaffoldGroupId, setScaffoldGroupId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [showEvaluation, setShowEvaluation] = useState(false);
  const [notes, setNotes] = useState(initialSession.notes || "");
  const [notesSaved, setNotesSaved] = useState(true);
  const [modePickerGroupId, setModePickerGroupId] = useState<string | null>(null);
  const [activityFeed, setActivityFeed] = useState<FeedItem[]>([]);
  const router = useRouter();

  // Connection tracking: userId → groupId
  const [connectedUsers, setConnectedUsers] = useState<Map<string, string | null>>(new Map());
  const connectedSocketsRef = useRef<Map<string, { userId: string; groupId: string | null }>>(new Map());

  const currentStatusIndex = STATUS_FLOW.indexOf(session.status);
  const nextStatus = STATUS_FLOW[currentStatusIndex + 1];

  // ---- Socket.IO: live updates for the teacher dashboard ----
  const getGroupName = useCallback((groupId: string) => {
    return session.groups.find((g) => g.id === groupId)?.name || "Unknown";
  }, [session.groups]);

  const onAnnotationCreated = useCallback((event: AnnotationCreatedEvent) => {
    const ann = event.annotation;
    setSession((prev) => ({
      ...prev,
      groups: prev.groups.map((g) =>
        g.id === ann.groupId
          ? {
              ...g,
              annotations: g.annotations.some((a) => a.id === ann.id)
                ? g.annotations
                : [...g.annotations, {
                    id: ann.id,
                    flawType: ann.flawType,
                    location: ann.location,
                    userId: ann.userId,
                    createdAt: ann.createdAt,
                    isGroupAnswer: ann.isGroupAnswer,
                    comments: [],
                  }],
            }
          : g
      ),
    }));
    setActivityFeed((prev) => [{
      id: ann.id,
      type: "annotation" as const,
      groupName: getGroupName(ann.groupId),
      text: ann.location.highlighted_text?.slice(0, 60) || ann.location.item_id,
      flawType: ann.flawType,
      timestamp: new Date(),
    }, ...prev].slice(0, 20));
  }, [getGroupName]);

  const onAnnotationDeleted = useCallback((event: AnnotationDeletedEvent) => {
    setSession((prev) => ({
      ...prev,
      groups: prev.groups.map((g) =>
        g.id === event.groupId
          ? { ...g, annotations: g.annotations.filter((a) => a.id !== event.annotationId) }
          : g
      ),
    }));
  }, []);

  const onAnnotationConfirmed = useCallback((event: AnnotationConfirmedEvent) => {
    setSession((prev) => ({
      ...prev,
      groups: prev.groups.map((g) =>
        g.id === event.groupId
          ? {
              ...g,
              annotations: g.annotations.map((a) =>
                a.id === event.annotationId
                  ? { ...a, isGroupAnswer: event.isGroupAnswer }
                  : a
              ),
            }
          : g
      ),
    }));
  }, []);

  const onScaffoldSent = useCallback((event: ScaffoldSentEvent) => {
    const s = event.scaffold;
    setSession((prev) => ({
      ...prev,
      groups: prev.groups.map((g) =>
        g.id === s.groupId
          ? {
              ...g,
              scaffolds: g.scaffolds.some((sc) => sc.id === s.id)
                ? g.scaffolds
                : [{ id: s.id, level: s.level, type: s.type, text: s.text, createdAt: s.createdAt, acknowledgedAt: s.acknowledgedAt }, ...g.scaffolds],
            }
          : g
      ),
    }));
  }, []);

  const onScaffoldAcknowledged = useCallback((event: ScaffoldAcknowledgedEvent) => {
    setSession((prev) => ({
      ...prev,
      groups: prev.groups.map((g) =>
        g.id === event.groupId
          ? {
              ...g,
              scaffolds: g.scaffolds.map((s) =>
                s.id === event.scaffoldId ? { ...s, acknowledgedAt: new Date().toISOString() } : s
              ),
            }
          : g
      ),
    }));
    setActivityFeed((prev) => [{
      id: event.scaffoldId,
      type: "scaffold_ack" as const,
      groupName: getGroupName(event.groupId),
      text: "Scaffold acknowledged",
      timestamp: new Date(),
    }, ...prev].slice(0, 20));
  }, [getGroupName]);

  const onPhaseChanged = useCallback((event: PhaseChangedEvent) => {
    setSession((prev) => ({ ...prev, status: event.to }));
  }, []);

  const onUserConnected = useCallback((event: UserConnectionEvent) => {
    connectedSocketsRef.current.set(event.socketId, { userId: event.userId, groupId: event.groupId });
    setConnectedUsers((prev) => {
      const next = new Map(prev);
      next.set(event.userId, event.groupId);
      return next;
    });
  }, []);

  const onUserDisconnected = useCallback((event: UserConnectionEvent) => {
    connectedSocketsRef.current.delete(event.socketId);
    // Check if user has other sockets
    const hasOther = Array.from(connectedSocketsRef.current.values()).some(
      (c) => c.userId === event.userId
    );
    if (!hasOther) {
      setConnectedUsers((prev) => {
        const next = new Map(prev);
        next.delete(event.userId);
        return next;
      });
    }
  }, []);

  const onConnectionRoster = useCallback((roster: ConnectionRosterEntry[]) => {
    setConnectedUsers(new Map(roster.map((r) => [r.userId, r.groupId])));
  }, []);

  const { isConnected } = useSessionSocket(session.id, null, {
    onAnnotationCreated,
    onAnnotationDeleted,
    onAnnotationConfirmed,
    onScaffoldSent,
    onScaffoldAcknowledged,
    onPhaseChanged,
    onUserConnected,
    onUserDisconnected,
    onConnectionRoster,
  });

  // Derive connection status per group
  const groupConnectionStatus = useMemo(() => {
    const statuses = new Map<string, "active" | "partial" | "disconnected">();
    for (const group of session.groups) {
      const memberIds = group.members.map((m) => m.user.id);
      const connectedCount = memberIds.filter((id) => connectedUsers.has(id)).length;
      if (connectedCount === 0) statuses.set(group.id, "disconnected");
      else if (connectedCount === memberIds.length) statuses.set(group.id, "active");
      else statuses.set(group.id, "partial");
    }
    return statuses;
  }, [session.groups, connectedUsers]);

  const [actionError, setActionError] = useState<string | null>(null);

  const advancePhase = useCallback(async () => {
    if (!nextStatus) return;
    try {
      setActionError(null);
      const res = await fetch(`/api/sessions/${session.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        setSession((prev) => ({ ...prev, status: nextStatus }));
      } else {
        const data = await res.json().catch(() => ({}));
        setActionError(data.error || "Failed to advance phase");
      }
    } catch {
      setActionError("Network error — please try again");
    }
  }, [session.id, nextStatus]);

  const sendScaffold = useCallback(async () => {
    if (!scaffoldGroupId || !scaffoldText.trim() || sending) return;
    setSending(true);
    setActionError(null);
    try {
      const res = await fetch("/api/scaffolds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: session.id,
          groupId: scaffoldGroupId,
          text: scaffoldText.trim(),
          level: 1,
          type: "general",
        }),
      });
      if (res.ok) {
        setScaffoldText("");
        setScaffoldGroupId(null);
      } else {
        setActionError("Failed to send scaffold");
      }
    } catch {
      setActionError("Network error — please try again");
    }
    setSending(false);
  }, [session.id, scaffoldGroupId, scaffoldText, sending]);

  const flawIndex = (session.activity.flawIndex || []) as { flaw_id: string; locations: string[]; flaw_type: string; severity: string }[];
  const totalFlaws = flawIndex.length;
  const isReviewing = ["reviewing", "closed"].includes(session.status);

  // Compute match results per group (for reviewing mode)
  const groupMatchResults = useMemo(() => {
    if (!isReviewing) return new Map();
    const results = new Map();
    for (const group of session.groups) {
      const anns = group.annotations.map((a) => ({
        id: a.id,
        location: { item_id: a.location.item_id },
        flawType: a.flawType,
      }));
      results.set(group.id, computeMatches(anns, flawIndex));
    }
    return results;
  }, [isReviewing, session.groups, flawIndex]);

  return (
    <div className="mt-3">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            {session.activity.topic}
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-xs font-medium px-2 py-0.5 rounded ${
              session.activity.type === "presentation"
                ? "bg-emerald-100 text-emerald-700"
                : "bg-sky-100 text-sky-700"
            }`}>
              {session.activity.type}
            </span>
            <span className="text-xs text-gray-500">
              {totalFlaws} flaws in reference evaluation
            </span>
          </div>
        </div>

        {/* Phase control */}
        <div className="flex items-center gap-2">
          {isReviewing && (
            <>
              <a
                href={`/teacher/sessions/${session.id}/class-view`}
                className="bg-purple-600 text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-purple-700 transition-colors"
              >
                Class View
              </a>
              <button
                onClick={async () => {
                  const confirmed = window.confirm(
                    "Students have already seen the evaluation results. Reopening will hide the feedback and let them annotate again. Continue?"
                  );
                  if (!confirmed) return;
                  const res = await fetch(`/api/sessions/${session.id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ status: "group" }),
                  });
                  if (res.ok) {
                    setSession((prev) => ({ ...prev, status: "group" }));
                  }
                }}
                className="border border-gray-300 text-gray-700 text-sm font-medium px-4 py-2 rounded-md hover:bg-gray-50 transition-colors"
              >
                Reopen
              </button>
            </>
          )}
          {nextStatus && session.status !== "closed" && (
            <button
              onClick={advancePhase}
              className="bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              {NEXT_BUTTON_LABELS[nextStatus] || nextStatus}
            </button>
          )}
        </div>
      </div>

      {/* Connection status */}
      {!isConnected && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2 mb-4 text-xs text-yellow-700">
          Reconnecting to live updates...
        </div>
      )}

      {/* Action error */}
      {actionError && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4 text-sm text-red-700 flex items-center justify-between">
          <span>{actionError}</span>
          <button onClick={() => setActionError(null)} className="text-red-400 hover:text-red-600 ml-2">&times;</button>
        </div>
      )}

      {/* Phase indicator */}
      <div className="flex items-center gap-1 mb-6">
        {STATUS_FLOW.map((s, i) => (
          <div key={s} className="flex items-center">
            <div
              className={`text-xs px-2 py-1 rounded ${
                s === session.status
                  ? "bg-blue-600 text-white font-medium"
                  : i < currentStatusIndex
                    ? "bg-blue-100 text-blue-700"
                    : "bg-gray-100 text-gray-400"
              }`}
            >
              {STATUS_LABELS[s] || s}
            </div>
            {i < STATUS_FLOW.length - 1 && (
              <div className={`w-4 h-px mx-0.5 ${i < currentStatusIndex ? "bg-blue-300" : "bg-gray-200"}`} />
            )}
          </div>
        ))}
      </div>

      {/* Group overview grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-6">
        {session.groups.map((group) => {
          const flawCounts = (Object.keys(FLAW_TYPES) as FlawType[]).reduce(
            (acc, type) => {
              acc[type] = group.annotations.filter((a) => a.flawType === type).length;
              return acc;
            },
            {} as Record<FlawType, number>
          );
          const totalAnnotations = group.annotations.length;
          const sectionsFound = new Set(
            group.annotations.map((a) => a.location.item_id)
          ).size;
          const isSelected = selectedGroup === group.id;

          return (
            <div
              key={group.id}
              onClick={() => setSelectedGroup(isSelected ? null : group.id)}
              className={`p-4 bg-white rounded-lg border cursor-pointer transition-all ${
                isSelected
                  ? "border-blue-400 ring-2 ring-blue-100"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-900">{group.name}</h3>
                  {/* Connection status dot */}
                  {(() => {
                    const status = groupConnectionStatus.get(group.id) || "disconnected";
                    const dot = status === "active"
                      ? "bg-green-400" : status === "partial"
                      ? "bg-orange-400" : "bg-gray-300";
                    const label = status === "active"
                      ? "All connected" : status === "partial"
                      ? "Some connected" : "Disconnected";
                    return <span className={`w-2 h-2 rounded-full ${dot}`} title={label} />;
                  })()}
                </div>
                <div className="flex items-center gap-2">
                  {group.config?.difficulty_mode && (
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!["setup", "closed"].includes(session.status)) {
                            setModePickerGroupId(modePickerGroupId === group.id ? null : group.id);
                          }
                        }}
                        className={`text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded ${
                          !["setup", "closed"].includes(session.status) ? "hover:bg-blue-50 hover:text-blue-600 cursor-pointer" : ""
                        }`}
                        title={["setup", "closed"].includes(session.status) ? undefined : "Change practice mode"}
                      >
                        {DIFFICULTY_MODE_INFO[group.config.difficulty_mode as DifficultyMode]?.label || group.config.difficulty_mode}
                      </button>
                      {modePickerGroupId === group.id && (
                        <div className="absolute right-0 top-full mt-1 z-20 bg-white border border-gray-200 rounded-lg shadow-lg p-2 w-48">
                          <p className="text-xs font-medium text-gray-500 mb-1.5 px-1">Practice Mode</p>
                          <div className="space-y-0.5">
                            {(Object.entries(DIFFICULTY_MODE_INFO) as [DifficultyMode, { label: string; desc: string }][]).map(([value, info]) => (
                              <button
                                key={value}
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  setModePickerGroupId(null);
                                  if (value === group.config?.difficulty_mode) return;
                                  // Optimistic update
                                  setSession((prev) => ({
                                    ...prev,
                                    groups: prev.groups.map((g) =>
                                      g.id === group.id
                                        ? { ...g, config: { ...g.config, difficulty_mode: value } }
                                        : g
                                    ),
                                  }));
                                  await fetch(`/api/sessions/${session.id}`, {
                                    method: "PATCH",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ action: "change_mode", groupId: group.id, difficultyMode: value }),
                                  });
                                }}
                                className={`w-full text-left text-xs px-2 py-1.5 rounded transition-colors ${
                                  value === group.config?.difficulty_mode
                                    ? "bg-blue-50 text-blue-700 font-medium"
                                    : "text-gray-600 hover:bg-gray-50"
                                }`}
                              >
                                <span className="font-medium">{info.label}</span>
                                <span className="text-gray-400 ml-1">{info.desc}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  <span className="text-xs text-gray-400">
                    {group.config?.difficulty_mode === "learn" || group.config?.difficulty_mode === "recognize"
                      ? `${group.flawResponses.length} responses`
                      : `${totalAnnotations} annotations`}
                  </span>
                </div>
              </div>

              {/* Members */}
              <div className="flex flex-wrap gap-1 mb-3">
                {group.members.map((m) => (
                  <span
                    key={m.user.id}
                    className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded"
                  >
                    {m.user.displayName}
                  </span>
                ))}
              </div>

              {group.config?.difficulty_mode === "learn" || group.config?.difficulty_mode === "recognize" ? (
                /* Learn/Recognize: show response accuracy */
                <div>
                  {group.flawResponses.length > 0 ? (
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-green-600 font-medium">
                        {group.flawResponses.filter((r) => r.typeCorrect).length}/{group.flawResponses.length} correct
                      </span>
                      <span className="text-gray-400">
                        ({Math.round((group.flawResponses.filter((r) => r.typeCorrect).length / group.flawResponses.length) * 100)}%)
                      </span>
                    </div>
                  ) : (
                    <div className="text-xs text-gray-300">No responses yet</div>
                  )}
                </div>
              ) : (
                /* Annotation modes: show flaw type counts */
                <>
                  <div className="flex gap-2">
                    {(Object.keys(FLAW_TYPES) as FlawType[]).map((type) => (
                      <div
                        key={type}
                        className={`text-xs px-1.5 py-0.5 rounded ${FLAW_TYPES[type].bgColor} ${FLAW_TYPES[type].color}`}
                        title={FLAW_TYPES[type].label}
                      >
                        {flawCounts[type]}
                      </div>
                    ))}
                  </div>

                  <div className="text-xs text-gray-400 mt-2">
                    {sectionsFound} sections touched
                  </div>
                </>
              )}

              {/* Match stats in reviewing mode */}
              {isReviewing && groupMatchResults.has(group.id) && (() => {
                const mr = groupMatchResults.get(group.id)!;
                return (
                  <div className="flex items-center gap-2 mt-2 text-xs">
                    <span className="text-green-600 font-medium">{mr.summary.found} found</span>
                    <span className="text-yellow-600">{mr.summary.missed} missed</span>
                    <span className="text-gray-400">
                      {Math.round(mr.summary.detectionRate * 100)}%
                    </span>
                  </div>
                );
              })()}

              {/* Scaffold button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setScaffoldGroupId(group.id);
                }}
                className="mt-3 text-xs text-blue-600 hover:text-blue-800"
              >
                Send scaffold
              </button>

              {/* Recent scaffolds */}
              {group.scaffolds.length > 0 && (
                <div className="mt-2 border-t border-gray-100 pt-2">
                  <p className="text-xs text-gray-400 mb-1">
                    Recent scaffolds:
                  </p>
                  {group.scaffolds.slice(0, 2).map((s) => (
                    <div key={s.id} className="text-xs text-gray-500 truncate">
                      {s.text}
                      {s.acknowledgedAt && (
                        <span className="text-green-500 ml-1">&#10003;</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Live activity feed */}
      {activityFeed.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Live Activity</h3>
          <div className="space-y-1.5 max-h-40 overflow-y-auto">
            {activityFeed.map((item) => (
              <div key={`${item.id}-${item.timestamp.getTime()}`} className="flex items-center gap-2 text-xs">
                <span className="text-gray-400 shrink-0">
                  {item.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
                <span className="font-medium text-gray-600">{item.groupName}</span>
                {item.type === "annotation" && item.flawType && (
                  <span className={`px-1 py-0.5 rounded ${FLAW_TYPES[item.flawType as FlawType]?.bgColor || ""} ${FLAW_TYPES[item.flawType as FlawType]?.color || ""}`}>
                    {FLAW_TYPES[item.flawType as FlawType]?.label || item.flawType}
                  </span>
                )}
                <span className="text-gray-500 truncate">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Scaffold sending form */}
      {scaffoldGroupId && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-blue-900">
              Send scaffold to{" "}
              {session.groups.find((g) => g.id === scaffoldGroupId)?.name}
            </h3>
            <button
              onClick={() => setScaffoldGroupId(null)}
              className="text-blue-400 hover:text-blue-600"
            >
              &times;
            </button>
          </div>
          {/* Template quick-picks */}
          <div className="flex flex-wrap gap-1 mb-2">
            {SCAFFOLD_TEMPLATES.map((t, i) => (
              <button
                key={i}
                onClick={() => setScaffoldText(t.text)}
                className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded hover:bg-blue-200 transition-colors"
                title={`Level ${t.level}: ${t.text}`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={scaffoldText}
              onChange={(e) => setScaffoldText(e.target.value)}
              placeholder="Type a hint or edit a template above..."
              className="flex-1 text-sm border border-blue-200 rounded px-3 py-1.5 focus:outline-none focus:border-blue-400"
              onKeyDown={(e) => e.key === "Enter" && sendScaffold()}
            />
            <button
              onClick={sendScaffold}
              disabled={!scaffoldText.trim() || sending}
              className="bg-blue-600 text-white text-sm px-4 py-1.5 rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {sending ? "..." : "Send"}
            </button>
          </div>
        </div>
      )}

      {/* Selected group detail */}
      {selectedGroup && (
        <GroupDetail
          group={session.groups.find((g) => g.id === selectedGroup)!}
          flawIndex={flawIndex}
          transcript={session.activity.transcriptContent}
          activityType={session.activity.type}
          agents={session.activity.agents as Agent[]}
        />
      )}

      {/* Session notes */}
      <div className="mt-6">
        <label className="text-sm font-medium text-gray-600 block mb-1">
          Session Notes
        </label>
        <textarea
          value={notes}
          onChange={(e) => { setNotes(e.target.value); setNotesSaved(false); }}
          onBlur={async () => {
            if (notesSaved) return;
            await fetch(`/api/sessions/${session.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ notes }),
            });
            setNotesSaved(true);
          }}
          placeholder="Add observations, reflections, or notes about this session..."
          rows={3}
          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400 resize-y"
        />
        {!notesSaved && (
          <span className="text-xs text-gray-400">Unsaved — click outside to save</span>
        )}
      </div>

      {/* Evaluation (answer key) */}
      <div className="mt-6">
        <button
          onClick={() => setShowEvaluation(!showEvaluation)}
          className="text-sm font-medium text-gray-600 hover:text-gray-900 flex items-center gap-1"
        >
          <span>{showEvaluation ? "▾" : "▸"}</span>
          Reference Evaluation (Answer Key)
        </button>
        {showEvaluation && (
          <div className="mt-3">
            <EvaluationPanel
              evaluation={session.activity.evaluation as never}
              compact
            />
          </div>
        )}
      </div>

      {/* Delete session */}
      {["setup", "closed"].includes(session.status) && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <button
            onClick={async () => {
              if (!confirm("Delete this session? This removes all groups, annotations, and scaffolds.")) return;
              const res = await fetch(`/api/sessions/${session.id}`, { method: "DELETE" });
              if (res.ok) router.push("/teacher");
            }}
            className="text-sm text-red-500 hover:text-red-700"
          >
            Delete session
          </button>
        </div>
      )}
    </div>
  );
}

function GroupDetail({
  group,
  flawIndex,
  transcript,
  activityType,
  agents,
}: {
  group: GroupData;
  flawIndex: { flaw_id: string; locations: string[]; flaw_type: string }[];
  transcript: unknown;
  activityType: string;
  agents: Agent[];
}) {
  const [showTranscript, setShowTranscript] = useState(false);

  // Match annotations against flaw index
  const matchedFlaws = new Set<string>();
  for (const ann of group.annotations) {
    for (const flaw of flawIndex) {
      if (
        flaw.locations.includes(ann.location.item_id) &&
        flaw.flaw_type === ann.flawType
      ) {
        matchedFlaws.add(flaw.flaw_id);
      }
    }
  }

  // Convert annotations for the transcript viewer
  const viewerAnnotations: Annotation[] = group.annotations.map((a) => ({
    id: a.id,
    location: a.location as AnnotationLocation,
    flawType: a.flawType as Annotation["flawType"],
    createdAt: a.createdAt,
  }));

  const mode = group.config?.difficulty_mode;
  const isResponseMode = mode === "learn" || mode === "recognize";

  // For Learn/Recognize modes: compute quiz stats from flawResponses
  const learnResponses = group.flawResponses.filter((r) => r.flawId.startsWith("learn:"));
  const recognizeResponses = group.flawResponses.filter((r) => !r.flawId.startsWith("learn:"));
  const responses = mode === "learn" ? learnResponses : mode === "recognize" ? recognizeResponses : [];
  const responsesByUser = new Map<string, { total: number; correct: number }>();
  for (const r of responses) {
    const entry = responsesByUser.get(r.userId) || { total: 0, correct: 0 };
    entry.total++;
    if (r.typeCorrect) entry.correct++;
    responsesByUser.set(r.userId, entry);
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900">
          {group.name} — Detail
        </h3>
        {!isResponseMode && (
          <button
            onClick={() => setShowTranscript(!showTranscript)}
            className="text-xs text-blue-600 hover:text-blue-800"
          >
            {showTranscript ? "Hide transcript" : "View on transcript"}
          </button>
        )}
      </div>

      {/* Transcript with annotations overlaid (not for Learn/Recognize) */}
      {!isResponseMode && showTranscript && (
        <div className="mb-4 border border-gray-100 rounded-lg p-3 bg-gray-50 max-h-96 overflow-y-auto">
          {activityType === "presentation" ? (
            <PresentationView
              sections={(transcript as PresentationTranscript).sections}
              agents={agents}
              annotations={viewerAnnotations}
              onTextSelected={() => {}}
              onAnnotationClick={() => {}}
            />
          ) : (
            <DiscussionView
              turns={(transcript as DiscussionTranscript).turns}
              agents={agents}
              annotations={viewerAnnotations}
              onTextSelected={() => {}}
              onAnnotationClick={() => {}}
            />
          )}
        </div>
      )}

      {isResponseMode ? (
        /* Learn/Recognize mode: show quiz stats per student */
        <div>
          <div className="grid grid-cols-2 gap-4 mb-4 text-center">
            <div className="bg-blue-50 rounded p-3">
              <div className="text-2xl font-bold text-blue-700">
                {responsesByUser.size}
              </div>
              <div className="text-xs text-blue-600">
                {responsesByUser.size === 1 ? "Student responded" : "Students responded"}
              </div>
            </div>
            <div className="bg-green-50 rounded p-3">
              <div className="text-2xl font-bold text-green-700">
                {responses.length > 0
                  ? Math.round((responses.filter((r) => r.typeCorrect).length / responses.length) * 100)
                  : 0}%
              </div>
              <div className="text-xs text-green-600">Accuracy</div>
            </div>
          </div>

          {/* Per-student breakdown */}
          <div className="space-y-2">
            {group.members.map((m) => {
              const stats = responsesByUser.get(m.user.id);
              return (
                <div key={m.user.id} className="flex items-center justify-between text-sm py-1.5 border-b border-gray-50 last:border-0">
                  <span className="text-gray-700">{m.user.displayName}</span>
                  {stats ? (
                    <span className="text-xs text-gray-500">
                      {stats.correct}/{stats.total} correct
                    </span>
                  ) : (
                    <span className="text-xs text-gray-300">Not started</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Annotation modes: show flaw matching stats */
        <>
          <div className="grid grid-cols-3 gap-4 mb-4 text-center">
            <div className="bg-green-50 rounded p-3">
              <div className="text-2xl font-bold text-green-700">
                {matchedFlaws.size}
              </div>
              <div className="text-xs text-green-600">Flaws found</div>
            </div>
            <div className="bg-yellow-50 rounded p-3">
              <div className="text-2xl font-bold text-yellow-700">
                {flawIndex.length - matchedFlaws.size}
              </div>
              <div className="text-xs text-yellow-600">Flaws missed</div>
            </div>
            <div className="bg-gray-50 rounded p-3">
              <div className="text-2xl font-bold text-gray-700">
                {group.annotations.length}
              </div>
              <div className="text-xs text-gray-600">Total annotations</div>
            </div>
          </div>

          {/* Annotation list */}
          <div className="space-y-2">
            {group.annotations.map((ann) => (
              <AnnotationCard key={ann.id} ann={ann} group={group} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function AnnotationCard({
  ann,
  group,
}: {
  ann: GroupData["annotations"][number];
  group: GroupData;
}) {
  const [commentText, setCommentText] = useState("");
  const [showComment, setShowComment] = useState(false);
  const [comments, setComments] = useState(ann.comments || []);
  const [saving, setSaving] = useState(false);
  const info = FLAW_TYPES[ann.flawType as FlawType];
  const location = ann.location as { item_id: string; highlighted_text?: string };
  const member = group.members.find((m) => m.user.id === ann.userId);

  async function submitComment(isBonus = false) {
    if (!commentText.trim() && !isBonus) return;
    setSaving(true);
    const res = await fetch(`/api/annotations/${ann.id}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: commentText.trim() || (isBonus ? "Bonus find!" : ""),
        isBonus,
      }),
    });
    if (res.ok) {
      const comment = await res.json();
      setComments((prev) => [...prev, comment]);
      setCommentText("");
      setShowComment(false);
    }
    setSaving(false);
  }

  return (
    <div className={`text-sm p-3 rounded ${ann.isGroupAnswer ? "bg-green-50 border border-green-200" : "bg-gray-50"}`}>
      <div className="flex items-start gap-2">
        <span className={`shrink-0 mt-1 w-2 h-2 rounded-full ${info?.bgColor || "bg-gray-200"}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-xs text-gray-400">{location.item_id}</span>
            <span className={`text-xs px-1.5 py-0.5 rounded ${info?.bgColor || ""} ${info?.color || ""}`}>
              {info?.label || ann.flawType}
            </span>
            {member && <span className="text-xs text-gray-400">{member.user.displayName}</span>}
            {ann.isGroupAnswer && <span className="text-xs text-green-600 font-medium">Group answer</span>}
          </div>
          {location.highlighted_text && (
            <p className="text-gray-600 text-xs line-clamp-2">
              &ldquo;{location.highlighted_text}&rdquo;
            </p>
          )}

          {/* Existing comments */}
          {comments.length > 0 && (
            <div className="mt-1.5 space-y-1">
              {comments.map((c) => (
                <div key={c.id} className={`text-xs px-2 py-1 rounded ${c.isBonus ? "bg-yellow-50 text-yellow-700" : "bg-blue-50 text-blue-700"}`}>
                  {c.isBonus && <span className="font-medium">Bonus: </span>}
                  {c.text}
                </div>
              ))}
            </div>
          )}

          {/* Comment actions */}
          <div className="flex items-center gap-2 mt-1.5">
            {!showComment ? (
              <>
                <button
                  onClick={() => setShowComment(true)}
                  className="text-xs text-gray-400 hover:text-blue-600"
                >
                  Comment
                </button>
                {!comments.some((c) => c.isBonus) && (
                  <button
                    onClick={() => submitComment(true)}
                    className="text-xs text-gray-400 hover:text-yellow-600"
                  >
                    Bonus find
                  </button>
                )}
              </>
            ) : (
              <div className="flex gap-1 w-full">
                <input
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Add feedback..."
                  className="flex-1 text-xs border border-gray-200 rounded px-2 py-1"
                  onKeyDown={(e) => e.key === "Enter" && submitComment()}
                  autoFocus
                />
                <button
                  onClick={() => submitComment()}
                  disabled={!commentText.trim() || saving}
                  className="text-xs bg-blue-500 text-white px-2 py-1 rounded disabled:opacity-50"
                >
                  {saving ? "..." : "Send"}
                </button>
                <button
                  onClick={() => setShowComment(false)}
                  className="text-xs text-gray-400"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
