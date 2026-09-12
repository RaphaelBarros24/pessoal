const { app, BrowserWindow, ipcMain, dialog, session } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const { pathToFileURL } = require('node:url');
const { openStore } = require('./store.cjs');

app.setName('Saldo Familiar');
const smoke = process.argv.includes('--smoke-test');
if (smoke) app.disableHardwareAcceleration();
const testRoot = path.join(process.cwd(), '.local-data');
if (smoke) app.setPath('userData', path.join(testRoot, `smoke-${Date.now()}`));
const ownsLock = app.requestSingleInstanceLock();
if (!ownsLock) app.quit();
let window, store, lastFrame;
const home = pathToFileURL(path.join(__dirname, '../ui/index.html')).href;
const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const brl = value => (value / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const allowed = new Set(['status', 'register', 'login', 'logout', 'recover', 'snapshot', 'saveEntry', 'deleteEntry', 'addCategory', 'saveBudget', 'deleteBudget']);
let failures = 0, blockedUntil = 0;

async function exportReport(input) {
  const snapshot = store.snapshot(input.month);
  if (!['csv', 'pdf'].includes(input.format)) throw new Error('Formato inválido.');
  const result = await dialog.showSaveDialog(window, { defaultPath: `Saldo-Familiar-${input.month}.${input.format}`, filters: [{ name: input.format.toUpperCase(), extensions: [input.format] }] });
  if (result.canceled) return false;
  if (input.format === 'csv') {
    const cell = value => {
      let s = String(value ?? '');
      if (/^[\s]*[=+@-]/.test(s)) s = `'${s}`;
      return `"${s.replaceAll('"', '""')}"`;
    };
    const rows = [['Tipo', 'Descrição', 'Categoria', 'Valor (R$)', 'Vencimento', 'Pagamento', 'Registrado por', 'Observações'], ...snapshot.entries.map(e => [e.type === 'income' ? 'Receita' : 'Despesa', e.description, e.category, (e.amount / 100).toFixed(2).replace('.', ','), e.dueDate, e.paidDate || '', e.author, e.notes])];
    fs.writeFileSync(result.filePath, '\ufeff' + rows.map(row => row.map(cell).join(';')).join('\r\n'), 'utf8');
  } else {
    const report = new BrowserWindow({ show: false, webPreferences: { sandbox: true, contextIsolation: true, nodeIntegration: false } });
    try {
      const html = `<!doctype html><html lang="pt-BR"><meta charset="UTF-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'"><style>body{font:12px Arial;color:#18372c;margin:32px}h1{font-size:26px}table{border-collapse:collapse;width:100%}td,th{padding:8px;text-align:left;border-bottom:1px solid #ddd}thead{display:table-header-group}tr{break-inside:avoid}.totals{padding:16px;background:#eef5ef;margin:20px 0}footer{margin-top:24px;color:#666}</style><h1>Saldo Familiar</h1><p>Relatório mensal — ${escape(input.month)} · Critério: vencimento</p><div class="totals">Receitas: ${brl(snapshot.totals.income)} · Despesas: ${brl(snapshot.totals.expense)} · Saldo previsto: ${brl(snapshot.totals.balance)}</div><table><thead><tr><th>Vencimento</th><th>Descrição / categoria</th><th>Tipo</th><th>Valor</th><th>Pagamento</th></tr></thead><tbody>${snapshot.entries.map(e => `<tr><td>${escape(e.dueDate)}</td><td>${escape(e.description)}<br>${escape(e.category)}</td><td>${e.type === 'income' ? 'Receita' : 'Despesa'}</td><td>${brl(e.amount)}</td><td>${escape(e.paidDate || 'Pendente')}</td></tr>`).join('')}</tbody></table><h2>Orçamento por categoria</h2><table>${snapshot.budgets.map(b => `<tr><td>${escape(b.category)}</td><td>Limite: ${brl(b.limit)}</td><td>Gastos: ${brl(b.spent)}</td></tr>`).join('')}</table><footer>Gerado em ${escape(new Date().toLocaleString('pt-BR'))}. Valores previstos conforme vencimento; não representam necessariamente o saldo bancário.</footer></html>`;
      await report.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
      fs.writeFileSync(result.filePath, await report.webContents.printToPDF({ printBackground: true, pageSize: 'A4' }));
    } finally { report.destroy(); }
  }
  return true;
}

async function createWindow() {
  window = new BrowserWindow({ width: 1360, height: 900, minWidth: 1000, minHeight: 700, show: !smoke, icon: path.join(__dirname, '../ui/icon.png'), backgroundColor: '#f6f8f5', autoHideMenuBar: true, webPreferences: { preload: path.join(__dirname, 'preload.cjs'), contextIsolation: true, nodeIntegration: false, sandbox: true, offscreen: smoke } });
  window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  if (smoke) window.webContents.on('paint', (_event, _dirty, image) => { lastFrame = image; });
  window.webContents.on('will-navigate', (event, url) => { if (url !== home) event.preventDefault(); });
  await window.loadURL(home);
}

if (ownsLock) app.whenReady().then(async () => {
  session.defaultSession.setPermissionRequestHandler((_webContents, _permission, callback) => callback(false));
  store = await openStore(path.join(app.getPath('userData'), 'family.sqlite'));
  if (smoke) {
    dialog.showSaveDialog = async (_parent, options) => ({ canceled: false, filePath: path.join(testRoot, path.basename(options.defaultPath)) });
    dialog.showMessageBox = async () => ({ response: 1 });
    dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [path.join(testRoot, `Saldo-Familiar-backup-${new Date().toISOString().slice(0, 10)}.sqlite`)] });
  }
  ipcMain.handle('family-operation', async (event, operation, input) => {
    try {
      if (event.sender !== window?.webContents || event.senderFrame?.url !== home) throw new Error('Origem inválida.');
      if (typeof operation !== 'string') throw new Error('Operação inválida.');
      if (['login', 'recover'].includes(operation)) {
        if (Date.now() < blockedUntil) throw new Error('Muitas tentativas. Aguarde 30 segundos.');
        try { const value = store[operation](input); failures = 0; return { ok: true, value }; }
        catch (error) { if (++failures >= 5) { blockedUntil = Date.now() + 30000; failures = 0; } throw error; }
      }
      let value;
      if (allowed.has(operation)) value = store[operation](input);
      else if (operation === 'exportReport') value = await exportReport(input);
      else if (operation === 'backup') {
        store.snapshot(input.month);
        const result = await dialog.showSaveDialog(window, { defaultPath: `Saldo-Familiar-backup-${new Date().toISOString().slice(0, 10)}.sqlite`, filters: [{ name: 'Backup SQLite', extensions: ['sqlite'] }] });
        if (!result.canceled) store.backup(result.filePath); value = !result.canceled;
      } else if (operation === 'restore') {
        store.snapshot(input.month);
        const confirmation = await dialog.showMessageBox(window, { type: 'warning', buttons: ['Cancelar', 'Restaurar'], defaultId: 0, cancelId: 0, message: 'Substituir o orçamento atual pelo backup?', detail: 'Uma cópia do banco atual será preservada antes da restauração. Será necessário fazer login novamente.' });
        if (confirmation.response !== 1) return { ok: true, value: false };
        const result = await dialog.showOpenDialog(window, { properties: ['openFile'], filters: [{ name: 'Backup SQLite', extensions: ['sqlite'] }] });
        if (!result.canceled) store.restore(result.filePaths[0]); value = !result.canceled;
      } else throw new Error('Operação inválida.');
      return { ok: true, value };
    } catch (error) { return { ok: false, error: error.message }; }
  });
  await createWindow();
  if (smoke) {
    try {
      await window.webContents.executeJavaScript(`window.smokeTest()`);
      await new Promise(resolve => setTimeout(resolve, 500));
      const image = lastFrame || await window.webContents.capturePage();
      fs.writeFileSync(path.join(testRoot, 'dashboard.png'), image.toPNG());
      console.log('SMOKE_OK'); app.exit(0);
    } catch (error) { console.error(error); app.exit(1); }
  }
}).catch(error => { console.error(error); dialog.showErrorBox('Não foi possível abrir o Saldo Familiar', error.message); app.exit(1); });
app.on('second-instance', () => { if (window) { if (window.isMinimized()) window.restore(); window.show(); window.focus(); } });
app.on('window-all-closed', () => app.quit());
app.on('before-quit', () => store?.close());
