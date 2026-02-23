// SPECLANG-GENERATED: UI Testing - Cascade Control Integration Tests
// DO NOT EDIT MANUALLY
// Source: @speclang/ui.testing

/**
 * Integration Tests for Cascade Control
 * 
 * Tests the cascade control flow with mock MCP server.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { server, callTool } from '../../mocks/mcp-server';

describe('Cascade Control Integration', () => {
  beforeEach(() => {
    server.listen();
  });

  afterEach(() => {
    server.close();
  });

  describe('MCP Tool Calls', () => {
    it('should trigger cascade via MCP', async () => {
      const result = await callTool('speclang_insert_command', {
        action: 'trigger',
        target_file: 'auth.spec.md'
      });
      
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('command_id');
    });

    it('should pause cascade via MCP', async () => {
      const result = await callTool('speclang_insert_command', {
        action: 'pause'
      });
      
      expect(result).toHaveProperty('success');
    });

    it('should resume cascade via MCP', async () => {
      const result = await callTool('speclang_insert_command', {
        action: 'resume'
      });
      
      expect(result).toHaveProperty('success');
    });

    it('should abort cascade via MCP', async () => {
      const result = await callTool('speclang_insert_command', {
        action: 'abort'
      });
      
      expect(result).toHaveProperty('success');
    });

    it('should finalize cascade via MCP', async () => {
      const result = await callTool('speclang_insert_command', {
        action: 'finalize'
      });
      
      expect(result).toHaveProperty('success');
    });

    it('should execute step via MCP', async () => {
      const result = await callTool('speclang_insert_command', {
        action: 'step'
      });
      
      expect(result).toHaveProperty('success');
    });
  });

  describe('Cascade Status Flow', () => {
    it('should get cascade status', async () => {
      const result = await callTool('speclang_get_status', {});
      
      expect(result).toHaveProperty('active');
      expect(result).toHaveProperty('depth');
    });
  });

  describe('End-to-End Cascade Flow', () => {
    it('should complete full cascade workflow', async () => {
      // 1. Trigger cascade
      const triggerResult = await callTool('speclang_insert_command', {
        action: 'trigger',
        target_file: 'auth.spec.md'
      });
      expect(triggerResult).toHaveProperty('success');

      // 2. Get status - should be active
      const statusResult = await callTool('speclang_get_status', {});
      expect(statusResult).toHaveProperty('active');

      // 3. Pause cascade
      const pauseResult = await callTool('speclang_insert_command', {
        action: 'pause'
      });
      expect(pauseResult).toHaveProperty('success');

      // 4. Resume cascade
      const resumeResult = await callTool('speclang_insert_command', {
        action: 'resume'
      });
      expect(resumeResult).toHaveProperty('success');

      // 5. Finalize cascade
      const finalizeResult = await callTool('speclang_insert_command', {
        action: 'finalize'
      });
      expect(finalizeResult).toHaveProperty('success');
    });
  });
});
