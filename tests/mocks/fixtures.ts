// SPECLANG-GENERATED: UI Testing - Test Fixtures
// DO NOT EDIT MANUALLY
// Source: @speclang/ui.testing

/**
 * Test Fixtures for UI Testing
 * 
 * Provides reusable mock data for tests.
 */

// Agent fixtures
export const mockAgents = [
  {
    session_id: 'agent-1',
    agent: 'spec-writer',
    status: 'idle' as const,
    current_file: null,
    queue_depth: 0,
    last_active: '2024-01-15T10:00:00Z'
  },
  {
    session_id: 'agent-2',
    agent: 'code-gen',
    status: 'active' as const,
    current_file: 'auth.ts',
    queue_depth: 3,
    last_active: '2024-01-15T10:05:00Z'
  },
  {
    session_id: 'agent-3',
    agent: 'test-writer',
    status: 'error' as const,
    current_file: 'users.test.ts',
    queue_depth: 1,
    last_active: '2024-01-15T09:55:00Z'
  }
];

// Event fixtures
export const mockTimelineEvents = [
  {
    event_id: 1,
    cascade_id: 'c1',
    depth: 1,
    trigger_file: 'auth.spec.md',
    agent: 'spec-writer',
    output_files: ['auth.ts'],
    timestamp: '2024-01-15T10:00:00Z'
  },
  {
    event_id: 2,
    cascade_id: 'c1',
    depth: 2,
    trigger_file: 'auth.ts',
    agent: 'code-gen',
    output_files: ['auth.test.ts'],
    timestamp: '2024-01-15T10:01:00Z'
  },
  {
    event_id: 3,
    cascade_id: 'c1',
    depth: 3,
    trigger_file: 'auth.test.ts',
    agent: 'test-writer',
    output_files: [],
    timestamp: '2024-01-15T10:02:00Z'
  }
];

// System stats fixtures
export const mockSystemStats = {
  cpu_percent: 25.5,
  memory_used_mb: 512,
  memory_total_mb: 2048,
  disk_used_gb: 45,
  disk_total_gb: 256
};

// Project stats fixtures
export const mockProjectStats = {
  total_specs: 42,
  total_blocks: 128,
  total_refs: 256,
  last_updated: '2024-01-15T10:00:00Z'
};

// Queue items fixtures
export const mockQueueItems = [
  {
    command_id: 'cmd-1',
    action: 'generate',
    target_file: 'auth.ts',
    priority: 1,
    age_seconds: 5
  },
  {
    command_id: 'cmd-2',
    action: 'validate',
    target_file: 'users.spec.md',
    priority: 2,
    age_seconds: 12
  },
  {
    command_id: 'cmd-3',
    action: 'test',
    target_file: 'auth.test.ts',
    priority: 1,
    age_seconds: 30
  }
];

// Search results fixtures
export const mockSearchResults = [
  { id: '@specs/auth', title: 'Authentication', score: 0.95, blocks: 15 },
  { id: '@specs/users', title: 'Users', score: 0.85, blocks: 8 },
  { id: '@specs/api', title: 'API', score: 0.75, blocks: 12 }
];

// Cascade status fixtures
export const mockCascadeStatuses = {
  idle: {
    status: 'idle' as const,
    active: false,
    converged: false,
    depth: 0,
    maxDepth: 10,
    lastEventTime: null,
    convergenceTime: null,
    cascadeId: null
  },
  running: {
    status: 'running' as const,
    active: true,
    converged: false,
    depth: 3,
    maxDepth: 10,
    lastEventTime: '2024-01-15T10:05:00Z',
    convergenceTime: null,
    cascadeId: 'cascade-1'
  },
  paused: {
    status: 'paused' as const,
    active: true,
    converged: false,
    depth: 5,
    maxDepth: 10,
    lastEventTime: '2024-01-15T10:10:00Z',
    convergenceTime: null,
    cascadeId: 'cascade-1'
  },
  converged: {
    status: 'idle' as const,
    active: false,
    converged: true,
    depth: 10,
    maxDepth: 10,
    lastEventTime: '2024-01-15T10:15:00Z',
    convergenceTime: '2024-01-15T10:15:00Z',
    cascadeId: 'cascade-1'
  }
};

export default {
  mockAgents,
  mockTimelineEvents,
  mockSystemStats,
  mockProjectStats,
  mockQueueItems,
  mockSearchResults,
  mockCascadeStatuses
};
