# speclang-header lines:3
# target: scripts/debug_steps.py
#!/usr/bin/env python3
import re
import sys

def strip_code_blocks(content: str) -> str:
    """Remove code blocks (triple backticks) from content, but keep speclang blocks."""
    # Pattern to match code blocks with language
    pattern = r'```([a-z]*)\n(.*?)\n```'
    def repl(match):
        lang = match.group(1)
        if lang == 'speclang':
            # Keep the content inside speclang block
            return match.group(2)
        else:
            return ''
    return re.sub(pattern, repl, content, flags=re.DOTALL)

def detect_steps(content: str):
    """Count step-by-step items in content."""
    # Remove code blocks first
    content = strip_code_blocks(content)
    
    # Count numbered lists (1., 2., etc.)
    numbered = re.findall(r'^\s*\d+\.\s+', content, re.MULTILINE)
    # Count bullet lists (-, *, •)
    bulleted = re.findall(r'^\s*[-*•]\s+', content, re.MULTILINE)
    # Count imperative sentences (simple detection: lines starting with action verbs)
    # Common imperative verbs
    imperative_verbs = ['add', 'create', 'define', 'check', 'validate', 'ensure', 'run', 'execute', 'call', 'return', 'throw', 'log', 'print', 'send', 'receive', 'parse', 'extract', 'load', 'save', 'write', 'read', 'open', 'close']
    imperative_pattern = r'^\s*(' + '|'.join(imperative_verbs) + r')\b'
    imperative = re.findall(imperative_pattern, content, re.MULTILINE | re.IGNORECASE)
    
    steps = len(numbered) + len(bulleted) + len(imperative)
    return steps, len(numbered), len(bulleted), len(imperative)

def extract_blocks(content: str):
    """Extract blocks from spec content."""
    blocks = []
    lines = content.split('\n')
    current_block = None
    current_kind = None
    current_lines = []
    
    for line in lines:
        # Check for block marker: # @block:id @kind:type
        block_match = re.match(r'^# @block:([^\s]+) @kind:([^\s]+)', line)
        if block_match:
            # Save previous block if any
            if current_block is not None:
                blocks.append({
                    'id': current_block,
                    'kind': current_kind,
                    'content': '\n'.join(current_lines).strip()
                })
            current_block = block_match.group(1)
            current_kind = block_match.group(2)
            current_lines = []
        else:
            current_lines.append(line)
    
    # Add last block
    if current_block is not None:
        blocks.append({
            'id': current_block,
            'kind': current_kind,
            'content': '\n'.join(current_lines).strip()
        })
    
    return blocks

with open('specs/validation-tool.spec.md', 'r') as f:
    content = f.read()

blocks = extract_blocks(content)
for block in blocks:
    if block['kind'] == 'operation':
        print(f"Operation block: {block['id']}")
        print("Content preview:", block['content'][:200])
        steps, numbered, bulleted, imperative = detect_steps(block['content'])
        print(f"Steps detected: total={steps}, numbered={numbered}, bulleted={bulleted}, imperative={imperative}")
        # Count sentences
        sentences = re.split(r'[.!?]+', block['content'])
        sentences = [s.strip() for s in sentences if s.strip()]
        print(f"Total sentences: {len(sentences)}")
        # Print lines with numbers
        for line in block['content'].split('\n'):
            if re.match(r'^\s*\d+\.', line):
                print(f"Numbered line: {line}")
        break