const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const initSqlJs = require('sql.js');

function text(value, label, max = 120) {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > max) throw new Error(`${label} inválido.`);
  return value.trim();
}
function secret(value) {
  if (typeof value !== 'string' || value.length < 10 || value.length > 256) throw new Error('A senha deve ter de 10 a 256 caracteres.');
  return value;
}
function digest(value, salt) { return crypto.scryptSync(value, salt, 64).toString('hex'); }
function matches(value, salt, hash) {
  const a = Buffer.from(digest(value, salt), 'hex');
  const b = Buffer.from(hash, 'hex');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
function money(value) {
  const raw = String(value ?? '').trim();
  if (!/^\d{1,9}([.,]\d{1,2})?$/.test(raw)) throw new Error('Valor inválido. Use um valor positivo com até duas casas decimais, sem separador de milhar.');
  const [whole, decimal = ''] = raw.replace(',', '.').split('.');
  const cents = Number(whole) * 100 + Number(decimal.padEnd(2, '0'));
  if (cents <= 0) throw new Error('O valor deve ser maior que zero.');
  return cents;
}
function date(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) || value < '1900-01-01' || value > '2199-12-31') throw new Error('Data inválida.');
  const parsed = new Date(`${value}T12:00:00Z`);
  if (isNaN(parsed) || parsed.toISOString().slice(0, 10) !== value) throw new Error('Data inválida.');
  return value;
}
function month(value) { date(`${value}-01`); return value; }
function id(value) { const n = Number(value); if (!Number.isSafeInteger(n) || n < 1) throw new Error('Identificador inválido.'); return n; }
const paymentLabels = { unspecified: 'Não informado', pix: 'Pix', cash: 'Dinheiro', debit_card: 'Cartão de débito', credit_card: 'Cartão de crédito', bank_transfer: 'Transferência', boleto: 'Boleto', other: 'Outro' };
function plusMonths(anchor, count, day) {
  const d = new Date(`${anchor.slice(0, 7)}-01T12:00:00Z`); d.setUTCMonth(d.getUTCMonth() + count);
  const last = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  return date(`${d.toISOString().slice(0, 7)}-${String(Math.min(day ?? Number(anchor.slice(8)), last)).padStart(2, '0')}`);
}
function invoiceDate(purchase, card) {
  let closing = plusMonths(purchase, 0, card.closing_day);
  if (purchase >= closing) closing = plusMonths(purchase, 1, card.closing_day);
  let due = plusMonths(closing, 0, card.due_day);
  if (due <= closing) due = plusMonths(closing, 1, card.due_day);
  return due;
}

function schemaVersion(database) { return database.exec('PRAGMA user_version')[0].values[0][0]; }
function validateSchema(database) {
  const version = schemaVersion(database);
  if (![1, 2].includes(version)) throw new Error('Versão do banco incompatível. O arquivo original foi preservado.');
  for (const query of ['SELECT id,name,username,salt,hash,recovery_salt,recovery_hash FROM users', 'SELECT id,name,type FROM categories', 'SELECT id,type,description,amount,due_date,paid_date,category_id,user_id,notes FROM entries', 'SELECT month,category_id,amount FROM budgets']) database.exec(query);
  if (version === 2) {
    database.exec('SELECT payment_method,installment_group,installment_number,installment_count,budget_month,purchase_date,card_id FROM entries');
    database.exec('SELECT id,name,closing_day,due_day,closing_inclusive FROM cards');
  }
  if (database.exec('PRAGMA integrity_check')[0]?.values[0][0] !== 'ok' || database.exec('PRAGMA foreign_key_check').length) throw new Error('Banco inválido. O arquivo original foi preservado.');
}
function migrate(database) {
  validateSchema(database);
  if (schemaVersion(database) === 2) return;
  database.run('BEGIN');
  try {
    database.run(`CREATE TABLE cards(id INTEGER PRIMARY KEY,name TEXT NOT NULL UNIQUE,closing_day INTEGER NOT NULL CHECK(closing_day BETWEEN 1 AND 31),due_day INTEGER NOT NULL CHECK(due_day BETWEEN 1 AND 31),closing_inclusive INTEGER NOT NULL DEFAULT 0);
      ALTER TABLE entries ADD COLUMN payment_method TEXT NOT NULL DEFAULT 'unspecified';
      ALTER TABLE entries ADD COLUMN installment_group TEXT;
      ALTER TABLE entries ADD COLUMN installment_number INTEGER NOT NULL DEFAULT 1;
      ALTER TABLE entries ADD COLUMN installment_count INTEGER NOT NULL DEFAULT 1;
      ALTER TABLE entries ADD COLUMN budget_month TEXT;
      ALTER TABLE entries ADD COLUMN purchase_date TEXT;
      ALTER TABLE entries ADD COLUMN card_id INTEGER REFERENCES cards(id);
      PRAGMA user_version=2;`);
    database.run('COMMIT');
  } catch (error) { database.run('ROLLBACK'); throw error; }
}

async function openStore(filename) {
  const SQL = await initSqlJs({ locateFile: file => require.resolve(`sql.js/dist/${file}`) });
  fs.mkdirSync(path.dirname(filename), { recursive: true });
  const existed = fs.existsSync(filename);
  let db = new SQL.Database(existed ? fs.readFileSync(filename) : undefined);
  try {
    if (existed) {
      validateSchema(db);
      if (schemaVersion(db) === 1) {
        const backups = path.join(path.dirname(filename), 'backups'); fs.mkdirSync(backups, { recursive: true });
        fs.copyFileSync(filename, path.join(backups, `antes-atualizacao-v1-${Date.now()}-${crypto.randomBytes(4).toString('hex')}.sqlite`));
      }
    } else db.run(`
    CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY, name TEXT NOT NULL, username TEXT NOT NULL UNIQUE, salt TEXT NOT NULL, hash TEXT NOT NULL, recovery_salt TEXT NOT NULL, recovery_hash TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS categories(id INTEGER PRIMARY KEY, name TEXT NOT NULL, type TEXT NOT NULL CHECK(type IN ('expense','income')), UNIQUE(name,type));
    CREATE TABLE IF NOT EXISTS entries(id INTEGER PRIMARY KEY, type TEXT NOT NULL CHECK(type IN ('expense','income')), description TEXT NOT NULL, amount INTEGER NOT NULL CHECK(amount>0), due_date TEXT NOT NULL, paid_date TEXT, category_id INTEGER NOT NULL REFERENCES categories(id), user_id INTEGER NOT NULL REFERENCES users(id), notes TEXT NOT NULL DEFAULT '');
    CREATE TABLE IF NOT EXISTS budgets(month TEXT NOT NULL,category_id INTEGER NOT NULL REFERENCES categories(id),amount INTEGER NOT NULL CHECK(amount>0),PRIMARY KEY(month,category_id));
    PRAGMA user_version=1;`);
    migrate(db); db.run('PRAGMA foreign_keys=ON');
  } catch (error) { db.close(); throw error; }
  let user = null, backupWarning = null;
  function rows(sql, params = []) {
    const stmt = db.prepare(sql);
    try { stmt.bind(params); const result = []; while (stmt.step()) result.push(stmt.getAsObject()); return result; }
    finally { stmt.free(); }
  }
  function persist() {
    const temp = `${filename}.tmp`;
    fs.writeFileSync(temp, Buffer.from(db.export()), { mode: 0o600 });
    fs.renameSync(temp, filename);
    try { automaticBackup(true); backupWarning = null; }
    catch { backupWarning = 'O lançamento foi salvo, mas o backup automático falhou. Verifique o espaço e as permissões da pasta de dados e faça um backup manual.'; }
  }
  function atomic(operation) {
    const before = db.export();
    db.run('BEGIN');
    try { const result = operation(); db.run('COMMIT'); persist(); return result; }
    catch (error) { db.close(); db = new SQL.Database(before); db.run('PRAGMA foreign_keys=ON'); throw error; }
  }
  function automaticBackup(force = false) {
    const directory = path.join(path.dirname(filename), 'backups');
    fs.mkdirSync(directory, { recursive: true });
    const day = new Date().toLocaleDateString('sv-SE');
    const target = path.join(directory, `${day}.sqlite`);
    if (force || !fs.existsSync(target)) {
      fs.copyFileSync(filename, `${target}.tmp`);
      fs.renameSync(`${target}.tmp`, target);
    }
    const files = fs.readdirSync(directory).filter(f => /^\d{4}-\d{2}-\d{2}\.sqlite$/.test(f)).sort();
    for (const file of files.slice(0, Math.max(0, files.length - 30))) fs.unlinkSync(path.join(directory, file));
  }
  function auth() { if (!user) throw new Error('Faça login para continuar.'); return user; }
  function publicUser(row) { return { id: row.id, name: row.name, username: row.username }; }
  const entrySelect = `SELECT e.id,e.type,e.description,e.amount,e.due_date AS dueDate,e.paid_date AS paidDate,e.category_id AS categoryId,e.notes,e.payment_method AS paymentMethod,e.installment_group AS installmentGroup,e.installment_number AS installmentNumber,e.installment_count AS installmentCount,COALESCE(e.budget_month,substr(e.due_date,1,7)) AS budgetMonth,e.purchase_date AS purchaseDate,e.card_id AS cardId,c.name AS category,u.name AS author,card.name AS cardName FROM entries e JOIN categories c ON c.id=e.category_id JOIN users u ON u.id=e.user_id LEFT JOIN cards card ON card.id=e.card_id`;
  function invoicesFor(selectedMonth) {
    const items = rows(`${entrySelect} WHERE e.payment_method='credit_card' AND substr(e.due_date,1,7)=? ORDER BY e.due_date,e.id`, [selectedMonth]);
    const invoices = [];
    for (const cardId of [...new Set(items.map(e => e.cardId))]) {
      const entries = items.filter(e => e.cardId === cardId);
      const amount = entries.reduce((sum, e) => sum + e.amount, 0);
      const outstanding = entries.filter(e => !e.paidDate).reduce((sum, e) => sum + e.amount, 0);
      invoices.push({ id: `invoice:${cardId}:${selectedMonth}`, kind: 'invoice', type: 'expense', description: `Fatura ${entries[0].cardName}`, category: 'Cartão de crédito', categoryId: null, cardId, cardName: entries[0].cardName, amount, outstanding, paidAmount: amount - outstanding, dueDate: entries[0].dueDate, paidDate: outstanding ? null : entries.map(e => e.paidDate).sort().at(-1), author: 'Fatura acumulada', notes: 'Pagamento previsto; os gastos já consomem o orçamento nas parcelas correspondentes.', paymentMethod: 'credit_card', invoiceMonth: selectedMonth, entries });
    }
    return invoices;
  }
  if (!rows('SELECT id FROM categories LIMIT 1').length) {
    for (const name of ['Alimentação', 'Moradia', 'Transporte', 'Saúde', 'Educação', 'Lazer', 'Outros']) db.run('INSERT INTO categories(name,type) VALUES(?,?)', [name, 'expense']);
    for (const name of ['Salário', 'Renda extra', 'Outras receitas']) db.run('INSERT INTO categories(name,type) VALUES(?,?)', [name, 'income']);
  }
  persist();
  return {
    status() { return { hasUsers: rows('SELECT id FROM users LIMIT 1').length > 0, user, backupWarning }; },
    register(input) {
      if (rows('SELECT id FROM users LIMIT 1').length) auth();
      const name = text(input.name, 'Nome');
      const username = text(input.username, 'Usuário', 40).toLowerCase();
      if (!/^[a-z0-9._-]{3,40}$/.test(username)) throw new Error('Usuário: use 3 a 40 letras sem acentos, números, ponto, hífen ou sublinhado.');
      if (rows('SELECT id FROM users WHERE username=?', [username]).length) throw new Error('Esse usuário já existe.');
      const password = secret(input.password);
      const salt = crypto.randomBytes(16).toString('hex');
      const recoverySalt = crypto.randomBytes(16).toString('hex');
      const recoveryCode = crypto.randomBytes(18).toString('hex');
      db.run('INSERT INTO users(name,username,salt,hash,recovery_salt,recovery_hash) VALUES(?,?,?,?,?,?)', [name, username, salt, digest(password, salt), recoverySalt, digest(recoveryCode, recoverySalt)]);
      persist();
      const created = publicUser(rows('SELECT * FROM users WHERE username=?', [username])[0]);
      if (!user) user = created;
      return { user: created, recoveryCode };
    },
    login(input) {
      const username = text(input.username, 'Usuário', 40).toLowerCase();
      const password = typeof input.password === 'string' && input.password.length <= 256 ? input.password : '';
      const row = rows('SELECT * FROM users WHERE username=?', [username])[0];
      if (!row || !matches(password, row.salt, row.hash)) throw new Error('Usuário ou senha inválidos.');
      user = publicUser(row); return user;
    },
    logout() { user = null; },
    recover(input) {
      const username = text(input.username, 'Usuário', 40).toLowerCase();
      const row = rows('SELECT * FROM users WHERE username=?', [username])[0];
      const code = typeof input.code === 'string' && input.code.length <= 100 ? input.code.trim() : '';
      if (!row || !matches(code, row.recovery_salt, row.recovery_hash)) throw new Error('Usuário ou código de recuperação inválidos.');
      const password = secret(input.password);
      const salt = crypto.randomBytes(16).toString('hex');
      const recoverySalt = crypto.randomBytes(16).toString('hex');
      const recoveryCode = crypto.randomBytes(18).toString('hex');
      db.run('UPDATE users SET salt=?,hash=?,recovery_salt=?,recovery_hash=? WHERE id=?', [salt, digest(password, salt), recoverySalt, digest(recoveryCode, recoverySalt), row.id]);
      persist(); user = null; return { recoveryCode };
    },
    saveEntry(input) {
      auth();
      const type = input.type;
      if (!['expense', 'income'].includes(type)) throw new Error('Tipo inválido.');
      const categoryId = id(input.categoryId);
      if (!rows('SELECT id FROM categories WHERE id=? AND type=?', [categoryId, type]).length) throw new Error('Categoria incompatível com o tipo de lançamento.');
      const description = text(input.description, 'Descrição');
      const amount = money(input.amount), dueDate = date(input.dueDate);
      const paidDate = input.paidDate ? date(input.paidDate) : null;
      const notes = typeof input.notes === 'string' ? input.notes.slice(0, 2000) : '';
      if (input.id) {
        const entryId = id(input.id), existing = rows('SELECT * FROM entries WHERE id=?', [entryId])[0];
        if (!existing) throw new Error('Lançamento não encontrado.');
        const method = input.paymentMethod ?? existing.payment_method;
        if (!Object.hasOwn(paymentLabels, method)) throw new Error('Forma de pagamento inválida.');
        let cardId = null, budgetMonth = null, purchaseDate = null, editedDue = dueDate;
        if (method === 'credit_card') {
          if (type !== 'expense') throw new Error('Cartão de crédito é uma forma de pagamento de despesas.');
          cardId = id(input.cardId ?? existing.card_id);
          const card = rows('SELECT * FROM cards WHERE id=?', [cardId])[0];
          if (!card) throw new Error('Cartão não encontrado.');
          purchaseDate = date(input.purchaseDate ?? existing.purchase_date ?? dueDate);
          budgetMonth = month(input.budgetMonth ?? existing.budget_month ?? purchaseDate.slice(0, 7));
          if (existing.payment_method !== 'credit_card') editedDue = invoiceDate(purchaseDate, card);
        }
        return atomic(() => { db.run('UPDATE entries SET type=?,description=?,amount=?,due_date=?,paid_date=?,category_id=?,notes=?,payment_method=?,card_id=?,budget_month=?,purchase_date=? WHERE id=?', [type, description, amount, editedDue, paidDate, categoryId, notes, method, cardId, budgetMonth, purchaseDate, entryId]); return entryId; });
      }
      const method = input.paymentMethod ?? 'unspecified';
      if (!Object.hasOwn(paymentLabels, method)) throw new Error('Forma de pagamento inválida.');
      const count = Number(input.installments ?? 1);
      if (!Number.isInteger(count) || count < 1 || count > 120 || amount < count) throw new Error('Informe de 1 a 120 parcelas, com pelo menos um centavo por parcela.');
      let cardId = null, card = null, purchaseDate = null;
      if (method === 'credit_card') {
        if (type !== 'expense') throw new Error('Cartão de crédito é uma forma de pagamento de despesas.');
        if (paidDate) throw new Error('Registre o pagamento pela fatura do cartão, não pela data da compra.');
        cardId = id(input.cardId); card = rows('SELECT * FROM cards WHERE id=?', [cardId])[0];
        if (!card) throw new Error('Cartão não encontrado.');
        purchaseDate = date(input.purchaseDate ?? dueDate);
      }
      const firstDue = card ? invoiceDate(purchaseDate, card) : dueDate;
      const schedule = Array.from({ length: count }, (_, i) => plusMonths(firstDue, i, card?.due_day));
      const budgetMonths = card ? Array.from({ length: count }, (_, i) => plusMonths(purchaseDate, i).slice(0, 7)) : null;
      const group = count > 1 ? crypto.randomUUID() : null;
      return atomic(() => {
        let first;
        for (let i = 0; i < count; i++) {
          const installmentAmount = Math.floor(amount / count) + (i < amount % count ? 1 : 0);
          db.run('INSERT INTO entries(type,description,amount,due_date,paid_date,category_id,notes,user_id,payment_method,installment_group,installment_number,installment_count,budget_month,purchase_date,card_id) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)', [type, description, installmentAmount, schedule[i], i === 0 ? paidDate : null, categoryId, notes, user.id, method, group, i + 1, count, budgetMonths?.[i] ?? null, purchaseDate, cardId]);
          if (i === 0) first = rows('SELECT last_insert_rowid() AS id')[0].id;
        }
        return first;
      });
    },
    deleteEntry(entryId) { auth(); atomic(() => db.run('DELETE FROM entries WHERE id=?', [id(entryId)])); },
    deleteSeries(group) { auth(); const validGroup = text(group, 'Grupo', 50); atomic(() => db.run('DELETE FROM entries WHERE installment_group=?', [validGroup])); },
    saveCard(input) {
      auth(); const name = text(input.name, 'Nome do cartão', 60);
      const closingDay = Number(input.closingDay), dueDay = Number(input.dueDay);
      if (![closingDay, dueDay].every(n => Number.isInteger(n) && n >= 1 && n <= 31)) throw new Error('Fechamento e vencimento devem ser dias de 1 a 31.');
      if (rows('SELECT id FROM cards WHERE name=? AND id<>?', [name, input.id ? id(input.id) : 0]).length) throw new Error('Já existe um cartão com esse nome.');
      return atomic(() => {
        if (input.id) {
          const cardId = id(input.id); if (!rows('SELECT id FROM cards WHERE id=?', [cardId]).length) throw new Error('Cartão não encontrado.');
          db.run('UPDATE cards SET name=?,closing_day=?,due_day=? WHERE id=?', [name, closingDay, dueDay, cardId]); return cardId;
        }
        db.run('INSERT INTO cards(name,closing_day,due_day) VALUES(?,?,?)', [name, closingDay, dueDay]); return rows('SELECT last_insert_rowid() AS id')[0].id;
      });
    },
    payInvoice(input) {
      auth(); const cardId = id(input.cardId), selectedMonth = month(input.month), paid = input.paidDate ? date(input.paidDate) : null;
      if (!rows("SELECT id FROM entries WHERE card_id=? AND payment_method='credit_card' AND substr(due_date,1,7)=? LIMIT 1", [cardId, selectedMonth]).length) throw new Error('Fatura não encontrada.');
      atomic(() => db.run("UPDATE entries SET paid_date=? WHERE card_id=? AND payment_method='credit_card' AND substr(due_date,1,7)=?", [paid, cardId, selectedMonth]));
    },
    addCategory(input) {
      auth(); if (!['expense', 'income'].includes(input.type)) throw new Error('Tipo inválido.');
      const name = text(input.name, 'Categoria', 60);
      if (rows('SELECT id FROM categories WHERE name=? AND type=?', [name, input.type]).length) throw new Error('Categoria já existente.');
      db.run('INSERT INTO categories(name,type) VALUES(?,?)', [name, input.type]); persist();
    },
    saveBudget(input) {
      auth(); const selectedMonth = month(input.month); const categoryId = id(input.categoryId);
      if (!rows("SELECT id FROM categories WHERE id=? AND type='expense'", [categoryId]).length) throw new Error('Escolha uma categoria de despesa.');
      db.run('INSERT INTO budgets(month,category_id,amount) VALUES(?,?,?) ON CONFLICT(month,category_id) DO UPDATE SET amount=excluded.amount', [selectedMonth, categoryId, money(input.amount)]); persist();
    },
    deleteBudget(input) { auth(); db.run('DELETE FROM budgets WHERE month=? AND category_id=?', [month(input.month), id(input.categoryId)]); persist(); },
    backup(target) { auth(); if (path.resolve(target) === path.resolve(filename)) throw new Error('Escolha outro arquivo para o backup.'); fs.writeFileSync(target, Buffer.from(db.export()), { mode: 0o600 }); },
    restore(source) {
      auth(); let candidate;
      try {
        if (fs.statSync(source).size > 100 * 1024 * 1024) throw new Error();
        candidate = new SQL.Database(fs.readFileSync(source));
        migrate(candidate);
      } catch { candidate?.close(); throw new Error('Backup inválido ou incompatível. O banco atual foi preservado.'); }
      const safety = path.join(path.dirname(filename), 'backups', `antes-restauracao-${Date.now()}.sqlite`);
      fs.writeFileSync(safety, Buffer.from(db.export()), { mode: 0o600 });
      const original = db;
      try { db = candidate; db.run('PRAGMA foreign_keys=ON'); persist(); }
      catch (error) { db = original; candidate.close(); throw error; }
      original.close(); user = null;
    },
    snapshot(selectedMonth) {
      auth(); month(selectedMonth);
      const categories = rows('SELECT * FROM categories ORDER BY type,name');
      const budgetEntries = rows(`${entrySelect} WHERE COALESCE(e.budget_month,substr(e.due_date,1,7))=? ORDER BY e.due_date DESC,e.id DESC`, [selectedMonth]).map(e => ({ ...e, kind: 'entry' }));
      const invoices = invoicesFor(selectedMonth);
      const entries = [...budgetEntries, ...invoices].sort((a, b) => b.dueDate.localeCompare(a.dueDate));
      const income = budgetEntries.filter(e => e.type === 'income').reduce((sum, e) => sum + e.amount, 0);
      const expense = budgetEntries.filter(e => e.type === 'expense').reduce((sum, e) => sum + e.amount, 0);
      const budgets = rows('SELECT b.category_id AS categoryId,c.name AS category,b.amount AS "limit" FROM budgets b JOIN categories c ON c.id=b.category_id WHERE b.month=? ORDER BY c.name', [selectedMonth]).map(b => ({ ...b, spent: budgetEntries.filter(e => e.type === 'expense' && e.categoryId === b.categoryId).reduce((sum, e) => sum + e.amount, 0) }));
      const format = cents => (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
      const suggestions = budgets.filter(b => b.spent > b.limit).map(b => `${b.category}: gastos ${format(b.spent - b.limit)} acima do limite. Revise os próximos gastos ou ajuste o orçamento.`);
      if (expense > income) suggestions.push(`Despesas superam as receitas previstas em ${format(expense - income)}. Revise gastos e receitas do mês.`);
      if (!budgets.length) suggestions.push('Defina limites por categoria para acompanhar o orçamento familiar.');
      const history = [];
      for (let offset = 5; offset >= 0; offset--) {
        const d = new Date(`${selectedMonth}-01T12:00:00Z`); d.setUTCMonth(d.getUTCMonth() - offset);
        const m = d.toISOString().slice(0, 7);
        const sums = rows('SELECT type,SUM(amount) AS total FROM entries WHERE COALESCE(budget_month,substr(due_date,1,7))=? GROUP BY type', [m]);
        history.push({ month: m, income: sums.find(s => s.type === 'income')?.total || 0, expense: sums.find(s => s.type === 'expense')?.total || 0 });
      }
      const prior = history[4];
      if (prior.expense && expense > prior.expense * 1.2) suggestions.push('As despesas previstas cresceram mais de 20% em relação ao mês anterior. Compare as categorias antes de reduzir gastos.');
      if (!suggestions.length) suggestions.push('Os limites cadastrados estão sob controle. Continue acompanhando os gastos e mantenha uma reserva para imprevistos.');
      try { automaticBackup(); } catch { backupWarning = 'O backup automático falhou. Faça um backup manual e verifique a pasta de dados.'; }
      const paymentTotals = Object.entries(paymentLabels).map(([method, label]) => ({ method, label, amount: budgetEntries.filter(e => e.type === 'expense' && e.paymentMethod === method).reduce((sum, e) => sum + e.amount, 0), income: budgetEntries.filter(e => e.type === 'income' && e.paymentMethod === method).reduce((sum, e) => sum + e.amount, 0) }));
      const nextDate = new Date(`${selectedMonth}-01T12:00:00Z`); nextDate.setUTCMonth(nextDate.getUTCMonth() + 1);
      const nextMonth = nextDate.toISOString().slice(0, 7), nextInvoices = invoicesFor(nextMonth);
      const normalExpenses = budgetEntries.filter(e => e.type === 'expense' && e.paymentMethod !== 'credit_card');
      return { user, categories, entries, budgetEntries, invoices, nextInvoices, cards: rows('SELECT id,name,closing_day AS closingDay,due_day AS dueDay FROM cards ORDER BY name'), paymentTotals, backupWarning, totals: { income, expense, balance: income - expense, pending: normalExpenses.filter(e => !e.paidDate).reduce((sum, e) => sum + e.amount, 0) + invoices.reduce((sum, invoice) => sum + invoice.outstanding, 0), cardDue: invoices.reduce((sum, invoice) => sum + invoice.amount, 0), nextCardDue: nextInvoices.reduce((sum, invoice) => sum + invoice.amount, 0), payable: normalExpenses.reduce((sum, e) => sum + e.amount, 0) + invoices.reduce((sum, invoice) => sum + invoice.amount, 0) }, budgets, history, suggestions, users: rows('SELECT id,name,username FROM users ORDER BY name') };
    },
    close() { db.close(); }
  };
}
module.exports = { openStore };
