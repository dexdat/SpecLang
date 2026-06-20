# speclang-header lines:12
id: "@speclang/validation"
version: 0.1.0
target: src/validation/
layer: 0
tags: [validation, schema, errors]
status: draft
project_level: Alpha
agent_support: agent_autonomous
children: ["@ref:specs/validation/rules", "@ref:specs/validation/tool", "@ref:specs/validation/language-blocks"]
short: Validation
---

# Validation

Spec validation rules. Checked on every write.

## Children

- "@ref:speclang/validation/rules – Core validation rules"
- @ref:speclang/validation/tool – Validation tool and flow
- @ref:speclang/validation/language-blocks – Language block validation rules
