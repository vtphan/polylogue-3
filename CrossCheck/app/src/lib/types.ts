// Types derived from the Polylogue 3 YAML data model

export interface Agent {
  agent_id: string;
  name: string;
  role: string;
}

// Presentation types
export interface PresentationSection {
  section_id: string;
  section: string; // introduction, approach, findings, solution, conclusion
  speaker: string; // agent_id
  role: string;
  content: string;
}

export interface PresentationTranscript {
  scenario_id: string;
  topic: string;
  activity: "presentation";
  agents: Agent[];
  sections: PresentationSection[];
}

// Discussion types
export interface DiscussionTurn {
  turn_id: string;
  speaker: string; // agent_id
  role?: string;
  stage: "opening_up" | "working_through" | "converging";
  content: string;
}

export interface DiscussionTranscript {
  scenario_id: string;
  topic: string;
  activity: "discussion";
  agents: Agent[];
  turns: DiscussionTurn[];
}

export type Transcript = PresentationTranscript | DiscussionTranscript;

// Activity (from API)
export interface Activity {
  id: string;
  scenarioId: string;
  type: "presentation" | "discussion";
  topic: string;
  agents: Agent[];
  transcript: Transcript;
}

// Annotation types
export type FlawType = "reasoning" | "epistemic" | "completeness" | "coherence";

export interface AnnotationLocation {
  item_id: string; // section_id or turn_id
  start_offset: number;
  end_offset: number;
  highlighted_text: string;
}

export interface Annotation {
  id: string;
  location: AnnotationLocation;
  flawType: FlawType;
  createdAt: string;
  isGroupAnswer?: boolean;
  confirmedBy?: string[];
  userId?: string;
  comments?: { id: string; text: string; isBonus: boolean }[];
}

// Flaw type display info
export const FLAW_TYPES: Record<FlawType, { label: string; color: string; bgColor: string; description: string }> = {
  reasoning: {
    label: "Reasoning",
    color: "text-red-700",
    bgColor: "bg-red-100",
    description: "The logic doesn't hold up — bad arguments, jumping to conclusions, or circular thinking.",
  },
  epistemic: {
    label: "Epistemic",
    color: "text-amber-700",
    bgColor: "bg-amber-100",
    description: "Treating guesses as facts, cherry-picking evidence, or being way too confident.",
  },
  completeness: {
    label: "Completeness",
    color: "text-blue-700",
    bgColor: "bg-blue-100",
    description: "Something important is missing — key people, tradeoffs, or obvious counterpoints.",
  },
  coherence: {
    label: "Coherence",
    color: "text-purple-700",
    bgColor: "bg-purple-100",
    description: "Team members contradict each other, or the conclusion doesn't match the evidence.",
  },
};
