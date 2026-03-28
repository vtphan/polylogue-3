"use client";

interface DisagreementPromptProps {
  /** Whether the current user is in the minority */
  isMinority: boolean;
  /** The minority type(s) */
  minorityTypes: string[];
  /** Current user's Recognize answer */
  userAnswer?: string;
}

export function DisagreementPrompt({ isMinority, minorityTypes, userAnswer }: DisagreementPromptProps) {
  if (!isMinority) return null;

  return (
    <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 mt-2">
      <p className="text-sm font-medium text-indigo-800">
        You saw this differently
      </p>
      <p className="text-xs text-indigo-600 mt-1">
        You selected <span className="font-semibold">{userAnswer}</span> while most of your group chose something else.
        Share your thinking first — what made you see it that way?
      </p>
    </div>
  );
}
