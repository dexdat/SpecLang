---
name: sip-115-mcp-runmodes-speclang-v0
title: "SIP 115: MCP Run Modes"
version: 0.1.0
description: Specification for MCP server run modes and deployment configurations
category: standard
---

# SIP 115: MCP Run Modes

**Status:** Draft  
**Version:** 0.1.0  
**Author:** SpecLang Core Team

## README

This SIP specifies the different run modes for the MCP server including standalone, embedded, and distributed modes.

### Quick Start

```yaml
# Run modes configuration
mcp:
  mode: "standalone"  # standalone | embedded | distributed
  
  standalone:
    port: 8080
    workers: 4
    
  embedded:
    mode: "in_process"
    
  distributed:
    coordinator: "localhost:8080"
    workers:
      - "worker-1:8081"
      - "worker-2:8082"
```

### When to Read This

- **Deployment**: Choosing appropriate run mode
- **Scaling**: Configuring distributed mode
- **Development**: Using embedded mode

### Related SIPs

- SIP 114: MCP Architecture
- SIP 43: MCP Daemon
- SIP 50: MCP Tools Detailed

## Abstract

This SIP defines the various run modes for the MCP server, enabling flexible deployment from local development to production-scale distributed systems.

## Motivation

Users need:
- **Development mode**: Quick local iteration
- **Production mode**: High availability, scaling
- **Embedded mode**: Library integration
- **Distributed mode**: Horizontal scalability

## Rationale

**Multiple Run Modes:**

1. Different deployment scenarios require different architectures
2. Development needs fast iteration, production needs reliability
3. Embedded mode enables tool integration in other applications

## Specification

### Run Mode Overview

```yaml
RunModes:
  standalone:
    description: "Self-contained server process"
    use_case: "Development, small deployments"
    characteristics:
      - Single process
      - In-memory state
      - Easy setup
      
  embedded:
    description: "Library embedded in application"
    use_case: "Tool integration, custom apps"
    characteristics:
      - No network
      - Shared memory
      - Direct API
      
  distributed:
    description: "Cluster of worker nodes"
    use_case: "High scale production"
    characteristics:
      - Horizontal scaling
      - Load balancing
      - Fault tolerance
```

### Standalone Mode

```yaml
StandaloneMode:
  config:
    mode: "standalone"
    host: "0.0.0.0"
    port: 8080
    workers: 4  # CPU cores
    
  features:
    - HTTP server
    - WebSocket support
    - Built-in auth
    - File serving
    
  startup:
    command: "speclang mcp serve"
    config: "mcp.yaml"
    
  health:
    - GET /health
    - GET /metrics
```

### Embedded Mode

```yaml
EmbeddedMode:
  config:
    mode: "embedded"
    
  variants:
    in_process:
      description: "Run in same process"
      api:
        - MCPServer.start()
        - MCPServer.stop()
        - MCPServer.call_tool()
        
    shared_library:
      description: "Dynamic library loading"
      bindings:
        - Python
        - Go
        - Rust
        
  api_example:
    ```typescript
    import { MCP } from "@speclang/mcp";
    
    const server = new MCP.EmbeddedServer({
      tools: myTools,
      config: myConfig
    });
    
    await server.start();
    const result = await server.callTool("speclang_search", {
      query: "auth"
    });
    ```
```

### Distributed Mode

```yaml
DistributedMode:
  components:
    coordinator:
      description: "Orchestrates worker nodes"
      responsibilities:
        - Request routing
        - Load balancing
        - Session management
        
    worker:
      description: "Executes tool calls"
      responsibilities:
        - Tool execution
        - State management
        - Health reporting
        
  config:
    mode: "distributed"
    coordinator:
      host: "coordinator.local"
      port: 8080
    workers:
      - host: "worker-1.local"
        port: 8081
      - host: "worker-2.local"
        port: 8082
        
  communication:
    protocol: "grpc"
    health_check_interval: 10s
    
  scaling:
    auto_scale: true
    min_workers: 2
    max_workers: 10
    scale_up_threshold: 0.8
    scale_down_threshold: 0.2
```

### Run Mode Comparison

```yaml
ComparisonMatrix:
  features:
    - name: "Startup Time"
      standalone: "<1s"
      embedded: "0s"
      distributed: "<5s"
      
    - name: "Max Connections"
      standalone: "1000"
      embedded: "N/A"
      distributed: "10000+"
      
    - name: "Fault Tolerance"
      standalone: "none"
      embedded: "app-dependent"
      distributed: "automatic"
      
    - name: "Scaling"
      standalone: "vertical"
      embedded: "N/A"
      distributed: "horizontal"
      
    - name: "Complexity"
      standalone: "low"
      embedded: "low"
      distributed: "high"
```

### Mode Selection Guide

```yaml
SelectionGuide:
  development:
    recommended: "standalone"
    reason: "Simple, fast iteration"
    
  testing:
    recommended: "embedded"
    reason: "No network overhead, deterministic"
    
  small_production:
    recommended: "standalone"
    reason: "Simple deployment, sufficient capacity"
    
  large_production:
    recommended: "distributed"
    reason: "Horizontal scaling, fault tolerance"
    
  edge_deployment:
    recommended: "embedded"
    reason: "Low resource usage, no network"
```

### Configuration Examples

```yaml
Examples:
  development:
    ```yaml
    mcp:
      mode: "standalone"
      host: "localhost"
      port: 8080
      log_level: "debug"
    ```
    
  production_single:
    ```yaml
    mcp:
      mode: "standalone"
      host: "0.0.0.0"
      port: 8080
      workers: 8
      security:
        auth_required: true
        rate_limit: 1000
    ```
    
  production_distributed:
    ```yaml
    mcp:
      mode: "distributed"
      coordinator:
        host: "coordinator.internal"
        port: 8080
      workers:
        - host: "worker-1.internal"
          port: 8081
        - host: "worker-2.internal"
          port: 8082
        - host: "worker-3.internal"
          port: 8083
      auto_scale:
        enabled: true
        min: 2
        max: 10
    ```
    
  embedded:
    ```yaml
    mcp:
      mode: "embedded"
      in_process: true
    ```
```

### Environment Variables

```yaml
EnvironmentVariables:
  SPECLANG_MCP_MODE:
    description: "Run mode selection"
    values: "standalone | embedded | distributed"
    default: "standalone"
    
  SPECLANG_MCP_PORT:
    description: "Server port"
    default: "8080"
    
  SPECLANG_MCP_HOST:
    description: "Server host"
    default: "0.0.0.0"
    
  SPECLANG_MCP_WORKERS:
    description: "Worker count"
    default: "4"
    
  SPECLANG_MCP_COORDINATOR:
    description: "Coordinator address for distributed mode"
    default: ""
```

## Backwards Compatibility

- Configuration format stable across modes
- API compatible between modes
- Migration scripts for config updates

## References

- @ref:specs/mcp
- SIP 114: MCP Architecture
- SIP 43: MCP Daemon
- SIP 50: MCP Tools Detailed

## Copyright

This document is in the public domain.
