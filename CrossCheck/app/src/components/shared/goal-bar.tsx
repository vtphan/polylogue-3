"use client";

interface GoalBarProps {
  current: number;
  threshold: number;
  label?: string;
}

export function GoalBar({ current, threshold, label }: GoalBarProps) {
  const reached = current >= threshold;
  const pct = threshold > 0 ? Math.min(100, (current / threshold) * 100) : 0;

  return (
    <div className={`rounded-xl px-4 py-3 transition-all ${reached ? "ring-2 ring-green-400 ring-opacity-75 bg-green-50" : "bg-white border border-gray-200"}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-600">
          {reached ? "🎯 " : ""}{label || "Goal"}
        </span>
        <span className={`text-sm font-bold tabular-nums ${reached ? "text-green-700" : "text-gray-700"}`}>
          {current} / {threshold}
        </span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-3">
        <div
          className={`h-3 rounded-full transition-all duration-500 ${
            reached ? "bg-green-500" : "bg-indigo-400"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
