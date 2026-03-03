import sys

with open('specs/roadmap.spec.dir/poc.spec.dir/block-parser.spec.md', 'r') as f:
    lines = f.readlines()

in_block = False
block_lines = []
for i, line in enumerate(lines):
    if line.strip() == '```typescript' and not in_block:
        in_block = True
        continue
    if line.strip() == '```' and in_block:
        # end of block
        break
    if in_block:
        block_lines.append(line)

print(''.join(block_lines))