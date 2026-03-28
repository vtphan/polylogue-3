"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { WRITE_THEN_REVEAL_MS } from "@/lib/types";

interface ExplanationEntry {
  id: string;
  authorId: string;
  authorName: string;
  text: string;
  revisionOf?: string;
  createdAt: string;
}

interface CollaborativeEditorProps {
  sessionId: string;
  groupId: string;
  turnId: string;
  userId: string;
  /** Template text (from Hint 2) — replaces the open text area */
  template?: string;
  /** Existing explanations for this turn (loaded from API) */
  existingExplanations?: ExplanationEntry[];
  /** Callback when an explanation is submitted */
  onSubmit?: (text: string) => void;
  /** Whether the write-then-reveal period has been triggered externally */
  revealTriggered?: boolean;
  /** Callback when reveal timer ends */
  onReveal?: () => void;
}

// Author colors for attribution
const AUTHOR_COLORS = [
  "border-l-blue-400 bg-blue-50",
  "border-l-emerald-400 bg-emerald-50",
  "border-l-purple-400 bg-purple-50",
  "border-l-orange-400 bg-orange-50",
  "border-l-pink-400 bg-pink-50",
  "border-l-cyan-400 bg-cyan-50",
];

function getAuthorColor(authorId: string, allAuthorIds: string[]): string {
  const index = allAuthorIds.indexOf(authorId);
  return AUTHOR_COLORS[index % AUTHOR_COLORS.length];
}

export function CollaborativeEditor({
  sessionId,
  groupId,
  turnId,
  userId,
  template,
  existingExplanations = [],
  onSubmit,
  revealTriggered = false,
  onReveal,
}: CollaborativeEditorProps) {
  const [text, setText] = useState(template || "");
  const [submitted, setSubmitted] = useState(false);
  const [revealed, setRevealed] = useState(revealTriggered || existingExplanations.length > 0);
  const [explanations, setExplanations] = useState<ExplanationEntry[]>(existingExplanations);
  const [countdown, setCountdown] = useState(Math.ceil(WRITE_THEN_REVEAL_MS / 1000));
  const [isEditing, setIsEditing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Reset state when turn changes
  useEffect(() => {
    setSubmitted(false);
    setRevealed(revealTriggered || existingExplanations.length > 0);
    setCountdown(Math.ceil(WRITE_THEN_REVEAL_MS / 1000));
    setExplanations(existingExplanations);
    setText(template || "");
    setIsEditing(false);
  }, [turnId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Check if this user already has an explanation for this turn
  const userExplanation = explanations.find((e) => e.authorId === userId && !e.revisionOf);
  const hasSubmitted = submitted || !!userExplanation;

  // Write-then-reveal countdown
  useEffect(() => {
    if (revealed) return;

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setRevealed(true);
          onReveal?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [revealed, onReveal]);

  // Also reveal when external trigger fires
  useEffect(() => {
    if (revealTriggered && !revealed) {
      setRevealed(true);
    }
  }, [revealTriggered, revealed]);

  // Add new explanations from Socket.IO events
  const addExplanation = useCallback((entry: ExplanationEntry) => {
    setExplanations((prev) => {
      if (prev.some((e) => e.id === entry.id)) return prev;
      return [...prev, entry];
    });
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!text.trim() || submitted) return;

    setSubmitted(true);
    onSubmit?.(text.trim());

    try {
      const res = await fetch("/api/explanations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          groupId,
          turnId,
          text: text.trim(),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        addExplanation({
          id: data.id,
          authorId: userId,
          authorName: "You",
          text: text.trim(),
          createdAt: data.createdAt,
        });
      }
    } catch {
      setSubmitted(false);
    }
  }, [text, submitted, sessionId, groupId, turnId, userId, onSubmit, addExplanation]);

  const handleRevise = useCallback(async () => {
    if (!text.trim() || !userExplanation) return;

    try {
      const res = await fetch("/api/explanations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          groupId,
          turnId,
          text: text.trim(),
          revisionOf: userExplanation.id,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        addExplanation({
          id: data.id,
          authorId: userId,
          authorName: "You",
          text: text.trim(),
          revisionOf: userExplanation.id,
          createdAt: data.createdAt,
        });
        setIsEditing(false);
      }
    } catch {
      // Silently fail
    }
  }, [text, userExplanation, sessionId, groupId, turnId, userId, addExplanation]);

  // Collect unique author IDs for color assignment
  const authorIds = [...new Set(explanations.map((e) => e.authorId))];

  // Separate originals from revisions
  const originals = explanations.filter((e) => !e.revisionOf);
  const revisions = explanations.filter((e) => e.revisionOf);

  // Get the latest version per author
  const latestByAuthor = new Map<string, ExplanationEntry>();
  for (const e of originals) {
    latestByAuthor.set(e.authorId, e);
  }
  for (const r of revisions) {
    latestByAuthor.set(r.authorId, r);
  }

  return (
    <div className="space-y-3">
      {/* Writing area — shown when not yet submitted */}
      {!hasSubmitted && !isEditing && (
        <div>
          <p className="text-xs font-medium text-gray-500 mb-1">
            Write your explanation:
          </p>
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={template || "Why is this turn flawed? Explain your reasoning..."}
            className="w-full border border-gray-300 rounded-lg p-3 text-sm resize-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 outline-none"
            rows={3}
          />
          <div className="flex items-center justify-between mt-2">
            {!revealed && (
              <span className="text-xs text-gray-400">
                Others&apos; explanations will appear in {countdown}s
              </span>
            )}
            <button
              onClick={handleSubmit}
              disabled={!text.trim()}
              className="px-4 py-1.5 rounded-lg text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors ml-auto"
            >
              Submit
            </button>
          </div>
        </div>
      )}

      {/* After submission — show own explanation with edit option */}
      {hasSubmitted && !isEditing && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-green-700">Your explanation submitted</span>
            {revealed && (
              <button
                onClick={() => {
                  setText(latestByAuthor.get(userId)?.text || text);
                  setIsEditing(true);
                }}
                className="text-xs text-green-600 hover:text-green-800"
              >
                Revise
              </button>
            )}
          </div>
          <p className="text-sm text-green-800 mt-1">
            {latestByAuthor.get(userId)?.text || text}
          </p>
        </div>
      )}

      {/* Revision editor */}
      {isEditing && (
        <div>
          <p className="text-xs font-medium text-gray-500 mb-1">Revise your explanation:</p>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full border border-gray-300 rounded-lg p-3 text-sm resize-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 outline-none"
            rows={3}
          />
          <div className="flex gap-2 mt-2 justify-end">
            <button
              onClick={() => setIsEditing(false)}
              className="px-3 py-1.5 rounded-lg text-sm text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
            <button
              onClick={handleRevise}
              disabled={!text.trim()}
              className="px-4 py-1.5 rounded-lg text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40 transition-colors"
            >
              Update
            </button>
          </div>
        </div>
      )}

      {/* Revealed explanations from all group members */}
      {revealed && originals.length > 0 && (
        <div>
          <p className="text-xs font-medium text-gray-500 mb-2">
            Group explanations ({originals.length}):
          </p>
          <div className="space-y-2">
            {Array.from(latestByAuthor.values()).map((entry) => {
              const isOwn = entry.authorId === userId;
              if (isOwn) return null; // Already shown above
              const colorClass = getAuthorColor(entry.authorId, authorIds);

              return (
                <div
                  key={entry.id}
                  className={`border-l-4 rounded-r-lg p-3 ${colorClass}`}
                >
                  <span className="text-xs font-semibold text-gray-600">
                    {entry.authorName}
                  </span>
                  <p className="text-sm text-gray-800 mt-0.5">{entry.text}</p>
                  {entry.revisionOf && (
                    <span className="text-[10px] text-gray-400 italic">revised</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Pre-reveal: show that others are writing */}
      {!revealed && hasSubmitted && (
        <div className="text-xs text-gray-400 italic text-center py-2">
          Waiting for others to submit... ({countdown}s)
        </div>
      )}
    </div>
  );
}
