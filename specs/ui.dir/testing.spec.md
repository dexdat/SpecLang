# speclang-header lines:10
id: "@speclang/ui.testing"
parent: "@ref:specs/ui"
part: 13/14
siblings:
  prev: "@ref:specs/ui.dir/state-management"
  next: "@ref:specs/mcp-ui-tools"
short: Testing strategy and specifications for UI components
---

## Testing Strategy

UI components follow the testing specifications defined in @ref:specs/test-specs.

### Component Testing Levels

```speclang
# @block:ui/testing/levels @kind:entity
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

```speclang
# @block:ui/testing/mock-mcp @kind:code
```typescript
// Mock MCP server for testing
import { setupServer } from 'msw/node';
import { rest } from 'msw';

const handlers = [
  rest.post('/tools/speclang_search', (req, res, ctx) => {
    return res(ctx.json({ results: [] }));
  }),
  rest.post('/tools/speclang_get_status', (req, res, ctx) => {
    return res(ctx.json({ active: false, depth: 0 }));
  }),
];

export const server = setupServer(...handlers);
```
```

### Accessibility Testing

All components must pass accessibility audits using axe-core.

### Performance Testing

Component performance metrics tracked via React Profiler.

### Continuous Integration

Tests run on every commit via GitHub Actions.

---

*See component-specific test specifications in each component spec.*