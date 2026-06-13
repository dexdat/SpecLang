import * as fs from 'fs';
import * as path from 'path';

const baseDir = '/home/kara/SpecLang';
const mod = require(path.join(baseDir, '.speclang/assembler.spec.ts'));
const { parseSpecFile } = mod;

const content = fs.readFileSync(path.join(baseDir, 'specs/health/health-core.spec.ts.md'), 'utf-8');
const parsed = parseSpecFile(content);
if (!parsed) { process.exit(1); }
const body = parsed.body;

// Get first section
const sectionPattern = /^##\s+(?:Implementation|@block:\s*(\S+))\s*\r?\n([\s\S]*?)(?=^\s*##\s+(?:\w|@block)|(?![\s\S]))/gm;
const match = sectionPattern.exec(body);
const section = match![2];

// Now try matching code inside it
const sectionPreview = section.slice(0, 200);
console.log('Section hex bytes:');
const buf = Buffer.from(sectionPreview);
for (let i = 0; i < buf.length; i += 32) {
  const hex = [...buf.slice(i, i+32)].map(b => b.toString(16).padStart(2,'0')).join(' ');
  const ascii = [...buf.slice(i, i+32)].map(b => b >= 32 && b < 127 ? String.fromCharCode(b) : '.').join('');
  console.log(`${i.toString(16).padStart(4,'0')}: ${hex}  ${ascii}`);
}

// The template literal expression used in the code
const escapedLang = 'typescript';
const patternStr = `\`\`\`${escapedLang}\n([\s\S]*?)\`\`\``;
console.log('\nPattern string bytes:');
const patternBuf = Buffer.from(patternStr);
for (let i = 0; i < patternBuf.length; i += 32) {
  const hex = [...patternBuf.slice(i, i+32)].map(b => b.toString(16).padStart(2,'0')).join(' ');
  const ascii = [...patternBuf.slice(i, i+32)].map(b => b >= 32 && b < 127 ? String.fromCharCode(b) : '.').join('');
  console.log(`${i.toString(16).padStart(4,'0')}: ${hex}  ${ascii}`);
}

// Now try to match directly
const re = new RegExp(patternStr, 'g');
console.log('\nRegex source:', re.source);
console.log('Section starts with:', JSON.stringify(section.slice(0, 30)));
console.log('Does section start with', JSON.stringify(String.fromCharCode(0x60, 0x60, 0x60) + 'typescript'), '?');
console.log('Actual first bytes:', JSON.stringify(section.slice(0, 15)));

// Try a simpler regex
const simpleRe = /```typescript\n/;
console.log('Simple match:', simpleRe.test(section));

const re2 = /```typescript\n([\s\S]*?)```/;
console.log('Simple full match:', re2.test(section));
const m2 = re2.exec(section);
console.log('Match result:', m2 ? m2[0].slice(0, 50) : 'no match');
