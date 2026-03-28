"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { FlawType, TranscriptTurn, FlawIndexEntry } from "@/lib/types";
import { FLAW_TYPES, HINT_UNLOCK_DELAY } from "@/lib/types";
import type { LocateTarget } from "@/lib/locate-trigger";
import { HintButton } from "@/components/shared/hint-button";
import { useSessionSocket } from "@/hooks/useSessionSocket";
import { FlawFieldGuide, FlawFieldGuideDrawer } from "@/components/annotation/flaw-field-guide";

// --- Types ---

interface LocateStageProps {
  sessionId: string;
  groupId: string;
  userId: string;
  turns: TranscriptTurn[];
  locateTargets: LocateTarget[];
  flawIndex: FlawIndexEntry[];
  existingAnnotations?: {
    id: string;
    turnId: string;
    flawType: string;
    hintLevel: number;
    userId: string;
  }[];
  existingHints?: { turnId: string; hintLevel: number; targetSection?: string }[];
}

interface FlaggedTurn {
  turnId: string;
  flawType?: string;
  hintLevel: number;
}

// Section names for presentations / stages for discussions
function getSectionLabel(turn: TranscriptTurn): string {
  return turn.section || turn.stage || "unknown";
}

// --- Component ---

export function LocateStage({
  sessionId,
  groupId,
  userId,
  turns,
  locateTargets,
  flawIndex,
  existingAnnotations = [],
  existingHints = [],
}: LocateStageProps) {
  const router = useRouter();

  // Build section groups for display
  const sectionGroups = useMemo(() => {
    const groups = new Map<string, TranscriptTurn[]>();
    for (const turn of turns) {
      const section = getSectionLabel(turn);
      const list = groups.get(section) || [];
      list.push(turn);
      groups.set(section, list);
    }
    return groups;
  }, [turns]);

  // Track which turns are flagged
  const [flaggedTurns, setFlaggedTurns] = useState<Map<string, FlaggedTurn>>(() => {
    const map = new Map<string, FlaggedTurn>();
    for (const ann of existingAnnotations) {
      map.set(ann.turnId, {
        turnId: ann.turnId,
        flawType: ann.flawType,
        hintLevel: ann.hintLevel,
      });
    }
    return map;
  });

  // Track hint state per flaw
  const [hintStates, setHintStates] = useState<Map<string, { level: number; confirmedSection?: string; revealedTurnId?: string; revealedType?: string }>>(() => {
    const map = new Map<string, { level: number; confirmedSection?: string; revealedTurnId?: string; revealedType?: string }>();
    for (const hint of existingHints) {
      // Map turnId back to flawId
      const target = locateTargets.find((t) => t.locations.includes(hint.turnId));
      if (target) {
        const existing = map.get(target.flawId) || { level: 0 };
        if (hint.hintLevel > existing.level) {
          map.set(target.flawId, {
            level: hint.hintLevel,
            confirmedSection: hint.targetSection || existing.confirmedSection,
            revealedTurnId: hint.hintLevel >= 2 ? hint.turnId : existing.revealedTurnId,
            revealedType: hint.hintLevel >= 3 ? target.flawType : existing.revealedType,
          });
        }
      }
    }
    return map;
  });

  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [hintLoading, setHintLoading] = useState(false);
  const [hintMessage, setHintMessage] = useState<{ text: string; type: "confirm" | "deny" } | null>(null);

  // How many targets have been found
  const foundCount = useMemo(() => {
    let count = 0;
    for (const target of locateTargets) {
      const isFlagged = target.locations.some((loc) => flaggedTurns.has(loc));
      if (isFlagged) count++;
    }
    return count;
  }, [locateTargets, flaggedTurns]);

  const remainingCount = locateTargets.length - foundCount;
  const allFound = remainingCount === 0;

  // Socket.IO
  const { isConnected } = useSessionSocket(sessionId, groupId, {
    onStageTransition: () => router.refresh(),
  });

  // --- Handlers ---

  const handleFlagTurn = useCallback(async (turnId: string) => {
    if (flaggedTurns.has(turnId)) {
      // Unflag
      setFlaggedTurns((prev) => {
        const next = new Map(prev);
        next.delete(turnId);
        return next;
      });
      return;
    }

    // Flag this turn
    const target = locateTargets.find((t) => t.locations.includes(turnId));
    const hintState = target ? hintStates.get(target.flawId) : undefined;

    const resolvedFlawType = hintState?.revealedType || target?.flawType || "reasoning";

    setFlaggedTurns((prev) => {
      const next = new Map(prev);
      next.set(turnId, {
        turnId,
        flawType: resolvedFlawType,
        hintLevel: hintState?.level || 0,
      });
      return next;
    });

    // Save annotation to API
    try {
      await fetch("/api/annotations/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          groupId,
          location: { item_id: turnId, start_offset: 0, end_offset: 0, highlighted_text: "" },
          flawType: resolvedFlawType,
          hintLevel: hintState?.level || 0,
          targetSection: selectedSection,
        }),
      });
    } catch {
      // Silently fail
    }
  }, [flaggedTurns, locateTargets, hintStates, sessionId, groupId, selectedSection]);

  const handleSectionTap = useCallback((section: string) => {
    setSelectedSection(section);
    setHintMessage(null);
  }, []);

  const handleRequestHint = useCallback(async () => {
    if (!selectedSection || hintLoading) return;

    setHintLoading(true);
    try {
      // Find a locate target turn in the selected section
      const sectionTurns = sectionGroups.get(selectedSection) || [];
      const sectionTurnIds = sectionTurns.map((t) => t.id);
      const turnId = sectionTurnIds[0] || selectedSection;

      const res = await fetch("/api/hints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          groupId,
          turnId,
          stage: "locate",
          targetSection: selectedSection,
        }),
      });

      if (res.ok) {
        const data = await res.json();

        if (data.isFreeCheck && !data.sectionHasFlaw) {
          // Section denial — free
          setHintMessage({ text: `No missed flaws in "${selectedSection}." Try another section.`, type: "deny" });
        } else if (data.sectionHasFlaw) {
          setHintMessage({ text: `There's a missed flaw in "${selectedSection}!"`, type: "confirm" });
          // Update hint state for the relevant flaw
          const target = locateTargets.find((t) =>
            t.locations.some((loc) => sectionTurnIds.includes(loc))
          );
          if (target) {
            setHintStates((prev) => {
              const next = new Map(prev);
              next.set(target.flawId, {
                ...(prev.get(target.flawId) || { level: 0 }),
                level: 1,
                confirmedSection: selectedSection,
              });
              return next;
            });
          }
        } else if (data.turnId) {
          // Hint 2: specific turn revealed
          const target = locateTargets.find((t) => t.locations.includes(data.turnId));
          if (target) {
            setHintStates((prev) => {
              const next = new Map(prev);
              next.set(target.flawId, {
                ...(prev.get(target.flawId) || { level: 0 }),
                level: 2,
                revealedTurnId: data.turnId,
              });
              return next;
            });
          }
        } else if (data.flawType) {
          // Hint 3: flaw type revealed
          const target = locateTargets.find((t) => t.flawType === data.flawType);
          if (target) {
            setHintStates((prev) => {
              const next = new Map(prev);
              next.set(target.flawId, {
                ...(prev.get(target.flawId) || { level: 0 }),
                level: 3,
                revealedType: data.flawType,
              });
              return next;
            });
          }
        }
      }
    } catch {
      // Silently fail
    }
    setHintLoading(false);
  }, [selectedSection, hintLoading, sessionId, groupId, sectionGroups, locateTargets]);

  const handleFinish = useCallback(async () => {
    try {
      await fetch(`/api/groups/${groupId}/stage`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetStage: "results" }),
      });
    } catch {
      // Fallback
    }
    router.refresh();
  }, [groupId, router]);

  // Build revealed turn IDs for visual highlighting
  const revealedTurnIds = useMemo(() => {
    const set = new Set<string>();
    for (const [, state] of hintStates) {
      if (state.revealedTurnId) set.add(state.revealedTurnId);
    }
    return set;
  }, [hintStates]);

  // Confirmed sections
  const confirmedSections = useMemo(() => {
    const set = new Set<string>();
    for (const [, state] of hintStates) {
      if (state.confirmedSection) set.add(state.confirmedSection);
    }
    return set;
  }, [hintStates]);

  // --- Render ---

  return (
    <div className="max-w-3xl mx-auto">
      {!isConnected && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2 mb-4 text-xs text-yellow-700">
          Reconnecting...
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <h2 className="text-lg font-bold text-gray-900">Locate</h2>
        <p className="text-sm text-gray-500 mt-1">
          Your group missed {locateTargets.length} flaw{locateTargets.length !== 1 ? "s" : ""} — find {locateTargets.length === 1 ? "it" : "them"} in the transcript.
        </p>
      </div>

      {/* Flaw counter */}
      <div className="flex items-center gap-4 mb-6 p-3 bg-orange-50 border border-orange-200 rounded-lg">
        <div className="text-2xl font-bold text-orange-700">{remainingCount}</div>
        <div className="text-sm text-orange-700">
          {allFound
            ? "All missed flaws found!"
            : `flaw${remainingCount !== 1 ? "s" : ""} remaining`}
        </div>
        {allFound && (
          <button
            onClick={handleFinish}
            className="ml-auto px-4 py-2 rounded-lg text-sm font-medium bg-green-600 text-white hover:bg-green-700 transition-colors"
          >
            See Results
          </button>
        )}
      </div>

      {/* Hint message */}
      {hintMessage && (
        <div className={`mb-4 p-3 rounded-lg text-sm ${
          hintMessage.type === "confirm"
            ? "bg-green-50 border border-green-200 text-green-800"
            : "bg-gray-50 border border-gray-200 text-gray-600"
        }`}>
          {hintMessage.text}
          <button
            onClick={() => setHintMessage(null)}
            className="ml-2 text-xs opacity-60 hover:opacity-100"
          >
            ×
          </button>
        </div>
      )}

      {/* Transcript with sections */}
      <div className="space-y-4 mb-6">
        {Array.from(sectionGroups.entries()).map(([section, sectionTurns]) => {
          const isConfirmed = confirmedSections.has(section);
          const isSelected = selectedSection === section;

          return (
            <div
              key={section}
              className={`border rounded-xl transition-all ${
                isSelected
                  ? "border-indigo-300 ring-2 ring-indigo-200"
                  : isConfirmed
                    ? "border-green-300 bg-green-50/30"
                    : "border-gray-200"
              }`}
            >
              {/* Section header — tappable for hint targeting */}
              <button
                onClick={() => handleSectionTap(section)}
                className={`w-full text-left px-4 py-2 text-xs font-medium uppercase tracking-wide rounded-t-xl transition-colors ${
                  isSelected
                    ? "bg-indigo-50 text-indigo-700"
                    : isConfirmed
                      ? "bg-green-50 text-green-700"
                      : "bg-gray-50 text-gray-500 hover:bg-gray-100"
                }`}
              >
                {section}
                {isConfirmed && <span className="ml-2 text-green-500">⚑</span>}
              </button>

              {/* Turns in this section */}
              <div className="divide-y divide-gray-100">
                {sectionTurns.map((turn) => {
                  const isFlagged = flaggedTurns.has(turn.id);
                  const isRevealed = revealedTurnIds.has(turn.id);
                  const hintState = (() => {
                    for (const [, s] of hintStates) {
                      if (s.revealedTurnId === turn.id) return s;
                    }
                    return null;
                  })();

                  return (
                    <div
                      key={turn.id}
                      onClick={() => handleFlagTurn(turn.id)}
                      className={`px-4 py-3 cursor-pointer transition-all ${
                        isFlagged
                          ? "bg-red-50 border-l-4 border-l-red-400"
                          : isRevealed
                            ? "bg-yellow-50 border-l-4 border-l-yellow-400 animate-pulse"
                            : "hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold text-gray-700">{turn.speaker}</span>
                        {turn.role && <span className="text-xs text-gray-400">{turn.role}</span>}
                        {isFlagged && (
                          <span className="text-xs font-medium text-red-600 ml-auto">
                            ⚑ Flagged
                            {hintState?.revealedType && (
                              <span className={`ml-1 px-1.5 py-0.5 rounded text-[10px] ${
                                FLAW_TYPES[hintState.revealedType as FlawType]?.bgColor || "bg-gray-100"
                              } ${FLAW_TYPES[hintState.revealedType as FlawType]?.color || "text-gray-700"}`}>
                                {FLAW_TYPES[hintState.revealedType as FlawType]?.label || hintState.revealedType}
                              </span>
                            )}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-800 leading-relaxed">{turn.content}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom bar: hint button + finish */}
      <div className="sticky bottom-0 bg-white/90 backdrop-blur-sm border-t border-gray-200 py-3 flex items-center justify-between -mx-4 px-4">
        <div className="text-xs text-gray-400">
          Tap a section, then use &quot;Narrow it down&quot; to check for flaws
        </div>

        <div className="flex items-center gap-3">
          <HintButton
            hintsRemaining={3}
            unlockDelay={HINT_UNLOCK_DELAY.locate}
            onRequestHint={handleRequestHint}
            loading={hintLoading}
            exhausted={allFound}
            resetKey={selectedSection || "none"}
          />

          {!allFound && (
            <button
              onClick={handleFinish}
              className="px-3 py-2 rounded-lg text-xs text-gray-500 hover:text-gray-700"
            >
              Skip to Results
            </button>
          )}
        </div>
      </div>

      {/* Flaw Field Guide */}
      <div className="hidden lg:block fixed top-24 right-4 w-64 z-10">
        <FlawFieldGuide />
      </div>
      <FlawFieldGuideDrawer />

      {/* Flagged turns sidebar */}
      {flaggedTurns.size > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-100">
          <p className="text-xs font-medium text-gray-500 mb-2">
            Flagged turns ({flaggedTurns.size}):
          </p>
          <div className="flex flex-wrap gap-2">
            {Array.from(flaggedTurns.values()).map((flag) => {
              const turn = turns.find((t) => t.id === flag.turnId);
              return (
                <span
                  key={flag.turnId}
                  className="text-xs px-2 py-1 rounded bg-red-50 text-red-700 border border-red-200"
                >
                  {turn?.speaker || flag.turnId}
                  {flag.hintLevel > 0 && <span className="ml-1 opacity-50">💡×{flag.hintLevel}</span>}
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
