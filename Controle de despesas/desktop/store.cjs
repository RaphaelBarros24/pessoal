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

async function openStore(filename) {
  const SQL = await initSqlJs({ locateFile: file => require.resolve(`sql.js/dist/${file}`) });
  fs.mkdirSync(path.dirname(filename), { recursive: true });
  let db = new SQL.Database(fs.existsSync(filename) ? fs.readFileSync(filename) : undefined);
  db.run(`PRAGMA foreign_keys=ON;
    CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY, name TEXT NOT NULL, username TEXT NOT NULL UNIQUE, salt TEXT NOT NULL, hash TEXT NOT NULL, recovery_salt TEXT NOT NULL, recovery_hash TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS categories(id INTEGER PRIMARY KEY, name TEXT NOT NULL, type TEXT NOT NULL CHECK(type IN ('expense','income')), UNIQUE(name,type));
    CREATE TABLE IF NOT EXISTS entries(id INTEGER PRIMARY KEY, type TEXT NOT NULL CHECK(type IN ('expense','income')), description TEXT NOT NULL, amount INTEGER NOT NULL CHECK(amount>0), due_date TEXT NOT NULL, paid_date TEXT, category_id INTEGER NOT NULL REFERENCES categories(id), user_id INTEGER NOT NULL REFERENCES users(id), notes TEXT NOT NULL DEFAULT '');
    CREATE TABLE IF NOT EXISTS budgets(month TEXT NOT NULL,category_id INTEGER NOT NULL REFERENCES categories(id),amount INTEGER NOT NULL CHECK(amount>0),PRIMARY KEY(month,category_id));
    PRAGMA user_version=1;`);
  let user = null;
  function rows(sql, params = []) {
    const stmt = db.prepare(sql);
    try { stmt.bind(params); const result = []; while (stmt.step()) result.push(stmt.getAsObject()); return result; }
    finally { stmt.free(); }
  }
  function persist() {
    const temp = `${filename}.tmp`;
    fs.writeFileSync(temp, Buffer.from(db.export()), { mode: 0o600 });
    fs.renameSync(temp, filename);
    automaticBackup(true);
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
  if (!rows('SELECT id FROM categories LIMIT 1').length) {
    for (const name of ['Alimentação', 'Moradia', 'Transporte', 'Saúde', 'Educação', 'Lazer', 'Outros']) db.run('INSERT INTO categories(name,type) VALUES(?,?)', [name, 'expense']);
    for (const name of ['Salário', 'Renda extra', 'Outras receitas']) db.run('INSERT INTO categories(name,type) VALUES(?,?)', [name, 'income']);
  }
  persist();
  automaticBackup();
  return {
    status() { return { hasUsers: rows('SELECT id FROM users LIMIT 1').length > 0, user }; },
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
      const params = [type, text(input.description, 'Descrição'), money(input.amount), date(input.dueDate), input.paidDate ? date(input.paidDate) : null, categoryId, typeof input.notes === 'string' ? input.notes.slice(0, 2000) : ''];
      let entryId;
      if (input.id) {
        entryId = id(input.id);
        if (!rows('SELECT id FROM entries WHERE id=?', [entryId]).length) throw new Error('Lançamento não encontrado.');
        db.run('UPDATE entries SET type=?,description=?,amount=?,due_date=?,paid_date=?,category_id=?,notes=? WHERE id=?', [...params, entryId]);
      } else {
        db.run('INSERT INTO entries(type,description,amount,due_date,paid_date,category_id,notes,user_id) VALUES(?,?,?,?,?,?,?,?)', [...params, user.id]);
        entryId = rows('SELECT last_insert_rowid() AS id')[0].id;
      }
      persist(); return entryId;
    },
    deleteEntry(entryId) { auth(); db.run('DELETE FROM entries WHERE id=?', [id(entryId)]); persist(); },
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
        if (candidate.exec('PRAGMA integrity_check')[0]?.values[0][0] !== 'ok') throw new Error();
        if (candidate.exec('PRAGMA user_version')[0]?.values[0][0] !== 1) throw new Error();
        for (const query of ['SELECT id,name,username,salt,hash,recovery_salt,recovery_hash FROM users', 'SELECT id,name,type FROM categories', 'SELECT id,type,description,amount,due_date,paid_date,category_id,user_id,notes FROM entries', 'SELECT month,category_id,amount FROM budgets']) candidate.exec(query);
        if (candidate.exec('PRAGMA foreign_key_check').length) throw new Error();
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
      const entries = rows(`SELECT e.id,e.type,e.description,e.amount,e.due_date AS dueDate,e.paid_date AS paidDate,e.category_id AS categoryId,e.notes,c.name AS category,u.name AS author FROM entries e JOIN categories c ON c.id=e.category_id JOIN users u ON u.id=e.user_id WHERE substr(e.due_date,1,7)=? ORDER BY e.due_date DESC,e.id DESC`, [selectedMonth]);
      const income = entries.filter(e => e.type === 'income').reduce((sum, e) => sum + e.amount, 0);
      const expense = entries.filter(e => e.type === 'expense').reduce((sum, e) => sum + e.amount, 0);
      const budgets = rows('SELECT b.category_id AS categoryId,c.name AS category,b.amount AS "limit" FROM budgets b JOIN categories c ON c.id=b.category_id WHERE b.month=? ORDER BY c.name', [selectedMonth]).map(b => ({ ...b, spent: entries.filter(e => e.type === 'expense' && e.categoryId === b.categoryId).reduce((sum, e) => sum + e.amount, 0) }));
      const format = cents => (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
      const suggestions = budgets.filter(b => b.spent > b.limit).map(b => `${b.category}: gastos ${format(b.spent - b.limit)} acima do limite. Revise os próximos gastos ou ajuste o orçamento.`);
      if (expense > income) suggestions.push(`Despesas superam as receitas previstas em ${format(expense - income)}. Revise gastos e receitas do mês.`);
      if (!budgets.length) suggestions.push('Defina limites por categoria para acompanhar o orçamento familiar.');
      const history = [];
      for (let offset = 5; offset >= 0; offset--) {
        const d = new Date(`${selectedMonth}-01T12:00:00Z`); d.setUTCMonth(d.getUTCMonth() - offset);
        const m = d.toISOString().slice(0, 7);
        const sums = rows('SELECT type,SUM(amount) AS total FROM entries WHERE substr(due_date,1,7)=? GROUP BY type', [m]);
        history.push({ month: m, income: sums.find(s => s.type === 'income')?.total || 0, expense: sums.find(s => s.type === 'expense')?.total || 0 });
      }
      const prior = history[4];
      if (prior.expense && expense > prior.expense * 1.2) suggestions.push('As despesas previstas cresceram mais de 20% em relação ao mês anterior. Compare as categorias antes de reduzir gastos.');
      if (!suggestions.length) suggestions.push('Os limites cadastrados estão sob controle. Continue acompanhando os gastos e mantenha uma reserva para imprevistos.');
      automaticBackup();
      return { user, categories, entries, totals: { income, expense, balance: income - expense, pending: entries.filter(e => e.type === 'expense' && !e.paidDate).reduce((sum, e) => sum + e.amount, 0) }, budgets, history, suggestions, users: rows('SELECT id,name,username FROM users ORDER BY name') };
    },
    close() { db.close(); }
  };
}
module.exports = { openStore };
