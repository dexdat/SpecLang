# speclang-header lines:10
id: "@speclang/layer-definitions"
version: 0.2.0
layer: 1
project_level: Alpha
agent_support: agent_autonomous
tags: [layer, definitions, tree, depth, metadata]
children: ["@speclang/layer-definitions/abstraction", "@speclang/layer-definitions/examples"]
short: "Tree Depth Definitions - Relative position in dependency tree"
---
# Tree Depth Definitions

Semantic meaning for the `layer` field in SpecLang's spanning tree architecture.

## Overview

**No fixed layers**: SpecLang uses a spanning tree structure, not fixed 0-10 abstraction layers. The `layer` field indicates relative depth in the dependency tree.

This spec is split into two sub-specs:

- **Abstraction**: Tree depth concepts, usage guidelines, validation rules
- **Examples**: Relative depth examples and tree position patterns

See @ref:speclang/layer-definitions/abstraction for tree depth concepts and @ref:speclang/layer-definitions/examples for relative position examples.

## Spanning Tree Concept

Specs form a **dependency tree** that self-expands:
- **Root**: `project.scl` or `project.yaml` (layer: 0)
- **Branches**: Expanding specs (layer: increasing depth)
- **Leaves**: Final code-mapping specs (layer: deepest nodes)

**Tree properties**:
- Depth depends on system complexity
- Tree expands as agents create new specs
- Multiple branches can grow concurrently
- Leaves generate code, branches define design