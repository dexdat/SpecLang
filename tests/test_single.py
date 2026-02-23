#!/usr/bin/env python3
import sys
sys.path.insert(0, '.')
from add_missing_fields import update_file

if __name__ == '__main__':
    filepath = sys.argv[1] if len(sys.argv) > 1 else 'specs/cli.spec.md'
    dry_run = '--dry-run' in sys.argv
    update_file(filepath, dry_run)