const root = document.querySelector('#app');
const state = { page: 'dashboard', month: new Date().toLocaleDateString('sv-SE').slice(0, 7), snapshot: null, authMode: 'login', search: '', filter: 'all' };
const call = (operation, input) => window.family.call(operation, input);
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const money = value => (value / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const displayDate = date => date ? date.split('-').reverse().join('/') : 'Pendente';
const monthLabel = month => new Date(`${month}-01T12:00:00`).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
const icons = { dashboard: '◫', entries: '↔', budgets: '◎', categories: '▦', reports: '▤', family: '♧' };
function notify(message, error = false) {
  document.querySelector('.toast')?.remove();
  const div = document.createElement('div'); div.className = `toast ${error ? 'error' : ''}`; div.setAttribute('role', error ? 'alert' : 'status'); div.textContent = message; document.body.append(div); setTimeout(() => div.remove(), 6500);
}
async function guarded(fn) { try { await fn(); } catch (error) { notify(error.message, true); } }
function field(label, name, type = 'text', value = '', attrs = '') {
  return `<label>${esc(label)}<input name="${name}" type="${type}" value="${esc(value)}" ${attrs}></label>`;
}
function select(label, name, options) { return `<label>${esc(label)}<select name="${name}">${options}</select></label>`; }
function options(categories, chosen) { return categories.map(c => `<option value="${c.id}" ${c.id === chosen ? 'selected' : ''}>${esc(c.name)}</option>`).join(''); }

async function initialize() {
  const status = await call('status');
  if (status.user) await refresh();
  else { state.authMode = status.hasUsers ? 'login' : 'register'; renderAuth(); }
}
function authFields() {
  if (state.authMode === 'recover') return field('Usuário', 'username', 'text', '', 'required autocomplete="username"') + field('Código de recuperação', 'code', 'text', '', 'required autocomplete="off"') + field('Nova senha', 'password', 'password', '', 'required minlength="10" maxlength="256" autocomplete="new-password"');
  return (state.authMode === 'register' ? field('Seu nome', 'name', 'text', '', 'required maxlength="120" autocomplete="name"') : '') + field('Usuário', 'username', 'text', '', 'required minlength="3" maxlength="40" autocomplete="username"') + field('Senha', 'password', 'password', '', `required ${state.authMode === 'register' ? 'minlength="10"' : ''} maxlength="256" autocomplete="${state.authMode === 'register' ? 'new-password' : 'current-password'}"`);
}
function renderAuth() {
  const register = state.authMode === 'register', recover = state.authMode === 'recover';
  root.innerHTML = `<main class="auth"><section class="auth-story"><div class="brand"><span class="brand-mark">S</span>Saldo Familiar</div><div><span class="eyebrow">MAIS CLAREZA. MAIS TRANQUILIDADE.</span><h1>Um plano para<br>o que importa.</h1><p>Organize as contas da casa, entenda seus gastos e cuide do futuro em família.</p><div class="auth-art"><div class="art-card"><span>Seu próximo passo</span><strong>Equilíbrio financeiro</strong><div class="art-bars"><i></i><i></i><i></i><i></i><i></i></div><small>Uma escolha de cada vez.</small></div><span class="art-circle">↗</span></div></div><small>Seu banco fica nesta máquina. Seu orçamento funciona offline.</small></section><section class="auth-form"><span class="pill">● Aplicativo offline</span><h2>${register ? 'Comece pela sua família' : recover ? 'Recupere seu acesso' : 'Bom ter você por aqui'}</h2><p class="muted">${register ? 'Crie o primeiro usuário. Depois, convide familiares pelo aplicativo.' : recover ? 'Use o código que você guardou ao criar sua conta.' : 'Entre para acompanhar o orçamento compartilhado.'}</p><form id="auth-form">${authFields()}<p class="hint">${register ? 'Escolha uma senha com pelo menos 10 caracteres. O código de recuperação será exibido uma única vez.' : recover ? 'Após redefinir a senha, você receberá um novo código de recuperação.' : 'O login protege o acesso pelo aplicativo; o banco e os backups não são criptografados.'}</p><button class="primary" type="submit">${register ? 'Criar meu acesso' : recover ? 'Redefinir senha' : 'Entrar no orçamento'} <span>→</span></button></form>${register ? '' : `<button class="link" data-action="auth-mode" data-mode="${recover ? 'login' : 'recover'}">${recover ? 'Voltar ao login' : 'Esqueci minha senha'}</button>`}</section></main>`;
  document.querySelector('#auth-form').addEventListener('submit', event => {
    event.preventDefault(); const data = Object.fromEntries(new FormData(event.target));
    const submit = event.target.querySelector('[type="submit"]');
    if (submit.disabled) return;
    submit.disabled = true;
    guarded(async () => {
      try {
        const result = await call(state.authMode, data);
        if (register) { await refresh(); recoveryDialog(result.recoveryCode); }
        else if (recover) { state.authMode = 'login'; renderAuth(); recoveryDialog(result.recoveryCode); }
        else await refresh();
      } finally { submit.disabled = false; }
    });
  });
}
async function refresh() { state.snapshot = await call('snapshot', state.month); render(); }
function render() {
  const s = state.snapshot;
  const pages = { dashboard: 'Visão geral', entries: 'Lançamentos', budgets: 'Orçamento', categories: 'Categorias', reports: 'Relatórios', family: 'Família e backup' };
  root.innerHTML = `<div class="shell"><aside class="sidebar"><div class="brand"><span class="brand-mark">S</span><span>Saldo<br><b>Familiar</b></span></div><p class="nav-label">SEU ORÇAMENTO</p><nav>${Object.entries(pages).map(([key, label]) => `<button data-action="navigate" data-page="${key}" class="nav-item ${state.page === key ? 'active' : ''}"><span>${icons[key]}</span>${label}</button>`).join('')}</nav><div class="sidebar-note"><span>♡</span><strong>Pequenos hábitos,<br>grandes planos.</strong><p>O orçamento pertence<br>a toda a família.</p></div><div class="profile"><span class="avatar">${esc(s.user.name.slice(0, 1).toUpperCase())}</span><div><strong>${esc(s.user.name)}</strong><small>Orçamento compartilhado</small></div><button data-action="logout" class="icon-button" aria-label="Sair" title="Sair">↪</button></div></aside><main class="workspace"><header class="topbar"><div><span class="breadcrumb">Minha família / ${pages[state.page]}</span><h1>${state.page === 'dashboard' ? `Olá, ${esc(s.user.name.split(' ')[0])} <span class="greeting">☀</span>` : pages[state.page]}</h1><p class="muted">${state.page === 'dashboard' ? 'Veja como está o mês e planeje os próximos passos.' : 'Tudo em um só lugar, para cuidar das contas da casa.'}</p></div><div class="header-actions"><label class="month-picker"><span>Período</span><input id="month" type="month" value="${state.month}" min="1900-01" max="2199-12" aria-label="Mês do orçamento"></label><button class="primary" data-action="new-entry">+ Novo lançamento</button></div></header><div id="content">${({ dashboard, entries: entriesPage, budgets: budgetsPage, categories: categoriesPage, reports: reportsPage, family: familyPage })[state.page]()}</div><footer class="workspace-footer"><span>● Dados locais · Sem sincronização entre máquinas</span><span>Valores por vencimento · ${esc(monthLabel(state.month))}</span></footer></main></div>`;
  document.querySelector('#month').addEventListener('change', event => guarded(async () => { state.month = event.target.value; await refresh(); }));
  if (state.page === 'entries') {
    document.querySelector('#search').addEventListener('input', event => { state.search = event.target.value; document.querySelector('#entry-table').innerHTML = entryTable(filteredEntries()); });
    document.querySelector('#type-filter').addEventListener('change', event => { state.filter = event.target.value; document.querySelector('#entry-table').innerHTML = entryTable(filteredEntries()); });
  }
}
function metric(label, value, icon, tone, detail) { return `<article class="metric ${tone}"><div><span>${label}</span><span class="metric-icon">${icon}</span></div><strong>${money(value)}</strong><small>${detail}</small></article>`; }
function metrics() {
  const t = state.snapshot.totals;
  return `<section class="metrics">${metric('Receitas previstas', t.income, '↙', 'income', 'Entradas com vencimento no mês')}${metric('Despesas previstas', t.expense, '↗', 'expense', 'Saídas com vencimento no mês')}${metric('Saldo previsto', t.balance, '≈', t.balance >= 0 ? 'balance' : 'expense', 'Receitas menos despesas previstas')}${metric('Despesas a pagar', t.pending, '◷', 'pending', 'Lançamentos sem data de pagamento')}</section>`;
}
function historyChart() {
  const h = state.snapshot.history, max = Math.max(...h.flatMap(v => [v.income, v.expense]), 1);
  return `<svg class="history-chart" viewBox="0 0 650 230" role="img" aria-label="Receitas e despesas previstas nos últimos seis meses"><line x1="30" y1="180" x2="630" y2="180" class="grid-line"/><line x1="30" y1="100" x2="630" y2="100" class="grid-line"/><line x1="30" y1="20" x2="630" y2="20" class="grid-line"/>${h.map((v, i) => { const x = 55 + i * 100, a = v.income / max * 150, b = v.expense / max * 150; return `<rect x="${x}" y="${180 - a}" width="22" height="${a}" rx="5" class="bar-income"><title>Receitas: ${money(v.income)}</title></rect><rect x="${x + 28}" y="${180 - b}" width="22" height="${b}" rx="5" class="bar-expense"><title>Despesas: ${money(v.expense)}</title></rect><text x="${x + 25}" y="210" text-anchor="middle">${new Date(`${v.month}-01T12:00:00`).toLocaleDateString('pt-BR', { month: 'short' })}</text>`; }).join('')}</svg>`;
}
function categoryBreakdown() {
  const s = state.snapshot, total = s.totals.expense;
  const groups = s.categories.filter(c => c.type === 'expense').map(c => ({ name: c.name, amount: s.entries.filter(e => e.categoryId === c.id && e.type === 'expense').reduce((a, e) => a + e.amount, 0) })).filter(c => c.amount).sort((a, b) => b.amount - a.amount);
  return groups.length ? `<div class="category-list">${groups.slice(0, 5).map((c, i) => `<div><div class="category-row"><span><i class="dot color-${i}"></i>${esc(c.name)}</span><strong>${money(c.amount)}</strong></div><progress value="${c.amount}" max="${total}" aria-label="${esc(c.name)}: ${Math.round(c.amount / total * 100)}% das despesas"></progress><small>${Math.round(c.amount / total * 100)}% das despesas</small></div>`).join('')}</div>` : empty('Seu mês começa aqui', 'Cadastre uma despesa para descobrir como os gastos se distribuem.');
}
function dashboard() {
  const s = state.snapshot;
  return `${metrics()}<section class="dashboard-grid"><article class="panel"><div class="panel-heading"><div><h2>O ritmo da sua família</h2><p>Receitas e despesas previstas nos últimos 6 meses</p></div><span class="tag">Por vencimento</span></div>${historyChart()}<div class="legend"><span><i class="dot color-0"></i>Receitas</span><span><i class="dot color-1"></i>Despesas</span></div></article><article class="panel"><div class="panel-heading"><div><h2>Para onde vai o dinheiro</h2><p>Principais categorias do mês</p></div></div>${categoryBreakdown()}</article></section><section class="dashboard-grid bottom"><article class="panel"><div class="panel-heading"><div><h2>Últimos lançamentos</h2><p>Contas e receitas da família neste mês</p></div><button class="link" data-action="navigate" data-page="entries">Ver todos →</button></div>${entryTable(s.entries.slice(0, 5), false)}</article><article class="panel tips"><span class="eyebrow">UM PASSO À FRENTE</span><h2>Ideias para o seu orçamento</h2><p class="muted">Observações automáticas a partir dos seus lançamentos.</p>${s.suggestions.map(text => `<div class="tip"><span>✦</span><p>${esc(text)}</p></div>`).join('')}<small>Regras locais, sem IA ou envio de dados. Revise cada sugestão conforme a realidade da família.</small></article></section>`;
}
function empty(title, description) { return `<div class="empty"><span>◎</span><h3>${title}</h3><p>${description}</p></div>`; }
function filteredEntries() { return state.snapshot.entries.filter(e => (state.filter === 'all' || e.type === state.filter) && `${e.description} ${e.category} ${e.author}`.toLowerCase().includes(state.search.toLowerCase())); }
function entryTable(list, actions = true) {
  if (!list.length) return empty('Nenhum lançamento por aqui', 'Escolha outro período ou registre a primeira receita ou despesa.');
  return `<div class="table-scroll"><table><thead><tr><th>Descrição</th><th>Vencimento</th><th>Situação</th><th class="right">Valor</th>${actions ? '<th class="right">Ações</th>' : ''}</tr></thead><tbody>${list.map(e => `<tr><td><div class="entry-name"><span class="transaction-icon ${e.type}">${e.type === 'income' ? '↙' : '↗'}</span><div><strong>${esc(e.description)}</strong><small>${esc(e.category)} · ${esc(e.author)}</small></div></div></td><td>${displayDate(e.dueDate)}</td><td><span class="status ${e.paidDate ? 'paid' : 'unpaid'}">${e.paidDate ? 'Pago / recebido' : 'Pendente'}</span></td><td class="right amount ${e.type}">${e.type === 'income' ? '+' : '−'} ${money(e.amount)}</td>${actions ? `<td class="right"><button class="icon-button" data-action="edit-entry" data-id="${e.id}" aria-label="Editar ${esc(e.description)}" title="Editar">✎</button><button class="icon-button danger" data-action="delete-entry" data-id="${e.id}" aria-label="Excluir ${esc(e.description)}" title="Excluir">×</button></td>` : ''}</tr>`).join('')}</tbody></table></div>`;
}
function entriesPage() { return `${metrics()}<article class="panel"><div class="panel-heading"><div><h2>Todos os lançamentos</h2><p>Qualquer familiar pode editar ou excluir os lançamentos.</p></div><div class="filters"><input id="search" value="${esc(state.search)}" placeholder="Buscar descrição, categoria…" aria-label="Buscar lançamentos"><select id="type-filter" aria-label="Filtrar tipo"><option value="all">Todos os tipos</option><option value="expense" ${state.filter === 'expense' ? 'selected' : ''}>Despesas</option><option value="income" ${state.filter === 'income' ? 'selected' : ''}>Receitas</option></select></div></div><div id="entry-table">${entryTable(filteredEntries())}</div></article>`; }
function budgetsPage() {
  const budgets = state.snapshot.budgets;
  return `<article class="panel"><div class="panel-heading"><div><h2>Um limite para cada prioridade</h2><p>Defina limites mensais por categoria. Eles orientam os gastos e não bloqueiam lançamentos.</p></div><button class="primary" data-action="new-budget">+ Definir limite</button></div>${budgets.length ? `<div class="budget-grid">${budgets.map(b => `<article class="budget-card"><div><h3>${esc(b.category)}</h3><button class="icon-button danger" data-action="delete-budget" data-id="${b.categoryId}" aria-label="Remover limite de ${esc(b.category)}">×</button></div><strong>${money(b.spent)}</strong><p>de ${money(b.limit)} planejados</p><progress value="${Math.min(b.spent, b.limit)}" max="${b.limit}" class="${b.spent > b.limit ? 'over' : ''}"></progress><small class="${b.spent > b.limit ? 'danger' : ''}">${b.spent > b.limit ? `${money(b.spent - b.limit)} acima do limite` : `${money(b.limit - b.spent)} disponíveis`}</small><button class="link" data-action="edit-budget" data-id="${b.categoryId}">Alterar limite</button></article>`).join('')}</div>` : empty('Planeje antes de gastar', 'Comece definindo um limite para alimentação, moradia ou outra categoria.')}</article>`;
}
function categoriesPage() { return `<article class="panel"><div class="panel-heading"><div><h2>As categorias da sua casa</h2><p>Organize receitas e despesas com nomes que façam sentido para a família.</p></div><button class="primary" data-action="new-category">+ Nova categoria</button></div><div class="category-columns">${['expense', 'income'].map(type => `<section><h3>${type === 'expense' ? 'Despesas' : 'Receitas'}</h3>${state.snapshot.categories.filter(c => c.type === type).map(c => `<div class="category-tile"><span>${type === 'expense' ? '↗' : '↙'}</span>${esc(c.name)}</div>`).join('')}</section>`).join('')}</div></article>`; }
function reportsPage() { return `${metrics()}<article class="panel"><div class="panel-heading"><div><h2>Seu mês, em detalhes</h2><p>${esc(monthLabel(state.month))} · Relatório por vencimento</p></div><div class="header-actions"><button class="secondary" data-action="export" data-format="csv">Exportar CSV</button><button class="primary" data-action="export" data-format="pdf">Salvar PDF</button></div></div>${entryTable(state.snapshot.entries, false)}<p class="hint">O CSV inclui observações, autoria e datas de pagamento. O PDF inclui o resumo mensal, lançamentos e limites por categoria. O saldo previsto não representa necessariamente o saldo bancário.</p></article>`; }
function familyPage() { return `<section class="dashboard-grid"><article class="panel"><div class="panel-heading"><div><h2>Quem cuida das contas</h2><p>Todos compartilham e podem editar o mesmo orçamento.</p></div><button class="primary" data-action="new-user">+ Familiar</button></div>${state.snapshot.users.map(u => `<div class="family-row"><span class="avatar">${esc(u.name.slice(0, 1).toUpperCase())}</span><div><strong>${esc(u.name)}</strong><small>@${esc(u.username)}</small></div><span class="tag">Acesso compartilhado</span></div>`).join('')}<p class="hint">Somente usuários já conectados podem cadastrar novos familiares. Para trocar de usuário, saia pelo botão ao lado do seu nome.</p></article><article class="panel"><h2>Guarde uma cópia dos seus planos</h2><p class="muted">Backup automático local diário, com retenção das últimas 30 cópias diárias. Uma cópia adicional é preservada antes de cada restauração.</p><div class="backup-actions"><button class="primary" data-action="backup">Salvar backup manual</button><button class="secondary" data-action="restore">Restaurar backup</button></div><p class="hint">Copie seus backups para outro dispositivo. Banco e backups contêm dados pessoais e não são criptografados. A reinstalação preserva o banco; a restauração substitui o orçamento e as contas de acesso pelo conteúdo do backup.</p></article></section>`; }

function modal(title, body, submitLabel, onSubmit, afterRender) {
  document.querySelector('dialog')?.remove();
  const dialog = document.createElement('dialog');
  dialog.innerHTML = `<div class="modal-heading"><h2>${esc(title)}</h2><button type="button" class="icon-button" data-action="close-modal" aria-label="Fechar">×</button></div><form id="modal-form">${body}<div class="modal-actions"><button type="button" class="secondary" data-action="close-modal">Cancelar</button><button type="submit" class="primary">${esc(submitLabel)}</button></div></form>`;
  document.body.append(dialog); dialog.showModal();
  const form = dialog.querySelector('form');
  form.addEventListener('submit', event => {
    event.preventDefault(); const submit = form.querySelector('[type="submit"]');
    if (submit.disabled) return;
    submit.disabled = true;
    guarded(async () => {
      try { const data = Object.fromEntries(new FormData(form)); await onSubmit(data); if (dialog.isConnected) dialog.close(); dialog.remove(); }
      finally { submit.disabled = false; }
    });
  });
  dialog.addEventListener('close', () => dialog.remove());
  afterRender?.(form);
}
function recoveryDialog(code) {
  modal('Guarde seu código de recuperação', `<p>Este código substitui sua senha em caso de esquecimento. Guarde-o em local seguro. Ele não será exibido novamente.</p><div class="recovery-code">${esc(code)}</div><p class="hint">Após usar o código, ele será invalidado e você receberá outro. Quem tiver acesso ao código poderá redefinir sua senha.</p><label class="checkbox"><input name="saved" type="checkbox" required>Guardei meu código em local seguro.</label>`, 'Código guardado', async () => {});
}
function entryDialog(entry) {
  const e = entry || { type: 'expense', dueDate: `${state.month}-${state.month === new Date().toLocaleDateString('sv-SE').slice(0, 7) ? new Date().toLocaleDateString('sv-SE').slice(8) : '01'}` };
  modal(entry ? 'Editar lançamento' : 'Novo lançamento', `<div class="form-grid">${select('Tipo', 'type', `<option value="expense" ${e.type === 'expense' ? 'selected' : ''}>Despesa</option><option value="income" ${e.type === 'income' ? 'selected' : ''}>Receita</option>`)}${field('Valor (R$)', 'amount', 'text', e.amount ? (e.amount / 100).toFixed(2).replace('.', ',') : '', 'required inputmode="decimal" placeholder="0,00"')}${field('Descrição', 'description', 'text', e.description, 'required maxlength="120"')}${select('Categoria', 'categoryId', options(state.snapshot.categories.filter(c => c.type === e.type), e.categoryId))}${field('Vencimento', 'dueDate', 'date', e.dueDate, 'required min="1900-01-01" max="2199-12-31"')}${field('Pagamento / recebimento (opcional)', 'paidDate', 'date', e.paidDate, 'min="1900-01-01" max="2199-12-31"')}</div><label>Observações<textarea name="notes" maxlength="2000" rows="3">${esc(e.notes)}</textarea></label><p class="hint">O orçamento considera o mês do vencimento. Deixe o pagamento em branco enquanto estiver pendente. Parcelamento automático fica fora desta primeira versão.</p>`, 'Salvar lançamento', async data => { await call('saveEntry', { ...data, id: entry?.id }); await refresh(); notify('Lançamento salvo.'); }, form => form.elements.type.addEventListener('change', () => { form.elements.categoryId.innerHTML = options(state.snapshot.categories.filter(c => c.type === form.elements.type.value)); }));
}
function budgetDialog(categoryId) {
  const existing = state.snapshot.budgets.find(b => b.categoryId === Number(categoryId));
  modal('Definir limite mensal', select('Categoria de despesa', 'categoryId', options(state.snapshot.categories.filter(c => c.type === 'expense'), existing?.categoryId)) + field('Limite (R$)', 'amount', 'text', existing ? (existing.limit / 100).toFixed(2).replace('.', ',') : '', 'required inputmode="decimal"') + `<p class="hint">Limite aplicado a ${esc(monthLabel(state.month))}. Se já existir um limite para a categoria, ele será atualizado.</p>`, 'Salvar limite', async data => { await call('saveBudget', { ...data, month: state.month }); await refresh(); notify('Limite salvo.'); });
}
function confirmDialog(title, message, onConfirm) { modal(title, `<p>${esc(message)}</p>`, 'Confirmar', onConfirm); }
document.addEventListener('click', event => {
  const button = event.target.closest('[data-action]'); if (!button) return;
  const action = button.dataset.action;
  guarded(async () => {
    if (action === 'navigate') { state.page = button.dataset.page; render(); }
    else if (action === 'auth-mode') { state.authMode = button.dataset.mode; renderAuth(); }
    else if (action === 'logout') { await call('logout'); state.snapshot = null; state.page = 'dashboard'; await initialize(); }
    else if (action === 'new-entry') entryDialog();
    else if (action === 'edit-entry') entryDialog(state.snapshot.entries.find(e => e.id === Number(button.dataset.id)));
    else if (action === 'delete-entry') confirmDialog('Excluir lançamento?', 'Essa ação remove o lançamento do orçamento compartilhado de toda a família.', async () => { await call('deleteEntry', Number(button.dataset.id)); await refresh(); notify('Lançamento excluído.'); });
    else if (action === 'new-budget' || action === 'edit-budget') budgetDialog(button.dataset.id);
    else if (action === 'delete-budget') confirmDialog('Remover limite?', 'Os lançamentos da categoria serão preservados.', async () => { await call('deleteBudget', { month: state.month, categoryId: button.dataset.id }); await refresh(); });
    else if (action === 'new-category') modal('Nova categoria', field('Nome', 'name', 'text', '', 'required maxlength="60"') + select('Tipo', 'type', '<option value="expense">Despesa</option><option value="income">Receita</option>'), 'Criar categoria', async data => { await call('addCategory', data); await refresh(); notify('Categoria criada.'); });
    else if (action === 'new-user') modal('Adicionar familiar', field('Nome', 'name', 'text', '', 'required maxlength="120"') + field('Usuário', 'username', 'text', '', 'required minlength="3" maxlength="40" autocomplete="off"') + field('Senha', 'password', 'password', '', 'required minlength="10" maxlength="256" autocomplete="new-password"') + '<p class="hint">O novo familiar poderá editar todo o orçamento. O código de recuperação deve ser entregue a ele.</p>', 'Criar acesso', async data => { const result = await call('register', data); await refresh(); recoveryDialog(result.recoveryCode); });
    else if (action === 'close-modal') button.closest('dialog').close();
    else if (action === 'export') { if (await call('exportReport', { month: state.month, format: button.dataset.format })) notify('Relatório salvo.'); }
    else if (action === 'backup') { if (await call('backup', { month: state.month })) notify('Backup salvo.'); }
    else if (action === 'restore') { if (await call('restore', { month: state.month })) { await initialize(); notify('Backup restaurado. Faça login novamente.'); } }
  });
});

window.smokeTest = async function () {
  await initialize();
  if (!(await call('status')).hasUsers) {
    const form = document.querySelector('#auth-form');
    form.elements.name.value = 'Família demonstração'; form.elements.username.value = 'demo'; form.elements.password.value = 'demonstracao-123'; form.requestSubmit();
    for (let i = 0; i < 100 && !document.querySelector('dialog'); i++) await new Promise(r => setTimeout(r, 40));
    if (!document.querySelector('dialog')) throw new Error('Cadastro pela tela falhou');
    const recovery = document.querySelector('dialog form'); recovery.elements.saved.checked = true; recovery.requestSubmit();
  } else { await call('login', { username: 'demo', password: 'demonstracao-123' }); await refresh(); }
  state.month = '2026-09'; await refresh();
  if (!state.snapshot.entries.length) {
    document.querySelector('[data-action="new-entry"]').click();
    const form = document.querySelector('dialog form');
    form.elements.type.value = 'income'; form.elements.type.dispatchEvent(new Event('change')); form.elements.description.value = 'Salário'; form.elements.amount.value = '6500,00'; form.elements.dueDate.value = '2026-09-05'; form.requestSubmit();
    for (let i = 0; i < 100 && document.querySelector('dialog'); i++) await new Promise(r => setTimeout(r, 40));
    if (state.snapshot.totals.income !== 650000) throw new Error('Receita pela tela falhou');
    document.querySelector('[data-action="new-entry"]').click();
    const expense = document.querySelector('dialog form'); expense.elements.description.value = 'Supermercado'; expense.elements.amount.value = '890,50'; expense.elements.dueDate.value = '2026-09-15'; expense.requestSubmit();
    for (let i = 0; i < 100 && document.querySelector('dialog'); i++) await new Promise(r => setTimeout(r, 40));
    if (state.snapshot.totals.expense !== 89050) throw new Error('Despesa pela tela falhou');
  }
  for (const page of ['entries', 'budgets', 'categories', 'reports', 'family', 'dashboard']) { document.querySelector(`[data-action="navigate"][data-page="${page}"]`).click(); if (!document.querySelector('#content')) throw new Error('Navegação falhou'); }
  await call('exportReport', { month: state.month, format: 'csv' });
  await call('exportReport', { month: state.month, format: 'pdf' });
  await call('backup', { month: state.month });
  if (!document.querySelector('.history-chart')) throw new Error('Dashboard não renderizou');
};
guarded(initialize);
