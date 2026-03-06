#!/usr/bin/env python3
"""
Append a generated turn to the discussion transcript.

Reads the turn content and metadata (from stdin or a JSON file),
validates it, and appends it to the discussion transcript YAML.
Also updates the registry config.

Enum values are read from configs/discussion/schemas/discussion.schema.yaml
— the single source of truth.

Usage:
    python append_turn.py <scenario_id> [--input <file>]

    If --input is not specified, reads JSON from stdin.

Input JSON format:
    {
        "speaker": "kenji",
        "role": "Proposer",
        "stage": "opening_up",
        "content": "I think we should focus on...",
        "metadata": {
            "knowledge_areas_engaged": [
                {"area": "water pollutants", "category": "strong"}
            ],
            "reactive_tendency_activated": false,
            "rationale": "Sharing initial position on the topic"
        }
    }
"""

import sys
import json
import yaml
from datetime import datetime, timezone
from pathlib import Path

# Add system scripts to path for shared utilities
sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "system" / "scripts"))
from schema_utils import get_discussion_stages, get_knowledge_categories


def load_yaml(path: Path) -> dict:
    with open(path) as f:
        return yaml.safe_load(f) or {}


def write_yaml(path: Path, data: dict):
    with open(path, "w") as f:
        yaml.dump(data, f, default_flow_style=False, allow_unicode=True,
                  sort_keys=False)


def validate_turn(turn_data: dict) -> list:
    """Validate turn data. Returns list of error strings."""
    valid_stages = get_discussion_stages()
    valid_categories = get_knowledge_categories()
    errors = []

    if not turn_data.get("speaker"):
        errors.append("Missing speaker")

    if turn_data.get("stage") not in valid_stages:
        errors.append(f"Invalid stage: {turn_data.get('stage')}. "
                      f"Must be one of: {valid_stages}")

    if not turn_data.get("content") or len(turn_data["content"].strip()) < 10:
        errors.append("Content is missing or too short (< 10 chars)")

    metadata = turn_data.get("metadata", {})
    if not metadata.get("knowledge_areas_engaged"):
        errors.append("Missing metadata.knowledge_areas_engaged")
    else:
        for item in metadata["knowledge_areas_engaged"]:
            if item.get("category") not in valid_categories:
                errors.append(
                    f"Invalid knowledge category: {item.get('category')}"
                )

    if "reactive_tendency_activated" not in metadata:
        errors.append("Missing metadata.reactive_tendency_activated")

    if not metadata.get("rationale"):
        errors.append("Missing metadata.rationale")

    return errors


def append_turn(scenario_id: str, turn_data: dict):
    registry_dir = Path("registry") / scenario_id
    transcript_path = registry_dir / "discussion.yaml"
    config_path = registry_dir / "config.yaml"

    if not transcript_path.exists():
        print(f"Error: Transcript not found at {transcript_path}",
              file=sys.stderr)
        print("Run /begin_discussion first to initialize the registry.",
              file=sys.stderr)
        sys.exit(1)

    # Validate
    errors = validate_turn(turn_data)
    if errors:
        print("Validation errors:", file=sys.stderr)
        for e in errors:
            print(f"  - {e}", file=sys.stderr)
        sys.exit(1)

    # Load transcript
    transcript = load_yaml(transcript_path)
    turns = transcript.get("turns", [])

    # Determine turn_id
    turn_num = len(turns) + 1
    turn_id = f"turn_{turn_num:03d}"

    # Build turn entry
    entry = {
        "turn_id": turn_id,
        "speaker": turn_data["speaker"],
        "role": turn_data.get("role"),
        "stage": turn_data["stage"],
        "content": turn_data["content"],
        "metadata": turn_data["metadata"],
        "added_at": datetime.now(timezone.utc).isoformat(),
    }

    # Append
    turns.append(entry)
    transcript["turns"] = turns

    # Update transcript header's current_stage
    transcript["config"]["current_stage"] = turn_data["stage"]

    write_yaml(transcript_path, transcript)

    # Update config
    config = load_yaml(config_path)
    state = config.get("discussion_state", {})
    state["total_turns"] = turn_num
    state["last_speaker"] = turn_data["speaker"]
    state["current_stage"] = turn_data["stage"]
    config["discussion_state"] = state
    write_yaml(config_path, config)

    print(f"Appended {turn_id}: {turn_data['speaker']} "
          f"[{turn_data['stage']}] — "
          f"\"{turn_data['content'][:50]}...\"")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python append_turn.py <scenario_id> [--input <file>]",
              file=sys.stderr)
        sys.exit(1)

    scenario_id = sys.argv[1]

    # Read input
    if "--input" in sys.argv:
        idx = sys.argv.index("--input")
        input_path = Path(sys.argv[idx + 1])
        with open(input_path) as f:
            turn_data = json.load(f)
    else:
        turn_data = json.load(sys.stdin)

    append_turn(scenario_id, turn_data)
