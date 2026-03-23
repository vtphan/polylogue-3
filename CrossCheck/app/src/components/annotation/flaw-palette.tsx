"use client";

import type { Annotation, FlawType } from "@/lib/types";
import { FLAW_TYPES } from "@/lib/types";

interface FlawPaletteProps {
  annotations: Annotation[];
  onAnnotationClick: (annotation: Annotation) => void;
  onAnnotationDelete: (annotationId: string) => void;
}

export function FlawPalette({
  annotations,
  onAnnotationClick,
  onAnnotationDelete,
}: FlawPaletteProps) {
  const countByType = (Object.keys(FLAW_TYPES) as FlawType[]).reduce(
    (acc, type) => {
      acc[type] = annotations.filter((a) => a.flawType === type).length;
      return acc;
    },
    {} as Record<FlawType, number>
  );

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

      {/* Annotation list */}
      {annotations.length > 0 && (
        <>
          <div className="border-t border-gray-100 pt-3 mt-3">
            <h4 className="text-xs font-medium text-gray-500 mb-2">
              Your annotations ({annotations.length})
            </h4>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {annotations.map((ann) => {
                const info = FLAW_TYPES[ann.flawType];
                return (
                  <div
                    key={ann.id}
                    className="group flex items-start gap-2 text-xs p-2 rounded hover:bg-gray-50 cursor-pointer"
                    onClick={() => onAnnotationClick(ann)}
                  >
                    <span className={`shrink-0 mt-0.5 w-2 h-2 rounded-full ${info.bgColor} ring-1 ring-current ${info.color}`} />
                    <span className="text-gray-600 line-clamp-2 flex-1">
                      &ldquo;{ann.location.highlighted_text}&rdquo;
                    </span>
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
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {annotations.length === 0 && (
        <p className="text-xs text-gray-400 italic mt-2">
          Select text in the transcript and tag it with a flaw type.
        </p>
      )}
    </div>
  );
}
