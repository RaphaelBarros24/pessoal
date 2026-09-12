const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { openStore } = require('../desktop/store.cjs');

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
