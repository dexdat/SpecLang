# Bootstrap Phase 0.7: Deployment Modes

## Context
You are building SpecLang - a reactive multi-agent system where specs self-assemble into code. This is Phase 0.7 of the bootstrap process.

**Prerequisites**: 
- Phase 0.1 (SQLite Database) complete
- Phase 0.2 (Header Parser) complete
- Phase 0.3 (Indexer) complete
- Phase 0.4 (Workflow) complete
- Phase 0.5 (Config) complete
- Phase 0.6 (Directory Structure) complete

## Your Task
Implement the deployment mode system with light (OpenCode only) and enterprise (with MCP daemon) profiles.

## Read These Specs First
1. `specs/deployment.spec.md` - Main deployment overview
2. `specs/deployment.spec.dir/light.spec.md` - Light mode details
3. `specs/deployment.spec.dir/enterprise.spec.md` - Enterprise mode details

## What to Build

### Files to Create
```
src/deployment/
├── index.ts            # Main deployment module
├── modes.ts            # Light and Enterprise mode types
├── switcher.ts         # Mode switching logic
├── light.ts            # Light mode implementation
├── enterprise.ts       # Enterprise mode implementation
├── detector.ts         # Auto-detect recommended mode
└── feature-flags.ts    # Feature flag system

tests/
└── deployment.test.ts  # Deployment tests
```

### Requirements

#### 1. Mode Selection
```bash
speclang init --mode=light       # Minimal setup
speclang init --mode=enterprise  # Full observability
```

#### 2. Light Mode (from light.spec.md)
```typescript
interface LightMode {
  start: "speclang init --mode=light";
  
  components: [
    "OpenCode server (opencode serve --mode=build)",
    "Speclang plugin (hooks into OpenCode events)"
  ];
  
  file_watching: {
    provider: "OpenCode native";
    events: ["file.edited", "agent.finished", "session.idle"];
    latency: "~100ms";
  };
  
  features: [
    "cascade triggering",
    "convergence detection",
    "per-file commits",
    "basic pipeline"
  ];
  
  limitations: [
    "no queue visibility",
    "no worktree isolation",
    "no agent control commands"
  ];
}
```

#### 3. Enterprise Mode (from enterprise.spec.md)
```typescript
interface EnterpriseMode {
  start: "speclang init --mode=enterprise";
  
  components: [
    "OpenCode server (opencode serve --mode=build)",
    "Speclang plugin",
    "speclangd MCP daemon"
  ];
  
  file_watching: {
    provider: "speclangd (inotify)";
    events: "HTTP/SSE stream";
    latency: "~10ms";
  };
  
  extra_features: [
    "queue visibility (pending files count)",
    "worktree isolation (test while building)",
    "agent control (pause/resume/priority)",
    "compliance logging",
    "team coordination"
  ];
}
```

#### 4. Mode Comparison Table
| Feature | Light | Enterprise |
|---------|-------|------------|
| File watching | OpenCode native | Dedicated inotify |
| Processes | 1 | 2 |
| Queue visibility | No | Yes |
| Worktree isolation | No | Yes |
| Agent control | Basic | Full |
| Scale | <500 files | 10k+ files |
| Team size | Solo/small | Multiple teams |
| Compliance | No | Yes |
| Setup complexity | Low | Medium |

#### 5. Mode Switching
```typescript
function switchMode(mode: 'light' | 'enterprise'): void {
  // Steps:
  // 1. Update .speclangrc with mode
  // 2. If switching to enterprise:
  //    - download speclangd binary
  //    - configure daemon port
  //    - start daemon
  // 3. If switching to light:
  //    - stop daemon
  //    - remove daemon config
  // 4. Restart OpenCode server
  
  // Note: specs and database remain the same
}
```

#### 6. Configuration (.speclangrc)
```yaml
# .speclangrc
mode: enterprise  # or light

scale_thresholds:
  files: 500      # suggest enterprise above this
  agents: 20      # suggest enterprise above this

enterprise:
  daemon_port: 8765
  queue_size: 1000
  worktrees: 3    # max concurrent worktrees
  compliance_log: .speclang/compliance.log

light:
  # no extra config needed
```

#### 7. Mode Recommendations
```typescript
function recommendMode(stats: ProjectStats): 'light' | 'enterprise' {
  // Use light when:
  // - Solo developer
  // - <500 spec files
  // - <20 concurrent agents
  // - No compliance requirements
  // - Quick prototyping
  
  // Use enterprise when:
  // - Multiple developers
  // - 500+ spec files
  // - 20+ concurrent agents
  // - Compliance requirements (SOC2, etc.)
  // - Need queue visibility
  // - Need worktree isolation
}
```

#### 8. Performance Characteristics
| Metric | Light | Enterprise |
|--------|-------|------------|
| Event latency | ~100ms | ~10ms |
| Max files | ~500 | 10k+ |
| Max agents | ~20 | 100+ |
| Memory | +50MB | +100MB |
| Processes | 1 | 2 |
| Startup time | ~2s | ~3s |

#### 9. Feature Flags
```typescript
interface FeatureFlags {
  // Light mode features (always available)
  cascade: true;
  convergence: true;
  commit: true;
  pipeline: true;
  
  // Enterprise-only features
  queueVisibility: boolean;  // light: false, enterprise: true
  worktreeIsolation: boolean;
  agentControl: boolean;
  complianceLog: boolean;
}

function isFeatureAvailable(feature: string, mode: Mode): boolean;
```

### Code Quality
- Mode detection should be fast
- Graceful degradation when switching
- All mode-specific features behind feature flags
- Reference spec blocks in comments

## Validation
```bash
bun test tests/deployment.test.ts
speclang mode detect
speclang mode switch enterprise
speclang mode status
```

## Output Format
After completing, output:
1. List of files created
2. Test results
3. Any deviations from the spec (with justification)
