// SPECLANG-GENERATED: UI Testing - Git Integration Tests
// DO NOT EDIT MANUALLY
// Source: @speclang/ui.testing

/**
 * Integration Tests for Git Integration
 * 
 * Tests git operations with mock MCP server.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { server, callTool } from '../../mocks/mcp-server';

describe('Git Integration', () => {
  beforeEach(() => {
    server.listen();
  });

  afterEach(() => {
    server.close();
  });

  describe('Command queue', () => {
    it('should insert git commands', async () => {
      const result = await callTool('speclang_insert_command', {
        action: 'git_commit',
        message: 'Test commit',
        files: ['auth.spec.md']
      });
      
      expect(result).toHaveProperty('success');
    });

    it('should track command id', async () => {
      const result = await callTool('speclang_insert_command', {
        action: 'git_commit',
        message: 'Test commit'
      }) as { command_id: string };
      
      expect(typeof result.command_id).toBe('string');
    });
  });

  describe('Queue status', () => {
    it('should get queue status', async () => {
      const result = await callTool('speclang_get_queue_status', {});
      
      expect(result).toHaveProperty('items');
    });

    it('should track pending commands', async () => {
      const result = await callTool('speclang_get_queue_status', {}) as { items: unknown[] };
      
      expect(Array.isArray(result.items)).toBe(true);
    });
  });
});
