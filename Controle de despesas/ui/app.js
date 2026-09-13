const root = document.querySelector('#app');
const state = { page: 'dashboard', month: new Date().toLocaleDateString('sv-SE').slice(0, 7), snapshot: null, authMode: 'login', search: '', filter: 'all' };
const call = (operation, input) => window.family.call(operation, input);
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const money = value => (value / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const displayDate = date => date ? date.split('-').reverse().join('/') : 'Pendente';
const monthLabel = month => new Date(`${month}-01T12:00:00`).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
const icons = { dashboard: '◫', entries: '↔', budgets: '◎', cards: '▱', imports: '⇧', categories: '▦', reports: '▤', family: '♧' };
const paymentLabels = { unspecified: 'Não informado', pix: 'Pix', cash: 'Dinheiro', debit_card: 'Cartão de débito', credit_card: 'Cartão de crédito', bank_transfer: 'Transferência', boleto: 'Boleto', other: 'Outro' };
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
async function refresh() { state.snapshot = await call('snapshot', state.month); render(); if (state.snapshot.backupWarning) notify(state.snapshot.backupWarning, true); }
function render() {
  const s = state.snapshot;
  const pages = { dashboard: 'Visão geral', entries: 'Lançamentos', budgets: 'Orçamento', cards: 'Cartões e faturas', imports: 'Importar fatura', categories: 'Categorias', reports: 'Relatórios', family: 'Família e backup' };
  root.innerHTML = `<div class="shell"><aside class="sidebar"><div class="brand"><span class="brand-mark">S</span><span>Saldo<br><b>Familiar</b></span></div><p class="nav-label">SEU ORÇAMENTO</p><nav>${Object.entries(pages).map(([key, label]) => `<button data-action="navigate" data-page="${key}" class="nav-item ${state.page === key ? 'active' : ''}"><span>${icons[key]}</span>${label}</button>`).join('')}</nav><div class="sidebar-note"><span>♡</span><strong>Pequenos hábitos,<br>grandes planos.</strong><p>O orçamento pertence<br>a toda a família.</p></div><div class="profile"><span class="avatar">${esc(s.user.name.slice(0, 1).toUpperCase())}</span><div><strong>${esc(s.user.name)}</strong><small>Orçamento compartilhado</small></div><button data-action="logout" class="icon-button" aria-label="Sair" title="Sair">↪</button></div></aside><main class="workspace"><header class="topbar"><div><span class="breadcrumb">Minha família / ${pages[state.page]}</span><h1>${state.page === 'dashboard' ? `Olá, ${esc(s.user.name.split(' ')[0])} <span class="greeting">☀</span>` : pages[state.page]}</h1><p class="muted">${state.page === 'dashboard' ? 'Veja como está o mês e planeje os próximos passos.' : 'Tudo em um só lugar, para cuidar das contas da casa.'}</p></div><div class="header-actions"><label class="month-picker"><span>Período</span><input id="month" type="month" value="${state.month}" min="1900-01" max="2199-12" aria-label="Mês do orçamento"></label><button class="primary" data-action="new-entry">+ Novo lançamento</button></div></header><div id="content">${({ dashboard, entries: entriesPage, budgets: budgetsPage, cards: cardsPage, imports: importsPage, categories: categoriesPage, reports: reportsPage, family: familyPage })[state.page]()}</div><footer class="workspace-footer"><span>● Dados locais · Sem sincronização entre máquinas</span><span>Orçamento e pagamentos · ${esc(monthLabel(state.month))}</span></footer></main></div>`;
  document.querySelector('#month').addEventListener('change', event => guarded(async () => { state.month = event.target.value; await refresh(); }));
  if (['dashboard', 'entries'].includes(state.page)) document.querySelector('.metrics').insertAdjacentHTML('afterend', paymentSummary());
  if (state.page === 'entries') {
    document.querySelector('#search').addEventListener('input', event => { state.search = event.target.value; document.querySelector('#entry-table').innerHTML = entryTable(filteredEntries()); });
    document.querySelector('#type-filter').addEventListener('change', event => { state.filter = event.target.value; document.querySelector('#entry-table').innerHTML = entryTable(filteredEntries()); });
  }
}
function metric(label, value, icon, tone, detail) { return `<article class="metric ${tone}"><div><span>${label}</span><span class="metric-icon">${icon}</span></div><strong>${money(value)}</strong><small>${detail}</small></article>`; }
function metrics() {
  const t = state.snapshot.totals;
  return `<section class="metrics">${metric('Receitas previstas', t.income, '↙', 'income', 'Receitas por vencimento')}${metric('Despesas previstas', t.expense, '↗', 'expense', 'Consumo do orçamento no mês')}${metric('Saldo previsto', t.balance, '≈', t.balance >= 0 ? 'balance' : 'expense', 'Receitas menos despesas previstas')}${metric('Despesas a pagar', t.pending, '◷', 'pending', 'Pagamentos pendentes do mês')}</section>`;
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
  return `${metrics()}<section class="dashboard-grid"><article class="panel"><div class="panel-heading"><div><h2>O ritmo da sua família</h2><p>Receitas e despesas previstas nos últimos 6 meses</p></div><span class="tag">Por orçamento</span></div>${historyChart()}<div class="legend"><span><i class="dot color-0"></i>Receitas</span><span><i class="dot color-1"></i>Despesas</span></div></article><article class="panel"><div class="panel-heading"><div><h2>Para onde vai o dinheiro</h2><p>Principais categorias do mês</p></div></div>${categoryBreakdown()}</article></section><section class="dashboard-grid bottom"><article class="panel"><div class="panel-heading"><div><h2>Últimos lançamentos</h2><p>Contas e receitas da família neste mês</p></div><button class="link" data-action="navigate" data-page="entries">Ver todos →</button></div>${entryTable(s.entries.slice(0, 5), false)}</article><article class="panel tips"><span class="eyebrow">UM PASSO À FRENTE</span><h2>Ideias para o seu orçamento</h2><p class="muted">Observações automáticas a partir dos seus lançamentos.</p>${s.suggestions.map(text => `<div class="tip"><span>✦</span><p>${esc(text)}</p></div>`).join('')}<small>Regras locais, sem IA ou envio de dados. Revise cada sugestão conforme a realidade da família.</small></article></section>`;
}
function empty(title, description) { return `<div class="empty"><span>◎</span><h3>${title}</h3><p>${description}</p></div>`; }
function filteredEntries() { return state.snapshot.entries.filter(e => (state.filter === 'all' || e.type === state.filter) && `${e.description} ${e.category} ${e.author}`.toLowerCase().includes(state.search.toLowerCase())); }
function entryTable(list, actions = true, invoiceSource = false) {
  if (!list.length) return empty('Nenhum lançamento por aqui', 'Escolha outro período ou registre a primeira receita ou despesa.');
  return `<div class="table-scroll"><table><thead><tr><th>Descrição</th><th>Vencimento</th><th>Situação</th><th class="right">Valor</th>${actions ? '<th class="right">Ações</th>' : ''}</tr></thead><tbody>${list.map(e => {
    const invoice = e.kind === 'invoice';
    const status = invoice && e.paidAmount > 0 && e.outstanding > 0 ? 'Parcialmente paga' : e.paidDate ? 'Pago / recebido' : 'Pendente';
    const details = `${esc(e.category)} · ${esc(paymentLabels[e.paymentMethod] || 'Não informado')}${e.cardName && !invoice ? ` · ${esc(e.cardName)}` : ''}`;
    const actionButtons = invoice ? `<button class="link" data-action="invoice-details" data-id="${e.cardId}">Ver fatura</button><button class="icon-button" data-action="pay-invoice" data-id="${e.cardId}" aria-label="Registrar pagamento da fatura" title="Registrar pagamento">✓</button>` : `<button class="icon-button" data-action="${invoiceSource ? 'edit-invoice-entry' : 'edit-entry'}" data-id="${e.id}" aria-label="Editar ${esc(e.description)}" title="Editar">✎</button><button class="icon-button danger" data-action="delete-entry" data-id="${e.id}" aria-label="Excluir ${esc(e.description)}" title="Excluir esta parcela">×</button>${e.installmentGroup ? `<button class="icon-button danger" data-action="delete-series" data-group="${e.installmentGroup}" aria-label="Excluir todas as parcelas" title="Excluir todas as parcelas">⊗</button>` : ''}`;
    return `<tr class="${invoice ? 'invoice-row' : ''}"><td><div class="entry-name"><span class="transaction-icon ${e.type}">${invoice ? '▱' : e.type === 'income' ? '↙' : '↗'}</span><div><strong>${esc(e.description)}${e.installmentCount > 1 ? ` <span class="parcel-tag">${e.installmentNumber}/${e.installmentCount}</span>` : ''}</strong><small>${details}</small><small>${invoice ? 'Somente pagamento · não duplica o orçamento' : `${esc(e.author)}${e.paymentMethod === 'credit_card' ? ` · orçamento ${esc(e.budgetMonth)}` : ''}`}</small></div></div></td><td>${displayDate(e.dueDate)}</td><td><span class="status ${e.paidDate ? 'paid' : 'unpaid'}">${status}</span></td><td class="right amount ${e.type}">${e.type === 'income' ? '+' : '−'} ${money(e.amount)}${invoice && e.outstanding < e.amount ? `<small class="table-subvalue">Pendente: ${money(e.outstanding)}</small>` : ''}</td>${actions ? `<td class="right">${actionButtons}</td>` : ''}</tr>`;
  }).join('')}</tbody></table></div>`;
}

function paymentSummary() {
  const s = state.snapshot;
  const used = s.paymentTotals.filter(p => p.amount || p.income);
  return `<section class="payment-overview"><article class="panel"><div class="panel-heading"><div><h2>Por forma de pagamento</h2><p>Valores que consomem o orçamento do mês, separados das faturas</p></div></div><div class="payment-grid">${used.length ? used.map(p => `<div class="payment-tile"><span>${esc(p.label)}</span><strong>${money(p.amount)}</strong>${p.income ? `<small>Receitas: ${money(p.income)}</small>` : '<small>Despesas do orçamento</small>'}</div>`).join('') : '<p class="muted">Os acumulados aparecerão após os primeiros lançamentos.</p>'}</div></article><article class="panel card-summary"><span class="eyebrow">CARTÕES DE CRÉDITO</span><h2>Faturas a acompanhar</h2><div><span>Vencem neste mês</span><strong>${money(s.totals.cardDue)}</strong></div><div><span>Vencem no mês seguinte</span><strong>${money(s.totals.nextCardDue)}</strong></div><button class="link" data-action="navigate" data-page="cards">Ver cartões e faturas →</button><p class="hint">Cada parcela consome seu mês do orçamento; a fatura representa o pagamento desses gastos.</p></article></section>`;
}

function cardsPage() {
  const s = state.snapshot;
  const nextMonth = s.nextInvoices[0]?.invoiceMonth;
  return `<article class="panel"><div class="panel-heading"><div><h2>Seus cartões</h2><p>Somente nome, fechamento e vencimento. Não informe número do cartão ou código de segurança.</p></div><button class="primary" data-action="new-card">+ Cadastrar cartão</button></div><div class="budget-grid">${s.cards.map(card => `<article class="budget-card"><h3>${esc(card.name)}</h3><p>Fechamento: dia ${card.closingDay}<br>Vencimento: dia ${card.dueDay}</p><button class="link" data-action="edit-card" data-id="${card.id}">Alterar cadastro</button></article>`).join('') || empty('Cadastre seu primeiro cartão', 'Defina o fechamento e o vencimento para calcular as faturas automaticamente.')}</div><p class="hint">Compras no dia do fechamento entram na próxima fatura. Dias que não existem em um mês são ajustados ao último dia desse mês. Alterar o cadastro afeta somente novas compras; parcelas já lançadas preservam seus vencimentos.</p></article><article class="panel invoice-panel"><div class="panel-heading"><div><h2>Faturas que vencem em ${esc(monthLabel(state.month))}</h2><p>Acumuladas automaticamente por cartão, incluindo as parcelas de compras anteriores.</p></div><span class="tag">${money(s.totals.cardDue)}</span></div>${entryTable(s.invoices)}<p class="hint">Para alterar o valor de uma fatura, edite ou exclua a compra/parcela que a compõe. Registrar o pagamento não cria outra despesa.</p></article><article class="panel invoice-panel"><div class="panel-heading"><div><h2>Vencimentos no mês seguinte${nextMonth ? ` · ${esc(monthLabel(nextMonth))}` : ''}</h2><p>Previsão calculada com os lançamentos existentes. Use o seletor de período para consultar outros meses.</p></div><span class="tag">${money(s.totals.nextCardDue)}</span></div>${entryTable(s.nextInvoices, false)}</article>`;
}
function entriesPage() { return `${metrics()}<article class="panel"><div class="panel-heading"><div><h2>Todos os lançamentos</h2><p>Qualquer familiar pode editar ou excluir os lançamentos.</p></div><div class="filters"><input id="search" value="${esc(state.search)}" placeholder="Buscar descrição, categoria…" aria-label="Buscar lançamentos"><select id="type-filter" aria-label="Filtrar tipo"><option value="all">Todos os tipos</option><option value="expense" ${state.filter === 'expense' ? 'selected' : ''}>Despesas</option><option value="income" ${state.filter === 'income' ? 'selected' : ''}>Receitas</option></select></div></div><div id="entry-table">${entryTable(filteredEntries())}</div></article>`; }
function budgetsPage() {
  const budgets = state.snapshot.budgets;
  return `<article class="panel"><div class="panel-heading"><div><h2>Um limite para cada prioridade</h2><p>Defina limites mensais por categoria. Eles orientam os gastos e não bloqueiam lançamentos.</p></div><button class="primary" data-action="new-budget">+ Definir limite</button></div>${budgets.length ? `<div class="budget-grid">${budgets.map(b => `<article class="budget-card"><div><h3>${esc(b.category)}</h3><button class="icon-button danger" data-action="delete-budget" data-id="${b.categoryId}" aria-label="Remover limite de ${esc(b.category)}">×</button></div><strong>${money(b.spent)}</strong><p>de ${money(b.limit)} planejados</p><progress value="${Math.min(b.spent, b.limit)}" max="${b.limit}" class="${b.spent > b.limit ? 'over' : ''}"></progress><small class="${b.spent > b.limit ? 'danger' : ''}">${b.spent > b.limit ? `${money(b.spent - b.limit)} acima do limite` : `${money(b.limit - b.spent)} disponíveis`}</small><button class="link" data-action="edit-budget" data-id="${b.categoryId}">Alterar limite</button></article>`).join('')}</div>` : empty('Planeje antes de gastar', 'Comece definindo um limite para alimentação, moradia ou outra categoria.')}</article>`;
}
function categoriesPage() { return `<article class="panel"><div class="panel-heading"><div><h2>As categorias da sua casa</h2><p>Organize receitas e despesas com nomes que façam sentido para a família.</p></div><button class="primary" data-action="new-category">+ Nova categoria</button></div><div class="category-columns">${['expense', 'income'].map(type => `<section><h3>${type === 'expense' ? 'Despesas' : 'Receitas'}</h3>${state.snapshot.categories.filter(c => c.type === type).map(c => `<div class="category-tile"><span>${type === 'expense' ? '↗' : '↙'}</span>${esc(c.name)}</div>`).join('')}</section>`).join('')}</div></article>`; }
function reportsPage() { return `${metrics()}<article class="panel"><div class="panel-heading"><div><h2>Seu mês, em detalhes</h2><p>${esc(monthLabel(state.month))} · Orçamento e pagamentos</p></div><div class="header-actions"><button class="secondary" data-action="export" data-format="csv">Exportar CSV</button><button class="primary" data-action="export" data-format="pdf">Salvar PDF</button></div></div>${entryTable(state.snapshot.entries, false)}<p class="hint">O CSV mantém as colunas originais e acrescenta forma de pagamento, parcela, cartão e natureza. Para somar despesas sem duplicar faturas, use a coluna Despesa contabilizada (R$); as faturas ficam em Fatura prevista (R$). O PDF distingue orçamento de pagamentos. O saldo previsto não representa necessariamente o saldo bancário.</p></article>`; }
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
  const methodOptions = `${entry ? '' : '<option value="" disabled selected>Selecione a forma</option>'}${Object.entries(paymentLabels).filter(([key]) => key !== 'unspecified' || entry).map(([key, label]) => `<option value="${key}" ${e.paymentMethod === key ? 'selected' : ''}>${label}</option>`).join('')}`;
  const cardOptions = `<option value="" disabled ${e.cardId ? '' : 'selected'}>Selecione um cartão</option>${state.snapshot.cards.map(card => `<option value="${card.id}" ${card.id === e.cardId ? 'selected' : ''}>${esc(card.name)}</option>`).join('')}`;
  const body = `<div class="form-grid">${select('Tipo', 'type', `<option value="expense" ${e.type === 'expense' ? 'selected' : ''}>Despesa</option><option value="income" ${e.type === 'income' ? 'selected' : ''}>Receita</option>`)}${field(entry ? 'Valor desta parcela / lançamento (R$)' : 'Valor total do lançamento (R$)', 'amount', 'text', e.amount ? (e.amount / 100).toFixed(2).replace('.', ',') : '', 'required inputmode="decimal" placeholder="0,00"')}${field('Descrição', 'description', 'text', e.description, 'required maxlength="120"')}${select('Categoria', 'categoryId', options(state.snapshot.categories.filter(c => c.type === e.type), e.categoryId))}${select('Forma de pagamento', 'paymentMethod', methodOptions)}${field('Número de parcelas', 'installments', 'number', e.installmentCount || 1, `required min="1" max="120" ${entry ? 'disabled' : ''}`)}${select('Cartão de crédito', 'cardId', cardOptions)}${field(entry ? 'Data da compra (informativa)' : 'Data da compra no cartão', 'purchaseDate', 'date', e.purchaseDate || e.dueDate, 'required min="1900-01-01" max="2199-12-31"')}${field(entry ? 'Vencimento desta parcela / lançamento' : 'Vencimento da primeira parcela', 'dueDate', 'date', e.dueDate, 'required min="1900-01-01" max="2199-12-31"')}${field('Mês de consumo do orçamento', 'budgetMonth', 'month', e.budgetMonth || state.month, 'required min="1900-01" max="2199-12"')}${field('Pagamento / recebimento (opcional)', 'paidDate', 'date', e.paidDate, 'min="1900-01-01" max="2199-12-31"')}</div><div id="installment-preview" class="installment-preview" role="status"></div><label>Observações<textarea name="notes" maxlength="2000" rows="3">${esc(e.notes)}</textarea></label><p class="hint">${entry ? 'A edição modifica somente esta parcela; as demais são preservadas. Para mudar a quantidade de parcelas, exclua a série e faça um novo lançamento.' : 'O valor total será dividido em centavos, e as parcelas serão criadas nos meses seguintes. No cartão, a primeira parcela consome o mês da compra; os vencimentos seguem o fechamento e o dia de pagamento do cartão.'}</p>`;
  modal(entry ? 'Editar lançamento' : 'Novo lançamento', body, 'Salvar lançamento', async data => { await call('saveEntry', { ...data, dueDate: data.dueDate || data.purchaseDate, id: entry?.id }); await refresh(); notify(entry ? 'Parcela / lançamento atualizado.' : 'Lançamento e parcelas salvos.'); }, form => {
    const update = () => {
      const credit = form.elements.paymentMethod.value === 'credit_card';
      form.elements.paymentMethod.querySelector('option[value="credit_card"]').disabled = form.elements.type.value === 'income';
      const toggle = (name, visible) => { form.elements[name].disabled = !visible; form.elements[name].closest('label').hidden = !visible; };
      toggle('cardId', credit); toggle('purchaseDate', credit); toggle('budgetMonth', credit && !!entry);
      toggle('dueDate', !credit || !!entry); toggle('paidDate', !credit || !!entry);
      form.elements.paymentMethod.required = true; form.elements.cardId.required = true;
      const preview = form.querySelector('#installment-preview');
      if (entry) preview.textContent = e.installmentCount > 1 ? `Parcela ${e.installmentNumber} de ${e.installmentCount}. O valor informado altera somente esta parcela.` : 'Este lançamento não será convertido automaticamente em uma nova série durante a edição.';
      else {
        const raw = form.elements.amount.value.trim().replace(',', '.'); const count = Number(form.elements.installments.value);
        if (credit && !state.snapshot.cards.length) preview.textContent = 'Cadastre primeiro um cartão na tela Cartões e faturas.';
        else if (/^\d{1,9}(\.\d{1,2})?$/.test(raw) && count >= 1 && count <= 120) {
          const [whole, decimal = ''] = raw.split('.'); const total = Number(whole) * 100 + Number(decimal.padEnd(2, '0')); const base = Math.floor(total / count), extras = total % count;
          preview.textContent = `${count} parcela(s): ${money(base)}${extras ? `, com um centavo adicional nas primeiras ${extras}` : ''}. Total: ${money(total)}. ${credit ? 'A fatura representa o pagamento, sem contar novamente a despesa no orçamento.' : 'Cada parcela consumirá o mês do seu vencimento.'}`;
        } else preview.textContent = 'Informe o valor total e a quantidade de parcelas.';
      }
    };
    form.elements.type.addEventListener('change', () => {
      form.elements.categoryId.innerHTML = options(state.snapshot.categories.filter(c => c.type === form.elements.type.value));
      if (form.elements.type.value === 'income' && form.elements.paymentMethod.value === 'credit_card') form.elements.paymentMethod.value = 'pix';
      update();
    });
    for (const name of ['paymentMethod', 'amount', 'installments', 'cardId']) form.elements[name].addEventListener(name === 'amount' || name === 'installments' ? 'input' : 'change', update);
    update();
  });
}

function importsPage() {
  const pending = state.snapshot.pendingClassification;
  return `<article class="panel"><div class="panel-heading"><div><h2>Importar fatura Itaú</h2><p>Selecione o Excel (.xlsx) exportado pelo Itaú e o cartão cadastrado correspondente.</p></div><button class="primary" data-action="import-itau">Selecionar planilha</button></div><p class="hint">Cada compra ou parcela da planilha será conferida antes de salvar. Pagamentos da fatura são ignorados. Não são criadas parcelas futuras. Itens sem categoria entram no orçamento como “A classificar”. Créditos e estornos precisam ser tratados separadamente; planilhas com esses itens são recusadas.</p></article><article class="panel"><h2>Classificação pendente (${pending.length})</h2><p class="muted">Pendências de todos os meses. Classifique os itens para atualizar os limites por categoria.</p>${pending.length ? `<div class="table-wrap"><table><thead><tr><th>Compra</th><th>Descrição / cartão</th><th>Parcela</th><th>Valor</th><th></th></tr></thead><tbody>${pending.map(e => `<tr><td>${displayDate(e.purchaseDate)}</td><td>${esc(e.description)}<br><small>${esc(e.cardName)}</small></td><td>${e.installmentNumber}/${e.installmentCount}</td><td>${money(e.amount)}</td><td><button class="secondary" data-action="classify-entry" data-id="${e.id}">Classificar</button></td></tr>`).join('')}</tbody></table></div>` : empty('Nenhuma classificação pendente', 'Os itens reconhecidos recebem categoria automaticamente.')}</article>`;
}
async function importDialog() {
  if (!state.snapshot.cards.length) throw new Error('Cadastre o cartão em Cartões e faturas antes de importar.');
  const preview = await call('previewInvoice', { month: state.month });
  if (!preview) return;
  modal('Conferir importação', `<p>${preview.count} compras/parcelas · ${money(preview.total)} · Vencimento ${displayDate(preview.dueDate)}.</p><p>${preview.payments} pagamento(s) da fatura ignorado(s).</p>${select('Cartão desta fatura', 'cardId', '<option value="">Selecione o cartão</option>' + options(state.snapshot.cards))}<p class="hint">Lançamentos já existentes serão ignorados. Descrições diferentes das cadastradas manualmente podem exigir conferência após a importação.</p>`, 'Importar lançamentos', async data => {
    const result = await call('importInvoice', data);
    state.page = 'imports'; await refresh();
    notify(`${result.imported} importados, ${result.duplicates} duplicados ignorados, ${result.pending} pendentes de classificação.`);
  }, form => { form.elements.cardId.required = true; });
}
function cardDialog(card) {
  modal(card ? 'Alterar cartão' : 'Cadastrar cartão', field('Nome do cartão', 'name', 'text', card?.name, 'required maxlength="60" placeholder="Ex.: Cartão da família"') + `<div class="form-grid">${field('Dia de fechamento', 'closingDay', 'number', card?.closingDay || 25, 'required min="1" max="31"')}${field('Dia de vencimento', 'dueDay', 'number', card?.dueDay || 5, 'required min="1" max="31"')}</div><p class="hint">Compras no dia do fechamento entram na próxima fatura. Não informe número do cartão ou código de segurança. Alterações no cadastro não mudam vencimentos de compras já lançadas.</p>`, 'Salvar cartão', async data => { await call('saveCard', { ...data, id: card?.id }); await refresh(); notify('Cartão salvo.'); });
}
function invoiceDialog(cardId) {
  const invoice = state.snapshot.invoices.find(i => i.cardId === Number(cardId));
  if (!invoice) throw new Error('Selecione o mês de vencimento dessa fatura.');
  modal('Registrar pagamento da fatura', `<p><strong>${esc(invoice.cardName)}</strong> · Total ${money(invoice.amount)} · Pendente ${money(invoice.outstanding)}</p>${field('Data do pagamento (vazio para reabrir)', 'paidDate', 'date', invoice.paidDate || new Date().toLocaleDateString('sv-SE'), 'min="1900-01-01" max="2199-12-31"')}<p class="hint">A data será aplicada a todas as parcelas que compõem esta fatura. Não será criada uma nova despesa. Apague a data para marcar toda a fatura como pendente novamente.</p>`, 'Salvar pagamento', async data => { await call('payInvoice', { ...data, cardId: invoice.cardId, month: state.month }); await refresh(); notify(data.paidDate ? 'Pagamento da fatura registrado.' : 'Fatura marcada como pendente.'); });
}
function invoiceDetails(cardId) {
  const invoice = state.snapshot.invoices.find(i => i.cardId === Number(cardId));
  if (!invoice) throw new Error('Fatura não encontrada no período selecionado.');
  modal(`Fatura ${invoice.cardName}`, `<p>Total: ${money(invoice.amount)} · Pendente: ${money(invoice.outstanding)}</p>${entryTable(invoice.entries, true, true)}<p class="hint">Edite a parcela de origem para alterar a fatura. O mês de orçamento da parcela é preservado. A fatura acumula pagamentos e não cria outra despesa.</p>`, 'Fechar detalhes', async () => {});
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
    else if (action === 'edit-invoice-entry') entryDialog(state.snapshot.invoices.flatMap(invoice => invoice.entries).find(e => e.id === Number(button.dataset.id)));
    else if (action === 'delete-entry') confirmDialog('Excluir lançamento?', 'Essa ação remove o lançamento do orçamento compartilhado de toda a família.', async () => { await call('deleteEntry', Number(button.dataset.id)); await refresh(); notify('Lançamento excluído.'); });
    else if (action === 'delete-series') confirmDialog('Excluir todas as parcelas?', 'Todas as parcelas desta série, inclusive parcelas já pagas, serão excluídas. As faturas e os orçamentos serão recalculados.', async () => { await call('deleteSeries', button.dataset.group); await refresh(); notify('Série de parcelas excluída.'); });
    else if (action === 'import-itau') importDialog();
    else if (action === 'classify-entry') entryDialog(state.snapshot.pendingClassification.find(e => e.id === Number(button.dataset.id)));
    else if (action === 'new-card') cardDialog();
    else if (action === 'edit-card') cardDialog(state.snapshot.cards.find(card => card.id === Number(button.dataset.id)));
    else if (action === 'pay-invoice') invoiceDialog(button.dataset.id);
    else if (action === 'invoice-details') invoiceDetails(button.dataset.id);
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
    form.elements.type.value = 'income'; form.elements.type.dispatchEvent(new Event('change')); form.elements.paymentMethod.value = 'pix'; form.elements.paymentMethod.dispatchEvent(new Event('change')); form.elements.description.value = 'Salário'; form.elements.amount.value = '6500,00'; form.elements.dueDate.value = '2026-09-05'; form.requestSubmit();
    for (let i = 0; i < 100 && document.querySelector('dialog'); i++) await new Promise(r => setTimeout(r, 40));
    if (state.snapshot.totals.income !== 650000) throw new Error('Receita pela tela falhou');
    document.querySelector('[data-action="new-entry"]').click();
    const expense = document.querySelector('dialog form'); expense.elements.paymentMethod.value = 'pix'; expense.elements.paymentMethod.dispatchEvent(new Event('change')); expense.elements.description.value = 'Supermercado'; expense.elements.amount.value = '890,50'; expense.elements.dueDate.value = '2026-09-15'; expense.requestSubmit();
    for (let i = 0; i < 100 && document.querySelector('dialog'); i++) await new Promise(r => setTimeout(r, 40));
    if (state.snapshot.totals.expense !== 89050) throw new Error('Despesa pela tela falhou');
  }
  const waitFor = async (condition, message) => { for (let i = 0; i < 100; i++) { if (condition()) return; await new Promise(r => setTimeout(r, 40)); } throw new Error(message); };
  document.querySelector('[data-action="navigate"][data-page="cards"]').click();
  document.querySelector('[data-action="new-card"]').click();
  const cardForm = document.querySelector('dialog form'); cardForm.elements.name.value = 'Cartão demonstração'; cardForm.elements.closingDay.value = '25'; cardForm.elements.dueDay.value = '5'; cardForm.requestSubmit();
  await waitFor(() => !document.querySelector('dialog'), 'Cadastro de cartão pela tela falhou');
  document.querySelector('[data-action="new-entry"]').click();
  const purchase = document.querySelector('dialog form'); purchase.elements.paymentMethod.value = 'credit_card'; purchase.elements.paymentMethod.dispatchEvent(new Event('change')); purchase.elements.cardId.value = String(state.snapshot.cards[0].id); purchase.elements.description.value = 'Compra parcelada no cartão'; purchase.elements.amount.value = '300,00'; purchase.elements.installments.value = '3'; purchase.elements.purchaseDate.value = '2026-09-24'; purchase.requestSubmit();
  await waitFor(() => !document.querySelector('dialog'), 'Parcelas no cartão pela tela falharam');
  if (state.snapshot.totals.expense !== 99050 || state.snapshot.totals.nextCardDue !== 10000) throw new Error('Orçamento e previsão da fatura incorretos');
  document.querySelector('#month').value = '2026-10'; document.querySelector('#month').dispatchEvent(new Event('change'));
  await waitFor(() => state.snapshot.totals.cardDue === 10000, 'Fatura do próximo mês não apareceu');
  if (state.snapshot.totals.expense !== 10000) throw new Error('Fatura duplicou o consumo do orçamento');
  document.querySelector('[data-action="invoice-details"]').click();
  document.querySelector('dialog [data-action="edit-invoice-entry"]').click();
  const origin = document.querySelector('dialog form');
  if (origin.elements.budgetMonth.value !== '2026-09') throw new Error('A edição pela fatura perdeu o mês de orçamento da compra');
  origin.elements.notes.value = 'Parcela editada pela fatura'; origin.requestSubmit();
  await waitFor(() => !document.querySelector('dialog'), 'Edição pela fatura falhou');
  if (state.snapshot.totals.expense !== 10000 || state.snapshot.totals.cardDue !== 10000) throw new Error('Edição pela fatura alterou os totais incorretamente');
  document.querySelector('[data-action="pay-invoice"]').click();
  const payment = document.querySelector('dialog form'); payment.elements.paidDate.value = '2026-10-05'; payment.requestSubmit();
  await waitFor(() => !document.querySelector('dialog'), 'Pagamento da fatura pela tela falhou');
  if (state.snapshot.totals.pending !== 0) throw new Error('Fatura continuou pendente após pagamento');
  await call('exportReport', { month: state.month, format: 'csv' });
  await call('exportReport', { month: state.month, format: 'pdf' });
  document.querySelector('#month').value = '2026-09'; document.querySelector('#month').dispatchEvent(new Event('change'));
  await waitFor(() => state.snapshot.totals.income === 650000, 'Retorno ao mês da compra falhou');
  for (const page of ['entries', 'budgets', 'cards', 'categories', 'reports', 'family', 'dashboard']) { document.querySelector(`[data-action="navigate"][data-page="${page}"]`).click(); if (!document.querySelector('#content')) throw new Error('Navegação falhou'); }
  await call('exportReport', { month: state.month, format: 'csv' });
  await call('exportReport', { month: state.month, format: 'pdf' });
  await call('backup', { month: state.month });
  document.querySelector('[data-page="imports"]').click();
  document.querySelector('[data-action="import-itau"]').click();
  await waitFor(() => !!document.querySelector('dialog'), 'Prévia da importação falhou');
  let importForm = document.querySelector('dialog form');
  importForm.elements.cardId.value = String(state.snapshot.cards[0].id); importForm.requestSubmit();
  await waitFor(() => !document.querySelector('dialog'), 'Importação pela tela falhou');
  if (state.snapshot.pendingClassification.length !== 1) throw new Error('Pendência da importação não apareceu');
  document.querySelector('[data-action="classify-entry"]').click();
  const classifyForm = document.querySelector('dialog form');
  classifyForm.elements.categoryId.value = String(state.snapshot.categories.find(c => c.name === 'Lazer').id); classifyForm.requestSubmit();
  await waitFor(() => !document.querySelector('dialog'), 'Classificação pela tela falhou');
  if (state.snapshot.pendingClassification.length) throw new Error('Item classificado continuou pendente');
  document.querySelector('[data-action="import-itau"]').click();
  await waitFor(() => !!document.querySelector('dialog'), 'Segunda prévia falhou');
  importForm = document.querySelector('dialog form'); importForm.elements.cardId.value = String(state.snapshot.cards[0].id); importForm.requestSubmit();
  await waitFor(() => !document.querySelector('dialog'), 'Reimportação pela tela falhou');
  if (state.snapshot.budgetEntries.filter(e => e.description === 'Loja fictícia').length !== 1) throw new Error('Reimportação duplicou a compra');
  document.querySelector('[data-page="dashboard"]').click();
  if (!document.querySelector('.history-chart')) throw new Error('Dashboard não renderizou');
};
window.upgradeSmokeTest = async function () {
  await initialize();
  const waitFor = async (condition, message) => { for (let i = 0; i < 100; i++) { if (condition()) return; await new Promise(r => setTimeout(r, 40)); } throw new Error(message); };
  const login = document.querySelector('#auth-form');
  if (!login || state.authMode !== 'login') throw new Error('A atualização apagou o cadastro antigo');
  login.elements.username.value = 'ana'; login.elements.password.value = 'senha-antiga-123'; login.requestSubmit();
  await waitFor(() => !!document.querySelector('#month'), 'Login antigo falhou após atualização');
  document.querySelector('#month').value = '2026-09'; document.querySelector('#month').dispatchEvent(new Event('change'));
  await waitFor(() => state.snapshot.totals.expense === 12345, 'Valores antigos não foram preservados');
  if (state.snapshot.user.id !== 7 || state.snapshot.budgets[0]?.limit !== 20000 || state.snapshot.entries.find(e => e.id === 42)?.notes !== 'Não apagar') throw new Error('Cadastro, orçamento ou observações alterados');
  document.querySelector('[data-action="navigate"][data-page="entries"]').click();
  document.querySelector('[data-action="edit-entry"][data-id="42"]').click();
  const edit = document.querySelector('dialog form'); edit.requestSubmit();
  await waitFor(() => !document.querySelector('dialog'), 'Edição de lançamento antigo falhou');
  if (state.snapshot.entries.find(e => e.id === 42)?.paidDate !== '2026-09-16') throw new Error('Pagamento antigo alterado');
  document.querySelector('[data-action="new-entry"]').click();
  const parcel = document.querySelector('dialog form'); parcel.elements.paymentMethod.value = 'pix'; parcel.elements.paymentMethod.dispatchEvent(new Event('change')); parcel.elements.description.value = 'Nova compra após atualização'; parcel.elements.amount.value = '90,00'; parcel.elements.installments.value = '3'; parcel.elements.dueDate.value = '2026-10-31'; parcel.requestSubmit();
  await waitFor(() => !document.querySelector('dialog'), 'Parcelas novas falharam no banco atualizado');
  const november = await call('snapshot', '2026-11');
  if (november.totals.expense !== 3000 || november.entries[0].dueDate !== '2026-11-30') throw new Error('Parcelas futuras incorretas após migração');
  if (state.snapshot.totals.expense !== 12345 || state.snapshot.totals.income !== 300000) throw new Error('Totais antigos alterados');
  await call('exportReport', { month: state.month, format: 'csv' });
  await call('exportReport', { month: state.month, format: 'pdf' });
  document.querySelector('[data-action="navigate"][data-page="dashboard"]').click();
};
guarded(initialize);
