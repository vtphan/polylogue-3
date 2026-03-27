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
  hinted?: boolean;
  isGroupAnswer?: boolean;
  confirmedBy?: string[];
  userId?: string;
  comments?: { id: string; text: string; isBonus: boolean }[];
}

// Difficulty modes — ordered by independence gradient (system withdraws, student takes on more)
export type DifficultyMode = "learn" | "recognize" | "locate" | "classify" | "explain";

export const VALID_DIFFICULTY_MODES: DifficultyMode[] = ["learn", "recognize", "locate", "classify", "explain"];

// Session modes — excludes Learn (standalone page, not a session mode)
export type SessionMode = "recognize" | "locate" | "classify" | "explain";

export const SESSION_MODES: SessionMode[] = ["recognize", "locate", "classify", "explain"];

// User-facing label is "Practice Mode". Internal name kept for DB compatibility.
export const DIFFICULTY_MODE_INFO: Record<DifficultyMode, { label: string; desc: string }> = {
  learn:     { label: "Learn",     desc: "Vocabulary primer" },
  recognize: { label: "Recognize", desc: "Comprehend shown flaws" },
  locate:    { label: "Locate",    desc: "Directed search with hints" },
  classify:  { label: "Classify",  desc: "Open search" },
  explain:   { label: "Explain",   desc: "Full analysis with justification" },
};

// Per-mode granularity knob config types
export interface RecognizeConfig { response_format: "ab" | "multiple_choice" }
export interface LocateConfig { hint_scope: "sentence" | "section" }
export interface ClassifyConfig { categorization: "detect_only" | "assisted" | "full" }
export interface ExplainConfig { explanation_format: "guided" | "free_text" }

export type ModeConfig = RecognizeConfig | LocateConfig | ClassifyConfig | ExplainConfig;

// Knob info for session creation UI
export const MODE_KNOB_INFO: Record<SessionMode, {
  key: string;
  label: string;
  options: { value: string; label: string }[];
  default: string;
}> = {
  recognize: {
    key: "response_format",
    label: "Response format",
    options: [
      { value: "ab", label: "A/B choice" },
      { value: "multiple_choice", label: "Multiple choice" },
    ],
    default: "multiple_choice",
  },
  locate: {
    key: "hint_scope",
    label: "Hint scope",
    options: [
      { value: "sentence", label: "Sentence" },
      { value: "section", label: "Section" },
    ],
    default: "section",
  },
  classify: {
    key: "categorization",
    label: "Categorization",
    options: [
      { value: "detect_only", label: "Detect only" },
      { value: "assisted", label: "Assisted" },
      { value: "full", label: "Full" },
    ],
    default: "full",
  },
  explain: {
    key: "explanation_format",
    label: "Explanation format",
    options: [
      { value: "guided", label: "Guided" },
      { value: "free_text", label: "Free text" },
    ],
    default: "guided",
  },
};

// Flaw type display info
export const FLAW_TYPES: Record<FlawType, { label: string; abbrev: string; color: string; bgColor: string; description: string }> = {
  reasoning: {
    label: "Reasoning",
    abbrev: "R",
    color: "text-red-700",
    bgColor: "bg-red-100",
    description: "The logic doesn't hold up — bad arguments, jumping to conclusions, or circular thinking.",
  },
  epistemic: {
    label: "Epistemic",
    abbrev: "E",
    color: "text-amber-700",
    bgColor: "bg-amber-100",
    description: "Treating guesses as facts, cherry-picking evidence, or being way too confident.",
  },
  completeness: {
    label: "Completeness",
    abbrev: "Cp",
    color: "text-blue-700",
    bgColor: "bg-blue-100",
    description: "Something important is missing — key people, tradeoffs, or obvious counterpoints.",
  },
  coherence: {
    label: "Coherence",
    abbrev: "Co",
    color: "text-purple-700",
    bgColor: "bg-purple-100",
    description: "Team members contradict each other, or the conclusion doesn't match the evidence.",
  },
};
