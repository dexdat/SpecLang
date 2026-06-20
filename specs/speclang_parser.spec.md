# speclang-header lines:10
id: "@speclang/speclang/parser"
version: 0.1.0
layer: 5
project_level: Alpha
agent_support: agent_autonomous
tags: [python, generated, auto-generated]
short: "Auto-generated spec for speclang_parser.py"
status: draft
---

## @block:block @kind:entity
```text
class Block:
```


## @block:reference @kind:entity
```text
class Reference:
```


## @block:specmetadata @kind:entity
```text
class SpecMetadata:
```


## @block:parsedspec @kind:entity
```text
class ParsedSpec:
```


## @block:validationresult @kind:entity
```text
class ValidationResult:
```


## @block:validationresult/parse_spec @kind:code
```typescript
def parse_spec(file_path: str) -> Optional[ParsedSpec]:
```


## @block:validationresult/parse_spec_from_content @kind:code
```typescript
def parse_spec_from_content(content: str, source_file: str = "") -> Optional[ParsedSpec]:
```


## @block:validationresult/quote_match @kind:code
```typescript
def quote_match(m):
```


## @block:validationresult/extract_blocks @kind:code
```typescript
def extract_blocks(content: str, source_file: str = "") -> List[Block]:
```


## @block:validationresult/extract_refs @kind:code
```typescript
def extract_refs(content: str, source_file: str = "") -> List[Reference]:
```


## @block:validationresult/validate_header @kind:code
```typescript
def validate_header(metadata: SpecMetadata) -> ValidationResult:
```


## @block:validationresult/validate_layer @kind:code
```typescript
def validate_layer(layer: Any) -> bool:
```


## @block:validationresult/validate_version @kind:code
```typescript
def validate_version(version: str) -> bool:
```


## @block:validationresult/validate_refs @kind:code
```typescript
def validate_refs(refs: List[Reference], index_path: str = "_index.json") -> List[str]:
```


## @block:validationresult/validate_spec @kind:code
```typescript
def validate_spec(file_path: str) -> ValidationResult:
```


## @block:validationresult/validate_all_specs @kind:code
```typescript
def validate_all_specs(specs_dir: str = "specs") -> Dict[str, ValidationResult]:
```

