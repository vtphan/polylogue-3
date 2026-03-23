export interface ScaffoldTemplate {
  level: number;
  type: string;
  label: string;
  text: string;
}

export const SCAFFOLD_TEMPLATES: ScaffoldTemplate[] = [
  // Level 1: Attention redirect
  { level: 1, type: "attention_redirect", label: "Look again", text: "Take another look at the earlier sections. Is there something you might have missed?" },
  { level: 1, type: "attention_redirect", label: "Later sections", text: "Have you looked closely at the later sections? There might be something worth noting." },

  // Level 2: Comparison prompt
  { level: 2, type: "comparison_prompt", label: "Compare speakers", text: "Compare what the first speaker says with what the last speaker says. Do they agree?" },
  { level: 2, type: "comparison_prompt", label: "Evidence match", text: "Does the evidence presented in the middle sections actually support the conclusion?" },

  // Level 3: Category nudge
  { level: 3, type: "category_nudge", label: "Other flaw types", text: "You've been finding one type of flaw. Are there other types of problems here too?" },
  { level: 3, type: "category_nudge", label: "Missing pieces", text: "Think about what's NOT being said. Is anything important left out?" },

  // Level 4: Question prompt
  { level: 4, type: "question_prompt", label: "Evidence quality", text: "How strong is the evidence being used? Is anything being treated as fact without proof?" },
  { level: 4, type: "question_prompt", label: "Logic check", text: "Does the argument actually make sense? Are there any jumps in the reasoning?" },

  // Level 5: Flaw type hint
  { level: 5, type: "flaw_type_hint", label: "Coherence hint", text: "There's a consistency problem between two sections. Can you find where they contradict each other?" },
  { level: 5, type: "flaw_type_hint", label: "Reasoning hint", text: "One of the arguments has a logical flaw. Look for where the conclusion doesn't follow from the evidence." },

  // Level 6: Metacognitive
  { level: 6, type: "metacognitive", label: "Group disagreement", text: "Your group seems to disagree about something. What would help you decide who's right?" },
  { level: 6, type: "metacognitive", label: "Confidence check", text: "How confident are you in your annotations so far? What would make you more sure?" },
];
