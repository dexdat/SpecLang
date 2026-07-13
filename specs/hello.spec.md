# speclang-header lines:10
id: "@demo/hello"
version: 1.0.0
layer: 5
project_level: Alpha
agent_support: agent_assisted
tags: [demo, example, hello-world]
short: Hello world demo spec
status: draft
---

# Hello World Demo

This spec demonstrates the basic structure of a SpecLang specification with a simple function.

## Overview

```speclang
# @block:hello/overview @kind:entity
HelloWorld:
  purpose: Demonstrate basic spec structure
  demonstrates:
    - Header format with metadata
    - Block definitions with @kind
    - Function parameters and returns
    - Code generation
  
  example_usage:
    const greeting = sayHello("World");
    // Returns: "Hello, World!"
```

## Function: sayHello

```speclang
# @block::sayHello @kind:function
Say hello to someone.

**Parameters:**
- name: string - Person to greet

**Returns:** string - Greeting message

**Example:**
typescript:
  const greeting = sayHello("Alice");
  // Returns: "Hello, Alice!"

python:
  greeting = say_hello("Alice")
  # Returns: "Hello, Alice!"
```

## Implementation

```speclang
# @block:hello/implementation @kind:interface
interface HelloWorldImplementation:
  languages:
    typescript: |
      export function sayHello(name: string): string {
        return `Hello, ${name}!`;
      }
    
    python: |
      def say_hello(name: str) -> str:
          return f"Hello, {name}!"
    
    go: |
      func SayHello(name string) string {
          return fmt.Sprintf("Hello, %s!", name)
      }
```

## Extended Features

```speclang
# @block:hello/greetMany @kind:function
Greet multiple people at once.

**Parameters:**
- names: string[] - Array of names

**Returns:** string[] - Array of greeting messages

**Example:**
typescript:
  const greetings = greetMany(["Alice", "Bob", "Charlie"]);
  // Returns: ["Hello, Alice!", "Hello, Bob!", "Hello, Charlie!"]
```

```speclang
# @block:hello/customGreeting @kind:function
Create a custom greeting with custom prefix.

**Parameters:**
- name: string - Person to greet
- prefix: string - Custom greeting prefix (default: "Hello")

**Returns:** string - Custom greeting message

**Example:**
typescript:
  const greeting = customGreeting("World", "Hi");
  // Returns: "Hi, World!"
```
