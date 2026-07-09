# speclang-header lines:6
id: "@specs/docs/layers"
version: 1.0.0
layer: 5
target: docs/layers.md
tags: [docs, layers, architecture, dual-view]
---

# SpecLang Layer System Reference

Documents the 10-layer abstraction model used to organize SpecLang
specifications. Each layer maps to a distinct phase of the cascade pipeline,
from high-level intent (layer 0) to deployment configuration (layer 9).

## Layer Table

| Layer | Name                    | Purpose                                    | Example                              |
|-------|-------------------------|--------------------------------------------|--------------------------------------|
| 0     | North Star              | Root project intent and vision             | `project.scl`                        |
| 1     | Component Architecture  | High-level component design                | `components.spec.md`                 |
| 2     | Domain Models           | Entity and value object definitions        | `entities.spec.yaml`                 |
| 3     | Interface Specifications| API and interface definitions              | `api.spec.yaml`                      |
| 4     | Business Logic          | Business rules and workflows               | `workflows.spec.md`                  |
| 5     | Code Mapping            | Direct mapping to implementation           | `*.ts.spec`, `*.go.spec`, `*.py.spec`|
| 6     | Generated Implementation| Generated target language code             | `*.ts`, `*.go`, `*.py`               |
| 7     | Test Specifications     | Test definitions in natural language       | `*.test.spec.md`                     |
| 8     | Generated Tests         | Generated test code                        | `*_test.go`, `*.test.ts`, `*_test.py`|
| 9     | Pipeline Configuration  | Build and deployment configuration         | `pipeline.yaml`, `build.yaml`        |

## Layer Dependencies

Dependencies flow downward: a layer may reference layers *below* it but not
above. The `validate_layers` check enforces this.

@ref:specs/compliance §Layer Hierarchy
