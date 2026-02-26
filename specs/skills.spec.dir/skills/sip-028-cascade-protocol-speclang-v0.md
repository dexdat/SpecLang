---
name: sip-028-cascade-protocol-speclang-v0
title: "SIP 28: Cascade Protocol"
version: 0.1.0
description: Explicit coordination protocol for agent cascade within platform constraints
category: standard
---
# speclang-header lines:5
# id: @specs/skills
# version: 1.0.0
# layer: 5


# SIP 28: Cascade Protocol

**Status:** Draft  
**Version:** 0.1.0  
**Author:** SpecLang Core Team

## README

This SIP defines the Cascade Protocol—explicit coordination for reactive cascade operations.

### Quick Start

Cascade flow:
1. **Initiation**: User changes file, coordinator starts cascade
2. **Agent invocation**: Explicit task dispatch to subagents
3. **Verification**: Run validation gates after each step
4. **Steering packet**: Create accurate verification report
5. **User decision**: Continue, stop, or retry

### When to Read This

- **Understanding cascade flow:** How changes propagate
- **Building coordinators:** Implementing orchestration
- **Debugging cascades:** Why cascade failed/paused

### Related SIPs

- SIP 6: Agent Protocol
- SIP 13: Pipeline System
- SIP 25: Skills Pack
- SIP 27: Recovery System

## Abstract

This SIP defines the Cascade Protocol—an explicit coordination mechanism for SpecLang's reactive cascade system. Unlike the original automatic vision, this protocol acknowledges platform constraints (no file watching, no background processes) and provides reliable, verifiable cascade operations through explicit agent invocation and mandatory verification gates.

## Motivation

Original SpecLang vision:
- Automatic file watching
- Agents react automatically
- Convergence auto-detected
- Fully autonomous cascade

Platform reality:
- No file watching available
- No automatic agent triggering
- No background processes
- Manual coordination required

This protocol provides reliable cascade within these constraints.

## Rationale

**Explicit > Automatic:**

1. **Reliable**: Each step verified
2. **Debuggable**: Clear state tracking
3. **Controllable**: User decisions at each step
4. **Accurate**: Steering packets reflect reality

This matches production deployment practices—explicit approval gates.

## Specification

### Protocol Overview

```yaml
ProtocolFlow:
  steps:
    1_initiation:
      trigger: "User changes file or runs command"
      coordinator_action: "Read file, determine agent, init state"
      
    2_agent_invocation:
      action: "Invoke subagent via Task tool"
      input: "File paths, requirements, context"
      output: "Structured result"
      
    3_verification:
      action: "Run validation gates"
      gates: ["Reference validation", "Code compilation", "Tests"]
      
    4_steering_packet:
      action: "Create accurate verification report"
      output: "JSON packet with real metrics"
      
    5_user_decision:
      action: "Present results, ask to continue"
      options: ["continue", "stop", "retry", "modify"]
```

### Cascade State

```yaml
CascadeState:
  location: ".speclang/cascade_state.json"
  
  structure:
    cascade_id: "Unique identifier"
    depth: "Current cascade depth"
    max_depth: "Maximum allowed depth"
    status: "running|paused|completed|failed"
    trigger_file: "File that started cascade"
    current_agent: "Currently executing agent"
    agents_invoked: "List of agent results"
    verification_results: "Gate check results"
    
  example: |
    {
      "cascade_id": "cascade-20260222-001",
      "depth": 0,
      "max_depth": 5,
      "status": "running",
      "trigger_file": "specs/auth.spec.md",
      "current_agent": "speclang-code-gen",
      "agents_invoked": [
        {
          "agent": "speclang-spec-writer",
          "timestamp": "2026-02-22T10:00:00Z",
          "result": "success",
          "files_modified": ["specs/auth.spec.md"]
        }
      ],
      "verification_results": [
        {
          "step": 1,
          "checks": {
            "compilation": {"status": "passed"},
            "references": {"status": "passed"},
            "tests": {"status": "passed"}
          }
        }
      ]
    }
```

### Agent Roles

```yaml
AgentRoles:
  speclang_coordinator:
    purpose: "Orchestrates the cascade"
    actions:
      - "Invokes subagents"
      - "Tracks state"
      - "Runs verification"
    does_not:
      - "Write specs directly"
      - "Write code directly"
      
  speclang_spec_writer:
    purpose: "Creates/updates specification files"
    input:
      - "Spec file path"
      - "Content requirements"
    output:
      - "Valid spec file with proper headers"
    verification: "Must pass validate_refs.py"
    
  speclang_code_gen:
    purpose: "Generates implementation code from specs"
    input:
      - "Spec file path"
      - "Target output path"
    output:
      - "Working code that compiles"
    verification: "Must pass tsc/go build/py_compile"
    
  speclang_test_writer:
    purpose: "Creates test specifications"
    input:
      - "Implementation file"
      - "Requirements"
    output:
      - "Test specs and test code"
    verification: "Tests must pass"
    
  speclang_verifier:
    purpose: "Validates cascade output"
    input:
      - "Files to verify"
    output:
      - "Verification report"
      - "Steering packet"
    verification: "Ground truth checking"
```

### Verification Gates

```yaml
VerificationGates:
  gate_1_reference_validation:
    command: "python3 scripts/validate_refs.py"
    purpose: "Ensure all @ref: resolve"
    pass: "All references valid"
    fail: "Report broken references"
    
  gate_2_spec_readiness:
    command: "python3 scripts/validate_autonomous.py"
    purpose: "Check spec completeness"
    pass: "All checks pass"
    fail: "Report missing fields"
    
  gate_3_code_compilation:
    typescript: "npx tsc --noEmit --skipLibCheck <file>"
    go: "go build <file>"
    python: "python3 -m py_compile <file>"
    purpose: "Verify generated code compiles"
    pass: "Zero compilation errors"
    fail: "Report errors with line numbers"
    
  gate_4_test_execution:
    command: "python3 -m pytest tests/ -v"
    purpose: "Run test suite"
    pass: "All tests pass"
    fail: "Report failed tests"
```

### Cascade Flow Steps

```yaml
CascadeSteps:
  step_1_initiation:
    trigger: "User changes file"
    coordinator_actions:
      - "Identify trigger file type"
      - "Read file for context"
      - "Initialize cascade_state.json"
      - "Determine first agent"
      
    file_type_routing:
      project_scl: "North star change → spec-writer"
      specs_md: "Spec change → spec-writer or code-gen"
      code_file: "Code change → test-writer"
      
  step_2_agent_invocation:
    action: "Invoke subagent with explicit context"
    task_format: |
      task:
        description: "Step N: <action>"
        subagent_type: general
        prompt: |
          You are @speclang-<agent>.
          
          Task: <specific task>
          
          Context:
          - Trigger: <file>
          - Parent spec: @ref:<path>
          - Target layer: <N>
          
          Requirements:
          1. <requirement 1>
          2. <requirement 2>
          
          Return structured report:
          {
            "agent": "<agent-name>",
            "status": "success|failure",
            "files_modified": [...],
            "errors": []
          }
          
  step_3_verification:
    action: "Run verification gates"
    commands:
      - "python3 scripts/validate_refs.py"
      - "python3 scripts/validate_autonomous.py"
      - "npx tsc --noEmit (if code generated)"
      - "pytest tests/ (if tests exist)"
      
  step_4_steering_packet:
    action: "Create accurate packet"
    content:
      - "Type: success_confirmation or error_report"
      - "Task ID"
      - "Verification details with command outputs"
      - "Quality score based on real metrics"
      
  step_5_user_decision:
    action: "Present results, ask for continuation"
    format: |
      Cascade Step N Complete
      
      Results:
      ✓ <success 1>
      ✓ <success 2>
      ✗ <failure 1>
      
      Quality score: X.XX
      
      Next step: <description>
      Agent: @speclang-<agent>
      
      Continue cascade? (yes / no / retry / modify)
```

### Error Handling

```yaml
ErrorHandling:
  compilation_failure:
    format: |
      Step N FAILED: Code compilation
      
      Error:
      <file>(<line>,<col>): error <code>: <message>
      
      Fix options:
      1. <option 1>
      2. <option 2>
      
      Retry with fix? (1 / 2 / abort)
      
  broken_references:
    format: |
      Step N FAILED: Reference validation
      
      Broken references:
      - <file>: @ref:<path> (not found)
      
      Fix options:
      1. Create <spec>
      2. Remove reference
      3. Update reference
      
  test_failure:
    format: |
      Step N FAILED: Test execution
      
      Test results:
      - <test>: PASSED
      - <test>: FAILED
        <error details>
      
      Retry code-gen with fixes? (yes / no)
```

### Cascade Termination

```yaml
Termination:
  successful_completion:
    state:
      status: "completed"
      steps_completed: N
      verification_summary: "all passed"
      
  depth_limit_reached:
    condition: "depth > max_depth"
    action: "Pause cascade, notify user"
    format: |
      WARNING: Cascade depth limit reached (N)
      
      Agents invoked:
      1. <agent> (<file>)
      2. <agent> (<file>)
      
      CASCADE PAUSED
      
      Options:
      - Force continue
      - Review and restart
      - Manual intervention
      
  user_abort:
    action: "User says no"
    format: |
      CASCADE ABORTED BY USER
      
      Completed steps: N
      Current step: <description>
      
      To resume: @speclang-coordinator continue
```

### Multi-Tree Spanning

```yaml
MultiTreeGeneration:
  description: "Core capability - cascade across dependency trees"
  
  trees:
    spec_tree:
      layers: "0-5"
      content: "Specification files"
      agent: "speclang-spec-writer"
      
    code_tree:
      layers: "6-10"
      content: "Implementation code"
      agent: "speclang-code-gen"
      
    test_tree:
      layers: "10+"
      content: "Test files"
      agent: "speclang-test-writer"
      
    docs_tree:
      layers: "any"
      content: "Documentation"
      agent: "speclang-doc-gen"
      
  traversal_algorithm:
    1: "Build dependency graph from _index.json"
    2: "Order by layer (0 → 1 → 2 → ... → 10)"
    3: "Process each layer sequentially"
    4: "Verify after each layer"
    5: "User checkpoint between major trees"
    
  example_flow:
    - "Layer 0: project.scl"
    - "Layer 1: core specs"
    - "Layer 2: feature specs"
    - "Layer 3-5: implementation specs"
    - "Layer 6-7: types/interfaces"
    - "Layer 8-9: logic/handlers"
    - "Layer 10: utilities"
    - "Layer 10+: tests"
```

## Examples

### Example 1: Full Cascade Flow

```yaml
trigger: "User updates specs/core.spec.md"

step_1_initiation:
  coordinator:
    - Identified: "Layer 1 spec change"
    - Dependencies found: "specs/auth.spec.md, specs/db.spec.md"
    - First agent: "speclang-spec-writer"
    
step_2_spec_writer:
  agent: "speclang-spec-writer"
  input: "specs/auth.spec.md"
  output: "Updated with new core refs"
  verification: "validate_refs.py: PASSED"
  
step_3_user_decision:
  result: "✓ Auth spec updated"
  question: "Continue to db.spec.md?"
  answer: "yes"
  
step_4_spec_writer_2:
  agent: "speclang-spec-writer"
  input: "specs/db.spec.md"
  output: "Updated with new core refs"
  verification: "validate_refs.py: PASSED"
  
step_5_user_decision:
  result: "✓ DB spec updated"
  question: "Continue to code generation?"
  answer: "yes"
  
step_6_code_gen:
  agent: "speclang-code-gen"
  input: "specs/auth.spec.md"
  output: "src/auth/handler.ts"
  verification: "tsc --noEmit: PASSED"
  
step_7_convergence:
  status: "completed"
  files_modified: 4
  tests_passed: 12
```

### Example 2: Error Recovery

```yaml
step_code_gen:
  agent: "speclang-code-gen"
  input: "specs/payment.spec.md"
  output: "src/payment/processor.ts"
  
verification:
  tsc_output: |
    src/payment/processor.ts(23,10): error TS2304: 
    Cannot find name 'validateCard'
    
error_handling:
  format: |
    Step 3 FAILED: Code compilation
    
    Error: Cannot find name 'validateCard'
    
    Fix options:
    1. Add validateCard to specs/payment.spec.md
    2. Import from utils module
    3. Use existing validation function
    
    Choose: (1 / 2 / 3 / abort)
    
  user_choice: "2"
  
retry:
  agent: "speclang-code-gen"
  additional_context: "Import validateCard from utils"
  result: "SUCCESS"
```

### Example 3: Depth Limit

```yaml
cascade_state:
  depth: 5
  max_depth: 5
  
attempted_step_6:
  agent: "speclang-spec-writer"
  reason: "Fix broken ref from step 5"
  
system_response: |
  WARNING: Cascade depth limit reached (5)
  
  Agents invoked:
  1. spec-writer (auth.spec.md)
  2. code-gen (handler.ts)
  3. test-writer (auth.test.ts)
  4. code-gen (fix test failures)
  5. spec-writer (fix spec inconsistency)
  
  Step 6 would exceed max_depth.
  
  CASCADE PAUSED
  
  Options:
  - Force continue (risk infinite loop)
  - Review and restart
  - Manual intervention
```

## Implementation

```python
class CascadeCoordinator:
    def __init__(self, config: CascadeConfig):
        self.config = config
        self.state = CascadeState()
        
    def start_cascade(self, trigger_file: str):
        self.state.initialize(trigger_file)
        self.run_cascade()
        
    def run_cascade(self):
        while self.state.status == "running":
            if self.state.depth >= self.config.max_depth:
                self.pause("Depth limit reached")
                break
                
            agent = self.determine_next_agent()
            result = self.invoke_agent(agent)
            
            if not self.verify_step(result):
                self.handle_failure(result)
                break
                
            packet = self.create_steering_packet(result)
            
            if not self.user_confirms_continue(packet):
                self.pause("User aborted")
                break
                
            self.state.depth += 1
            
    def invoke_agent(self, agent: Agent) -> AgentResult:
        task = self.build_task(agent)
        return task_tool.invoke(task)
        
    def verify_step(self, result: AgentResult) -> bool:
        gates = self.get_verification_gates(result)
        for gate in gates:
            if not gate.run():
                return False
        return True
```

## References

- @ref:speclang/cascade-protocol
- @ref:speclang/pipeline
- @ref:speclang/agent-protocol
- SIP 6: Agent Protocol
- SIP 13: Pipeline System
- SIP 27: Recovery System

## Copyright

This document is in the public domain.
