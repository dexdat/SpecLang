# Bootstrap Phase 0.22: UI Testing

## Context
You are building SpecLang - a reactive multi-agent system where specs self-assemble into code. This is Phase 0.22 of the bootstrap process.

**Prerequisites**: 
- Phase 0.1-0.21 complete
- UI components built
- Interactions implemented
- State management working

## Your Task
Implement comprehensive testing for the UI including unit tests, integration tests, E2E tests, accessibility tests, and performance tests.

## Read These Specs First
1. `specs/ui.spec.dir/testing.spec.md` - Testing specifications
2. `specs/test-specs.spec.md` - Test spec format
3. `specs/ui.spec.dir/components/*.spec.md` - Component specs

## Current State
- UI components exist in src/dashboard/
- MCP tools provide mock data
- Need test infrastructure

## What to Build

### Files to Create
```
tests/
├── dashboard/
│   ├── unit/
│   │   ├── CascadeStatus.test.tsx
│   │   ├── AgentHealth.test.tsx
│   │   ├── EventTimeline.test.tsx
│   │   ├── QueueDepth.test.tsx
│   │   ├── SystemMetrics.test.tsx
│   │   └── ControlPanel.test.tsx
│   ├── integration/
│   │   ├── cascade-control.test.tsx
│   │   ├── spec-editor.test.tsx
│   │   ├── real-time-updates.test.tsx
│   │   └── git-integration.test.tsx
│   ├── hooks/
│   │   ├── useSSE.test.ts
│   │   ├── useMCPTools.test.ts
│   │   └── useDashboardState.test.ts
│   └── accessibility/
│       └── a11y.test.tsx
├── e2e/
│   ├── dashboard.spec.ts
│   ├── cascade-control.spec.ts
│   ├── spec-editing.spec.ts
│   └── monitoring.spec.ts
└── mocks/
    ├── mcp-server.ts
    ├── sse-events.ts
    └── fixtures.ts
```

### Requirements

#### 1. Mock MCP Server

```typescript
// tests/mocks/mcp-server.ts
import { setupServer } from 'msw/node';
import { rest } from 'msw';

export const mockResponses = {
  speclang_search: { results: [
    { id: '@specs/auth', title: 'Authentication', score: 0.95 },
    { id: '@specs/users', title: 'Users', score: 0.85 }
  ]},
  speclang_get_status: { active: false, depth: 0 },
  speclang_get_agent_statuses: { agents: [
    { session_id: 'agent-1', agent: 'spec-writer', status: 'idle', queue_depth: 0 },
    { session_id: 'agent-2', agent: 'code-gen', status: 'active', queue_depth: 3 }
  ]},
  speclang_query_events: { events: [
    { event_id: 1, cascade_id: 'c1', depth: 1, trigger_file: 'auth.spec.md', agent: 'spec-writer', timestamp: '2024-01-15T10:00:00Z' }
  ]},
  speclang_get_project_stats: { total_specs: 42, total_blocks: 128, total_refs: 256 },
  speclang_get_queue_status: { items: [
    { command_id: 'cmd-1', action: 'generate', target_file: 'auth.ts', priority: 1, age_seconds: 5 }
  ]},
  speclang_get_system_stats: { cpu_percent: 25.5, memory_used_mb: 512, memory_total_mb: 2048 }
};

export const handlers = [
  rest.post('/tools/speclang_search', (req, res, ctx) => {
    return res(ctx.json(mockResponses.speclang_search));
  }),
  rest.post('/tools/speclang_get_status', (req, res, ctx) => {
    return res(ctx.json(mockResponses.speclang_get_status));
  }),
  rest.post('/tools/speclang_get_agent_statuses', (req, res, ctx) => {
    return res(ctx.json(mockResponses.speclang_get_agent_statuses));
  }),
  rest.post('/tools/speclang_query_events', (req, res, ctx) => {
    return res(ctx.json(mockResponses.speclang_query_events));
  }),
  rest.post('/tools/speclang_get_project_stats', (req, res, ctx) => {
    return res(ctx.json(mockResponses.speclang_get_project_stats));
  }),
  rest.post('/tools/speclang_get_queue_status', (req, res, ctx) => {
    return res(ctx.json(mockResponses.speclang_get_queue_status));
  }),
  rest.post('/tools/speclang_get_system_stats', (req, res, ctx) => {
    return res(ctx.json(mockResponses.speclang_get_system_stats));
  }),
  rest.post('/tools/speclang_insert_command', (req, res, ctx) => {
    return res(ctx.json({ success: true, command_id: 'cmd-new' }));
  })
];

export const server = setupServer(...handlers);
```

#### 2. Mock SSE Events

```typescript
// tests/mocks/sse-events.ts

export function createMockEventSource() {
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
    emit: (type: string, data: any) => {
      const event = new MessageEvent(type, { data: JSON.stringify(data) });
      listeners.get(type)?.forEach(h => h(event));
    }
  };
}

export const mockEvents = {
  fileChanged: { type: 'file.changed', file: 'specs/auth.spec.md' },
  agentSpawned: { type: 'agent.spawned', agent: 'spec-writer', session_id: 'session-1' },
  agentCompleted: { type: 'agent.completed', agent: 'spec-writer', session_id: 'session-1' },
  cascadeConverged: { type: 'cascade.converged', cascade_id: 'cascade-1', duration_ms: 5000 },
  commandExecuted: { type: 'command.executed', command_id: 'cmd-1', action: 'generate' }
};
```

#### 3. Unit Tests

```typescript
// tests/dashboard/unit/CascadeStatus.test.tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'bun:test';
import { CascadeStatus } from '@/dashboard/components/CascadeStatus';

describe('CascadeStatus', () => {
  it('renders idle status correctly', () => {
    render(<CascadeStatus status="idle" depth={0} filesChanged={[]} timeElapsed={0} />);
    expect(screen.getByText('IDLE')).toBeTruthy();
  });

  it('renders cascading status with metrics', () => {
    render(
      <CascadeStatus 
        status="cascading" 
        depth={3} 
        filesChanged={['auth.spec.md', 'users.spec.md']} 
        timeElapsed={5000} 
      />
    );
    expect(screen.getByText('CASCADING')).toBeTruthy();
    expect(screen.getByText(/Depth: 3/)).toBeTruthy();
    expect(screen.getByText(/Files: 2/)).toBeTruthy();
  });

  it('renders converged status in green', () => {
    render(<CascadeStatus status="converged" depth={5} filesChanged={[]} timeElapsed={10000} />);
    const indicator = screen.getByText('CONVERGED');
    expect(indicator.className).toContain('green');
  });
});

// tests/dashboard/unit/AgentHealth.test.tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'bun:test';
import { AgentHealth } from '@/dashboard/components/AgentHealth';

describe('AgentHealth', () => {
  const mockAgents = [
    { session_id: '1', agent: 'spec-writer', status: 'idle', current_file: null, queue_depth: 0, last_active: '2024-01-15T10:00:00Z' },
    { session_id: '2', agent: 'code-gen', status: 'active', current_file: 'auth.ts', queue_depth: 3, last_active: '2024-01-15T10:05:00Z' },
    { session_id: '3', agent: 'test-writer', status: 'error', current_file: 'users.test.ts', queue_depth: 1, last_active: '2024-01-15T09:55:00Z' }
  ];

  it('renders all agents', () => {
    render(<AgentHealth agents={mockAgents} />);
    expect(screen.getByText('spec-writer')).toBeTruthy();
    expect(screen.getByText('code-gen')).toBeTruthy();
    expect(screen.getByText('test-writer')).toBeTruthy();
  });

  it('shows current file for active agents', () => {
    render(<AgentHealth agents={mockAgents} />);
    expect(screen.getByText('auth.ts')).toBeTruthy();
  });

  it('shows queue depth', () => {
    render(<AgentHealth agents={mockAgents} />);
    expect(screen.getByText(/Queue: 3/)).toBeTruthy();
  });

  it('applies correct status class', () => {
    render(<AgentHealth agents={mockAgents} />);
    const errorCard = screen.getByText('test-writer').closest('.agent-card');
    expect(errorCard?.className).toContain('error');
  });
});

// tests/dashboard/unit/EventTimeline.test.tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'bun:test';
import { EventTimeline } from '@/dashboard/components/EventTimeline';

describe('EventTimeline', () => {
  const mockEvents = [
    { event_id: 1, cascade_id: 'c1', depth: 1, trigger_file: 'auth.spec.md', agent: 'spec-writer', output_files: ['auth.ts'], timestamp: '2024-01-15T10:00:00Z' },
    { event_id: 2, cascade_id: 'c1', depth: 2, trigger_file: 'auth.ts', agent: 'code-gen', output_files: ['auth.test.ts'], timestamp: '2024-01-15T10:01:00Z' }
  ];

  it('renders events in order', () => {
    render(<EventTimeline events={mockEvents} />);
    const events = screen.getAllByTestId('timeline-event');
    expect(events.length).toBe(2);
  });

  it('shows agent name for each event', () => {
    render(<EventTimeline events={mockEvents} />);
    expect(screen.getByText('spec-writer')).toBeTruthy();
    expect(screen.getByText('code-gen')).toBeTruthy();
  });

  it('shows depth indicator', () => {
    render(<EventTimeline events={mockEvents} />);
    expect(screen.getByText(/Depth: 1/)).toBeTruthy();
    expect(screen.getByText(/Depth: 2/)).toBeTruthy();
  });
});
```

#### 4. Integration Tests

```typescript
// tests/dashboard/integration/cascade-control.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { server } from '@/tests/mocks/mcp-server';
import { CascadeControlPanel } from '@/dashboard/components/ControlPanel';

describe('Cascade Control Integration', () => {
  beforeEach(() => server.listen());
  afterEach(() => server.resetHandlers() && server.close());

  it('triggers cascade on button click', async () => {
    render(<CascadeControlPanel />);
    
    const triggerBtn = screen.getByText('TRIGGER');
    fireEvent.click(triggerBtn);
    
    await waitFor(() => {
      expect(screen.getByText(/CASCADING|RUNNING/)).toBeTruthy();
    });
  });

  it('pauses and resumes cascade', async () => {
    render(<CascadeControlPanel />);
    
    fireEvent.click(screen.getByText('TRIGGER'));
    await waitFor(() => screen.getByText('PAUSE'));
    
    fireEvent.click(screen.getByText('PAUSE'));
    await waitFor(() => {
      expect(screen.getByText('RESUME')).toBeTruthy();
    });
  });

  it('aborts with confirmation', async () => {
    window.confirm = () => true;
    render(<CascadeControlPanel />);
    
    fireEvent.click(screen.getByText('TRIGGER'));
    await waitFor(() => screen.getByText('ABORT'));
    
    fireEvent.click(screen.getByText('ABORT'));
    await waitFor(() => {
      expect(screen.getByText('IDLE')).toBeTruthy();
    });
  });

  it('finalizes and commits', async () => {
    window.confirm = () => true;
    render(<CascadeControlPanel />);
    
    fireEvent.click(screen.getByText('TRIGGER'));
    await waitFor(() => screen.getByText('FINALIZE'));
    
    fireEvent.click(screen.getByText('FINALIZE'));
    await waitFor(() => {
      expect(screen.getByText('IDLE')).toBeTruthy();
    });
  });
});

// tests/dashboard/integration/spec-editor.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'bun:test';
import { SpecEditor } from '@/dashboard/components/SpecEditor';

describe('Spec Editor Integration', () => {
  it('creates new spec with dialog', async () => {
    render(<SpecEditor />);
    
    fireEvent.click(screen.getByText('NEW SPEC'));
    
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/id/i)).toBeTruthy();
    });
  });

  it('validates refs on input', async () => {
    render(<SpecEditor />);
    
    const editor = screen.getByRole('textbox');
    fireEvent.change(editor, { target: { value: '@ref:specs/nonexistent' } });
    
    await waitFor(() => {
      expect(screen.getByText(/not found/i)).toBeTruthy();
    });
  });

  it('shows autocomplete for @ref', async () => {
    render(<SpecEditor />);
    
    const editor = screen.getByRole('textbox');
    fireEvent.change(editor, { target: { value: '@ref:auth' } });
    
    await waitFor(() => {
      expect(screen.getByText('@specs/auth')).toBeTruthy();
    });
  });

  it('prevents save on validation errors', async () => {
    render(<SpecEditor />);
    
    const editor = screen.getByRole('textbox');
    fireEvent.change(editor, { target: { value: 'invalid content' } });
    
    fireEvent.click(screen.getByText('SAVE'));
    
    await waitFor(() => {
      expect(screen.getByText(/cannot save/i)).toBeTruthy();
    });
  });
});
```

#### 5. Hook Tests

```typescript
// tests/dashboard/hooks/useSSE.test.ts
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect } from 'bun:test';
import { useSSE } from '@/dashboard/hooks/useSSE';
import { createMockEventSource, mockEvents } from '@/tests/mocks/sse-events';

describe('useSSE', () => {
  it('establishes connection and receives events', () => {
    const mockSource = createMockEventSource();
    
    const { result } = renderHook(() => useSSE('/events', ['file.changed']));
    
    act(() => {
      mockSource.emit('file.changed', mockEvents.fileChanged);
    });
    
    expect(result.current.length).toBe(1);
    expect(result.current[0].type).toBe('file.changed');
  });

  it('batches rapid events', () => {
    const { result } = renderHook(() => useSSE('/events', ['file.changed']));
    
    act(() => {
      for (let i = 0; i < 10; i++) {
        mockSource.emit('file.changed', { file: `file${i}.spec.md` });
      }
    });
    
    expect(result.current.length).toBe(10);
  });

  it('handles connection errors', () => {
    const { result } = renderHook(() => useSSE('/events', ['file.changed']));
    
    act(() => {
      mockSource.emit('error', {});
    });
    
    expect(result.current.isOnline).toBe(false);
  });
});

// tests/dashboard/hooks/useMCPTools.test.ts
import { renderHook } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { server } from '@/tests/mocks/mcp-server';
import { useMCPTools } from '@/dashboard/hooks/useMCPTools';

describe('useMCPTools', () => {
  beforeEach(() => server.listen());
  afterEach(() => server.resetHandlers() && server.close());

  it('queries events successfully', async () => {
    const { result } = renderHook(() => useMCPTools());
    
    const events = await result.current.queryEvents({ limit: 20 });
    
    expect(events.events.length).toBeGreaterThan(0);
  });

  it('gets agent statuses', async () => {
    const { result } = renderHook(() => useMCPTools());
    
    const agents = await result.current.getAgentStatuses({});
    
    expect(agents.agents.length).toBe(2);
  });

  it('handles errors gracefully', async () => {
    server.use(
      rest.post('/tools/speclang_search', (req, res, ctx) => {
        return res(ctx.status(500));
      })
    );
    
    const { result } = renderHook(() => useMCPTools());
    
    await expect(result.current.search({ query: 'test' })).rejects.toThrow();
  });
});
```

#### 6. Accessibility Tests

```typescript
// tests/dashboard/accessibility/a11y.test.tsx
import { render } from '@testing-library/react';
import { describe, it, expect } from 'bun:test';
import { axe } from 'jest-axe';
import { Dashboard } from '@/dashboard/app';
import { CascadeControlPanel } from '@/dashboard/components/ControlPanel';
import { SpecEditor } from '@/dashboard/components/SpecEditor';
import { AgentHealth } from '@/dashboard/components/AgentHealth';

describe('Accessibility', () => {
  it('Dashboard has no violations', async () => {
    const { container } = render(<Dashboard />);
    const results = await axe(container);
    expect(results.violations).toHaveLength(0);
  });

  it('CascadeControlPanel is keyboard accessible', async () => {
    const { container } = render(<CascadeControlPanel />);
    const results = await axe(container, {
      rules: { 'keyboard': { enabled: true } }
    });
    expect(results.violations).toHaveLength(0);
  });

  it('SpecEditor has proper ARIA labels', async () => {
    const { container } = render(<SpecEditor />);
    const results = await axe(container);
    expect(results.violations).toHaveLength(0);
  });

  it('AgentHealth has no color contrast issues', async () => {
    const { container } = render(<AgentHealth agents={[]} />);
    const results = await axe(container, {
      rules: { 'color-contrast': { enabled: true } }
    });
    expect(results.violations).toHaveLength(0);
  });

  it('respects prefers-reduced-motion', () => {
    const { container } = render(<Dashboard />);
    const animations = container.querySelectorAll('[data-animate]');
    animations.forEach(el => {
      expect(el.getAttribute('data-reduce-motion')).toBe('true');
    });
  });
});
```

#### 7. E2E Tests

```typescript
// tests/e2e/dashboard.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
  });

  test('displays cascade status', async ({ page }) => {
    const status = page.locator('.cascade-status');
    await expect(status).toContainText(/IDLE|CASCADING|CONVERGED/);
  });

  test('shows agent health cards', async ({ page }) => {
    const agents = page.locator('.agent-card');
    await expect(agents.first()).toBeVisible();
  });

  test('event timeline updates', async ({ page }) => {
    const events = page.locator('.timeline-event');
    const count = await events.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });
});

// tests/e2e/cascade-control.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Cascade Control', () => {
  test('triggers cascade from UI', async ({ page }) => {
    await page.goto('/dashboard');
    
    await page.click('button:has-text("TRIGGER")');
    
    await expect(page.locator('.cascade-status')).toContainText('CASCADING');
  });

  test('pauses and resumes cascade', async ({ page }) => {
    await page.goto('/dashboard');
    
    await page.click('button:has-text("TRIGGER")');
    await page.click('button:has-text("PAUSE")');
    
    await expect(page.locator('.status-indicator')).toContainText('PAUSED');
    
    await page.click('button:has-text("RESUME")');
    await expect(page.locator('.status-indicator')).toContainText('RUNNING');
  });

  test('aborts with confirmation', async ({ page }) => {
    await page.goto('/dashboard');
    
    await page.click('button:has-text("TRIGGER")');
    
    page.on('dialog', dialog => dialog.accept());
    await page.click('button:has-text("ABORT")');
    
    await expect(page.locator('.cascade-status')).toContainText('IDLE');
  });
});

// tests/e2e/spec-editing.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Spec Editing', () => {
  test('creates new spec', async ({ page }) => {
    await page.goto('/dashboard');
    
    await page.click('button:has-text("NEW SPEC")');
    
    await page.fill('input[placeholder*="id"]', '@specs/new-feature');
    await page.fill('input[placeholder*="layer"]', '3');
    
    await page.click('button:has-text("CREATE")');
    
    await expect(page.locator('.spec-editor')).toBeVisible();
  });

  test('autocomplete shows @ref suggestions', async ({ page }) => {
    await page.goto('/dashboard');
    await page.click('button:has-text("NEW SPEC")');
    await page.click('button:has-text("CREATE")');
    
    await page.type('.editor-textarea', '@ref:auth');
    
    await expect(page.locator('.autocomplete-menu')).toBeVisible();
    await expect(page.locator('.autocomplete-item')).toContainText('@specs/auth');
  });
});
```

### Test Configuration

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      threshold: {
        'src/dashboard/**': 80
      }
    }
  }
});

// playwright.config.ts
export default defineConfig({
  testDir: './tests/e2e',
  use: {
    baseURL: 'http://localhost:5173',
    screenshot: 'only-on-failure'
  },
  webServer: {
    command: 'bun run dev',
    port: 5173
  }
});
```

## Test Cases
1. All unit tests pass with 80% coverage
2. Integration tests verify MCP communication
3. Hook tests cover state management
4. Accessibility tests pass axe-core
5. E2E tests cover key user journeys
6. Performance metrics tracked

## Validation
```bash
# Run unit tests
bun test tests/dashboard/unit/ --coverage

# Run integration tests
bun test tests/dashboard/integration/

# Run accessibility tests
bun test tests/dashboard/accessibility/

# Run E2E tests
bunx playwright test

# Run all with coverage report
bun test --coverage
```

## Output Format
After completing, output:
1. Test files created
2. Coverage percentage
3. Accessibility violations (should be 0)
4. E2E test results
