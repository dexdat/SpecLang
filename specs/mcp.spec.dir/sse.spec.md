# speclang-header lines:13
id: @specs/mcp/sse
version: 1.0.0
layer: 5
project_level: Alpha
agent_support: agent_autonomous
target: src/mcp/sse.ts
tags: [mcp, sse, streaming, events]
short: Server-Sent Events manager
---

# MCP Server SSE Streaming

Real-time event streaming via Server-Sent Events.

## Class: SSEManager

### Methods

- `start()` - Start polling
- `stop()` - Stop polling
- `addClient(id, res)` - Add SSE client
- `removeClient(id)` - Remove client
- `broadcast(type, data)` - Broadcast to all
- `broadcastFileChange(data)` - File change events
- `broadcastCascadeProgress(data)` - Cascade progress
- `broadcastAgentActivity(data)` - Agent activity
- `broadcastConvergence(data)` - Convergence events

### expressHandler()

Returns Express handler for /events endpoint.
