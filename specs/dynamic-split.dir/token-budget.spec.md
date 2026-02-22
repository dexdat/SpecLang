# speclang-header lines:13
id: @speclang/dynamic-split/token-budget
version: 0.1.0
layer: 2
tags: [splitting, tokens, budget, limits]
parent: @ref:speclang/dynamic-split
part: 2/2
order: 2
short: Token counting, budget overhead, and limits
---

# Token Budget and Counting

Accurate token counting and budget management are essential for dynamic splitting.

## Token Counting

### @split/tokens

```speclang
# @block:split/tokens @kind:entity
TokenCounting:
  method: tiktoken or similar
  
  models:
    - cl100k_base (GPT-4, Claude)
    - configurable per project
    
  approximation:
    - 1 token ≈ 4 chars (English)
    - 1 token ≈ 0.75 words
    
  caching:
    - count on write
    - store in header
    - only recount if content changed
```

---

## Budget Calculation

### @split/budget-calculation

```speclang
# @block:split/budget-calculation @kind:entity
BudgetCalculation:
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
    - If still over user_limit but under budget_limit, split is optional
    
  critical_zone_behavior:
    - Must split
    - Determine optimal split points based on block boundaries
    - Create parent.spec.dir/ folder and child specs
```

### @split/budget-overhead

```speclang
# @block:split/budget-overhead @kind:entity
BudgetOverhead:
  components:
    - header: ~100 tokens (YAML frontmatter)
    - references: ~50 tokens per @ref:
    - part indicators: ~20 tokens
    - sibling links: ~30 tokens per sibling
    
  estimation:
    - Base overhead: 200 tokens
    - Per child: +50 tokens
    - Per sibling link: +30 tokens
    
  optimization:
    - Use short refs (e.g., @ref:auth/login)
    - Minimize header fields
    - Combine sibling links into single field
```

---

## Limits Configuration

### @split/limits-config

```speclang
# @block:split/limits-config @kind:entity
LimitsConfig:
  location: project.scl under config.split
  
  primary_limits:
    max_tokens: Integer       # user-defined token limit
    max_lines: Integer        # user-defined line limit
    max_chars: Integer        # user-defined character limit
    
  secondary_limits:
    budget_overhead: Integer  # extra budget for headers/refs
    strategy: String          # smart | by-section | by-token
    
  per_agent_overrides:
    location: project.scl under config.agents.{agent}
    purpose: Different agents may have different context windows
    
  defaults:
    max_tokens: 10000
    max_lines: 800
    max_chars: 60000
    budget_overhead: 500
    strategy: smart
```

### @split/limits-example

```speclang
# @block:split/limits-example @kind:code
```yaml
# project.scl
config:
  split:
    max_tokens: 10000
    max_lines: 800
    max_chars: 60000
    budget_overhead: 500
    strategy: smart
    
  agents:
    spec-writer:
      max_tokens: 8000  # smaller context for spec writing
    code-gen:
      max_lines: 500    # focus on code generation
```
```

---

## Token Estimation

### @split/estimation

```speclang
# @block:split/estimation @kind:entity
TokenEstimation:
  quick_estimates:
    - 1 token ≈ 4 characters (English text)
    - 1 token ≈ 0.75 words
    - 1 line ≈ 10-20 tokens (average)
    
  spec_specific:
    - Header: 100-200 tokens
    - Block: 50-500 tokens depending on content
    - Code block: 2x token density
    
  accuracy:
    - Estimation is for quick checks
    - Actual counting uses tiktoken/cl100k_base
    - Cache results to avoid recounting
```

---

## Integration with Splitting Logic

### @split/integration

```speclang
# @block:split/integration @kind:note
Token budget informs splitting decisions:

1. Count tokens using TokenCounting
2. Compare against user_limit and budget_limit
3. If in warning zone, attempt optimization
4. If in critical zone, proceed with split
5. During split, account for overhead of new headers/refs

The split logic (in strategy.spec.md) uses these token budgets to determine when and how to split.
```