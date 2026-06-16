# speclang-header lines:6
id: "@speclang/project-maturity"
version: 1.0.0
layer: 1
short: "Project maturity levels and requirements"
tags: [maturity, levels, requirements, validation]
---

# Project Maturity Levels

Defines maturity levels from POC to Enterprise with associated requirements.

## Maturity Levels

### @maturity/overview

SpecLang supports 9 maturity levels:

| Level | Code | Description |
|-------|------|-------------|
| POC | poc | Proof of Concept - experimental |
| MVP | mvp | Minimum Viable Product - core features |
| Alpha | alpha | Internal testing, incomplete |
| Beta | beta | External testing, feature complete |
| Production | production | Stable, production-ready |
| Startup | startup | Small team, rapid iteration |
| SMB | smb | Small/Medium Business scale |
| MSB | msb | Medium/Large Business scale |
| Enterprise | enterprise | Maximum scale, strict governance |

## Requirements by Level

### @maturity/requirements

Each level has specific requirements for:

1. **Validation Depth**: How thorough validation must be
2. **Documentation**: Required documentation coverage
3. **Testing**: Test coverage requirements
4. **Security**: Security review requirements
5. **Compliance**: Regulatory compliance needs

## Level Transitions

### @maturity/transitions

Rules for moving between maturity levels.

**Upgrade Requirements:**
- All current level requirements met
- Next level requirements planned
- Team capacity assessment
- Risk evaluation

**Downgrade Triggers:**
- Critical failures in production
- Security incidents
- Compliance violations
