# speclang-header lines:10
id: "@speclang/scripts-generate-index"
version: 0.1.0
layer: 1
tags: [scripts, index, generation]
parent: "@ref:speclang/scriptsstatus: draft
project_level: Alpha
agent_support: agent_assisted
short: Generate Index Script
---

# Generate Index Script

Generates `_index.json` from all spec files in the project.

## Purpose

```speclang
# @block:gen-index/purpose @kind:note
Scans specs/ directory and generates _index.json with metadata:
- id, version, layer, tags
- imports, depends_on
- children references
- line counts
```
