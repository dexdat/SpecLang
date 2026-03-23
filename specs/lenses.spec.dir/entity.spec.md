# speclang-header lines:9
id: "@speclang/lenses/entity"
parent: ""@ref:specs/lenses"short: "Entity relationship visualization lens"
project_level: Alpha
agent_support: agent_autonomous
tags: [lenses, entity, er-diagram, visualization]
version: 0.1.0
layer: 4
---

# Entity Lens

Visualizes entities and their relationships.

## Entity Extraction

### @lenses/entity/extraction

Extracts entity definitions from specs.

**Entity Sources:**
- @block:entity definitions
- Database schemas
- Type definitions
- API resources

## Relationship Mapping

### @lenses/entity/relationships

Maps relationships between entities.

**Relationship Types:**
- One-to-One
- One-to-Many
- Many-to-Many
- Inheritance
- Composition

## ER Diagram Generation

### @lenses/entity/diagrams

Generates Entity-Relationship diagrams.

**Output:**
- Mermaid ER syntax
- PlantUML format
- Interactive web visualization
