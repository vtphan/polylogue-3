#!/usr/bin/env python3
"""
Append a generated section to the presentation transcript.

Reads the section content and metadata (from stdin or a JSON file),
validates it, and appends it to the presentation transcript YAML.
Also updates the registry config.

Enum values are read from configs/presentation/schemas/presentation.schema.yaml
— the single source of truth.

Usage:
    python append_section.py <scenario_id> [--input <file>]

    If --input is not specified, reads JSON from stdin.

Input JSON format:
    {
        "section": "introduction",
        "speaker": "kenji",
        "role": "Researcher",
        "content": "...",
        "metadata": {
            "knowledge_areas_engaged": [
                {"area": "water pollutants", "category": "strong"}
            ],
            "rationale": "..."
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
from schema_utils import get_presentation_sections, get_knowledge_categories


def load_yaml(path: Path) -> dict:
    with open(path) as f:
        return yaml.safe_load(f) or {}


def write_yaml(path: Path, data: dict):
    with open(path, "w") as f:
        yaml.dump(data, f, default_flow_style=False, allow_unicode=True,
                  sort_keys=False)


def validate_section(section_data: dict) -> list:
    """Validate section data. Returns list of error strings."""
    valid_sections = get_presentation_sections()
    valid_categories = get_knowledge_categories()
    errors = []

    if section_data.get("section") not in valid_sections:
        errors.append(f"Invalid section: {section_data.get('section')}. "
                      f"Must be one of: {valid_sections}")

    if not section_data.get("speaker"):
        errors.append("Missing speaker")

    if not section_data.get("content") or len(section_data["content"].strip()) < 50:
        errors.append("Content is missing or too short (< 50 chars)")

    metadata = section_data.get("metadata", {})
    if not metadata.get("knowledge_areas_engaged"):
        errors.append("Missing metadata.knowledge_areas_engaged")
    else:
        for item in metadata["knowledge_areas_engaged"]:
            if item.get("category") not in valid_categories:
                errors.append(f"Invalid knowledge category: {item.get('category')}")

    if not metadata.get("rationale"):
        errors.append("Missing metadata.rationale")

    return errors


def append_section(scenario_id: str, section_data: dict):
    registry_dir = Path("registry") / scenario_id
    transcript_path = registry_dir / "presentation.yaml"
    config_path = registry_dir / "config.yaml"

    if not transcript_path.exists():
        print(f"Error: Transcript not found at {transcript_path}", file=sys.stderr)
        print("Run /generate_presentation first to initialize the registry.",
              file=sys.stderr)
        sys.exit(1)

    # Validate
    errors = validate_section(section_data)
    if errors:
        print("Validation errors:", file=sys.stderr)
        for e in errors:
            print(f"  - {e}", file=sys.stderr)
        sys.exit(1)

    # Load transcript
    transcript = load_yaml(transcript_path)
    sections = transcript.get("sections", [])

    # Determine section_id
    section_num = len(sections) + 1
    section_id = f"section_{section_num:02d}"

    # Build section entry
    entry = {
        "section_id": section_id,
        "section": section_data["section"],
        "speaker": section_data["speaker"],
        "role": section_data.get("role", "team member"),
        "content": section_data["content"],
        "metadata": section_data["metadata"],
        "added_at": datetime.now(timezone.utc).isoformat(),
    }

    # Append
    sections.append(entry)
    transcript["sections"] = sections
    write_yaml(transcript_path, transcript)

    # Update config
    config = load_yaml(config_path)
    state = config.get("presentation_state", {})
    completed = state.get("sections_completed", [])
    completed.append(section_data["section"])
    state["sections_completed"] = completed
    config["presentation_state"] = state
    write_yaml(config_path, config)

    print(f"Appended {section_id}: {section_data['section']} "
          f"by {section_data['speaker']}")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python append_section.py <scenario_id> [--input <file>]",
              file=sys.stderr)
        sys.exit(1)

    scenario_id = sys.argv[1]

    # Read input
    if "--input" in sys.argv:
        idx = sys.argv.index("--input")
        input_path = Path(sys.argv[idx + 1])
        with open(input_path) as f:
            section_data = json.load(f)
    else:
        section_data = json.load(sys.stdin)

    append_section(scenario_id, section_data)
