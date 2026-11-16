const { parseSpec } = require('/home/kara/.hermes/cache/scratch/speclang-df-20261116-011229/repo/dist/src/parser/header.js');
const f = '/home/kara/.hermes/cache/scratch/speclang-df-20261116-011229/repo/specs/docs.spec.dir/playbook/NASA-SE-PLAYBOOK?';
const target = '/home/kara/.hermes/cache/scratch/speclang-df-20261116-011229/repo/specs/docs.spec.dir/playbook/NASA-SE-PLAYBOOK.md.spec.md';
try {
  const p = parseSpec(target);
  console.log('PARSE_OK id=' + (p.header && p.header.id));
} catch (e) {
  console.log('PARSE_THROW ' + e.constructor.name + ': ' + e.message);
  const st = (e.stack || '').split('\n').slice(1, 4).join('\n');
  console.log(st);
}
