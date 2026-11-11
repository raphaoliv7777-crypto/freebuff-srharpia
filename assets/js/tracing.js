/* Distributed tracing: lista, filtros e waterfall */
(function () {
  const SRH = window.SRH;
  const params = new URLSearchParams(window.location.search);
  const rowsEl = document.getElementById('traceRows');
  const countEl = document.getElementById('traceCount');
  const searchEl = document.getElementById('traceSearch');
  const serviceEl = document.getElementById('traceService');
  const statusEl = document.getElementById('traceStatus');
  const minEl = document.getElementById('traceMin');
  const drawer = document.getElementById('traceDrawer');
  const backdrop = document.getElementById('traceBackdrop');
  const body = document.getElementById('traceBody');
  let current = null;
  let selectedSpan = null;

  const services = [];
  SRH.services.forEach(function (s) { if (services.indexOf(s.id) === -1) services.push(s.id); });
  serviceEl.innerHTML = '<option value="">Todo serviço</option>' + services.map(function (id) {
    const s = SRH.serviceById(id);
    return '<option value="' + id + '">' + (s ? s.name : id) + '</option>';
  }).join('');
  if (params.get('service')) serviceEl.value = params.get('service');

  function paint() {
    const q = searchEl.value.trim().toLowerCase();
    const svc = serviceEl.value;
    const st = statusEl.value;
    const min = Number(minEl.value) || 0;
    const list = SRH.traces.filter(function (t) {
      if (svc && t.root !== svc) return false;
      if (st && t.state !== st) return false;
      if (t.dur < min) return false;
      if (q && (t.id + ' ' + t.op + ' ' + t.root).toLowerCase().indexOf(q) === -1) return false;
      return true;
    });
    countEl.textContent = list.length + ' traces na janela de 15 minutos';
    const maxDur = Math.max.apply(null, SRH.traces.map(function (t) { return t.dur; }));
    if (!list.length) {
      rowsEl.innerHTML = '<tr><td colspan="8"><div class="empty-state">' + SRH.icon('waypoints') +
        '<span class="t">Nenhum trace corresponde a estes filtros.</span><span>Ajuste a duração mínima ou o serviço raiz.</span></div></td></tr>';
      return;
    }
    rowsEl.innerHTML = list.map(function (t) {
      const pct = Math.max(3, (t.dur / maxDur) * 100);
      return '<tr class="is-clickable" data-trace="' + t.id + '">' +
        '<td><span class="mono" style="color:var(--text-2)">' + t.id.slice(0, 8) + '</span><span class="dim mono">' + t.id.slice(8, 12) + '</span></td>' +
        '<td class="cell-main">' + t.root + '</td>' +
        '<td class="mono" style="font-size:11px;color:var(--text-2)">' + SRH.esc(t.op) + '</td>' +
        '<td><div class="trace-duration"><div class="bar" data-state="' + t.state + '" style="width:' + pct + '%"></div><span class="num dim" style="font-size:10.5px;flex:0 0 auto">' + SRH.ms(t.dur) + '</span></div></td>' +
        '<td class="cell-num muted">' + t.spans + '</td>' +
        '<td class="cell-num" style="color:' + (t.errors ? 'var(--red)' : 'var(--text-3)') + '">' + t.errors + '</td>' +
        '<td class="cell-num mono dim">' + SRH.clock(t.at) + '</td>' +
        '<td class="cell-actions"><span class="dim">' + SRH.icon('chevron-right') + '</span></td></tr>';
    }).join('');
    rowsEl.querySelectorAll('[data-trace]').forEach(function (tr) {
      tr.addEventListener('click', function () { openTrace(tr.getAttribute('data-trace')); });
    });
  }

  function spanColorClass(span, slowest) {
    if (span.id === slowest.id) return 'is-critical-path';
    return '';
  }

  function renderSpans() {
    if (!current) return;
    const spans = SRH.traceSpans(current);
    const total = current.dur;
    const slowest = spans.slice(1).sort(function (a, b) { return b.dur - a.dur; })[0] || spans[0];
    const scale = ['0ms', Math.round(total * 0.25) + 'ms', Math.round(total * 0.5) + 'ms', Math.round(total * 0.75) + 'ms', SRH.ms(total)];
    const wf = '<div class="waterfall">' +
      '<div class="wf-scale"><span>Span</span><div class="ticks">' + scale.map(function (s) { return '<span>' + s + '</span>'; }).join('') + '</div><span style="text-align:right">Duração</span></div>' +
      spans.map(function (sp, i) {
        return '<div class="wf-row' + (i === 0 ? ' is-selected' : '') + '" data-span="' + i + '">' +
          '<div class="wf-label"><div style="padding-left:' + (sp.depth * 11) + 'px;min-width:0">' +
            '<div class="wf-name">' + sp.service + '</div><div class="wf-op">' + SRH.esc(sp.op) + '</div>' +
          '</div></div>' +
          '<div class="wf-track"><div class="wf-bar ' + spanColorClass(sp, slowest) + '" data-state="' + sp.state + '" style="left:' + (sp.start / total) * 100 + '%;width:' + Math.max(0.8, (sp.dur / total) * 100) + '%"></div></div>' +
          '<div class="wf-dur">' + SRH.ms(sp.dur) + '</div></div>';
      }).join('') + '</div>';

    body.innerHTML =
      '<div class="row-between mb-16">' +
        '<span class="status" data-state="' + (current.errors ? 'crit' : 'ok') + '"><span class="dot"></span>' +
          (current.errors ? 'Trace com erro' : 'Trace concluído') + '</span>' +
        '<span class="dim mono" style="font-size:10.5px">' + current.spans + ' spans · ' + SRH.ms(current.dur) + '</span>' +
      '</div>' +
      '<dl class="kv-grid mb-20">' +
        '<dt>Trace id</dt><dd>' + current.id + '</dd>' +
        '<dt>Serviço raiz</dt><dd>' + current.root + '</dd>' +
        '<dt>Operação</dt><dd>' + SRH.esc(current.op) + '</dd>' +
        '<dt>Status HTTP</dt><dd>' + current.http + '</dd>' +
        '<dt>Host</dt><dd>' + current.host + '</dd>' +
        '<dt>Usuário</dt><dd>' + current.user + '</dd>' +
        '<dt>Início</dt><dd>' + SRH.stamp(current.at) + '</dd>' +
      '</dl>' +
      '<div class="row-between mb-8"><span class="eyebrow">Waterfall de spans</span><span class="dim" style="font-size:10px">caminho crítico em lima</span></div>' +
      wf +
      '<div class="mt-20" id="spanDetail"></div>' +
      '<div class="row-inline mt-20">' +
        '<a class="btn btn-outline btn-sm" href="logs.html?trace=' + current.id + '"><span data-icon="terminal"></span>Logs do trace</a>' +
        '<button class="btn btn-outline btn-sm" id="openService"><span data-icon="boxes"></span>Ver serviço raiz</button>' +
      '</div>';

    body.querySelectorAll('[data-span]').forEach(function (row) {
      row.addEventListener('click', function () {
        body.querySelectorAll('.wf-row').forEach(function (r) { r.classList.remove('is-selected'); });
        row.classList.add('is-selected');
        showSpan(spans[Number(row.getAttribute('data-span'))], total);
      });
    });
    showSpan(spans[0], total);
    const openSvc = document.getElementById('openService');
    openSvc.href = 'servico.html?id=' + current.root;
    SRH.hydrateIcons(body);
  }

  function showSpan(sp, total) {
    const el = document.getElementById('spanDetail');
    if (!el) return;
    el.innerHTML = '<div class="card" style="background:#171717"><div class="card-body" style="padding:16px 18px">' +
      '<div class="row-between mb-12"><span class="eyebrow">Span selecionado</span><span class="mono dim" style="font-size:10px">' + sp.id + '</span></div>' +
      '<dl class="kv-grid">' +
        '<dt>Serviço</dt><dd>' + sp.service + '</dd>' +
        '<dt>Operação</dt><dd>' + SRH.esc(sp.op) + '</dd>' +
        '<dt>Tipo</dt><dd>' + sp.kind + '</dd>' +
        '<dt>Início</dt><dd>+' + SRH.ms(sp.start) + '</dd>' +
        '<dt>Duração</dt><dd>' + SRH.ms(sp.dur) + ' (' + SRH.num((sp.dur / total) * 100, 1) + '% do trace)</dd>' +
        '<dt>Status</dt><dd style="color:' + (sp.state === 'crit' ? 'var(--red)' : sp.state === 'warn' ? 'var(--amber)' : 'var(--green)') + '">' + sp.state.toUpperCase() + '</dd>' +
      '</dl></div></div>';
  }

  function openTrace(id) {
    const t = SRH.traceById(id);
    if (!t) return;
    current = t;
    selectedSpan = null;
    document.getElementById('drawerOp').textContent = t.op;
    document.getElementById('drawerId').textContent = t.id + ' · ' + t.root;
    renderSpans();
    SRH.openDrawer(drawer, backdrop);
    const url = new URL(window.location.href);
    url.searchParams.set('trace', t.id);
    history.replaceState({}, '', url);
  }

  function closeTrace() {
    SRH.closeDrawer(drawer, backdrop);
    const url = new URL(window.location.href);
    url.searchParams.delete('trace');
    history.replaceState({}, '', url);
  }

  document.getElementById('closeTrace').addEventListener('click', closeTrace);
  backdrop.addEventListener('click', closeTrace);
  document.getElementById('copyTrace').addEventListener('click', function () {
    if (current) SRH.copy(current.id);
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeTrace(); });

  searchEl.addEventListener('input', paint);
  serviceEl.addEventListener('change', paint);
  statusEl.addEventListener('change', paint);
  minEl.addEventListener('change', paint);

  /* latência por serviço */
  const top = SRH.services.slice().sort(function (a, b) { return b.p95 - a.p95; }).slice(0, 7);
  const max = top[0].p95;
  document.getElementById('latByService').innerHTML = top.map(function (s) {
    return '<div style="padding:7px 0">' +
      '<div class="row-between" style="margin-bottom:5px"><a href="servico.html?id=' + s.id + '" style="font-size:11px;color:var(--text-2)">' + s.name + '</a>' +
      '<span class="mono dim" style="font-size:10px">' + SRH.ms(s.p95) + '</span></div>' +
      '<div class="meter" style="height:4px" data-tone="' + (s.p95 > 500 ? 'red' : s.p95 > 220 ? 'amber' : 'lime') + '"><span style="width:' + Math.max(4, (s.p95 / max) * 100) + '%"></span></div>' +
      '</div>';
  }).join('');

  SRH.hydrateIcons(document);
  paint();
  if (params.get('trace')) openTrace(params.get('trace'));
})();
