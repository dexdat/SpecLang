---
name: sip-119-ui-health-speclang-v0
title: "SIP 119: UI Health Component"
version: 0.1.0
description: Health status component for SpecLang dashboard
category: standard
---

# SIP 119: UI Health Component

**Status:** Draft  
**Version:** 0.1.0  
**Author:** SpecLang Core Team

## README

This SIP defines the Health Component for the SpecLang UI dashboard, displaying system health, agent status, and service availability.

### Quick Start

```yaml
HealthComponent:
  status: healthy | degraded | unhealthy
  checks:
    - name: database
      status: passing | failing
      latency_ms: 25
    - name: agents
      status: passing
      active: 3
    - name: cascade
      status: passing
      cascades_today: 12
```

### When to Read This

- **Building dashboard**: Health component integration
- **Monitoring**: System status display
- **Alerts**: Health-based alerting

### Related SIPs

- SIP 36: UI Specification
- SIP 43: MCP Daemon
- SIP 51: Daemon Events

## Abstract

The Health Component displays real-time system health status in the SpecLang dashboard, showing database connectivity, agent availability, cascade status, and other critical system metrics.

## Motivation

Users need:
- **Quick status**: Is the system healthy?
- **Component health**: What specifically is failing?
- **Historical**: Health over time

## Rationale

**Health Aggregator Pattern:**

1. Poll each health check
2. Aggregate statuses
3. Display with visual indicators
4. Alert on degraded/unhealthy

## Specification

### Component Structure

```yaml
HealthComponent:
  header:
    id: "@specs/ui-health"
    version: 1.0.0
    layer: 6
    tags: [ui, health, dashboard, monitoring]
    
  layout:
    type: card
    position: header_right
    refresh_interval: 30s
    
  checks:
    - name: database
      endpoint: /health/database
      timeout: 5s
      critical: true
      
    - name: agents
      endpoint: /health/agents
      timeout: 5s
      critical: false
      
    - name: cascade
      endpoint: /health/cascade
      timeout: 5s
      critical: false
```

### Health Check Types

```yaml
HealthCheckTypes:
  database:
    query: "SELECT 1"
    expected_latency: <100ms
    
  agent:
    ping_all: true
    expected_active: >0
    
  cascade:
    recent_cascades: 24h
    expected_max_failed: 3
    
  filesystem:
    watch_paths: ["specs/", ".speclang/"]
    expected_writable: true
```

### Display States

```yaml
DisplayStates:
  healthy:
    color: green
    icon: check_circle
    message: "All systems operational"
    
  degraded:
    color: yellow
    icon: warning
    message: "Some services degraded"
    
  unhealthy:
    color: red
    icon: error
    message: "Critical services down"
```

### Health Response Format

```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "checks": [
    {
      "name": "database",
      "status": "passing",
      "latency_ms": 25,
      "message": "Connected"
    },
    {
      "name": "agents",
      "status": "passing",
      "active": 3,
      "idle": 1
    },
    {
      "name": "cascade",
      "status": "passing",
      "cascades_today": 12,
      "failed": 0
    }
  ]
}
```

### Component Implementation

```python
from dataclasses import dataclass
from typing import List, Dict, Optional
from enum import Enum
from datetime import datetime

class HealthStatus(Enum):
    HEALTHY = "healthy"
    DEGRADED = "degraded"
    UNHEALTHY = "unhealthy"

class CheckStatus(Enum):
    PASSING = "passing"
    FAILING = "failing"
    UNKNOWN = "unknown"

@dataclass
class HealthCheck:
    name: str
    status: CheckStatus
    latency_ms: Optional[int] = None
    message: Optional[str] = None
    details: Dict = None
    
    def to_dict(self) -> dict:
        result = {
            "name": self.name,
            "status": self.status.value
        }
        if self.latency_ms is not None:
            result["latency_ms"] = self.latency_ms
        if self.message:
            result["message"] = self.message
        if self.details:
            result["details"] = self.details
        return result

@dataclass
class HealthResponse:
    status: HealthStatus
    timestamp: datetime
    checks: List[HealthCheck]
    
    def to_dict(self) -> dict:
        return {
            "status": self.status.value,
            "timestamp": self.timestamp.isoformat(),
            "checks": [check.to_dict() for check in self.checks]
        }

class HealthAggregator:
    def __init__(self, config: dict):
        self.config = config
        self.checks = config.get("checks", [])
        
    async def get_health(self) -> HealthResponse:
        """Aggregate all health checks."""
        
        check_results = []
        
        for check_config in self.checks:
            result = await self._run_check(check_config)
            check_results.append(result)
        
        overall_status = self._aggregate_status(check_results)
        
        return HealthResponse(
            status=overall_status,
            timestamp=datetime.utcnow(),
            checks=check_results
        )
    
    async def _run_check(self, config: dict) -> HealthCheck:
        """Run a single health check."""
        
        check_type = config["type"]
        
        if check_type == "database":
            return await self._check_database(config)
        elif check_type == "agent":
            return await self._check_agents(config)
        elif check_type == "cascade":
            return await self._check_cascade(config)
        else:
            return HealthCheck(
                name=config["name"],
                status=CheckStatus.UNKNOWN,
                message=f"Unknown check type: {check_type}"
            )
    
    async def _check_database(self, config: dict) -> HealthCheck:
        """Check database connectivity."""
        
        start = datetime.utcnow()
        
        try:
            result = await self.db.query("SELECT 1")
            latency = (datetime.utcnow() - start).total_seconds() * 1000
            
            return HealthCheck(
                name=config["name"],
                status=CheckStatus.PASSING,
                latency_ms=int(latency),
                message="Connected"
            )
        except Exception as e:
            return HealthCheck(
                name=config["name"],
                status=CheckStatus.FAILING,
                message=str(e)
            )
    
    async def _check_agents(self, config: dict) -> HealthCheck:
        """Check agent availability."""
        
        try:
            agents = await self.agent_manager.list_agents()
            active = sum(1 for a in agents if a.status == "active")
            idle = sum(1 for a in agents if a.status == "idle")
            
            status = CheckStatus.PASSING if active > 0 else CheckStatus.FAILING
            
            return HealthCheck(
                name=config["name"],
                status=status,
                details={"active": active, "idle": idle},
                message=f"{active} active, {idle} idle"
            )
        except Exception as e:
            return HealthCheck(
                name=config["name"],
                status=CheckStatus.FAILING,
                message=str(e)
            )
    
    async def _check_cascade(self, config: dict) -> HealthCheck:
        """Check cascade system health."""
        
        try:
            cascades = await self.cascade_manager.get_recent(
                hours=24
            )
            
            total = len(cascades)
            failed = sum(1 for c in cascades if c.status == "failed")
            
            status = CheckStatus.PASSING if failed <= 3 else CheckStatus.FAILING
            
            return HealthCheck(
                name=config["name"],
                status=status,
                details={"total": total, "failed": failed},
                message=f"{total} cascades, {failed} failed"
            )
        except Exception as e:
            return HealthCheck(
                name=config["name"],
                status=CheckStatus.FAILING,
                message=str(e)
            )
    
    def _aggregate_status(self, checks: List[HealthCheck]) -> HealthStatus:
        """Aggregate individual check statuses."""
        
        has_critical_failing = False
        has_noncritical_failing = False
        
        for check in checks:
            if check.status == CheckStatus.FAILING:
                if self._is_critical(check.name):
                    has_critical_failing = True
                else:
                    has_noncritical_failing = True
        
        if has_critical_failing:
            return HealthStatus.UNHEALTHY
        elif has_noncritical_failing:
            return HealthStatus.DEGRADED
        else:
            return HealthStatus.HEALTHY
    
    def _is_critical(self, check_name: str) -> bool:
        """Check if a health check is critical."""
        
        critical_checks = self.config.get("critical_checks", ["database"])
        return check_name in critical_checks
```

### Health Endpoint

```python
class HealthEndpoint:
    def __init__(self, aggregator: HealthAggregator):
        self.aggregator = aggregator
        
    async def handle(self, request) -> Response:
        """Handle health check request."""
        
        health = await self.aggregator.get_health()
        
        status_code = {
            HealthStatus.HEALTHY: 200,
            HealthStatus.DEGRADED: 200,
            HealthStatus.UNHEALTHY: 503
        }[health.status]
        
        return Response(
            status_code=status_code,
            body=json.dumps(health.to_dict())
        )
```

## Backwards Compatibility

- Health checks can be added without breaking
- New check types handled gracefully

## Security Implications

- Health endpoints may expose system info
- Consider authentication for health data

## References

- @ref:specs/ui-specification
- SIP 36: UI Specification
- SIP 43: MCP Daemon
- SIP 51: Daemon Events

## Copyright

This document is in the public domain.
