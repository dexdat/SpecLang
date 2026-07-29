// SPECLANG-GENERATED: UI Testing - Mock MCP Server
// DO NOT EDIT MANUALLY
// Source: @speclang/ui.testing

/**
 * Mock MCP Server for UI Testing
 *
 * Provides mock responses for all MCP tools used by the dashboard.
 * Uses a simple fetch mock approach for compatibility.
 */

// Mock responses matching MCP tool interface
export const mockResponses = {
  speclang_search: {
    results: [
      { id: "@specs/auth", title: "Authentication", score: 0.95 },
      { id: "@specs/users", title: "Users", score: 0.85 },
    ],
  },
  speclang_get_status: { active: false, depth: 0 },
  speclang_get_agent_statuses: {
    agents: [
      {
        session_id: "agent-1",
        agent: "spec-writer",
        status: "idle",
        queue_depth: 0,
      },
      {
        session_id: "agent-2",
        agent: "code-gen",
        status: "active",
        queue_depth: 3,
      },
    ],
  },
  speclang_query_events: {
    events: [
      {
        event_id: 1,
        cascade_id: "c1",
        depth: 1,
        trigger_file: "auth.spec.md",
        agent: "spec-writer",
        output_files: ["auth.ts"],
        timestamp: "2024-01-15T10:00:00Z",
      },
    ],
  },
  speclang_get_project_stats: {
    total_specs: 42,
    total_blocks: 128,
    total_refs: 256,
  },
  speclang_get_queue_status: {
    items: [
      {
        command_id: "cmd-1",
        action: "generate",
        target_file: "auth.ts",
        priority: 1,
        age_seconds: 5,
      },
    ],
  },
  speclang_get_system_stats: {
    cpu_percent: 25.5,
    memory_used_mb: 512,
    memory_total_mb: 2048,
  },
};

// Handler type
type MockHandler = (params: Record<string, unknown>) => unknown;

// Tool handlers map
const handlers: Record<string, MockHandler> = {
  speclang_search: () => mockResponses.speclang_search,
  speclang_get_status: () => mockResponses.speclang_get_status,
  speclang_get_agent_statuses: () => mockResponses.speclang_get_agent_statuses,
  speclang_query_events: () => mockResponses.speclang_query_events,
  speclang_get_project_stats: () => mockResponses.speclang_get_project_stats,
  speclang_get_queue_status: () => mockResponses.speclang_get_queue_status,
  speclang_get_system_stats: () => mockResponses.speclang_get_system_stats,
  speclang_insert_command: () => ({ success: true, command_id: "cmd-new" }),
};

// Mock server class
class MockMCPServer {
  private originalFetch: typeof global.fetch;
  private handlers: Map<string, MockHandler>;
  private isActive: boolean;

  constructor() {
    this.originalFetch = global.fetch;
    this.handlers = new Map(Object.entries(handlers));
    this.isActive = false;
  }

  /**
   * Start the mock server - intercepts fetch calls
   */
  listen(): void {
    if (this.isActive) return;

    global.fetch = this.mockFetch.bind(this);
    this.isActive = true;
    console.log("[MockMCP] Server started");
  }

  /**
   * Stop the mock server - restores original fetch
   */
  close(): void {
    if (!this.isActive) return;

    global.fetch = this.originalFetch;
    this.isActive = false;
    console.log("[MockMCP] Server closed");
  }

  /**
   * Reset handlers to default
   */
  resetHandlers(): void {
    // Reset to default handlers if needed
    console.log("[MockMCP] Handlers reset");
  }

  /**
   * Add a custom handler
   */
  use(tool: string, handler: MockHandler): void {
    this.handlers.set(tool, handler);
  }

  /**
   * Mock fetch implementation
   */
  private async mockFetch(
    input: RequestInfo | URL,
    init?: RequestInit,
  ): Promise<Response> {
    const url =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.href
          : input.url;

    // Only intercept MCP tool calls
    if (typeof init?.body === "string") {
      try {
        const body = JSON.parse(init.body);
        if (body.tool && this.handlers.has(body.tool)) {
          const result = this.handlers.get(body.tool)!(body.params || {});
          return new Response(JSON.stringify(result), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }
      } catch {
        // Not a JSON body, pass through
      }
    }

    // Pass through to original fetch for non-MCP calls
    return this.originalFetch(input, init);
  }
}

// Export singleton instance
export const server = new MockMCPServer();

// Helper function to simulate MCP calls directly
export async function callTool(
  tool: string,
  params: Record<string, unknown> = {},
): Promise<unknown> {
  const handler = handlers[tool];
  if (!handler) {
    throw new Error(`Unknown tool: ${tool}`);
  }
  return handler(params);
}

export default server;
