# speclang-header lines:10
id: "@demo/hello-dir"
version: 1.0.0
layer: 5
project_level: Alpha
agent_support: agent_assisted
tags: [demo, hello-world, example]
short: Hello world demo directory
status: draft
parent: "@ref:specs/demo"---

# Hello World Demo Directory

This directory contains the hello world demonstration specs.

## Directory Structure

```speclang
# @block:hello/structure @kind:entity
HelloDemo:
  location: specs/demo.spec.dir/
  
  files:
    - hello.spec.md: Basic hello world functions
    - src/: Implementation files (generated)
  
  purpose:
    - Show basic spec structure
    - Demonstrate function definitions
    - Example code generation
```

## Main Hello Spec

```speclang
# @block:hello/main @kind:reference
@ref:specs/hello.spec.md
```

## Source Implementation

```speclang
# @block:hello/implementation @kind:note
The implementation is generated from specs/hello.spec.md
and placed in src/demo/hello/ directory.
```
