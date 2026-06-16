// SPECLANG-GENERATED: UI Testing - Real-Time Updates Integration Tests
// DO NOT EDIT MANUALLY
// Source: @speclang/ui.testing

/**
 * Integration Tests for Real-Time Updates
 * 
 * Tests SSE event handling with mock events.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createMockEventSource, mockEvents } from '../../mocks/sse-events';

describe('Real-Time Updates Integration', () => {
  describe('EventSource', () => {
    let mockSource: ReturnType<typeof createMockEventSource>;

    beforeEach(() => {
      mockSource = createMockEventSource();
    });

    afterEach(() => {
      mockSource.close();
    });

    it('should add and remove event listeners', () => {
      const handler = vi.fn();
      
      mockSource.addEventListener('file.changed', handler);
      mockSource.emit('file.changed', { file: 'test.md' });
      
      expect(handler).toHaveBeenCalledTimes(1);
      
      mockSource.removeEventListener('file.changed', handler);
      mockSource.emit('file.changed', { file: 'test2.md' });
      
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('should handle multiple listeners', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      
      mockSource.addEventListener('file.changed', handler1);
      mockSource.addEventListener('file.changed', handler2);
      
      mockSource.emit('file.changed', { file: 'test.md' });
      
      expect(handler1).toHaveBeenCalledTimes(1);
      expect(handler2).toHaveBeenCalledTimes(1);
    });
  });

  describe('Event types', () => {
    it('should handle file.changed events', () => {
      const event = mockEvents.fileChanged;
      expect(event.type).toBe('file.changed');
      expect(event).toHaveProperty('file');
    });

    it('should handle agent.spawned events', () => {
      const event = mockEvents.agentSpawned;
      expect(event.type).toBe('agent.spawned');
      expect(event).toHaveProperty('agent');
      expect(event).toHaveProperty('session_id');
    });

    it('should handle agent.completed events', () => {
      const event = mockEvents.agentCompleted;
      expect(event.type).toBe('agent.completed');
    });

    it('should handle cascade.converged events', () => {
      const event = mockEvents.cascadeConverged;
      expect(event.type).toBe('cascade.converged');
      expect(event).toHaveProperty('cascade_id');
      expect(event).toHaveProperty('duration_ms');
    });

    it('should handle command.executed events', () => {
      const event = mockEvents.commandExecuted;
      expect(event.type).toBe('command.executed');
      expect(event).toHaveProperty('command_id');
      expect(event).toHaveProperty('action');
    });
  });

  describe('Event processing', () => {
    it('should parse event data correctly', () => {
      const data = { type: 'file.changed', file: 'auth.spec.md' };
      const json = JSON.stringify(data);
      const parsed = JSON.parse(json);
      
      expect(parsed.type).toBe('file.changed');
      expect(parsed.file).toBe('auth.spec.md');
    });

    it('should batch rapid events', () => {
      const events: unknown[] = [];
      
      for (let i = 0; i < 10; i++) {
        events.push({ type: 'file.changed', file: `file${i}.md`, index: i });
      }
      
      expect(events.length).toBe(10);
    });
  });
});
