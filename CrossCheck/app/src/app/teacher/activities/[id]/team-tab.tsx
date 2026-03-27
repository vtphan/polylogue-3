"use client";

import { useMemo } from "react";
import { FLAW_TYPES } from "@/lib/types";
import type { FlawType, Agent, PresentationSection, DiscussionTurn } from "@/lib/types";
import { AgentAvatar } from "@/components/transcript/agent-avatar";
import type { AgentProfile, EvaluationFlaw } from "./flaw-annotations";
import { buildFlawSpeakerMap } from "./flaw-annotations";

const SECTION_LABELS: Record<string, string> = {
  introduction: "Introduction",
  approach: "Approach",
  findings: "Findings",
  solution: "Solution",
  conclusion: "Conclusion",
};

const STAGE_LABELS: Record<string, string> = {
  opening_up: "Opening Up",
  working_through: "Working Through",
  converging: "Converging",
};

interface TeamTabProps {
  profiles: AgentProfile[] | null;
  agents: Agent[];
  transcript: { sections?: PresentationSection[]; turns?: DiscussionTurn[] };
  flaws: EvaluationFlaw[];
  onFlawClick: (flawId: string) => void;
}

export function TeamTab({ profiles, agents, transcript, flaws, onFlawClick }: TeamTabProps) {
  const agentRoleMap = useMemo(
    () => new Map(agents.map((a) => [a.agent_id, a.role])),
    [agents]
  );

  const speaksInMap = useMemo(() => {
    const map = new Map<string, string[]>();
    if (transcript.sections) {
      for (const s of transcript.sections) {
        const list = map.get(s.speaker) || [];
        const label = SECTION_LABELS[s.section] || s.section;
        if (!list.includes(label)) list.push(label);
        map.set(s.speaker, list);
      }
    } else if (transcript.turns) {
      for (const t of transcript.turns) {
        const list = map.get(t.speaker) || [];
        const label = STAGE_LABELS[t.stage] || t.stage;
        if (!list.includes(label)) list.push(label);
        map.set(t.speaker, list);
      }
    }
    return map;
  }, [transcript]);

  const flawSpeakerMap = useMemo(
    () => buildFlawSpeakerMap(flaws, transcript),
    [flaws, transcript]
  );

  // Group evaluated flaws by agent_id + flaw_type for matching
  const evaluatedByAgent = useMemo(() => {
    const map = new Map<string, EvaluationFlaw[]>();
    for (const flaw of flaws) {
      const agentId = flawSpeakerMap.get(flaw.flaw_id);
      if (!agentId) continue;
      const key = `${agentId}:${flaw.flaw_type}`;
      const list = map.get(key) || [];
      list.push(flaw);
      map.set(key, list);
    }
    return map;
  }, [flaws, flawSpeakerMap]);

  // Order profiles by first transcript appearance
  const orderedProfiles = useMemo(() => {
    if (!profiles) return null;
    const order = new Map<string, number>();
    const items = transcript.sections || transcript.turns || [];
    items.forEach((item, idx) => {
      const speaker = "speaker" in item ? item.speaker : "";
      if (!order.has(speaker)) order.set(speaker, idx);
    });
    return [...profiles].sort(
      (a, b) => (order.get(a.agent_id) ?? 999) - (order.get(b.agent_id) ?? 999)
    );
  }, [profiles, transcript]);

  if (!orderedProfiles) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-5">
        <p className="text-sm text-gray-500">
          Profile data not available for this activity.
        </p>
        <div className="mt-4 space-y-2">
          {agents.map((a) => (
            <div key={a.agent_id} className="flex items-center gap-3">
              <AgentAvatar agentId={a.agent_id} name={a.name} />
              <div>
                <span className="font-medium text-gray-900 text-sm">{a.name}</span>
                <span className="text-xs text-gray-400 ml-2">{a.role}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {orderedProfiles.map((profile) => (
        <AgentCard
          key={profile.agent_id}
          profile={profile}
          role={agentRoleMap.get(profile.agent_id) || ""}
          speaksIn={speaksInMap.get(profile.agent_id) || []}
          evaluatedByAgent={evaluatedByAgent}
          onFlawClick={onFlawClick}
        />
      ))}
    </div>
  );
}

function AgentCard({
  profile,
  role,
  speaksIn,
  evaluatedByAgent,
  onFlawClick,
}: {
  profile: AgentProfile;
  role: string;
  speaksIn: string[];
  evaluatedByAgent: Map<string, EvaluationFlaw[]>;
  onFlawClick: (flawId: string) => void;
}) {
  const { disposition, expected_flaws } = profile;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5 space-y-3">
      {/* Header */}
      <div className="flex items-center gap-3">
        <AgentAvatar agentId={profile.agent_id} name={profile.name} />
        <div>
          <div className="font-medium text-gray-900">{profile.name}</div>
          <div className="text-xs text-gray-500">{role}</div>
        </div>
      </div>

      {/* Speaks in */}
      {speaksIn.length > 0 ? (
        <p className="text-xs text-gray-500">
          Speaks in: {speaksIn.join(", ")}
        </p>
      ) : (
        <p className="text-xs text-gray-400 italic">Does not appear in transcript</p>
      )}

      {/* Disposition */}
      <div>
        <div className="flex flex-wrap gap-1.5 mb-1.5">
          <DispositionPill label={capitalize(disposition.confidence)}  />
          <DispositionPill label={capitalize(disposition.engagement_style)}  />
          <DispositionPill label={capitalize(disposition.expressiveness)}  />
        </div>
        <p className="text-xs text-gray-500 italic leading-relaxed">
          &ldquo;{disposition.reactive_tendency.trim()}&rdquo;
        </p>
      </div>

      {/* Expected Flaws */}
      {expected_flaws.length > 0 && (
        <div>
          <h4 className="text-xs font-medium text-gray-500 mb-1.5" title="These are the flaws this persona was designed to produce. See the Transcript tab for what actually appeared.">
            Expected Flaws (design intent)
          </h4>
          <ExpectedFlawList
            expectedFlaws={expected_flaws}
            agentId={profile.agent_id}
            evaluatedByAgent={evaluatedByAgent}
            onFlawClick={onFlawClick}
          />
        </div>
      )}
    </div>
  );
}

/**
 * Renders expected flaws, consuming evaluated flaw matches in order so that
 * when an agent has multiple expected flaws of the same type, each links to
 * a different evaluated flaw rather than all pointing to matches[0].
 */
function ExpectedFlawList({
  expectedFlaws,
  agentId,
  evaluatedByAgent,
  onFlawClick,
}: {
  expectedFlaws: AgentProfile["expected_flaws"];
  agentId: string;
  evaluatedByAgent: Map<string, EvaluationFlaw[]>;
  onFlawClick: (flawId: string) => void;
}) {
  // Track how many matches we've consumed per type
  const consumedCounts = new Map<string, number>();

  return (
    <div className="space-y-1.5">
      {expectedFlaws.map((ef, i) => {
        const info = FLAW_TYPES[ef.flaw_type as FlawType];
        const matchKey = `${agentId}:${ef.flaw_type}`;
        const matches = evaluatedByAgent.get(matchKey) || [];
        const consumed = consumedCounts.get(matchKey) || 0;
        const match = matches[consumed] || null;
        if (match) consumedCounts.set(matchKey, consumed + 1);

        return (
          <div
            key={i}
            className={`rounded border p-2 ${match ? "border-gray-200" : "border-gray-100 opacity-60"}`}
          >
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${info?.bgColor || "bg-gray-100"} ${info?.color || ""}`}>
                {info?.abbrev || ef.flaw_type}
              </span>
              {!match && (
                <span className="text-xs text-gray-400">Not detected in transcript</span>
              )}
            </div>
            <p className="text-xs text-gray-700 leading-relaxed">{ef.flaw}</p>
            {match && (
              <button
                onClick={() => onFlawClick(match.flaw_id)}
                className="text-xs text-blue-600 hover:text-blue-800 mt-1"
              >
                See in transcript &rarr;
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

function DispositionPill({ label }: { label: string }) {
  return (
    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
      {label}
    </span>
  );
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, " ");
}
