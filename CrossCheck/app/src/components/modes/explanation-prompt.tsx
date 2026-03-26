"use client";

import { useState } from "react";
import type { FlawType } from "@/lib/types";
import { FLAW_TYPES } from "@/lib/types";

interface ExplanationPromptProps {
  flawType: FlawType;
  format: "guided" | "free_text";
  onSubmit: (explanation: string, severity?: "minor" | "moderate" | "major") => void;
  onCancel: () => void;
}

const SEVERITY_OPTIONS: { value: "minor" | "moderate" | "major"; label: string; desc: string }[] = [
  { value: "minor", label: "Minor", desc: "Small issue, doesn't derail the argument" },
  { value: "moderate", label: "Moderate", desc: "Weakens the argument noticeably" },
  { value: "major", label: "Major", desc: "Fundamentally undermines the point" },
];

export function ExplanationPrompt({ flawType, format, onSubmit, onCancel }: ExplanationPromptProps) {
  const [explanation, setExplanation] = useState("");
  const [severity, setSeverity] = useState<"minor" | "moderate" | "major">("moderate");
  const info = FLAW_TYPES[flawType];

  const canSubmit = explanation.trim().length > 0;

  function handleSubmit() {
    if (!canSubmit) return;
    onSubmit(explanation.trim(), severity);
  }

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/20" onClick={onCancel} />
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[min(28rem,90vw)] bg-white border border-gray-200 rounded-lg shadow-xl p-5">
        <button
          onClick={onCancel}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 text-lg leading-none"
        >
          &times;
        </button>

        <div className="mb-3">
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${info.bgColor} ${info.color}`}>
            {info.label}
          </span>
        </div>

        {/* Explanation */}
        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-600 mb-1.5">
            Why is this a flaw?
          </label>
          {format === "guided" ? (
            <div className="flex items-start gap-1.5">
              <span className="text-sm text-gray-500 mt-1.5 shrink-0">
                This is a {info.label.toLowerCase()} flaw because
              </span>
              <textarea
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
                placeholder="..."
                rows={2}
                className="flex-1 border border-gray-300 rounded-md px-2 py-1.5 text-sm resize-none focus:outline-none focus:border-blue-400"
                autoFocus
              />
            </div>
          ) : (
            <textarea
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              placeholder="Explain why you think this is a problem..."
              rows={3}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm resize-none focus:outline-none focus:border-blue-400"
              autoFocus
            />
          )}
        </div>

        {/* Severity */}
        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-600 mb-1.5">
            How serious is this?
          </label>
          <div className="flex gap-2">
            {SEVERITY_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setSeverity(opt.value)}
                className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                  severity === opt.value
                    ? "border-blue-400 bg-blue-50 text-blue-800 font-medium"
                    : "border-gray-200 text-gray-500 hover:border-gray-300"
                }`}
                title={opt.desc}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="text-xs px-3 py-1.5 rounded border border-gray-200 text-gray-500 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="text-xs px-4 py-1.5 rounded bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save
          </button>
        </div>
      </div>
    </>
  );
}
