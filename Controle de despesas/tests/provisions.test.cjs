const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { openStore } = require('../desktop/store.cjs');

async function fixture(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'saldo-provisions-'));
  const filename = path.join(dir, 'family.sqlite');
  const store = await openStore(filename);
  t.after(() => { store.close(); fs.rmSync(dir, { recursive: true, force: true }); });
  store.register({ name: 'Teste', username: 'teste', password: 'senha-ficticia-123' });
  const categoryId = store.snapshot('2026-10').categories.find(c => c.type === 'expense').id;
  const plannedExpenseId = store.savePlannedExpense({ name: 'Aluguel', categoryId });
  return { store, filename, dir, plannedExpenseId, categoryId };
}

test('previsão mensal repete por período finito e conversão paga libera reserva sem duplicar', async t => {
  const { store, plannedExpenseId } = await fixture(t);
  store.savePlannedExpenseBudget({ month: '2026-10', endMonth: '2027-01', plannedExpenseId, amount: '1000,00' });
  assert.equal(store.snapshot('2026-09').totals.reserved, 0);
  assert.equal(store.snapshot('2027-01').totals.reserved, 100000);
  assert.equal(store.snapshot('2027-02').totals.reserved, 0);
  const input = { month: '2026-10', plannedExpenseId, amount: '950,00', dueDate: '2026-10-05', paidDate: '2026-10-07', paymentMethod: 'pix' };
  const id = store.realizePlannedExpense(input);
  const s = store.snapshot('2026-10');
  assert.equal(s.totals.provisioned, 100000);
  assert.equal(s.totals.reserved, 0);
  assert.equal(s.totals.committed, 95000);
  assert.equal(s.totals.pending, 0);
  assert.equal(s.totals.balance, -95000);
  assert.equal(s.entries.length, 1);
  assert.equal(s.entries[0].plannedExpenseId, plannedExpenseId);
  assert.equal(s.entries[0].paidDate, '2026-10-07');
  assert.throws(() => store.realizePlannedExpense(input), /já tem/);
  assert.equal(store.snapshot('2026-11').totals.reserved, 100000);
  store.deleteEntry(id);
  assert.equal(store.snapshot('2026-10').totals.reserved, 100000);
  const converted = store.realizePlannedExpense(input);
  store.saveEntry({ ...input, id: converted, type: 'expense', description: 'Mudou de mês', categoryId: s.entries[0].categoryId, dueDate: '2026-11-05' });
  assert.equal(store.snapshot('2026-10').totals.reserved, 100000);
  store.realizePlannedExpense(input);
});

test('validação e lançamento já vinculado impedem conversões incorretas', async t => {
  const { store, plannedExpenseId, categoryId } = await fixture(t);
  store.savePlannedExpenseBudget({ month: '2026-10', plannedExpenseId, amount: '100,00' });
  const input = { month: '2026-10', plannedExpenseId, amount: '120,00', dueDate: '2026-10-05', paidDate: '2026-10-05' };
  assert.throws(() => store.realizePlannedExpense({ ...input, paidDate: '' }), /Data inválida/);
  assert.throws(() => store.realizePlannedExpense({ ...input, dueDate: '2026-11-05' }), /vencimento/);
  assert.throws(() => store.realizePlannedExpense({ ...input, paymentMethod: 'credit_card' }), /fatura do cartão/);
  assert.throws(() => store.savePlannedExpenseBudget({ month: '2026-10', endMonth: '2026-09', plannedExpenseId, amount: '1' }), /período/);
  assert.throws(() => store.savePlannedExpenseBudget({ month: '2026-10', endMonth: '2036-10', plannedExpenseId, amount: '1' }), /período/);
  assert.equal(store.snapshot('2026-10').totals.reserved, 10000);
  store.saveEntry({ type: 'expense', description: 'Existente', categoryId, plannedExpenseId, amount: '30', dueDate: input.dueDate });
  assert.equal(store.snapshot('2026-10').totals.committed, 10000);
  assert.throws(() => store.realizePlannedExpense(input), /já tem/);
  store.deletePlannedExpenseBudget({ month: '2026-10', plannedExpenseId });
  assert.equal(store.snapshot('2026-10').totals.committed, 3000);
});

test('migração v6 cria backup integral e conversão persiste com integridade', async t => {
  const { store, filename, dir, plannedExpenseId } = await fixture(t);
  store.savePlannedExpenseBudget({ month: '2026-10', plannedExpenseId, amount: '100' });
  const SQL = await require('sql.js')();
  const old = new SQL.Database(fs.readFileSync(filename));
  old.run('ALTER TABLE planned_expense_budgets DROP COLUMN realized_entry_id; PRAGMA user_version=6');
  const original = Buffer.from(old.export()); old.close(); fs.writeFileSync(filename, original);
  const upgraded = await openStore(filename);
  upgraded.login({ username: 'teste', password: 'senha-ficticia-123' });
  upgraded.realizePlannedExpense({ month: '2026-10', plannedExpenseId, amount: '120', dueDate: '2026-10-10', paidDate: '2026-10-10' });
  upgraded.close();
  const safety = fs.readdirSync(path.join(dir, 'backups')).find(f => f.startsWith('antes-atualizacao-v6-'));
  assert.deepEqual(fs.readFileSync(path.join(dir, 'backups', safety)), original);
  const reopened = await openStore(filename);
  reopened.login({ username: 'teste', password: 'senha-ficticia-123' });
  assert.equal(reopened.snapshot('2026-10').totals.committed, 12000);
  assert.equal(reopened.snapshot('2026-10').totals.reserved, 0);
  reopened.close();
  const check = new SQL.Database(fs.readFileSync(filename));
  assert.equal(check.exec('PRAGMA integrity_check')[0].values[0][0], 'ok');
  assert.equal(check.exec('PRAGMA foreign_key_check').length, 0); check.close();
});

test('previsão realizada no cartão entra na fatura e preserva consumo sem duplicar', async t => {
  const { store, plannedExpenseId } = await fixture(t);
  const cardId = store.saveCard({ name: 'Cartão teste', closingDay: 20, dueDay: 5 });
  store.savePlannedExpenseBudget({ month: '2026-10', endMonth: '2026-11', plannedExpenseId, amount: '100' });
  const input = { month: '2026-10', plannedExpenseId, amount: '110', paymentMethod: 'credit_card', cardId, purchaseDate: '2026-10-20' };
  assert.throws(() => store.realizePlannedExpense({ ...input, cardId: 99999 }), /Cartão não encontrado/);
  assert.throws(() => store.realizePlannedExpense({ ...input, purchaseDate: '2026-11-20' }), /mês da previsão/);
  assert.throws(() => store.realizePlannedExpense({ ...input, paidDate: '2026-10-20' }), /fatura do cartão/);
  assert.equal(store.snapshot('2026-10').totals.reserved, 10000);
  const entryId = store.realizePlannedExpense(input);
  const october = store.snapshot('2026-10');
  assert.equal(october.totals.reserved, 0);
  assert.equal(october.totals.committed, 11000);
  assert.equal(october.totals.pending, 0);
  const purchase = october.budgetEntries.find(e => e.id === entryId);
  assert.equal(purchase.cardId, cardId);
  assert.equal(purchase.paidDate, null);
  assert.equal(purchase.purchaseDate, '2026-10-20');
  assert.equal(purchase.dueDate, '2026-12-05');
  assert.equal(store.snapshot('2026-11').totals.reserved, 10000);
  const december = store.snapshot('2026-12');
  assert.equal(december.totals.expense, 0);
  assert.equal(december.totals.cardDue, 11000);
  assert.equal(december.totals.pending, 11000);
  store.payInvoice({ cardId, month: '2026-12', paidDate: '2026-12-05' });
  assert.equal(store.snapshot('2026-12').totals.pending, 0);
  assert.equal(store.snapshot('2026-10').totals.committed, 11000);
  store.payInvoice({ cardId, month: '2026-12', paidDate: '' });
  assert.equal(store.snapshot('2026-12').totals.pending, 11000);
  assert.equal(store.snapshot('2026-10').totals.reserved, 0);
  assert.throws(() => store.realizePlannedExpense(input), /já tem/);
});
