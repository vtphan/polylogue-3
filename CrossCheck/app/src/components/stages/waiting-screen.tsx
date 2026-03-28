"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSessionSocket } from "@/hooks/useSessionSocket";

interface WaitingScreenProps {
  sessionId: string;
  groupId: string;
  stats: {
    totalTurns: number;
    correct: number;
    hintsUsed: number;
  };
}

export function WaitingScreen({ sessionId, groupId, stats }: WaitingScreenProps) {
  const router = useRouter();

  const { isConnected } = useSessionSocket(sessionId, groupId, {
    onStageTransition: () => {
      // Stage changed — refresh to load the new stage component
      router.refresh();
    },
  });

  // Also poll as a fallback in case Socket.IO event is missed
  useEffect(() => {
    const interval = setInterval(() => {
      router.refresh();
    }, 10_000); // every 10 seconds
    return () => clearInterval(interval);
  }, [router]);

  return (
    <div className="max-w-md mx-auto mt-12 text-center">
      <div className="bg-green-50 border border-green-200 rounded-xl p-8">
        <div className="text-4xl mb-4">✓</div>
        <h2 className="text-lg font-bold text-green-900 mb-2">Nice work!</h2>
        <p className="text-sm text-green-700 mb-4">
          Waiting for your group to finish...
        </p>

        <div className="bg-white rounded-lg p-4 text-left space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Turns completed</span>
            <span className="font-medium text-gray-900">{stats.totalTurns}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Correct</span>
            <span className="font-medium text-green-700">{stats.correct}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Strategic support used</span>
            <span className="font-medium text-indigo-700">{stats.hintsUsed}</span>
          </div>
        </div>

        {!isConnected && (
          <p className="text-xs text-yellow-600 mt-3">Reconnecting...</p>
        )}
      </div>
    </div>
  );
}
