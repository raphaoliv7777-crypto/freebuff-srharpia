/* Métricas de infraestrutura */
(function () {
  const SRH = window.SRH;
  const state = { host: 'pc-01', range: '24h' };
  const charts = {};
  const meta = [
    { key: 'cpu', label: 'CPU', icon: 'cpu', color: '#6F9AFF', chart: 'cpuChart', now: 'cpuNow' },
    { key: 'mem', label: 'Memória', icon: 'memory', color: '#D3009E', chart: 'memChart', now: 'memNow' },
    { key: 'disk', label: 'Disco', icon: 'hard-drive', color: '#1AFF53', chart: 'diskChart', now: 'diskNow' },
    { key: 'net', label: 'Rede', icon: 'globe', color: '#8200BA', chart: 'netChart', now: 'netNow' }
  ];

  function host() {
    return SRH.hosts.filter(function (h) { return h.id === state.host; })[0] || SRH.hosts[0];
  }

  function rnd(seed) {
    let s = seed >>> 0;
    return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  }
  function percentSeries(seed, n, base, amp) {
    const r = rnd(seed);
    let v = base;
    const out = [];
    for (let i = 0; i < n; i++) {
      v += (base - v) * 0.16 + (r() - 0.5) * amp;
      v = Math.max(2, Math.min(98, v));
      out.push(Math.round(v));
    }
    out[out.length - 1] = base;
    return out;
  }

  function windowSpec() {
    if (state.range === '1h') return { n: 120, step: '30s', unit: 'min' };
    if (state.range === '6h') return { n: 144, step: '2,5min', unit: 'h' };
    if (state.range === '7d') return { n: 168, step: '1h', unit: 'd' };
    return { n: 144, step: '10min', unit: 'h' };
  }

  function labelsFor(n) {
    const out = [];
    for (let i = 0; i < n; i++) {
      if (state.range === '1h') out.push('-' + Math.round((n - i) * 0.5) + 'm');
      else if (state.range === '6h') out.push('-' + (n - i) * 2.5 / 60 + 'h');
      else if (state.range === '7d') out.push('-' + (n - i) + 'h');
      else out.push(String(Math.floor((i * 24) / n)).padStart(2, '0') + ':00');
    }
    return out;
  }

  function paintHosts() {
    document.getElementById('hostList').innerHTML = SRH.hosts.map(function (h) {
      return '<button class="host-item' + (h.id === state.host ? ' is-active' : '') + '" data-host="' + h.id + '">' +
        '<span class="dot" data-state="' + h.status + '"></span>' +
        '<span class="info"><span class="n">' + h.name + '</span><span class="ip">' + h.ip + '</span></span>' +
        '<span class="usage">' + h.cpu + '%</span>' +
      '</button>';
    }).join('');
    document.querySelectorAll('[data-host]').forEach(function (b) {
      b.addEventListener('click', function () {
        state.host = b.getAttribute('data-host');
        paintHosts();
        paintAll();
      });
    });
  }

  function paintStats() {
    const h = host();
    document.getElementById('hostStats').innerHTML = meta.map(function (m) {
      return '<div class="stat"><div class="v" style="color:' + m.color + '">' + h[m.key] + '%</div>' +
        '<div class="k">' + m.label + ' · ' + h.name + '</div></div>';
    }).join('');
  }

  function paintCharts() {
    const h = host();
    const spec = windowSpec();
    meta.forEach(function (m, i) {
      const base = h[m.key];
      const data = percentSeries(h.name.charCodeAt(3) * 31 + i * 7 + (state.range.charCodeAt(0)), spec.n, base, Math.max(8, base * 0.3));
      const cfg = {
        series: [{ name: m.label, data: data, color: m.color, width: 1.5, fillOpacity: 0.22 }],
        xLabels: labelsFor(spec.n),
        height: 148,
        xTicks: 5,
        yTicks: 2,
        yMax: 100,
        yFormat: function (v) { return Math.round(v) + '%'; },
        valueFormat: function (v) { return Math.round(v) + '%'; }
      };
      if (charts[m.key]) {
        charts[m.key].cfg = cfg;
        charts[m.key].redraw();
      } else {
        charts[m.key] = SRH.charts.area(document.getElementById(m.chart), cfg);
      }
      document.getElementById(m.now).textContent = base + '% agora';
    });
    document.getElementById('diskNow').title = 'resolução ' + spec.step;
  }

  function paintProcesses() {
    const h = host();
    const rows = [
      [h.id === 'pc-02' ? 'postgres' : 'api-gateway', Math.round(h.cpu * 0.42), Math.round(h.mem * 0.36), 1],
      ['node-exporter', Math.round(h.cpu * 0.14), 6, 0],
      ['data-service', Math.round(h.cpu * 0.2), Math.round(h.mem * 0.24), 2],
      ['redis-server', Math.round(h.cpu * 0.1), Math.round(h.mem * 0.18), 0],
      ['vector', Math.round(h.cpu * 0.06), 4, 0]
    ];
    document.getElementById('procHost').textContent = h.name + ' · ' + h.role;
    document.getElementById('procRows').innerHTML = rows.map(function (r) {
      return '<tr><td class="cell-main mono" style="font-size:11px">' + r[0] + '</td>' +
        '<td class="cell-num">' + r[1] + '%</td>' +
        '<td class="cell-num muted">' + r[2] + '%</td>' +
        '<td class="cell-num" style="color:' + (r[3] ? 'var(--amber)' : 'var(--text-3)') + '">' + r[3] + '</td></tr>';
    }).join('');
  }

  function paintAll() {
    paintStats();
    paintCharts();
    paintProcesses();
  }

  document.querySelectorAll('[data-range]').forEach(function (b) {
    b.addEventListener('click', function () {
      document.querySelectorAll('[data-range]').forEach(function (x) { x.classList.remove('is-active'); });
      b.classList.add('is-active');
      state.range = b.getAttribute('data-range');
      paintAll();
    });
  });

  SRH.hydrateIcons(document);
  paintHosts();
  paintAll();
  window.addEventListener('load', function () { SRH.charts.rerender(); });
})();
