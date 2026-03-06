#!/usr/bin/env python3
"""
Build input for a discussant persona (the agent generating an utterance).

Reads the persona file, scenario, and transcript to construct the input
the persona needs to generate its discussion turn.

Key rule: The persona sees conversation CONTENT ONLY — no metadata,
no knowledge area labels, no rationale, no stage info.

Usage:
    python build_utterance_input.py <scenario_id> <agent_id>

Output:
    YAML to stdout — structured input for the persona.
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


def build_input(scenario_id: str, agent_id: str) -> dict:
    registry = Path("registry") / scenario_id
    transcript = load_yaml(registry / "discussion.yaml")
    scenario = load_yaml(Path("configs/scenarios") / f"{scenario_id}.yaml")

    # Load persona
    persona_path = (Path(".claude/agents/personas") / scenario_id /
                    f"{agent_id}.md")
    persona_content = load_text(persona_path)

    # Build conversation history — CONTENT ONLY
    history = []
    for turn in transcript.get("turns", []):
        # Find agent name from agents list
        agent_name = turn["speaker"]
        for agent in transcript.get("agents", []):
            if agent["agent_id"] == turn["speaker"]:
                agent_name = agent["name"]
                break
        history.append({
            "speaker": agent_name,
            "content": turn["content"],
        })

    # Build team context (names only)
    team_members = []
    for agent in scenario.get("agents", {}).get("descriptions", []):
        team_members.append({
            "name": agent["name"],
            "role": agent.get("role"),
        })

    return {
        "topic": {
            "driving_question": scenario["topic"]["driving_question"],
            "domain": scenario["topic"]["domain"],
            "description": scenario["topic"].get("description", ""),
        },
        "team_context": {
            "project": scenario["context"]["description"],
            "team_members": team_members,
        },
        "conversation_so_far": history,
        "persona": persona_content,
        "instructions": (
            "Generate your next discussion turn. Respond to what was actually "
            "said in the conversation. Your turn should be 2-4 sentences, "
            "natural and conversational. React authentically to what others "
            "have said."
        ),
    }


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python build_utterance_input.py <scenario_id> <agent_id>",
              file=sys.stderr)
        sys.exit(1)

    result = build_input(sys.argv[1], sys.argv[2])
    print(yaml.dump(result, default_flow_style=False, allow_unicode=True))
