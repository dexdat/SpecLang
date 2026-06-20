# speclang-header lines:9
id: "@examples/greeting"
version: 1.0.0
layer: 5
short: "Simple greeting functions"
tags: [example, greeting]
project_level: Alpha
agent_support: agent_autonomous
---

# Greeting Functions

Simple greeting utilities.

### @block::greet @kind:function

Returns a personalized greeting.

**Parameters:**
- name: string - Person to greet

**Returns:** string - Greeting message

**Example:**
```typescript
greet("World") // "Hello, World!"
```
