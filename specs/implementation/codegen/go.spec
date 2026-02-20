# speclang-header lines:8
id: @codegen/go
version: 0.1.0
layer: 3
imports: [@speclang/core, @speclang/spec-format]
tags: [codegen, go, templates, generation]
short: Go code generation templates for Speclang
---

# Go Code Generation

Templates for generating Go code from Speclang entity and operation blocks.

---

## Entity to Struct Template

### @codegen/go/entity-to-struct

```speclang
# @block:codegen/go/entity-to-struct @kind:template
```gotemplate
{{- define "entity_to_struct" -}}
{{- $entity := . -}}
// {{ $entity.name }} generated from Speclang entity
type {{ goTypeName $entity.name }} struct {
{{- range $entity.fields }}
  {{ goFieldName .name }} {{ goType .type }} `json:"{{ .name }}"{{ if .omitempty }} omitempty{{ end }}`
{{- end }}
}

{{- if $entity.methods }}
{{- range $entity.methods }}
func ({{ $entity.receiver }} *{{ goTypeName $entity.name }}) {{ .name }}({{ goParams .params }}) {{ goReturn .returns }} {
  // TODO: implement
}
{{- end }}
{{- end }}
{{- end -}}
```

---

## Field Type Mapping

### @codegen/go/type-mapping

```speclang
# @block:codegen/go/type-mapping @kind:template
```gotemplate
{{- define "type_mapping" -}}
{{- $speclangType := . -}}
{{- if eq $speclangType "String" }}string
{{- else if eq $speclangType "Int" }}int
{{- else if eq $speclangType "Float" }}float64
{{- else if eq $speclangType "Bool" }}bool
{{- else if eq $speclangType "UUID" }}string
{{- else if eq $speclangType "Timestamp" }}time.Time
{{- else if eq $speclangType "JSON" }}interface{}
{{- else }}{{ goTypeName $speclangType }}
{{- end -}}
{{- end -}}
```

---

## Operation to Function Template

### @codegen/go/operation-to-function

```speclang
# @block:codegen/go/operation-to-function @kind:template
```gotemplate
{{- define "operation_to_function" -}}
{{- $operation := . -}}
// {{ $operation.name }} generated from Speclang operation
func {{ goFuncName $operation.name }}({{ goParams $operation.params }}) {{ goReturn $operation.returns }} {
{{- if $operation.implementation }}
  {{ $operation.implementation }}
{{- else }}
  // TODO: implement
{{- end }}
}
{{- end -}}
```

---

## API Server Generation

### @codegen/go/api-server

```speclang
# @block:codegen/go/api-server @kind:template
```gotemplate
{{- define "api_server" -}}
{{- $api := . -}}
package main

import (
  "net/http"
  "encoding/json"
  "log"
)

func main() {
{{- range $api.endpoints }}
  http.HandleFunc("{{ .path }}", func(w http.ResponseWriter, r *http.Request) {
    var req {{ goTypeName .requestType }}
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
      http.Error(w, err.Error(), http.StatusBadRequest)
      return
    }
    
    resp := {{ goFuncName .handlerName }}(req)
    json.NewEncoder(w).Encode(resp)
  })
{{- end }}
  
  log.Fatal(http.ListenAndServe(":8080", nil))
}
{{- end -}}
```

---

## Code Generation Engine

### @codegen/go/engine

```speclang
# @block:codegen/go/engine @kind:code
```go
package codegen

import (
  "text/template"
  "strings"
)

var (
  entityTemplate = template.Must(template.New("entity").Parse(`
type {{.Name}} struct {
  {{range .Fields}}
  {{.Name}} {{.Type}} ` + "`json:\"{{.JsonTag}}\"`" + `
  {{end}}
}`))

  operationTemplate = template.Must(template.New("operation").Parse(`
func {{.Name}}({{.Params}}) {{.Returns}} {
  {{.Body}}
}`))
)

type Entity struct {
  Name   string
  Fields []Field
}

type Field struct {
  Name    string
  Type    string
  JsonTag string
}

func GenerateGoCode(spec map[string]interface{}) (string, error) {
  var buf strings.Builder
  
  switch spec["kind"] {
  case "entity":
    var entity Entity
    // Parse spec into entity
    err := entityTemplate.Execute(&buf, entity)
    if err != nil {
      return "", err
    }
  case "operation":
    // Similar for operation
  }
  
  return buf.String(), nil
}
```