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

test('fatura fechada concilia estornos e preserva compras manuais ausentes no próximo ciclo', async t => {
  const { store, cardId, dir } = await setup(t);
  const categoryId = store.snapshot('2026-09').categories.find(c => c.name === 'Lazer').id;
  const manualId = store.saveEntry({ description: 'Compra posterior', type: 'expense', amount: '7', categoryId, paymentMethod: 'credit_card', cardId, purchaseDate: '2026-09-20', dueDate: '2026-10-09' });
  store.payInvoice({ cardId, month: '2026-10', paidDate: '2026-10-02' });
  const workbook = new ExcelJS.Workbook(), sheet = workbook.addWorksheet('Fatura');
  sheet.addRow([null, 'Fatura Fechada - Outubro/2026']);
  sheet.addRow([null, 'Cartão', null, null, null, null, 'Valor', null, 'Vencimento']);
  sheet.addRow([null, 'Cartão teste', null, null, null, null, 18.50, null, new Date('2026-10-09T00:00:00Z')]);
  sheet.addRow([null, 'Data', 'Lançamento', 'Parcelamento', 'Valor']);
  sheet.addRow([null, new Date('2026-09-10T00:00:00Z'), 'Compra confirmada', null, 20]);
  sheet.addRow([null, new Date('2026-09-11T00:00:00Z'), 'Estorno confirmado', null, -1.50]);
  sheet.addRow([null, new Date('2026-09-12T00:00:00Z'), 'Pagamento Efetuado', null, -300]);
  const filename = path.join(dir, 'fechada.xlsx'); await workbook.xlsx.writeFile(filename);
  const invoice = await readItau(filename);
  assert.equal(invoice.netTotal ?? invoice.entries.reduce((sum, e) => sum + e.amount, 0), 1850);
  assert.equal(invoice.isClosed, true);
  assert.equal(invoice.declaredTotal, 1850);
  assert.equal(invoice.creditEntries.length, 1);
  const result = store.importInvoice({ cardId, invoice });
  assert.equal(result.deferred, 1);
  assert.equal(result.creditsImported, 1);
  const october = store.snapshot('2026-10');
  assert.equal(october.invoices[0].amount, 1850);
  assert.equal(october.invoices[0].dueDate, '2026-10-09');
  assert.equal(october.invoices[0].creditTotal, 150);
  const later = store.snapshot('2026-11').invoices[0].entries.find(e => e.id === manualId);
  assert.equal(later.amount, 700);
  assert.equal(later.budgetMonth, '2026-09');
  assert.equal(later.paidDate, '2026-10-02');
  assert.equal(store.importInvoice({ cardId, invoice }).creditsImported, 0);
  assert.equal(store.snapshot('2026-10').invoices[0].amount, 1850);
  store.payInvoice({ cardId, month: '2026-10', paidDate: '2026-10-09' });
  assert.equal(store.snapshot('2026-10').invoices[0].outstanding, 0);
  store.payInvoice({ cardId, month: '2026-10', paidDate: '' });
  assert.equal(store.snapshot('2026-10').invoices[0].outstanding, 1850);
  const backup = path.join(dir, 'credits.sqlite'); store.backup(backup); store.restore(backup);
  store.login({ username: 'teste', password: 'senha-teste-123' });
  assert.equal(store.snapshot('2026-10').invoices[0].amount, 1850);
});
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
  db.run('DROP TABLE invoice_credits; DROP TABLE investments; DROP TABLE investment_settings');
  db.run('DROP INDEX entries_import_key; ALTER TABLE entries DROP COLUMN import_key; ALTER TABLE entries DROP COLUMN classification_pending; DROP TABLE planned_expense_budgets; ALTER TABLE entries DROP COLUMN planned_expense_id; DROP TABLE planned_expenses; DROP TABLE group_budgets; ALTER TABLE categories DROP COLUMN group_id; DROP TABLE expense_groups; PRAGMA user_version=2');
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
  const updated = await readItau(filename);
  assert.equal(updated.entries.length, 1);
  assert.equal(updated.credits, 1);
  assert.equal(updated.creditTotal, 1000);
});

test('fatura atualizada preserva compras existentes e inclui somente as novas', async t => {
  const { store, cardId } = await setup(t);
  const existing = item('Compra existente', 1000);
  assert.deepEqual(store.importInvoice({ cardId, invoice: { dueDate: '2026-10-09', entries: [existing] } }), { imported: 1, duplicates: 0, pending: 1 });
  const updated = { dueDate: '2026-10-09', entries: [{ ...existing, description: 'Compra existente alterada', sourceCard: '****9999' }, item('Compra nova', 2500)] };
  assert.deepEqual(store.importInvoice({ cardId, invoice: updated }), { imported: 1, duplicates: 1, pending: 1 });
  assert.equal(store.snapshot('2026-10').totals.cardDue, 3500);
});


test('estornos repetidos não duplicam após reexportação e lote inválido reverte tudo', async t => {
  const { store, cardId } = await setup(t);
  const credits = [{ description: 'Estorno', purchaseDate: '2026-09-11', amount: 100, sourceCard: 'origem' }, { description: 'Estorno', purchaseDate: '2026-09-11', amount: 100, sourceCard: 'origem' }];
  const invoice = { dueDate: '2026-10-09', entries: [item('Compra', 2000)], creditEntries: credits };
  assert.equal(store.importInvoice({ cardId, invoice }).creditsImported, 2);
  assert.equal(store.snapshot('2026-10').invoices[0].amount, 1800);
  const reexported = { ...invoice, creditEntries: credits.map(c => ({ ...c, description: 'Descrição alterada', sourceCard: 'outra' })) };
  assert.equal(store.importInvoice({ cardId, invoice: reexported }).creditsImported, 0);
  assert.equal(store.snapshot('2026-10').invoices[0].credits.length, 2);
  assert.throws(() => store.importInvoice({ cardId, invoice: { dueDate: '2026-11-09', entries: [item('Nova compra')], creditEntries: [{ ...credits[0], amount: -1 }] } }), /inválido/);
  assert.equal(store.snapshot('2026-11').invoices.length, 0);
});

test('divergência na fatura fechada cancela compras e adiamentos em transação', async t => {
  const { store, cardId } = await setup(t);
  const categoryId = store.snapshot('2026-09').categories.find(c => c.name === 'Lazer').id;
  const manualId = store.saveEntry({ description: 'Compra anterior ausente', type: 'expense', amount: '7', categoryId, paymentMethod: 'credit_card', cardId, purchaseDate: '2026-09-01', dueDate: '2026-10-09' });
  const invoice = { dueDate: '2026-10-09', entries: [item('Compra confirmada', 2000)], creditEntries: [], isClosed: true, declaredTotal: 2000 };
  assert.throws(() => store.importInvoice({ cardId, invoice }), /anterior ausente/);
  const snapshot = store.snapshot('2026-10');
  assert.equal(snapshot.invoices[0].amount, 700);
  assert.equal(snapshot.invoices[0].entries[0].id, manualId);
  assert.throws(() => store.importInvoice({ cardId, invoice: { ...invoice, declaredTotal: 1900 } }), /não confere/);
  assert.equal(store.snapshot('2026-10').invoices[0].amount, 700);
});

test('migração v7 para v8 cria backup integral e mantém os registros', async t => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'saldo-v7-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const filename = path.join(dir, 'family.sqlite');
  let store = await openStore(filename);
  store.register({ name: 'Teste', username: 'teste', password: 'senha-teste-123' });
  const cardId = store.saveCard({ name: 'Cartão teste', closingDay: 25, dueDay: 9 });
  store.importInvoice({ cardId, invoice: { dueDate: '2026-10-09', entries: [item('Compra preservada')] } });
  store.close();
  const SQL = await require('sql.js')(); const old = new SQL.Database(fs.readFileSync(filename));
  const entriesBefore = old.exec('SELECT * FROM entries');
  old.run('DROP TABLE invoice_credits; PRAGMA user_version=7');
  const original = Buffer.from(old.export()); fs.writeFileSync(filename, original); old.close();
  store = await openStore(filename);
  try {
    const backup = fs.readdirSync(path.join(dir, 'backups')).find(n => n.startsWith('antes-atualizacao-v7-'));
    assert.deepEqual(fs.readFileSync(path.join(dir, 'backups', backup)), original);
    store.login({ username: 'teste', password: 'senha-teste-123' });
    assert.equal(store.snapshot('2026-10').invoices[0].amount, 1000);
    const check = new SQL.Database(fs.readFileSync(filename));
    assert.equal(check.exec('PRAGMA user_version')[0].values[0][0], 8);
    assert.deepEqual(check.exec('SELECT * FROM entries'), entriesBefore);
    assert.equal(check.exec('PRAGMA integrity_check')[0].values[0][0], 'ok');
    assert.equal(check.exec('PRAGMA foreign_key_check').length, 0);
    check.close();
  } finally { store.close(); }
});
