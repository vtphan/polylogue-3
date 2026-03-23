#!/usr/bin/env python3
"""
Collect all existing agent_ids across scenarios.

Scans configs/profiles/*/*.yaml and returns every agent_id already in use,
optionally excluding a given scenario. Used by /generate_profiles to enforce
cross-scenario name uniqueness.

Usage:
    python collect_existing_agent_ids.py [--exclude <scenario_id>]

Output:
    YAML to stdout — a list of reserved agent_ids with their scenario.

Example output:
    reserved_agent_ids:
      - agent_id: amara
        scenario_id: plastic-pollution-mississippi-river
      - agent_id: jordan
        scenario_id: plastic-pollution-mississippi-river
"""

import argparse
import sys
import yaml
from pathlib import Path


def collect(profiles_dir: Path, exclude: str | None = None) -> list[dict]:
    """Return all agent_ids found under profiles_dir, optionally excluding one scenario."""
    reserved = []
    if not profiles_dir.is_dir():
        return reserved

    for scenario_dir in sorted(profiles_dir.iterdir()):
        if not scenario_dir.is_dir():
            continue
        scenario_id = scenario_dir.name
        if scenario_id == exclude:
            continue
        for profile_path in sorted(scenario_dir.glob("*.yaml")):
            agent_id = profile_path.stem
            reserved.append({"agent_id": agent_id, "scenario_id": scenario_id})

    return reserved


def main():
    parser = argparse.ArgumentParser(
        description="Collect existing agent_ids across all scenarios."
    )
    parser.add_argument(
        "--exclude",
        default=None,
        help="Scenario ID to exclude (typically the one being generated).",
    )
    args = parser.parse_args()

    profiles_dir = Path("configs/profiles")
    reserved = collect(profiles_dir, exclude=args.exclude)

    output = {
        "reserved_agent_ids": reserved,
        "count": len(reserved),
    }
    yaml.dump(output, sys.stdout, default_flow_style=False, sort_keys=False)


if __name__ == "__main__":
    main()
