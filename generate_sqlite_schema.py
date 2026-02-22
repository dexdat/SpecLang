#!/usr/bin/env python3
"""
Generate SQLite schema implementation from spec.
Extracts SQL and TypeScript code blocks from specs/implementation/sqlite/schema.spec.md
and writes them to appropriate files.
"""

import re
import os
from pathlib import Path

def extract_code_blocks(content, language):
    """Extract code blocks of specific language from spec content."""
    pattern = rf'```{language}\n(.*?)```'
    matches = re.findall(pattern, content, re.DOTALL)
    # Also handle speclang code blocks with language indicator
    pattern2 = rf'```speclang\n# @block:.*? @kind:code\n```{language}\n(.*?)```'
    matches2 = re.findall(pattern2, content, re.DOTALL)
    return matches + matches2

def read_spec(path):
    with open(path, 'r') as f:
        return f.read()

def write_file(path, content):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w') as f:
        f.write(content)
    print(f"Written {path}")

def main():
    spec_path = 'specs/implementation/sqlite/schema.spec.md'
    content = read_spec(spec_path)
    
    # Extract SQL blocks
    sql_blocks = extract_code_blocks(content, 'sql')
    if sql_blocks:
        sql_content = '\n\n'.join(sql_blocks)
        write_file('migrations/001-initial.sql', sql_content)
    
    # Extract TypeScript blocks
    ts_blocks = extract_code_blocks(content, 'typescript')
    if ts_blocks:
        ts_content = '\n\n'.join(ts_blocks)
        write_file('src/db/speclang-db.ts', ts_content)
    
    print("SQLite schema generation complete.")

if __name__ == '__main__':
    main()