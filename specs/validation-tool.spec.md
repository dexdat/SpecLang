# speclang-header lines:10
id: "@speclang/validation-tool"
version: 0.1.0
layer: 4
project_level: Alpha
agent_support: agent_autonomous
tags: [validation, tool, python, typescript, autonomous]
short: Overview and references for validation tool specifications
children: ["@speclang/validation-tool/implementation", "@speclang/validation-tool/api"]
---
# Validation Tool Specifications

This directory contains specifications for the validation tool:

- [Implementation details](@speclang/validation-tool/implementation) – Python/TypeScript implementation, confidence scoring, report formats, safety integration, implementation plan
- [API definitions](@speclang/validation-tool/api) – Requirements, CLI interface, validation logic, Node API, references

## Purpose

Tool that scans `agent_autonomous` specs for completeness and correctness.

## Navigation

Use the child specs for detailed information. This spec serves as an index.