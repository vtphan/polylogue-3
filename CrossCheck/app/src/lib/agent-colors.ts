/**
 * Generate a consistent color for an agent based on their agent_id.
 * Returns a Tailwind-compatible color class set.
 */

const AGENT_PALETTES = [
  { bg: "bg-rose-100", text: "text-rose-700", border: "border-rose-200", avatar: "bg-rose-500" },
  { bg: "bg-sky-100", text: "text-sky-700", border: "border-sky-200", avatar: "bg-sky-500" },
  { bg: "bg-amber-100", text: "text-amber-700", border: "border-amber-200", avatar: "bg-amber-500" },
  { bg: "bg-emerald-100", text: "text-emerald-700", border: "border-emerald-200", avatar: "bg-emerald-500" },
  { bg: "bg-violet-100", text: "text-violet-700", border: "border-violet-200", avatar: "bg-violet-500" },
  { bg: "bg-orange-100", text: "text-orange-700", border: "border-orange-200", avatar: "bg-orange-500" },
  { bg: "bg-teal-100", text: "text-teal-700", border: "border-teal-200", avatar: "bg-teal-500" },
  { bg: "bg-pink-100", text: "text-pink-700", border: "border-pink-200", avatar: "bg-pink-500" },
];

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function getAgentColor(agentId: string) {
  return AGENT_PALETTES[hashString(agentId) % AGENT_PALETTES.length];
}

export function getAgentInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}
