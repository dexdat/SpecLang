# speclang-header lines:12
id: "@speclang/project-maturity-levels"
version: 0.1.0
layer: 1
project_level: Alpha
agent_support: agent_autonomous
tags: [project, maturity, levels, autonomous]
children:
  - "@ref:specs/project-maturity-levels.dir/levels"
  - "@ref:specs/project-maturity-levels.dir/criteria"
short: Concrete criteria for each project_level value
---
# Project Maturity Levels

Clear definitions for the `project_level` field (POC → Enterprise).

This specification has been split into multiple parts for better organization and autonomous agent operation.

## Parts

- @ref:specs/project-maturity-levels.dir/levels – Definitions for each project_level value
- @ref:specs/project-maturity-levels.dir/criteria – Detailed criteria and validation rules

*See individual parts in project-maturity-levels.dir/*