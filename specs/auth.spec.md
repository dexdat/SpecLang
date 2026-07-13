# speclang-header lines:10
id: "@speclang/auth"
version: 0.1.0
layer: 2
project_level: "Alpha"
agent_support: "agent_autonomous"
tags: [auth, mcp, typescript, component]
short: "Authentication component for MCP server"
children: ["@speclang/auth/entities", "@speclang/auth/flows"]
---
# Authentication Component

Authentication component for the MCP server, split into entities and flows.

## Overview

This spec defines authentication for the MCP server, including:
- **Entities**: `MCPAuthConfig` interface and `MCPAuth` class
- **Flows**: Factory function `createAuth` and middleware integration patterns

## Sub‑specs

1. **[@ref:speclang/auth/entities]** – Authentication entities (`MCPAuthConfig`, `MCPAuth`)
2. **[@ref:speclang/auth/flows]** – Authentication flows (`createAuth`, middleware usage)

## Purpose

Provide configurable authentication middleware for MCP server with support for:
- No authentication (`none`)
- Basic authentication (`basic`)
- Token authentication (`token`)

## Usage

Refer to the sub‑specs for detailed definitions. This directory spec provides the overall structure.

## Related Specs

- @ref:speclang/mcp.authentication – MCP authentication methods
- @ref:speclang/examples/auth – Example authentication spec

