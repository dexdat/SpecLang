# speclang-header lines:10
id: "@speclang/project-maturity-levels/depth-requirements"
version: 0.1.0
layer: 2
tags: [project, maturity, depth, requirements, scope]
parent: "@ref:specs/project-maturity-levels
project_level: Alpha
agent_support: agent_autonomous
short: Depth Requirements by Project Scope - How much spec expansion is needed
---
# Depth Requirements by Project Scope

Defines how much spec depth and validation is required based on project scope (weekend project vs enterprise project).

## Overview

```speclang
# @block:depth/overview @kind:note
Project scope determines depth requirements:

- **Weekend Project**: Minimal depth, rapid iteration, fewer guardrails
- **Enterprise Project**: Maximum depth, comprehensive validation, strict compliance
- **User-configurable**: Developers can modify depth requirements via `.opencode/skills/` definitions
- **AI-guided expansion**: The system expands specs to meet the defined requirements

Depth requirements influence:
- How many layers of specs are created
- How much validation is added
- Testing rigor and coverage
- Security and compliance checks
- Documentation completeness
```

## Depth Requirements Table

### @depth/requirements-table

```speclang
# @block:depth/requirements-table @kind:table
| Project Level | Typical Depth | Validation Level | Testing Requirements | Security | Documentation |
|---------------|---------------|------------------|----------------------|----------|---------------|
| **POC** | 1-3 layers | Minimal | Basic smoke tests | None | Inline comments |
| **MVP** | 2-4 layers | Basic | Core functionality tests | Basic input validation | README + API docs |
| **Alpha** | 3-5 layers | Moderate | Unit tests for critical paths | Input validation + basic auth | API docs + architecture overview |
| **Beta** | 4-6 layers | Comprehensive | Unit + integration tests | Full auth + rate limiting | Comprehensive docs + examples |
| **Production** | 5-7 layers | Strict | Full test suite + E2E | Security scanning + compliance | Full documentation + tutorials |
| **Startup** | 3-5 layers | Pragmatic | Focus on critical paths | Essential security | Lean but complete docs |
| **SMB** | 5-7 layers | Systematic | Comprehensive test suite | Compliance beginnings | Process documentation |
| **MSB** | 6-8 layers | Rigorous | Full test suite + load tests | Strict compliance | Enterprise documentation |
| **Enterprise** | 7-10+ layers | Maximum | Full suite + penetration tests | Maximum compliance | Full enterprise documentation |
```

## Depth by Layer Type

### @depth/layer-breakdown

```speclang
# @block:depth/layer-breakdown @kind:entity
DepthBreakdown:
  
  weekend_project: "POC/MVP/Startup"
  typical_structure:
    - Layer 0: project.scl (north star)
    - Layer 1: Core feature specs (auth, database, api)
    - Layer 2: Key component specs
    - Layer 3: Implementation details for critical paths
    - Layer 4: Code specs for core functionality
    - Layer 5: Generated code
    - Testing: Unit tests for critical paths only
    
  enterprise_project: "SMB/MSB/Enterprise"
  typical_structure:
    - Layer 0: project.scl (north star)
    - Layer 1: Feature specs with compliance requirements
    - Layer 2: Component specs with security reviews
    - Layer 3: Detailed implementation specs
    - Layer 4: Integration specs
    - Layer 5: Code specs with full validation
    - Layer 6: Generated code with security headers
    - Layer 7: Test specs (unit, integration, E2E)
    - Layer 8: Deployment specs
    - Layer 9: Monitoring/observability specs
    - Layer 10: Compliance/documentation specs
    - Testing: Full test pyramid with security scans
```

## User Configuration

### @depth/user-configuration

```speclang
# @block:depth/user-configuration @kind:entity
UserConfiguration:
  
  config_location: ".opencode/skills/depth-requirements.skill.md"
  
  configurable_aspects:
    - minimum_layers: "Minimum number of spec layers required"
    - validation_level: "How strict validation should be"
    - test_coverage: "Minimum test coverage percentage"
    - security_requirements: "List of security requirements"
    - documentation_requirements: "Documentation completeness level"
    - compliance_frameworks: "List of compliance frameworks (SOC2, GDPR, etc.)"
    
  example_config:
    ```yaml
    depth_requirements:
      project_scope: "enterprise"
      minimum_layers: 7
      validation_level: "strict"
      test_coverage: 90
      security_requirements:
        - input_validation
        - authentication
        - authorization
        - encryption_at_rest
        - encryption_in_transit
      documentation_requirements: "comprehensive"
      compliance_frameworks:
        - SOC2
        - GDPR
    ```
    
  agent_behavior:
    - Agents read depth requirements from config
    - Expand specs to meet minimum layer requirements
    - Add validation rules based on validation_level
    - Generate tests to achieve test_coverage
    - Include security features from security_requirements
    - Produce documentation per documentation_requirements
```

## AI-Guided Expansion

### @depth/ai-expansion

```speclang
# @block:depth/ai-expansion @kind:entity
AIExpansion:
  
  process: "AI expands specs to meet depth requirements"
  
  steps:
    1. Read project scope and depth requirements
    2. Analyze current spec depth
    3. Identify gaps against requirements
    4. Generate additional spec layers to fill gaps
    5. Add missing validation, tests, security, documentation
    6. Verify depth requirements are met
    
  example_weekend_project:
    - User: "Build a todo app for weekend project"
    - AI: Creates 3-layer structure (project → features → code)
    - Focus: Core functionality, minimal validation
    - Result: Working app with basic features
    
  example_enterprise_project:
    - User: "Build enterprise customer portal"
    - AI: Creates 8-layer structure with compliance
    - Focus: Security, scalability, compliance, full test suite
    - Result: Production-ready system with all enterprise features
    
  adaptive_expansion:
    - Start with minimum viable depth
    - Expand as project evolves
    - User can adjust requirements mid-project
    - AI re-evaluates and adjusts depth accordingly
```

## Real Code Generation

### @depth/code-generation

```speclang
# @block:depth/code-generation @kind:note
Specs produce real Go/TypeScript/Python code:

- Generated code includes headers pointing back to specs (the "ghost")
- Code compiles and runs immediately
- Depth requirements affect generated code:
  - Weekend project: Minimal error handling, basic structure
  - Enterprise project: Comprehensive error handling, logging, monitoring, security
  
Example Go code header:
```go
// speclang-header
// id: @generated/auth/handler-go
// source: @specs/auth#login
// depth: 5
// project_level: Enterprise
// validation_level: strict

package auth

// Real Go code that compiles with go build
func Login(email, password string) (*Token, error) {
    // Enterprise-level validation and error handling
}
```
```

## Integration with Cascade

### @depth/cascade-integration

```speclang
# @block:depth/cascade-integration @kind:entity
CascadeIntegration:
  
  depth_aware_cascade:
    - Cascade expands specs to required depth
    - Stops when depth requirements are met
    - Can be configured to "over-expand" for safety margin
    
  validation_gates:
    - Each layer must pass validation before next layer
    - Validation strictness based on project_level
    - Failure triggers message to MCP inbox
    
  progressive_depth:
    - Start with POC depth, expand to Enterprise as project matures
    - User can upgrade project_level at any time
    - Cascade re-evaluates and expands to new depth requirements
```

## Examples

### @depth/examples

```speclang
# @block:depth/examples @kind:code
```yaml
# Weekend project (POC) - Todo App
project_scope: weekend
depth_requirements:
  minimum_layers: 3
  validation_level: minimal
  test_coverage: 50
  security_requirements: []
  documentation_requirements: basic

# Resulting spec structure:
# Layer 0: project.scl - "Todo app with user accounts"
# Layer 1: specs/todo.spec.md - Core todo features
# Layer 2: specs/todo/entities.spec.yaml - Todo item, user entities
# Layer 3: specs/todo/handler.go.spec - Go handler code spec
# Layer 4: generated/go/todo/handler.go - Real Go code

# Enterprise project - Customer Portal
project_scope: enterprise  
depth_requirements:
  minimum_layers: 8
  validation_level: strict
  test_coverage: 95
  security_requirements:
    - authentication
    - authorization
    - input_validation
    - encryption_at_rest
    - encryption_in_transit
    - audit_logging
  documentation_requirements: comprehensive
  compliance_frameworks:
    - SOC2
    - GDPR

# Resulting spec structure:
# Layer 0: project.scl - "Enterprise customer portal"
# Layer 1: specs/auth.spec.md - Authentication with MFA
# Layer 2: specs/auth/entities.spec.yaml - User, role, permission entities
# Layer 3: specs/auth/implementation.spec.yaml - Detailed implementation
# Layer 4: specs/auth/integration.spec.yaml - Integration with SSO
# Layer 5: specs/auth/handler.go.spec - Go handler with full validation
# Layer 6: generated/go/auth/handler.go - Real Go code with security
# Layer 7: specs/auth/tests.spec.md - Unit, integration, E2E tests
# Layer 8: specs/auth/deployment.spec.yaml - Deployment configuration
# Layer 9: specs/auth/monitoring.spec.yaml - Monitoring and alerts
# Layer 10: specs/auth/compliance.spec.md - Compliance documentation
```
```

## References

- "@ref:specs/project-maturity-levels/levels - Project level definitions
- @ref:specs/project-maturity-levels/criteria - Detailed criteria
- @ref:specs/layer-definitions - Layer definitions and examples
- @ref:specs/cascade - Cascade system integration