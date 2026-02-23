---
name: sip-061-ui-testing-speclang-v0
title: "SIP 61: UI Testing"
version: 0.1.0
description: Testing strategy and patterns for Speclang UI components
category: standard
---

# SIP 61: UI Testing

**Status:** Draft  
**Version:** 0.1.0  
**Author:** Speclang Core Team

## README

This SIP defines the testing strategy and patterns for Speclang UI components.

### Quick Start

1. **Unit Tests:** Jest + React Testing Library, 80% coverage
2. **Integration Tests:** MSW for MCP mocking
3. **E2E Tests:** Playwright for user journeys
4. **Accessibility:** axe-core audits

### Example

```typescript
// Unit test
describe('CascadeControls', () => {
  it('triggers cascade on button click', async () => {
    render(<CascadeControls />);
    await userEvent.click(screen.getByText('Trigger'));
    expect(mockMCP.insertCommand).toHaveBeenCalledWith({ action: 'trigger' });
  });
});
```

### Key Concepts

- **Testing Levels:** Unit, Integration, E2E
- **MSW:** Mock Service Worker for API mocking
- **Accessibility:** WCAG compliance testing
- **Performance:** React Profiler metrics

### When to Read This

- **Writing Tests:** Understanding test patterns
- **CI Setup:** Configuring test pipeline
- **Debugging:** Test troubleshooting

### Related SIPs

- SIP 36: UI
- SIP 24: Test Specs
- SIP 60: UI Interactions

## Abstract

This SIP defines the testing strategy for Speclang UI, including unit tests, integration tests, E2E tests, accessibility testing, and performance testing.

## Motivation

UI needs:
- Reliable component behavior
- Regression prevention
- Accessibility compliance
- Performance monitoring

## Rationale

**Testing Pyramid:**

```
     /\
    /E2E\     Key journeys
   /------\
  /Integration\  Critical paths
 /------------\
/   Unit Tests  \  80% coverage
-----------------
```

**Benefits:**
- Fast feedback
- Regression protection
- Accessibility compliance
- Performance tracking

## Specification

### Testing Levels

**@ui/testing/levels:**

```speclang
TestingLevels:
  unit_tests:
    scope: Individual React components
    tools: Jest + React Testing Library
    coverage: 80% minimum
    focus: Rendering, props, state changes
  
  integration_tests:
    scope: Component interactions with stores/services
    tools: Jest + MSW (Mock Service Worker)
    coverage: Critical paths only
    focus: MCP integration, state management flows
  
  e2e_tests:
    scope: Full user workflows
    tools: Playwright
    coverage: Key user journeys
    focus: Cascade control, spec editing, monitoring
```

### Test Specifications per Component

Each UI component includes `test_specifications` block with detailed requirements (see individual component specs).

### Mock MCP Server

**@ui/testing/mock-mcp:**

```typescript
import { setupServer } from 'msw/node';
import { rest } from 'msw';

const handlers = [
  rest.post('/tools/speclang_search', (req, res, ctx) => {
    return res(ctx.json({ results: [] }));
  }),
  rest.post('/tools/speclang_get_status', (req, res, ctx) => {
    return res(ctx.json({ active: false, depth: 0 }));
  }),
  rest.post('/tools/speclang_insert_command', (req, res, ctx) => {
    return res(ctx.json({ success: true }));
  }),
  rest.post('/tools/speclang_get_spec', (req, res, ctx) => {
    return res(ctx.json({ 
      id: '@test/spec',
      content: '# Test spec content'
    }));
  }),
];

export const server = setupServer(...handlers);
```

### Accessibility Testing

All components must pass accessibility audits using axe-core.

### Performance Testing

Component performance metrics tracked via React Profiler.

### Continuous Integration

Tests run on every commit via GitHub Actions.

## Implementation

### Unit Test Setup

```typescript
// jest.config.js
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};

// jest.setup.ts
import '@testing-library/jest-dom';
import { server } from './mocks/server';

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

### Component Unit Tests

```typescript
// CascadeControls.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CascadeControls } from './CascadeControls';
import { useCascadeStore } from '@/stores/cascadeStore';

jest.mock('@/stores/cascadeStore');
jest.mock('@/services/mcpClient');

describe('CascadeControls', () => {
  beforeEach(() => {
    (useCascadeStore as jest.Mock).mockReturnValue({
      active: false,
      depth: 0,
    });
  });

  it('renders trigger button when inactive', () => {
    render(<CascadeControls />);
    expect(screen.getByText('Trigger')).toBeInTheDocument();
  });

  it('renders pause and finalize buttons when active', () => {
    (useCascadeStore as jest.Mock).mockReturnValue({
      active: true,
      depth: 3,
    });
    render(<CascadeControls />);
    expect(screen.getByText('Pause')).toBeInTheDocument();
    expect(screen.getByText('Finalize')).toBeInTheDocument();
  });

  it('calls trigger on button click', async () => {
    const mockTrigger = jest.fn();
    render(<CascadeControls onTrigger={mockTrigger} />);
    await userEvent.click(screen.getByText('Trigger'));
    expect(mockTrigger).toHaveBeenCalled();
  });

  it('requires confirmation for abort', async () => {
    (useCascadeStore as jest.Mock).mockReturnValue({ active: true });
    render(<CascadeControls />);
    await userEvent.click(screen.getByText('Abort'));
    expect(screen.getByText('Confirm Abort')).toBeInTheDocument();
  });
});
```

### Integration Tests

```typescript
// CascadeFlow.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { rest } from 'msw';
import { server } from '@/mocks/server';
import { App } from '@/App';

describe('Cascade Flow Integration', () => {
  it('triggers cascade and shows updates', async () => {
    server.use(
      rest.post('/tools/speclang_insert_command', (req, res, ctx) => {
        return res(ctx.json({ success: true }));
      }),
      rest.post('/tools/speclang_get_status', (req, res, ctx) => {
        return res(ctx.json({ active: true, depth: 1 }));
      })
    );

    render(<App />);
    
    await userEvent.click(screen.getByText('Trigger'));
    
    await waitFor(() => {
      expect(screen.getByText(/cascade active/i)).toBeInTheDocument();
    });
  });

  it('handles offline gracefully', async () => {
    server.use(
      rest.post('/tools/speclang_insert_command', (req, res, ctx) => {
        return res.networkError('Failed to connect');
      })
    );

    render(<App />);
    
    await userEvent.click(screen.getByText('Trigger'));
    
    await waitFor(() => {
      expect(screen.getByText(/offline/i)).toBeInTheDocument();
    });
  });
});
```

### E2E Tests with Playwright

```typescript
// e2e/cascade.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Cascade Control', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('trigger and complete cascade', async ({ page }) => {
    await page.click('text=Trigger');
    await expect(page.locator('.cascade-status')).toContainText('Active');
    
    await page.click('text=Finalize');
    await page.click('text=Confirm');
    
    await expect(page.locator('.toast')).toContainText('Committed');
  });

  test('abort cascade with rollback', async ({ page }) => {
    await page.click('text=Trigger');
    await expect(page.locator('.cascade-status')).toContainText('Active');
    
    await page.click('text=Abort');
    await page.click('text=Confirm Abort');
    
    await expect(page.locator('.toast')).toContainText('Rolled back');
  });
});

test.describe('Spec Editing', () => {
  test('create new spec', async ({ page }) => {
    await page.click('text=New Spec');
    await page.fill('#spec-id', '@test/new-spec');
    await page.click('text=Create');
    
    await expect(page.locator('.editor')).toBeVisible();
    await expect(page.locator('.spec-content')).toContainText('@test/new-spec');
  });

  test('autocomplete references', async ({ page }) => {
    await page.click('text=test.spec');
    await page.click('.editor');
    await page.keyboard.type('@ref:');
    
    await expect(page.locator('.autocomplete')).toBeVisible();
  });
});
```

### Accessibility Tests

```typescript
// a11y.test.tsx
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { CascadeControls } from './CascadeControls';

expect.extend(toHaveNoViolations);

describe('Accessibility', () => {
  it('CascadeControls has no violations', async () => {
    const { container } = render(<CascadeControls />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('SpecEditor has no violations', async () => {
    const { container } = render(<SpecEditor />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
```

### Performance Tests

```typescript
// performance.test.tsx
import { render, screen } from '@testing-library/react';
import { Profiler } from 'react';
import { EventList } from './EventList';

describe('Performance', () => {
  it('EventList renders 1000 items in under 100ms', () => {
    const events = Array.from({ length: 1000 }, (_, i) => ({
      id: i,
      type: 'cascade.event',
      timestamp: Date.now(),
    }));

    const onRender = jest.fn((id, phase, actualDuration) => {
      expect(actualDuration).toBeLessThan(100);
    });

    render(
      <Profiler id="EventList" onRender={onRender}>
        <EventList events={events} />
      </Profiler>
    );

    expect(screen.getAllByRole('listitem')).toHaveLength(1000);
  });
});
```

### Test Utilities

```typescript
// test-utils.tsx
import { render, RenderOptions } from '@testing-library/react';
import { ReactElement } from 'react';
import { StoreProvider } from '@/providers/StoreProvider';

const AllProviders = ({ children }: { children: React.ReactNode }) => (
  <StoreProvider>{children}</StoreProvider>
);

export const renderWithProviders = (
  ui: ReactElement,
  options?: RenderOptions
) => render(ui, { wrapper: AllProviders, ...options });

export const mockStore = (state: Partial<CascadeState>) => {
  (useCascadeStore as jest.Mock).mockReturnValue(state);
};
```

## Configuration

**Test Config:**

```yaml
testing:
  unit:
    coverage: 80%
    timeout: 5000ms
  integration:
    coverage: critical-paths
    timeout: 10000ms
  e2e:
    browser: chromium
    timeout: 30000ms
  accessibility:
    rules: wcag2aa
```

## References

- @ref:specs/ui.spec.dir/testing
- SIP 36: UI
- SIP 24: Test Specs
- SIP 60: UI Interactions

## Copyright

This document is in the public domain.
