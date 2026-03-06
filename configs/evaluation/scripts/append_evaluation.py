#!/usr/bin/env python3
"""
Write evaluation results to the registry.

Reads evaluation output (from stdin or a JSON file), validates it,
and writes to the appropriate evaluation file in the registry.

Usage:
    python append_evaluation.py <scenario_id> <activity> [--input <file>]

    activity: "presentation" or "discussion"
    If --input is not specified, reads JSON from stdin.

Output files:
    registry/{scenario_id}/presentation_evaluation.yaml
    registry/{scenario_id}/discussion_evaluation.yaml
"""

import sys
import json
import yaml
from pathlib import Path


VALID_FLAW_TYPES = ["reasoning", "epistemic", "completeness", "coherence"]
VALID_SOURCES = ["knowledge_driven", "interaction_driven"]
VALID_SEVERITIES = ["minor", "moderate", "major"]
VALID_LOCATION_TYPES = ["section", "turn", "cross_section", "cross_turn"]


def write_yaml(path: Path, data: dict):
    with open(path, "w") as f:
        yaml.dump(data, f, default_flow_style=False, allow_unicode=True,
                  sort_keys=False)


def validate_evaluation(eval_data: dict) -> list:
    """Validate evaluation data. Returns list of error strings."""
    errors = []

    if not eval_data.get("scenario_id"):
        errors.append("Missing scenario_id")

    if eval_data.get("activity") not in ["presentation", "discussion"]:
        errors.append(f"Invalid activity: {eval_data.get('activity')}")

    flaws = eval_data.get("flaws", [])
    for i, flaw in enumerate(flaws):
        prefix = f"flaws[{i}]"

        if flaw.get("flaw_type") not in VALID_FLAW_TYPES:
            errors.append(f"{prefix}.flaw_type invalid: {flaw.get('flaw_type')}")

        if flaw.get("source") not in VALID_SOURCES:
            errors.append(f"{prefix}.source invalid: {flaw.get('source')}")

        if flaw.get("severity") not in VALID_SEVERITIES:
            errors.append(f"{prefix}.severity invalid: {flaw.get('severity')}")

        loc = flaw.get("location", {})
        if loc.get("type") not in VALID_LOCATION_TYPES:
            errors.append(f"{prefix}.location.type invalid: {loc.get('type')}")

        if not loc.get("references"):
            errors.append(f"{prefix}.location.references missing")

        if not flaw.get("description"):
            errors.append(f"{prefix}.description missing")

        if not flaw.get("evidence"):
            errors.append(f"{prefix}.evidence missing")

        if not flaw.get("explanation"):
            errors.append(f"{prefix}.explanation missing")

        # Presentation flaws must be knowledge_driven
        if eval_data.get("activity") == "presentation":
            if flaw.get("source") == "interaction_driven":
                errors.append(
                    f"{prefix}.source: presentations cannot have "
                    f"interaction_driven flaws"
                )

    # Validate summary
    summary = eval_data.get("summary", {})
    if not summary:
        errors.append("Missing summary")
    else:
        total = summary.get("total_flaws", 0)
        type_sum = sum(summary.get("by_type", {}).values())
        if total != type_sum:
            errors.append(
                f"summary.total_flaws ({total}) != sum of by_type ({type_sum})"
            )

        if total != len(flaws):
            errors.append(
                f"summary.total_flaws ({total}) != len(flaws) ({len(flaws)})"
            )

    return errors


def write_evaluation(scenario_id: str, activity: str, eval_data: dict):
    registry_dir = Path("registry") / scenario_id

    if not registry_dir.exists():
        print(f"Error: Registry not found at {registry_dir}", file=sys.stderr)
        sys.exit(1)

    # Validate
    errors = validate_evaluation(eval_data)
    if errors:
        print("Validation errors:", file=sys.stderr)
        for e in errors:
            print(f"  - {e}", file=sys.stderr)
        sys.exit(1)

    # Write
    filename = f"{activity}_evaluation.yaml"
    output_path = registry_dir / filename
    write_yaml(output_path, eval_data)

    total = eval_data.get("summary", {}).get("total_flaws", 0)
    print(f"Evaluation written: {output_path} ({total} flaws)")


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print(
            "Usage: python append_evaluation.py <scenario_id> <activity> "
            "[--input <file>]",
            file=sys.stderr,
        )
        sys.exit(1)

    scenario_id = sys.argv[1]
    activity = sys.argv[2]

    if activity not in ["presentation", "discussion"]:
        print(f"Invalid activity: {activity}. Must be 'presentation' or "
              f"'discussion'.", file=sys.stderr)
        sys.exit(1)

    # Read input
    if "--input" in sys.argv:
        idx = sys.argv.index("--input")
        input_path = Path(sys.argv[idx + 1])
        with open(input_path) as f:
            eval_data = json.load(f)
    else:
        eval_data = json.load(sys.stdin)

    write_evaluation(scenario_id, activity, eval_data)
