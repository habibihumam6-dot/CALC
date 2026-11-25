// ================= Determinan & invers matriks =================
// Semua hitungan memakai pecahan eksak (BigInt), jadi tidak ada galat pembulatan.

const gcd = (a, b) => {
  a = a < 0n ? -a : a;
  b = b < 0n ? -b : b;
  while (b) [a, b] = [b, a % b];
  return a;
};

class Frac {
  constructor(n, d = 1n) {
    if (d === 0n) throw new Error('Pembagian dengan nol');
    if (d < 0n) { n = -n; d = -d; }
    const g = gcd(n, d) || 1n;
    this.n = n / g;
    this.d = d / g;
  }
  add(o) { return new Frac(this.n * o.d + o.n * this.d, this.d * o.d); }
  sub(o) { return new Frac(this.n * o.d - o.n * this.d, this.d * o.d); }
  mul(o) { return new Frac(this.n * o.n, this.d * o.d); }
  div(o) { return new Frac(this.n * o.d, this.d * o.n); }
  neg() { return new Frac(-this.n, this.d); }
  isZero() { return this.n === 0n; }
  isNeg() { return this.n < 0n; }
  toNumber() { return Number(this.n) / Number(this.d); }
}

// "3", "-2", "2,5", "2.5", "1/2", "-3/4" -> Frac
function parseDec(s) {
  const m = s.match(/^([+-]?)(\d*)(?:\.(\d*))?$/);
  if (!m || (m[2] === '' && !m[3])) return null;
  const frac = m[3] || '';
  let n = BigInt((m[2] || '0') + frac);
  if (m[1] === '-') n = -n;
  return new Frac(n, 10n ** BigInt(frac.length));
}
function parseEntry(raw) {
  const s = raw.trim().replace(/\s+/g, '').replace(/,/g, '.').replace(/[−–]/g, '-');
  if (s === '') return { err: 'kosong' };
  const parts = s.split('/');
  if (parts.length > 2) return { err: 'format' };
  const a = parseDec(parts[0]);
  const b = parts.length === 2 ? parseDec(parts[1]) : new Frac(1n);
  if (!a || !b) return { err: 'format' };
  if (b.isZero()) return { err: 'format' };
  return { val: a.div(b) };
}

// ---------- Tampilan ----------
const fTxt = f => (f.isNeg() ? '−' : '') + (f.isNeg() ? -f.n : f.n) + (f.d === 1n ? '' : '/' + f.d);
const fPar = f => (f.isNeg() ? `(${fTxt(f)})` : fTxt(f));

function fracHTML(f, decimal = false) {
  if (f.d === 1n) return fTxt(f);
  if (decimal) return fmtNum(f.toNumber(), 4);
  const sign = f.isNeg() ? '−' : '';
  const n = f.isNeg() ? -f.n : f.n;
  return `<span class="fr">${sign}<span class="fr-s"><span>${n}</span><span>${f.d}</span></span></span>`;
}
function matHTML(M, decimal = false) {
  const cells = M.flat().map(x => `<span>${fracHTML(x, decimal)}</span>`).join('');
  return `<span class="mat" style="--n:${M.length}">${cells}</span>`;
}

// ---------- Rumus ----------
const det2 = m => m[0][0].mul(m[1][1]).sub(m[0][1].mul(m[1][0]));

function sarrus(m) {
  const [[a, b, c], [d, e, f], [g, h, i]] = m;
  const plus = [a.mul(e).mul(i), b.mul(f).mul(g), c.mul(d).mul(h)];
  const minus = [c.mul(e).mul(g), a.mul(f).mul(h), b.mul(d).mul(i)];
  const P = plus[0].add(plus[1]).add(plus[2]);
  const Q = minus[0].add(minus[1]).add(minus[2]);
  return { plus, minus, P, Q, D: P.sub(Q) };
}
const det = m => (m.length === 2 ? det2(m) : sarrus(m).D);

function cofactors3(m) {
  return [0, 1, 2].map(r => [0, 1, 2].map(c => {
    const minor = m.filter((_, i) => i !== r).map(row => row.filter((_, j) => j !== c));
    const v = det2(minor);
    return (r + c) % 2 ? v.neg() : v;
  }));
}
const transpose = M => M[0].map((_, c) => M.map(row => row[c]));
const scale = (M, k) => M.map(row => row.map(x => x.mul(k)));

// Langkah determinan (dipakai di tab Determinan dan tab Invers)
function detSteps(m) {
  if (m.length === 2) {
    const [[a, b], [c, d]] = m;
    const ad = a.mul(d), bc = b.mul(c);
    return [
      stepLine('Rumus', 'det(A) = a·d − b·c'),
      stepLine('Substitusi', `= ${fPar(a)}·${fPar(d)} − ${fPar(b)}·${fPar(c)}`),
      stepLine('Kalikan', `= ${fPar(ad)} − ${fPar(bc)}`),
      stepLine('Hasil', `= ${fTxt(ad.sub(bc))}`),
    ];
  }
  const [[a, b, c], [d, e, f], [g, h, i]] = m;
  const s = sarrus(m);
  const t = (x, y, z) => `${fPar(x)}·${fPar(y)}·${fPar(z)}`;
  return [
    stepLine('Aturan Sarrus', 'det(A) = aei + bfg + cdh − ceg − afh − bdi'),
    stepLine('Substitusi', `= ${t(a, e, i)} + ${t(b, f, g)} + ${t(c, d, h)} − ${t(c, e, g)} − ${t(a, f, h)} − ${t(b, d, i)}`),
    stepLine('Kalikan', `= ${s.plus.map(fPar).join(' + ')} − ${s.minus.map(fPar).join(' − ')}`),
    stepLine('Jumlahkan', `= ${fPar(s.P)} − ${fPar(s.Q)}`),
    stepLine('Hasil', `= ${fTxt(s.D)}`),
  ];
}

// ---------- Kotak isian matriks ----------
const EXAMPLES = {
  det: { 2: [[4, 3], [2, 1]], 3: [[2, 1, 3], [0, -1, 4], [1, 2, 1]] },
  inv: { 2: [[4, 7], [2, 6]], 3: [[2, 1, 3], [0, -1, 4], [1, 2, 1]] },
};
const LETTERS = 'abcdefghi';

function buildGrid(key, size, values) {
  const grid = document.getElementById(key + '-grid');
  grid.style.setProperty('--n', size);
  grid.innerHTML = '';
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const inp = document.createElement('input');
      inp.type = 'text';
      inp.id = `${key}-${r}${c}`;
      inp.autocomplete = 'off';
      inp.spellcheck = false;
      inp.placeholder = LETTERS[r * size + c];
      inp.setAttribute('aria-label', `Baris ${r + 1}, kolom ${c + 1}`);
      inp.value = values ? String(values[r][c]) : '';
      grid.appendChild(inp);
    }
  }
}

function readGrid(key, size) {
  const M = [];
  let empty = 0, bad = 0;
  for (let r = 0; r < size; r++) {
    M.push([]);
    for (let c = 0; c < size; c++) {
      const el = document.getElementById(`${key}-${r}${c}`);
      const p = parseEntry(el.value);
      if (p.err === 'format') { el.setAttribute('aria-invalid', 'true'); bad++; }
      else el.removeAttribute('aria-invalid');
      if (p.err === 'kosong') empty++;
      M[r].push(p.val);
    }
  }
  if (bad) return { err: msg('Ada sel yang tidak bisa dibaca. Tulis angka seperti 3, −2, 2,5 atau 1/2.') };
  if (empty) return { err: msg(`Masih ada ${empty} sel kosong. Isi semua sel untuk melihat hasilnya.`, true) };
  return { M };
}

// ---------- Tab Determinan ----------
function renderDet() {
  const size = Number(radio('det-size'));
  const out = document.getElementById('det-result');
  const r = readGrid('det', size);
  if (r.err) { out.innerHTML = r.err; return; }
  const m = r.M;
  const D = det(m);
  out.innerHTML = `
    <div class="res-label">det(A)</div>
    <div class="res-big">${fracHTML(D)}</div>
    ${D.d !== 1n ? `<p class="res-sub">≈ ${fmtNum(D.toNumber(), 6)}</p>` : ''}
    <p class="res-note ${D.isZero() ? 'warn' : ''}">${D.isZero()
      ? 'Determinan = 0, jadi matriks ini singular dan tidak memiliki invers.'
      : 'Determinan ≠ 0, jadi matriks ini memiliki invers.'}</p>
    <h3>Langkah pengerjaan</h3>
    <div class="given">A = ${matHTML(m)}</div>
    <ol class="steps">${detSteps(m).join('')}</ol>`;
}

// ---------- Tab Invers ----------
function renderInv() {
  const size = Number(radio('inv-size'));
  const decimal = radio('inv-view') === 'desimal';
  const out = document.getElementById('inv-result');
  const r = readGrid('inv', size);
  if (r.err) { out.innerHTML = r.err; return; }
  const m = r.M;
  const D = det(m);
  const given = `<div class="given">A = ${matHTML(m)}</div>`;

  if (D.isZero()) {
    out.innerHTML = `
      <div class="res-label">A⁻¹</div>
      <div class="res-big">Tidak ada</div>
      <p class="res-note warn">det(A) = 0, jadi matriks A singular dan tidak memiliki invers.</p>
      <h3>Langkah pengerjaan</h3>${given}
      <ol class="steps">${detSteps(m).join('')}</ol>`;
    return;
  }

  let adj, cofStep = '', adjNote;
  if (size === 2) {
    const [[a, b], [c, d]] = m;
    adj = [[d, b.neg()], [c.neg(), a]];
    adjNote = 'Tukar posisi a dan d, lalu ubah tanda b dan c.';
  } else {
    const C = cofactors3(m);
    adj = transpose(C);
    cofStep = `<li><span class="k">Matriks kofaktor</span>
      <div class="mrow">C = ${matHTML(C)}</div>
      <p>Cᵢⱼ = (−1)<sup>i+j</sup> · Mᵢⱼ, dengan Mᵢⱼ determinan minor (hapus baris i dan kolom j).</p></li>`;
    adjNote = 'Adjoin adalah transpos matriks kofaktor: adj(A) = Cᵀ.';
  }
  const inv = scale(adj, new Frac(1n).div(D));
  const detFormula = size === 2 ? 'det(A) = a·d − b·c' : 'det(A) dengan aturan Sarrus';

  out.innerHTML = `
    <div class="res-label">A⁻¹</div>
    <div class="res-mat">${matHTML(inv, decimal)}</div>
    <h3>Langkah pengerjaan</h3>${given}
    <ol class="steps">
      <li><span class="k">Determinan</span><code>${detFormula} = ${fTxt(D)}</code>
        <p>Karena det(A) ≠ 0, invers ada.</p></li>
      ${cofStep}
      <li><span class="k">Adjoin</span><div class="mrow">adj(A) = ${matHTML(adj)}</div><p>${adjNote}</p></li>
      <li><span class="k">Invers</span>
        <div class="mrow">A⁻¹ = 1/det(A) · adj(A) = 1/${fPar(D)} · ${matHTML(adj)} = ${matHTML(inv, decimal)}</div></li>
    </ol>`;
}

// ---------- Event ----------
function setupMatrix(key, panelId, render) {
  const panel = document.getElementById(panelId);
  const size = () => Number(radio(key + '-size'));
  buildGrid(key, size(), EXAMPLES[key][size()]);

  panel.addEventListener('input', e => {
    if (e.target.name === key + '-size') buildGrid(key, size(), EXAMPLES[key][size()]);
    render();
  });
  $('[data-action="fill"]', panel).addEventListener('click', () => {
    buildGrid(key, size(), EXAMPLES[key][size()]);
    render();
  });
  $('[data-action="clear"]', panel).addEventListener('click', () => {
    buildGrid(key, size(), null);
    render();
    document.getElementById(`${key}-00`).focus();
  });
  render();
}
setupMatrix('det', 'p-determinan', renderDet);
setupMatrix('inv', 'p-invers', renderInv);