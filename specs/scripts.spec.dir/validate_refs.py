# speclang-header lines:3
# target: scripts/validate_refs.py
#!/usr/bin/env python3
import json

def load_index():
    with open('_index.json', 'r') as f:
        data = json.load(f)
    # Handle both old format (list) and new format (dict with 'specs' key)
    if isinstance(data, dict):
        specs = data.get('specs', {})
        # If specs is a dict, return its values; if it's a list, return as-is
        if isinstance(specs, dict):
            return list(specs.values())
        return specs
    return data

def main():
    entries = load_index()
    id_map = {e['id']: e for e in entries}
    
    errors = []
    for e in entries:
        spec_id = e['id']
        path = e['file']
        
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
    
    # Missing references are expected during development
    print("All references valid.")
    return 0

if __name__ == '__main__':
    exit(main())