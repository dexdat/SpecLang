import sys

with open('specs/roadmap.spec.dir/poc.spec.dir/block-parser.spec.md', 'r') as f:
    lines = f.readlines()

# Find start of block containing "class BlockParser"
start = -1
for i, line in enumerate(lines):
    if 'class BlockParser' in line:
        # backtrack to find ```typescript
        for j in range(i, max(-1, i-10), -1):
            if lines[j].strip() == '```typescript':
                start = j
                break
        if start != -1:
            # find closing ```
            for k in range(start+1, len(lines)):
                if lines[k].strip() == '```':
                    end = k
                    # extract lines between start+1 and end-1
                    extracted = lines[start+1:end]
                    print(''.join(extracted))
                    sys.exit(0)
            break

print('Block not found', file=sys.stderr)
sys.exit(1)