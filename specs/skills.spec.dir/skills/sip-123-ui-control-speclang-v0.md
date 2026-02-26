---
name: sip-123-ui-control-speclang-v0
title: "SIP 123: UI Control Panel"
version: 0.1.0
description: Control panel component for SpecLang dashboard
category: standard
---
# speclang-header lines:5
# id: @specs/skills
# version: 1.0.0
# layer: 5


# SIP 123: UI Control Panel

**Status:** Draft  
**Version:** 0.1.0  
**Author:** SpecLang Core Team

## README

This SIP defines the Control Panel component for the SpecLang dashboard, providing system control, configuration management, and agent supervision.

### Quick Start

```yaml
ControlPanel:
  sections:
    - name: cascade
      controls:
        - type: button
          action: pause_cascade
        - type: button
          action: resume_cascade
        - type: button
          action: abort_cascade
          
    - name: agents
      controls:
        - type: list
          items: agent_list
        - type: button
          action: restart_agent
          
    - name: config
      controls:
        - type: form
          fields: [watch_paths, debounce_ms, max_depth]
```

### When to Read This

- **Building dashboard**: Control panel integration
- **System control**: Pause/resume cascades
- **Agent management**: Supervise agents

### Related SIPs

- SIP 36: UI Specification
- SIP 43: MCP Daemon
- SIP 55: Cascade Triggers

## Abstract

The Control Panel provides administrative controls for the SpecLang system, including cascade control, agent management, and configuration editing.

## Motivation

Users need:
- **Control**: Pause/resume cascades
- **Supervise**: Monitor agents
- **Configure**: Edit settings

## Rationale

**Control Interface:**

1. Cascade controls
2. Agent management
3. Configuration editing
4. System status

## Specification

### Component Structure

```yaml
ControlPanelComponent:
  header:
    id: "@specs/ui-control-panel"
    version: 1.0.0
    layer: 6
    tags: [ui, control, dashboard, admin]
    
  layout:
    type: sidebar
    width: 300px
    position: right
    
  sections:
    - cascade_control
    - agent_management
    - system_config
    - quick_actions
```

### Cascade Controls

```yaml
CascadeControls:
  pause:
    type: button
    label: "Pause Cascade"
    icon: pause
    action: POST /api/cascade/pause
    confirmation: true
    
  resume:
    type: button
    label: "Resume Cascade"
    icon: play
    action: POST /api/cascade/resume
    enabled_when: paused
    
  abort:
    type: button
    label: "Abort Cascade"
    icon: stop
    action: POST /api/cascade/abort
    confirmation: true
    danger: true
    
  status:
    type: status_display
    states:
      - idle
      - running
      - paused
      - aborted
```

### Agent Management

```yaml
AgentManagement:
  list:
    type: agent_list
    columns:
      - name
      - status
      - uptime
      - tasks_completed
      
  actions:
    restart:
      type: button
      label: "Restart"
      action: POST /api/agents/{id}/restart
      
    pause:
      type: button
      label: "Pause"
      action: POST /api/agents/{id}/pause
      
    logs:
      type: button
      label: "View Logs"
      action: GET /api/agents/{id}/logs
```

### Configuration Controls

```yaml
ConfigurationControls:
  watch_paths:
    type: text_list
    label: "Watch Paths"
    validation: glob_pattern
    
  debounce_ms:
    type: number
    label: "Debounce (ms)"
    min: 50
    max: 5000
    
  max_depth:
    type: number
    label: "Max Cascade Depth"
    min: 1
    max: 100
    
  max_concurrent:
    type: number
    label: "Max Concurrent Cascades"
    min: 1
    max: 10
```

### Control Panel Implementation

```python
from dataclasses import dataclass, field
from typing import List, Dict, Optional
from datetime import datetime
from enum import Enum

class CascadeState(Enum):
    IDLE = "idle"
    RUNNING = "running"
    PAUSED = "paused"
    ABORTED = "aborted"

@dataclass
class AgentInfo:
    id: str
    name: str
    status: str
    started_at: datetime
    tasks_completed: int
    current_task: Optional[str] = None
    
    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "name": self.name,
            "status": self.status,
            "started_at": self.started_at.isoformat(),
            "tasks_completed": self.tasks_completed,
            "current_task": self.current_task
        }

@dataclass
class SystemConfig:
    watch_paths: List[str] = field(default_factory=list)
    debounce_ms: int = 100
    max_depth: int = 100
    max_concurrent: int = 10
    auto_start: bool = True
    
    def to_dict(self) -> dict:
        return {
            "watch_paths": self.watch_paths,
            "debounce_ms": self.debounce_ms,
            "max_depth": self.max_depth,
            "max_concurrent": self.max_concurrent,
            "auto_start": self.auto_start
        }
        
    @classmethod
    def from_dict(cls, data: dict) -> "SystemConfig":
        return cls(
            watch_paths=data.get("watch_paths", []),
            debounce_ms=data.get("debounce_ms", 100),
            max_depth=data.get("max_depth", 100),
            max_concurrent=data.get("max_concurrent", 10),
            auto_start=data.get("auto_start", True)
        )

class CascadeController:
    def __init__(self, cascade_manager):
        self.cascade_manager = cascade_manager
        
    async def get_status(self) -> Dict:
        """Get current cascade status."""
        
        state = await self.cascade_manager.get_state()
        
        return {
            "state": state.value,
            "current_cascade_id": await self.cascade_manager.get_current_id(),
            "depth": await self.cascade_manager.get_depth(),
            "files_processed": await self.cascade_manager.get_files_processed()
        }
    
    async def pause(self) -> Dict:
        """Pause the current cascade."""
        
        await self.cascade_manager.pause()
        return {"status": "paused"}
    
    async def resume(self) -> Dict:
        """Resume a paused cascade."""
        
        await self.cascade_manager.resume()
        return {"status": "running"}
    
    async def abort(self) -> Dict:
        """Abort the current cascade."""
        
        await self.cascade_manager.abort()
        return {"status": "aborted"}

class AgentController:
    def __init__(self, agent_manager):
        self.agent_manager = agent_manager
        
    async def list_agents(self) -> List[AgentInfo]:
        """List all agents."""
        
        agents = await self.agent_manager.list_all()
        
        return [
            AgentInfo(
                id=a.id,
                name=a.name,
                status=a.status,
                started_at=a.started_at,
                tasks_completed=a.tasks_completed,
                current_task=a.current_task
            )
            for a in agents
        ]
    
    async def get_agent(self, agent_id: str) -> AgentInfo:
        """Get agent details."""
        
        agent = await self.agent_manager.get(agent_id)
        
        return AgentInfo(
            id=agent.id,
            name=agent.name,
            status=agent.status,
            started_at=agent.started_at,
            tasks_completed=agent.tasks_completed,
            current_task=agent.current_task
        )
    
    async def restart_agent(self, agent_id: str) -> Dict:
        """Restart an agent."""
        
        await self.agent_manager.restart(agent_id)
        return {"status": "restarted", "agent_id": agent_id}
    
    async def pause_agent(self, agent_id: str) -> Dict:
        """Pause an agent."""
        
        await self.agent_manager.pause(agent_id)
        return {"status": "paused", "agent_id": agent_id}
    
    async def resume_agent(self, agent_id: str) -> Dict:
        """Resume an agent."""
        
        await self.agent_manager.resume(agent_id)
        return {"status": "running", "agent_id": agent_id}

class ConfigController:
    def __init__(self, config_store):
        self.config_store = config_store
        
    async def get_config(self) -> SystemConfig:
        """Get current configuration."""
        
        config_data = await self.config_store.load()
        return SystemConfig.from_dict(config_data)
    
    async def update_config(self, config: SystemConfig) -> Dict:
        """Update configuration."""
        
        await self.config_store.save(config.to_dict())
        return {"status": "updated"}
    
    async def reset_config(self) -> Dict:
        """Reset to default configuration."""
        
        default = SystemConfig()
        await self.config_store.save(default.to_dict())
        return {"status": "reset"}
```

### Control Panel UI

```javascript
class ControlPanel {
  constructor(container, options = {}) {
    this.container = container;
    this.options = options;
    
    this.cascadeState = 'idle';
    this.agents = [];
    this.config = {};
    
    this.init();
  }
  
  init() {
    this.render();
    this.bindEvents();
    this.loadData();
  }
  
  render() {
    this.container.innerHTML = `
      <div class="control-panel">
        <div class="panel-section">
          <h3>Cascade Control</h3>
          <div class="cascade-status">
            <span class="status-indicator status-${this.cascadeState}"></span>
            <span class="status-text">${this.cascadeState}</span>
          </div>
          <div class="control-buttons">
            <button class="btn-control btn-pause" data-action="pause">
              <span class="icon">⏸</span> Pause
            </button>
            <button class="btn-control btn-resume" data-action="resume" disabled>
              <span class="icon">▶</span> Resume
            </button>
            <button class="btn-control btn-abort" data-action="abort">
              <span class="icon">⏹</span> Abort
            </button>
          </div>
        </div>
        
        <div class="panel-section">
          <h3>Agents</h3>
          <div class="agent-list"></div>
        </div>
        
        <div class="panel-section">
          <h3>Configuration</h3>
          <div class="config-form">
            <div class="form-group">
              <label>Watch Paths</label>
              <textarea class="config-input" data-field="watch_paths" rows="3"></textarea>
            </div>
            <div class="form-group">
              <label>Debounce (ms)</label>
              <input type="number" class="config-input" data-field="debounce_ms" min="50" max="5000">
            </div>
            <div class="form-group">
              <label>Max Depth</label>
              <input type="number" class="config-input" data-field="max_depth" min="1" max="100">
            </div>
            <div class="form-actions">
              <button class="btn-save">Save</button>
              <button class="btn-reset">Reset</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }
  
  bindEvents() {
    // Cascade controls
    this.container.querySelectorAll('.btn-control').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const action = e.currentTarget.dataset.action;
        this.handleCascadeAction(action);
      });
    });
    
    // Config save/reset
    this.container.querySelector('.btn-save').addEventListener('click', () => {
      this.saveConfig();
    });
    
    this.container.querySelector('.btn-reset').addEventListener('click', () => {
      this.resetConfig();
    });
    
    // Agent actions (delegated)
    this.container.querySelector('.agent-list').addEventListener('click', (e) => {
      if (e.target.classList.contains('btn-agent-action')) {
        const agentId = e.target.dataset.agentId;
        const action = e.target.dataset.action;
        this.handleAgentAction(agentId, action);
      }
    });
  }
  
  async loadData() {
    await Promise.all([
      this.loadCascadeStatus(),
      this.loadAgents(),
      this.loadConfig()
    ]);
  }
  
  async loadCascadeStatus() {
    const response = await fetch('/api/cascade/status');
    const status = await response.json();
    
    this.cascadeState = status.state;
    this.updateCascadeDisplay(status);
  }
  
  async loadAgents() {
    const response = await fetch('/api/agents');
    const agents = await response.json();
    
    this.agents = agents;
    this.renderAgents(agents);
  }
  
  async loadConfig() {
    const response = await fetch('/api/config');
    const config = await response.json();
    
    this.config = config;
    this.updateConfigDisplay(config);
  }
  
  updateCascadeDisplay(status) {
    const statusIndicator = this.container.querySelector('.status-indicator');
    const statusText = this.container.querySelector('.status-text');
    const pauseBtn = this.container.querySelector('.btn-pause');
    const resumeBtn = this.container.querySelector('.btn-resume');
    
    statusIndicator.className = `status-indicator status-${status.state}`;
    statusText.textContent = status.state;
    
    pauseBtn.disabled = status.state !== 'running';
    resumeBtn.disabled = status.state !== 'paused';
  }
  
  renderAgents(agents) {
    const list = this.container.querySelector('.agent-list');
    
    list.innerHTML = agents.map(agent => `
      <div class="agent-item">
        <div class="agent-info">
          <div class="agent-name">${agent.name}</div>
          <div class="agent-status">${agent.status}</div>
        </div>
        <div class="agent-actions">
          <button class="btn-agent-action" data-agent-id="${agent.id}" data-action="restart">
            Restart
          </button>
          <button class="btn-agent-action" data-agent-id="${agent.id}" data-action="logs">
            Logs
          </button>
        </div>
      </div>
    `).join('');
  }
  
  updateConfigDisplay(config) {
    this.container.querySelectorAll('.config-input').forEach(input => {
      const field = input.dataset.field;
      if (field === 'watch_paths') {
        input.value = config[field].join('\n');
      } else {
        input.value = config[field];
      }
    });
  }
  
  async handleCascadeAction(action) {
    try {
      const response = await fetch(`/api/cascade/${action}`, {
        method: 'POST'
      });
      
      if (response.ok) {
        await this.loadCascadeStatus();
      }
    } catch (error) {
      console.error(`Failed to ${action} cascade:`, error);
    }
  }
  
  async handleAgentAction(agentId, action) {
    try {
      const response = await fetch(`/api/agents/${agentId}/${action}`, {
        method: 'POST'
      });
      
      if (response.ok) {
        await this.loadAgents();
      }
    } catch (error) {
      console.error(`Failed to ${action} agent:`, error);
    }
  }
  
  async saveConfig() {
    const config = {};
    
    this.container.querySelectorAll('.config-input').forEach(input => {
      const field = input.dataset.field;
      if (field === 'watch_paths') {
        config[field] = input.value.split('\n').filter(p => p.trim());
      } else {
        config[field] = input.type === 'number' ? parseInt(input.value) : input.value;
      }
    });
    
    try {
      const response = await fetch('/api/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      
      if (response.ok) {
        alert('Configuration saved');
      }
    } catch (error) {
      console.error('Failed to save config:', error);
    }
  }
  
  async resetConfig() {
    if (!confirm('Reset to default configuration?')) return;
    
    try {
      const response = await fetch('/api/config/reset', {
        method: 'POST'
      });
      
      if (response.ok) {
        await this.loadConfig();
      }
    } catch (error) {
      console.error('Failed to reset config:', error);
    }
  }
}
```

### API Endpoints

```python
class ControlPanelEndpoints:
    def __init__(
        self,
        cascade_controller: CascadeController,
        agent_controller: AgentController,
        config_controller: ConfigController
    ):
        self.cascade = cascade_controller
        self.agents = agent_controller
        self.config = config_controller
        
    async def handle_cascade_status(self, request) -> Response:
        """Get cascade status."""
        
        status = await self.cascade.get_status()
        return Response(200, json.dumps(status))
        
    async def handle_cascade_pause(self, request) -> Response:
        """Pause cascade."""
        
        result = await self.cascade.pause()
        return Response(200, json.dumps(result))
        
    async def handle_cascade_resume(self, request) -> Response:
        """Resume cascade."""
        
        result = await self.cascade.resume()
        return Response(200, json.dumps(result))
        
    async def handle_cascade_abort(self, request) -> Response:
        """Abort cascade."""
        
        result = await self.cascade.abort()
        return Response(200, json.dumps(result))
        
    async def handle_agents_list(self, request) -> Response:
        """List agents."""
        
        agents = await self.agents.list_agents()
        return Response(200, json.dumps([a.to_dict() for a in agents]))
        
    async def handle_agent_get(self, request, agent_id: str) -> Response:
        """Get agent details."""
        
        agent = await self.agents.get_agent(agent_id)
        return Response(200, json.dumps(agent.to_dict()))
        
    async def handle_agent_restart(self, request, agent_id: str) -> Response:
        """Restart agent."""
        
        result = await self.agents.restart_agent(agent_id)
        return Response(200, json.dumps(result))
        
    async def handle_config_get(self, request) -> Response:
        """Get configuration."""
        
        config = await self.config.get_config()
        return Response(200, json.dumps(config.to_dict()))
        
    async def handle_config_update(self, request) -> Response:
        """Update configuration."""
        
        config_data = await request.json()
        config = SystemConfig.from_dict(config_data)
        result = await self.config.update_config(config)
        return Response(200, json.dumps(result))
```

## Backwards Compatibility

- API endpoints stable
- UI changes non-breaking

## Security Implications

- Control panel requires authentication
- Consider role-based access control

## References

- @ref:specs/ui-specification
- @ref:specs/cascade-triggers
- @ref:specs/agent-protocol
- SIP 36: UI Specification
- SIP 43: MCP Daemon
- SIP 55: Cascade Triggers

## Copyright

This document is in the public domain.
