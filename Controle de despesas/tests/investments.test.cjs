const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { openStore } = require('../desktop/store.cjs');
const { estimateCdb, irRate, daysBetween, addMonths } = require('../desktop/investments.cjs');
const base = { principal: 1000000, rateType: 'fixed', rate: 12, startDate: '2025-01-01', maturityDate: '2026-01-01' };
const input = { name: 'Reserva', issuer: 'Banco fictício', goal: 'Emergência', amount: '10000,00', rateType: 'cdi', rate: '110', startDate: '2025-01-01', maturityDate: '2028-01-01', liquidity: 'daily', notes: 'Cadastro fictício' };
async function fixture(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'saldo-cdb-'));
  const filename = path.join(dir, 'family.sqlite');
  const store = await openStore(filename);
  t.after(() => { store.close(); fs.rmSync(dir, { recursive: true, force: true }); });
  return { dir, filename, store };
}
function login(store) { store.register({ name: 'Teste', username: 'teste', password: 'senha-ficticia-123' }); }
test('prefixado: 12% em 365 dias, IR sobre rendimento e congelamento no vencimento', () => {
  const result = estimateCdb(base, '2026-01-01', 10);
  assert.equal(result.gross, 1120000);
  assert.equal(result.ir, 21000);
  assert.equal(result.net, 1099000);
  assert.equal(result.iof, 0);
  assert.deepEqual(estimateCdb(base, '2030-01-01', 40), result);
  assert.equal(estimateCdb(base, '2025-01-01', 10).net, base.principal);
});
test('percentual do CDI incide na taxa diária, sem multiplicar a taxa anual diretamente', () => {
  const full = estimateCdb({ ...base, rateType: 'cdi', rate: 100 }, '2026-01-01', 10);
  assert.equal(full.gross, 1100000);
  const double = estimateCdb({ ...base, rateType: 'cdi', rate: 200 }, '2026-01-01', 10);
  const daily = Math.pow(1.1, 1 / 252) - 1;
  assert.equal(double.gross, Math.round(1000000 * Math.pow(1 + 2 * daily, 252)));
  assert.notEqual(double.gross, 1200000);
  assert.equal(estimateCdb({ ...base, rateType: 'cdi', rate: 110 }, '2026-01-01', 0).net, base.principal);
});
test('IR respeita todas as fronteiras em dias corridos e IOF antecede sua base', () => {
  for (const [days, expected] of [[0, 22.5], [180, 22.5], [181, 20], [360, 20], [361, 17.5], [720, 17.5], [721, 15]]) assert.equal(irRate(days), expected);
  for (const [at, iof] of [['2025-01-02', 96], ['2025-01-16', 50], ['2025-01-30', 3], ['2025-01-31', 0]]) {
    const result = estimateCdb(base, at, 10);
    assert.equal(result.iofRate, iof);
    assert.equal(result.iof, Math.round(result.earnings * iof / 100));
    assert.equal(result.ir, Math.round((result.earnings - result.iof) * .225));
    assert.equal(result.net, result.gross - result.iof - result.ir);
  }
  assert.equal(daysBetween('2024-02-28', '2024-03-01'), 2);
  assert.equal(addMonths('2025-01-31', 1), '2025-02-28');
  assert.equal(addMonths('2025-01-31', 2), '2025-03-31');
});
test('operações de investimentos exigem login e validam valores, modalidade, datas e prazos', async t => {
  const { store } = await fixture(t);
  for (const [method, data] of [['investmentSnapshot', {}], ['saveInvestment', input], ['deleteInvestment', 1], ['redeemInvestment', {}], ['reopenInvestment', 1], ['saveInvestmentSettings', {}], ['simulateInvestment', {}]]) assert.throws(() => store[method](data), /login/);
  login(store);
  for (const data of [{ amount: '-1' }, { rate: 'NaN' }, { rate: '301' }, { startDate: '2025-02-30' }, { startDate: '2190-01-01' }, { maturityDate: '2024-01-01' }, { maturityDate: '2050-01-01' }, { rateType: 'ipca' }, { liquidity: 'unknown' }, { name: '' }]) assert.throws(() => store.saveInvestment({ ...input, ...data }));
  assert.throws(() => store.saveInvestmentSettings({ cdi: 51 }));
  assert.throws(() => store.investmentSnapshot({ months: 121 }));
  assert.throws(() => store.simulateInvestment({ ...input, months: 0, cdi: 10 }));
  assert.equal(store.investmentSnapshot().items.length, 0);
});
test('carteira persiste edição, premissas e backup sem alterar orçamento', async t => {
  const { store, filename, dir } = await fixture(t); login(store);
  const before = store.snapshot('2026-10').totals;
  const id = store.saveInvestment(input);
  store.saveInvestment({ ...input, id, name: 'Casa', amount: '15000,00', rateType: 'fixed', rate: '12' });
  store.saveInvestmentSettings({ cdi: '11,25' });
  const backup = path.join(dir, 'manual.sqlite'); store.backup(backup);
  store.deleteInvestment(id); assert.equal(store.investmentSnapshot().items.length, 0);
  store.restore(backup); store.login({ username: 'teste', password: 'senha-ficticia-123' });
  const reopened = await openStore(filename);
  try {
    reopened.login({ username: 'teste', password: 'senha-ficticia-123' });
    const s = reopened.investmentSnapshot({ months: 24 });
    assert.equal(s.items[0].name, 'Casa'); assert.equal(s.items[0].principal, 1500000);
    assert.equal(s.assumptions.cdi, 11.25); assert.equal(s.assumptions.configured, 1);
    assert.equal(s.curve.length, 25);
    assert.equal(s.scenarios[0].net, s.scenarios[2].net); // Prefixados não seguem o CDI.
    assert.deepEqual(reopened.snapshot('2026-10').totals, before);
  } finally { reopened.close(); }
});
test('resgate total registra valor real, sai das projeções e permite desfazer', async t => {
  const { store } = await fixture(t); login(store);
  const id = store.saveInvestment(input);
  assert.throws(() => store.redeemInvestment({ id, date: '2024-12-31', amount: '1' }), /Data/);
  store.redeemInvestment({ id, date: '2025-12-01', amount: '10900,00' });
  assert.equal(store.investmentSnapshot().totals.principal, 0);
  assert.equal(store.investmentSnapshot().curve.at(-1).net, 0);
  assert.equal(store.investmentSnapshot().redeemedNet, 1090000);
  assert.throws(() => store.saveInvestment({ ...input, id }), /Reabra/);
  assert.throws(() => store.redeemInvestment({ id, date: '2025-12-02', amount: '1' }), /já/);
  store.reopenInvestment(id);
  assert.equal(store.investmentSnapshot().totals.principal, 1000000);
  const locked = store.saveInvestment({ ...input, liquidity: 'maturity' });
  assert.throws(() => store.redeemInvestment({ id: locked, date: '2025-12-01', amount: '11000' }), /vencimento/);
});
test('simulador tributa cada aporte separadamente e inclui aporte final sem juros', async t => {
  const { store } = await fixture(t); login(store);
  const simulated = store.simulateInvestment({ amount: '10000', monthly: '500', months: 12, rateType: 'fixed', rate: 12, cdi: 10, startDate: '2025-01-01' });
  assert.equal(simulated.result.principal, 1600000);
  const lots = [base, ...Array.from({ length: 12 }, (_, i) => ({ ...base, principal: 50000, startDate: addMonths(base.startDate, i + 1) }))];
  assert.equal(simulated.result.net, lots.reduce((sum, item) => sum + estimateCdb(item, '2026-01-01', 10).net, 0));
  assert.equal(estimateCdb(lots.at(-1), '2026-01-01', 10).net, 50000);
  const zero = store.simulateInvestment({ amount: '100', monthly: '50', months: 120, rateType: 'cdi', rate: 100, cdi: 0 });
  assert.equal(zero.result.net, 610000);
  assert.equal(store.investmentSnapshot().items.length, 0); // Simulação não cadastra aplicações.
});
test('migração 5 para 8 preserva registros e cria backup integral antes de adicionar carteira', async t => {
  const { store, filename, dir } = await fixture(t); login(store);
  const categoryId = store.snapshot('2026-10').categories.find(c => c.type === 'expense').id;
  store.saveEntry({ type: 'expense', description: 'Preservar', amount: '123,45', dueDate: '2026-10-10', categoryId });
  const SQL = await require('sql.js')(); const db = new SQL.Database(fs.readFileSync(filename));
  db.run('DROP TABLE invoice_credits; ALTER TABLE planned_expense_budgets DROP COLUMN realized_entry_id; DROP TABLE investments; DROP TABLE investment_settings; PRAGMA user_version=5');
  const original = Buffer.from(db.export()); db.close(); fs.writeFileSync(filename, original);
  const upgraded = await openStore(filename);
  try {
    upgraded.login({ username: 'teste', password: 'senha-ficticia-123' });
    assert.equal(upgraded.snapshot('2026-10').totals.expense, 12345);
    assert.equal(upgraded.investmentSnapshot().items.length, 0);
    const safety = fs.readdirSync(path.join(dir, 'backups')).find(file => file.startsWith('antes-atualizacao-v5-'));
    assert.ok(safety); assert.deepEqual(fs.readFileSync(path.join(dir, 'backups', safety)), original);
    const check = new SQL.Database(fs.readFileSync(filename));
    assert.equal(check.exec('PRAGMA user_version')[0].values[0][0], 8);
    assert.equal(check.exec('PRAGMA integrity_check')[0].values[0][0], 'ok');
    assert.equal(check.exec('PRAGMA foreign_key_check').length, 0); check.close();
  } finally { upgraded.close(); }
});
