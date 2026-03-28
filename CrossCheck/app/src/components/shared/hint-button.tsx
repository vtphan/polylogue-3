"use client";

import { useState, useEffect, useCallback } from "react";

interface HintButtonProps {
  /** Hints remaining for this turn/flaw */
  hintsRemaining: number;
  /** Try-first delay in milliseconds */
  unlockDelay: number;
  /** Called when student requests a hint */
  onRequestHint: () => void;
  /** Whether a hint request is in progress */
  loading?: boolean;
  /** Whether all hints have been exhausted */
  exhausted?: boolean;
  /** Reset the timer (e.g., when turn changes) */
  resetKey?: string | number;
}

export function HintButton({
  hintsRemaining,
  unlockDelay,
  onRequestHint,
  loading = false,
  exhausted = false,
  resetKey,
}: HintButtonProps) {
  const [unlocked, setUnlocked] = useState(false);
  const [countdown, setCountdown] = useState(Math.ceil(unlockDelay / 1000));

  // Reset timer when resetKey changes (new turn)
  useEffect(() => {
    setUnlocked(false);
    setCountdown(Math.ceil(unlockDelay / 1000));

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setUnlocked(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [unlockDelay, resetKey]);

  const handleClick = useCallback(() => {
    if (!unlocked || loading || exhausted) return;
    onRequestHint();
  }, [unlocked, loading, exhausted, onRequestHint]);

  if (exhausted) {
    return (
      <button
        disabled
        className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-400 cursor-not-allowed"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        No more hints
      </button>
    );
  }

  if (!unlocked) {
    return (
      <button
        disabled
        className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-400 cursor-not-allowed"
      >
        <div className="relative w-4 h-4">
          <svg className="w-4 h-4 -rotate-90" viewBox="0 0 20 20">
            <circle
              cx="10" cy="10" r="8"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              opacity="0.2"
            />
            <circle
              cx="10" cy="10" r="8"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeDasharray={50.27}
              strokeDashoffset={50.27 * (countdown / Math.ceil(unlockDelay / 1000))}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-linear"
            />
          </svg>
        </div>
        Narrow it down ({countdown}s)
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 hover:border-indigo-300 transition-colors animate-pulse-once"
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      {loading ? "..." : `Narrow it down (${hintsRemaining})`}
    </button>
  );
}
