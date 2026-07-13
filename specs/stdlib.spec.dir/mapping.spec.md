# speclang-header lines:10
id: "@speclang/stdlib/mapping"
parent: "@ref:specs/stdlib"
short: "Type mappings between languages"
project_level: Alpha
agent_support: agent_autonomous
tags: [stdlib, types, mapping, languages]
version: 0.1.0
layer: 1
---

# Type Mappings

Maps SpecLang types to target language types.

## TypeScript Mappings

### @stdlib/mapping/typescript

SpecLang → TypeScript type mapping.

| SpecLang | TypeScript |
|----------|------------|
| String | string |
| Number | number |
| Boolean | boolean |
| Date | Date |
| UUID | string |
| Optional<T> | T \| undefined |
| List<T> | T[] |
| Map<K,V> | Map<K,V> |

## Go Mappings

### @stdlib/mapping/go

SpecLang → Go type mapping.

| SpecLang | Go |
|----------|-----|
| String | string |
| Number | float64 |
| Boolean | bool |
| Date | time.Time |
| UUID | string |
| Optional<T> | *T |
| List<T> | []T |
| Map<K,V> | map[K]V |

## Python Mappings

### @stdlib/mapping/python

SpecLang → Python type mapping.

| SpecLang | Python |
|----------|--------|
| String | str |
| Number | float |
| Boolean | bool |
| Date | datetime.datetime |
| UUID | str |
| Optional[T] | Optional[T] |
| List[T] | List[T] |
| Map[K,V] | Dict[K,V] |
