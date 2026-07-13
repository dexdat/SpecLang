# speclang-header lines:12
id: "@speclang/workflow"
version: 0.1.0
layer: 0
tags: [workflow, user, guide, setup]
imports: ["@speclang/core", "@speclang/daemon", "@speclang/skills", "@speclang/cascade"]
status: draft
project_level: Alpha
agent_support: agent_assisted
children: ["@speclang/workflow/setup", "@speclang/workflow/daily-use", "@speclang/workflow/examples"]
short: User Workflow
---

# User Workflow

How a user actually uses Speclang from start to finish.

This spec has been split into three sub-specs:

1. **Setup** (`@speclang/workflow/setup`) – Installation and project start
2. **Daily Use** (`@speclang/workflow/daily-use`) – Conversation, review, commands, daily workflow
3. **Examples** (`@speclang/workflow/examples`) – File flow, team workflow, troubleshooting

Each sub-spec contains detailed blocks. Refer to them for specific workflows.