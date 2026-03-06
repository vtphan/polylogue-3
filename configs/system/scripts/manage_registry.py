#!/usr/bin/env python3
"""
Manage registry state: list sessions, archive completed ones, clean up.

Usage:
    python manage_registry.py list                     # List all scenarios in registry
    python manage_registry.py status <scenario_id>     # Show status of a scenario
    python manage_registry.py archive <scenario_id>    # Move to registry/archive/
    python manage_registry.py clean                    # Remove empty/broken registries
"""

import sys
import yaml
import shutil
from datetime import datetime
from pathlib import Path


REGISTRY = Path("registry")
ARCHIVE = REGISTRY / "archive"


def load_yaml(path: Path) -> dict:
    try:
        with open(path) as f:
            return yaml.safe_load(f) or {}
    except Exception:
        return {}


def list_scenarios():
    """List all scenarios in the registry with basic status."""
    if not REGISTRY.exists():
        print("No registry found.")
        return

    scenarios = [
        d for d in REGISTRY.iterdir()
        if d.is_dir() and d.name != "archive"
    ]

    if not scenarios:
        print("No active scenarios in registry.")
        return

    print(f"Active scenarios ({len(scenarios)}):\n")

    for scenario_dir in sorted(scenarios):
        config = load_yaml(scenario_dir / "config.yaml")
        scenario_id = config.get("scenario_id", scenario_dir.name)
        activity = config.get("activity", "unknown")
        topic = config.get("topic", "unknown")

        # Determine status
        has_presentation = (scenario_dir / "presentation.yaml").exists()
        has_discussion = (scenario_dir / "discussion.yaml").exists()
        has_pres_eval = (scenario_dir / "presentation_evaluation.yaml").exists()
        has_disc_eval = (scenario_dir / "discussion_evaluation.yaml").exists()

        if activity == "presentation":
            state = config.get("presentation_state", {})
            completed = state.get("sections_completed", [])
            total = state.get("total_sections", 5)
            progress = f"{len(completed)}/{total} sections"
            evaluated = "evaluated" if has_pres_eval else "not evaluated"
        elif activity == "discussion":
            state = config.get("discussion_state", {})
            turns = state.get("total_turns", 0)
            stage = state.get("current_stage", "unknown")
            progress = f"{turns} turns, stage: {stage}"
            evaluated = "evaluated" if has_disc_eval else "not evaluated"
        else:
            progress = "unknown"
            evaluated = "unknown"

        print(f"  {scenario_id}")
        print(f"    Activity: {activity}")
        print(f"    Topic: {topic[:60]}{'...' if len(topic) > 60 else ''}")
        print(f"    Progress: {progress}")
        print(f"    Evaluation: {evaluated}")
        print()


def show_status(scenario_id: str):
    """Show detailed status of a specific scenario."""
    scenario_dir = REGISTRY / scenario_id

    if not scenario_dir.exists():
        print(f"Scenario not found: {scenario_id}")
        return

    config = load_yaml(scenario_dir / "config.yaml")

    print(f"Scenario: {scenario_id}")
    print(f"  Topic: {config.get('topic', 'unknown')}")
    print(f"  Activity: {config.get('activity', 'unknown')}")
    print(f"  Created: {config.get('created_at', 'unknown')}")
    print()

    # List files
    print("  Files:")
    for f in sorted(scenario_dir.iterdir()):
        if f.is_file():
            size = f.stat().st_size
            print(f"    {f.name} ({size:,} bytes)")

    print()

    # Activity-specific status
    activity = config.get("activity")
    if activity == "presentation":
        state = config.get("presentation_state", {})
        completed = state.get("sections_completed", [])
        print(f"  Sections completed: {completed}")
        print(f"  Total sections: {state.get('total_sections', 5)}")
    elif activity == "discussion":
        state = config.get("discussion_state", {})
        print(f"  Total turns: {state.get('total_turns', 0)}")
        print(f"  Current stage: {state.get('current_stage', 'unknown')}")
        print(f"  Last speaker: {state.get('last_speaker', 'none')}")

    # Agents
    agents = config.get("agents", [])
    if agents:
        print(f"\n  Agents ({len(agents)}):")
        for a in agents:
            print(f"    - {a.get('name', 'unknown')} ({a.get('agent_id', '?')})")


def archive_scenario(scenario_id: str):
    """Move a scenario to the archive directory."""
    scenario_dir = REGISTRY / scenario_id

    if not scenario_dir.exists():
        print(f"Scenario not found: {scenario_id}")
        return

    ARCHIVE.mkdir(exist_ok=True)

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    archive_name = f"{scenario_id}_{timestamp}"
    archive_dest = ARCHIVE / archive_name

    shutil.move(str(scenario_dir), str(archive_dest))
    print(f"Archived: {scenario_id} → registry/archive/{archive_name}")


def clean_registry():
    """Remove empty or broken registry entries."""
    if not REGISTRY.exists():
        print("No registry found.")
        return

    removed = 0
    for scenario_dir in REGISTRY.iterdir():
        if not scenario_dir.is_dir() or scenario_dir.name == "archive":
            continue

        config_path = scenario_dir / "config.yaml"
        if not config_path.exists():
            # No config — broken entry
            shutil.rmtree(str(scenario_dir))
            print(f"  Removed (no config): {scenario_dir.name}")
            removed += 1
            continue

        # Check if directory is empty except for config
        files = list(scenario_dir.iterdir())
        if len(files) <= 1:
            shutil.rmtree(str(scenario_dir))
            print(f"  Removed (empty): {scenario_dir.name}")
            removed += 1

    print(f"\nCleaned {removed} entries.")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(
            "Usage:\n"
            "  python manage_registry.py list\n"
            "  python manage_registry.py status <scenario_id>\n"
            "  python manage_registry.py archive <scenario_id>\n"
            "  python manage_registry.py clean"
        )
        sys.exit(1)

    command = sys.argv[1]

    if command == "list":
        list_scenarios()
    elif command == "status":
        if len(sys.argv) < 3:
            print("Usage: python manage_registry.py status <scenario_id>",
                  file=sys.stderr)
            sys.exit(1)
        show_status(sys.argv[2])
    elif command == "archive":
        if len(sys.argv) < 3:
            print("Usage: python manage_registry.py archive <scenario_id>",
                  file=sys.stderr)
            sys.exit(1)
        archive_scenario(sys.argv[2])
    elif command == "clean":
        clean_registry()
    else:
        print(f"Unknown command: {command}", file=sys.stderr)
        sys.exit(1)
