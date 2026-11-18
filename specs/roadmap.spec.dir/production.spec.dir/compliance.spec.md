# speclang-header lines:12
id: "@speclang/roadmap/production/compliance"
parent: "@ref:speclang/roadmap/production"
version: 0.1.0
layer: 2
project_level: Production
agent_support: agent_assisted
status: draft
tags: [roadmap, production, compliance, privacy]
imports: ["@speclang/safety-nets"]
short: Production compliance controls, retention, and evidence-backed reporting
---

# Production: Compliance

## Scope

Extracts compliance requirements from @ref:speclang/roadmap/production.
SOC 2 and GDPR are milestone requirements; creating this spec grants no
certification and makes no claim that those requirements are already satisfied.

## Requirements

### @block::controls @kind:policy

- Maintain controls and evidence for SOC 2 and GDPR requirements.
- Encrypt data at rest and detect and handle personally identifiable information.
- Define and apply data retention policies.
- Run automated compliance checks and produce auditable reports.

## Acceptance Criteria

- Each report maps a requirement to a checked control and supporting evidence.
- Mark a requirement compliant only when the evidence supports that conclusion.
- A failed or unmeasured control prevents an all-requirements-compliant result.
- Retention and PII-handling checks include both allowed and prohibited cases.
- Certification remains a separate verified milestone, not an inferred test result.
