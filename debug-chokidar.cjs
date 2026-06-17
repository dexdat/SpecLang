const chokidar = require('chokidar');
const fs = require('fs');
const path = require('path');

const dir = '/tmp/speclang-debug-test';
try { fs.rmSync(dir, { recursive: true, force: true }); } catch(e) {}
fs.mkdirSync(dir, { recursive: true });

console.log('Watching:', dir);
const w = chokidar.watch([`${dir}/**/*.spec.md`], {
  usePolling: true,
  interval: 100,
});

let ready = false;
w.on('ready', () => {
  ready = true;
  console.log('Watcher ready, creating file...');
  const filePath = path.join(dir, 'test.spec.md');
  fs.writeFileSync(filePath, 'hello\n');
  console.log('Created:', filePath);
});

w.on('all', (event, p) => console.log('ALL EVENT:', event, p));

setTimeout(() => {
  console.log('Watcher ready flag:', ready);
  console.log('Dir contents:', fs.readdirSync(dir));
  console.log('Closing watcher');
  w.close();
  try { fs.rmSync(dir, { recursive: true, force: true }); } catch(e) {}
}, 3000);
