#!/usr/bin/env python3
"""
Build input for the stage-tracker subagent.

Reads the discussion transcript (with full metadata) and constructs
the input the stage-tracker needs to assess stage transitions.

Key difference from utterance input: The stage-tracker sees FULL metadata
(knowledge areas, rationale, reactive tendency) because it needs this
information to make informed stage assessments.

Usage:
    python build_stage_input.py <scenario_id>

Output:
    YAML to stdout — structured input for the stage-tracker.
"""

import sys
import yaml
from pathlib import Path


def load_yaml(path: Path) -> dict:
    with open(path) as f:
        return yaml.safe_load(f) or {}


def load_text(path: Path) -> str:
    with open(path) as f:
        return f.read()


def build_input(scenario_id: str) -> dict:
    registry = Path("registry") / scenario_id
    config = load_yaml(registry / "config.yaml")
    transcript = load_yaml(registry / "discussion.yaml")

    current_stage = config.get("discussion_state", {}).get(
        "current_stage", "opening_up"
    )

    # Build conversation history — FULL metadata for stage-tracker
    history = []
    for turn in transcript.get("turns", []):
        history.append({
            "turn_id": turn["turn_id"],
            "speaker": turn["speaker"],
            "stage": turn.get("stage", current_stage),
            "content": turn["content"],
            "metadata": turn.get("metadata", {}),
        })

    # Load stage glossary
    glossary = load_text(
        Path("configs/reference/discussion_stage_glossary.md")
    )

    return {
        "current_stage": current_stage,
        "conversation_history": history,
        "stage_glossary": glossary,
    }


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python build_stage_input.py <scenario_id>",
              file=sys.stderr)
        sys.exit(1)

    result = build_input(sys.argv[1])
    print(yaml.dump(result, default_flow_style=False, allow_unicode=True))
