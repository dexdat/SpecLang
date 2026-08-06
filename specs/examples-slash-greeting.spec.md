# speclang-header lines:10
id: "@examples/greeting-dir"
version: 1.0.0
layer: 5
project_level: Alpha
agent_support: agent_assisted
tags: [example, greeting, demo]
short: Greeting example directory
status: draft
---
parent: "@ref:@examples/greeting"

# Greeting Examples Directory

This directory contains greeting-related example specs demonstrating various patterns.

## Directory Structure

```speclang
# @block:greeting/structure @kind:entity
GreetingExamples:
  files:
    - greeting.spec.md: Basic greeting functions
    - greeting.spec.dir/: Extended greeting specs
  
  examples_demonstrated:
    - basic_functions: Simple greeting functions
    - parameterized: Customizable greetings
    - localization: Multi-language greetings
    - templates: Template-based greetings
```

## Basic Greeting

```speclang
# @block:greeting/basic @kind:function
Basic greeting function.

**Parameters:**
- name: string - Name to greet

**Returns:** string - Greeting message

**Example:**
typescript:
  greet("Alice") // "Hello, Alice!"
```

## Customizable Greeting

```speclang
# @block:greeting/custom @kind:function
Greeting with custom prefix.

**Parameters:**
- name: string - Name to greet
- prefix: string - Custom greeting word (default: "Hello")
- punct: string - Punctuation mark (default: "!")

**Returns:** string - Custom greeting message

**Example:**
typescript:
  customGreet("World", "Hi", "?") // "Hi, World?"
```

## Multi-language Greeting

```speclang
# @block:greeting/localized @kind:function
Greeting in different languages.

**Parameters:**
- name: string - Name to greet
- locale: string - Language code (en, es, fr, de, ja)

**Returns:** string - Localized greeting message

**Example:**
typescript:
  localizedGreet("World", "es") // "Hola, World!"
  localizedGreet("World", "fr")  // "Bonjour, World!"
```
