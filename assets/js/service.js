/* Detalhe do serviço */
(function () {
  const SRH = window.SRH;
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id') || 'api-gateway';
  const svc = SRH.serviceById(id) || SRH.services[0];
  const svcKey = svc.id;
  const latColor = svc.p95 > 500 ? 'var(--red)' : svc.p95 > 220 ? 'var(--amber)' : 'var(--text)';

  document.title = svc.name + ' — SrHarpia';
  document.getElementById('crumbName').textContent = svc.name;
  document.getElementById('svcName').textContent = svc.name;
  document.getElementById('svcMeta').textContent =
    svc.lang + ' · ' + svc.version + ' · ' + svc.env + ' · ' + svc.owner + ' · ' + svc.ip;
  const state = document.getElementById('svcState');
  state.setAttribute('data-state', svc.status);
  state.innerHTML = '<span class="dot"></span>' + SRH.statusLabel[svc.status];

  document.getElementById('kpiRps').innerHTML = SRH.num(svc.rps);
  document.getElementById('kpiP95').innerHTML = SRH.num(svc.p95) + '<span class="unit">ms</span>';
  document.getElementById('kpiP95').style.color = latColor;
  document.getElementById('kpiPerc').textContent = 'p50 ' + SRH.ms(svc.p50) + ' · p99 ' + SRH.ms(svc.p99);
  document.getElementById('kpiErr').innerHTML = SRH.num(svc.err, 1) + '<span class="unit">%</span>';
  document.getElementById('kpiErr').style.color = svc.err >= 3 ? 'var(--red)' : svc.err >= 1 ? 'var(--amber)' : 'var(--text)';
  document.getElementById('kpiSlo').innerHTML = SRH.num(svc.slo, 2) + '<span class="unit">%</span>';
  document.getElementById('sloBar').style.width = Math.min(100, svc.slo) + '%';
  document.getElementById('sloFoot').textContent = 'orçamento restante em ' + SRH.num(Math.max(2, 100 - svc.err * 8), 0) + '%';

  document.getElementById('logsLink').href = 'logs.html?service=' + encodeURIComponent(svcKey);
  document.getElementById('traceLink').href = 'tracing.html?service=' + encodeURIComponent(svcKey);
  document.getElementById('allLogsLink').href = 'logs.html?service=' + encodeURIComponent(svcKey);
  document.getElementById('copySvcId').addEventListener('click', function () { SRH.copy(svcKey); });

  /* metas */
  document.getElementById('goalAvail').innerHTML = '<span style="color:' + (svc.slo >= 99.9 ? 'var(--green)' : 'var(--amber)') + '">' + SRH.num(svc.slo, 2) + '%</span> <span class="dim" style="font-size:10px">/ 99,95%</span>';
  document.getElementById('goalLat').innerHTML = '<span style="color:' + (svc.p95 < 200 ? 'var(--green)' : 'var(--amber)') + '">' + SRH.ms(svc.p95) + '</span> <span class="dim" style="font-size:10px">/ 200ms</span>';
  document.getElementById('goalErr').innerHTML = '<span style="color:' + (svc.err < 1 ? 'var(--green)' : 'var(--amber)') + '">' + SRH.num(svc.err, 1) + '%</span> <span class="dim" style="font-size:10px">/ 1%</span>';
  document.getElementById('goalUp').textContent = SRH.num(svc.uptime, 2) + '%';
  const budget = Math.max(6, Math.round(100 - svc.err * 11));
  document.getElementById('budget').textContent = budget + '%';
  document.getElementById('budgetBar').style.width = budget + '%';

  /* séries */
  const base = svc.seeded % 97;
  const p50 = SRH.series(base + 1, 96, svc.p50, svc.p50 * 0.18, 0.05);
  const p95 = SRH.series(base + 2, 96, svc.p95, svc.p95 * 0.22, 0.08);
  const p99 = SRH.series(base + 3, 96, svc.p99, svc.p99 * 0.25, 0.1);
  const rps = SRH.series(base + 4, 96, svc.rps, svc.rps * 0.2, -0.2);
  const labels = [];
  for (let i = 0; i < 96; i++) {
    const mins = i * 15;
    labels.push(String(Math.floor(mins / 60)).padStart(2, '0') + ':' + String(mins % 60).padStart(2, '0'));
  }

  SRH.charts.area(document.getElementById('latencyChart'), {
    series: [
      { name: 'p50', data: p50, color: '#D7FF00', area: false, width: 1.3 },
      { name: 'p95', data: p95, color: '#6F9AFF', area: false, width: 1.5 },
      { name: 'p99', data: p99, color: '#FFC61A', area: false, width: 1.2, dash: true }
    ],
    xLabels: labels, height: 248, xTicks: 6, yTicks: 4,
    yFormat: function (v) { return SRH.num(v) + 'ms'; },
    valueFormat: function (v) { return SRH.ms(v); }
  });

  const rpsChart = SRH.charts.area(document.getElementById('rpsChart'), {
    series: [{ name: 'Req/s', data: rps, color: '#D7FF00', width: 1.6, fillOpacity: 0.24 }],
    xLabels: labels, height: 190, xTicks: 6, yTicks: 3,
    yFormat: function (v) { return SRH.compact(v); },
    valueFormat: function (v) { return SRH.num(v) + ' req/s'; }
  });

  /* operações lentas */
  const ops = svc.endpoints.slice().sort(function (a, b) { return b.p95 - a.p95; });
  document.getElementById('slowRows').innerHTML = ops.slice(0, 5).map(function (op) {
    return '<tr><td><span class="mono dim" style="margin-right:8px">' + op.method + '</span><span class="cell-main">' + op.path + '</span></td>' +
      '<td class="cell-num" style="color:' + (op.p95 > 220 ? 'var(--amber)' : 'var(--text)') + '">' + SRH.ms(op.p95) + '</td>' +
      '<td class="cell-num muted">' + SRH.num(op.rps) + '</td>' +
      '<td class="cell-num" style="color:' + (op.err >= 2 ? 'var(--red)' : 'var(--text-2)') + '">' + SRH.num(op.err, 1) + '%</td></tr>';
  }).join('');

  /* endpoints */
  document.getElementById('tabEpCount').textContent = svc.endpoints.length;
  document.getElementById('epRows').innerHTML = ops.map(function (op) {
    const methodColor = op.method === 'GET' ? 'var(--blue)' : op.method === 'POST' ? 'var(--lime)' : op.method === 'PUT' ? 'var(--amber)' : 'var(--red)';
    const pct = Math.min(100, (op.p95 / (ops[0].p95 || 1)) * 100);
    return '<tr><td><span class="mono" style="color:' + methodColor + '">' + op.method + '</span></td>' +
      '<td class="cell-main mono" style="font-size:11.5px">' + op.path + '</td>' +
      '<td class="cell-num">' + SRH.ms(op.p95) + '</td>' +
      '<td class="cell-num muted">' + SRH.num(op.rps) + '</td>' +
      '<td class="cell-num" style="color:' + (op.err >= 2 ? 'var(--red)' : 'var(--text-2)') + '">' + SRH.num(op.err, 1) + '%</td>' +
      '<td style="width:180px"><div class="meter" data-tone="lime" style="height:5px"><span style="width:' + pct + '%"></span></div></td></tr>';
  }).join('');

  /* dependências */
  function depRow(dep, reverse) {
    return '<a class="list-row" href="servico.html?id=' + dep.id + '">' +
      '<span class="dot" data-state="' + dep.status + '"></span>' +
      '<span class="row-main"><span class="row-title">' + dep.name + '</span><span class="row-sub">' + dep.kind + ' · ' + dep.lang + '</span></span>' +
      '<span class="mono" style="color:' + (dep.p95 > 220 ? 'var(--amber)' : 'var(--text-3)') + '">' + SRH.ms(dep.p95) + '</span>' +
      '<span class="chev" data-icon="chevron-right"></span></a>';
  }
  const deps = svc.deps.map(function (d) { return SRH.serviceById(d); }).filter(Boolean);
  const consumers = SRH.services.filter(function (s) { return s.deps.indexOf(svcKey) > -1; });
  document.getElementById('tabDepCount').textContent = deps.length;
  document.getElementById('depList').innerHTML = deps.length ? deps.map(function (d) { return depRow(d); }).join('') :
    '<div class="inspector-empty">Nenhuma dependência síncrona observada.</div>';
  document.getElementById('consumerList').innerHTML = consumers.length ? consumers.map(function (d) { return depRow(d, true); }).join('') :
    '<div class="inspector-empty">Nenhum consumidor direto na janela atual.</div>';

  /* logs */
  const logs = SRH.logs.filter(function (l) { return l.service === svcKey; }).slice(-8).reverse();
  const fallback = logs.length ? logs : SRH.logs.slice(-6).reverse();
  document.getElementById('svcLogs').innerHTML = fallback.map(function (l) {
    const color = l.level === 'error' ? '#FF2121' : l.level === 'warn' ? '#FFC61A' : l.level === 'info' ? '#1AFF53' : '#6B6B6B';
    return '<a class="log-mini" href="logs.html?trace=' + l.trace + '" style="font-size:11px;padding:10px 0">' +
      '<span class="t">' + SRH.stamp(l.at) + '</span>' +
      '<span class="lvl" style="color:' + color + '">' + l.level.toUpperCase() + '</span>' +
      '<span class="msg">' + SRH.esc(l.message) + '</span>' +
      '<span class="dim" style="margin-left:auto;flex:0 0 auto">' + l.host + '</span></a>';
  }).join('');

  SRH.hydrateIcons(document);
  window.addEventListener('load', function () { SRH.charts.rerender(); });
})();
