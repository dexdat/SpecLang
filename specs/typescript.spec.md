# speclang-header lines:10
id: "@speclang/typescript"
version: 0.1.0
layer: 5
project_level: Alpha
agent_support: agent_autonomous
tags: [typescript, generated, auto-generated]
short: "TypeScript code generator for SpecLang"
status: generated
---

# TypeScript Generator Spec

Auto-generated spec for typescript.ts from cascade.

## Overview

### @block::typescriptgenerator @kind:entity

TypeScriptGenerator:
  implements: ITargetGenerator
  language: TypeScript
  fileExtension: .ts

  methods:
    - generate(spec: Spec): string
    - generateInterface(spec: EntityBlock): string
    - generateClass(spec: ClassBlock): string
    - generateFunction(spec: FunctionBlock): string

### @block::type-mappings @kind:entity

TypeScriptTypes:
  spec_to_ts:
    string: string
    number: number
    boolean: boolean
    any: any
    void: void
    null: null
    unknown: unknown
    object: object
    array: T[]
    map: Map<K, V>
    set: Set<T>
    optional: T | undefined

### @block::code-style @kind:entity

CodeStyle:
  indentation: 2 spaces
  semicolons: true
  quotes: double
  trailingComma: es5
  bracketSpacing: true
  singleExport: true

### @block::examples @kind:entity

GeneratedExamples:
  interface:
    code: |
      export interface User {
        id: string;
        name: string;
        email: string;
      }

  class:
    code: |
      export class UserService {
        private db: Database;
        
        constructor(db: Database) {
          this.db = db;
        }
        
        async findById(id: string): Promise<User | null> {
          return this.db.users.find(id);
        }
      }

  function:
    code: |
      export function greet(name: string): string {
        return `Hello, ${name}!`;
      }
