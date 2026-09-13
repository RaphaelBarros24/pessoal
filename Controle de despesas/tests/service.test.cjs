const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { openStore } = require('../desktop/store.cjs');
const { createLegacy } = require('./legacy-fixture.cjs');

async function fixture(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'saldo-test-'));
  const store = await openStore(path.join(dir, 'family.sqlite'));
  t.after(() => { store.close(); fs.rmSync(dir, { recursive: true, force: true }); });
  return { store, dir };
}

test('cadastro, login offline e recuperacao individual exigem credenciais validas', async t => {
  const { store } = await fixture(t);
  const created = store.register({ name: 'Ana', username: 'ana', password: 'senha-segura-123' });
  assert.ok(created.recoveryCode.length >= 24);
  store.logout();
  assert.throws(() => store.login({ username: 'ana', password: 'errada' }), /inválid/);
  assert.throws(() => store.snapshot('2026-09'), /login/);
  store.recover({ username: 'ana', code: created.recoveryCode, password: 'outra-senha-123' });
  assert.throws(() => store.login({ username: 'ana', password: 'senha-segura-123' }), /inválid/);
  assert.equal(store.login({ username: 'ana', password: 'outra-senha-123' }).name, 'Ana');
  assert.throws(() => store.recover({ username: 'ana', code: created.recoveryCode, password: 'terceira-senha' }), /inválid/);
});

test('familia compartilha lancamentos, usa vencimento e preserva centavos apos reabrir', async t => {
  const { store, dir } = await fixture(t);
  store.register({ name: 'Ana', username: 'ana', password: 'senha-segura-123' });
  const categories = store.snapshot('2026-09').categories;
  const expense = categories.find(c => c.type === 'expense');
  const income = categories.find(c => c.type === 'income');
  const id = store.saveEntry({ type: 'expense', description: 'Mercado', amount: '100,10', dueDate: '2026-09-20', paidDate: '2026-10-01', categoryId: expense.id });
  store.saveEntry({ type: 'income', description: 'Salário', amount: '3000,00', dueDate: '2026-09-01', categoryId: income.id });
  store.register({ name: 'Bia', username: 'bia', password: 'senha-segura-456' });
  store.logout(); store.login({ username: 'bia', password: 'senha-segura-456' });
  assert.equal(store.snapshot('2026-09').totals.expense, 10010);
  assert.equal(store.snapshot('2026-10').totals.expense, 0);
  store.saveEntry({ id, type: 'expense', description: 'Mercado corrigido', amount: '120,15', dueDate: '2026-09-20', categoryId: expense.id });
  assert.equal(store.snapshot('2026-09').totals.balance, 287985);
  assert.throws(() => store.saveEntry({ type: 'expense', description: 'Inválida', amount: '-1', dueDate: '2026-09-20', categoryId: expense.id }), /valor/i);
  assert.throws(() => store.saveEntry({ type: 'expense', description: 'Inválida', amount: '10', dueDate: '2026-02-30', categoryId: expense.id }), /data/i);
  assert.throws(() => store.saveEntry({ type: 'expense', description: 'Inválida', amount: '10', dueDate: '2026-09-20', categoryId: income.id }), /categoria/i);
  const reopened = await openStore(path.join(dir, 'family.sqlite'));
  reopened.login({ username: 'ana', password: 'senha-segura-123' });
  assert.equal(reopened.snapshot('2026-09').entries[0].description, 'Mercado corrigido');
  reopened.close();
  store.deleteEntry(id);
  assert.equal(store.snapshot('2026-09').totals.expense, 0);
});

test('orcamento aponta excesso e backup restaura sem aceitar arquivo invalido', async t => {
  const { store, dir } = await fixture(t);
  store.register({ name: 'Ana', username: 'ana', password: 'senha-segura-123' });
  const category = store.snapshot('2026-09').categories.find(c => c.type === 'expense');
  store.saveBudget({ month: '2026-09', categoryId: category.id, amount: '200,00' });
  store.saveEntry({ type: 'expense', description: 'Compra', amount: '250,00', dueDate: '2026-09-15', categoryId: category.id });
  const snap = store.snapshot('2026-09');
  assert.equal(snap.budgets[0].spent, 25000);
  assert.equal(snap.budgets[0].limit, 20000);
  assert.ok(snap.suggestions.some(s => s.includes('50,00')));
  assert.equal(snap.history.length, 6);
  const automatic = fs.readdirSync(path.join(dir, 'backups')).find(f => /^\d{4}-\d{2}-\d{2}\.sqlite$/.test(f));
  const automaticStore = await openStore(path.join(dir, 'backups', automatic));
  automaticStore.login({ username: 'ana', password: 'senha-segura-123' });
  assert.equal(automaticStore.snapshot('2026-09').totals.expense, 25000);
  automaticStore.close();
  const backup = path.join(dir, 'backup.sqlite'); store.backup(backup);
  store.deleteEntry(snap.entries[0].id);
  const invalid = path.join(dir, 'invalid.sqlite'); fs.writeFileSync(invalid, 'not a database');
  assert.throws(() => store.restore(invalid), /backup/i);
  assert.equal(store.snapshot('2026-09').entries.length, 0);
  store.restore(backup);
  assert.throws(() => store.snapshot('2026-09'), /login/);
  store.login({ username: 'ana', password: 'senha-segura-123' });
  assert.equal(store.snapshot('2026-09').totals.expense, 25000);
  store.addCategory({ name: 'Pets', type: 'expense' });
  assert.ok(store.snapshot('2026-09').categories.some(c => c.name === 'Pets'));
});

test('atualizacao migra banco 0.1.0 preservando login, IDs, notas, pagamentos e orcamento', async t => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'saldo-migration-'));
  const file = path.join(dir, 'family.sqlite');
  await createLegacy(file);
  const original = fs.readFileSync(file);
  const store = await openStore(file);
  t.after(() => { store.close(); fs.rmSync(dir, { recursive: true, force: true }); });
  assert.equal(store.login({ username: 'ana', password: 'senha-antiga-123' }).id, 7);
  const snapshot = store.snapshot('2026-09');
  assert.equal(snapshot.entries[0].id, 42);
  assert.equal(snapshot.entries[0].notes, 'Não apagar');
  assert.equal(snapshot.entries[0].paidDate, '2026-09-16');
  assert.equal(snapshot.entries[0].paymentMethod, 'unspecified');
  assert.equal(snapshot.totals.expense, 12345);
  assert.equal(snapshot.totals.income, 300000);
  assert.equal(snapshot.budgets[0].limit, 20000);
  const safety = fs.readdirSync(path.join(dir, 'backups')).find(f => f.startsWith('antes-atualizacao-'));
  assert.ok(safety);
  assert.deepEqual(fs.readFileSync(path.join(dir, 'backups', safety)), original);
  store.saveEntry({ id: 42, type: 'expense', description: 'Alterada', amount: '200,00', dueDate: '2026-09-15', categoryId: 9 });
  store.restore(path.join(dir, 'backups', safety));
  store.login({ username: 'ana', password: 'senha-antiga-123' });
  assert.equal(store.snapshot('2026-09').entries.find(e => e.id === 42).notes, 'Não apagar');
  assert.equal(store.snapshot('2026-09').totals.expense, 12345);
});

test('parcelas Pix distribuem valor total e centavos sem perder o dia original nos meses curtos', async t => {
  const { store } = await fixture(t);
  store.register({ name: 'Ana', username: 'ana', password: 'senha-segura-123' });
  const categoryId = store.snapshot('2026-01').categories.find(c => c.type === 'expense').id;
  const first = store.saveEntry({ type: 'expense', description: 'Compra parcelada', amount: '100,00', installments: 3, paymentMethod: 'pix', dueDate: '2026-01-31', categoryId });
  const jan = store.snapshot('2026-01'), feb = store.snapshot('2026-02'), mar = store.snapshot('2026-03');
  assert.equal(jan.totals.expense, 3334);
  assert.equal(feb.totals.expense, 3333);
  assert.equal(mar.totals.expense, 3333);
  assert.equal(feb.entries[0].dueDate, '2026-02-28');
  assert.equal(mar.entries[0].dueDate, '2026-03-31');
  assert.equal(mar.entries[0].installmentNumber, 3);
  assert.equal(mar.paymentTotals.find(p => p.method === 'pix').amount, 3333);
  store.saveEntry({ id: first, type: 'expense', description: 'Parcela corrigida', amount: '40,00', dueDate: '2026-01-31', categoryId });
  assert.equal(store.snapshot('2026-01').entries[0].paymentMethod, 'pix');
  assert.equal(store.snapshot('2026-03').entries.length, 1);
  store.deleteEntry(first);
  assert.equal(store.snapshot('2026-02').entries.length, 1);
  assert.throws(() => store.saveEntry({ type: 'expense', description: 'Erro', amount: '0,01', installments: 3, paymentMethod: 'pix', dueDate: '2026-01-31', categoryId }), /parcel/i);
});

test('cartao consome orcamento por parcela e acumula faturas pelo fechamento sem duplicar despesas', async t => {
  const { store } = await fixture(t);
  store.register({ name: 'Ana', username: 'ana', password: 'senha-segura-123' });
  const categoryId = store.snapshot('2026-09').categories.find(c => c.type === 'expense').id;
  const cardId = store.saveCard({ name: 'Cartão família', closingDay: 25, dueDay: 5 });
  const first = store.saveEntry({ type: 'expense', description: 'Eletrodoméstico', amount: '300,00', installments: 3, paymentMethod: 'credit_card', cardId, purchaseDate: '2026-09-24', dueDate: '2026-09-24', categoryId });
  const afterClosing = store.saveEntry({ type: 'expense', description: 'Compra no fechamento', amount: '150,00', paymentMethod: 'credit_card', cardId, dueDate: '2026-09-25', categoryId });
  const sep = store.snapshot('2026-09'), oct = store.snapshot('2026-10'), nov = store.snapshot('2026-11');
  assert.equal(sep.totals.expense, 25000);
  assert.equal(sep.budgets.length, 0);
  assert.equal(sep.totals.pending, 0);
  assert.equal(oct.totals.expense, 10000);
  assert.equal(oct.invoices[0].amount, 10000);
  assert.equal(oct.invoices[0].dueDate, '2026-10-05');
  assert.equal(oct.totals.pending, 10000);
  assert.equal(nov.invoices[0].amount, 25000);
  assert.equal(nov.entries.filter(e => e.kind === 'invoice').length, 1);
  assert.equal(sep.paymentTotals.find(p => p.method === 'credit_card').amount, 25000);
  store.saveBudget({ month: '2026-10', categoryId, amount: '110,00' });
  assert.equal(store.snapshot('2026-10').budgets[0].spent, 10000);
  store.payInvoice({ cardId, month: '2026-10', paidDate: '2026-10-05' });
  assert.equal(store.snapshot('2026-10').totals.pending, 0);
  store.saveEntry({ id: first, type: 'expense', description: 'Parcela corrigida', amount: '120,00', dueDate: '2026-10-05', paidDate: '2026-10-05', categoryId });
  assert.equal(store.snapshot('2026-09').totals.expense, 27000);
  assert.equal(store.snapshot('2026-10').totals.expense, 10000);
  assert.equal(store.snapshot('2026-10').invoices[0].amount, 12000);
  store.deleteEntry(afterClosing);
  assert.equal(store.snapshot('2026-11').invoices[0].amount, 10000);
  const dec = store.snapshot('2026-12');
  assert.equal(dec.totals.expense, 0);
  assert.equal(dec.invoices[0].amount, 10000);
  const series = store.snapshot('2026-09').budgetEntries.find(e => e.id === first).installmentGroup;
  store.deleteSeries(series);
  assert.equal(store.snapshot('2026-12').invoices.length, 0);
});

test('banco de versao futura e recusado sem alterar seus bytes', async t => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'saldo-future-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const file = path.join(dir, 'family.sqlite'); await createLegacy(file);
  const SQL = await require('sql.js')(); const db = new SQL.Database(fs.readFileSync(file));
  db.run('PRAGMA user_version=4'); fs.writeFileSync(file, db.export()); db.close();
  const original = fs.readFileSync(file);
  await assert.rejects(openStore(file), /incompatível/);
  assert.deepEqual(fs.readFileSync(file), original);
});
