// ============================================================
// UTILS.JS — Funções utilitárias e helpers globais
// ============================================================

const MESES_LABELS = {
  1: 'Jan', 2: 'Fev', 3: 'Mar', 4: 'Abr',
  5: 'Mai', 6: 'Jun', 7: 'Jul', 8: 'Ago',
  9: 'Set', 10: 'Out', 11: 'Nov', 12: 'Dez'
};

function mesLabel(mes, ano) { return `${MESES_LABELS[mes]}/${String(ano).slice(2)}`; }

// ── NÍVEL 2 E 3: OTIMIZAÇÕES ──────────────────────────────
function toCents(val) { return Math.round((Number(val) || 0) * 100); }
function fromCents(cents) { return cents / 100; }

function updateDOM(id, html) {
  const el = typeof id === 'string' ? document.getElementById(id) : id;
  if (!el) return;
  if (el.innerHTML !== html) el.innerHTML = html;
}

async function gerarHash(message) {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// ── HELPERS GERAIS ────────────────────────────────────────
function fmt(v) {
  return 'R$ ' + Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function maskCurrency(el) {
  const raw = el.value.replace(/\D/g, '');
  if (!raw) { el.value = ''; el.dataset.raw = ''; return; }
  const num = parseInt(raw, 10) / 100;
  el.dataset.raw = num.toFixed(2);
  el.value = 'R$ ' + num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function getValorInput() {
  const el = document.getElementById('form-valor');
  if (!el) return 0;
  return parseFloat(el.dataset.raw) || parseFloat(el.value.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
}

function getMesInicioInput() {
  const v = document.getElementById('form-mes-inicio')?.value || '';
  if (!v) return { mesI: new Date().getMonth() + 1, anoI: new Date().getFullYear() };
  const parts = v.split('-');
  return { mesI: parseInt(parts[1]), anoI: parseInt(parts[0]) };
}

function debounce(func, wait) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

function esc(str) { return String(str ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'); }
function today() { return new Date().toISOString().split('T')[0]; }

function isVencida(p) {
  if (p.pago) return false;
  const now = new Date();
  const cy = now.getFullYear(), cm = now.getMonth() + 1;
  return p.ano < cy || (p.ano === cy && p.mes < cm);
}

function getParcPago(p) { return p.valorPago ?? (p.pago ? p.valor : 0); }

// Cache por ciclo de render — limpar antes de cada renderAll()
const _calcCache = new Map();
function clearCalcCache() { _calcCache.clear(); }

function calcDesconto(d) {
  if (_calcCache.has(d.id)) return _calcCache.get(d.id);
  const total    = d.valor;
  const pago     = fromCents(d.parcelas.reduce((s, p) => s + toCents(getParcPago(p)), 0));
  const pendente = fromCents(d.parcelas.reduce((s, p) => s + Math.max(0, toCents(p.valor) - toCents(getParcPago(p))), 0));
  const result   = { total, pago, pendente };
  _calcCache.set(d.id, result);
  return result;
}

function getDescontosFiltrados() {
  if (!state.monthFilter) return state.descontos;
  const [m, y] = state.monthFilter.split('-').map(Number);
  return state.descontos.filter(d => d.parcelas.some(p => p.mes === m && p.ano === y));
}

function genId() { return crypto.randomUUID(); }

// Converte data no formato DD/MM/YYYY para timestamp ordenável
function parseDataBR(str) {
  if (!str) return 0;
  const [d, m, y] = str.split('/');
  return new Date(+y, +m - 1, +d).getTime();
}

function getFuncionarios() {
  const map = {};
  state.descontos.forEach(d => {
    if (!map[d.funcionario]) map[d.funcionario] = [];
    map[d.funcionario].push(d);
  });
  return map;
}