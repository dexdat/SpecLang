# speclang-header lines:10
id: "@speclang/autonomous-validation"
version: 0.1.0
layer: 2
project_level: Alpha
agent_support: agent_autonomous
tags: [validation, autonomous, agent, rules]
children: ["@speclang/autonomous-validation/rules", "@speclang/autonomous-validation/scoring"]
short: Validation rules for specs labeled agent_autonomous
---
# Autonomous Validation

Enhanced validation for specs with `agent_support: agent_autonomous`.

## Children

- @ref:speclang/autonomous-validation/rules – Core validation rules and criteria
- @ref:speclang/autonomous-validation/scoring – Scoring algorithms and thresholds