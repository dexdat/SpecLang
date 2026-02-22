#!/usr/bin/env python3
"""
Generate OpenCode plugin TypeScript code from specs.
Extracts TypeScript code blocks from all specs/opencode-plugin.dir/*.spec.md
and writes them to src/opencode-plugin/index.ts.
"""

import re
import os
from pathlib import Path

def extract_code_blocks(content, language):
    """Extract code blocks of specific language from spec content.
    Returns list of (block_id, code) tuples.
    Uses line-by-line parsing to avoid premature closing due to backticks in comments.
    """
    lines = content.split('\n')
    i = 0
    blocks = []
    
    while i < len(lines):
        line = lines[i]
        # Look for start of speclang block with @kind:code
        if line.strip() == '```speclang':
            block_start = i
            i += 1
            if i >= len(lines):
                break
            # Next line should be # @block:... @kind:code
            if lines[i].startswith('# @block:') and '@kind:code' in lines[i]:
                # Extract block id
                parts = lines[i].split()
                block_part = parts[1]  # '@block:ID'
                block_id = block_part.split(':', 1)[1]  # 'ID'
                i += 1
                # Look for ```{language} line
                if i < len(lines) and lines[i].strip() == f'```{language}':
                    i += 1
                    code_lines = []
                    # Collect until we find closing backticks at start of line
                    while i < len(lines) and not (lines[i].strip().startswith('```') and len(lines[i].strip()) == 3):
                        code_lines.append(lines[i])
                        i += 1
                    if i < len(lines) and lines[i].strip() == '```':
                        i += 1  # consume closing backticks
                        code = '\n'.join(code_lines)
                        blocks.append((block_id, code))
                        continue
            # If we didn't find the pattern, reset to block_start+1 and continue
            i = block_start + 1
            continue
        
        # Look for plain language block
        if line.strip() == f'```{language}':
            i += 1
            code_lines = []
            while i < len(lines) and not (lines[i].strip().startswith('```') and len(lines[i].strip()) == 3):
                code_lines.append(lines[i])
                i += 1
            if i < len(lines) and lines[i].strip() == '```':
                i += 1
                code = '\n'.join(code_lines)
                blocks.append((None, code))
                continue
        
        i += 1
    
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
    spec_dir = 'specs/opencode-plugin.dir'
    spec_files = list(Path(spec_dir).glob('*.spec.md'))
    
    all_blocks = []
    for spec_file in spec_files:
        content = read_spec(spec_file)
        blocks = extract_code_blocks(content, 'typescript')
        for block_id, code in blocks:
            if block_id:
                all_blocks.append((spec_file.name, block_id, code))
            else:
                all_blocks.append((spec_file.name, 'unknown', code))
    
    if not all_blocks:
        print("No TypeScript code blocks found.")
        return
    
    # Group by component? For now just concatenate with headers
    output_lines = []
    output_lines.append('// Generated OpenCode plugin TypeScript code')
    output_lines.append('// DO NOT EDIT MANUALLY')
    output_lines.append('')
    output_lines.append('// Import dependencies')
    output_lines.append("import Database = require('better-sqlite3');")
    output_lines.append("import { readFile, writeFile, unlink } from 'fs/promises';")
    output_lines.append("import * as path from 'path';")
    output_lines.append("import { glob } from 'glob';")
    output_lines.append("import { parse } from 'yaml';")
    output_lines.append('')
    output_lines.append('// Assume db is a better-sqlite3 database instance')
    output_lines.append('// This will be provided by the plugin runtime')
    output_lines.append('declare const db: InstanceType<typeof Database>;')
    output_lines.append('declare const tools: any;')
    output_lines.append('declare const events: any;')
    output_lines.append('')
    
    for spec_name, block_id, code in all_blocks:
        output_lines.append(f'// Block: {block_id} from {spec_name}')
        output_lines.append(code)
        output_lines.append('')
    
    output_content = '\n'.join(output_lines)
    write_file('src/opencode-plugin/index.ts', output_content)
    
    print(f"Generated {len(all_blocks)} code blocks into src/opencode-plugin/index.ts")

if __name__ == '__main__':
    main()