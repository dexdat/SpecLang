# speclang-header lines:10
id: "@speclang/agent-support-levels"
version: 0.1.0
layer: 1
project_level: Alpha
agent_support: agent_autonomous
tags: [agent, support, autonomy, levels]
children: ["@speclang/agent-support-levels/levels", "@speclang/agent-support-levels/behaviors"]
short: Behavioral expectations for each agent_support level
---
# Agent Support Levels

This spec has been split into sub-specs for better organization:

- @ref:speclang/agent-support-levels/levels – Definitions of human_only, agent_assisted, and agent_autonomous levels
- @ref:speclang/agent-support-levels/behaviors – Agent behavior matrix, transition guidelines, and integration with metadata

Each sub-spec contains detailed information about agent support levels.