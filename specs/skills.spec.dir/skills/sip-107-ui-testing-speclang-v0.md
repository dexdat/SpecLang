---
name: sip-107-ui-testing-speclang-v0
title: "SIP 107: UI Testing Strategy"
version: 0.1.0
description: Testing strategy for UI components defined in SpecLang
category: standard
---
# speclang-header lines:5
# id: @specs/skills
# version: 1.0.0
# layer: 5


# SIP 107: UI Testing Strategy

**Status:** Draft  
**Version:** 0.1.0  
**Author:** SpecLang Core Team

## README

This SIP defines the testing strategy for UI components defined in SpecLang.

### Quick Start

UI testing approaches:
1. **Interaction Testing**: Test user interactions
2. **State Testing**: Verify state management
3. **Visual Testing**: Compare rendered output
4. **Integration Testing**: Test component integration

### When to Read This

- **Writing UI specs**: How to specify testable UIs
- **Test implementation**: Creating UI tests
- **CI integration**: Running UI tests in pipeline

### Related SIPs

- SIP 36: UI Specification
- SIP 57: UI State
- SIP 60: UI Interactions

## Abstract

This SIP defines the testing strategy for UI components specified in SpecLang. It covers interaction testing, state verification, visual regression testing, and integration testing patterns.

## Motivation

UI components need:
- **Interaction verification**: Test user flows
- **State validation**: Verify state management
- **Visual consistency**: Detect rendering issues
- **Integration coverage**: Test component composition

## Rationale

**Test Pyramid for UI:**

1. Unit: Component logic, state changes
2. Integration: Component interactions
3. E2E: Full user flows

## Specification

### Test Specification Format

```yaml
UITestSpec:
  header:
    id: "@specs/ui-testing"
    version: 1.0.0
    layer: 5
    tags: [ui, testing, strategy]
    
  test_categories:
    - name: interaction_tests
      description: "Test user interactions"
      scope: "Component-level"
      
    - name: state_tests
      description: "Test state management"
      scope: "Component-level"
      
    - name: visual_tests
      description: "Test visual rendering"
      scope: "Component-level"
      
    - name: integration_tests
      description: "Test component composition"
      scope: "Multi-component"
      
    - name: e2e_tests
      description: "End-to-end user flows"
      scope: "Full application"
```

### Test Block Format

```yaml
TestBlock:
  structure:
    - id: "@block:test-{name}"
      kind: test
      test_type: interaction | state | visual | integration | e2e
      
    definition:
      component: string          # Component to test
      scenario: string          # Test scenario
      setup: list               # Setup steps
      actions: list             # User actions
      assertions: list          # Expected results
      cleanup: list             # Cleanup steps
      
    mocks:
      - name: string
        type: service | api | component
        response: object
        
    fixtures:
      - name: string
        data: object
```

### Test Generation from Spec

```python
from dataclasses import dataclass
from typing import List, Dict, Optional
import re

@dataclass
class TestBlock:
    block_id: str
    component: str
    test_type: str
    scenario: str
    setup: List[str]
    actions: List[str]
    assertions: List[str]
    cleanup: List[str]
    mocks: List[Dict]
    fixtures: List[Dict]

class UITestGenerator:
    """Generate UI tests from SpecLang specs."""
    
    def __init__(self, config: dict):
        self.config = config
        self.test_framework = config.get("framework", "pytest")
    
    def generate_tests(self, spec: dict) -> dict:
        """Generate test files from UI spec."""
        
        test_blocks = self._extract_test_blocks(spec)
        tests = {
            "unit": [],
            "integration": [],
            "e2e": []
        }
        
        for block in test_blocks:
            test_code = self._generate_test(block, spec)
            
            if block.test_type in ["interaction", "state"]:
                tests["unit"].append(test_code)
            elif block.test_type == "integration":
                tests["integration"].append(test_code)
            else:
                tests["e2e"].append(test_code)
        
        return tests
    
    def _generate_test(self, block: TestBlock, spec: dict) -> str:
        """Generate single test from block."""
        
        if self.test_framework == "pytest":
            return self._generate_pytest(block, spec)
        elif self.test_framework == "jest":
            return self._generate_jest(block, spec)
        elif self.test_framework == "playwright":
            return self._generate_playwright(block, spec)
        else:
            raise ValueError(f"Unknown framework: {self.test_framework}")
    
    def _generate_pytest(self, block: TestBlock, spec: dict) -> str:
        """Generate pytest test."""
        
        component_name = block.component
        test_name = self._to_test_name(block.scenario)
        
        lines = [
            f"import pytest",
            f"from {self._get_import_path(component_name)} import {component_name}",
            "",
            f"def test_{test_name}():",
        ]
        
        # Setup
        for setup in block.setup:
            lines.append(f"    {setup}")
        
        # Actions
        lines.append("    # Actions")
        for action in block.actions:
            lines.append(f"    {action}")
        
        # Assertions
        lines.append("    # Assertions")
        for assertion in block.assertions:
            lines.append(f"    {assertion}")
        
        # Cleanup
        if block.cleanup:
            lines.append("    # Cleanup")
            lines.append("    finally:")
            for cleanup in block.cleanup:
                lines.append(f"        {cleanup}")
        
        return "\n".join(lines)
    
    def _generate_jest(self, block: TestBlock, spec: dict) -> str:
        """Generate Jest test."""
        
        component_name = block.component
        test_name = self._to_test_name(block.scenario)
        
        lines = [
            f"import {{ {component_name} }} from '{self._get_import_path(component_name)}';",
            "",
            f"describe('{component_name}', () => {{",
            f"  it('{block.scenario}', async () => {{",
        ]
        
        # Setup
        for setup in block.setup:
            lines.append(f"    {setup}")
        
        # Actions
        lines.append("    // Actions")
        for action in block.actions:
            lines.append(f"    {action}")
        
        # Assertions
        lines.append("    // Assertions")
        for assertion in block.assertions:
            lines.append(f"    {assertion}")
        
        lines.append("  }});")
        lines.append("});")
        
        return "\n".join(lines)
    
    def _generate_playwright(self, block: TestBlock, spec: dict) -> str:
        """Generate Playwright E2E test."""
        
        page_name = self._to_variable_name(block.component)
        test_name = self._to_test_name(block.scenario)
        
        lines = [
            f"import {{ test, expect }} from '@playwright/test';",
            "",
            f"test('{block.scenario}', async ({{ page }}) => {{",
        ]
        
        # Setup - navigate to page
        if block.setup:
            lines.append("    // Setup")
            for setup in block.setup:
                lines.append(f"    {setup}")
        
        # Actions
        lines.append("    // User actions")
        for action in block.actions:
            lines.append(f"    {action}")
        
        # Assertions
        lines.append("    // Assertions")
        for assertion in block.assertions:
            lines.append(f"    {assertion}")
        
        lines.append("});")
        
        return "\n".join(lines)
    
    def _to_test_name(self, scenario: str) -> str:
        """Convert scenario to valid test name."""
        # Convert to snake_case, remove special chars
        name = re.sub(r'[^a-zA-Z0-9\s]', '', scenario)
        name = re.sub(r'\s+', '_', name.lower())
        return name
    
    def _to_variable_name(self, component: str) -> str:
        """Convert component to variable name."""
        # PascalCase to camelCase
        return component[0].lower() + component[1:]
    
    def _get_import_path(self, component: str) -> str:
        """Get import path for component."""
        return f"./components/{component}"
```

### Test Execution

```yaml
TestExecution:
  frameworks:
    - name: pytest
      file_pattern: "**/test_*.py"
      config: "pytest.ini"
      
    - name: jest
      file_pattern: "**/*.test.ts"
      config: "jest.config.js"
      
    - name: playwright
      file_pattern: "**/*.spec.ts"
      config: "playwright.config.ts"
      
  execution_modes:
    local:
      command: "npm test"
      parallel: 4
      
    ci:
      command: "npm test -- --ci"
      parallel: 8
      browser_matrix:
        - chrome
        - firefox
        - safari
        
    headless:
      command: "npm test -- --headless"
      reporters:
        - html
        - junit
```

### Visual Testing

```python
class VisualTestGenerator:
    """Generate visual regression tests."""
    
    def generate_visual_tests(
        self,
        components: List[dict]
    ) -> dict:
        """Generate visual test snapshots."""
        
        tests = {}
        
        for component in components:
            component_name = component["name"]
            variants = component.get("variants", ["default"])
            
            for variant in variants:
                test_name = f"visual_{component_name}_{variant}"
                
                tests[test_name] = {
                    "framework": "chromatic" if self.config.get("use_chromatic") else "jest",
                    "component": component_name,
                    "variant": variant,
                    "viewport": component.get("viewport", "desktop"),
                    "assertions": [
                        "toMatchSnapshot()",
                        "toHaveNoViolations()"
                    ]
                }
        
        return tests
```

### Test Coverage

```yaml
TestCoverage:
  targets:
    unit:
      minimum: 80%
      components:
        - state_management
        - event_handlers
        - computed_properties
        
    integration:
      minimum: 60%
      flows:
        - user_interactions
        - data_fetching
        - form_submission
        
    visual:
      minimum: 50%
      components:
        - all_components
        
  reporting:
    format: ["html", "cobertura", "sonarqube"]
    thresholds_enforced: true
```

## Examples

### Example 1: Interaction Test

```speclang
### @block::test-button-click @kind:test @test_type:interaction

# Test: Button Click Interaction

**Component:** Button

**Scenario:** Click button triggers callback

**Setup:**
```python
callback_called = False
def on_click():
    global callback_called
    callback_called = True
```

**Actions:**
```python
button = Button(on_click=on_click)
button.click()
```

**Assertions:**
```python
assert callback_called == True
```
```

### Example 2: State Test

```speclang
### @block::test-form-state @kind:test @test_type:state

# Test: Form State Management

**Component:** Form

**Scenario:** Form validates on submit with invalid data

**Setup:**
```python
form = Form(fields=[
    Field(name="email", required=True, validator=email_validator),
    Field(name="password", required=True, min_length=8)
])
```

**Actions:**
```python
form.set_values({"email": "invalid", "password": "short"})
form.submit()
```

**Assertions:**
```python
assert form.is_valid == False
assert form.errors["email"] == "Invalid email format"
assert form.errors["password"] == "Password too short"
```
```

### Example 3: Visual Test

```speclang
### @block::test-button-visual @kind:test @test_type:visual

# Test: Button Visual States

**Component:** Button

**Variants:**
- default
- hover
- active
- disabled

**Assertions:**
- toMatchSnapshot("button-default")
- toMatchSnapshot("button-hover")
- toMatchSnapshot("button-active")
- toMatchSnapshot("button-disabled")
- toHaveNoViolations()
```

## Backwards Compatibility

- Tests can coexist with existing test suites
- Migration path from manual to generated tests
- Framework-agnostic test specification

## Security Implications

- Test credentials must be isolated
- No sensitive data in test snapshots
- Secure test execution environment

## References

- "@ref:speclang/ui-specification
- @ref:speclang/ui-state
- @ref:speclang/ui-interactions
- SIP 36: UI Specification
- SIP 57: UI State
- SIP 60: UI Interactions

## Copyright

This document is in the public domain.
