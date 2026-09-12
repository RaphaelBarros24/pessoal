const fs = require('node:fs');
const crypto = require('node:crypto');
const initSqlJs = require('sql.js');

// Banco fictício no formato publicado na versão 0.1.0; não contém dados reais.
async function createLegacy(filename) {
  const SQL = await initSqlJs();
  const db = new SQL.Database();
  db.run(`CREATE TABLE users(id INTEGER PRIMARY KEY,name TEXT NOT NULL,username TEXT NOT NULL UNIQUE,salt TEXT NOT NULL,hash TEXT NOT NULL,recovery_salt TEXT NOT NULL,recovery_hash TEXT NOT NULL);
    CREATE TABLE categories(id INTEGER PRIMARY KEY,name TEXT NOT NULL,type TEXT NOT NULL CHECK(type IN ('expense','income')),UNIQUE(name,type));
    CREATE TABLE entries(id INTEGER PRIMARY KEY,type TEXT NOT NULL CHECK(type IN ('expense','income')),description TEXT NOT NULL,amount INTEGER NOT NULL CHECK(amount>0),due_date TEXT NOT NULL,paid_date TEXT,category_id INTEGER NOT NULL REFERENCES categories(id),user_id INTEGER NOT NULL REFERENCES users(id),notes TEXT NOT NULL DEFAULT '');
    CREATE TABLE budgets(month TEXT NOT NULL,category_id INTEGER NOT NULL REFERENCES categories(id),amount INTEGER NOT NULL CHECK(amount>0),PRIMARY KEY(month,category_id));
    PRAGMA user_version=1;`);
  const salt = '0123456789abcdef';
  const hash = crypto.scryptSync('senha-antiga-123', salt, 64).toString('hex');
  const recovery = crypto.scryptSync('codigo-antigo', salt, 64).toString('hex');
  db.run('INSERT INTO users VALUES(?,?,?,?,?,?,?)', [7, 'Ana antiga', 'ana', salt, hash, salt, recovery]);
  db.run("INSERT INTO categories VALUES(9,'Alimentação','expense'); INSERT INTO categories VALUES(10,'Salário','income'); INSERT INTO entries VALUES(42,'expense','Mercado antigo',12345,'2026-09-15','2026-09-16',9,7,'Não apagar'); INSERT INTO entries VALUES(43,'income','Salário antigo',300000,'2026-09-01',NULL,10,7,''); INSERT INTO budgets VALUES('2026-09',9,20000);");
  fs.writeFileSync(filename, Buffer.from(db.export())); db.close();
}
module.exports = { createLegacy };
