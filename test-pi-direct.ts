// Direct Pi Agent test — dynamic import
import { writeFileSync, readFileSync } from 'fs';

async function main() {
  const mod = await import('@earendil-works/pi-coding-agent');
  writeFileSync('/tmp/pi-test-target.py', '# empty\n');
  const { session } = await mod.createAgentSession({ cwd: '/tmp', tools: ['read', 'edit', 'write', 'bash', 'glob'] });
  console.error('SESSION CREATED');
  await session.prompt('Read /tmp/pi-test-target.py, then use the edit tool to add: print("hello")');
  console.error('PROMPT DONE');
  session.dispose();
  console.error('RESULT:\n' + readFileSync('/tmp/pi-test-target.py', 'utf-8'));
}
main().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
