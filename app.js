// ============================================================
// APP.JS — Core de Estado, Inicialização, Banco de Dados e Formulário
// ============================================================

// ── ESTADO GLOBAL ──────────────────────────────────────────
let state = {
  descontos: [],
  view: 'dashboard',
  monthFilter: '',
  editingId: null,
  registrosLimit: 50,
  activeModal: null, // Guarda a tela anterior para voltar após o pagamento parcial
};

const STORAGE_KEY = 'miplace_descontos_v2';
const DRAFT_KEY   = 'miplace_form_draft';
const SAFE_INITIAL_DATA = typeof INITIAL_DATA !== 'undefined' ? INITIAL_DATA : [];

// ── INIT ───────────────────────────────────────────────────
async function init() {
  showSyncStatus('loading');

  try {
    const firestoreData = await fbLoad();
    if (firestoreData !== null) {
      state.descontos = firestoreData;
      lsSet(state.descontos);
    } else {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try { state.descontos = JSON.parse(saved); }
        catch { state.descontos = [...SAFE_INITIAL_DATA]; }
      } else {
        state.descontos = [...SAFE_INITIAL_DATA];
      }
      await fbSaveAll(state.descontos);
    }
    showSyncStatus('ok');

    fbListen(descontos => {
      state.descontos = descontos;
      lsSet(descontos);
      renderAll();
      showSyncStatus('ok');
    });
  } catch (err) {
    console.error('Firebase indisponível, usando cache local:', err.code || err.message || err);
    if (err.code === 'permission-denied') {
      alert('🔴 ERRO DE PERMISSÃO (FIREBASE RULES):\n\nO sistema conseguiu logar, mas o banco de dados bloqueou a leitura.\nPor favor, atualize as "Regras" do Firestore no painel do Firebase.');
      showToast('Permissão negada no Firestore', 'error');
    }
    showSyncStatus('offline');
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try { state.descontos = JSON.parse(saved); }
      catch { state.descontos = [...SAFE_INITIAL_DATA]; }
    } else {
      state.descontos = [...SAFE_INITIAL_DATA];
    }
  }

  addEventListeners();

  const now = new Date();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const mesInicioEl = document.getElementById('form-mes-inicio');
  if (mesInicioEl) mesInicioEl.value = `${now.getFullYear()}-${mm}-01`;

  // Como a interface atualiza apenas a data do dia (sem segundos/minutos), 
  // não precisamos rodar a cada 1 segundo. Rodar a cada 1 hora é super eficiente.
  setInterval(updateDate, 3600000); 
  updateDate();
  renderMonthFilter();
  renderAll();
}

function addEventListeners() {
  // Navegação
  document.querySelector('.sidebar-nav')?.addEventListener('click', e => {
    const navItem = e.target.closest('.nav-item');
    if (navItem && navItem.dataset.view) {
      switchView(navItem.dataset.view);
    }
  });
  document.getElementById('logout-btn')?.addEventListener('click', handleLogout);
  document.getElementById('sidebar-toggle-btn')?.addEventListener('click', toggleSidebar);
  document.getElementById('theme-toggle-btn')?.addEventListener('click', toggleTheme);

  // Ações globais
  document.getElementById('globalMonthFilter')?.addEventListener('change', applyMonthFilter);
  document.getElementById('import-btn')?.addEventListener('click', importData);
  document.getElementById('export-btn')?.addEventListener('click', exportData);
  document.getElementById('import-file-input')?.addEventListener('change', handleImport);

  // Filtros de view
  document.getElementById('search-func')?.addEventListener('input', renderFuncionariosDebounced);
  document.getElementById('filter-status')?.addEventListener('change', renderFuncionarios);
  document.getElementById('search-reg')?.addEventListener('input', () => { state.registrosLimit = 50; renderRegistrosDebounced(); });
  document.getElementById('filter-func')?.addEventListener('change', () => { state.registrosLimit = 50; renderRegistros(); });
  document.getElementById('filter-pg')?.addEventListener('change', () => { state.registrosLimit = 50; renderRegistros(); });
  document.getElementById('extrato-func-select')?.addEventListener('change', renderExtrato);
  document.getElementById('print-extrato-btn')?.addEventListener('click', () => window.print());

  // Formulário
  document.getElementById('novo-desconto-form')?.addEventListener('submit', (e) => { e.preventDefault(); saveDesconto(); });
  document.getElementById('clear-form-btn')?.addEventListener('click', clearForm);
  document.getElementById('form-valor')?.addEventListener('input', () => { maskCurrency(document.getElementById('form-valor')); calcParcelas(); });
  document.getElementById('form-pagamento')?.addEventListener('change', calcParcelas);
  document.getElementById('form-parcelas')?.addEventListener('input', calcParcelas);
  document.getElementById('form-mes-inicio')?.addEventListener('change', calcParcelas);
  
  // Rascunho do formulário
  ['form-func', 'form-func-new', 'form-produto', 'form-qtd', 'form-valor', 'form-pagamento', 'form-parcelas', 'form-mes-inicio', 'form-obs']
    .forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('input', saveDraft);
      el.addEventListener('change', saveDraft);
    });

  // Modal
  document.getElementById('modal-overlay')?.addEventListener('click', closeModal);
  document.getElementById('modal-container')?.addEventListener('click', e => e.stopPropagation());
  document.getElementById('modal-close-btn')?.addEventListener('click', closeModal);

  // Delegação de eventos (já estava bom, mas centralizando aqui)
  document.getElementById('registros-container')?.addEventListener('click', e => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    const action = btn.dataset.action;
    const id = btn.dataset.id;
    if (action === 'view') openDescontoModal(id);
    if (action === 'edit') promptEditDesconto(id);
    if (action === 'delete') deleteDesconto(id);
  });
}

function saveDesconto() {
  const funcSel  = document.getElementById('form-func').value.trim();
  const funcNew  = document.getElementById('form-func-new').value.trim().toUpperCase();
  const func     = funcNew || funcSel;
  const produto  = document.getElementById('form-produto').value.trim();
  const qtd      = parseInt(document.getElementById('form-qtd').value) || 1;
  const valor    = getValorInput();
  const pagamento = document.getElementById('form-pagamento').value;
  const obs      = document.getElementById('form-obs').value.trim();

  if (!func) { showToast('Selecione ou informe o funcionário', 'error'); return; }
  if (!produto) { showToast('Informe o produto', 'error'); return; }
  if (!valor || valor <= 0) { showToast('Informe o valor', 'error'); return; }

  let numParcelas = 1;
  if (pagamento === 'PERSONALIZADO') {
    numParcelas = parseInt(document.getElementById('form-parcelas')?.value) || 2;
  } else if (pagamento !== 'INTEGRAL') {
    const match = pagamento.match(/(\d+)/);
    numParcelas = match ? parseInt(match[1]) : 2;
  }

  const valorCents = toCents(valor);
  const parcelaCents = Math.floor(valorCents / numParcelas);
  const restoCents = valorCents - (parcelaCents * numParcelas);
  const { mesI, anoI } = getMesInicioInput();

  const parcelas = [];
  for (let i = 0; i < numParcelas; i++) {
    let mes = mesI + i, ano = anoI;
    while (mes > 12) { mes -= 12; ano++; }
    let valParaEssaParcela = parcelaCents;
    if (i === numParcelas - 1) valParaEssaParcela += restoCents;
    parcelas.push({ mes, ano, label: mesLabel(mes, ano), valor: fromCents(valParaEssaParcela), pago: false });
  }

  if (state.editingId) {
    const idx = state.descontos.findIndex(x => x.id === state.editingId);
    if (idx !== -1) {
      const oldDesc = state.descontos[idx];
      
      const mergedParcelas = parcelas.map((newP, i) => {
        let oldP = oldDesc.parcelas.find(p => p.mes === newP.mes && p.ano === newP.ano) || oldDesc.parcelas[i];
        if (oldP && (oldP.pago || oldP.valorPago > 0)) {
          const vp = oldP.valorPago !== undefined ? oldP.valorPago : (oldP.pago ? oldP.valor : 0);
          return {
            ...newP,
            valorPago: vp,
            pago: vp >= newP.valor,
            historico: oldP.historico,
            dataPagamento: oldP.dataPagamento
          };
        }
        return newP;
      });

      state.descontos[idx] = { id: state.editingId, funcionario: func, produto, qtd, valor, pagamento, obs, parcelas: mergedParcelas };
      persist();
      syncItem(state.descontos[idx]);
    }
    clearForm();
    populateFuncSelects();
    renderAll();
    showToast('Desconto atualizado com sucesso!', 'success');
    switchView('registros');
    return;
  }

  const desconto = { id: genId(), funcionario: func, produto, qtd, valor, pagamento, obs, parcelas };
  state.descontos.push(desconto);
  persist();
  syncItem(desconto);
  populateFuncSelects();
  renderAll();
  clearForm();
  showToast('Desconto registrado com sucesso!', 'success');
  switchView('registros');
}

// ── 7. PERSIST — LOCAL + FIREBASE ─────────────────────────
function lsSet(descontos) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(descontos)); } catch (err) { console.warn('Erro ao salvar no localStorage:', err); }
}

function persist() {
  lsSet(state.descontos);
}

async function syncItem(desconto) {
  showSyncStatus('saving');
  try { await fbSaveItem(desconto); showSyncStatus('ok'); }
  catch (err) { console.error('Erro no Firebase:', err); showSyncStatus('offline'); }
}

async function syncDelete(id) {
  showSyncStatus('saving');
  try { await fbDeleteItem(id); showSyncStatus('ok'); }
  catch (err) { console.error('Erro no Firebase:', err); showSyncStatus('offline'); }
}

async function syncAll() {
  showSyncStatus('saving');
  try { await fbSaveAll(state.descontos); showSyncStatus('ok'); }
  catch (err) { console.error('Erro no Firebase:', err); showSyncStatus('offline'); }
}

// ── RASCUNHO DO FORMULÁRIO ────────────────────────────────
function saveDraft() {
  if (state.editingId) return;
  const val = document.getElementById('form-valor');
  const draft = {
    funcSel:      document.getElementById('form-func')?.value        || '',
    funcNew:      document.getElementById('form-func-new')?.value    || '',
    produto:      document.getElementById('form-produto')?.value     || '',
    qtd:          document.getElementById('form-qtd')?.value         || '1',
    valorRaw:     val?.dataset.raw                                   || '',
    valorDisplay: val?.value                                         || '',
    pagamento:    document.getElementById('form-pagamento')?.value   || 'INTEGRAL',
    parcelas:     document.getElementById('form-parcelas')?.value    || '2',
    mesInicio:    document.getElementById('form-mes-inicio')?.value  || '',
    obs:          document.getElementById('form-obs')?.value         || '',
  };
  try { localStorage.setItem(DRAFT_KEY, JSON.stringify(draft)); } catch (err) { console.warn('Erro ao salvar rascunho:', err); }
}

function restoreDraft() {
  if (state.editingId) return;
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return;
    const d = JSON.parse(raw);
    if (d.funcSel)  { const el = document.getElementById('form-func');       if (el) el.value = d.funcSel; }
    if (d.funcNew)  { const el = document.getElementById('form-func-new');   if (el) el.value = d.funcNew; }
    if (d.produto)  { const el = document.getElementById('form-produto');    if (el) el.value = d.produto; }
    if (d.qtd)      { const el = document.getElementById('form-qtd');        if (el) el.value = d.qtd; }
    if (d.valorRaw) {
      const el = document.getElementById('form-valor');
      if (el) { el.dataset.raw = d.valorRaw; el.value = d.valorDisplay; }
    }
    if (d.pagamento) { const el = document.getElementById('form-pagamento');  if (el) el.value = d.pagamento; }
    if (d.parcelas)  { const el = document.getElementById('form-parcelas');   if (el) el.value = d.parcelas; }
    if (d.mesInicio) { const el = document.getElementById('form-mes-inicio'); if (el) el.value = d.mesInicio; }
    if (d.obs)       { const el = document.getElementById('form-obs');        if (el) el.value = d.obs; }
  } catch (err) { console.warn('Erro ao restaurar rascunho:', err); }
}

function clearDraft() {
  try { localStorage.removeItem(DRAFT_KEY); } catch (err) { console.warn('Erro ao limpar rascunho:', err); }
}

// ── MODAL DE SENHA PARA EDITAR ─────────────────────────────
function promptEditDesconto(id) {
  const content = `
    <div class="modal-func-name" style="color:var(--accent)">Editar Registro</div>
    <div style="margin-bottom:20px;color:var(--text2);font-size:13px;">Para editar este registro, insira a senha de administrador.</div>
    <div class="form-group" style="margin-bottom:16px;">
      <label>Senha do Administrador</label>
      <input type="password" id="edit-pwd-input" class="text-input" placeholder="Digite a senha..." autofocus>
      <div id="edit-pwd-error" style="color:var(--red);font-size:11px;margin-top:4px;"></div>
    </div>
    <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:20px;">
      <button class="btn-secondary" onclick="closeModal()">Cancelar</button>
      <button class="btn-primary" onclick="confirmEditWithPwd('${id}')">Acessar</button>
    </div>
  `;
  document.getElementById('modal-content').innerHTML = content;
  document.getElementById('modal-overlay').classList.add('open');
  
  const input = document.getElementById('edit-pwd-input');
  if (input) {
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') confirmEditWithPwd(id);
    });
  }
  setTimeout(() => input?.focus(), 100);
}

async function confirmEditWithPwd(id) {
  const input = document.getElementById('edit-pwd-input');
  if (!input) return;
  
  const btn = document.querySelector('#modal-content .btn-primary');
  if (btn) { btn.textContent = 'Verificando...'; btn.disabled = true; }

  const realPassword = await fbGetAdminPassword();
  const inputHash = await gerarHash(input.value);

  if (!realPassword || inputHash !== realPassword) {
    document.getElementById('edit-pwd-error').textContent = 'Senha incorreta.';
    input.focus();
    if (btn) { btn.textContent = 'Acessar'; btn.disabled = false; }
    return;
  }
  
  closeModal();
  editDesconto(id);
}

// ── 3. EDITAR DESCONTO ────────────────────────────────────
function editDesconto(id) {
  const d = state.descontos.find(x => x.id === id);
  if (!d) return;
  state.editingId = id;

  // Preencher formulário
  const funcSel = document.getElementById('form-func');
  const funcNew = document.getElementById('form-func-new');
  const opts = [...funcSel.options].map(o => o.value);
  if (opts.includes(d.funcionario)) {
    funcSel.value = d.funcionario;
    funcNew.value = '';
  } else {
    funcSel.value = '';
    funcNew.value = d.funcionario;
  }

  document.getElementById('form-produto').value = d.produto;
  document.getElementById('form-qtd').value = d.qtd;
  const valorEl = document.getElementById('form-valor');
  valorEl.dataset.raw = d.valor.toFixed(2);
  valorEl.value = 'R$ ' + d.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  document.getElementById('form-obs').value = d.obs || '';

  // Tratar forma de pagamento
  const pagSel = document.getElementById('form-pagamento');
  const pagOpts = [...pagSel.options].map(o => o.value);
  if (pagOpts.includes(d.pagamento)) {
    pagSel.value = d.pagamento;
  } else {
    pagSel.value = 'PERSONALIZADO';
    document.getElementById('form-parcelas').value = d.parcelas.length;
  }

  // Data inicial
  const first = d.parcelas[0];
  if (first) {
    const mm = String(first.mes).padStart(2, '0');
    document.getElementById('form-mes-inicio').value = `${first.ano}-${mm}-01`;
  }

  // Atualizar título e botão do form
  const formTitle = document.querySelector('#view-novo .form-title');
  const saveBtn   = document.querySelector('#view-novo .btn-primary');
  if (formTitle) formTitle.textContent = 'Editar Desconto';
  if (saveBtn) saveBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12l5 5L20 7"/></svg> Salvar Alterações';

  calcParcelas();
  switchView('novo');
  showToast('Registro carregado para edição', 'success');
}

// ── PAGAMENTO (TOTAL OU PARCIAL) ──────────────────────────
function promptPagamento(descontoId, mes, ano) {
  const d = state.descontos.find(x => x.id === descontoId);
  const p = d?.parcelas.find(p => p.mes === mes && p.ano === ano);
  if (!p) return;

  if (p.pago && !p.valorPago) {
    promptResetParcela(descontoId, mes, ano);
    return;
  }

  const jaPago = getParcPago(p);
  const restante = p.valor - jaPago;

  if (p.pago) {
     promptResetParcela(descontoId, mes, ano);
     return;
  }

  const content = `
    <div class="modal-func-name" style="color:var(--green)">Registrar Pagamento</div>
    <div style="margin-bottom:20px;color:var(--text2);font-size:13px;">
      Produto: <strong>${esc(d.produto)}</strong><br>
      Parcela: <strong>${mesLabel(mes, ano)}</strong><br>
      Total: <strong>${fmt(p.valor)}</strong> ${jaPago > 0 ? `(Já recebido: ${fmt(jaPago)})` : ''}
    </div>
    <div class="form-group" style="margin-bottom:16px;">
      <label>Valor Recebido (R$)</label>
      <input type="number" id="confirm-valor-pago" class="text-input" step="0.01" value="${restante.toFixed(2)}" autofocus>
      <div style="font-size:11px;color:var(--text3);margin-top:6px;">Insira o valor pago. Ele abaterá do restante da parcela.</div>
    </div>
    <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:24px;">
      ${jaPago > 0 ? `<button type="button" class="btn-secondary" style="margin-right:auto;color:var(--red);border-color:rgba(248,113,113,.3)" onclick="promptResetParcela('${descontoId}', ${mes}, ${ano})">Zerar</button>` : ''}
      <button type="button" class="btn-secondary" onclick="restoreModalContext()">Cancelar</button>
      <button type="button" class="btn-primary" style="background:var(--green);box-shadow:0 4px 16px var(--green-glow)" onclick="doConfirmPagamento('${descontoId}', ${mes}, ${ano})">Salvar</button>
    </div>
  `;

  document.getElementById('modal-content').innerHTML = content;
  document.getElementById('modal-overlay').classList.add('open');
  
  const input = document.getElementById('confirm-valor-pago');
  if (input) input.addEventListener('keydown', e => { if (e.key === 'Enter') doConfirmPagamento(descontoId, mes, ano); });
  setTimeout(() => { if (input) { input.focus(); input.select(); } }, 100);
}

function restoreModalContext() {
  if (state.activeModal) {
    if (state.activeModal.type === 'func') openFuncModal(state.activeModal.param);
    else if (state.activeModal.type === 'desc') openDescontoModal(state.activeModal.param);
  } else {
    closeModal();
  }
}

// ── DESFAZER PAGAMENTO (SENHA) ─────────────────────────────
function promptResetParcela(descontoId, mes, ano) {
  const content = `
    <div class="modal-func-name" style="color:var(--red)">Desfazer Pagamento</div>
    <div style="margin-bottom:20px;color:var(--text2);font-size:13px;">Tem certeza que deseja desfazer os pagamentos desta parcela e marcá-la como PENDENTE? Esta ação exige senha de administrador.</div>
    <div class="form-group" style="margin-bottom:16px;">
      <label>Senha do Administrador</label>
      <div style="position: relative;">
        <input type="password" id="reset-pwd-input" class="text-input" placeholder="Digite a senha..." autocomplete="new-password" autofocus style="width: 100%; padding-right: 36px;">
        <button type="button" id="reset-toggle-pwd" style="position: absolute; right: 8px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; color: var(--text3); padding: 4px; display: flex; align-items: center;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
        </button>
      </div>
      <div id="reset-pwd-error" style="color:var(--red);font-size:11px;margin-top:4px;"></div>
    </div>
    <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:20px;">
      <button type="button" class="btn-secondary" onclick="restoreModalContext()">Cancelar</button>
      <button type="button" class="btn-primary" style="background:var(--red);box-shadow:0 4px 16px var(--red-glow)" onclick="confirmResetWithPwd('${descontoId}', ${mes}, ${ano})">Desfazer</button>
    </div>
  `;
  document.getElementById('modal-content').innerHTML = content;
  document.getElementById('modal-overlay').classList.add('open');
  
  const input = document.getElementById('reset-pwd-input');
  if (input) {
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') confirmResetWithPwd(descontoId, mes, ano);
    });
  }
  document.getElementById('reset-toggle-pwd')?.addEventListener('click', (e) => togglePwdVisibility('reset-pwd-input', e.currentTarget));
  setTimeout(() => input?.focus(), 100);
}

async function confirmResetWithPwd(descontoId, mes, ano) {
  const input = document.getElementById('reset-pwd-input');
  if (!input) return;
  
  const btn = document.querySelector('#modal-content .btn-primary');
  if (btn) { btn.textContent = 'Verificando...'; btn.disabled = true; }

  const realPassword = await fbGetAdminPassword();
  const inputHash = await gerarHash(input.value);

  if (!realPassword || inputHash !== realPassword) {
    document.getElementById('reset-pwd-error').textContent = 'Senha incorreta.';
    input.focus();
    if (btn) { btn.textContent = 'Desfazer'; btn.disabled = false; }
    return;
  }
  
  doResetParcela(descontoId, mes, ano);
}

// ── 2. HISTORICO + 6. DATA DE PAGAMENTO ───────────────────
function doConfirmPagamento(descontoId, mes, ano) {
  try {
    const inp = document.getElementById('confirm-valor-pago');
    
    // Previne falha caso o teclado do celular ou PC injete vírgula em vez de ponto
    const valStr = inp ? inp.value.replace(',', '.') : '';
    const novoPagamento = parseFloat(valStr);
    
    if (isNaN(novoPagamento) || novoPagamento <= 0) { showToast('Informe um valor válido', 'error'); return; }

    // Chama a nova tela visual de confirmação ao invés do alerta nativo do navegador
    promptConfirmarPagamento(descontoId, mes, ano, novoPagamento);
  } catch (err) {
    console.error("Erro interno ao salvar pagamento:", err);
    alert("Ops! Um erro impediu o salvamento: " + err.message);
  }
}

function promptConfirmarPagamento(descontoId, mes, ano, valor) {
  const d = state.descontos.find(x => x.id === descontoId);
  const p = d?.parcelas.find(p => p.mes === mes && p.ano === ano);
  if (!p) return;

  const content = `
    <div class="modal-func-name" style="color:var(--accent)">Confirmar Pagamento</div>
    <div style="margin-bottom:20px;color:var(--text2);font-size:14px;line-height:1.5;">
      Deseja realmente registrar este pagamento no valor de <strong style="color:var(--green);font-size:16px;">${fmt(valor)}</strong> para o produto <strong>${esc(d.produto)}</strong>?
    </div>
    <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:24px;">
      <button type="button" class="btn-secondary" onclick="promptPagamento('${descontoId}', ${mes}, ${ano})">Voltar</button>
      <button type="button" id="btn-confirmar-pgto" class="btn-primary" style="background:var(--green);box-shadow:0 4px 16px var(--green-glow)" onclick="finalizePagamento('${descontoId}', ${mes}, ${ano}, ${valor})">Confirmar</button>
    </div>
  `;
  document.getElementById('modal-content').innerHTML = content;
  
  // Foca no botão automaticamente para permitir que a tecla 'Enter' confirme rápido
  setTimeout(() => document.getElementById('btn-confirmar-pgto')?.focus(), 100);
}

function finalizePagamento(descontoId, mes, ano, novoPagamento) {
  try {
    const d = state.descontos.find(x => x.id === descontoId);
    const p = d?.parcelas.find(p => p.mes === mes && p.ano === ano);
    if (!p) return;

    const atualCents = toCents(getParcPago(p));
    const novoPgtoCents = toCents(novoPagamento);
    const novoTotalCents = atualCents + novoPgtoCents;

    p.valorPago = fromCents(novoTotalCents);
    p.pago = novoTotalCents >= toCents(p.valor);

    if (!p.historico) p.historico = [];
    
    const dataHoje = new Date().toLocaleDateString('pt-BR');
    p.historico.push({ data: dataHoje, valor: fromCents(novoPgtoCents) });
    if (p.pago) p.dataPagamento = dataHoje;

    persist();
    syncItem(d);
    renderAll();

    restoreModalContext();

    if (p.pago) {
      showToast(`Parcela quitada! Total recebido: ${fmt(p.valorPago)}`, 'success');
    } else {
      const restante = p.valor - p.valorPago;
      showToast(`${fmt(novoPagamento)} registrado · Restante: ${fmt(restante)}`, 'success');
    }
  } catch (err) {
    console.error("Erro interno ao finalizar pagamento:", err);
    alert("Ops! Um erro impediu o salvamento: " + err.message);
  }
}

function doResetParcela(descontoId, mes, ano) {
  const d = state.descontos.find(x => x.id === descontoId);
  const p = d?.parcelas.find(p => p.mes === mes && p.ano === ano);
  if (!p) return;
  p.pago = false;
  delete p.valorPago;
  delete p.historico;
  delete p.dataPagamento;
  persist();
  syncItem(d);
  renderAll();
  restoreModalContext();
  showToast('Pagamento zerado — parcela marcada como pendente', 'success');
}

// ── DELETE ────────────────────────────────────────────────
function deleteDesconto(id) {
  const content = `
    <div class="modal-func-name" style="color:var(--red)">Excluir Registro</div>
    <div style="margin-bottom:20px;color:var(--text2);font-size:13px;">Tem certeza que deseja excluir permanentemente este desconto? Esta ação exige senha de administrador.</div>
    <div class="form-group" style="margin-bottom:16px;">
      <label>Senha do Administrador</label>
      <input type="password" id="delete-pwd-input" class="text-input" placeholder="Digite a senha..." autocomplete="new-password" autofocus>
      <div id="delete-pwd-error" style="color:var(--red);font-size:11px;margin-top:4px;"></div>
    </div>
    <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:20px;">
      <button type="button" class="btn-secondary" onclick="closeModal()">Cancelar</button>
      <button type="button" class="btn-primary" style="background:var(--red);box-shadow:0 4px 16px var(--red-glow)" onclick="confirmDeleteWithPwd('${id}')">Excluir</button>
    </div>
  `;
  document.getElementById('modal-content').innerHTML = content;
  document.getElementById('modal-overlay').classList.add('open');
  
  const input = document.getElementById('delete-pwd-input');
  if (input) {
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') confirmDeleteWithPwd(id);
    });
  }
  setTimeout(() => input?.focus(), 100);
}

async function confirmDeleteWithPwd(id) {
  const input = document.getElementById('delete-pwd-input');
  if (!input) return;
  
  const btn = document.querySelector('#modal-content .btn-primary');
  if (btn) { btn.textContent = 'Verificando...'; btn.disabled = true; }

  const realPassword = await fbGetAdminPassword();
  const inputHash = await gerarHash(input.value);

  if (!realPassword || inputHash !== realPassword) {
    document.getElementById('delete-pwd-error').textContent = 'Senha incorreta.';
    input.focus();
    if (btn) { btn.textContent = 'Excluir'; btn.disabled = false; }
    return;
  }
  closeModal();
  state.descontos = state.descontos.filter(d => d.id !== id);
  persist();
  syncDelete(id);
  populateFuncSelects();
  renderAll();
  showToast('Registro excluído', 'success');
}

// ── EXPORT JSON ───────────────────────────────────────────
function exportData() {
  const json = JSON.stringify({ exportedAt: new Date().toISOString(), descontos: state.descontos }, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url;
  a.download = `miplace_descontos_${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('JSON exportado com sucesso!', 'success');
}

// ── 4. IMPORT JSON ────────────────────────────────────────
function importData() {
  document.getElementById('import-file-input').click();
}

function handleImport(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    try {
      const parsed = JSON.parse(ev.target.result);
      const descontos = Array.isArray(parsed) ? parsed : (parsed.descontos || null);
      if (!Array.isArray(descontos)) throw new Error('formato inválido');
      
      // Proteção de Cota do Firebase: Interrompe importações excessivas acidentais
      if (descontos.length > 500) {
        if (!confirm(`ATENÇÃO: Você está prestes a importar ${descontos.length} registros.\n\nIsso consumirá uma parte considerável da sua cota diária gratuita do Firebase (limite de 20.000 gravações por dia).\n\nDeseja continuar?`)) {
          e.target.value = '';
          return;
        }
      }

      state.descontos = descontos;
      persist();
      syncAll();
      populateFuncSelects();
      renderAll();
      showToast(`${descontos.length} registros importados com sucesso!`, 'success');
    } catch {
      showToast('Arquivo inválido — verifique o JSON', 'error');
    }
    e.target.value = '';
  };
  reader.readAsText(file);
}

// ── AUTHENTICATION ─────────────────────────────────────────
let appInitialized = false;

// Ativa os botões da tela de login imediatamente assim que a página carrega
document.getElementById('login-form')?.addEventListener('submit', handleLogin);
document.getElementById('login-toggle-pwd')?.addEventListener('click', (e) => togglePwdVisibility('login-password', e.currentTarget));

// Adicionamos uma verificação de segurança para o auth
if (typeof auth !== 'undefined' && auth !== null) {
  auth.onAuthStateChanged(user => {
    const loginScreen = document.getElementById('login-screen');
    const appScreen = document.getElementById('app');
    
    if (user) {
      loginScreen.style.display = 'none';
      appScreen.style.display = 'flex';
      // Inicia a aplicação apenas na primeira vez que logar
      if (!appInitialized) {
        init();
        appInitialized = true;
      }
    } else {
      loginScreen.style.display = 'flex';
      appScreen.style.display = 'none';
    }
  });
} else {
  const errEl = document.getElementById('login-error');
  if (errEl) errEl.innerHTML = '<b>Erro de Configuração:</b> Firebase não conectado. Verifique as chaves.';
}

async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('login-email').value;
  const pass  = document.getElementById('login-password').value;
  const btn   = document.getElementById('login-btn');
  const errEl = document.getElementById('login-error');
  
  btn.textContent = 'Autenticando...';
  btn.disabled = true;
  errEl.textContent = '';

  try {
    await auth.signInWithEmailAndPassword(email, pass);
  } catch (err) {
    console.error(err);
    
    // Mensagens detalhadas para facilitar a correção
    if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
      errEl.textContent = 'E-mail ou senha incorretos.';
    } else if (err.code === 'auth/operation-not-allowed') {
      errEl.textContent = 'Erro: O login por E-mail/Senha não está ativado no painel do Firebase.';
    } else if (err.code === 'auth/invalid-email') {
      errEl.textContent = 'Erro: O formato do e-mail digitado é inválido.';
    } else if (err.code === 'auth/too-many-requests') {
      errEl.textContent = 'Muitas tentativas falhas. Conta bloqueada temporariamente. Tente mais tarde.';
    } else if (err.code === 'auth/network-request-failed') {
      errEl.textContent = 'Erro de rede: Verifique sua conexão com a internet ou firewall.';
    } else if (err instanceof TypeError) {
      errEl.textContent = 'Erro de conexão: O Firebase não iniciou corretamente.';
    } else {
      errEl.textContent = 'Falha: ' + (err.code || err.message);
    }
    
    btn.textContent = 'Entrar';
    btn.disabled = false;
  }
}

async function handleLogout() {
  await auth.signOut();
}

// ── THEME (DARK MODE) ─────────────────────────────────────
function initTheme() {
  const savedTheme = localStorage.getItem('miplace_theme');
  if (savedTheme === 'dark') {
    document.body.classList.add('dark-theme');
    updateThemeIcon(true);
  }
}

function toggleTheme() {
  const isDark = document.body.classList.toggle('dark-theme');
  localStorage.setItem('miplace_theme', isDark ? 'dark' : 'light');
  updateThemeIcon(isDark);
}

function updateThemeIcon(isDark) {
  const moon = document.getElementById('theme-icon-moon');
  const sun = document.getElementById('theme-icon-sun');
  if (moon && sun) { moon.style.display = isDark ? 'none' : 'block'; sun.style.display = isDark ? 'block' : 'none'; }
}

// Executa assim que o script carrega para evitar "piscada clara" na tela
initTheme();
