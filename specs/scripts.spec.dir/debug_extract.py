# speclang-header lines:3
# target: scripts/debug_extract.py
import re

def extract_code_blocks(content, language):
    blocks = []
    pattern = rf'```speclang\n# @block:[^ ]+ @kind:code\n```{language}\n(.*?)```'
    for match in re.finditer(pattern, content, re.DOTALL):
        block = match.group(1).strip()
        if block not in blocks:
            blocks.append(block)
    if not blocks:
        pattern2 = rf'```{language}\n(.*?)```'
        for match in re.finditer(pattern2, content, re.DOTALL):
            block = match.group(1).strip()
            if block not in blocks:
                blocks.append(block)
    return blocks

with open('specs/implementation/validation-system.spec.md', 'r') as f:
    content = f.read()
blocks = extract_code_blocks(content, 'typescript')
print('Number of blocks:', len(blocks))
for i, block in enumerate(blocks):
    print(f'Block {i} length:', len(block))
    print('First 200 chars:', block[:200])
    print('Last 200 chars:', block[-200:] if len(block) > 200 else block)
    print('---')