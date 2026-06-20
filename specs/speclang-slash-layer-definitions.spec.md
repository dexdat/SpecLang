# speclang-header lines:9
id: "@speclang/layer-definitions"
version: 0.1.0
layer: 0
project_level: Alpha
agent_support: agent_assisted
tags: [layer, definitions]
short: Parent spec for layer definitions directory
---

# Layer Definitions Directory

This is a parent spec for the layer definitions directory.

## Overview

### @block::purpose @kind:entity

Purpose:
  description: Defines layer abstraction levels in SpecLang
  layers: 0-10 (configurable)
  
### @block::layer-definitions @kind:entity

LayerDefinitions:
  0:
    name: Project
    description: North star, project intent
    owner: Human
    
  1:
    name: High-level Specs
    description: Feature specifications
    owner: Spec Writer
    
  2:
    name: Detailed Specs
    description: Implementation details
    owner: Spec Writer
    
  3:
    name: Code Mapping
    description: Language-specific specs
    owner: Code Gen
    
  4:
    name: Generated Code
    description: Output code
    owner: Code Gen
    
  5:
    name: Tests
    description: Test specifications
    owner: Test Writer

### @block::layer-values @kind:entity

ValidLayers:
  minimum: 0
  maximum: 10
  default: 5
  
  Usage:
    header_field: layer
    type: integer
    required: true
