"use client";

import type { Annotation, FlawType } from "@/lib/types";
import { FLAW_TYPES } from "@/lib/types";

interface FlawPaletteProps {
  annotations: Annotation[];
  onAnnotationClick: (annotation: Annotation) => void;
  onAnnotationDelete: (annotationId: string) => void;
  onConfirm?: (annotationId: string, action: "confirm" | "unconfirm") => void;
  sessionPhase?: string;
  userId?: string;
}

export function FlawPalette({
  annotations,
  onAnnotationClick,
  onAnnotationDelete,
  onConfirm,
  sessionPhase,
  userId,
}: FlawPaletteProps) {
  const isGroupPhase = sessionPhase === "group";
  const countByType = (Object.keys(FLAW_TYPES) as FlawType[]).reduce(
    (acc, type) => {
      acc[type] = annotations.filter((a) => a.flawType === type).length;
      return acc;
    },
    {} as Record<FlawType, number>
  );

  const groupAnswerCount = annotations.filter((a) => a.isGroupAnswer).length;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h3 className="font-semibold text-gray-900 text-sm mb-3">Flaw Types</h3>

      {/* Flaw type legend with counts */}
      <div className="space-y-2.5 mb-4">
        {(Object.keys(FLAW_TYPES) as FlawType[]).map((type) => {
          const info = FLAW_TYPES[type];
          return (
            <div key={type}>
              <div className="flex items-center justify-between">
                <span className={`text-xs font-medium px-2 py-0.5 rounded ${info.bgColor} ${info.color}`}>
                  {info.label}
                </span>
                <span className="text-xs text-gray-500 font-mono">
                  {countByType[type]}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5 leading-snug">
                {info.description}
              </p>
            </div>
          );
        })}
      </div>

      {/* Group phase hint */}
      {isGroupPhase && onConfirm && (
        <div className="bg-yellow-50 border border-yellow-200 rounded p-2 mb-3">
          <p className="text-xs text-yellow-700">
            <strong>Group phase:</strong> Confirm annotations your group agrees on.
            {groupAnswerCount > 0 && ` ${groupAnswerCount} confirmed.`}
          </p>
        </div>
      )}

      {/* Annotation list */}
      {annotations.length > 0 && (
        <div className="border-t border-gray-100 pt-3 mt-3">
          <h4 className="text-xs font-medium text-gray-500 mb-2">
            Annotations ({annotations.length})
          </h4>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {annotations.map((ann) => {
              const info = FLAW_TYPES[ann.flawType];
              const confirmed = ann.confirmedBy || [];
              const iConfirmed = userId ? confirmed.includes(userId) : false;

              return (
                <div
                  key={ann.id}
                  className={`group text-xs p-2 rounded cursor-pointer transition-colors ${
                    ann.isGroupAnswer
                      ? "bg-green-50 border border-green-200"
                      : "hover:bg-gray-50"
                  }`}
                  onClick={() => onAnnotationClick(ann)}
                >
                  <div className="flex items-start gap-2">
                    <span className={`shrink-0 mt-0.5 w-2 h-2 rounded-full ${info.bgColor} ring-1 ring-current ${info.color}`} />
                    <span className="text-gray-600 line-clamp-2 flex-1">
                      &ldquo;{ann.location.highlighted_text}&rdquo;
                    </span>
                    {!isGroupPhase && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onAnnotationDelete(ann.id);
                        }}
                        className="shrink-0 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity"
                        title="Remove annotation"
                      >
                        &times;
                      </button>
                    )}
                  </div>

                  {/* Consensus buttons in group phase */}
                  {isGroupPhase && onConfirm && (
                    <div className="flex items-center gap-2 mt-1.5 ml-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onConfirm(ann.id, iConfirmed ? "unconfirm" : "confirm");
                        }}
                        className={`text-xs px-2 py-0.5 rounded transition-colors ${
                          iConfirmed
                            ? "bg-green-100 text-green-700 font-medium"
                            : "bg-gray-100 text-gray-500 hover:bg-green-50 hover:text-green-600"
                        }`}
                      >
                        {iConfirmed ? "Confirmed" : "Confirm"}
                      </button>
                      <span className="text-xs text-gray-400">
                        {confirmed.length} vote{confirmed.length !== 1 ? "s" : ""}
                      </span>
                      {ann.isGroupAnswer && (
                        <span className="text-xs text-green-600 font-medium">Group answer</span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {annotations.length === 0 && (
        <p className="text-xs text-gray-400 italic mt-2">
          Select text in the transcript and tag it with a flaw type.
        </p>
      )}
    </div>
  );
}
