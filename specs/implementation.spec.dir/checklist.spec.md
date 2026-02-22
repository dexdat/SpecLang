# speclang-header lines:11
id: "@speclang/implementation.checklist"
version: 0.1.0
layer: 2
parent: "@ref:speclang/implementation"
tags: [checklist, implementation, quality]
status: draft
project_level: Alpha
agent_support: agent_assisted
short: Implementation Checklist
---
# Implementation Checklist

Checklist for implementing Speclang components.

## Overview

```speclang
# @block:checklist/overview @kind:note
A systematic checklist ensures consistent quality across implementations.
```

## Pre‑Implementation Checklist

### @block:checklist/pre-spec @kind:check
- [ ] Spec file exists with valid header
- [ ] All dependencies referenced (`@ref:`)
- [ ] Validation rules defined
- [ ] Layer value appropriate

### @block:checklist/pre-design @kind:check
- [ ] Architecture diagram or notes
- [ ] Component interfaces defined
- [ ] Data models specified

## Implementation Checklist

### @block:checklist/code @kind:check
- [ ] Code follows spec blocks
- [ ] Error handling implemented
- [ ] Logging and observability
- [ ] Configuration management

### @block:checklist/testing @kind:check
- [ ] Unit tests cover spec blocks
- [ ] Integration tests validate workflows
- [ ] Edge cases tested
- [ ] Performance benchmarks

## Post‑Implementation Checklist

### @block:checklist/documentation @kind:check
- [ ] API documentation generated
- [ ] User guides updated
- [ ] Examples provided

### @block:checklist/validation @kind:check
- [ ] Spec validation passes
- [ ] Code review completed
- [ ] Security audit performed

## Usage

Check each item before marking implementation complete.