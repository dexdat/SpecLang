# Bootstrap Phase 0.15: Dynamic Splitting

## Context
You are building SpecLang - a reactive multi-agent system where specs self-assemble into code. This is Phase 0.15 of the bootstrap process.

**Prerequisites**: Phase 0 (Foundation) complete, Phase 0.2 (Parser) complete.

## Your Task
Implement dynamic spec splitting - automatically split large specs into focused sub-specs when they exceed configured limits.

## Read These Specs First
1. `specs/dynamic-split.spec.md` - Overview
2. `specs/dynamic-split.spec.dir/strategy.spec.md` - Splitting logic and configuration
3. `specs/dynamic-split.spec.dir/token-budget.spec.md` - Token counting and budget

## What to Build

### Core Concept
When specs exceed size limits, they split into `.spec.dir/` folders with sub-specs. Sub-specs are BETTER than bloated single files because each has focused, manageable context.

### Default Limits
```yaml
config:
  split:
    max_tokens: 10000
    max_lines: 800
    max_chars: 60000
    budget_overhead: 500
    strategy: smart  # smart | by-section | by-token
```

### Budget Calculation
```speclang
user_limit: 10000 tokens
overhead: 500 tokens (headers + refs)
budget_limit: 10500 tokens

thresholds:
  - safe: tokens <= user_limit
  - warning: tokens > user_limit and <= budget_limit
  - critical: tokens > budget_limit

warning_zone_behavior:
  - Try to fit within budget first
  - Optimize references (shorten refs, compress headers)
  
critical_zone_behavior:
  - Must split
  - Determine optimal split points based on block boundaries
```

### Directory Structure
```
Before split:
  specs/auth/login.spec.yaml (12k tokens)

After split:
  specs/auth/login.spec.yaml (index, ~500 tokens)
  specs/auth/login.spec.dir/
    ├── overview.spec.yaml
    ├── entities.spec.yaml
    ├── operations.spec.yaml
    └── tests.spec.yaml
```

### Parent Header (Index File)
```yaml
# speclang-header lines:10
id: @specs/auth/login
version: 1.0.0
children:
  - @ref:speclang/auth/entities
  - @ref:speclang/auth/flows
  # Additional sub-specs as needed
short: "Login (4 sub-specs)"
---
This spec has been split. See login.spec.dir/ for details.
```

### Child Header
```yaml
# speclang-header lines:8
id: @speclang/auth/entities
parent: @ref:speclang/auth
part: 1/2
order: 1
siblings:
  next: @ref:speclang/auth/flows
short: "Login overview"
---
```

## Implementation

### 1. Token Counter (`split/tokens.rs`)
```rust
use tiktoken_rs::Cl100kBase;

pub struct TokenCounter {
    encoder: Cl100kBase,
}

impl TokenCounter {
    pub fn count(&self, content: &str) -> usize {
        self.encoder.encode(content).len()
    }
    
    pub fn estimate_overhead(&self, child_count: usize) -> usize {
        // Base: 200 tokens
        // Per child: +50 tokens
        // Per sibling link: +30 tokens
        200 + (child_count * 50)
    }
}
```

### 2. Split Checker (`split/checker.rs`)
```rust
pub struct SplitChecker {
    config: SplitConfig,
}

impl SplitChecker {
    pub fn check(&self, spec: &Spec) -> SplitDecision {
        let tokens = self.counter.count(&spec.content);
        
        if tokens <= self.config.max_tokens {
            return SplitDecision::NoSplit;
        }
        
        let budget = self.config.max_tokens + self.config.budget_overhead;
        
        if tokens <= budget {
            // Warning zone - try optimization first
            SplitDecision::TryOptimize
        } else {
            // Critical - must split
            SplitDecision::MustSplit
        }
    }
}
```

### 3. Split Executor (`split/executor.rs`)
```rust
pub struct SplitExecutor {
    strategy: SplitStrategy,
}

impl SplitExecutor {
    pub fn split(&self, spec: &Spec) -> SplitResult {
        match self.strategy {
            SplitStrategy::Smart => self.smart_split(spec),
            SplitStrategy::BySection => self.section_split(spec),
            SplitStrategy::ByToken => self.token_split(spec),
        }
    }
    
    fn smart_split(&self, spec: &Spec) -> SplitResult {
        // 1. Parse spec into blocks
        // 2. Group related blocks
        // 3. Create sub-specs per group
        // 4. Generate parent index
        // 5. Add bidirectional refs
    }
}
```

### 4. Split Tool for Agents
```rust
pub fn speclang_split_if_needed(path: &str, content: &str) -> SplitResult {
    // Called by agents before writing
    // Returns list of files to write
}
```

## Split Triggers

```speclang
SplitTriggers:
  on_write:
    when: agent writes spec
    check: before write completes
    action: split if needed, write parts
    
  on_edit:
    when: spec is edited and grows
    check: after edit
    action: re-split if now over limit
    
  on_merge:
    when: parts shrink (edits reduce size)
    check: parts can merge
    action: merge back into single file
```

## Merging

```speclang
Merging:
  when: parts shrink below threshold
  threshold: 50% of max_tokens
  
  example:
    - part1: 3000 tokens
    - part2: 2500 tokens
    - combined: 5500 tokens (< 12000)
    - result: merge into single file
```

## User Commands

```bash
/split <file>        # manually split a file
/merge <parent>      # merge all parts back
/split-status        # show which files are split
/split-limits        # show current limits
```

## Test Cases
1. Spec under limit stays single file
2. Spec over limit splits into sub-specs
3. Parent becomes index with children refs
4. Children link back to parent
5. Token counting is accurate
6. Budget overhead is accounted for
7. Merge when parts shrink below threshold
8. Respect per-agent overrides

## Output
1. Token counting module
2. Split checker module
3. Split executor with smart strategy
4. CLI commands for manual split/merge
5. Integration with agent write pipeline
