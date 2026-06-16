# speclang-header lines:12
id: "@speclang/project-layout"
version: 0.1.0
target: src/project-layout/
layer: 0
tags: [layout, structure, files]
children: ["@speclang/project-layout/structure", "@speclang/project-layout/conventions"]
status: draft

project_level: Alpha
agent_support: agent_assisted
short: Project Layout
---

# Project Layout

Standard directory structure for a speclang project.

## Overview

This spec defines the standard directory structure and conventions for a speclang project. It has been split into focused sub-specs for better organization:

## Sub-specs

### @ref:specs/project-layout/structure
- Project structure, directory tree, and file purposes
- Layout of north star, specs, tests, generated code, and internal directories
- Initialization process and configuration

### @ref:specs/project-layout/conventions
- Naming conventions for specs, tests, and generated code
- Reference path patterns and usage guidelines

Each sub-spec provides detailed, focused content while maintaining reference links back to this parent spec.
