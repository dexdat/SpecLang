---
id: "@speclang/python"
version: 0.1.0
layer: 5
project_level: Alpha
agent_support: agent_autonomous
tags: [python, generated, auto-generated]
short: "Python code generator for SpecLang"
status: generated
---

# Python Generator Spec

Auto-generated spec for python.ts from cascade.

## Overview

### @block::pythongenerator @kind:entity

PythonGenerator:
  implements: ITargetGenerator
  language: Python
  fileExtension: .py

  methods:
    - generate(spec: Spec): str
    - generate_class(spec: ClassBlock): str
    - generate_function(spec: FunctionBlock): str
    - generate_interface(spec: EntityBlock): str

### @block::type-mappings @kind:entity

PythonTypes:
  spec_to_python:
    string: str
    number: int | float
    boolean: bool
    any: Any
    void: None
    null: None
    unknown: Any
    object: Dict
    list: List[T]
    dict: Dict[K, V]
    set: Set[T]
    optional: Optional[T]

### @block::code-style @kind:entity

CodeStyle:
  indentation: 4 spaces
  quotes: single
  trailingComma: false
  bracketSpacing: true

### @block::examples @kind:entity

GeneratedExamples:
  class:
    code: |
      class UserService:
          def __init__(self, db: Database):
              self.db = db
          
          async def find_by_id(self, user_id: str) -> User | None:
              return await self.db.users.find(user_id)

  function:
    code: |
      def greet(name: str) -> str:
          return f"Hello, {name}!"

  dataclass:
    code: |
      @dataclass
      class User:
          id: str
          name: str
          email: str
