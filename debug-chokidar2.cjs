const chokidar = require('chokidar');
const fs = require('fs');
const path = require('path');

const dir = '/tmp/speclang-debug-test2';
try { fs.rmSync(dir, { recursive: true, force: true }); } catch(e) {}
fs.mkdirSync(dir, { recursive: true });

// Test 1: Watch a single file that already exists
const existingFile = path.join(dir, 'existing.spec.md');
fs.writeFileSync(existingFile, 'existing\n');
console.log('File exists');

const w = chokidar.watch([dir], {
  usePolling: true,
  interval: 100,
  alwaysStat: false,
});

w.on('ready', () => {
  console.log('Watcher ready');
  // Now modify the existing file
  setTimeout(() => {
    console.log('Modifying existing file...');
    fs.writeFileSync(existingFile, 'modified\n');
    console.log('Modified');
  }, 500);
});

w.on('all', (event, p) => console.log('ALL EVENT:', event, p));

setTimeout(() => {
  console.log('Closing');
  w.close();
  try { fs.rmSync(dir, { recursive: true, force: true }); } catch(e) {}
  process.exit(0);
}, 3000);
