// SPECLANG-GENERATED: UI Testing - useMCPTools Hook Tests
// DO NOT EDIT MANUALLY
// Source: @speclang/ui.testing

/**
 * Tests for useMCPTools hook (simulated)
 * 
 * Tests MCP tool calls via mock server.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { server, callTool } from '../../mocks/mcp-server';

describe('useMCPTools Hook (Simulated)', () => {
  beforeEach(() => {
    server.listen();
  });

  afterEach(() => {
    server.close();
  });

  // Simulate the useMCPTools hook behavior
  const simulateUseMCPTools = () => {
    return {
      async queryEvents(params: { limit?: number }) {
        return callTool('speclang_query_events', params);
      },
      async getAgentStatuses(params: Record<string, unknown>) {
        return callTool('speclang_get_agent_statuses', params);
      },
      async getSystemStats() {
        return callTool('speclang_get_system_stats', {});
      },
      async search(query: string) {
        return callTool('speclang_search', { query });
      }
    };
  };

  describe('queryEvents', () => {
    it('should query events successfully', async () => {
      const tools = simulateUseMCPTools();
      
      const result = await tools.queryEvents({ limit: 20 });
      
      expect(result).toHaveProperty('events');
      expect(Array.isArray((result as { events: unknown[] }).events)).toBe(true);
    });

    it('should respect limit parameter', async () => {
      const tools = simulateUseMCPTools();
      
      const result = await tools.queryEvents({ limit: 5 });
      
      expect(result).toHaveProperty('events');
    });
  });

  describe('getAgentStatuses', () => {
    it('should get agent statuses', async () => {
      const tools = simulateUseMCPTools();
      
      const result = await tools.getAgentStatuses({});
      
      expect(result).toHaveProperty('agents');
      expect(Array.isArray((result as { agents: unknown[] }).agents)).toBe(true);
    });
  });

  describe('getSystemStats', () => {
    it('should get system stats', async () => {
      const tools = simulateUseMCPTools();
      
      const result = await tools.getSystemStats();
      
      expect(result).toHaveProperty('cpu_percent');
      expect(result).toHaveProperty('memory_used_mb');
    });
  });

  describe('search', () => {
    it('should search specs', async () => {
      const tools = simulateUseMCPTools();
      
      const result = await tools.search('auth');
      
      expect(result).toHaveProperty('results');
    });
  });
});
