#!/usr/bin/env python3
"""
Generate validation system implementation from spec.
Extracts TypeScript code blocks from specs/implementation/validation-system.spec.md
and writes them to src/validation-system.ts.
"""

import re
import os
from pathlib import Path

def extract_code_blocks(content):
    """Extract TypeScript code blocks from spec content.
    Handles both ```typescript and ```speclang ... @kind:code ... ```typescript patterns.
    Returns list of (block_id, code) tuples.
    """
    blocks = []
    
    # Pattern for speclang code block with @kind:code
    # Matches ```speclang\n# @block:... @kind:code\n```typescript\n...```
    pattern = r'```speclang\n# @block:([^ ]+) @kind:code\n```typescript\n(.*?)```'
    for match in re.finditer(pattern, content, re.DOTALL):
        block_id = match.group(1)
        code = match.group(2).strip()
        blocks.append((block_id, code))
    
    # Also catch plain ```typescript blocks (fallback)
    pattern2 = r'```typescript\n(.*?)```'
    for match in re.finditer(pattern2, content, re.DOTALL):
        # Skip if already captured by first pattern (overlap)
        start, end = match.span()
        overlapping = False
        for match2 in re.finditer(pattern, content, re.DOTALL):
            s, e = match2.span()
            if s <= start and e >= end:
                overlapping = True
                break
        if not overlapping:
            blocks.append(('plain', match.group(1).strip()))
    
    return blocks

def read_spec(path):
    with open(path, 'r') as f:
        return f.read()

def write_file(path, content):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w') as f:
        f.write(content)
    print(f"Written {path}")

def main():
    spec_path = 'specs/implementation/validation-system.spec.md'
    content = read_spec(spec_path)
    
    blocks = extract_code_blocks(content)
    if not blocks:
        print("No TypeScript code blocks found.")
        return
    
    # Combine blocks with headers
    output = "// Generated from validation system implementation spec\n"
    output += "// DO NOT EDIT MANUALLY\n\n"
    
    for block_id, code in blocks:
        output += f"\n// Block: {block_id}\n"
        output += code
        output += "\n"
    
    write_file('src/validation-system.ts', output)
    
    print(f"Extracted {len(blocks)} code blocks.")
    print("Validation system generation complete.")

if __name__ == '__main__':
    main()