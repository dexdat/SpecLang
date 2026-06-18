try {
  const pi = require('@earendil-works/pi-coding-agent');
  console.log('Pi SDK loaded:', typeof pi);
  console.log('Keys:', Object.keys(pi).join(', '));
  process.exit(0);
} catch(e) {
  console.log('Pi ERR:', e.message);
  process.exit(1);
}
