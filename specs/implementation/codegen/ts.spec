# speclang-header lines:8
id: @codegen/typescript
version: 0.1.0
layer: 3
imports: [@speclang/core, @speclang/spec-format]
tags: [codegen, typescript, templates, generation]
short: TypeScript code generation templates for Speclang
---

# TypeScript Code Generation

Templates for generating TypeScript code from Speclang entity and operation blocks.

---

## Entity to Interface Template

### @codegen/ts/entity-to-interface

```speclang
# @block:codegen/ts/entity-to-interface @kind:template
```tstemplate
{{- define "entity_to_interface" -}}
{{- $entity := . -}}
// {{ $entity.name }} generated from Speclang entity
export interface {{ tsTypeName $entity.name }} {
{{- range $entity.fields }}
  {{ tsFieldName .name }}{{ if .optional }}?{{ end }}: {{ tsType .type }};
{{- end }}
}
{{- end -}}
```

---

## Entity to Class Template

### @codegen/ts/entity-to-class

```speclang
# @block:codegen/ts/entity-to-class @kind:template
```tstemplate
{{- define "entity_to_class" -}}
{{- $entity := . -}}
// {{ $entity.name }} generated from Speclang entity
export class {{ tsTypeName $entity.name }} {
{{- range $entity.fields }}
  {{ tsFieldName .name }}{{ if .optional }}?{{ end }}: {{ tsType .type }};
{{- end }}

  constructor(init?: Partial<{{ tsTypeName $entity.name }}>) {
    Object.assign(this, init);
  }
{{- if $entity.methods }}
{{- range $entity.methods }}
  {{ .name }}({{ tsParams .params }}): {{ tsReturn .returns }} {
    // TODO: implement
  }
{{- end }}
{{- end }}
}
{{- end -}}
```

---

## Type Mapping

### @codegen/ts/type-mapping

```speclang
# @block:codegen/ts/type-mapping @kind:template
```tstemplate
{{- define "type_mapping" -}}
{{- $speclangType := . -}}
{{- if eq $speclangType "String" }}string
{{- else if eq $speclangType "Int" }}number
{{- else if eq $speclangType "Float" }}number
{{- else if eq $speclangType "Bool" }}boolean
{{- else if eq $speclangType "UUID" }}string
{{- else if eq $speclangType "Timestamp" }}Date
{{- else if eq $speclangType "JSON" }}any
{{- else if eq $speclangType "Any" }}any
{{- else }}{{ tsTypeName $speclangType }}
{{- end -}}
{{- end -}}
```

---

## Operation to Function Template

### @codegen/ts/operation-to-function

```speclang
# @block:codegen/ts/operation-to-function @kind:template
```tstemplate
{{- define "operation_to_function" -}}
{{- $operation := . -}}
// {{ $operation.name }} generated from Speclang operation
export function {{ tsFuncName $operation.name }}({{ tsParams $operation.params }}): {{ tsReturn $operation.returns }} {
{{- if $operation.implementation }}
  {{ $operation.implementation }}
{{- else }}
  // TODO: implement
{{- end }}
}
{{- end -}}
```

---

## API Client Generation

### @codegen/ts/api-client

```speclang
# @block:codegen/ts/api-client @kind:template
```tstemplate
{{- define "api_client" -}}
{{- $api := . -}}
import axios from 'axios';

export class {{ tsTypeName $api.name }}Client {
  private baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:3000') {
    this.baseUrl = baseUrl;
  }

{{- range $api.endpoints }}
  async {{ tsFuncName .name }}({{ tsParams .params }}): Promise<{{ tsType .returns }}> {
    const response = await axios.{{ lower .method }}(`${this.baseUrl}{{ .path }}`, {{ if ne .method "GET" }}data{{ end }});
    return response.data;
  }
{{- end }}
}
{{- end -}}
```

---

## React Component Generation

### @codegen/ts/react-component

```speclang
# @block:codegen/ts/react-component @kind:template
```tstemplate
{{- define "react_component" -}}
{{- $component := . -}}
import React from 'react';

export interface {{ tsTypeName $component.name }}Props {
{{- range $component.props }}
  {{ .name }}{{ if .optional }}?{{ end }}: {{ tsType .type }};
{{- end }}
}

export const {{ tsTypeName $component.name }}: React.FC<{{ tsTypeName $component.name }}Props> = ({
{{- range $component.props }}
  {{ .name }},
{{- end }}
}) => {
  return (
    <div>
      {{ $component.content }}
    </div>
  );
};
{{- end -}}
```

---

## Code Generation Engine

### @codegen/ts/engine

```speclang
# @block:codegen/ts/engine @kind:code
```typescript
import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'yaml';

export interface Template {
  name: string;
  content: string;
  variables: string[];
}

export class TypeScriptCodeGenerator {
  private templates: Map<string, Template> = new Map();

  constructor() {
    this.loadTemplates();
  }

  private loadTemplates() {
    const templateDir = path.join(__dirname, 'templates');
    const files = fs.readdirSync(templateDir);
    
    for (const file of files) {
      if (file.endsWith('.tstemplate')) {
        const content = fs.readFileSync(path.join(templateDir, file), 'utf-8');
        const template: Template = {
          name: path.basename(file, '.tstemplate'),
          content,
          variables: this.extractVariables(content)
        };
        this.templates.set(template.name, template);
      }
    }
  }

  private extractVariables(content: string): string[] {
    const variableRegex = /\{\{\s*(\$?\w+)\s*\}\}/g;
    const matches = content.matchAll(variableRegex);
    const variables = new Set<string>();
    
    for (const match of matches) {
      variables.add(match[1]);
    }
    
    return Array.from(variables);
  }

  public generate(specPath: string, templateName: string): string {
    const specContent = fs.readFileSync(specPath, 'utf-8');
    const spec = parse(specContent);
    const template = this.templates.get(templateName);
    
    if (!template) {
      throw new Error(`Template not found: ${templateName}`);
    }

    let output = template.content;
    
    // Replace variables with spec data
    for (const variable of template.variables) {
      const value = this.getValue(spec, variable);
      output = output.replace(new RegExp(`\\{\\{\\s*${variable}\\s*\\}\\}`, 'g'), value);
    }
    
    return output;
  }

  private getValue(spec: any, path: string): string {
    // Simple path traversal
    const parts = path.split('.');
    let current = spec;
    
    for (const part of parts) {
      if (current[part] === undefined) {
        return '';
      }
      current = current[part];
    }
    
    return String(current);
  }
}
```