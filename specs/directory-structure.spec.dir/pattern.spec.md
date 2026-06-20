# speclang-header lines:12
id: "@speclang/directory-structure/pattern"
version: 0.1.0
layer: 2
tags: [directory, structure, pattern]
imports: ["@speclang/directory-structure"]
parent: "@ref:specs/directory-structure"
part: 1/2
status: draft
project_level: Alpha
agent_support: agent_assisted
short: Directory Pattern
---

# Directory Pattern

## Directory Pattern

### @dir/pattern

```speclang
# @block:dir/pattern @kind:entity
DirectoryPattern:
  spec_file:
    - auth.scl
    - auth.spec.md
    - auth.spec.yaml
    - auth.go.spec
    
  spec_dir:
    - auth.spec.dir/           # contains sub-specs
    - auth.spec.dir/entities.scl
    - auth.spec.dir/operations.scl
    
  nesting:
    - auth.spec.dir/
    - auth.spec.dir/login.spec.dir/
    - auth.spec.dir/login.spec.dir/handler.go.spec
```

---

## Example Structure

### @dir/example

```speclang
# @block:dir/example @kind:code
```
specs/
  project.scl                    # north star (level 0)
  
  auth.spec.md                   # level 1 overview
  auth.spec.dir/                      # level 2+ details
    entities.spec.yaml
    operations.spec.yaml
    policies.spec.yaml
    
    login.spec.dir/                   # level 3+ login details
      handler.go.spec            # → generated/go/auth/login/handler.go
      flow.spec.md
    
    jwt.spec.dir/
      token.go.spec
      validator.go.spec
      
  user.spec.md
  user.spec.dir/
    profile.spec.yaml
    settings.spec.yaml
    
tests/
  auth.test.spec.scl
  auth.spec.dir/
    login.test.spec.scl
    jwt.test.spec.scl

generated/
  go/
    auth/
      login/
        handler.go
      jwt/
        token.go
        validator.go
```
```

---

## Naming Conventions

### @dir/naming

```speclang
# @block:dir/naming @kind:entity
NamingRules:
  spec_files:
    - lowercase with hyphens
    - auth.spec.md, user-profile.spec.yaml
    
  spec_dirs:
    - same name as parent spec + .spec.dir
    - auth.spec.md → auth.spec.dir/
    
  sub_specs:
    - descriptive name
    - login.spec.yaml, jwt-handler.go.spec
```

---

## Expansion Depth

### @dir/depth

```speclang
# @block:dir/depth @kind:entity
DepthControl:
  level_0:
    files: project.scl
    owner: user + orchestrator
    
  level_1:
    files: *.spec.md (overviews)
    dirs: created as needed
    
  level_2:
    files: *.spec.dir/*.spec.yaml
    owner: spec-writer
    
  level_3_plus:
    files: deeper .dir nesting
    owner: spec-writer
    
  level_10:
    files: *.go.spec (direct mapping)
    owner: code-gen
    
  note: Nesting depth is unlimited; levels shown are typical patterns.
```

---

## Unlimited Nesting

### @dir/unlimited-nesting

```speclang
# @block:dir/unlimited-nesting @kind:note
Nesting depth is not limited to a single level. Spec directories can nest any level of depth needed to represent the natural hierarchy of the system.

**Key points:**
- There is no requirement to only have 1 level of sub-spec directories
- Nesting can go as deep as needed for proper organization
- Each `.spec.dir/` folder can contain its own `.spec.dir/` subfolders
- This enables fine-grained modularity and focused context
```