# speclang-header lines:7
id: "@speclang/roadmap/poc/event-routing"
parent: "@ref:specs/roadmap/pocversion: 0.1.0
layer: 2
short: "Simple event routing for POC - direct to single agent"
tags: [poc, routing, simple]
---

# POC: Event Routing (Simplified)

Direct file change events to the SimpleAgent. **No multi-agent routing for POC.**

## Simplified Routing

### @poc/routing/simple

**POC Approach:**
- All file changes → SimpleAgent
- No agent selection logic needed
- No queues (process synchronously)
- Direct function call

**Flow:**
```
FileWatcher detects change
    ↓
EventRouter receives event
    ↓
Direct call to SimpleAgent.onFileChanged()
    ↓
SimpleAgent processes
```

## Implementation

### @poc/routing/impl

```typescript
import { SimpleAgent } from './simple-agent';
import { FileEvent } from './types';

export class EventRouter {
  private agent: SimpleAgent;
  
  constructor(agent: SimpleAgent) {
    this.agent = agent;
  }
  
  async route(event: FileEvent): Promise<void> {
    // POC: All events go to the single agent
    console.log(`[Router] Routing ${event.path} to SimpleAgent`);
    try {
      await this.agent.onFileChanged(event);
    } catch (error) {
      console.error(`[Router] Failed to process ${event.path}:`, error);
      // POC: Just log and continue
      // MVP: Retry logic, error reporting, etc.
      throw error; // Re-throw so caller knows it failed
    }
  }
}
```

## Why Simple?

**Multi-agent routing is MVP complexity.**

For POC, we just need to prove:
- ✅ File changes are detected
- ✅ An agent processes them
- ✅ Code gets generated

**MVP will add:**
- Agent selection based on spec header
- Multiple agent types
- Queue management
- Load balancing

## Edge Cases (POC)

- **No header**: Still process (SimpleAgent handles)
- **Parse error**: Log error, skip
- **Agent busy**: Wait (synchronous in POC)
