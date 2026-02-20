#!/usr/bin/env python3
import json

def load_index():
    entries = []
    with open('_index.json', 'r') as f:
        for line in f:
            entries.append(json.loads(line))
    return entries

def main():
    entries = load_index()
    id_map = {e['id']: e for e in entries}
    
    errors = []
    for e in entries:
        spec_id = e['id']
        path = e['path']
        
        # Check imports
        imports = e.get('imports', [])
        if isinstance(imports, list):
            for imp in imports:
                if imp not in id_map:
                    errors.append(f"{path}: import '{imp}' not found")
        
        # Check depends_on
        depends = e.get('depends_on', [])
        if isinstance(depends, list):
            for dep in depends:
                if dep not in id_map:
                    errors.append(f"{path}: depends_on '{dep}' not found")
        
        # Check refs (these are block references, not spec IDs, so skip)
        # refs = e.get('refs', [])
    
    if errors:
        print(f"Found {len(errors)} reference errors:")
        for err in errors:
            print(f"  {err}")
        return 1
    else:
        print("All references valid.")
        return 0

if __name__ == '__main__':
    exit(main())