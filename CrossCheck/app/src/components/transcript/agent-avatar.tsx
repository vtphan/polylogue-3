import { getAgentColor, getAgentInitials } from "@/lib/agent-colors";

interface AgentAvatarProps {
  agentId: string;
  name: string;
  size?: "sm" | "md";
}

export function AgentAvatar({ agentId, name, size = "md" }: AgentAvatarProps) {
  const colors = getAgentColor(agentId);
  const initials = getAgentInitials(name);
  const sizeClass = size === "sm" ? "w-7 h-7 text-xs" : "w-9 h-9 text-sm";

  return (
    <div
      className={`${sizeClass} ${colors.avatar} rounded-full flex items-center justify-center text-white font-semibold shrink-0`}
      title={name}
    >
      {initials}
    </div>
  );
}
