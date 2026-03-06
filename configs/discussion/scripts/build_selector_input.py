#!/usr/bin/env python3
"""
Build input for the speaker-selector subagent.

Reads the discussion state and transcript, constructs the input the
speaker-selector needs to choose the next speaker.

Usage:
    python build_selector_input.py <scenario_id>

Output:
    YAML to stdout — structured input for the speaker-selector.
"""

import sys
import yaml
from pathlib import Path


def load_yaml(path: Path) -> dict:
    with open(path) as f:
        return yaml.safe_load(f) or {}


def build_input(scenario_id: str) -> dict:
    registry = Path("registry") / scenario_id
    config = load_yaml(registry / "config.yaml")
    transcript = load_yaml(registry / "discussion.yaml")
    scenario = load_yaml(Path("configs/scenarios") / f"{scenario_id}.yaml")

    # Build speakers list from scenario (names, roles, descriptions)
    speakers = []
    for agent in scenario.get("agents", {}).get("descriptions", []):
        speakers.append({
            "agent_id": agent["name"].lower().replace(" ", "-"),
            "name": agent["name"],
            "role": agent.get("role"),
            "description": agent.get("disposition_sketch", ""),
        })

    # Build conversation history — content only, no metadata
    history = []
    for turn in transcript.get("turns", []):
        history.append({
            "turn_id": turn["turn_id"],
            "speaker": turn["speaker"],
            "content": turn["content"],
        })

    # Determine selection method
    selection = transcript.get("config", {}).get("selection", "responsive")

    return {
        "selection_method": selection,
        "speakers": speakers,
        "last_speaker": config.get("discussion_state", {}).get("last_speaker"),
        "conversation_history": history,
        "turn_number": config.get("discussion_state", {}).get("total_turns", 0) + 1,
    }


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python build_selector_input.py <scenario_id>",
              file=sys.stderr)
        sys.exit(1)

    result = build_input(sys.argv[1])
    print(yaml.dump(result, default_flow_style=False, allow_unicode=True))
