---
id: "@speclang/scripts.fallback-protocol"
version: 0.1.0
layer: 2
tags: [scripts, fallback, safety-nets, peer-review]
parent: ""@ref:speclang/scripts"status: draft
project_level: Alpha
agent_support: agent_assisted
short: Fallback Protocol Script
target: scripts/fallback_protocol.py
---

# Fallback Protocol Script

Implements fallback protocols from `@ref:speclang/safety-nets/fallback`. Triggers fallback actions when confidence score is low, downgrades agent_support, creates review tickets.

## Overview

```speclang
# @block:overview @kind:note
The fallback-protocol script implements safety-net fallbacks defined in specs.
When agent confidence drops below thresholds, this script triggers appropriate
fallback actions to ensure system safety and human oversight.
```

## Purpose

```speclang
# @block:purpose @kind:note
Autonomous agents can make mistakes. This script provides:
1. Confidence monitoring from validation results
2. Automatic agent_support downgrades when confidence is low
3. Review ticket creation for human oversight
4. Graduated response levels (warning → review → block)
5. Audit logging of all fallback triggers
```

## Confidence Levels

```speclang
# @block:confidence @kind:entity
ConfidenceLevels:
  high:
    threshold: 0.9
    action: Normal operation
  
  medium:
    threshold: 0.7
    action: Log warning, continue
  
  low:
    threshold: 0.5
    action: Create review ticket
  
  critical:
    threshold: 0.3
    action: Block action, require human approval
```

## Fallback Actions

```speclang
# @block:actions @kind:table
| Trigger | Action | Agent Support Level |
|---------|--------|-------------------|
| Low confidence | Create review ticket | agent_assisted |
| Validation failure | Downgrade to agent_assisted | agent_autonomous |
| Repeated failures | Require human approval | agent_dependent |
| Critical error | Block action | human_only |
```

## Implementation

```speclang
# @block:implementation @kind:function
def run_fallback_protocol(validation_result: dict, config: dict) -> dict:
    """
    Execute fallback protocol based on validation results.
    
    Args:
        validation_result: Results from validation pipeline
        config: Fallback configuration thresholds
    
    Returns:
        Dict with action_taken, new_agent_support, tickets_created
    """
```

## Algorithm

```speclang
# @block:algorithm @kind:note
1. Receive validation result with confidence score
2. Compare score against configured thresholds
3. Determine appropriate action level
4. Execute fallback action:
   a. Log warning for medium confidence
   b. Create review ticket for low confidence
   c. Downgrade agent_support for validation failures
   d. Block action and notify for critical
5. Update spec header with new agent_support level
6. Record action in audit log
```

## Usage

```speclang
# @block:usage @kind:note
# Run fallback protocol on validation result
python3 scripts/fallback_protocol.py --validation result.json

# Check confidence without taking action
python3 scripts/fallback_protocol.py --validate-only --spec specs/auth.spec.md

# Configure thresholds
python3 scripts/fallback_protocol.py --config config.yaml

# Force specific action
python3 scripts/fallback_protocol.py --force-review --spec specs/auth.spec.md

# Dry run
python3 scripts/fallback_protocol.py --dry-run --validation result.json
```

## Integration Points

```speclang
# @block:integration @kind:note
The fallback-protocol integrates with:
- Validation system: Receives confidence scores
- Agent system: Updates agent_support levels
- Ticket system: Creates review tickets
- Audit logging: Records all fallback triggers
- MCP notifications: Alerts humans of actions
```

## Related Specs

```speclang
# @block:refs @kind:note
- @ref:speclang/safety-nets - Safety net specifications
- @ref:speclang/safety-nets/fallback - Fallback protocol definition
- @ref:speclang/autonomous - Autonomous agent configuration
- @ref:speclang/validation - Validation system
```