import type { FlawType } from "@/lib/types";

export interface LearnExample {
  passage: string;
  flawType: FlawType;
  explanation: string;
}

export const LEARN_EXAMPLES: LearnExample[] = [
  {
    passage:
      "Everyone in our neighborhood recycles, so recycling must be the best way to help the environment.",
    flawType: "reasoning",
    explanation:
      "Just because people nearby do something doesn't mean it's the best option. This jumps from a small example to a big conclusion without real evidence.",
  },
  {
    passage:
      "Scientists proved that eating chocolate every day makes you smarter.",
    flawType: "epistemic",
    explanation:
      "One study doesn't \"prove\" anything. This treats a guess or early finding as a settled fact, which overstates the evidence.",
  },
  {
    passage:
      "Our plan is to plant 100 trees in the school yard. This will solve the air quality problem in our city.",
    flawType: "completeness",
    explanation:
      "Planting 100 trees is a nice idea, but it ignores the scale of the problem and doesn't consider costs, timeline, or whether it would actually be enough.",
  },
  {
    passage:
      "Speaker A says we need to switch to solar energy, but Speaker B's solution only uses wind power. Neither one mentions the disagreement.",
    flawType: "coherence",
    explanation:
      "The team members contradict each other — one says solar, the other says wind — but nobody addresses the conflict. The team's message is inconsistent.",
  },
  {
    passage:
      "Since my older brother got a cold after going outside without a jacket, not wearing a jacket must cause colds.",
    flawType: "reasoning",
    explanation:
      "This confuses two things happening at the same time with one causing the other. Colds are caused by viruses, not by being cold.",
  },
  {
    passage:
      "I read online that video games improve your reflexes, so playing games for 8 hours a day is definitely healthy.",
    flawType: "epistemic",
    explanation:
      "Even if some games help reflexes, stretching that to say 8 hours is \"definitely healthy\" goes way beyond what the evidence supports.",
  },
  {
    passage:
      "We should ban all plastic bags. There are no downsides to this plan.",
    flawType: "completeness",
    explanation:
      "Saying there are \"no downsides\" ignores real tradeoffs — like cost of alternatives, impact on businesses, or what people would use instead.",
  },
  {
    passage:
      "In the introduction, the team says water pollution is the biggest environmental threat. In the conclusion, they say air pollution is the most urgent problem to solve.",
    flawType: "coherence",
    explanation:
      "The introduction and conclusion disagree about what the biggest threat is. The presentation contradicts itself.",
  },
];
