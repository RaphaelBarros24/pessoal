// CDB estimates, deliberately independent of the household budget.
const DAY = 86400000;
const IOF = [100, 96, 93, 90, 86, 83, 80, 76, 73, 70, 66, 63, 60, 56, 53, 50, 46, 43, 40, 36, 33, 30, 26, 23, 20, 16, 13, 10, 6, 3, 0];
const today = () => new Date().toLocaleDateString('sv-SE');
const daysBetween = (a, b) => Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / DAY);
const irRate = days => days <= 180 ? 22.5 : days <= 360 ? 20 : days <= 720 ? 17.5 : 15;
function addMonths(date, months) {
  const d = new Date(`${date.slice(0, 7)}-01T00:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() + months);
  const last = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  d.setUTCDate(Math.min(Number(date.slice(8)), last));
  return d.toISOString().slice(0, 10);
}
function percentage(value, max, label) {
  const raw = String(value ?? '').trim().replace(',', '.');
  if (!/^\d{1,3}(\.\d{1,4})?$/.test(raw) || Number(raw) > max) throw new Error(`${label}: informe um percentual entre 0 e ${max}.`);
  return Number(raw);
}
function horizon(value) {
  const n = Number(value);
  if (!Number.isInteger(n) || n < 1 || n > 120) throw new Error('Prazo: informe de 1 a 120 meses.');
  return n;
}
function estimateCdb(item, target, cdi) {
  const effectiveDate = target > item.maturityDate ? item.maturityDate : target;
  const days = Math.max(0, daysBetween(item.startDate, effectiveDate));
  // 252 business days/year, approximated proportionally to elapsed calendar days.
  // No historical DI series or holiday calendar is implied by this estimate.
  const daily = item.rateType === 'cdi' ? Math.expm1(Math.log1p(cdi / 100) / 252) * item.rate / 100 : Math.expm1(Math.log1p(item.rate / 100) / 252);
  const gross = Math.round(item.principal * Math.exp(Math.log1p(daily) * days * 252 / 365));
  if (!Number.isSafeInteger(gross)) throw new Error('Projeção excede o limite de cálculo. Reduza valor, taxa ou prazo.');
  const earnings = Math.max(0, gross - item.principal);
  const iofRate = days < 30 ? IOF[days] : 0;
  const iof = Math.round(earnings * iofRate / 100);
  const rate = irRate(days);
  const ir = Math.round((earnings - iof) * rate / 100);
  return { date: effectiveDate, days, principal: item.principal, gross, earnings, iof, ir, irRate: rate, iofRate, net: gross - iof - ir, netEarnings: earnings - iof - ir };
}
function totalEstimates(items, at, cdi) {
  const total = { principal: 0, gross: 0, net: 0, ir: 0, iof: 0, netEarnings: 0 };
  for (const item of items) {
    if (item.startDate > at) continue;
    const result = estimateCdb(item, at, cdi);
    for (const key of Object.keys(total)) total[key] += result[key];
  }
  for (const value of Object.values(total)) if (!Number.isSafeInteger(value)) throw new Error('Total excede o limite de cálculo.');
  return total;
}
function createInvestmentService({ rows, run, atomic, auth, money, date, id, text }) {
  const columns = 'id,name,issuer,goal,principal,rate_type AS rateType,rate,start_date AS startDate,maturity_date AS maturityDate,liquidity,notes,redeemed_date AS redeemedDate,redeemed_net AS redeemedNet';
  const list = () => rows(`SELECT ${columns} FROM investments ORDER BY maturity_date,id`);
  const settings = () => rows('SELECT cdi,configured FROM investment_settings WHERE id=1')[0];
  const get = value => { const item = list().find(item => item.id === id(value)); if (!item) throw new Error('Investimento não encontrado.'); return item; };
  return {
    saveInvestment(input) {
      auth();
      const item = { name: text(input.name, 'Nome', 80), issuer: text(input.issuer, 'Banco emissor', 80), goal: String(input.goal || '').trim().slice(0, 100), principal: money(input.amount), rateType: input.rateType, rate: percentage(input.rate, input.rateType === 'cdi' ? 300 : 50, 'Taxa'), startDate: date(input.startDate), maturityDate: date(input.maturityDate), liquidity: input.liquidity, notes: String(input.notes || '').slice(0, 1000) };
      if (!['cdi', 'fixed'].includes(item.rateType)) throw new Error('Escolha percentual do CDI ou prefixado.');
      if (!['daily', 'maturity'].includes(item.liquidity)) throw new Error('Liquidez inválida.');
      if (item.startDate > today()) throw new Error('Aplicações futuras devem ser avaliadas no simulador.');
      if (item.maturityDate <= item.startDate || daysBetween(item.startDate, item.maturityDate) > 7305) throw new Error('O vencimento deve ser posterior à aplicação e no máximo 20 anos depois.');
      const existing = input.id ? get(input.id) : null;
      if (existing?.redeemedDate) throw new Error('Reabra o investimento antes de editar o cadastro.');
      estimateCdb(item, item.maturityDate, Math.min(50, settings().cdi + 2));
      const values = [item.name, item.issuer, item.goal, item.principal, item.rateType, item.rate, item.startDate, item.maturityDate, item.liquidity, item.notes];
      return atomic(() => {
        if (existing) { run('UPDATE investments SET name=?,issuer=?,goal=?,principal=?,rate_type=?,rate=?,start_date=?,maturity_date=?,liquidity=?,notes=? WHERE id=?', [...values, existing.id]); return existing.id; }
        run('INSERT INTO investments(name,issuer,goal,principal,rate_type,rate,start_date,maturity_date,liquidity,notes) VALUES(?,?,?,?,?,?,?,?,?,?)', values);
        return rows('SELECT last_insert_rowid() AS id')[0].id;
      });
    },
    deleteInvestment(value) { auth(); const item = get(value); atomic(() => run('DELETE FROM investments WHERE id=?', [item.id])); },
    redeemInvestment(input) {
      auth(); const item = get(input.id);
      if (item.redeemedDate) throw new Error('Este investimento já foi resgatado.');
      const redeemedDate = date(input.date), net = money(input.amount);
      if (redeemedDate < item.startDate || redeemedDate > today()) throw new Error('Data de resgate deve estar entre a aplicação e hoje.');
      if (item.liquidity === 'maturity' && redeemedDate < item.maturityDate) throw new Error('Este CDB só permite resgate no vencimento.');
      atomic(() => run('UPDATE investments SET redeemed_date=?,redeemed_net=? WHERE id=?', [redeemedDate, net, item.id]));
    },
    reopenInvestment(value) { auth(); const item = get(value); atomic(() => run('UPDATE investments SET redeemed_date=NULL,redeemed_net=NULL WHERE id=?', [item.id])); },
    saveInvestmentSettings(input) {
      auth(); const cdi = percentage(input.cdi, 50, 'CDI anual');
      for (const item of list()) estimateCdb(item, item.maturityDate, Math.min(50, cdi + 2));
      atomic(() => run('UPDATE investment_settings SET cdi=?,configured=1 WHERE id=1', [cdi]));
    },
    investmentSnapshot(input = {}) {
      auth(); const asOf = today(), months = horizon(input.months ?? 12), assumptions = settings();
      const all = list(), active = all.filter(item => !item.redeemedDate);
      const items = all.map(item => ({ ...item, current: estimateCdb(item, item.redeemedDate || asOf, assumptions.cdi), maturity: estimateCdb(item, item.maturityDate, assumptions.cdi), daysToMaturity: daysBetween(asOf, item.maturityDate) }));
      const curve = Array.from({ length: months + 1 }, (_, i) => { const at = addMonths(asOf, i); return { date: at, ...totalEstimates(active, at, assumptions.cdi) }; });
      const target = addMonths(asOf, months);
      const scenarios = [Math.max(0, assumptions.cdi - 2), assumptions.cdi, Math.min(50, assumptions.cdi + 2)].map(cdi => ({ cdi, ...totalEstimates(active, target, cdi) }));
      return { asOf, months, assumptions, items, curve, scenarios, totals: totalEstimates(active, asOf, assumptions.cdi), redeemedNet: all.filter(item => item.redeemedDate).reduce((sum, item) => sum + item.redeemedNet, 0) };
    },
    simulateInvestment(input) {
      auth(); const start = date(input.startDate || today()), months = horizon(input.months);
      const principal = money(input.amount);
      const monthly = String(input.monthly ?? '').trim();
      const contribution = !monthly || /^0([.,]0{1,2})?$/.test(monthly) ? 0 : money(monthly);
      const rateType = input.rateType;
      if (!['cdi', 'fixed'].includes(rateType)) throw new Error('Modalidade inválida.');
      const rate = percentage(input.rate, rateType === 'cdi' ? 300 : 50, 'Taxa');
      const cdi = percentage(input.cdi, 50, 'CDI anual');
      const maturityDate = date(addMonths(start, months));
      const lots = [{ principal, rateType, rate, startDate: start, maturityDate }];
      const curve = [{ date: start, ...totalEstimates(lots, start, cdi) }];
      for (let i = 1; i <= months; i++) {
        const at = addMonths(start, i);
        if (contribution) lots.push({ principal: contribution, rateType, rate, startDate: at, maturityDate });
        curve.push({ date: at, ...totalEstimates(lots, at, cdi) });
      }
      return { curve, result: curve.at(-1), cdi, months };
    }
  };
}
module.exports = { createInvestmentService, estimateCdb, irRate, daysBetween, addMonths };
