"use client";

import { useState, useEffect } from "react";
import type { FlawType } from "@/lib/types";
import { FLAW_TYPES } from "@/lib/types";
import { LEARN_EXAMPLES } from "@/lib/learn-mode-content";

interface LearnModeProps {
  groupId: string;
  sessionId: string;
}

interface LearnState {
  phase: "definitions" | "quiz" | "complete";
  currentQuestion: number;
  score: number;
}

function getStorageKey(sessionId: string, groupId: string) {
  return `crosscheck:learn:${sessionId}:${groupId}`;
}

function loadState(storageKey: string): LearnState | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(storageKey);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && "phase" in parsed) return parsed as LearnState;
    // Legacy format: just a score string from completed quiz
    const score = parseInt(raw, 10);
    if (!isNaN(score)) return { phase: "complete", currentQuestion: 0, score };
  } catch { /* ignore parse errors */ }
  return null;
}

function saveState(storageKey: string, state: LearnState) {
  localStorage.setItem(storageKey, JSON.stringify(state));
}

export function LearnMode({ groupId, sessionId }: LearnModeProps) {
  const storageKey = getStorageKey(sessionId, groupId);
  const savedState = loadState(storageKey);

  const [phase, setPhase] = useState<"definitions" | "quiz" | "complete">(savedState?.phase ?? "definitions");
  const [currentQuestion, setCurrentQuestion] = useState(savedState?.currentQuestion ?? 0);
  const [selectedAnswer, setSelectedAnswer] = useState<FlawType | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [score, setScore] = useState(savedState?.score ?? 0);

  const flawTypes = Object.entries(FLAW_TYPES) as [FlawType, typeof FLAW_TYPES[FlawType]][];
  const questions = LEARN_EXAMPLES;
  const current = questions[currentQuestion];

  function handleAnswer(type: FlawType) {
    if (showFeedback) return;
    setSelectedAnswer(type);
    setShowFeedback(true);
    if (type === current.flawType) {
      setScore((s) => s + 1);
    }
  }

  // Persist state to localStorage on every meaningful change
  useEffect(() => {
    saveState(storageKey, { phase, currentQuestion, score });
  }, [storageKey, phase, currentQuestion, score]);

  function handleNext() {
    if (currentQuestion + 1 >= questions.length) {
      setPhase("complete");
    } else {
      setCurrentQuestion((q) => q + 1);
      setSelectedAnswer(null);
      setShowFeedback(false);
    }
  }

  // --- Definitions Phase ---
  if (phase === "definitions") {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center mb-8">
          <h2 className="text-lg font-bold text-gray-900">Learn the 4 Flaw Types</h2>
          <p className="text-sm text-gray-500 mt-1">
            Read each definition and example before starting the quiz.
          </p>
        </div>

        <div className="grid gap-4">
          {flawTypes.map(([type, info]) => (
            <div key={type} className={`rounded-lg border p-4 ${info.bgColor}`}>
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-sm font-bold ${info.color}`}>{info.label}</span>
              </div>
              <p className="text-sm text-gray-800">{info.description}</p>
              <div className="mt-3 bg-white/70 rounded p-3">
                <p className="text-xs font-medium text-gray-500 mb-1">Example:</p>
                <p className="text-sm text-gray-700 italic">
                  &ldquo;{LEARN_EXAMPLES.find((e) => e.flawType === type)?.passage}&rdquo;
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center pt-4">
          <button
            onClick={() => setPhase("quiz")}
            className="bg-blue-600 text-white text-sm font-medium px-8 py-2.5 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Start Quiz
          </button>
        </div>
      </div>
    );
  }

  // --- Complete Phase ---
  if (phase === "complete") {
    return (
      <div className="max-w-md mx-auto text-center py-12">
        <h2 className="text-lg font-bold text-gray-900 mb-2">Quiz Complete!</h2>
        <p className="text-sm text-gray-600 mb-6">
          You got <span className="font-bold text-blue-700">{score}</span> out of{" "}
          <span className="font-bold">{questions.length}</span> correct.
        </p>
        {score < questions.length * 0.75 && (
          <button
            onClick={() => {
              setPhase("definitions");
              setCurrentQuestion(0);
              setSelectedAnswer(null);
              setShowFeedback(false);
              setScore(0);
              // Effect will save the reset state
            }}
            className="text-sm text-blue-600 hover:text-blue-800 underline"
          >
            Review definitions and try again
          </button>
        )}
        {score >= questions.length * 0.75 && (
          <p className="text-sm text-green-700 font-medium">
            Great job! You&apos;re ready for the next level.
          </p>
        )}
      </div>
    );
  }

  // --- Quiz Phase ---
  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress */}
      <div className="flex items-center justify-between mb-6">
        <span className="text-xs text-gray-500">
          Question {currentQuestion + 1} of {questions.length}
        </span>
        <span className="text-xs text-gray-500">Score: {score}</span>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-100 rounded-full h-1.5 mb-8">
        <div
          className="bg-blue-500 h-1.5 rounded-full transition-all"
          style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
        />
      </div>

      {/* Passage */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-5 mb-6">
        <p className="text-sm text-gray-800 leading-relaxed italic">
          &ldquo;{current.passage}&rdquo;
        </p>
      </div>

      {/* Question */}
      <p className="text-sm font-medium text-gray-700 mb-3">
        What type of flaw is this?
      </p>

      {/* Answer buttons */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {flawTypes.map(([type, info]) => {
          let buttonStyle = "border-gray-200 text-gray-700 hover:border-gray-400";
          if (showFeedback) {
            if (type === current.flawType) {
              buttonStyle = "border-green-500 bg-green-50 text-green-800 ring-2 ring-green-200";
            } else if (type === selectedAnswer) {
              buttonStyle = "border-red-400 bg-red-50 text-red-700";
            } else {
              buttonStyle = "border-gray-200 text-gray-400";
            }
          } else if (type === selectedAnswer) {
            buttonStyle = "border-blue-400 bg-blue-50 text-blue-800";
          }

          return (
            <button
              key={type}
              onClick={() => handleAnswer(type)}
              disabled={showFeedback}
              className={`text-sm font-medium px-4 py-3 rounded-lg border transition-all ${buttonStyle}`}
            >
              {info.label}
            </button>
          );
        })}
      </div>

      {/* Feedback */}
      {showFeedback && (
        <div
          className={`rounded-lg p-4 mb-6 ${
            selectedAnswer === current.flawType
              ? "bg-green-50 border border-green-200"
              : "bg-amber-50 border border-amber-200"
          }`}
        >
          <p className="text-sm font-medium mb-1">
            {selectedAnswer === current.flawType ? "Correct!" : `Not quite — this is a ${FLAW_TYPES[current.flawType].label} flaw.`}
          </p>
          <p className="text-sm text-gray-700">{current.explanation}</p>
        </div>
      )}

      {/* Next button */}
      {showFeedback && (
        <div className="text-center">
          <button
            onClick={handleNext}
            className="bg-blue-600 text-white text-sm font-medium px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            {currentQuestion + 1 >= questions.length ? "See Results" : "Next"}
          </button>
        </div>
      )}
    </div>
  );
}
