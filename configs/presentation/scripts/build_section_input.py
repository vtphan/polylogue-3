#!/usr/bin/env python3
"""
Build input for a section-generating persona.

Reads the scenario, the assigned persona, and the section glossary to
construct the structured input the persona needs to generate its section.

Usage:
    python build_section_input.py <scenario_id> <section_name> <agent_id>

Output:
    YAML to stdout — the structured input for the persona.
"""

import sys
import yaml
from pathlib import Path


def load_yaml(path: Path) -> dict:
    with open(path) as f:
        return yaml.safe_load(f)


def load_text(path: Path) -> str:
    with open(path) as f:
        return f.read()


def parse_section_glossary(glossary_text: str) -> dict:
    """Extract section definitions from the glossary markdown table."""
    sections = {}
    for line in glossary_text.strip().split("\n"):
        if line.startswith("| **"):
            parts = [p.strip() for p in line.split("|")[1:-1]]
            name = parts[0].strip("* ")
            sections[name.lower()] = {
                "purpose": parts[1],
                "expected_content": parts[2],
                "common_flaw_locations": parts[3],
            }
    return sections


def build_input(scenario_id: str, section_name: str, agent_id: str) -> dict:
    base = Path("configs")

    # Load scenario
    scenario = load_yaml(base / "scenarios" / f"{scenario_id}.yaml")

    # Load persona
    persona_path = Path(".claude/agents/personas") / scenario_id / f"{agent_id}.md"
    persona_content = load_text(persona_path)

    # Load section glossary
    glossary_text = load_text(base / "reference" / "presentation_section_glossary.md")
    glossary = parse_section_glossary(glossary_text)

    section_info = glossary.get(section_name, {})

    # Find agent's role from scenario
    agent_role = "team member"
    for agent in scenario.get("agents", {}).get("descriptions", []):
        if agent.get("name", "").lower().replace(" ", "-") == agent_id or \
           agent.get("name", "").lower() == agent_id:
            agent_role = agent.get("role", "team member")
            break

    # Build team context (names and roles only — no content)
    team_members = []
    for agent in scenario.get("agents", {}).get("descriptions", []):
        team_members.append({
            "name": agent["name"],
            "role": agent.get("role", "team member"),
        })

    return {
        "topic": {
            "driving_question": scenario["topic"]["driving_question"],
            "domain": scenario["topic"]["domain"],
            "description": scenario["topic"].get("description", ""),
        },
        "your_assignment": {
            "section": section_name,
            "section_purpose": section_info.get("purpose", ""),
            "expected_content": section_info.get("expected_content", ""),
        },
        "team_context": {
            "project": scenario["context"]["description"],
            "team_members": team_members,
            "your_role": agent_role,
        },
        "persona": persona_content,
    }


if __name__ == "__main__":
    if len(sys.argv) != 4:
        print("Usage: python build_section_input.py <scenario_id> <section_name> <agent_id>",
              file=sys.stderr)
        sys.exit(1)

    scenario_id, section_name, agent_id = sys.argv[1], sys.argv[2], sys.argv[3]

    result = build_input(scenario_id, section_name, agent_id)
    print(yaml.dump(result, default_flow_style=False, allow_unicode=True))
