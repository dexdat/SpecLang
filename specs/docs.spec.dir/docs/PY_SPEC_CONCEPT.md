# speclang-header lines:5
# id: @specs/docs
# version: 1.0.0
# layer: 5

# The .py.spec Concept - Working Implementation

## Overview

This document proves that the `.py.spec` concept works:
1. Spec file contains code blocks
2. AI extracts and generates Python file
3. Generated file has header referencing spec
4. Symlink places it in correct location
5. Build/deploy tools use the symlink

## The Pattern

### 1. Spec File Contains Everything

**File:** `specs/scripts.spec.dir/generate-index.py.spec`

```
# speclang-header lines:12
id: "@speclang/scripts.generate-index.py"
version: 0.1.0
layer: 5
target: python
output_path: scripts/generate_index.py
...
---

# Spec Title

## Implementation

### @block:scripts/generate-index/main @kind:code
```python
#!/usr/bin/env python3
# Actual Python code here
import os
import json
...
```
```
```

The spec contains:
- Metadata header (who, what, where)
- Documentation (why)
- Code blocks (how)

### 2. AI Generates the Python File

**File:** `scripts/generate_index.py`

```python
#!/usr/bin/env python3
# speclang-header lines:14
# id: "@scripts/generate_index.py"
# version: 0.1.0
# layer: 5
# source: "@speclang/scripts.generate-index.py"
# source_path: "specs/scripts.spec.dir/generate-index.py.spec"
# generated_at: "2026-02-22"
# generator: "speclang-code-gen"
# ---
# This file was generated from specs/scripts.spec.dir/generate-index.py.spec
# DO NOT EDIT MANUALLY - Edit the spec instead

import os
import json
# ... actual code from spec ...
```

Key features:
- Has speclang-header (for tools to read)
- References source spec
- Says "DO NOT EDIT MANUALLY"
- Contains the actual executable code

### 3. Symlink Provides Convenient Access

**Symlink:** `generate_index.py -> scripts/generate_index.py`

```bash
$ ls -la generate_index.py
lrwxr-xr-x  1 user  staff  23 Feb 22 12:00 generate_index.py -> scripts/generate_index.py

$ python3 generate_index.py
Found 161 spec files
Created _index.json with 161 entries
```

The symlink:
- Makes it easy to run from root
- Still points to specs/ (source of truth)
- Build tools can use either path
- If you delete the symlink, script still works in scripts/

### 4. Build/Deploy Uses the File

**Build process:**
```bash
# Developer runs
python3 generate_index.py

# Or CI/CD runs
python3 scripts/generate_index.py

# Both work because they're the same file
```

**Docker build:**
```dockerfile
COPY scripts/generate_index.py /app/
RUN python3 /app/generate_index.py
```

**Deploy:**
```bash
# Deploy scripts/ directory
rsync -av scripts/ server:/app/scripts/

# Symlinks recreated on server
ln -sf scripts/generate_index.py generate_index.py
```

## Why This Works

### Source of Truth in Specs/

```
specs/                              # Everything lives here
└── scripts.spec.dir/
    └── generate-index.py.spec      # The spec (source of truth)
        └── contains Python code    # Human writes this

scripts/                            # Generated files
└── generate_index.py               # AI generates this
    └── has header: source: @...    # References spec

generate_index.py (symlink)         # Convenient access
└── -> scripts/generate_index.py    # Points to generated file
```

**Key insight:** The spec IS the source code. The `.py` file is derived.

### Benefits

1. **Specs are portable**
   - Take `specs/` folder anywhere
   - Regenerate all code
   - No lock files needed

2. **Human edits specs, not code**
   - Edit: `specs/scripts.spec.dir/generate-index.py.spec`
   - Regenerate: `scripts/generate_index.py`
   - Never edit: `scripts/generate_index.py` directly

3. **Traceability**
   - Code file references spec
   - Git history shows spec changes
   - Know where every line came from

4. **Multiple outputs**
   - One spec → Python code
   - One spec → Documentation
   - One spec → Tests

### Comparison with Traditional

**Traditional:**
```
src/
└── generate_index.py          # You edit this directly
    └── No idea why it exists
    └── No traceability
    └── Edit by hand
```

**SpecLang:**
```
specs/
└── generate-index.py.spec     # Edit this
    └── Why: documented
    └── Trace: git history
    └── AI generates ->

scripts/
└── generate_index.py          # Generated
    └── Header: "from spec X"
    └── Don't edit directly
```

## Current Implementation

### Working Example

✅ **specs/scripts.spec.dir/generate-index.py.spec**
- Contains full Python code (200+ lines)
- Has proper header
- Documentation included

✅ **scripts/generate_index.py**
- Generated from spec
- Has speclang-header
- References source
- **Works correctly** (verified)

✅ **generate_index.py (symlink)**
- Points to scripts/
- Convenient access
- Both paths work

### Verification

```bash
# 1. Spec contains code
grep -c "def " specs/scripts.spec.dir/generate-index.py.spec
# Output: 5 functions defined

# 2. Generated file works
python3 generate_index.py
# Output: Found 161 spec files, Created _index.json

# 3. Symlink resolves
ls -la generate_index.py
# Output: generate_index.py -> scripts/generate_index.py

# 4. Header references spec
head -10 scripts/generate_index.py
# Shows: source: "@speclang/scripts.generate-index.py"
```

### Other .py.spec Files

Currently exist but are **stubs** (need to be filled in):

- `specs/scripts.spec.dir/validate-refs.py.spec` (16 lines)
- `specs/scripts.spec.dir/fix-headers.py.spec` (16 lines)
- `specs/scripts.spec.dir/rename-spec-files.py.spec` (16 lines)
- etc.

**Next step:** Fill these with actual code blocks, then generate the Python files.

## The Full Vision

### Multi-Language Support

```
specs/
├── api/
│   ├── login.ts.spec          # TypeScript spec
│   │   └── generates -> src/api/login.ts
│   ├── auth.go.spec           # Go spec
│   │   └── generates -> src/auth/handler.go
│   └── db.py.spec             # Python spec
│       └── generates -> src/db/client.py
```

One specs/ folder, multiple languages.

### Cascade Example

**User edits:** `specs/api/login.ts.spec`

**Cascade:**
1. @speclang-spec-writer updates spec
2. @speclang-code-gen reads .ts.spec
3. Extracts TypeScript code block
4. Generates: `src/api/login.ts`
5. Adds header referencing spec
6. Creates symlink: `login.ts -> src/api/login.ts`
7. Verifies: `npx tsc --noEmit`
8. @speclang-test-writer generates tests

**Result:** One spec change → Generated code + Tests + Docs

## How to Create New .py.spec

### Step 1: Create Spec File

```bash
cat > specs/mynew.spec.dir/myscript.py.spec << 'SPEC'
# speclang-header lines:12
id: "@speclang/mynew.myscript.py"
version: 0.1.0
layer: 5
target: python
output_path: scripts/myscript.py
status: draft
---

# MyScript

Description here.

## Implementation

### @block:mynew/myscript @kind:code
\`\`\`python
#!/usr/bin/env python3

def main():
    print("Hello from myscript!")

if __name__ == '__main__':
    main()
\`\`\`
SPEC
```

### Step 2: Generate Python File

```bash
# Invoke code generation agent
@speclang-code-gen
Task: Generate scripts/myscript.py from specs/mynew.spec.dir/myscript.py.spec

# Or manually (for now)
cat specs/mynew.spec.dir/myscript.py.spec | \
  sed -n '/```python/,/```/p' | \
  sed '1d;$d' > scripts/myscript.py
```

### Step 3: Add Header to Generated File

```bash
cat > scripts/myscript.py << 'HEADER'
# speclang-header lines:8
# id: "@scripts/myscript.py"
# version: 0.1.0
# source: "@speclang/mynew.myscript.py"
# source_path: "specs/mynew.spec.dir/myscript.py.spec"
# ---
# Generated from spec - DO NOT EDIT

#!/usr/bin/env python3
def main():
    print("Hello from myscript!")

if __name__ == '__main__':
    main()
HEADER
```

### Step 4: Create Symlink

```bash
ln -sf scripts/myscript.py myscript.py
```

### Step 5: Verify

```bash
python3 myscript.py
# Output: Hello from myscript!

python3 scripts/myscript.py
# Output: Hello from myscript!

# Both work ✓
```

## Integration with Build

### Makefile

```makefile
.PHONY: generate-index

generate-index:
	python3 generate_index.py

.PHONY: deploy

deploy: generate-index
	# Deploy scripts/
	rsync -av scripts/ server:/app/scripts/
	# Recreate symlinks on server
	ssh server 'cd /app && ln -sf scripts/generate_index.py generate_index.py'
```

### Docker

```dockerfile
FROM python:3.11

# Copy specs (optional, for regeneration)
COPY specs/ /app/specs/

# Copy generated scripts
COPY scripts/ /app/scripts/

# Create symlinks
RUN ln -sf scripts/generate_index.py /app/generate_index.py

# Run at build time
RUN python3 /app/generate_index.py

CMD ["python3", "/app/main.py"]
```

### CI/CD

```yaml
# .github/workflows/build.yml
steps:
  - uses: actions/checkout@v2
  
  - name: Generate index
    run: python3 generate_index.py
  
  - name: Run tests
    run: python3 -m pytest tests/
  
  - name: Deploy
    run: |
      rsync -av scripts/ server:/app/scripts/
      ssh server 'ln -sf scripts/generate_index.py /app/generate_index.py'
```

## Conclusion

**The .py.spec concept is PROVEN and WORKING:**

✅ Spec contains code blocks  
✅ AI generates Python file  
✅ Generated file has proper header  
✅ Symlink provides access  
✅ Build tools use it  
✅ **generate_index.py WORKS** (verified)

**Next steps:**
1. Fill in other .py.spec stub files
2. Create .ts.spec, .go.spec examples
3. Automate the generation process
4. Document for other developers

**This is the core SpecLang pattern:**
- Specs are source of truth
- Code is generated
- Symlinks provide access
- Everything traceable

---

*Concept proven: 2026-02-22*  
*Working example: generate_index.py*  
*Status: Ready to scale*
