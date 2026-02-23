# Bootstrap Phase 2.3: MCP Daemon (speclangd Enterprise)

## Context
You are building SpecLang - a reactive multi-agent system where specs self-assemble into code. This is Phase 2.3 of the bootstrap process.

**Prerequisites**: 
- Phase 0-2 complete
- MCP server operational
- SQLite database ready

## Your Task
Implement the enterprise `speclangd` daemon with HTTP/SSE server and queue management. This provides queue visibility, worktree isolation, and agent control for production deployments.

## Read These Specs First
1. `specs/mcp-daemon.spec.md` - Full daemon specification
2. `specs/daemon.spec.md` - Core daemon architecture
3. `specs/daemon.spec.dir/*.spec.md` - Daemon components

## Current State
- Core daemon (Phase 1.1) provides file watching
- MCP server provides tool interface
- Need enterprise features for production

## What to Build

### Files to Create
```
src/daemon/enterprise/
├── main.go               # Entry point
├── http.go               # HTTP server
├── sse.go                # SSE streaming
├── queue.go              # Queue management
├── worktree.go           # Worktree isolation
├── agent_control.go      # Agent commands
├── config.go             # Configuration
└── config.yaml           # Default config

bin/
└── speclangd             # Compiled binary
```

### Requirements

#### 1. HTTP Server (http.go)
```go
type HTTPServer struct {
    port    int
    queue   *EventQueue
    worktree *WorktreeManager
}

// Endpoints
// GET  /status              - Daemon status
// GET  /events              - SSE stream
// GET  /queue               - Queue status
// POST /command             - Send command
// GET  /worktrees           - List worktrees
// POST /worktree/create     - Create worktree
// POST /worktree/{name}/test - Run tests in worktree

func (s *HTTPServer) handleStatus(w http.ResponseWriter, r *http.Request) {
    json.NewEncoder(w).Encode(StatusResponse{
        Mode:          "enterprise",
        QueueDepth:    s.queue.Depth(),
        FilesWatching: s.watcher.Count(),
        Uptime:        time.Since(s.started).Seconds(),
    })
}
```

#### 2. SSE Streaming (sse.go)
```go
type SSEStream struct {
    clients  map[chan Event]bool
    eventBus chan Event
}

type Event struct {
    Type string      `json:"type"`
    Data interface{} `json:"data"`
}

// Event types
// file.changed      - { path, kind, timestamp }
// queue.updated     - { depth, added, removed }
// agent.started     - { session, agent, file }
// agent.finished    - { session, summary, files_written }
// convergence.detected - { quiet_seconds, files_changed }
// pipeline.started  - { stages }
// pipeline.finished - { success, duration }

func (s *SSEStream) ServeHTTP(w http.ResponseWriter, r *http.Request) {
    flusher, _ := w.(http.Flusher)
    w.Header().Set("Content-Type", "text/event-stream")
    
    client := make(chan Event)
    s.clients[client] = true
    
    for event := range client {
        fmt.Fprintf(w, "event: %s\ndata: %s\n\n", 
            event.Type, jsonMarshal(event.Data))
        flusher.Flush()
    }
}
```

#### 3. Queue Management (queue.go)
```go
type EventQueue struct {
    pending    []*QueueItem
    inProgress map[string]*QueueItem
    completed  []*QueueItem
    maxSize    int
    paused     bool
}

type QueueItem struct {
    ID        string
    Type      string
    Priority  int
    Payload   interface{}
    CreatedAt time.Time
}

// Commands
// pause   - Stop processing new items
// resume  - Continue processing
// priority - Move item to front
// clear   - Remove all pending

func (q *EventQueue) Push(item *QueueItem) error {
    if q.paused {
        return errors.New("queue paused")
    }
    if len(q.pending) >= q.maxSize {
        return errors.New("queue full")
    }
    q.pending = append(q.pending, item)
    return nil
}
```

#### 4. Worktree Isolation (worktree.go)
```go
type WorktreeManager struct {
    basePath string
    active   map[string]*Worktree
}

type Worktree struct {
    Name      string
    Path      string
    BaseCommit string
    CreatedAt time.Time
}

// Create isolated worktree for testing
func (m *WorktreeManager) Create(name, baseCommit string) (*Worktree, error) {
    path := filepath.Join(m.basePath, name)
    
    // git worktree add <path> <commit>
    cmd := exec.Command("git", "worktree", "add", path, baseCommit)
    if err := cmd.Run(); err != nil {
        return nil, err
    }
    
    wt := &Worktree{
        Name:       name,
        Path:       path,
        BaseCommit: baseCommit,
        CreatedAt:  time.Now(),
    }
    m.active[name] = wt
    return wt, nil
}

// Run tests in worktree
func (m *WorktreeManager) Test(name string, filter string) (*TestResult, error) {
    wt, ok := m.active[name]
    if !ok {
        return nil, errors.New("worktree not found")
    }
    
    // Run tests in worktree directory
    cmd := exec.Command("go", "test", "./...")
    cmd.Dir = wt.Path
    output, err := cmd.CombinedOutput()
    
    return &TestResult{
        Output: string(output),
        Passed: err == nil,
    }, nil
}
```

#### 5. Agent Control (agent_control.go)
```go
type AgentController struct {
    sessions map[string]*AgentSession
}

type AgentSession struct {
    ID     string
    Agent  string
    Status string // idle, active, paused, error
}

// Commands
// pause   - Stop agent, keep state
// resume  - Continue agent
// split   - Force split of current file
// re-expand - Regenerate from parent
// priority - Change queue priority
// kill    - Terminate agent (rollback)

func (c *AgentController) Control(sessionID, command string) error {
    session, ok := c.sessions[sessionID]
    if !ok {
        return errors.New("session not found")
    }
    
    switch command {
    case "pause":
        session.Status = "paused"
    case "resume":
        session.Status = "active"
    case "kill":
        // Only orchestrator can kill
        delete(c.sessions, sessionID)
    }
    return nil
}
```

#### 6. Binary Distribution
```go
// Binary name: speclangd
// Size: ~5-10MB
// Languages: Go

// Platforms
// - Linux (amd64, arm64)
// - macOS (amd64, arm64)  
// - Windows (amd64)

// Commands
// speclangd start    - Start daemon
// speclangd stop     - Stop daemon
// speclangd status   - Check status
// speclangd config   - Show/configure settings
```

### Configuration (.speclang/daemon.json)
```json
{
  "port": 8765,
  "host": "localhost",
  "queue_size": 1000,
  "max_worktrees": 10,
  "log_level": "info",
  "quiet_period": "30s"
}
```

### HTTP API Examples
```bash
# Get status
curl http://localhost:8765/status
# {"mode":"enterprise","queue_depth":12,"files_watching":847,"uptime":3600}

# Get queue
curl http://localhost:8765/queue
# {"pending":["auth.scl","user.scl"],"in_progress":["api.scl"],"completed":45}

# Pause queue
curl -X POST http://localhost:8765/command -d '{"command":"pause"}'
# {"ok":true,"queue_paused":true}

# Create worktree
curl -X POST http://localhost:8765/worktree/create -d '{"name":"test-v1.2"}'
# {"path":".speclang/worktrees/test-v1.2","ready":true}

# Run tests in worktree
curl -X POST http://localhost:8765/worktree/test-v1.2/test
# {"test_id":"test-001","status":"running"}
```

### SSE Event Examples
```
event: file.changed
data: {"path":"specs/auth.scl","kind":"modify","timestamp":1705312200}

event: queue.updated
data: {"depth":5,"added":["user.scl"],"removed":[]}

event: agent.started
data: {"session":"sess-003","agent":"spec-writer","file":"specs/auth.scl"}

event: convergence.detected
data: {"quiet_seconds":30,"files_changed":12}
```

## Test Cases
1. HTTP server starts on configured port
2. GET /status returns correct format
3. POST /command pauses queue
4. Worktree create/delete works
5. SSE streams events correctly
6. Queue management commands work
7. Agent control commands work

## Validation
```bash
# Build binary
cd src/daemon/enterprise && go build -o ../../../bin/speclangd

# Run daemon
./bin/speclangd start

# Test endpoints
curl http://localhost:8765/status
curl http://localhost:8765/queue
```

## Output Format
After completing, output:
1. Binary location
2. HTTP endpoints available
3. SSE event types supported
4. Queue commands available
