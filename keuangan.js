// ================= Bunga, anuitas & lama cicilan =================

function statsHTML(items) {
  return `<dl class="stats">${items.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('')}</dl>`;
}
// Periode pembayaran: berapa kali per tahun
const PERIODE = {
  bulanan: { k: 12, name: 'bulan' },
  tahunan: { k: 1, name: 'tahun' },
};
// Sisa pinjaman anuitas setelah p kali bayar (rumus tertutup)
function sisaAnuitas(M, A, i, p) {
  if (i === 0) return M - A * p;
  const g = Math.pow(1 + i, p);
  return M * g - A * (g - 1) / i;
}
function lamaTeks(N, name) {
  if (name !== 'bulan' || N < 12) return `${N} ${name}`;
  const th = Math.floor(N / 12), bl = N % 12;
  return `${th} tahun${bl ? ` ${bl} bulan` : ''}`;
}

// ---------- Tab Bunga ----------
function renderBunga() {
  const out = $('#bunga-result');
  const jenis = radio('b-jenis');
  $('#b-freq-wrap').hidden = jenis !== 'majemuk';

  const M = val('b-modal'), r = val('b-rate'), t0 = val('b-time');
  const unit = $('#b-unit').value;
  if (!(M > 0) || !(r >= 0) || !(t0 > 0)) {
    out.innerHTML = msg('Isi modal awal, suku bunga, dan jangka waktu dengan angka lebih dari nol.', true);
    return;
  }
  const i = r / 100;
  const t = unit === 'bulan' ? t0 / 12 : t0;
  const tTxt = unit === 'bulan' ? `${fmtNum(t0)}/12 tahun` : `${fmtNum(t0)} tahun`;
  let Mt, steps;

  if (jenis === 'tunggal') {
    const B = M * i * t;
    Mt = M + B;
    steps = [
      stepLine('Rumus', 'B = M₀ × i × t   dan   Mₜ = M₀ + B'),
      stepLine('Diketahui', `M₀ = ${fmtRp(M)}, i = ${fmtNum(r)}% = ${fmtNum(i, 6)}, t = ${tTxt}`),
      stepLine('Bunga', `B = ${fmtNum(M, 2)} × ${fmtNum(i, 6)} × ${fmtNum(t, 6)} = ${fmtRp(B)}`),
      stepLine('Nilai akhir', `Mₜ = ${fmtNum(M, 2)} + ${fmtNum(B, 2)} = ${fmtRp(Mt)}`),
    ];
  } else {
    const k = Number($('#b-freq').value);
    const n = k * t, ip = i / k;
    Mt = M * Math.pow(1 + ip, n);
    steps = [
      stepLine('Rumus', 'Mₙ = M₀ × (1 + i/k)ⁿ, dengan n = k × t'),
      stepLine('Diketahui', `M₀ = ${fmtRp(M)}, i = ${fmtNum(r)}%, k = ${k} kali per tahun, t = ${tTxt}`),
      stepLine('Per periode', `i/k = ${fmtNum(i, 6)}/${k} = ${fmtNum(ip, 8)}  ;  n = ${k} × ${fmtNum(t, 6)} = ${fmtNum(n, 4)}`),
      stepLine('Nilai akhir', `Mₙ = ${fmtNum(M, 2)} × (${fmtNum(1 + ip, 8)})^${fmtNum(n, 4)} = ${fmtRp(Mt)}`),
      stepLine('Bunga', `B = Mₙ − M₀ = ${fmtRp(Mt - M)}`),
    ];
  }
  out.innerHTML = `
    <div class="res-label">Nilai akhir (bunga ${jenis})</div>
    <div class="res-big">${fmtRp(Mt)}</div>
    ${statsHTML([['Modal awal', fmtRp(M)], ['Total bunga', fmtRp(Mt - M)]])}
    <h3>Langkah pengerjaan</h3>
    <ol class="steps">${steps.join('')}</ol>`;
}

// ---------- Tab Anuitas ----------
function renderAnuitas() {
  const out = $('#anuitas-result');
  const M = val('a-modal'), r = val('a-rate'), L = val('a-time');
  const unit = $('#a-unit').value;
  const { k, name } = PERIODE[radio('a-per')];
  if (!(M > 0) || !(r >= 0) || !(L > 0)) {
    out.innerHTML = msg('Isi besar pinjaman, suku bunga, dan lama pinjaman dengan angka lebih dari nol.', true);
    return;
  }
  const bulan = unit === 'tahun' ? L * 12 : L;
  const nRaw = bulan * k / 12;
  const n = Math.round(nRaw);
  if (Math.abs(nRaw - n) > 1e-9 || n < 1) {
    out.innerHTML = msg(`Lama pinjaman harus pas dalam hitungan ${name}. Untuk pembayaran tahunan, isi kelipatan 12 bulan.`);
    return;
  }
  if (n > 1200) { out.innerHTML = msg('Jumlah periode terlalu banyak (maksimal 1.200).'); return; }

  const i = r / 100 / k;
  const v = Math.pow(1 + i, -n);
  const A = i === 0 ? M / n : M * i / (1 - v);

  let sisa = M, rows = '', totBunga = 0;
  for (let p = 1; p <= n; p++) {
    const b = sisa * i;
    const pokok = A - b;
    sisa -= pokok;
    totBunga += b;
    const s = Math.abs(sisa) < 0.005 ? 0 : sisa;
    rows += `<tr><td>${p}</td><td>${fmtRp(A)}</td><td>${fmtRp(b)}</td><td>${fmtRp(pokok)}</td><td>${fmtRp(s)}</td></tr>`;
  }

  const steps = i === 0
    ? [stepLine('Bunga 0%', `A = M / n = ${fmtNum(M, 2)} / ${n} = ${fmtRp(A)}`)]
    : [
      stepLine('Rumus', 'A = M × i / (1 − (1 + i)⁻ⁿ)'),
      stepLine('Diketahui', `M = ${fmtRp(M)}, i = ${fmtNum(r)}% ÷ ${k} = ${fmtNum(i, 8)} per ${name}, n = ${n} ${name}`),
      stepLine('Faktor diskon', `(1 + i)⁻ⁿ = (${fmtNum(1 + i, 8)})^−${n} = ${fmtNum(v, 8)}`),
      stepLine('Anuitas', `A = ${fmtNum(M, 2)} × ${fmtNum(i, 8)} / (1 − ${fmtNum(v, 8)}) = ${fmtRp(A)}`),
    ];

  out.innerHTML = `
    <div class="res-label">Anuitas per ${name}</div>
    <div class="res-big">${fmtRp(A)}</div>
    ${statsHTML([
      ['Total pembayaran', fmtRp(A * n)],
      ['Total bunga', fmtRp(totBunga)],
      ['Jumlah pembayaran', `${n} kali`],
      [`Bunga per ${name}`, `${fmtNum(i * 100, 4)}%`],
    ])}
    <h3>Langkah pengerjaan</h3>
    <ol class="steps">${steps.join('')}</ol>
    <h3>Tabel angsuran</h3>
    <div class="table-wrap" tabindex="0" aria-label="Tabel angsuran">
      <table>
        <thead><tr><th>${name[0].toUpperCase() + name.slice(1)} ke-</th><th>Anuitas</th><th>Bunga</th><th>Angsuran pokok</th><th>Sisa pinjaman</th></tr></thead>
        <tbody>${rows}</tbody>
        <tfoot><tr><td>Total</td><td>${fmtRp(A * n)}</td><td>${fmtRp(totBunga)}</td><td>${fmtRp(M)}</td><td></td></tr></tfoot>
      </table>
    </div>`;
}

// ---------- Tab Lama Cicilan ----------
function renderCicilan() {
  const out = $('#cicilan-result');
  const metode = radio('c-metode');
  const M = val('c-modal'), r = val('c-rate'), A = val('c-pay');
  const { k, name } = PERIODE[radio('c-per')];
  if (!(M > 0) || !(r >= 0) || !(A > 0)) {
    out.innerHTML = msg('Isi besar pinjaman, suku bunga, dan angsuran dengan angka lebih dari nol.', true);
    return;
  }
  const i = r / 100 / k;
  const bunga1 = M * i;
  if (A <= bunga1) {
    out.innerHTML = msg(`Angsuran ${fmtRp(A)} tidak cukup untuk menutup bunga per ${name} (${fmtRp(bunga1)}), jadi pinjaman tidak akan pernah lunas. Naikkan angsurannya.`);
    return;
  }

  let nExact, steps;
  if (metode === 'anuitas') {
    nExact = i === 0 ? M / A : Math.log(A / (A - bunga1)) / Math.log(1 + i);
    steps = i === 0
      ? [stepLine('Bunga 0%', `n = M / A = ${fmtNum(M, 2)} / ${fmtNum(A, 2)} = ${fmtNum(nExact, 4)}`)]
      : [
        stepLine('Rumus', 'n = log(A / (A − M·i)) / log(1 + i)'),
        stepLine('Diketahui', `M = ${fmtRp(M)}, A = ${fmtRp(A)}, i = ${fmtNum(r)}% ÷ ${k} = ${fmtNum(i, 8)} per ${name}`),
        stepLine('Bunga periode pertama', `M·i = ${fmtNum(M, 2)} × ${fmtNum(i, 8)} = ${fmtRp(bunga1)}`),
        stepLine('Hitung n', `n = log(${fmtNum(A, 2)} / ${fmtNum(A - bunga1, 2)}) / log(${fmtNum(1 + i, 8)}) = ${fmtNum(nExact, 4)}`),
      ];
  } else {
    nExact = M / (A - bunga1);
    steps = [
      stepLine('Rumus bunga flat', 'A = M/n + M·i   →   n = M / (A − M·i)'),
      stepLine('Diketahui', `M = ${fmtRp(M)}, A = ${fmtRp(A)}, i = ${fmtNum(r)}% ÷ ${k} = ${fmtNum(i, 8)} per ${name}`),
      stepLine('Bunga tetap', `M·i = ${fmtRp(bunga1)} per ${name}`),
      stepLine('Hitung n', `n = ${fmtNum(M, 2)} / (${fmtNum(A, 2)} − ${fmtNum(bunga1, 2)}) = ${fmtNum(nExact, 4)}`),
    ];
  }
  if (nExact > 12000) {
    out.innerHTML = msg('Dengan angsuran ini, pelunasan butuh lebih dari 12.000 kali pembayaran. Naikkan angsurannya.');
    return;
  }

  const N = Math.max(1, Math.ceil(nExact - 1e-9));
  const last = metode === 'anuitas'
    ? sisaAnuitas(M, A, i, N - 1) * (1 + i)
    : (M - (A - bunga1) * (N - 1)) + bunga1;
  const total = A * (N - 1) + last;
  const pas = Math.abs(nExact - N) < 1e-6;

  out.innerHTML = `
    <div class="res-label">Lama cicilan</div>
    <div class="res-big">${N} ${name}</div>
    ${name === 'bulan' && N >= 12 ? `<p class="res-sub">= ${lamaTeks(N, name)}</p>` : ''}
    <p class="res-note">${pas
      ? `Hasil n = ${fmtNum(nExact, 4)} pas bulat, jadi semua angsuran sama besar.`
      : `Hasil n = ${fmtNum(nExact, 4)} dibulatkan ke atas menjadi ${N} kali pembayaran. Pembayaran terakhir lebih kecil, yaitu ${fmtRp(last)}.`}</p>
    ${statsHTML([
      [`Angsuran per ${name}`, fmtRp(A)],
      ['Pembayaran terakhir', fmtRp(last)],
      ['Total dibayar', fmtRp(total)],
      ['Total bunga', fmtRp(total - M)],
    ])}
    <h3>Langkah pengerjaan</h3>
    <ol class="steps">${steps.join('')}</ol>`;
}

// ---------- Event ----------
[['f-bunga', renderBunga], ['f-anuitas', renderAnuitas], ['f-cicilan', renderCicilan]].forEach(([id, render]) => {
  const form = document.getElementById(id);
  form.addEventListener('input', render);
  form.addEventListener('change', render);
  form.addEventListener('submit', e => { e.preventDefault(); render(); });
  render();
});