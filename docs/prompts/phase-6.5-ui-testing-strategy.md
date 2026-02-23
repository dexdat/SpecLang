# Bootstrap Phase 6.5: UI Testing Strategy

## Context
You are building SpecLang - a reactive multi-agent system where specs self-assemble into code. This is Phase 6.5 of the bootstrap process.

**Prerequisites**: Phase 6.1-6.4 (UI Dashboard, Components, State) complete.

## Your Task
Implement comprehensive testing strategy for UI components including unit tests, integration tests, E2E tests, and accessibility testing.

## Read These Specs First
1. `specs/ui.spec.md` - UI specification overview
2. `specs/ui.spec.dir/testing.spec.md` - Testing strategy spec
3. `specs/ui.spec.dir/components/*.spec.md` - Component specs
4. `specs/test-specs.spec.md` - Test specifications

## What to Build

### Files to Create
```
tests/
├── ui/
│   ├── components/
│   │   ├── components.test.tsx
│   │   ├── agent-health-grid.test.tsx
│   │   ├── cascade-graph.test.tsx
│   │   ├── control-panel.test.tsx
│   │   ├── log-viewer.test.tsx
│   │   ├── queue-depth.test.tsx
│   │   └── system-metrics.test.tsx
│   ├── integration/
│   │   ├── dashboard.test.tsx
│   │   └── cascade-flow.test.tsx
│   ├── e2e/
│   │   ├── spec-editing.spec.ts
│   │   ├── cascade-control.spec.ts
│   │   └── monitoring.spec.ts
│   └── setup/
│       ├── setup.ts
│       ├── mock-server.ts
│       └── fixtures/
│           ├── agents.json
│           ├── cascade.json
│           └── metrics.json
├── test-utils/
│   ├── render.tsx
│   ├── mock-hooks.ts
│   └── assertions.ts
└── playwright.config.ts
```

### Test Configuration

```typescript
// playwright.config.ts

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/ui/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
  webServer: {
    command: 'bun run src/ui/server.ts',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

### Unit Test Setup

```typescript
// tests/ui/setup/setup.ts

import '@testing-library/jest-dom';
import { setGlobalWindow } from '@vitest/browser';

// Mock WebSocket for SSE
class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;
  
  readyState = MockWebSocket.OPEN;
  onmessage: ((event: { data: string }) => void) | null = null;
  
  send(data: string) {}
  close() {}
  
  static setMockResponse(cb: (data: string) => void) {
    const ws = new MockWebSocket();
    setTimeout(() => {
      ws.onmessage?.({ data: cb('{}') });
    }, 100);
  }
}

// @ts-ignore
global.WebSocket = MockWebSocket;

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};
```

### Test Utilities

```typescript
// tests/test-utils/render.tsx

import React, { ReactElement, ReactNode } from 'react';
import { render as rtlRender, RenderOptions, RenderResult } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';

interface WrapperProps {
  children: ReactNode;
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      gcTime: 0,
    },
  },
});

function Wrapper({ children }: WrapperProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );
}

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  route?: string;
}

function render(
  ui: ReactElement,
  { route = '/', ...options }: CustomRenderOptions = {}
): RenderResult {
  window.history.pushState({}, 'Test', route);
  
  return rtlRender(ui, { wrapper: Wrapper, ...options });
}

export * from '@testing-library/react';
export { render };
```

### Component Unit Tests

```typescript
// tests/ui/components/agent-health-grid.test.tsx

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within, userEvent, waitFor } from '../test-utils/render';
import { AgentHealthGrid } from '../../../src/ui/components/agent-health-grid';
import type { AgentStatus } from '../../../src/ui/components/agent-health-grid';

const mockAgents: AgentStatus[] = [
  {
    id: 'agent-1',
    type: 'spec-writer',
    status: 'active',
    currentFile: 'specs/auth.spec.md',
    queueDepth: 3,
    uptimeSeconds: 3600,
    lastActive: new Date().toISOString(),
    performance: {
      processingTimeAvg: 150,
      successRate: 0.95,
      errorCount: 2,
    },
    sessionId: 'session-1',
  },
  {
    id: 'agent-2',
    type: 'code-gen',
    status: 'idle',
    currentFile: null,
    queueDepth: 0,
    uptimeSeconds: 7200,
    lastActive: new Date(Date.now() - 3600000).toISOString(),
    performance: {
      processingTimeAvg: 200,
      successRate: 0.98,
      errorCount: 0,
    },
    sessionId: 'session-2',
  },
  {
    id: 'agent-3',
    type: 'test-writer',
    status: 'error',
    currentFile: 'tests/auth.test.ts',
    queueDepth: 5,
    uptimeSeconds: 1800,
    lastActive: new Date(Date.now() - 60000).toISOString(),
    performance: {
      processingTimeAvg: 500,
      successRate: 0.7,
      errorCount: 10,
    },
    sessionId: 'session-3',
  },
];

describe('AgentHealthGrid', () => {
  const defaultProps = {
    agents: mockAgents,
    agentTypes: ['spec-writer', 'code-gen', 'test-writer', 'north-star'],
    filterByType: null,
    filterByStatus: null,
    searchQuery: '',
    onAgentClick: vi.fn(),
    onRestartAgent: vi.fn(),
    onPauseAgent: vi.fn(),
    onDebugAgent: vi.fn(),
    onFilterChange: vi.fn(),
    autoRefresh: false,
    refreshInterval: 5000,
    showHeatmap: false,
    compactView: false,
    isLoading: false,
    error: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all agents', () => {
    render(<AgentHealthGrid {...defaultProps} />);
    
    expect(screen.getByText('spec-writer')).toBeInTheDocument();
    expect(screen.getByText('code-gen')).toBeInTheDocument();
    expect(screen.getByText('test-writer')).toBeInTheDocument();
  });

  it('displays correct status indicators', () => {
    render(<AgentHealthGrid {...defaultProps} />);
    
    const activeCards = screen.getAllByText('active');
    const idleCards = screen.getAllByText('idle');
    const errorCards = screen.getAllByText('error');
    
    expect(activeCards.length).toBeGreaterThan(0);
    expect(idleCards.length).toBeGreaterThan(0);
    expect(errorCards.length).toBeGreaterThan(0);
  });

  it('filters by agent type', () => {
    const handleFilterChange = vi.fn();
    render(
      <AgentHealthGrid
        {...defaultProps}
        filterByType="spec-writer"
        onFilterChange={handleFilterChange}
      />
    );
    
    // Only spec-writer agents should be visible
    expect(screen.getByText('spec-writer')).toBeInTheDocument();
    expect(screen.queryByText('code-gen')).not.toBeInTheDocument();
  });

  it('filters by status', () => {
    render(
      <AgentHealthGrid
        {...defaultProps}
        filterByStatus={['active', 'error']}
      />
    );
    
    // Should show active and error agents
    expect(screen.getAllByText('active').length).toBeGreaterThan(0);
    expect(screen.getAllByText('error').length).toBeGreaterThan(0);
  });

  it('searches agents by name', () => {
    render(
      <AgentHealthGrid
        {...defaultProps}
        searchQuery="auth"
      />
    );
    
    // Agent working on auth.spec.md should be visible
    expect(screen.getByText('specs/auth.spec.md')).toBeInTheDocument();
  });

  it('calls onAgentClick when card is clicked', async () => {
    const user = userEvent.setup();
    const onAgentClick = vi.fn();
    
    render(<AgentHealthGrid {...defaultProps} onAgentClick={onAgentClick} />);
    
    const firstCard = screen.getAllByRole('gridcell')[0];
    await user.click(firstCard);
    
    expect(onAgentClick).toHaveBeenCalled();
  });

  it('expands card on click', async () => {
    const user = userEvent.setup();
    
    render(<AgentHealthGrid {...defaultProps} />);
    
    const firstCard = screen.getAllByRole('gridcell')[0];
    await user.click(firstCard);
    
    // Should show expanded details
    expect(screen.getByText(/Avg Time/)).toBeInTheDocument();
  });

  it('shows loading skeleton when loading', () => {
    render(<AgentHealthGrid {...defaultProps} isLoading={true} agents={[]} />);
    
    expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument();
  });

  it('shows error state', () => {
    const error = new Error('Failed to load agents');
    render(<AgentHealthGrid {...defaultProps} error={error} />);
    
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(/Error loading agents/)).toBeInTheDocument();
  });

  it('shows empty state when no agents match filters', () => {
    render(
      <AgentHealthGrid
        {...defaultProps}
        filterByStatus={['nonexistent']}
      />
    );
    
    expect(screen.getByText(/No agents match the current filters/)).toBeInTheDocument();
  });

  it('handles restart action', async () => {
    const user = userEvent.setup();
    const onRestartAgent = vi.fn().mockResolvedValue(undefined);
    
    render(<AgentHealthGrid {...defaultProps} onRestartAgent={onRestartAgent} />);
    
    // Expand first card
    const firstCard = screen.getAllByRole('gridcell')[0];
    await user.click(firstCard);
    
    // Click restart button
    const restartButton = screen.getByRole('button', { name: /Restart/ });
    await user.click(restartButton);
    
    expect(onRestartAgent).toHaveBeenCalled();
  });

  it('shows compact view correctly', () => {
    render(<AgentHealthGrid {...defaultProps} compactView={true} />);
    
    const container = screen.getByRole('grid');
    expect(container).toHaveClass('compact');
  });
});
```

### Integration Tests

```typescript
// tests/ui/integration/dashboard.test.tsx

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '../test-utils/render';
import { Dashboard } from '../../../src/ui/pages/Dashboard';
import { server } from '../setup/mock-server';

describe('Dashboard Integration', () => {
  beforeEach(() => {
    server.listen();
  });

  afterEach(() => {
    server.close();
  });

  it('loads all dashboard components', async () => {
    render(<Dashboard />);
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByTestId('agent-health-grid')).toBeInTheDocument();
    });
    
    expect(screen.getByTestId('cascade-graph')).toBeInTheDocument();
    expect(screen.getByTestId('control-panel')).toBeInTheDocument();
    expect(screen.getByTestId('queue-depth')).toBeInTheDocument();
  });

  it('updates cascade status in real-time', async () => {
    const { rerender } = render(<Dashboard />);
    
    // Initial state
    await waitFor(() => {
      expect(screen.getByText(/CASCADE ACTIVE/)).toBeInTheDocument();
    });
    
    // Simulate SSE event
    const sseEvent = new MessageEvent('message', {
      data: JSON.stringify({ type: 'cascade_converged' }),
    });
    window.dispatchEvent(sseEvent);
    
    // Should update to converged state
    await waitFor(() => {
      expect(screen.getByText(/CONVERGED/)).toBeInTheDocument();
    });
  });

  it('navigates between views', async () => {
    const user = userEvent.setup();
    render(<Dashboard />);
    
    // Click on different tabs
    await user.click(screen.getByRole('tab', { name: /Agents/ }));
    expect(screen.getByTestId('agent-health-grid')).toBeInTheDocument();
    
    await user.click(screen.getByRole('tab', { name: /Cascade/ }));
    expect(screen.getByTestId('cascade-graph')).toBeInTheDocument();
  });
});
```

### E2E Tests

```typescript
// tests/ui/e2e/cascade-control.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Cascade Control', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('can trigger a new cascade', async ({ page }) => {
    // Click trigger cascade button
    await page.click('button:has-text("TRIGGER CASCADE")');
    
    // Wait for confirmation dialog
    await expect(page.locator('.confirmation-dialog')).toBeVisible();
    
    // Confirm
    await page.click('button:has-text("Confirm")');
    
    // Should show cascade active
    await expect(page.locator('.status')).toContainText('CASCADE ACTIVE');
  });

  test('can pause and resume cascade', async ({ page }) => {
    // Wait for active cascade
    await expect(page.locator('.status')).toContainText('CASCADE ACTIVE');
    
    // Click pause
    await page.click('button:has-text("PAUSE")');
    
    // Should show paused state
    await expect(page.locator('.status')).toContainText('PAUSED');
    
    // Click resume
    await page.click('button:has-text("RESUME")');
    
    // Should be active again
    await expect(page.locator('.status')).toContainText('CASCADE ACTIVE');
  });

  test('can abort cascade', async ({ page }) => {
    // Wait for active cascade
    await page.waitForSelector('button:has-text("ABORT")');
    
    // Click abort
    await page.click('button:has-text("ABORT")');
    
    // Wait for confirmation
    await expect(page.locator('.confirmation-dialog')).toContainText('Abort cascade?');
    
    // Confirm abort
    await page.click('button.destructive:has-text("Confirm")');
    
    // Should show idle state
    await expect(page.locator('.status')).toContainText('IDLE');
  });

  test('shows warning before destructive actions', async ({ page }) => {
    // Enable destructive confirmation
    await page.click('button:has-text("SETTINGS")');
    await page.check('input[name="confirmDestructiveActions"]');
    await page.click('button:has-text("Save")');
    
    // Try to abort
    await page.click('button:has-text("ABORT")');
    
    // Should show confirmation dialog
    await expect(page.locator('.confirmation-dialog')).toBeVisible();
  });
});

test.describe('Agent Monitoring', () => {
  test('displays agent health correctly', async ({ page }) => {
    await page.goto('/agents');
    
    // Should show agent cards
    const agentCards = await page.locator('.agent-card').count();
    expect(agentCards).toBeGreaterThan(0);
  });

  test('can filter agents by type', async ({ page }) => {
    await page.goto('/agents');
    
    // Select filter
    await page.selectOption('select[aria-label="Filter by type"]', 'spec-writer');
    
    // Should only show spec-writer agents
    await expect(page.locator('.agent-card:has-text("spec-writer")')).toHaveCount(1);
  });

  test('can restart an agent', async ({ page }) => {
    await page.goto('/agents');
    
    // Expand first card
    await page.locator('.agent-card').first().click();
    
    // Click restart
    await page.click('button:has-text("Restart")');
    
    // Should show restarting state
    await expect(page.locator('button:has-text("Restarting...")')).toBeVisible();
  });
});
```

### Accessibility Tests

```typescript
// tests/ui/accessibility/a11y.test.tsx

import { describe, it, expect } from 'vitest';
import { render } from '../test-utils/render';
import { AgentHealthGrid } from '../../../src/ui/components/agent-health-grid';

describe('Accessibility', () => {
  it('AgentHealthGrid has proper ARIA roles', () => {
    render(<AgentHealthGrid {...defaultProps} />);
    
    const grid = screen.getByRole('grid');
    expect(grid).toHaveAttribute('aria-label', 'Agent health status');
  });

  it('passes axe-core accessibility audit', async () => {
    const { container } = render(<AgentHealthGrid {...defaultProps} />);
    
    const results = await axe(container);
    
    expect(results.violations.length).toBe(0);
  });

  it('has keyboard navigation', async () => {
    const user = userEvent.setup();
    render(<AgentHealthGrid {...defaultProps} />);
    
    // Focus first card
    const firstCard = screen.getAllByRole('gridcell')[0];
    firstCard.focus();
    expect(firstCard).toHaveFocus();
    
    // Tab to next card
    await user.keyboard('{Tab}');
    
    const secondCard = screen.getAllByRole('gridcell')[1];
    expect(secondCard).toHaveFocus();
  });

  it('can expand card with keyboard', async () => {
    const user = userEvent.setup();
    render(<AgentHealthGrid {...defaultProps} />);
    
    const firstCard = screen.getAllByRole('gridcell')[0];
    firstCard.focus();
    
    // Press Enter to expand
    await user.keyboard('{Enter}');
    
    expect(screen.getByText(/Avg Time/)).toBeInTheDocument();
  });

  it('has sufficient color contrast', async () => {
    const { container } = render(<AgentHealthGrid {...defaultProps} />);
    
    const results = await axe(container, {
      rules: {
        'color-contrast': { enabled: true },
      },
    });
    
    const contrastViolations = results.violations.filter(
      v => v.id === 'color-contrast'
    );
    
    expect(contrastViolations.length).toBe(0);
  });
});
```

### Mock Server

```typescript
// tests/ui/setup/mock-server.ts

import { setupServer } from 'msw/node';
import { rest } from 'msw';

export const server = setupServer(
  rest.get('/api/agents', (req, res, ctx) => {
    return res(ctx.json({
      agents: [
        {
          id: 'agent-1',
          type: 'spec-writer',
          status: 'active',
          currentFile: 'specs/auth.spec.md',
          queueDepth: 3,
          uptimeSeconds: 3600,
        },
      ],
    }));
  }),

  rest.get('/api/cascade/status', (req, res, ctx) => {
    return res(ctx.json({
      active: true,
      converged: false,
      depth: 5,
      filesChanged: 12,
    }));
  }),

  rest.get('/api/queue/depth', (req, res, ctx) => {
    return res(ctx.json({
      current: 5,
      max: 100,
    }));
  }),

  rest.post('/api/cascade/trigger', (req, res, ctx) => {
    return res(ctx.json({ success: true, cascadeId: 'cascade-123' }));
  }),

  rest.post('/api/cascade/pause', (req, res, ctx) => {
    return res(ctx.json({ success: true }));
  }),

  rest.post('/api/cascade/resume', (req, res, ctx) => {
    return res(ctx.json({ success: true }));
  }),

  rest.post('/api/cascade/abort', (req, res, ctx) => {
    return res(ctx.json({ success: true }));
  }),
);
```

### Test Fixtures

```json
// tests/ui/setup/fixtures/agents.json
{
  "agents": [
    {
      "id": "agent-1",
      "type": "spec-writer",
      "status": "active",
      "currentFile": "specs/auth.spec.md",
      "queueDepth": 3,
      "uptimeSeconds": 3600,
      "lastActive": "2024-01-15T10:30:00Z",
      "performance": {
        "processingTimeAvg": 150,
        "successRate": 0.95,
        "errorCount": 2
      }
    }
  ]
}
```

## Test Cases
1. All components render correctly
2. Filtering works for type/status/search
3. Click handlers fire correctly
4. Loading states display
5. Error states handle
6. Empty states show
7. Integration tests pass
8. E2E flows work
9. Accessibility standards met
10. Performance acceptable

## Validation
```bash
# Unit tests
bun test tests/ui/components/

# Integration tests
bun test tests/ui/integration/

# E2E tests
bun playwright test

# Accessibility
bun playwright test tests/ui/accessibility/
```

## Output Format
After completing, output:
1. Test configuration files
2. Test utilities
3. Unit tests for each component
4. Integration tests
5. E2E tests
6. Accessibility tests
7. Mock server and fixtures
8. Test results
