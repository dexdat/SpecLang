import sys

with open('specs/roadmap.spec.dir/poc.spec.dir/block-parser.spec.md', 'r') as f:
    lines = f.readlines()

block_count = 0
in_block = False
block_lines = []
for i, line in enumerate(lines):
    if line.strip() == '```typescript':
        block_count += 1
        if block_count == 6:  # the block we want
            in_block = True
            continue
    if line.strip() == '```' and in_block:
        # end of block
        break
    if in_block:
        block_lines.append(line)

if block_lines:
    print(''.join(block_lines))
else:
    print('Block not found', file=sys.stderr)
    sys.exit(1)