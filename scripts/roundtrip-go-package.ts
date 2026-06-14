/**
 * Manual roundtrip validation: GoPackageGenerator → go build → runs
 */
import { createGoPackageGenerator } from '../src/compiler/go/generator';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { execSync } from 'child_process';

const pkg = createGoPackageGenerator({
  packageName: 'app',
  module: 'test/app',
  goVersion: '1.21',
});

pkg.addStruct('User', [
  { name: 'ID', type: 'int' },
  { name: 'Email', type: 'string' },
  { name: 'Name', type: 'string' },
]);

pkg.addInterface('UserRepository', [
  { name: 'FindById', params: [{ name: 'id', type: 'int' }], returns: ['*User', 'error'] },
  { name: 'Create', params: [{ name: 'user', type: 'User' }], returns: ['error'] },
]);

const files = pkg.generateAll();
console.log('Files generated:', files.map((f) => f.filename).join(', '));

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'speclang-pkg-test-'));
for (const f of files) {
  fs.writeFileSync(path.join(tmpDir, f.filename), f.content);
}

const mainGo = 'package app\n\nfunc main() { _ = NewUser(1, "a@b.com", "X") }\n';
fs.writeFileSync(path.join(tmpDir, 'main.go'), mainGo);

try {
  execSync('go build -o /tmp/speclang-test-app .', { cwd: tmpDir, stdio: 'pipe' });
  console.log('✅ go build PASSED');
  const out = execSync('/tmp/speclang-test-app', { encoding: 'utf-8', stdio: 'pipe' });
  console.log('✅ go run PASSED:', out || '(no output)');
  console.log('✅ ROUNDTRIP: SUCCESS');
} catch (e: any) {
  console.error('❌ go build FAILED:', e.stderr?.toString());
  process.exit(1);
} finally {
  fs.rmSync(tmpDir, { recursive: true, force: true });
}
