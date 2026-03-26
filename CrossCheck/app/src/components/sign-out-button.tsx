"use client";

import { signOut } from "next-auth/react";

export function SignOutButton() {
  return (
    <button
      onClick={() => {
        // Clear CrossCheck localStorage (quiz state, etc.) so next student on
        // the same device doesn't see stale data — important for shared tablets.
        for (const key of Object.keys(localStorage)) {
          if (key.startsWith("crosscheck:")) {
            localStorage.removeItem(key);
          }
        }
        signOut({ callbackUrl: "/auth/login" });
      }}
      className="text-sm text-gray-500 hover:text-gray-700"
    >
      Sign out
    </button>
  );
}
