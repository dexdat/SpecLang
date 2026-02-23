# Bootstrap Phase 1.8: Daemon Event Routing

## Context
You are building SpecLang - a reactive multi-agent system where specs self-assemble into code. This is Phase 1.8 of the bootstrap process.

**Prerequisites**: Phase 1.1 (Daemon Core), Phase 1.6 (Events), Phase 1.7 (Convergence) complete.

## Your Task
Implement event routing - directing file change events to the appropriate owning agents.

## Read These Specs First
1. `specs/daemon.spec.dir/routing.spec.md` - Event routing specification
2. `specs/agent-protocol.spec.dir/ownership.spec.md` - File ownership patterns

## Routing Rules

Events are routed based on file patterns:
```
project.scl          → NorthStarAgent
specs/**/*.scl       → SpecAgent (by file pattern)
tests/**/*.test.spec.scl → TestAgent
generated/**/*.go    → CodeAgent-Go
generated/**/*.ts    → CodeAgent-TS
generated/* (human edit) → BackSyncAgent
```

## Implementation

### 1. Router (`daemon/router.rs`)

```rust
use std::collections::HashMap;
use regex::Regex;

pub struct Router {
    routes: Vec<Route>,
    agent_sessions: HashMap<String, AgentSession>,
}

struct Route {
    pattern: Regex,
    agent_type: AgentType,
    priority: u8,
}

pub enum AgentType {
    NorthStar,
    Spec,
    Test,
    CodeGo,
    CodeTS,
    BackSync,
}

impl Router {
    pub fn new() -> Self {
        let routes = vec![
            Route { pattern: Regex::new(r"^project\.scl$").unwrap(), agent_type: AgentType::NorthStar, priority: 100 },
            Route { pattern: Regex::new(r"^specs/.*\.scl$").unwrap(), agent_type: AgentType::Spec, priority: 50 },
            Route { pattern: Regex::new(r"^tests/.*\.test\.spec\.scl$").unwrap(), agent_type: AgentType::Test, priority: 50 },
            Route { pattern: Regex::new(r"^generated/.*\.go$").unwrap(), agent_type: AgentType::CodeGo, priority: 30 },
            Route { pattern: Regex::new(r"^generated/.*\.ts$").unwrap(), agent_type: AgentType::CodeTS, priority: 30 },
        ];
        
        Self {
            routes,
            agent_sessions: HashMap::new(),
        }
    }
    
    pub fn route(&self, event: &FileEvent) -> Option<&AgentSession> {
        // Sort by priority, match first
        let mut matches: Vec<_> = self.routes.iter()
            .filter(|r| r.pattern.is_match(&event.path))
            .collect();
        matches.sort_by(|a, b| b.priority.cmp(&a.priority));
        
        if let Some(route) = matches.first() {
            let agent_id = self.resolve_agent(&route.agent_type, &event.path);
            self.agent_sessions.get(&agent_id)
        } else {
            None
        }
    }
    
    fn resolve_agent(&self, agent_type: &AgentType, path: &str) -> String {
        match agent_type {
            AgentType::NorthStar => "northstar".to_string(),
            AgentType::Spec => self.find_spec_owner(path).unwrap_or("spec-default".to_string()),
            AgentType::Test => "test-agent".to_string(),
            AgentType::CodeGo => "code-go".to_string(),
            AgentType::CodeTS => "code-ts".to_string(),
            AgentType::BackSync => "backsync".to_string(),
        }
    }
}
```

### 2. Agent Selection with Priority

```rust
impl Router {
    pub fn select_agent(&self, event: &FileEvent, agents: &[Agent]) -> Option<AgentId> {
        // 1. Check explicit ownership first
        if let Some(owner) = self.find_explicit_owner(&event.path) {
            return Some(owner);
        }
        
        // 2. Match by file pattern
        for route in &self.routes {
            if route.pattern.is_match(&event.path) {
                // Find available agent of this type
                let matching: Vec<_> = agents.iter()
                    .filter(|a| a.agent_type == route.agent_type && a.is_available())
                    .collect();
                
                if let Some(agent) = matching.first() {
                    return Some(agent.id.clone());
                }
            }
        }
        
        // 3. Fallback to north star
        Some("northstar".to_string())
    }
    
    fn find_explicit_owner(&self, path: &str) -> Option<AgentId> {
        // Query ownership table
        // SELECT agent_id FROM ownership WHERE file_path = ? OR pattern MATCHES path
        None
    }
}
```

### 3. Notification System

```rust
#[derive(Debug, Serialize)]
pub struct AgentNotification {
    pub event_type: String,
    pub file_path: String,
    pub diff: Option<String>,
    pub timestamp: i64,
}

impl Router {
    pub async fn notify_agent(&self, agent_id: &str, event: &FileEvent) -> Result<()> {
        let session = self.agent_sessions.get(agent_id)
            .ok_or_else(|| anyhow!("Agent session not found: {}", agent_id))?;
        
        let notification = AgentNotification {
            event_type: event.event_type.clone(),
            file_path: event.path.clone(),
            diff: event.diff.clone(),
            timestamp: event.timestamp,
        };
        
        // POST to agent's webhook endpoint
        let client = reqwest::Client::new();
        let response = client
            .post(&session.webhook_url)
            .json(&notification)
            .send()
            .await?;
        
        if !response.status().is_success() {
            bail!("Notification failed: {}", response.status());
        }
        
        Ok(())
    }
}
```

### 4. Priority Handling

```rust
pub struct PriorityQueue {
    queues: HashMap<u8, VecDeque<FileEvent>>,
    max_size: usize,
}

impl PriorityQueue {
    pub fn push(&mut self, event: FileEvent, priority: u8) {
        self.queues.entry(priority)
            .or_default()
            .push_back(event);
    }
    
    pub fn pop(&mut self) -> Option<FileEvent> {
        // Drain from highest priority first
        for priority in (0..=255).rev() {
            if let Some(queue) = self.queues.get_mut(&priority) {
                if let Some(event) = queue.pop_front() {
                    return Some(event);
                }
            }
        }
        None
    }
}

fn determine_priority(event: &FileEvent) -> u8 {
    match event.path.as_str() {
        p if p.starts_with("project.") => 100,  // North star changes are urgent
        p if p.ends_with(".test.spec.scl") => 90,  // Tests are high priority
        p if p.starts_with("specs/") => 50,
        p if p.starts_with("generated/") => 30,
        _ => 10,
    }
}
```

### 5. Route Table Configuration

```yaml
# routing.yaml
routes:
  - pattern: "^project\\.scl$"
    agent: northstar
    priority: 100
    
  - pattern: "^specs/.*\\.scl$"
    agent: spec-agent
    priority: 50
    owner_lookup: true  # Check ownership table
    
  - pattern: "^tests/.*\\.test\\.spec\\.scl$"
    agent: test-agent
    priority: 90
    
  - pattern: "^generated/.*\\.go$"
    agent: code-go
    priority: 30
    
  - pattern: "^generated/.*\\.ts$"
    agent: code-ts
    priority: 30

backsync:
  enabled: true
  trigger: human_edit_detected
  agent: backsync-agent
```

## Routing Algorithm

```
route(event):
  file = event.path
  
  # Check ownership table first
  owner = db.query("SELECT agent_id FROM ownership WHERE ?", file)
  if owner:
    return notify(owner, event)
  
  # Match routes by priority
  for route in sorted_routes:
    if route.pattern matches file:
      agent = find_available_agent(route.agent_type)
      if agent:
        return notify(agent, event)
  
  # Fallback to north star
  return notify(northstar, event)
```

## CLI Interface

```bash
# View routing table
speclangd routes list

# Test routing for a file
speclangd routes test specs/auth.spec.scl
# Output: → SpecAgent (priority 50)

# View agent assignments
speclangd routes agents

# Manually assign ownership
speclangd routes assign specs/auth.spec.scl --agent spec-auth
```

## Test Cases
1. Route project.scl to NorthStarAgent
2. Route spec files to SpecAgent
3. Route test files to TestAgent
4. Route generated Go files to CodeAgent-Go
5. Route generated TS files to CodeAgent-TS
6. Fallback to NorthStar for unmatched files
7. Priority ordering: high priority processed first
8. Owner lookup takes precedence over pattern match
9. BackSync triggered on human edit to generated file
10. Multiple agents can subscribe to same pattern

## Output
1. Router implementation with pattern matching
2. Agent session management
3. Notification system (HTTP POST)
4. Priority queue for event ordering
5. Route configuration loading
6. CLI commands for route management
