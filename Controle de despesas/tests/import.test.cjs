const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const ExcelJS = require('exceljs');
const { openStore } = require('../desktop/store.cjs');
const { readItau } = require('../desktop/itau.cjs');
async function setup(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'saldo-import-'));
  const store = await openStore(path.join(dir, 'family.sqlite'));
  t.after(() => { store.close(); fs.rmSync(dir, { recursive: true, force: true }); });
  store.register({ name: 'Teste', username: 'teste', password: 'senha-teste-123' });
  const cardId = store.saveCard({ name: 'Itaú teste', closingDay: 25, dueDay: 9 });
  return { dir, store, cardId };
}
const item = (description, amount = 1000) => ({ description, amount, purchaseDate: '2026-09-10', installmentNumber: 1, installmentCount: 1, sourceCard: '****0000' });
test('importação preserva ocorrências iguais, ignora manuais e reimportação, classifica e inclui pendências nos totais', async t => {
  const { store, cardId } = await setup(t);
  const categoryId = store.snapshot('2026-09').categories.find(c => c.name === 'Lazer').id;
  store.saveEntry({ description: 'Cinema', type: 'expense', amount: '10', categoryId, paymentMethod: 'credit_card', cardId, purchaseDate: '2026-09-10', dueDate: '2026-09-10' });
  const invoice = { dueDate: '2026-10-09', entries: [item('Cinema'), item('Supermercado'), item('Loja desconhecida'), item('Loja desconhecida'), { ...item('Parcela antiga'), purchaseDate: '2026-08-02', installmentNumber: 3, installmentCount: 6 }] };
  assert.deepEqual(store.importInvoice({ cardId, invoice }), { imported: 4, duplicates: 1, pending: 3 });
  assert.equal(store.snapshot('2026-10').totals.cardDue, 5000);
  assert.equal(store.snapshot('2026-11').totals.cardDue, 0);
  assert.deepEqual(store.importInvoice({ cardId, invoice }), { imported: 0, duplicates: 5, pending: 0 });
  const pending = store.snapshot('2026-09').pendingClassification;
  assert.equal(pending.length, 3);
  const e = pending[0];
  assert.throws(() => store.saveEntry({ ...e, amount: '10' }), /categoria/);
  store.saveEntry({ ...e, categoryId, amount: '10' });
  assert.equal(store.snapshot('2026-09').pendingClassification.length, 2);
  const next = { dueDate: '2026-11-09', entries: [{ ...item(e.description), purchaseDate: '2026-10-10' }] };
  assert.equal(store.importInvoice({ cardId, invoice: next }).pending, 0);
  assert.equal(store.snapshot('2026-10').invoices[0].amount, 5000);
});
test('falha durante lote reverte todos os lançamentos', async t => {
  const { store, cardId } = await setup(t);
  assert.throws(() => store.importInvoice({ cardId, invoice: { dueDate: '2026-10-09', entries: [item('Supermercado'), item('Inválido', -100)] } }), /inválid/);
  assert.equal(store.snapshot('2026-10').totals.cardDue, 0);
});
test('atualização v2 faz cópia integral e restauração preserva deduplicação e pendências', async t => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'saldo-v2-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const filename = path.join(dir, 'family.sqlite');
  let store = await openStore(filename);
  store.register({ name: 'Teste', username: 'teste', password: 'senha-teste-123' });
  const cardId = store.saveCard({ name: 'Itaú teste', closingDay: 25, dueDay: 9 });
  store.close();
  const SQL = await require('sql.js')(); const db = new SQL.Database(fs.readFileSync(filename));
  db.run('DROP INDEX entries_import_key; ALTER TABLE entries DROP COLUMN import_key; ALTER TABLE entries DROP COLUMN classification_pending; PRAGMA user_version=2');
  const original = Buffer.from(db.export()); fs.writeFileSync(filename, original); db.close();
  store = await openStore(filename);
  try {
    const safety = fs.readdirSync(path.join(dir, 'backups')).find(n => n.startsWith('antes-atualizacao-v2-'));
    assert.deepEqual(fs.readFileSync(path.join(dir, 'backups', safety)), original);
    store.login({ username: 'teste', password: 'senha-teste-123' });
    const invoice = { dueDate: '2026-10-09', entries: [item('Loja desconhecida')] };
    store.importInvoice({ cardId, invoice });
    const backup = path.join(dir, 'backup.sqlite'); store.backup(backup); store.restore(backup);
    store.login({ username: 'teste', password: 'senha-teste-123' });
    assert.equal(store.snapshot('2026-10').pendingClassification.length, 1);
    assert.deepEqual(store.importInvoice({ cardId, invoice }), { imported: 0, duplicates: 1, pending: 0 });
  } finally { store.close(); }
});
test('Excel Itaú lê datas, centavos e parcelas e ignora pagamento e subtotal', async t => {
  const { dir } = await setup(t);
  const workbook = new ExcelJS.Workbook(); const sheet = workbook.addWorksheet('Fatura');
  sheet.addRow([null, 'Cartão', null, null, null, null, 'Valor (parcial)', null, 'Vencimento']);
  sheet.addRow([null, 'Cartão teste', null, null, null, null, 12.34, null, new Date('2026-10-09T00:00:00Z')]);
  sheet.addRow([null, 'Data', 'Lan�amento', 'Parcelamento', 'Valor']);
  sheet.addRow([null, new Date('2026-08-10T00:00:00Z'), 'Loja teste', 'Parcela 2 de 3', 12.34]);
  sheet.addRow([null, new Date('2026-09-09T00:00:00Z'), 'Pagamento Efetuado', null, -200]);
  sheet.addRow([null, null, null, 'Subtotal', 12.34]);
  const filename = path.join(dir, 'fatura.xlsx'); await workbook.xlsx.writeFile(filename);
  const invoice = await readItau(filename);
  assert.equal(invoice.entries.length, 1); assert.equal(invoice.entries[0].amount, 1234); assert.equal(invoice.entries[0].installmentNumber, 2); assert.equal(invoice.payments, 1);
  sheet.addRow([null, new Date('2026-09-10T00:00:00Z'), 'Estorno', null, -10]);
  await workbook.xlsx.writeFile(filename);
  await assert.rejects(readItau(filename), /estorno/);
});
