// SPECLANG-GENERATED: UI Testing - Mock SSE Events
// DO NOT EDIT MANUALLY
// Source: @speclang/ui.testing

/**
 * Mock SSE Events for UI Testing
 * 
 * Provides mock EventSource and event data for testing real-time updates.
 */

export interface MockEventSource {
  addEventListener: (type: string, handler: (e: MessageEvent) => void) => void;
  removeEventListener: (type: string, handler: (e: MessageEvent) => void) => void;
  close: () => void;
  emit: (type: string, data: unknown) => void;
}

/**
 * Creates a mock EventSource for testing SSE connections
 */
export function createMockEventSource(): MockEventSource {
  const listeners = new Map<string, Set<(e: MessageEvent) => void>>();
  
  return {
    addEventListener: (type: string, handler: (e: MessageEvent) => void) => {
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type)!.add(handler);
    },
    removeEventListener: (type: string, handler: (e: MessageEvent) => void) => {
      listeners.get(type)?.delete(handler);
    },
    close: () => listeners.clear(),
    emit: (type: string, data: unknown) => {
      const event = new MessageEvent(type, { data: JSON.stringify(data) });
      listeners.get(type)?.forEach(h => h(event));
    }
  };
}

/**
 * Mock SSE events for testing
 */
export const mockEvents = {
  fileChanged: { type: 'file.changed', file: 'specs/auth.spec.md' },
  agentSpawned: { type: 'agent.spawned', agent: 'spec-writer', session_id: 'session-1' },
  agentCompleted: { type: 'agent.completed', agent: 'spec-writer', session_id: 'session-1' },
  cascadeConverged: { type: 'cascade.converged', cascade_id: 'cascade-1', duration_ms: 5000 },
  commandExecuted: { type: 'command.executed', command_id: 'cmd-1', action: 'generate' }
};

/**
 * Creates a mock MessageEvent for testing
 */
export function createMockMessageEvent(type: string, data: unknown): MessageEvent {
  return new MessageEvent(type, { data: JSON.stringify(data) });
}

export default { createMockEventSource, mockEvents, createMockMessageEvent };
