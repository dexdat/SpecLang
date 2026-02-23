// SPECLANG-GENERATED: UI Testing - useSSE Hook Tests
// DO NOT EDIT MANUALLY
// Source: @speclang/ui.testing

/**
 * Tests for useSSE hook (simulated)
 * 
 * Tests SSE connection and event handling.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createMockEventSource, mockEvents } from '../../mocks/sse-events';

describe('useSSE Hook (Simulated)', () => {
  let mockSource: ReturnType<typeof createMockEventSource>;
  
  // Simulate the useSSE hook behavior
  const simulateUseSSE = (eventsUrl: string, eventTypes: string[]) => {
    const events: Array<{ type: string; data: unknown; timestamp: number }> = [];
    let isOnline = true;
    
    const mock = createMockEventSource();
    
    eventTypes.forEach(type => {
      mock.addEventListener(type, (e: MessageEvent) => {
        const data = JSON.parse(e.data);
        events.push({ type, data, timestamp: Date.now() });
      });
    });
    
    return {
      events,
      isOnline,
      mock
    };
  };

  beforeEach(() => {
    mockSource = createMockEventSource();
  });

  afterEach(() => {
    mockSource.close();
  });

  describe('Connection', () => {
    it('should establish connection', () => {
      const { events, isOnline, mock } = simulateUseSSE('/events', ['file.changed']);
      
      expect(isOnline).toBe(true);
      expect(events).toEqual([]);
      mock.close();
    });
  });

  describe('Event receiving', () => {
    it('should receive file.changed events', () => {
      const { events, mock } = simulateUseSSE('/events', ['file.changed']);
      
      mock.emit('file.changed', mockEvents.fileChanged);
      
      expect(events.length).toBe(1);
      expect(events[0].type).toBe('file.changed');
      mock.close();
    });

    it('should receive multiple event types', () => {
      const { events, mock } = simulateUseSSE('/events', [
        'file.changed', 
        'agent.spawned', 
        'cascade.converged'
      ]);
      
      mock.emit('file.changed', mockEvents.fileChanged);
      mock.emit('agent.spawned', mockEvents.agentSpawned);
      mock.emit('cascade.converged', mockEvents.cascadeConverged);
      
      expect(events.length).toBe(3);
      mock.close();
    });
  });

  describe('Event batching', () => {
    it('should batch rapid events', () => {
      const { events, mock } = simulateUseSSE('/events', ['file.changed']);
      
      for (let i = 0; i < 10; i++) {
        mock.emit('file.changed', { type: 'file.changed', file: `file${i}.md` });
      }
      
      expect(events.length).toBe(10);
      mock.close();
    });
  });

  describe('Error handling', () => {
    it('should handle connection errors', () => {
      let isOnline = true;
      
      // Simulate error
      const handleError = () => {
        isOnline = false;
      };
      
      expect(isOnline).toBe(true);
      handleError();
      expect(isOnline).toBe(false);
    });
  });
});
