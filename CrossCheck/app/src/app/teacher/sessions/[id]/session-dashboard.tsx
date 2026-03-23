"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { FLAW_TYPES } from "@/lib/types";
import type { FlawType } from "@/lib/types";

interface SessionData {
  id: string;
  status: string;
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
  members: { user: { id: string; displayName: string } }[];
  annotations: {
    id: string;
    flawType: string;
    location: { item_id: string };
    userId: string;
    createdAt: string;
  }[];
  scaffolds: {
    id: string;
    level: number;
    type: string;
    text: string;
    createdAt: string;
    acknowledgedAt: string | null;
  }[];
}

const STATUS_FLOW = ["setup", "active", "individual", "group", "reviewing", "closed"];
const STATUS_LABELS: Record<string, string> = {
  setup: "Setup",
  active: "Start Session",
  individual: "Individual Phase",
  group: "Group Phase",
  reviewing: "Release Evaluation",
  closed: "Close Session",
};

export function SessionDashboard({ session: initialSession }: { session: SessionData }) {
  const [session, setSession] = useState(initialSession);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [scaffoldText, setScaffoldText] = useState("");
  const [scaffoldGroupId, setScaffoldGroupId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const router = useRouter();

  const currentStatusIndex = STATUS_FLOW.indexOf(session.status);
  const nextStatus = STATUS_FLOW[currentStatusIndex + 1];

  const advancePhase = useCallback(async () => {
    if (!nextStatus) return;
    const res = await fetch(`/api/sessions/${session.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });
    if (res.ok) {
      setSession((prev) => ({ ...prev, status: nextStatus }));
      router.refresh();
    }
  }, [session.id, nextStatus, router]);

  const sendScaffold = useCallback(async () => {
    if (!scaffoldGroupId || !scaffoldText.trim() || sending) return;
    setSending(true);
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
      router.refresh();
    }
    setSending(false);
  }, [session.id, scaffoldGroupId, scaffoldText, sending, router]);

  const flawIndex = (session.activity.flawIndex || []) as { flaw_id: string; locations: string[]; flaw_type: string }[];
  const totalFlaws = flawIndex.length;

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
        {nextStatus && session.status !== "closed" && (
          <button
            onClick={advancePhase}
            className="bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            {STATUS_LABELS[nextStatus] || nextStatus}
          </button>
        )}
      </div>

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
              {STATUS_LABELS[s]?.replace("Start ", "").replace("Release ", "").replace("Close ", "") || s}
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
                <h3 className="font-semibold text-gray-900">{group.name}</h3>
                <span className="text-xs text-gray-400">
                  {totalAnnotations} annotations
                </span>
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

              {/* Flaw type counts */}
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
          <div className="flex gap-2">
            <input
              value={scaffoldText}
              onChange={(e) => setScaffoldText(e.target.value)}
              placeholder="Type a hint or question for this group..."
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
        />
      )}
    </div>
  );
}

function GroupDetail({
  group,
  flawIndex,
}: {
  group: GroupData;
  flawIndex: { flaw_id: string; locations: string[]; flaw_type: string }[];
}) {
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

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5">
      <h3 className="font-semibold text-gray-900 mb-3">
        {group.name} — Detail
      </h3>

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
        {group.annotations.map((ann) => {
          const info = FLAW_TYPES[ann.flawType as FlawType];
          const location = ann.location as { item_id: string; highlighted_text?: string };
          const member = group.members.find((m) => m.user.id === ann.userId);
          return (
            <div
              key={ann.id}
              className="flex items-start gap-2 text-sm p-2 rounded bg-gray-50"
            >
              <span
                className={`shrink-0 mt-1 w-2 h-2 rounded-full ${info?.bgColor || "bg-gray-200"}`}
              />
              <div className="flex-1 min-w-0">
                <span className="text-xs text-gray-400">{location.item_id}</span>
                {location.highlighted_text && (
                  <p className="text-gray-600 text-xs line-clamp-2">
                    &ldquo;{location.highlighted_text}&rdquo;
                  </p>
                )}
              </div>
              <span className={`text-xs px-1.5 py-0.5 rounded ${info?.bgColor || ""} ${info?.color || ""}`}>
                {info?.label || ann.flawType}
              </span>
              {member && (
                <span className="text-xs text-gray-400">{member.user.displayName}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
