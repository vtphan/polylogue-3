"use client";

import { useState } from "react";
import { MethodologyTab } from "./methodology-tab";
import { FlawTypesTab } from "./flaw-types-tab";

type Tab = "methodology" | "flaw-types";

const TABS: { key: Tab; label: string }[] = [
  { key: "methodology", label: "Methodology" },
  { key: "flaw-types", label: "Flaw Types" },
];

export default function TeacherGuidePage() {
  const [activeTab, setActiveTab] = useState<Tab>("methodology");

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Teacher Guide</h1>
      <p className="text-sm text-gray-500 mb-6">
        Reference materials for using CrossCheck effectively in your classroom.
      </p>

      {/* Tab bar */}
      <div className="flex border-b border-gray-200 mb-6">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? "border-blue-600 text-blue-700"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "methodology" && <MethodologyTab />}
      {activeTab === "flaw-types" && <FlawTypesTab />}
    </div>
  );
}
