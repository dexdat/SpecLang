# speclang-header lines:8
id: @test/greeting
version: 1.0.0
layer: 1
tags: [test, greeting]
short: A simple greeting module for testing
---

# Greeting Module

A test module to verify SpecLang code generation.

### @block:greeting @kind:function
Generate a greeting message for a user.

**Parameters:**
- name: String - The name to greet
- greeting: String - The greeting type (default: "Hello")

**Returns:** String - The formatted greeting
---

### @block:farewell @kind:function
Generate a farewell message for a user.

**Parameters:**
- name: String - The name to bid farewell

**Returns:** String - The formatted farewell
---

### @block:GreetingConfig @kind:interface
Configuration for the greeting service.

**Properties:**
- defaultGreeting: String - Default greeting to use
- capitalizeNames: Bool - Whether to capitalize names
