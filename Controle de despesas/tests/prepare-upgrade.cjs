const fs = require('node:fs');
const path = require('node:path');
const { createLegacy } = require('./legacy-fixture.cjs');
const folder = path.join(__dirname, '../.local-data/upgrade');
fs.mkdirSync(folder, { recursive: true });
createLegacy(path.join(folder, 'family.sqlite')).then(() => {
  fs.copyFileSync(path.join(folder, 'family.sqlite'), path.join(folder, 'original-v1.sqlite'));
  console.log('Banco fictício v1 preparado para teste de atualização.');
}).catch(error => { console.error(error); process.exitCode = 1; });
