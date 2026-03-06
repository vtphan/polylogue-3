#!/usr/bin/env python3
"""
Shared utilities for reading enums and validation rules from schema YAML files.

All scripts should use these functions instead of hardcoding enum values.
The schema files in configs/*/schemas/ are the single source of truth.
"""

import yaml
from pathlib import Path


# Project root — scripts are invoked from the project root
PROJECT_ROOT = Path(".")

SCHEMA_PATHS = {
    "presentation": PROJECT_ROOT / "configs/presentation/schemas/presentation.schema.yaml",
    "discussion": PROJECT_ROOT / "configs/discussion/schemas/discussion.schema.yaml",
    "evaluation": PROJECT_ROOT / "configs/evaluation/schemas/evaluation.schema.yaml",
    "scenario": PROJECT_ROOT / "configs/scenario/schemas/scenario.schema.yaml",
    "profile": PROJECT_ROOT / "configs/agent/schemas/profile.schema.yaml",
}


def load_schema(name: str) -> dict:
    """Load a schema YAML file by name."""
    path = SCHEMA_PATHS.get(name)
    if not path or not path.exists():
        raise FileNotFoundError(f"Schema not found: {name} (expected at {path})")
    with open(path) as f:
        return yaml.safe_load(f)


def extract_enum(schema: dict, *path_keys) -> list:
    """
    Walk a schema dict along a dotted path to find an enum list.

    Examples:
        extract_enum(schema, "properties", "section", "enum")
        extract_enum(schema, "properties", "stage", "enum")

    For array items, use "items" as a path key:
        extract_enum(schema, "properties", "sections", "items",
                     "properties", "section", "enum")
    """
    node = schema
    for key in path_keys:
        if not isinstance(node, dict) or key not in node:
            raise KeyError(f"Path not found in schema: {'.'.join(path_keys)} "
                           f"(failed at '{key}')")
        node = node[key]
    if not isinstance(node, list):
        raise TypeError(f"Expected list at path {'.'.join(path_keys)}, "
                        f"got {type(node).__name__}")
    return node


# --- Convenience functions for commonly needed enums ---

def get_presentation_sections() -> list:
    """Valid section names from presentation schema."""
    schema = load_schema("presentation")
    return extract_enum(schema,
                        "properties", "sections", "items",
                        "properties", "section", "enum")


def get_knowledge_categories() -> list:
    """Valid knowledge categories from presentation schema."""
    schema = load_schema("presentation")
    return extract_enum(schema,
                        "properties", "sections", "items",
                        "properties", "metadata", "properties",
                        "knowledge_areas_engaged", "items",
                        "properties", "category", "enum")


def get_discussion_stages() -> list:
    """Valid discussion stages from discussion schema."""
    schema = load_schema("discussion")
    return extract_enum(schema,
                        "properties", "turns", "items",
                        "properties", "stage", "enum")


def get_flaw_types() -> list:
    """Valid flaw types from evaluation schema."""
    schema = load_schema("evaluation")
    return extract_enum(schema,
                        "properties", "flaws", "items",
                        "properties", "flaw_type", "enum")


def get_flaw_sources() -> list:
    """Valid flaw sources from evaluation schema."""
    schema = load_schema("evaluation")
    return extract_enum(schema,
                        "properties", "flaws", "items",
                        "properties", "source", "enum")


def get_flaw_severities() -> list:
    """Valid flaw severities from evaluation schema."""
    schema = load_schema("evaluation")
    return extract_enum(schema,
                        "properties", "flaws", "items",
                        "properties", "severity", "enum")


def get_location_types() -> list:
    """Valid location types from evaluation schema."""
    schema = load_schema("evaluation")
    return extract_enum(schema,
                        "properties", "flaws", "items",
                        "properties", "location", "properties",
                        "type", "enum")
