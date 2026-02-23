---
name: sip-039-deployment-speclang-v0
title: "SIP 39: Deployment Modes"
version: 0.1.0
description: Light and Enterprise deployment profiles for SpecLang
category: standard
---

# SIP 39: Deployment Modes

**Status:** Draft  
**Version:** 0.1.0  
**Author:** SpecLang Core Team

## README

This SIP defines Deployment Modes—Light vs Enterprise configurations.

### Quick Start

Two modes available:
- **Light**: OpenCode only, <500 files, solo/small teams
- **Enterprise**: OpenCode + daemon, 500+ files, multiple teams

### When to Read This

- **Choosing mode**: Which to use
- **Scaling**: When to upgrade
- **Configuration**: Mode settings

### Related SIPs

- SIP 10: Daemon
- SIP 38: OpenCode Integration
- SIP 37: CLI

## Abstract

This SIP defines Deployment Modes—users choose between Light mode (OpenCode only) or Enterprise mode (with MCP daemon). Same codebase, different scale. Light is simpler; Enterprise provides more observability and scale.

## Motivation

Users have different needs:
- Solo developers want simplicity
- Teams need observability
- Large projects need scale
- Compliance requires audit trails

Two modes serve both use cases.

## Rationale

**Two-tier deployment:**

1. **Light**: Start simple, minimal overhead
2. **Enterprise**: Scale up when needed
3. **Same specs**: No migration required
4. **Easy switch**: Change config, restart

## Specification

### Mode Overview

```yaml
Modes:
  Light:
    description: "Minimal setup"
    processes: 1
    components:
      - "opencode serve"
    file_watcher: "OpenCode native"
    features:
      - "Basic cascade"
      - "Convergence detection"
      - "Per-file commits"
    scale:
      files: "<500"
      agents: "<20"
      team: "Solo/small"
      
  Enterprise:
    description: "Full observability"
    processes: 2
    components:
      - "opencode serve"
      - "speclangd (daemon)"
    file_watcher: "Dedicated inotify daemon"
    features:
      - "All Light features"
      - "Queue visibility"
      - "Worktree isolation"
      - "Agent control"
      - "Compliance logging"
    scale:
      files: "500+"
      agents: "20+"
      team: "Multiple teams"
```

### Mode Selection

```yaml
ModeSelection:
  command: "speclang init --mode=light|enterprise"
  
  light:
    when:
      - "Solo developer"
      - "<500 spec files"
      - "<20 concurrent agents"
      - "No compliance requirements"
      - "Quick prototyping"
      
  enterprise:
    when:
      - "Multiple developers"
      - "500+ spec files"
      - "20+ concurrent agents"
      - "Compliance requirements (SOC2, etc.)"
      - "Need queue visibility"
      - "Need worktree isolation"
```

### Feature Comparison

```yaml
FeatureComparison:
  table:
    - feature: "File watching"
      light: "OpenCode native"
      enterprise: "Dedicated inotify"
      
    - feature: "Processes"
      light: "1"
      enterprise: "2"
      
    - feature: "Queue visibility"
      light: "No"
      enterprise: "Yes"
      
    - feature: "Worktree isolation"
      light: "No"
      enterprise: "Yes"
      
    - feature: "Agent control"
      light: "Basic"
      enterprise: "Full"
      
    - feature: "Scale (files)"
      light: "<500"
      enterprise: "10k+"
      
    - feature: "Team size"
      light: "Solo/small"
      enterprise: "Multiple teams"
      
    - feature: "Compliance"
      light: "No"
      enterprise: "Yes"
      
    - feature: "Setup complexity"
      light: "Low"
      enterprise: "Medium"
```

### Performance Characteristics

```yaml
Performance:
  table:
    - metric: "Event latency"
      light: "~100ms"
      enterprise: "~10ms"
      
    - metric: "Max files"
      light: "~500"
      enterprise: "10k+"
      
    - metric: "Max agents"
      light: "~20"
      enterprise: "100+"
      
    - metric: "Memory overhead"
      light: "+50MB"
      enterprise: "+100MB"
      
    - metric: "Startup time"
      light: "~2s"
      enterprise: "~3s"
```

### Configuration

```yaml
Configuration:
  file: ".speclangrc"
  
  shared:
    mode: "enterprise | light"
    scale_thresholds:
      files: 500
      agents: 20
      
  enterprise_specific:
    daemon_port: 8765
    queue_size: 1000
    worktrees: 3
    compliance_log: ".speclang/compliance.log"
    
  light_specific: {}
```

### Switching Modes

```yaml
SwitchingModes:
  operation: "switchMode(mode: light|enterprise)"
  
  steps:
    1_update_config:
      action: "Update .speclangrc with mode"
      
    2_to_enterprise:
      if: "mode == enterprise"
      steps:
        - "Download speclangd binary"
        - "Configure daemon port"
        - "Start daemon"
        
    3_to_light:
      if: "mode == light"
      steps:
        - "Stop daemon"
        - "Remove daemon config"
        
    4_restart:
      action: "Restart OpenCode server"
      
  note: "Specs and database remain the same"
```

### Sub-Specifications

```yaml
SubSpecs:
  light:
    id: "@speclang/deployment/light"
    file: "specs/deployment.spec.dir/light.spec.md"
    content:
      - "Architecture details"
      - "Configuration options"
      - "Performance tuning"
      
  enterprise:
    id: "@speclang/deployment/enterprise"
    file: "specs/deployment.spec.dir/enterprise.spec.md"
    content:
      - "Daemon architecture"
      - "Queue management"
      - "Worktree isolation"
      - "Compliance logging"
```

## Examples

### Example 1: Light Mode Setup

```bash
$ speclang init --mode=light
Initializing SpecLang project (Light mode)...

Created:
  .speclang/
  .speclang/config.yaml
  specs/

Mode: Light
Processes: 1 (opencode serve)
File watcher: OpenCode native

Start with:
  opencode serve --build-mode
```

### Example 2: Enterprise Mode Setup

```bash
$ speclang init --mode=enterprise
Initializing SpecLang project (Enterprise mode)...

Created:
  .speclang/
  .speclang/config.yaml
  .speclangrc
  specs/

Mode: Enterprise
Processes: 2 (opencode serve + speclangd)
Daemon port: 8765
Queue size: 1000

Downloading speclangd...
✓ speclangd installed

Start with:
  speclangd start
  opencode serve --build-mode
```

### Example 3: Switching to Enterprise

```bash
$ speclang switch --mode=enterprise
Switching to Enterprise mode...

1. Updating configuration...
   ✓ Updated .speclangrc

2. Downloading daemon...
   ✓ speclangd v0.1.0 installed

3. Configuring daemon...
   ✓ Port: 8765
   ✓ Queue: 1000

4. Starting daemon...
   ✓ speclangd running on port 8765

5. Restart OpenCode server to apply changes.

Mode switched: Light → Enterprise
```

### Example 4: Configuration File

```yaml
# .speclangrc
mode: enterprise

scale_thresholds:
  files: 500      # suggest enterprise above this
  agents: 20      # suggest enterprise above this

enterprise:
  daemon_port: 8765
  queue_size: 1000
  worktrees: 3    # max concurrent worktrees
  compliance_log: .speclang/compliance.log
```

## Implementation

```python
from enum import Enum
from dataclasses import dataclass
from typing import Optional
import subprocess
import os

class DeploymentMode(Enum):
    LIGHT = "light"
    ENTERPRISE = "enterprise"

@dataclass
class ScaleThresholds:
    files: int = 500
    agents: int = 20

@dataclass
class EnterpriseConfig:
    daemon_port: int = 8765
    queue_size: int = 1000
    worktrees: int = 3
    compliance_log: str = ".speclang/compliance.log"

@dataclass
class DeploymentConfig:
    mode: DeploymentMode
    thresholds: ScaleThresholds
    enterprise: Optional[EnterpriseConfig] = None

class DeploymentManager:
    def __init__(self, config_path: str = ".speclangrc"):
        self.config_path = config_path
        self.config = self._load_config()
        
    def _load_config(self) -> DeploymentConfig:
        if os.path.exists(self.config_path):
            return self._parse_config(self.config_path)
        return DeploymentConfig(
            mode=DeploymentMode.LIGHT,
            thresholds=ScaleThresholds()
        )
        
    def switch_mode(self, new_mode: DeploymentMode) -> None:
        if new_mode == self.config.mode:
            return
            
        if new_mode == DeploymentMode.ENTERPRISE:
            self._setup_enterprise()
        else:
            self._teardown_enterprise()
            
        self.config.mode = new_mode
        self._save_config()
        
    def _setup_enterprise(self) -> None:
        self._download_daemon()
        self._configure_daemon()
        self._start_daemon()
        
    def _teardown_enterprise(self) -> None:
        self._stop_daemon()
        self._remove_daemon_config()
        
    def _download_daemon(self) -> None:
        subprocess.run(["curl", "-L", "-o", "speclangd", 
                       "https://releases.speclang.dev/speclangd-latest"])
        subprocess.run(["chmod", "+x", "speclangd"])
        
    def _start_daemon(self) -> None:
        subprocess.Popen(["./speclangd", "start"])
        
    def _stop_daemon(self) -> None:
        subprocess.run(["./speclangd", "stop"])
        
    def recommend_mode(self, file_count: int, agent_count: int) -> DeploymentMode:
        if file_count > self.config.thresholds.files:
            return DeploymentMode.ENTERPRISE
        if agent_count > self.config.thresholds.agents:
            return DeploymentMode.ENTERPRISE
        return DeploymentMode.LIGHT
```

## References

- @ref:speclang/deployment
- @ref:speclang/deployment.spec.dir/light
- @ref:speclang/deployment.spec.dir/enterprise
- SIP 10: Daemon
- SIP 38: OpenCode Integration
- SIP 37: CLI

## Copyright

This document is in the public domain.
