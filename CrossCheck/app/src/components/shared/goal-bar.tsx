"use client";

import { useState, useEffect } from "react";

interface GoalBarProps {
  current: number;
  threshold: number;
  label?: string;
}

export function GoalBar({ current, threshold, label }: GoalBarProps) {
  const [prevCurrent, setPrevCurrent] = useState(current);
  const [celebrating, setCelebrating] = useState(false);

  const reached = current >= threshold;
  const pct = threshold > 0 ? Math.min(100, (current / threshold) * 100) : 0;

  // Celebrate when threshold is first reached
  useEffect(() => {
    if (current >= threshold && prevCurrent < threshold) {
      setCelebrating(true);
      const timer = setTimeout(() => setCelebrating(false), 1500);
      return () => clearTimeout(timer);
    }
    setPrevCurrent(current);
  }, [current, threshold, prevCurrent]);

  return (
    <div className={`rounded-lg px-3 py-2 transition-all ${celebrating ? "ring-2 ring-green-400 ring-opacity-75" : ""}`}>
      {label && (
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-gray-500">{label}</span>
          <span className={`text-xs font-medium ${reached ? "text-green-700" : "text-gray-600"}`}>
            {current} / {threshold}
          </span>
        </div>
      )}
      {!label && (
        <div className="flex justify-end mb-1">
          <span className={`text-xs font-medium ${reached ? "text-green-700" : "text-gray-600"}`}>
            {current} / {threshold}
          </span>
        </div>
      )}
      <div className="w-full bg-gray-100 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all duration-500 ${
            reached ? "bg-green-500" : "bg-indigo-400"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
