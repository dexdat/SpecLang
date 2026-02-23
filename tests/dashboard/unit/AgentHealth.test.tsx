// SPECLANG-GENERATED: UI Testing - Agent Health Unit Tests
// DO NOT EDIT MANUALLY
// Source: @speclang/ui.testing

/**
 * Unit Tests for Agent Health
 * 
 * Tests agent status types and helper functions.
 */

import { describe, it, expect, vi } from 'vitest';
import { mockAgents } from '../../mocks/fixtures';

describe('Agent Health Types', () => {
  describe('Agent Status', () => {
    it('should have valid status values', () => {
      const validStatuses = ['idle', 'active', 'error', 'paused'];
      
      mockAgents.forEach(agent => {
        expect(validStatuses).toContain(agent.status);
      });
    });

    it('should track queue depth', () => {
      mockAgents.forEach(agent => {
        expect(typeof agent.queue_depth).toBe('number');
        expect(agent.queue_depth).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('Agent display', () => {
    it('should show current file for active agents', () => {
      const activeAgent = mockAgents.find(a => a.status === 'active');
      expect(activeAgent?.current_file).toBe('auth.ts');
    });

    it('should show null current file for idle agents', () => {
      const idleAgent = mockAgents.find(a => a.status === 'idle');
      expect(idleAgent?.current_file).toBeNull();
    });
  });

  describe('Agent health indicators', () => {
    it('should identify healthy agents', () => {
      const healthyAgents = mockAgents.filter(a => a.status === 'idle' || a.status === 'active');
      expect(healthyAgents.length).toBe(2);
    });

    it('should identify unhealthy agents', () => {
      const unhealthyAgents = mockAgents.filter(a => a.status === 'error');
      expect(unhealthyAgents.length).toBe(1);
    });
  });

  describe('Queue depth thresholds', () => {
    const getQueueStatus = (depth: number): 'low' | 'medium' | 'high' => {
      if (depth === 0) return 'low';
      if (depth <= 3) return 'medium';
      return 'high';
    };

    it('should categorize zero depth as low', () => {
      expect(getQueueStatus(0)).toBe('low');
    });

    it('should categorize small depth as medium', () => {
      expect(getQueueStatus(2)).toBe('medium');
    });

    it('should categorize large depth as high', () => {
      expect(getQueueStatus(5)).toBe('high');
    });
  });

  describe('Agent uptime', () => {
    it('should calculate uptime from last active', () => {
      const lastActive = new Date('2024-01-15T10:00:00Z');
      const now = new Date('2024-01-15T10:05:00Z');
      
      const uptimeSeconds = (now.getTime() - lastActive.getTime()) / 1000;
      expect(uptimeSeconds).toBe(300);
    });

    it('should format uptime correctly', () => {
      const formatUptime = (seconds: number): string => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        
        if (hours > 0) return `${hours}h ${minutes}m`;
        return `${minutes}m`;
      };

      expect(formatUptime(300)).toBe('5m');
      expect(formatUptime(3660)).toBe('1h 1m');
    });
  });
});
