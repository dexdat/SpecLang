---
id: "@speclang/go"
version: 0.1.0
layer: 5
project_level: Alpha
agent_support: agent_autonomous
tags: [go, generated, auto-generated]
short: "Go code generator for SpecLang"
status: generated
---

# Go Generator Spec

Auto-generated spec for go.ts from cascade.

## Overview

### @block::gogenerator @kind:entity

GoGenerator:
  implements: ITargetGenerator
  language: Go
  fileExtension: .go

  methods:
    - generate(spec: Spec): string
    - generate_struct(spec: EntityBlock): string
    - generate_function(spec: FunctionBlock): string
    - generate_interface(spec: EntityBlock): string

### @block::type-mappings @kind:entity

GoTypes:
  spec_to_go:
    string: string
    number: int | float64
    boolean: bool
    any: interface{}
    void: (nothing)
    null: nil
    unknown: interface{}
    object: map[string]interface{}
    array: []T
    map: map[K]V
    set: map[T]bool
    optional: *T

### @block::code-style @kind:entity

CodeStyle:
  indentation: tabs
  quotes: double
  package: lowercase
  structTags: json
  errorHandling: explicit

### @block::examples @kind:entity

GeneratedExamples:
  struct:
    code: |
      type User struct {
          ID    string `json:"id"`
          Name  string `json:"name"`
          Email string `json:"email"`
      }

  function:
    code: |
      func Greet(name string) string {
          return fmt.Sprintf("Hello, %s!", name)
      }

  method:
    code: |
      func (s *UserService) FindByID(id string) (*User, error) {
          return s.db.Users.Find(id)
      }
