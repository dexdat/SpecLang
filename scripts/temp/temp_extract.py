import json
import sys

with open('_index.json', 'r') as f:
    data = json.load(f)

specs = data.get('specs', {})
print(f"Total specs: {len(specs)}")
for spec_id in specs.keys():
    print(spec_id)