/**
 * SPECLANG-GENERATED - Do not edit directly
 * 
 * Source: specs/ui-dashboard.spec.dir/testing.spec.md
 * Blocks: @ui/testing/framework
 * Generated: 2026-03-03T17:00:00.000Z
 * Baby Step: 1 of 4
 */

/**
 * Mock MCP client for UI testing.
 * Provides simulated MCP server responses for dashboard components.
 */
export interface MockMCPClient {
  call(tool: string, params: Record<string, unknown>): Promise<unknown>;
  connect(): Promise<void>;
  disconnect(): void;
  isConnected(): boolean;
}

/**
 * Mock MCP server for integration testing.
 * Simulates server behavior without actual network.
 */
export interface MockMCPServer {
  start(port?: number): Promise<void>;
  stop(): Promise<void>;
  handleRequest(tool: string, params: Record<string, unknown>): Promise<unknown>;
  getRequestCount(): number;
}

/**
 * Create a mock MCP client with configurable responses.
 */
export function createMockMCPClient(
  responses?: Record<string, (params: Record<string, unknown>) => unknown>
): MockMCPClient {
  const responseMap = responses || {};
  let connected = false;
  let callCount = 0;

  return {
    async call(tool: string, params: Record<string, unknown>): Promise<unknown> {
      callCount++;
      console.log(`[MockMCP] Calling ${tool}:`, params);
      
      if (responseMap[tool]) {
        return responseMap[tool](params);
      }
      
      // Default responses for common tools
      switch (tool) {
        case 'specs/get':
          return { id: params.id, content: '# Mock spec', version: '1.0.0' };
        case 'specs/list':
          return { specs: [{ id: '@specs/test', version: '1.0.0' }] };
        case 'cascade/status':
          return { active: false, progress: 0, currentStep: 'idle' };
        case 'dashboard/metrics':
          return { uptime: 100, specCount: 42, cascadeCount: 5 };
        default:
          return { success: true, tool, params };
      }
    },
    
    async connect(): Promise<void> {
      connected = true;
      console.log('[MockMCP] Connected');
    },
    
    disconnect(): void {
      connected = false;
      console.log('[MockMCP] Disconnected');
    },
    
    isConnected(): boolean {
      return connected;
    }
  };
}

/**
 * Create a mock MCP server for integration tests.
 */
export function createMockMCPServer(): MockMCPServer {
  let running = false;
  let requestCount = 0;
  
  return {
    async start(port?: number): Promise<void> {
      running = true;
      console.log(`[MockMCPServer] Started on port ${port || 3000}`);
    },
    
    async stop(): Promise<void> {
      running = false;
      console.log('[MockMCPServer] Stopped');
    },
    
    async handleRequest(tool: string, params: Record<string, unknown>): Promise<unknown> {
      if (!running) {
        throw new Error('Server not running');
      }
      requestCount++;
      
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 10));
      
      return { success: true, tool, params, requestId: requestCount };
    },
    
    getRequestCount(): number {
      return requestCount;
    }
  };
}

/**
 * Default mock client instance for convenience.
 */
export const mockMCPClient = createMockMCPClient();

/**
 * Default mock server instance for convenience.
 */
export const mockMCPServer = createMockMCPServer();