#!/usr/bin/env python3
"""
Generate todo list for Ralph Loop from spec analysis.
Implements @block:ralph/todo-list from ralph-loop.spec.md
"""
import json
import re
from pathlib import Path

def load_index():
    """Load _index.json file."""
    with open('_index.json', 'r') as f:
        entries = [json.loads(line) for line in f if line.strip()]
    return entries

def analyze_specs(entries):
    """Analyze specs to identify missing implementation."""
    # Group by layer
    by_layer = {}
    for entry in entries:
        layer = entry.get('layer', 0)
        if layer not in by_layer:
            by_layer[layer] = []
        by_layer[layer].append(entry)
    
    # Identify potential gaps
    todos = []
    
    # Check if we have implementation specs
    has_implementation = any('implementation' in e['path'] for e in entries)
    if not has_implementation:
        todos.append({
            'id': 'todo-001',
            'description': 'Write implementation specs for core components',
            'depends_on': [],
            'estimated_complexity': 'high',
            'priority': 1,
            'category': 'specs'
        })
    
    # Check for OpenCode plugin implementation spec
    opencode_specs = [e for e in entries if 'opencode' in e['path'].lower()]
    if len(opencode_specs) < 2:  # Just opencode.spec.md and opencode-plugin.spec.md
        todos.append({
            'id': 'todo-002',
            'description': 'Write detailed OpenCode plugin implementation spec',
            'depends_on': ['todo-001'],
            'estimated_complexity': 'medium',
            'priority': 2,
            'category': 'implementation'
        })
    
    # Check for MCP server implementation
    mcp_specs = [e for e in entries if 'mcp' in e['path'].lower()]
    if len(mcp_specs) < 2:
        todos.append({
            'id': 'todo-003',
            'description': 'Write MCP server implementation spec',
            'depends_on': ['todo-001'],
            'estimated_complexity': 'medium',
            'priority': 3,
            'category': 'implementation'
        })
    
    # Check for SQLite schema implementation
    sqlite_specs = [e for e in entries if 'sqlite' in e['path'].lower()]
    if len(sqlite_specs) < 2:
        todos.append({
            'id': 'todo-004',
            'description': 'Write SQLite schema implementation spec',
            'depends_on': ['todo-001'],
            'estimated_complexity': 'medium',
            'priority': 4,
            'category': 'implementation'
        })
    
    # Check for code generation specs
    code_specs = [e for e in entries if '.go.spec' in e['path'] or '.ts.spec' in e['path']]
    if not code_specs:
        todos.append({
            'id': 'todo-005',
            'description': 'Write code generation specs (.go.spec, .ts.spec)',
            'depends_on': ['todo-002', 'todo-003', 'todo-004'],
            'estimated_complexity': 'high',
            'priority': 5,
            'category': 'codegen'
        })
    
    # Check for validation system
    validation_specs = [e for e in entries if 'validation' in e['path'].lower()]
    if len(validation_specs) < 2:
        todos.append({
            'id': 'todo-006',
            'description': 'Write validation system implementation spec',
            'depends_on': ['todo-001'],
            'estimated_complexity': 'medium',
            'priority': 6,
            'category': 'implementation'
        })
    
    # Check for Ralph Loop implementation (we have the spec, need implementation)
    ralph_specs = [e for e in entries if 'ralph-loop' in e['path'].lower()]
    if len(ralph_specs) < 2:
        todos.append({
            'id': 'todo-007',
            'description': 'Write Ralph Loop implementation spec',
            'depends_on': ['todo-001'],
            'estimated_complexity': 'high',
            'priority': 7,
            'category': 'implementation'
        })
    
    return todos

def main():
    print("=== Generating Todo List for Ralph Loop ===")
    print("Following @block:ralph/todo-list from ralph-loop.spec.md")
    print()
    
    entries = load_index()
    print(f"Loaded {len(entries)} spec entries from _index.json")
    
    todos = analyze_specs(entries)
    
    print(f"\nGenerated {len(todos)} todo items:")
    print()
    
    for todo in todos:
        print(f"{todo['id']}: {todo['description']}")
        print(f"  Priority: {todo['priority']}, Complexity: {todo['estimated_complexity']}")
        print(f"  Depends on: {', '.join(todo['depends_on']) if todo['depends_on'] else 'None'}")
        print()
    
    # Write to file
    output = {
        'todos': todos,
        'generated_from': '_index.json',
        'total_specs': len(entries),
        'ralph_phase': 'phase_1_manual_emulation'
    }
    
    with open('ralph_todo.json', 'w') as f:
        json.dump(output, f, indent=2)
    
    print(f"\nTodo list saved to ralph_todo.json")
    print("\nNext steps:")
    print("1. Review todo list")
    print("2. Begin Phase 1: Manual Emulation")
    print("3. Human (Builder) works on todo items")
    print("4. speclang-builder agent (Verifier) validates")

if __name__ == '__main__':
    main()