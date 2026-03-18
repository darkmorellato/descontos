// ============================================================
// UI.JS — Funções de Renderização e Componentes Visuais
// ============================================================

function showSyncStatus(status) {
  const el = document.getElementById('sync-status');
  if (!el) return;
  const map = {
    loading: { text: '↻ Carregando...',  color: '#d97706' },
    saving:  { text: '↑ Salvando...',    color: '#2563eb' },
    ok:      { text: '● Sincronizado',   color: '#16a34a' },
    offline: { text: '● Offline',        color: '#e53e3e' },
  };
  const s = map[status] || map.ok;
  el.textContent = s.text;
  el.style.color  = s.color;
}

function updateDate() {
  const el = document.getElementById('topbar-date');
  if (el) el.textContent = new Date().toLocaleDateString('pt-BR', {
    weekday: 'short', day: '2-digit', month: 'short', year: 'numeric'
  });
}

function showToast(msg, type = '') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast show ' + type;
  setTimeout(() => t.className = 'toast', 3000);
}

function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
}

function closeModal() {
  // Remove o foco do input ativo para esconder teclados e popups de preenchimento automático no celular
  if (document.activeElement && typeof document.activeElement.blur === 'function') {
    document.activeElement.blur();
  }
  
  const overlay = document.getElementById('modal-overlay');
  overlay.classList.remove('open');

  // Transforma a senha em campo oculto na mesma hora para o navegador não reconhecer como "Login"
  const pwdInputs = document.querySelectorAll('#modal-content input[type="password"]');
  pwdInputs.forEach(i => i.type = 'hidden');
  
  state.activeModal = null;

  // Apaga totalmente o conteúdo do modal após a animação de fechar terminar (300ms)
  setTimeout(() => {
    if (!overlay.classList.contains('open')) document.getElementById('modal-content').innerHTML = '';
  }, 300);
}

function switchView(v) {
  state.view = v;
  document.getElementById('sidebar').classList.remove('open');
  document.querySelectorAll('.view').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
  document.getElementById('view-' + v)?.classList.add('active');
  document.querySelector(`[data-view="${v}"]`)?.classList.add('active');
  const titles = {
    dashboard: 'Dashboard', funcionarios: 'Funcionários',
    registros: 'Registros', extrato: 'Extrato do Funcionário',
    novo: state.editingId ? 'Editar Desconto' : 'Novo Desconto'
  };
  document.getElementById('page-title').textContent = titles[v] || v;

  if (v === 'dashboard')     renderDashboard();
  if (v === 'funcionarios')  renderFuncionarios();
  if (v === 'extrato')       renderExtrato();
  if (v === 'registros')     renderRegistros();
  if (v === 'novo')          { if (!state.editingId) restoreDraft(); calcParcelas(); }
}

function applyMonthFilter() {
  state.monthFilter = document.getElementById('globalMonthFilter').value;
  renderAll();
}

function renderAll() {
  renderMonthFilter();
  populateFuncSelects();
  renderDashboard();
  if (state.view === 'funcionarios') renderFuncionarios();
  if (state.view === 'registros')    renderRegistros();
  if (state.view === 'extrato')      renderExtrato();
}

function renderMonthFilter() {
  const months = new Set();
  state.descontos.forEach(d => d.parcelas.forEach(p => months.add(`${p.mes}-${p.ano}`)));
  const sorted = [...months].sort((a, b) => {
    const [ma, ya] = a.split('-').map(Number);
    const [mb, yb] = b.split('-').map(Number);
    return ya !== yb ? ya - yb : ma - mb;
  });
  const sel = document.getElementById('globalMonthFilter');
  if (!sel) return;
  const cur = sel.value;
  sel.innerHTML = '<option value="">Todos</option>' +
    sorted.map(m => {
      const [mes, ano] = m.split('-').map(Number);
      return `<option value="${m}"${m === cur ? ' selected' : ''}>${MESES_LABELS[mes]} ${ano}</option>`;
    }).join('');
}

function renderDashboard() {
  const lista = getDescontosFiltrados();

  let totalVal = 0, totalPago = 0, totalPend = 0;
  lista.forEach(d => {
    const c = calcDesconto(d);
    totalVal  += c.total;
    totalPago += c.pago;
    totalPend += c.pendente;
  });

  const funcs = new Set(lista.map(d => d.funcionario));
  const pendParcelas = lista.flatMap(d =>
    d.parcelas.filter(p => !p.pago).map(p => ({ ...p, funcionario: d.funcionario, produto: d.produto, descontoId: d.id }))
  );

  document.getElementById('kpi-total').textContent = fmt(totalVal);
  document.getElementById('kpi-total-count').textContent = lista.length + ' registros';
  document.getElementById('kpi-pago').textContent = fmt(totalPago);
  const pct = totalVal > 0 ? Math.round(totalPago / totalVal * 100) : 0;
  document.getElementById('kpi-pago-pct').textContent = pct + '% quitado';
  document.getElementById('kpi-pendente').textContent = fmt(totalPend);
  document.getElementById('kpi-pendente-count').textContent = pendParcelas.length + ' parcelas';
  document.getElementById('kpi-func').textContent = funcs.size;

  renderRanking(lista);
  renderChartMonthly();
  renderPendingList(pendParcelas);

  const badge = document.getElementById('badge-pending-count');
  badge.textContent = pendParcelas.length;
}

// Dicionário de Fotos (Movido para o topo para ser acessado pelo Dashboard e Funcionários)
// O sistema aceita QUALQUER formato de imagem (.png, .jpg, .jpeg, .webp) ou links da internet.
// Basta digitar exatamente o nome do arquivo com a sua respectiva extensão.
// Exemplo: se a foto do Davison for JPG, coloque "davison.jpg". Se for PNG, "davison.png".
const FUNC_PHOTOS = {
  "ANA REINA": "fotos/anareina.png",
  "BEATRIZ GOMES": "fotos/Bia Gomes.png",
  "BIGODE": "fotos/bigode.png",
  "DAVISON": "fotos/Davison.png",
  "FABIANA": "fotos/Fabiana.png",
  "FILIPE": "fotos/Filipe.png",
  "KEMILYN": "fotos/Kemilly Giovana.png",
  "PAULINHA": "fotos/paulinha.png",
  "POLLYANA": "fotos/Pollyana Cardoso.jpg",
  "SABRINA": "fotos/Sabrina Fortunato de Almeida.jpg",
  "LIDIA GOMES": "fotos/Lidia Gomes.jpg",
};

function renderRanking(lista) {
  const map = {};
  lista.forEach(d => {
    if (!map[d.funcionario]) map[d.funcionario] = 0;
    map[d.funcionario] += d.valor;
  });
  const sorted = Object.entries(map).sort((a, b) => b[1] - a[1]);
  const max = sorted[0]?.[1] || 1;

  const el = document.getElementById('ranking-list');
  if (!sorted.length) {
    el.innerHTML = '<div class="empty-state"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg><span>Nenhum registro</span></div>';
    return;
  }

  el.innerHTML = sorted.slice(0, 8).map(([nome, val], i) => {
    const initials = nome.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
    const photoUrl = FUNC_PHOTOS[nome];
    const avatarContent = photoUrl 
      ? `<img src="${photoUrl}" alt="${esc(nome)}">` 
      : esc(initials);

    return `
    <div class="ranking-item">
      <span class="rank-pos">${i + 1}</span>
      <div class="rank-avatar">${avatarContent}</div>
      <span class="rank-name" data-nome="${esc(nome)}" onclick="openFuncModal(this.dataset.nome)">${esc(nome)}</span>
      <div class="rank-bar-wrap"><div class="rank-bar" style="width:${Math.round(val/max*100)}%"></div></div>
      <span class="rank-val">${fmt(val)}</span>
    </div>
  `}).join('');
}

function renderChartMonthly() {
  const monthData = {};
  state.descontos.forEach(d => {
    d.parcelas.forEach(p => {
      const key = `${p.mes}-${p.ano}`;
      if (!monthData[key]) monthData[key] = { label: mesLabel(p.mes, p.ano), total: 0, mes: p.mes, ano: p.ano };
      monthData[key].total += p.valor;
    });
  });

  const sorted = Object.values(monthData).sort((a, b) => {
    if (a.ano !== b.ano) return a.ano - b.ano;
    return a.mes - b.mes;
  }).slice(-10);

  const maxVal = Math.max(...sorted.map(m => m.total), 1);
  const minVal = Math.min(...sorted.map(m => m.total));
  const el = document.getElementById('chart-monthly');

  if (!sorted.length) { el.innerHTML = '<div class="empty-state">Sem dados</div>'; return; }

  const range = maxVal - minVal || 1;
  const barH = m => Math.round(((m.total - minVal) / range) * 80) + 20;

  el.innerHTML = `<div class="chart-bar-wrap">
    ${sorted.map(m => `
      <div class="chart-month-item" title="${m.label}: ${fmt(m.total)}">
        <div class="chart-bar" style="height:${barH(m)}px"></div>
        <span class="chart-month-label">${m.label}</span>
        <span class="chart-month-val">${fmt(m.total).replace('R$ ', '')}</span>
      </div>
    `).join('')}
  </div>`;
}

function renderPendingList(pendParcelas) {
  const el = document.getElementById('pending-list');
  if (!pendParcelas.length) {
    el.innerHTML = '<div class="empty-state"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M5 12l5 5L20 7"/></svg><span>Tudo em dia!</span></div>';
    return;
  }
  const sorted = [...pendParcelas].sort((a, b) => {
    if (a.ano !== b.ano) return a.ano - b.ano;
    return a.mes - b.mes;
  });
  el.innerHTML = sorted.map(p => {
    const vencida = isVencida(p);
    return `
    <div class="pending-item${vencida ? ' overdue' : ''}">
      <span class="pending-func">${esc(p.funcionario)}</span>
      <span class="pending-produto" title="${esc(p.produto)}">${esc(p.produto)}</span>
      <span class="pending-mes">${mesLabel(p.mes, p.ano)}${vencida ? ' <span class="badge-overdue">Vencida</span>' : ''}</span>
      <span class="pending-val">${fmt(p.valor)}</span>
      <button class="pending-btn-pg" onclick="promptPagamento('${p.descontoId}', ${p.mes}, ${p.ano})">✓ Pagar</button>
    </div>`;
  }).join('');
}

function buildFuncCard([nome, descontos, stats]) {
  const { total, pago, pend } = stats;
  const hasPend = pend > 0;
  const progW = total > 0 ? Math.round(pago / total * 100) : 0;
  const initials = nome.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

  const photoUrl = FUNC_PHOTOS[nome];
  const avatarContent = photoUrl 
    ? `<img src="${photoUrl}" alt="${esc(nome)}">` 
    : esc(initials);

  return `
    <div class="func-card ${hasPend ? 'has-pending' : 'all-paid'}" data-nome="${esc(nome)}" onclick="openFuncModal(this.dataset.nome)">
      <div class="func-avatar">${avatarContent}</div>
      <div class="func-name">${esc(nome)}</div>
      <div class="func-count">${descontos.length} produto(s)</div>
      <div class="func-stats">
        <div class="func-stat"><div class="func-stat-label">Total</div><div class="func-stat-val total">${fmt(total)}</div></div>
        <div class="func-stat"><div class="func-stat-label">Pago</div><div class="func-stat-val pago">${fmt(pago)}</div></div>
        <div class="func-stat"><div class="func-stat-label">Pendente</div><div class="func-stat-val pendente">${fmt(pend)}</div></div>
      </div>
      <div class="func-progress"><div class="func-progress-fill" style="width:${progW}%"></div></div>
    </div>
  `;
}

function renderFuncionarios() {
  const search = (document.getElementById('search-func')?.value || '').toLowerCase();
  const statusF = document.getElementById('filter-status')?.value || '';
  const funcMap = getFuncionarios();

  let entries = Object.entries(funcMap).filter(([nome]) => nome.toLowerCase().includes(search));

  // Mapeia os dados para incluir as estatísticas (stats) que o cartão precisa para ser desenhado
  entries = entries.map(([nome, descontos]) => {
    let total = 0, pago = 0, pend = 0;
    descontos.forEach(d => { const c = calcDesconto(d); total += c.total; pago += c.pago; pend += c.pendente; });
    return [nome, descontos, { total, pago, pend }];
  });

  const el = document.getElementById('func-grid');

  const hasPendFn = ([, , stats]) => stats.pend > 0;
  const allPaidFn = ([, , stats]) => stats.pend === 0;

  if (statusF === 'ativo' || statusF === 'quitado') {
    const filtered = statusF === 'ativo'
      ? entries.filter(hasPendFn)
      : entries.filter(allPaidFn);
    if (!filtered.length) {
      el.innerHTML = '<div class="empty-state" style="grid-column:1/-1"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg><span>Nenhum funcionário encontrado</span></div>';
      return;
    }
    el.innerHTML = filtered.map(buildFuncCard).join('');
    return;
  }

  const pendentes = entries.filter(hasPendFn).sort((a, b) => a[0].localeCompare(b[0]));
  const quitados  = entries.filter(allPaidFn).sort((a, b) => a[0].localeCompare(b[0]));

  if (!entries.length) {
    el.innerHTML = '<div class="empty-state" style="grid-column:1/-1"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg><span>Nenhum funcionário encontrado</span></div>';
    return;
  }

  let html = '';

  if (pendentes.length) {
    html += `
      <div class="func-section-header func-section-pending">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="9"/><path d="M12 8v4M12 16h.01"/></svg>
        <span>Com pendências</span>
        <span class="func-section-count">${pendentes.length}</span>
      </div>
      ${pendentes.map(buildFuncCard).join('')}
    `;
  }

  if (quitados.length) {
    html += `
      <div class="func-section-header func-section-paid">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M5 12l5 5L20 7"/></svg>
        <span>Quitados</span>
        <span class="func-section-count">${quitados.length}</span>
      </div>
      ${quitados.map(buildFuncCard).join('')}
    `;
  }

  el.innerHTML = html;
}
const renderFuncionariosDebounced = debounce(renderFuncionarios, 300);


function buildRegistroRow(d) {
  const c = calcDesconto(d);
  const allPaid  = c.pendente === 0;
  const somePaid = c.pago > 0 && !allPaid;
  const badgeHtml = allPaid
    ? '<span class="badge badge-ok">Quitado</span>'
    : somePaid
      ? '<span class="badge badge-parcial">Parcial</span>'
      : '<span class="badge badge-pend">Pendente</span>';
  return `
    <tr>
      <td class="td-func">${esc(d.funcionario)}</td>
      <td class="td-produto" title="${esc(d.produto)}">${esc(d.produto)}</td>
      <td>${d.qtd}</td>
      <td class="td-val">${fmt(d.valor)}</td>
      <td>${esc(d.pagamento)}</td>
      <td class="td-pago">${fmt(c.pago)}</td>
      <td class="td-pend">${fmt(c.pendente)}</td>
      <td>${badgeHtml}</td>
      <td>
        <div style="display:flex;gap:6px">
          <button class="btn-icon" title="Ver detalhes" data-action="view" data-id="${d.id}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="9"/><path d="M12 8v4M12 16h.01"/></svg>
          </button>
          <button class="btn-icon edit" title="Editar" data-action="edit" data-id="${d.id}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button class="btn-icon danger" title="Excluir" data-action="delete" data-id="${d.id}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg>
          </button>
        </div>
      </td>
    </tr>`;
}

function buildRegistroTable(lista) {
  if (!lista.length) return '';
  return `
    <div class="table-wrapper">
      <table class="data-table">
        <thead>
          <tr>
            <th>Funcionário</th><th>Produto</th><th>Qtd</th><th>Valor</th>
            <th>Pagamento</th><th>Pago</th><th>Pendente</th><th>Status</th><th>Ações</th>
          </tr>
        </thead>
        <tbody>${lista.map(buildRegistroRow).join('')}</tbody>
      </table>
    </div>`;
}

function renderRegistros() {
  const search = (document.getElementById('search-reg')?.value || '').toLowerCase();
  const funcF  = document.getElementById('filter-func')?.value  || '';
  const pgF    = document.getElementById('filter-pg')?.value    || '';

  const lista = state.descontos.filter(d => {
    const matchText = d.produto.toLowerCase().includes(search) || d.funcionario.toLowerCase().includes(search);
    const matchFunc = !funcF || d.funcionario === funcF;
    const matchPg   = !pgF  || d.pagamento.includes(pgF);
    return matchText && matchFunc && matchPg;
  });

  const container = document.getElementById('registros-container');

  if (!lista.length) {
    container.innerHTML = '<div class="empty-state" style="padding:44px 0">Nenhum registro encontrado</div>';
    return;
  }

  const abertos    = lista.filter(d => calcDesconto(d).pendente > 0);
  const concluidos = lista.filter(d => calcDesconto(d).pendente === 0);

  // Otimização: Paginação Virtual para evitar travamentos de tela com milhares de nós no DOM
  const limit = state.registrosLimit || 50;
  const hasMore = lista.length > limit;
  const abertosPag = abertos.slice(0, limit);
  const limitRestante = Math.max(0, limit - abertos.length);
  const concluidosPag = concluidos.slice(0, limitRestante);

  let html = '';

  if (abertosPag.length) {
    html += `
      <div class="reg-section-header reg-section-open">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="9"/><path d="M12 8v4M12 16h.01"/></svg>
        <span>Abertos ${hasMore ? `(exibindo ${abertosPag.length} de ${abertos.length})` : ''}</span>
        <span class="reg-section-count">${abertosPag.length}</span>
      </div>
      ${buildRegistroTable(abertosPag)}`;
  }

  if (concluidosPag.length) {
    html += `
      <div class="reg-section-header reg-section-done" style="margin-top:${abertos.length ? '20px' : '0'}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M5 12l5 5L20 7"/></svg>
        <span>Concluídos ${hasMore ? `(exibindo ${concluidosPag.length} de ${concluidos.length})` : ''}</span>
        <span class="reg-section-count">${concluidosPag.length}</span>
      </div>
      ${buildRegistroTable(concluidosPag)}`;
  }

  if (hasMore) {
    html += `
      <div style="text-align: center; margin-top: 24px; margin-bottom: 24px;">
        <button class="btn-secondary" onclick="loadMoreRegistros()" style="width: 100%; max-width: 300px; margin: 0 auto; display: inline-flex; justify-content: center; border: 1px dashed var(--gb-strong);">
          ↓ Carregar Mais Registros
        </button>
      </div>`;
  }

  container.innerHTML = html;
}
const renderRegistrosDebounced = debounce(renderRegistros, 300);

function loadMoreRegistros() {
  state.registrosLimit += 50;
  renderRegistros();
}

function populateFuncSelects() {
  const funcs = [...new Set(state.descontos.map(d => d.funcionario))].sort();
  const sel1 = document.getElementById('filter-func');
  const sel2 = document.getElementById('form-func');
  const sel3 = document.getElementById('extrato-func-select');
  if (sel1) {
    const cur = sel1.value;
    sel1.innerHTML = '<option value="">Todos funcionários</option>' +
      funcs.map(f => `<option value="${esc(f)}"${f === cur ? ' selected' : ''}>${esc(f)}</option>`).join('');
  }
  if (sel2) {
    const cur = sel2.value;
    sel2.innerHTML = '<option value="">Selecionar existente...</option>' +
      funcs.map(f => `<option value="${esc(f)}"${f === cur ? ' selected' : ''}>${esc(f)}</option>`).join('');
  }
  if (sel3) {
    const cur = sel3.value;
    sel3.innerHTML = '<option value="">Selecione um funcionário...</option>' +
      funcs.map(f => `<option value="${esc(f)}"${f === cur ? ' selected' : ''}>${esc(f)}</option>`).join('');
  }
}

function calcParcelas() {
  const pagamento = document.getElementById('form-pagamento')?.value || 'INTEGRAL';
  const valor     = getValorInput();
  const customGrp = document.getElementById('parcelas-custom-group');
  const preview   = document.getElementById('parcelas-preview');

  let numParcelas = 1;
  if (pagamento === 'INTEGRAL') {
    numParcelas = 1;
    if (customGrp) customGrp.style.display = 'none';
  } else if (pagamento === 'PERSONALIZADO') {
    numParcelas = parseInt(document.getElementById('form-parcelas')?.value) || 2;
    if (customGrp) customGrp.style.display = 'flex';
  } else {
    const match = pagamento.match(/(\d+)/);
    numParcelas = match ? parseInt(match[1]) : 2;
    if (customGrp) customGrp.style.display = 'none';
  }

  if (!valor || !preview) return;

  const valorCents = toCents(valor);
  const parcelaCents = Math.floor(valorCents / numParcelas);
  const restoCents = valorCents - (parcelaCents * numParcelas);
  const { mesI, anoI } = getMesInicioInput();

  const pills = [];
  for (let i = 0; i < numParcelas; i++) {
    let mes = mesI + i;
    let ano = anoI;
    while (mes > 12) { mes -= 12; ano++; }
    let valParaEssaParcela = parcelaCents;
    if (i === numParcelas - 1) valParaEssaParcela += restoCents;
    pills.push({ mes, ano, val: fromCents(valParaEssaParcela) });
  }

  preview.innerHTML = pills.map(p => `
    <div class="parcela-pill">
      <div class="p-mes">${mesLabel(p.mes, p.ano)}</div>
      <div class="p-val">${fmt(p.val)}</div>
    </div>
  `).join('');
}

function clearForm() {
  state.editingId = null;
  clearDraft();
  ['form-func-new', 'form-produto', 'form-obs'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  const qtd = document.getElementById('form-qtd'); if (qtd) qtd.value = 1;
  const val = document.getElementById('form-valor');
  if (val) { val.value = ''; val.dataset.raw = ''; }
  document.getElementById('form-func').value = '';
  document.getElementById('form-pagamento').value = 'INTEGRAL';
  document.getElementById('parcelas-custom-group').style.display = 'none';
  document.getElementById('parcelas-preview').innerHTML = '';
  const now = new Date();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const mesInicioEl = document.getElementById('form-mes-inicio');
  if (mesInicioEl) mesInicioEl.value = `${now.getFullYear()}-${mm}-01`;

  // Restaurar título e botão
  const formTitle = document.querySelector('#view-novo .form-title');
  const saveBtn   = document.querySelector('#view-novo .btn-primary');
  if (formTitle) formTitle.textContent = 'Registrar Desconto';
  if (saveBtn) saveBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12l5 5L20 7"/></svg> Salvar Desconto';
}

function parcelaHistoricoHtml(p) {
  if (!p.historico?.length) return '';
  return `<div style="margin-top:4px;font-size:10px;color:var(--text3)">
    ${p.historico.map(h => `<span style="margin-right:8px">· ${h.data}: ${fmt(h.valor)}</span>`).join('')}
  </div>`;
}

function openFuncModal(nome) {
  state.activeModal = { type: 'func', param: nome };
  const descontos = state.descontos.filter(d => d.funcionario === nome);
  let total = 0, pago = 0, pend = 0;
  descontos.forEach(d => { const c = calcDesconto(d); total += c.total; pago += c.pago; pend += c.pendente; });

  const content = `
    <div class="modal-func-name">${esc(nome)}</div>
    <div class="modal-func-sub">${descontos.length} produto(s) registrado(s)</div>
    <div class="modal-stats">
      <div class="modal-stat"><div class="modal-stat-label">Total</div><div class="modal-stat-val" style="color:var(--text)">${fmt(total)}</div></div>
      <div class="modal-stat"><div class="modal-stat-label">Pago</div><div class="modal-stat-val" style="color:var(--green)">${fmt(pago)}</div></div>
      <div class="modal-stat"><div class="modal-stat-label">Pendente</div><div class="modal-stat-val" style="color:var(--red)">${fmt(pend)}</div></div>
    </div>
    <div class="modal-items-title">Histórico de descontos</div>
    ${descontos.map(d => {
      const c = calcDesconto(d);
      return `
        <div class="modal-item">
          <div class="modal-item-top">
            <span class="modal-item-nome">${esc(d.produto)} (x${d.qtd})</span>
            <span class="modal-item-val">${fmt(d.valor)}</span>
          </div>
          <div style="font-size:11px;color:var(--text3);margin-bottom:8px;">${esc(d.pagamento)}</div>
          <div class="modal-parcelas">
            ${d.parcelas.map(p => {
              const jaRecebido = getParcPago(p);
              const restante   = Math.max(0, p.valor - jaRecebido);
              const vencida    = isVencida(p);
              let cls, icon, label;
              if (p.pago) {
                cls = 'paid'; icon = '✓';
                label = jaRecebido !== p.valor
                  ? `${fmt(jaRecebido)} <span style="text-decoration:line-through;opacity:.45;font-size:.85em">${fmt(p.valor)}</span>`
                  : fmt(p.valor);
              } else if (jaRecebido > 0) {
                cls = 'partial'; icon = '◑';
                label = `${fmt(jaRecebido)} pago · <span style="font-weight:700">${fmt(restante)} restante</span>`;
              } else {
                cls = vencida ? 'unpaid overdue-pill' : 'unpaid'; icon = vencida ? '!' : '○';
                label = fmt(p.valor) + (vencida ? ' <span class="badge-overdue">Vencida</span>' : '');
              }
              return `
              <div class="modal-parcela ${cls}" onclick="promptPagamento('${d.id}', ${p.mes}, ${p.ano})" title="Clique para registrar pagamento">
                <div>${icon} ${mesLabel(p.mes, p.ano)} · ${label}</div>
                ${parcelaHistoricoHtml(p)}
              </div>`;
            }).join('')}
          </div>
          ${c.pendente > 0 ? `<div style="font-size:11px;color:var(--red);margin-top:8px;">Pendente: ${fmt(c.pendente)}</div>` : `<div style="font-size:11px;color:var(--green);margin-top:8px;">✓ Quitado</div>`}
        </div>
      `;
    }).join('')}
  `;
  document.getElementById('modal-content').innerHTML = content;
  document.getElementById('modal-overlay').classList.add('open');
}

function openDescontoModal(id) {
  state.activeModal = { type: 'desc', param: id };
  const d = state.descontos.find(x => x.id === id);
  if (!d) return;
  const c = calcDesconto(d);
  const content = `
    <div class="modal-func-name">${esc(d.produto)}</div>
    <div class="modal-func-sub">${esc(d.funcionario)} · ${esc(d.pagamento)}</div>
    <div class="modal-stats">
      <div class="modal-stat"><div class="modal-stat-label">Total</div><div class="modal-stat-val" style="color:var(--text)">${fmt(c.total)}</div></div>
      <div class="modal-stat"><div class="modal-stat-label">Pago</div><div class="modal-stat-val" style="color:var(--green)">${fmt(c.pago)}</div></div>
      <div class="modal-stat"><div class="modal-stat-label">Pendente</div><div class="modal-stat-val" style="color:var(--red)">${fmt(c.pendente)}</div></div>
    </div>
    <div class="modal-items-title">Parcelas (clique para alternar status)</div>
    <div class="modal-parcelas" style="flex-direction:column">
      ${d.parcelas.map(p => {
        const jaRecebido = getParcPago(p);
        const restante   = Math.max(0, p.valor - jaRecebido);
        const vencida    = isVencida(p);
        let cls, statusText, valorText;
        if (p.pago) {
          cls = 'paid'; statusText = `✓ Pago${p.dataPagamento ? ' · ' + p.dataPagamento : ''}`;
          valorText = jaRecebido !== p.valor
            ? `${fmt(jaRecebido)} <span style="text-decoration:line-through;opacity:.45;font-size:.85em">${fmt(p.valor)}</span>`
            : fmt(p.valor);
        } else if (jaRecebido > 0) {
          cls = 'partial'; statusText = '◑ Parcial';
          valorText = `${fmt(jaRecebido)} pago · <strong>${fmt(restante)} restante</strong>`;
        } else {
          cls = vencida ? 'unpaid overdue-pill' : 'unpaid';
          statusText = vencida ? '! Vencida' : '○ Pendente';
          valorText = fmt(p.valor);
        }
        return `
        <div class="modal-parcela ${cls}" onclick="promptPagamento('${d.id}', ${p.mes}, ${p.ano})" style="flex-direction:column;padding:8px 12px;align-items:flex-start">
          <div style="display:flex;justify-content:space-between;width:100%">
            <span>${mesLabel(p.mes, p.ano)}</span>
            <span>${valorText}</span>
            <span>${statusText}</span>
          </div>
          ${parcelaHistoricoHtml(p)}
        </div>`;
      }).join('')}
    </div>
    ${d.obs ? `<div style="margin-top:12px;font-size:12px;color:var(--text3)">Obs: ${esc(d.obs)}</div>` : ''}
  `;
  document.getElementById('modal-content').innerHTML = content;
  document.getElementById('modal-overlay').classList.add('open');
}

function togglePwdVisibility(inputId, btn) {
  const input = document.getElementById(inputId);
  if (!input) return;
  if (input.type === 'password') {
    input.type = 'text';
    btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`;
  } else {
    input.type = 'password';
    btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
  }
}

function renderExtrato() {
  const sel     = document.getElementById('extrato-func-select');
  const content = document.getElementById('extrato-content');
  const printBtn = document.getElementById('print-extrato-btn');
  if (!sel || !content) return;

  const nome = sel.value;
  if (!nome) {
    content.innerHTML = `
      <div class="empty-state" style="margin-top:60px">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
        <span>Selecione um funcionário para ver o extrato</span>
      </div>`;
    if (printBtn) printBtn.style.display = 'none';
    return;
  }

  const descontos = state.descontos.filter(d => d.funcionario === nome);
  if (!descontos.length) {
    content.innerHTML = `<div class="empty-state" style="margin-top:60px"><span>Nenhum registro encontrado para ${esc(nome)}</span></div>`;
    if (printBtn) printBtn.style.display = 'none';
    return;
  }

  if (printBtn) printBtn.style.display = 'flex';

  // KPI totais
  let kTotal = 0, kPago = 0, kPend = 0, kVencidas = 0;
  descontos.forEach(d => {
    const c = calcDesconto(d);
    kTotal += c.total;
    kPago  += c.pago;
    kPend  += c.pendente;
    d.parcelas.forEach(p => { if (isVencida(p)) kVencidas++; });
  });
  const progPct = kTotal > 0 ? Math.round(kPago / kTotal * 100) : 0;

  // Linha do tempo de pagamentos (todos os historico entries + dataPagamento simples)
  const timeline = [];
  descontos.forEach(d => {
    d.parcelas.forEach(p => {
      if (p.historico && p.historico.length) {
        p.historico.forEach(h => {
          timeline.push({ data: h.data, valor: h.valor, produto: d.produto, mes: p.mes, ano: p.ano });
        });
      } else if (p.pago && p.dataPagamento) {
        timeline.push({ data: p.dataPagamento, valor: getParcPago(p), produto: d.produto, mes: p.mes, ano: p.ano });
      }
    });
  });
  timeline.sort((a, b) => b.data.localeCompare(a.data));

  // HTML dos descontos
  const descontosHtml = descontos.map(d => {
    const c = calcDesconto(d);
    const allPaid    = c.pendente === 0;
    const somePaid   = c.pago > 0 && !allPaid;
    const cardCls    = allPaid ? 'extrato-desc-card paid' : (somePaid ? 'extrato-desc-card partial' : 'extrato-desc-card pending');
    const cardPct    = c.total > 0 ? Math.round(c.pago / c.total * 100) : 0;

    const parcelasRows = d.parcelas.map(p => {
      const pago     = getParcPago(p);
      const rest     = Math.max(0, p.valor - pago);
      const vencida  = isVencida(p);
      let statusHtml;
      if (p.pago)           statusHtml = `<span class="badge badge-ok">Pago</span>`;
      else if (pago > 0)    statusHtml = `<span class="badge badge-parcial">Parcial</span>`;
      else if (vencida)     statusHtml = `<span class="badge badge-pend">Vencida</span>`;
      else                  statusHtml = `<span class="badge badge-pend">Pendente</span>`;
      return `
        <tr>
          <td>${mesLabel(p.mes, p.ano)}</td>
          <td class="extrato-val">${fmt(p.valor)}</td>
          <td class="extrato-pago">${pago > 0 ? fmt(pago) : '—'}</td>
          <td class="extrato-rest">${rest > 0 ? fmt(rest) : '—'}</td>
          <td class="extrato-data">${p.dataPagamento || '—'}</td>
          <td>${statusHtml}${vencida && !p.pago ? ' <span class="badge-overdue">VENC</span>' : ''}</td>
        </tr>`;
    }).join('');

    return `
      <div class="${cardCls}">
        <div class="extrato-desc-header">
          <div>
            <div class="extrato-desc-nome">${esc(d.produto)}</div>
            <div class="extrato-desc-sub">${esc(d.pagamento)}${d.obs ? ' · ' + esc(d.obs) : ''}</div>
          </div>
          <div class="extrato-desc-vals">
            <span class="extrato-desc-total">${fmt(c.total)}</span>
            <span class="extrato-desc-prog">${cardPct}%</span>
          </div>
        </div>
        <div class="extrato-table-wrap">
          <table class="extrato-table">
            <thead><tr><th>Mês</th><th>Previsto</th><th>Pago</th><th>Restante</th><th>Data Pag.</th><th>Status</th></tr></thead>
            <tbody>${parcelasRows}</tbody>
          </table>
        </div>
      </div>`;
  }).join('');

  // HTML da linha do tempo
  const timelineHtml = timeline.length
    ? `<div class="extrato-section-title">Histórico de Pagamentos</div>
       <div class="extrato-timeline">${
         timeline.map(t => `
           <div class="extrato-tl-item">
             <div class="extrato-tl-dot"></div>
             <div class="extrato-tl-body">
               <div class="extrato-tl-top">
                 <span class="extrato-tl-produto">${esc(t.produto)}</span>
                 <span class="extrato-tl-mes">${mesLabel(t.mes, t.ano)}</span>
               </div>
               <div class="extrato-tl-bottom">
                 <span class="extrato-tl-data">${t.data}</span>
                 <span class="extrato-tl-val">${fmt(t.valor)}</span>
               </div>
             </div>
           </div>`).join('')
       }</div>`
    : '';

  content.innerHTML = `
    <div class="print-header">
      <h2>Relatório de Descontos</h2>
      <h3>Funcionário(a): ${esc(nome)}</h3>
      <p>Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</p>
    </div>

    <div class="extrato-kpi-grid">
      <div class="extrato-kpi extrato-kpi-total">
        <div class="extrato-kpi-label">Total em Descontos</div>
        <div class="extrato-kpi-value">${fmt(kTotal)}</div>
        <div class="extrato-kpi-sub">${descontos.length} produto${descontos.length !== 1 ? 's' : ''}</div>
      </div>
      <div class="extrato-kpi extrato-kpi-pago">
        <div class="extrato-kpi-label">Total Pago</div>
        <div class="extrato-kpi-value">${fmt(kPago)}</div>
        <div class="extrato-kpi-sub">${progPct}% quitado</div>
      </div>
      <div class="extrato-kpi extrato-kpi-pend">
        <div class="extrato-kpi-label">Pendente</div>
        <div class="extrato-kpi-value">${fmt(kPend)}</div>
        <div class="extrato-kpi-sub">${kVencidas > 0 ? `<span class="badge-overdue">${kVencidas} VENCIDA${kVencidas !== 1 ? 'S' : ''}</span>` : 'Em dia'}</div>
      </div>
      <div class="extrato-kpi extrato-kpi-prog">
        <div class="extrato-kpi-label">Progresso</div>
        <div class="extrato-kpi-value">${progPct}%</div>
        <div class="extrato-kpi-sub">
          <div class="extrato-prog-bar"><div class="extrato-prog-fill" style="width:${progPct}%"></div></div>
        </div>
      </div>
    </div>

    <div class="extrato-section-title">Detalhamento por Produto</div>
    ${descontosHtml}

    ${timelineHtml}
  `;
}
