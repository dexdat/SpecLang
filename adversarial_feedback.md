# Adversarial Feedback on SpecLang Autonomous Agent Depth Requirements

**Idea**: Recent updates to SpecLang specs added autonomous agent depth requirements (layer, project_level, agent_support fields) and project maturity levels to enable "specs have enough depth to be used by autonomous agents totally."

**Context**: The updates appear in `speclang.spec.md` (block `@speclang/autonomous-readiness`), `headers.spec.md` (field definitions), and `spec-format.spec.md`. The goal is to make specs sufficiently detailed for autonomous agents to generate code, tests, and further specs without human intervention.

---

## Devil's Advocate

- **Metadata without enforcement**: Adding `agent_support: agent_autonomous` is just a label; there's no validation that the spec actually contains enough detail for autonomous operation. Agents could blindly trust the flag and produce broken code from vague specs.

- **Circular definition**: The `@speclang/autonomous-readiness` block states "specs should have enough depth to be used by autonomous agents totally" but doesn't define what "enough depth" means. This is a tautology—depth is defined by the ability to be used autonomously, which is what we're trying to achieve.

- **Missing semantic mapping**: The `project_level` enum (POC, MVP, Alpha, Beta, Production, Startup, SMB, MSB, Enterprise) has no defined meaning. What distinguishes Startup from SMB? What does MSB stand for? Without clear criteria for each level, the field is decorative rather than functional.

- **Layer ambiguity**: The `layer` field (0‑10) is described as "abstraction depth" but lacks concrete guidelines. Is layer 0 always north star? What should be at layer 5 vs layer 8? Without a shared understanding, agents cannot reliably interpret layer numbers.

- **No transition guidance**: There's no specification for how a spec should evolve as `project_level` advances from POC to Production. What additional details, validation, or completeness are required at each stage? Without this, the maturity levels are just milestones without actionable steps.

---

## Assumption Buster

- **Assumption**: Adding three header fields (`layer`, `project_level`, `agent_support`) is sufficient to guide autonomous agents.  
  **Challenge**: Fields are passive metadata; agents need active rules, validation, and behavior changes based on these values. Without tooling that enforces or reacts to them, they are merely comments.

- **Assumption**: The enum values for `project_level` are self‑explanatory and universally understood.  
  **Challenge**: "Startup", "SMB", "MSB", "Enterprise" are business‑size categories, not project‑maturity stages. Mixing them with development phases (POC, MVP, Alpha, Beta, Production) creates a confused taxonomy. What does "Startup" mean for a spec's depth?

- **Assumption**: Spec authors will accurately label their specs with appropriate `agent_support`.  
  **Challenge**: Authors may over‑promise (mark a vague spec as `agent_autonomous`) to avoid human involvement, leading to agent failures. There's no verification or penalty for mislabeling.

- **Assumption**: The `layer` field will be used consistently across all specs in a project.  
  **Challenge**: Without a reference mapping (e.g., layer 0 = north star, layer 1 = feature overview, layer 2 = component, etc.), different authors will assign layers arbitrarily, breaking any layer‑based automation.

- **Assumption**: Autonomous agents can rely solely on the spec content and these three fields to make decisions.  
  **Challenge**: Agents also need context about the project's technology stack, coding conventions, testing frameworks, and deployment environment—none of which are captured by the new fields. The spec format still lacks a place for such project‑wide configuration.

---

## Red Team

- **Attack vector: malicious metadata**: An adversary could set `agent_support: agent_autonomous` on a deliberately ambiguous spec, causing the agent to generate incorrect or insecure code. The system has no way to detect that the spec lacks the required depth.

- **Exploitation of undefined behavior**: Since `project_level` has no defined effect on agent behavior, an agent could assume (incorrectly) that "Production" means no human oversight and automatically deploy generated code, leading to production incidents.

- **Weakest link: inconsistent layer usage**: If some specs use layer 5 for high‑level design and others use layer 5 for low‑level implementation, any agent that tries to assemble a coherent view of the system will produce garbage. The lack of layer semantics invites inconsistency.

- **Competitive threat**: A competing system could implement the same header fields but with clear semantics and validation, making SpecLang appear incomplete and untrustworthy for autonomous operation.

- **Failure scenario: cascade of mislabeled specs**: One mislabeled `agent_autonomous` spec triggers an agent to generate code, which creates new specs that inherit the same label, propagating the error throughout the project. The system lacks a "sanity‑check" step to validate labels before cascading.

- **Resource exhaustion**: Agents might treat `project_level: Enterprise` as a signal to generate exhaustive documentation, run expensive static analysis, or produce redundant implementations, wasting computational resources and time.

- **Lock‑in risk**: The custom enum values (Startup, SMB, MSB) are not industry‑standard terms. Teams accustomed to other maturity models (e.g., CMMI, ISO) may reject SpecLang because of its unfamiliar taxonomy.

---

## Edge Cases & Misuse Scenarios

- **Spec with `agent_support: agent_autonomous` but no `@ref` links**: An agent might be unable to resolve dependencies and could either guess (dangerous) or give up (breaking autonomy). No fallback behavior is defined.

- **Spec with `project_level: Production` and `layer: 0`**: A north‑star‑level spec marked as Production might be interpreted as "ready for deployment," though it contains only high‑level intent. Agents could incorrectly assume all downstream specs are equally mature.

- **Mixed maturity in a single project**: Some specs labeled Alpha, others Beta. How should agents behave when reading a Beta spec that depends on an Alpha spec? No protocol for handling mixed maturity levels.

- **Human edits to generated code when `agent_support: agent_autonomous`**: The BackSync agent is supposed to propose spec updates, but if the spec claims to be autonomous, should human edits be allowed at all? The system doesn't define a read‑only boundary for autonomous‑ready specs.

- **Upgrading a spec from `agent_assisted` to `agent_autonomous`**: What changes are required? No checklist or automated validation exists to ensure the upgrade is valid.

---

## Conclusion

The updates introduce useful metadata fields but fall short of enabling fully autonomous agent operation. The fields are passive labels without validation, clear semantics, or behavioral impact. To truly meet the goal, SpecLang needs:

1. **Validation rules**: Tools that check whether a spec labeled `agent_autonomous` actually contains sufficient detail (e.g., all operations have step‑by‑step descriptions, all references resolve, no ambiguous natural language).

2. **Semantic definitions**: Concrete definitions for each `project_level` and `layer` value, along with guidelines for what a spec at each level should contain.

3. **Agent behavior matrix**: Explicit rules for how each agent (SpecWriter, CodeGen, etc.) should adjust its behavior based on `project_level` and `agent_support` (e.g., ask for human confirmation at POC, auto‑generate at Production).

4. **Transition workflows**: Procedures for moving a spec from one maturity level to another, including required reviews, tests, and completeness checks.

5. **Safety nets**: Mechanisms to detect mislabeled specs, either through automated analysis or peer‑review hooks, before they cause autonomous agents to fail.

Without these enhancements, the new fields risk being decorative rather than functional, and the goal of "specs have enough depth to be used by autonomous agents totally" remains unmet.