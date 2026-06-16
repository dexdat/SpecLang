---
name: sip-126-pipeline-deploy-speclang-v0
title: "SIP 126: Pipeline Deploy Stages"
version: 0.1.0
description: Deploy stage configuration, environments, and deployment strategies in pipelines
category: standard
---
# speclang-header lines:5
# id: @specs/skills
# version: 1.0.0
# layer: 5


# SIP 126: Pipeline Deploy Stages

**Status:** Draft  
**Version:** 0.1.0  
**Author:** SpecLang Core Team

## README

This SIP defines Deploy Stages—the deployment and release phases in SpecLang pipelines.

### Quick Start

```yaml
pipeline:
  deploy:
    - name: staging
      command: "kubectl apply -f k8s/"
      environment: staging
      requires_approval: false
      
    - name: production
      command: "kubectl apply -f k8s/"
      environment: production
      requires_approval: true
      approvers: ["team-lead"]
```

### When to Read This

- **Configuring deployments:** Setting up deploy stages
- **Environments:** Managing staging/production
- **Strategies:** Blue-green, canary, rolling

### Related SIPs

- SIP 13: Pipeline System
- SIP 39: Deployment
- SIP 74: Pipeline Conditions

## Abstract

This SIP specifies deploy stage configuration, environment management, deployment strategies, and approval workflows for the SpecLang pipeline system.

## Motivation

Deploy stages are needed because:
- Code must reach end users
- Multiple environments require orchestration
- Safety requires controlled rollouts
- Approvals are often required for production

## Specification

### Deploy Stage Configuration

```yaml
DeployStage:
  name: string              # Stage identifier
  command: string           # Deploy command to execute
  environment: string       # Target environment
  strategy: DeployStrategy # "rolling" | "blue_green" | "canary" | "recreate"
  requires_approval: boolean # Require approval (default: false)
  approvers: string[]       # Required approvers
  timeout: number          # Timeout in seconds (default: 600)
  retry: RetryConfig       # Retry configuration (optional)
  rollback_on_failure: boolean # Auto-rollback on failure
  health_check: HealthCheck # Post-deploy health check
  depends_on: string[]     # Stage dependencies (optional)
  condition: string        # Conditional execution (optional)
```

### Deployment Strategies

```yaml
DeployStrategies:
  rolling:
    description: "Gradual replacement of instances"
    max_surge: "25%"
    max_unavailable: "0%"
    
  blue_green:
    description: "Switch between two identical environments"
    verify_before_switch: true
    stay_on_old: 600  # seconds
    
  canary:
    description: "Gradual traffic shift"
    initial_percentage: 10
    increment: 10
    interval: 300  # seconds
    
  recreate:
    description: "Destroy and recreate all instances"
    downtime: true
```

### Environment Configuration

```yaml
Environment:
  name: string              # Environment name
  type: "development" | "staging" | "production"
  cluster: string          # Target cluster
  region: string           # Target region
  namespace: string         # Kubernetes namespace
  replicas: number         # Instance count
  
  secrets:
    source: "vault" | "secrets_manager" | "env"
    paths: string[]
    
  variables:
    ENVIRONMENT: staging
    LOG_LEVEL: info
    
  ingress:
    domain: "staging.example.com"
    tls: true
```

### Approval Workflow

```yaml
ApprovalConfig:
  required: boolean         # Approval required
  approvers: string[]       # Specific approvers
  roles: string[]          # Roles that can approve
  timeout: number          # Approval timeout (default: 24h)
  notification: object     # Notification config
  
  # Auto-approval rules
  auto_approve:
    - if: "branch == 'main' && changed_files < 10"
    - if: "author in trusted_authors"
```

### Health Check Configuration

```yaml
HealthCheck:
  enabled: boolean          # Enable health checks
  path: string             # Health check endpoint
  port: number            # Port to check
  protocol: "http" | "tcp" | "command"
  interval: number         # Check interval (seconds)
  timeout: number         # Check timeout (seconds)
  healthy_threshold: number # Consecutive successes
  unhealthy_threshold: number # Consecutive failures
  
  # HTTP-specific
  headers: object          # Request headers
  expected_status: 200    # Expected status code
  
  # Command-specific
  command: string         # Health check command
```

### Deployment Configuration Examples

```yaml
# .speclang/pipeline.yaml
pipeline:
  deploy:
    - name: deploy-staging
      command: "kubectl apply -f k8s/staging/"
      environment: staging
      strategy: rolling
      requires_approval: false
      health_check:
        enabled: true
        path: /health
        port: 8080
        interval: 10
        timeout: 5
        healthy_threshold: 3
        unhealthy_threshold: 3
        
    - name: deploy-production
      command: "kubectl apply -f k8s/production/"
      environment: production
      strategy: canary
      initial_percentage: 10
      requires_approval: true
      approvers: ["team-lead", "release-manager"]
      rollback_on_failure: true
      health_check:
        enabled: true
        path: /health
        port: 8080
```

### Blue-Green Deployment

```yaml
blue_green:
  name: production
  strategy: blue_green
  blue:
    name: production-blue
    instances: 3
    selector: version=blue
  green:
    name: production-green
    instances: 3
    selector: version=green
    
  steps:
    - Deploy to green
    - Run smoke tests
    - Switch traffic to green
    - Monitor for errors
    - Keep blue for rollback window
```

### Canary Deployment

```yaml
canary:
  name: production
  strategy: canary
  
  schedule:
    - percentage: 10
      duration: 300  # 5 minutes
    - percentage: 25
      duration: 300
    - percentage: 50
      duration: 300
    - percentage: 100
      duration: 300
      
  metrics:
    - name: error_rate
      threshold: < 1%
    - name: latency_p99
      threshold: < 500ms
      
  rollback:
    if: "error_rate > 5%"
    automatic: true
```

### Rollback Configuration

```yaml
RollbackConfig:
  automatic: boolean        # Auto-rollback on failure
  triggers:
    - health_check_failed
    - metric_threshold_exceeded
    - manual_trigger
      
  steps:
    - Stop deployment
    - Restore previous version
    - Verify rollback
    - Notify team
    
  history:
    keep_last: 10
    include: ["timestamp", "version", "reason", "user"]
```

### Deploy Stage Examples

### Example 1: Kubernetes Deployment

```yaml
pipeline:
  deploy:
    - name: build-image
      command: "docker build -t app:${GIT_SHA} ."
      
    - name: push-image
      command: "docker push registry/app:${GIT_SHA}"
      depends_on: [build-image]
      
    - name: deploy-staging
      command: |
        kubectl set image deployment/app \
          app=registry/app:${GIT_SHA}
      environment: staging
      strategy: rolling
      depends_on: [push-image]
      health_check:
        path: /health
        port: 8080
        
    - name: deploy-production
      command: |
        kubectl set image deployment/app \
          app=registry/app:${GIT_SHA}
      environment: production
      strategy: canary
      requires_approval: true
      approvers: ["team-lead"]
      rollback_on_failure: true
      health_check:
        path: /health
        port: 8080
        unhealthy_threshold: 5
```

### Example 2: Multi-Environment Deploy

```yaml
pipeline:
  deploy:
    - name: deploy-dev
      command: "speclang deploy --env dev"
      environment: development
      requires_approval: false
      
    - name: deploy-staging
      command: "speclang deploy --env staging"
      environment: staging
      requires_approval: false
      depends_on: [deploy-dev]
      
    - name: smoke-tests
      command: "speclang test --env staging"
      depends_on: [deploy-staging]
      
    - name: deploy-production
      command: "speclang deploy --env production"
      environment: production
      requires_approval: true
      approvers: ["team-lead", "cto"]
      rollback_on_failure: true
      depends_on: [smoke-tests]
```

### Example 3: Terraform Infrastructure

```yaml
pipeline:
  deploy:
    - name: init-terraform
      command: "terraform init"
      
    - name: plan-infrastructure
      command: "terraform plan -out=tfplan"
      depends_on: [init-terraform]
      artifacts:
        - path: tfplan
          type: file
          
    - name: approve-prod
      command: "speclang approve"
      environment: production
      requires_approval: true
      approvers: ["infrastructure-lead"]
      depends_on: [plan-infrastructure]
      
    - name: apply-infrastructure
      command: "terraform apply tfplan"
      environment: production
      requires_approval: true
      depends_on: [approve-prod]
```

### Deploy API

```typescript
interface DeployStage {
  name: string;
  command: string;
  environment: string;
  strategy: 'rolling' | 'blue_green' | 'canary' | 'recreate';
  requires_approval: boolean;
  approvers: string[];
  timeout: number;
  retry: RetryConfig;
  rollback_on_failure: boolean;
  health_check?: HealthCheck;
  depends_on: string[];
  condition?: string;
}

interface Environment {
  name: string;
  type: 'development' | 'staging' | 'production';
  cluster: string;
  region: string;
  namespace?: string;
  replicas: number;
  secrets: SecretsConfig;
  variables: Record<string, string>;
  ingress?: IngressConfig;
}

interface HealthCheck {
  enabled: boolean;
  path?: string;
  port?: number;
  protocol: 'http' | 'tcp' | 'command';
  interval: number;
  timeout: number;
  healthy_threshold: number;
  unhealthy_threshold: number;
}

class DeployExecutor {
  async executeStage(stage: DeployStage): Promise<DeployResult> {
    if (stage.requires_approval) {
      await this.requestApproval(stage);
    }
    
    await this.deploy(stage);
    
    if (stage.health_check?.enabled) {
      await this.waitForHealthy(stage);
    }
    
    return { success: true };
  }
  
  async deploy(stage: DeployStage): Promise<void> {
    switch (stage.strategy) {
      case 'rolling':
        return this.rollingDeploy(stage);
      case 'blue_green':
        return this.blueGreenDeploy(stage);
      case 'canary':
        return this.canaryDeploy(stage);
      case 'recreate':
        return this.recreateDeploy(stage);
    }
  }
  
  async rollback(stage: DeployStage): Promise<void> {
    const previousVersion = await this.getPreviousVersion(stage);
    await this.deployVersion(stage, previousVersion);
  }
}
```

## References

- "@ref:specs/pipeline.spec.dir/deploy
- SIP 13: Pipeline System
- SIP 39: Deployment
- SIP 74: Pipeline Conditions

## Copyright

This document is in the public domain.
