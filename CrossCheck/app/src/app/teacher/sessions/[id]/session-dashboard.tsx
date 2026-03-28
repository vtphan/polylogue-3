"use client";

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FLAW_TYPES, DIFFICULTY_MODE_INFO, SESSION_MODES } from "@/lib/types";
import type { DifficultyMode, SessionMode } from "@/lib/types";
import { computeMatches } from "@/lib/matching";
import { EvaluationPanel } from "@/components/evaluation/evaluation-panel";
import { PresentationView } from "@/components/transcript/presentation-view";
import { DiscussionView } from "@/components/transcript/discussion-view";
import { SCAFFOLD_TEMPLATES } from "@/lib/scaffold-templates";
import { useSessionSocket } from "@/hooks/useSessionSocket";
import { getSocket } from "@/lib/socket-client";
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
  phase: string;
  stage: string;
  config: { difficulty_mode?: string } | null;
  members: { user: { id: string; displayName: string } }[];
  readySignals: { userId: string }[];
  annotations: {
    id: string;
    flawType: string;
    location: { item_id: string; highlighted_text?: string };
    userId: string;
    createdAt: string;
    hinted: boolean;
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

const STATUS_FLOW = ["active", "complete"];
const STATUS_LABELS: Record<string, string> = {
  active: "Active",
  complete: "Complete",
};
const NEXT_BUTTON_LABELS: Record<string, string> = {
  complete: "Complete Session",
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
  // scaffoldGroupId removed — scaffold always targets selectedGroup
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
                    hinted: ann.hinted || false,
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

  const onGroupPhaseChanged = useCallback((event: { groupId: string; phase: string }) => {
    setSession((prev) => ({
      ...prev,
      groups: prev.groups.map((g) =>
        g.id === event.groupId ? { ...g, phase: event.phase, readySignals: [] } : g
      ),
    }));
  }, []);

  const onGroupReadyChanged = useCallback((event: { groupId: string; userId: string; ready: boolean }) => {
    setSession((prev) => ({
      ...prev,
      groups: prev.groups.map((g) =>
        g.id === event.groupId
          ? {
              ...g,
              readySignals: event.ready
                ? [...g.readySignals.filter((r) => r.userId !== event.userId), { userId: event.userId }]
                : g.readySignals.filter((r) => r.userId !== event.userId),
            }
          : g
      ),
    }));
  }, []);

  const { isConnected } = useSessionSocket(session.id, null, {
    onAnnotationCreated,
    onAnnotationDeleted,
    onAnnotationConfirmed,
    onScaffoldSent,
    onScaffoldAcknowledged,
    onPhaseChanged,
    onGroupPhaseChanged,
    onGroupReadyChanged,
    onUserConnected,
    onUserDisconnected,
    onConnectionRoster,
  });

  // Listen for flaw response events (Learn/Recognize mode quiz answers)
  useEffect(() => {
    const socket = getSocket();
    function handleFlawResponse(event: { groupId: string; response: { id: string; userId: string; flawId: string; typeAnswer: string; typeCorrect: boolean } }) {
      setSession((prev) => ({
        ...prev,
        groups: prev.groups.map((g) =>
          g.id === event.groupId
            ? {
                ...g,
                flawResponses: [...g.flawResponses, {
                  id: event.response.id,
                  userId: event.response.userId,
                  flawId: event.response.flawId,
                  typeAnswer: event.response.typeAnswer,
                  typeCorrect: event.response.typeCorrect,
                  createdAt: new Date().toISOString(),
                }],
              }
            : g
        ),
      }));
    }
    socket.on("flaw_response:created", handleFlawResponse);
    return () => { socket.off("flaw_response:created", handleFlawResponse); };
  }, []);

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
    if (!selectedGroup || !scaffoldText.trim() || sending) return;
    setSending(true);
    setActionError(null);
    try {
      const res = await fetch("/api/scaffolds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: session.id,
          groupId: selectedGroup,
          text: scaffoldText.trim(),
          level: 1,
          type: "general",
        }),
      });
      if (res.ok) {
        setScaffoldText("");
      } else {
        setActionError("Failed to send scaffold");
      }
    } catch {
      setActionError("Network error — please try again");
    }
    setSending(false);
  }, [session.id, selectedGroup, scaffoldText, sending]);

  const flawIndex = (session.activity.flawIndex || []) as { flaw_id: string; locations: string[]; flaw_type: string; severity: string }[];
  const totalFlaws = flawIndex.length;
  // Session-level reviewing: true when any group has reached reviewing or session is complete (used for Class View button and match results)
  const isReviewing = session.status === "complete" || session.groups.some((g) => g.phase === "reviewing");

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
            <a
              href={`/teacher/sessions/${session.id}/class-view`}
              className="bg-purple-600 text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-purple-700 transition-colors"
            >
              Class View
            </a>
          )}
          {nextStatus && session.status !== "complete" && (
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

      {/* No session-level phase bar — phase is per-group now */}

      {/* Groups + Detail: side-by-side */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        {/* Left: compact group chips */}
        <div className="md:w-56 md:shrink-0 space-y-1.5">
          {session.groups.map((group) => {
            const totalAnnotations = group.annotations.length;
            const isSelected = selectedGroup === group.id;
            const mode = group.config?.difficulty_mode;
            const isResponseMode = mode === "learn" || mode === "recognize";

            // Summary stat
            let statText: string;
            if (isResponseMode) {
              const correct = group.flawResponses.filter((r) => r.typeCorrect).length;
              statText = group.flawResponses.length > 0
                ? `${correct}/${group.flawResponses.length} correct`
                : "No responses";
            } else {
              statText = `${totalAnnotations} annotations`;
            }

            // Match stats in reviewing
            let matchText: string | null = null;
            if (isReviewing && groupMatchResults.has(group.id)) {
              const mr = groupMatchResults.get(group.id)!;
              matchText = `${mr.summary.found}/${flawIndex.length} found`;
            }

            return (
              <div
                key={group.id}
                onClick={() => { setSelectedGroup(isSelected ? null : group.id); setScaffoldText(""); }}
                className={`px-3 py-2.5 bg-white rounded-lg border cursor-pointer transition-all ${
                  isSelected
                    ? "border-blue-400 ring-2 ring-blue-100"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    {/* Connection dot */}
                    {(() => {
                      const status = groupConnectionStatus.get(group.id) || "disconnected";
                      const dot = status === "active"
                        ? "bg-green-400" : status === "partial"
                        ? "bg-orange-400" : "bg-gray-300";
                      return <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />;
                    })()}
                    <span className="text-sm font-medium text-gray-900">{group.name}</span>
                    <span className="text-xs text-gray-400">{group.members.length}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {mode && (
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (session.status !== "complete") {
                              setModePickerGroupId(modePickerGroupId === group.id ? null : group.id);
                            }
                          }}
                          className={`text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded ${
                            session.status !== "complete" ? "hover:bg-blue-50 hover:text-blue-600 cursor-pointer" : ""
                          }`}
                        >
                          {DIFFICULTY_MODE_INFO[mode as DifficultyMode]?.label || mode}
                        </button>
                        {modePickerGroupId === group.id && (
                          <div className="absolute right-0 top-full mt-1 z-20 bg-white border border-gray-200 rounded-lg shadow-lg p-2 w-48">
                            <p className="text-xs font-medium text-gray-500 mb-1.5 px-1">Practice Mode</p>
                            <div className="space-y-0.5">
                              {SESSION_MODES.map((value) => ({ value, info: DIFFICULTY_MODE_INFO[value] })).map(({ value, info }) => (
                                <button
                                  key={value}
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    setModePickerGroupId(null);
                                    if (value === group.config?.difficulty_mode) return;
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
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-1 text-[11px] text-gray-400">
                  <span className={`font-medium ${
                    group.phase === "reviewing" ? "text-purple-600" : group.phase === "group" ? "text-amber-600" : "text-blue-600"
                  }`}>
                    {group.phase === "individual" ? "Individual" : group.phase === "group" ? "Group" : "Reviewing"}
                  </span>
                  <span>{statText}</span>
                  {matchText && <span className="text-green-600 font-medium">{matchText}</span>}
                  {group.phase !== "reviewing" && group.readySignals.length > 0 && (
                    <span className="text-green-500">{group.readySignals.length}/{group.members.length} ready</span>
                  )}
                </div>
              </div>
            );
          })}

          {/* Live activity feed — compact, below group chips */}
          {activityFeed.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg p-3 mt-3">
              <h3 className="text-xs font-medium text-gray-500 mb-1.5">Live Activity</h3>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {activityFeed.slice(0, 10).map((item) => (
                  <div key={`${item.id}-${item.timestamp.getTime()}`} className="flex items-center gap-1.5 text-[11px]">
                    <span className="text-gray-400 shrink-0">
                      {item.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                    <span className="font-medium text-gray-500">{item.groupName}</span>
                    {item.type === "annotation" && item.flawType && (
                      <span className={`px-1 rounded ${FLAW_TYPES[item.flawType as FlawType]?.bgColor || ""} ${FLAW_TYPES[item.flawType as FlawType]?.color || ""}`}>
                        {FLAW_TYPES[item.flawType as FlawType]?.label || item.flawType}
                      </span>
                    )}
                    <span className="text-gray-400 truncate">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: detail panel */}
        <div className="flex-1 min-w-0">
          {/* Group detail + scaffold */}
          {selectedGroup ? (
            <GroupDetail
              group={session.groups.find((g) => g.id === selectedGroup)!}
              flawIndex={flawIndex}
              transcript={session.activity.transcriptContent}
              activityType={session.activity.type}
              agents={session.activity.agents as Agent[]}
              scaffoldText={scaffoldText}
              onScaffoldTextChange={setScaffoldText}
              onSendScaffold={sendScaffold}
              sendingScaffold={sending}
              sessionStatus={session.status}
              connectedUsers={connectedUsers}
              onAdvancePhase={async (groupId, phase) => {
                setActionError(null);
                try {
                  const res = await fetch(`/api/groups/${groupId}/phase`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ phase }),
                  });
                  if (!res.ok) {
                    const data = await res.json().catch(() => ({}));
                    setActionError(data.error || "Failed to advance phase");
                  }
                } catch {
                  setActionError("Network error — please try again");
                }
              }}
              onAdvanceStage={async (groupId) => {
                setActionError(null);
                try {
                  const res = await fetch(`/api/groups/${groupId}/stage`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ targetStage: "explain" }),
                  });
                  if (!res.ok) {
                    const data = await res.json().catch(() => ({}));
                    setActionError(data.error || "Failed to transition stage");
                  }
                } catch {
                  setActionError("Network error — please try again");
                }
              }}
            />
          ) : (
            <div className="bg-white border border-gray-200 rounded-lg p-8 text-center text-sm text-gray-400">
              Select a group to see details
            </div>
          )}
        </div>
      </div>

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
      {session.status === "complete" && (
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

const PHASE_LABELS: Record<string, string> = { individual: "Individual", group: "Group", reviewing: "Reviewing" };
const NEXT_PHASE: Record<string, { phase: string; label: string }> = {
  individual: { phase: "group", label: "Start Group Work" },
  group: { phase: "reviewing", label: "Show Results" },
};

function GroupDetail({
  group,
  flawIndex,
  transcript,
  activityType,
  agents,
  scaffoldText,
  onScaffoldTextChange,
  onSendScaffold,
  sendingScaffold,
  sessionStatus,
  connectedUsers,
  onAdvancePhase,
  onAdvanceStage,
}: {
  group: GroupData;
  flawIndex: { flaw_id: string; locations: string[]; flaw_type: string }[];
  transcript: unknown;
  activityType: string;
  agents: Agent[];
  scaffoldText: string;
  onScaffoldTextChange: (text: string) => void;
  onSendScaffold: () => void;
  sendingScaffold: boolean;
  sessionStatus: string;
  connectedUsers: Map<string, string | null>;
  onAdvancePhase: (groupId: string, phase: string) => void;
  onAdvanceStage?: (groupId: string) => void;
}) {
  const [showAnnotations, setShowAnnotations] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);

  const mode = group.config?.difficulty_mode;
  const isNewFlow = !mode; // New-flow sessions have no difficulty_mode
  const isResponseMode = mode === "learn" || mode === "recognize";

  // Stage labels for new-flow sessions
  const STAGE_LABELS: Record<string, string> = {
    recognize: "Recognize (Individual)",
    explain: "Explain (Teach Back)",
    collaborate: "Collaborate (Group)",
    locate: "Locate (Group)",
    results: "Results",
  };
  const STAGE_COLORS: Record<string, string> = {
    recognize: "bg-blue-100 text-blue-700",
    explain: "bg-amber-100 text-amber-700",
    collaborate: "bg-teal-100 text-teal-700",
    locate: "bg-orange-100 text-orange-700",
    results: "bg-purple-100 text-purple-700",
  };

  // Match annotations against flaw index
  const matchedFlaws = new Set<string>();
  for (const ann of group.annotations) {
    for (const flaw of flawIndex) {
      if (flaw.locations.includes(ann.location.item_id) && flaw.flaw_type === ann.flawType) {
        matchedFlaws.add(flaw.flaw_id);
      }
    }
  }

  // Per-user stats: learn quiz + activity (annotations or responses)
  const learnByUser = new Map<string, { total: number; correct: number; selfInitiated: boolean }>();
  for (const r of group.flawResponses.filter((r) => r.flawId.startsWith("learn:") || r.flawId.startsWith("self-learn:"))) {
    const e = learnByUser.get(r.userId) || { total: 0, correct: 0, selfInitiated: false };
    e.total++; if (r.typeCorrect) e.correct++;
    if (r.flawId.startsWith("self-learn:")) e.selfInitiated = true;
    learnByUser.set(r.userId, e);
  }

  const activityByUser = new Map<string, { count: number; confirmed: number }>();
  if (isResponseMode) {
    const resps = mode === "learn"
      ? group.flawResponses.filter((r) => r.flawId.startsWith("learn:") || r.flawId.startsWith("self-learn:"))
      : group.flawResponses.filter((r) => !r.flawId.startsWith("learn:") && !r.flawId.startsWith("self-learn:"));
    for (const r of resps) {
      const e = activityByUser.get(r.userId) || { count: 0, confirmed: 0 };
      e.count++; if (r.typeCorrect) e.confirmed++;
      activityByUser.set(r.userId, e);
    }
  } else {
    for (const a of group.annotations) {
      const e = activityByUser.get(a.userId) || { count: 0, confirmed: 0 };
      e.count++; if (a.isGroupAnswer) e.confirmed++;
      activityByUser.set(a.userId, e);
    }
  }

  const nextPhase = NEXT_PHASE[group.phase];
  const readySet = new Set(group.readySignals.map((r) => r.userId));

  // Annotation viewer data
  const viewerAnnotations: Annotation[] = group.annotations.map((a) => ({
    id: a.id,
    location: a.location as AnnotationLocation,
    flawType: a.flawType as Annotation["flawType"],
    createdAt: a.createdAt,
  }));

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
      {/* Section 1: Header — name + mode + phase + advance */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-gray-900">{group.name}</h3>
          {isNewFlow ? (
            <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${STAGE_COLORS[group.stage] || "bg-gray-100 text-gray-500"}`}>
              {STAGE_LABELS[group.stage] || group.stage}
            </span>
          ) : (
            <>
              {mode && (
                <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                  {DIFFICULTY_MODE_INFO[mode as DifficultyMode]?.label || mode}
                </span>
              )}
              <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                group.phase === "reviewing" ? "bg-purple-100 text-purple-700"
                  : group.phase === "group" ? "bg-amber-100 text-amber-700"
                  : "bg-blue-100 text-blue-700"
              }`}>
                {PHASE_LABELS[group.phase] || group.phase}
              </span>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          {group.phase === "reviewing" && sessionStatus === "active" && (
            <button
              onClick={() => {
                if (confirm("Reopen this group? Students will return to group work.")) {
                  onAdvancePhase(group.id, "group");
                }
              }}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Reopen
            </button>
          )}
          {isNewFlow && group.stage === "recognize" && sessionStatus === "active" && onAdvanceStage && (
            <button
              onClick={() => onAdvanceStage(group.id)}
              className="text-xs bg-amber-600 text-white px-3 py-1 rounded hover:bg-amber-700 transition-colors"
            >
              Move to Explain
              {readySet.size > 0 && (
                <span className="ml-1 text-amber-200">{readySet.size}/{group.members.length}</span>
              )}
            </button>
          )}
          {isNewFlow && group.stage === "locate" && sessionStatus === "active" && onAdvanceStage && (
            <button
              onClick={() => {
                if (confirm("Skip Locate and move directly to Results?")) {
                  fetch(`/api/groups/${group.id}/stage`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ targetStage: "results" }),
                  }).then(() => window.location.reload()).catch(() => {});
                }
              }}
              className="text-xs bg-purple-600 text-white px-3 py-1 rounded hover:bg-purple-700 transition-colors"
            >
              Skip to Results
            </button>
          )}
          {!isNewFlow && nextPhase && sessionStatus === "active" && (
            <button
              onClick={() => onAdvancePhase(group.id, nextPhase.phase)}
              className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-colors"
            >
              {nextPhase.label}
              {readySet.size > 0 && (
                <span className="ml-1 text-blue-200">{readySet.size}/{group.members.length}</span>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Section 2: Scaffold */}
      {sessionStatus === "active" && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex flex-wrap gap-1 mb-2">
            {SCAFFOLD_TEMPLATES.map((t, i) => (
              <button key={i} onClick={() => onScaffoldTextChange(t.text)}
                className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded hover:bg-blue-200 transition-colors"
                title={`Level ${t.level}: ${t.text}`}>{t.label}</button>
            ))}
          </div>
          <div className="flex gap-2">
            <input value={scaffoldText} onChange={(e) => onScaffoldTextChange(e.target.value)}
              placeholder="Type a hint or pick a template..."
              className="flex-1 text-sm border border-blue-200 rounded px-3 py-1.5 bg-white focus:outline-none focus:border-blue-400"
              onKeyDown={(e) => e.key === "Enter" && onSendScaffold()} />
            <button onClick={onSendScaffold} disabled={!scaffoldText.trim() || sendingScaffold}
              className="bg-blue-600 text-white text-sm px-4 py-1.5 rounded hover:bg-blue-700 disabled:opacity-50 transition-colors">
              {sendingScaffold ? "..." : "Send"}</button>
          </div>
          {group.scaffolds.length > 0 && (
            <div className="mt-2 pt-2 border-t border-blue-200">
              {group.scaffolds.slice(0, 3).map((s) => (
                <div key={s.id} className="text-xs text-blue-700 truncate">
                  {s.text}{s.acknowledgedAt && <span className="text-green-600 ml-1">&#10003;</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Section 3: Group stats */}
      <div className="flex items-center gap-4 text-xs text-gray-500">
        {isResponseMode ? (
          <>
            <span>{activityByUser.size}/{group.members.length} responded</span>
            {group.flawResponses.length > 0 && (
              <span className="text-green-600 font-medium">
                {Math.round((group.flawResponses.filter((r) => r.typeCorrect).length / group.flawResponses.length) * 100)}% accuracy
              </span>
            )}
          </>
        ) : (
          <>
            <span>{group.annotations.length} annotations</span>
            <span>{matchedFlaws.size}/{flawIndex.length} flaws found</span>
            <span>{new Set(group.annotations.map((a) => a.location.item_id)).size} sections</span>
            {group.annotations.some((a) => a.hinted) && (
              <span className="text-amber-500">{group.annotations.filter((a) => a.hinted).length} hinted</span>
            )}
          </>
        )}
      </div>

      {/* Section 4: Individual student stats — one row per student */}
      <div className="space-y-0.5">
        {group.members.map((m) => {
          const connected = connectedUsers.has(m.user.id);
          const learn = learnByUser.get(m.user.id);
          const activity = activityByUser.get(m.user.id);
          const ready = readySet.has(m.user.id);

          return (
            <div key={m.user.id} className="flex items-center gap-2 text-xs py-1 border-b border-gray-50 last:border-0">
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${connected ? "bg-green-400" : "bg-gray-300"}`} />
              <span className="text-gray-700 w-32 truncate">{m.user.displayName}</span>
              <span className="text-gray-400 tabular-nums">
                {learn ? `Quiz ${learn.correct}/${learn.total}` : "Quiz —"}
              </span>
              <span className="text-gray-400 tabular-nums">
                {isResponseMode
                  ? (activity ? `${activity.confirmed}/${activity.count} correct` : "—")
                  : (activity ? `${activity.count} ann` : "0 ann")}
              </span>
              {!isResponseMode && group.phase !== "individual" && activity && activity.confirmed > 0 && (
                <span className="text-green-500 tabular-nums">{activity.confirmed} confirmed</span>
              )}
              {ready && group.phase !== "reviewing" && (
                <span className="text-green-500">&#10003;</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Section 5: Annotation list + transcript (collapsible) */}
      {!isResponseMode && group.annotations.length > 0 && (
        <div className="border-t border-gray-100 pt-3">
          <div className="flex items-center justify-between">
            <button onClick={() => setShowAnnotations(!showAnnotations)}
              className="text-xs text-gray-500 hover:text-gray-700">
              {showAnnotations ? "▾" : "▸"} Annotations ({group.annotations.length})
            </button>
            <button onClick={() => setShowTranscript(!showTranscript)}
              className="text-xs text-blue-600 hover:text-blue-800">
              {showTranscript ? "Hide transcript" : "View on transcript"}
            </button>
          </div>
          {showAnnotations && (
            <div className="mt-2 space-y-1.5">
              {group.annotations.map((ann) => (
                <AnnotationCard key={ann.id} ann={ann} group={group} />
              ))}
            </div>
          )}
          {showTranscript && (
            <div className="mt-2 border border-gray-100 rounded-lg p-3 bg-gray-50 max-h-96 overflow-y-auto">
              {activityType === "presentation" ? (
                <PresentationView
                  sections={(transcript as PresentationTranscript).sections}
                  agents={agents} annotations={viewerAnnotations}
                  onTextSelected={() => {}} onAnnotationClick={() => {}} />
              ) : (
                <DiscussionView
                  turns={(transcript as DiscussionTranscript).turns}
                  agents={agents} annotations={viewerAnnotations}
                  onTextSelected={() => {}} onAnnotationClick={() => {}} />
              )}
            </div>
          )}
        </div>
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
            {ann.hinted && <span className="text-xs text-amber-500" title="Hint-assisted">💡</span>}
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
