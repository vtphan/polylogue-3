"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";

interface AvailableScenario {
  scenarioId: string;
  topic: string;
  type: string;
  agentCount: number;
}

export function IngestPanel() {
  const router = useRouter();
  const [registryPath, setRegistryPath] = useState("");
  const [currentPath, setCurrentPath] = useState("");
  const [available, setAvailable] = useState<AvailableScenario[]>([]);
  const [scanned, setScanned] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [ingesting, setIngesting] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleScan = useCallback(async () => {
    setScanning(true);
    setError("");
    setSuccess("");

    const params = registryPath.trim() ? `?registryPath=${encodeURIComponent(registryPath.trim())}` : "";
    const res = await fetch(`/api/activities/ingest${params}`);

    if (res.ok) {
      const data = await res.json();
      setAvailable(data.available || []);
      setCurrentPath(data.registryPath || "");
      setScanned(true);
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Failed to scan registry");
    }

    setScanning(false);
  }, [registryPath]);

  async function handleIngest(scenarioId: string) {
    setIngesting(scenarioId);
    setError("");
    setSuccess("");

    const res = await fetch("/api/activities/ingest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        scenarioId,
        registryPath: registryPath.trim() || undefined,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      setSuccess(`Ingested: ${data.topic}`);
      setAvailable((prev) => prev.filter((s) => s.scenarioId !== scenarioId));
      router.refresh();
    } else {
      const data = await res.json();
      setError(data.error || "Ingest failed");
    }

    setIngesting(null);
  }

  return (
    <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-6">
      <h3 className="text-sm font-medium text-indigo-800 mb-3">Ingest from Registry</h3>

      {/* Registry path input + scan button */}
      <div className="flex gap-2 mb-3">
        <input
          type="text"
          value={registryPath}
          onChange={(e) => { setRegistryPath(e.target.value); setScanned(false); }}
          placeholder="Registry folder path (leave empty for default)"
          className="flex-1 border border-indigo-200 bg-white rounded-md px-3 py-1.5 text-sm placeholder:text-gray-400"
        />
        <button
          onClick={handleScan}
          disabled={scanning}
          className="text-sm font-medium px-4 py-1.5 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors whitespace-nowrap"
        >
          {scanning ? "Scanning..." : "Scan"}
        </button>
      </div>

      {currentPath && scanned && (
        <p className="text-xs text-indigo-500 mb-2 font-mono truncate" title={currentPath}>
          {currentPath}
        </p>
      )}

      {error && <p className="text-xs text-red-600 mb-2">{error}</p>}
      {success && <p className="text-xs text-green-600 mb-2">{success}</p>}

      {/* Available scenarios */}
      {scanned && available.length > 0 && (
        <div className="space-y-2">
          {available.map((s) => (
            <div
              key={s.scenarioId}
              className="flex items-center justify-between bg-white rounded-lg border border-indigo-100 px-3 py-2"
            >
              <div>
                <span className={`text-xs font-medium px-1.5 py-0.5 rounded mr-2 ${
                  s.type === "presentation" ? "bg-emerald-100 text-emerald-700" : "bg-sky-100 text-sky-700"
                }`}>
                  {s.type}
                </span>
                <span className="text-sm text-gray-800">{s.topic}</span>
                <span className="text-xs text-gray-400 ml-2">{s.agentCount} agents</span>
              </div>
              <button
                onClick={() => handleIngest(s.scenarioId)}
                disabled={ingesting !== null}
                className="text-xs font-medium px-3 py-1 rounded bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {ingesting === s.scenarioId ? "Ingesting..." : "Ingest"}
              </button>
            </div>
          ))}
        </div>
      )}

      {scanned && available.length === 0 && (
        <p className="text-xs text-indigo-600">All scenarios in this registry have been ingested.</p>
      )}

      {!scanned && (
        <p className="text-xs text-indigo-500">
          Enter the path to a registry folder and click Scan, or leave empty to use the default project registry.
        </p>
      )}
    </div>
  );
}
