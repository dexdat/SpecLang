import sys
import os

spec_file = sys.argv[1]
class_name = sys.argv[2]
output_file = sys.argv[3]

with open(spec_file, 'r') as f:
    lines = f.readlines()

# Find start of block containing class definition
start = -1
for i, line in enumerate(lines):
    if class_name in line and 'class' in line:
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
                    with open(output_file, 'w') as out:
                        out.write(''.join(extracted))
                    print(f'Extracted {class_name} to {output_file}')
                    sys.exit(0)
            break

print(f'Block containing {class_name} not found', file=sys.stderr)
sys.exit(1)