// ================= Helper umum & navigasi tab =================
const $ = (sel, el = document) => el.querySelector(sel);
const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];

// Format angka gaya Indonesia: 1.234.567,89 (tanda minus ditulis "−")
function fmtNum(x, maxDigits = 4) {
  if (!Number.isFinite(x)) return '–';
  return x.toLocaleString('id-ID', { maximumFractionDigits: maxDigits }).replace('-', '−');
}
function fmtRp(x) {
  if (!Number.isFinite(x)) return '–';
  const s = Math.abs(x).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return (x < 0 ? '−' : '') + 'Rp ' + s;
}

// Kotak pesan: soft = petunjuk (abu-abu), selain itu = kesalahan (merah)
function msg(text, soft = false) {
  return `<div class="msg ${soft ? 'soft' : 'bad'}" role="${soft ? 'status' : 'alert'}">${text}</div>`;
}

// Satu baris langkah pengerjaan
function stepLine(label, content) {
  return `<li><span class="k">${label}</span><code>${content}</code></li>`;
}

// Angka dari kotak isian (NaN jika kosong)
function val(id) {
  const v = document.getElementById(id).value.trim().replace(',', '.');
  return v === '' ? NaN : Number(v);
}
function radio(name) {
  return document.querySelector(`input[name="${name}"]:checked`).value;
}

// ---------- Tab (alamat #determinan, #invers, #bunga, #anuitas, #cicilan) ----------
const TABS = ['determinan', 'invers', 'bunga', 'anuitas', 'cicilan'];

function showTab(name, focus = false) {
  if (!TABS.includes(name)) name = 'determinan';
  $$('[role="tab"]').forEach(t => {
    const on = t.dataset.tab === name;
    t.setAttribute('aria-selected', String(on));
    t.tabIndex = on ? 0 : -1;
    if (on && focus) t.focus();
  });
  $$('[role="tabpanel"]').forEach(p => { p.hidden = p.id !== 'p-' + name; });
}

$$('[role="tab"]').forEach(tab => {
  tab.addEventListener('click', () => {
    showTab(tab.dataset.tab);
    try { history.replaceState(null, '', '#' + tab.dataset.tab); } catch (e) { /* abaikan */ }
  });
  tab.addEventListener('keydown', e => {
    const i = TABS.indexOf(tab.dataset.tab);
    let next = null;
    if (e.key === 'ArrowRight') next = TABS[(i + 1) % TABS.length];
    if (e.key === 'ArrowLeft') next = TABS[(i - 1 + TABS.length) % TABS.length];
    if (e.key === 'Home') next = TABS[0];
    if (e.key === 'End') next = TABS[TABS.length - 1];
    if (next) { e.preventDefault(); showTab(next, true); }
  });
});
window.addEventListener('hashchange', () => showTab(location.hash.slice(1)));
showTab(location.hash.slice(1));