#!/bin/bash
# dogfood re-fire perf re-measure at current HEAD (records-only fire)
cd /home/kara/speclang || exit 9
echo "HEAD $(git rev-parse --short HEAD)"
echo "LOAD_START $(cat /proc/loadavg)"
echo "CORES $(nproc)"
echo "SPEC_FILES $(find specs -type f -name '*.spec.md' | wc -l) specmd"
echo "SPEC_SCL $(find specs -type f -name '*.scl' | wc -l) scl"
/usr/bin/time -f "floor_run1=%e" node bin/speclang --version > /dev/null
/usr/bin/time -f "floor_run2=%e" node bin/speclang --version > /dev/null
/usr/bin/time -f "floor_run3=%e" node bin/speclang --version > /dev/null
for i in 1 2 3 4 5; do
  /usr/bin/time -f "validate_run${i}=%e rc=%x" node bin/speclang validate > /dev/null
done
echo "LOAD_END $(cat /proc/loadavg)"
