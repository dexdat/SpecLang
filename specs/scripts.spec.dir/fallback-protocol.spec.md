# speclang-header lines:11
id: "@speclang/scripts.fallback-protocol"
version: 0.1.0
layer: 1
tags: [scripts, fallback, safety-nets, peer-review]
parent: "@ref:speclang/scripts"
status: draft
project_level: Alpha
agent_support: agent_assisted
short: Fallback Protocol Script
---

# Fallback Protocol Script

Implements fallback protocols from `@ref:speclang/safety-nets/fallback`.

Triggers fallback actions when confidence score is low, downgrades agent_support, creates review tickets.