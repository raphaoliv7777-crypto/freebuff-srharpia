/* Visão geral */
(function () {
  const SRH = window.SRH;
  const chartEl = document.getElementById('trafficChart');

  const state = {
    range: '24h',
    chart: null
  };

  function dataFor(range) {
    if (range === '7d') {
      const data = SRH.series(91, 168, 11200, 3000, 14);
      const labels = [];
      for (let i = 0; i < 168; i++) {
        const d = new Date();
        d.setDate(d.getDate() - 7 + Math.floor(i / 24));
        labels.push(d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) + ' ' + String(i % 24).padStart(2, '0') + 'h');
      }
      return { data: data, labels: labels, peakLabel: 'pico semanal' };
    }
    if (range === '1h') {
      const data = SRH.series(51, 60, 12400, 1800, 8);
      const labels = [];
      for (let i = 0; i < 60; i++) labels.push(String(Math.max(0, 59 - i)) + 'm');
      return { data: data, labels: labels.reverse(), peakLabel: 'pico da hora' };
    }
    const data = SRH.traffic24h;
    const labels = [];
    for (let i = 0; i < data.length; i++) {
      const mins = i * 15;
      labels.push(String(Math.floor(mins / 60)).padStart(2, '0') + ':' + String(mins % 60).padStart(2, '0'));
    }
    return { data: data, labels: labels, peakLabel: 'pico do dia' };
  }

  function renderChart() {
    const d = dataFor(state.range);
    const total = d.data.reduce(function (a, b) { return a + b; }, 0);
    const peak = Math.max.apply(null, d.data);
    const totalEl = document.getElementById('trafficTotal');
    const peakEl = document.getElementById('trafficPeak');
    totalEl.textContent = SRH.compact(total);
    peakEl.textContent = 'pico ' + SRH.num(peak) + ' req/min';

    const cfg = {
      series: [{ name: 'Requisições', data: d.data, color: '#D7FF00', width: 1.7, fillOpacity: 0.3 }],
      xLabels: d.labels,
      height: 246,
      xTicks: 6,
      yTicks: 4,
      yMax: Math.ceil(peak / 5000) * 5000,
      yFormat: function (v) { return SRH.compact(v); },
      valueFormat: function (v) { return SRH.num(v) + ' req/min'; }
    };
    if (state.chart) {
      state.chart.cfg = cfg;
      state.chart.redraw();
    } else {
      state.chart = SRH.charts.area(chartEl, cfg);
    }
  }

  document.getElementById('trafficRange').addEventListener('change', function (e) {
    state.range = e.target.value;
    renderChart();
  });
  document.getElementById('periodSelect').addEventListener('change', function (e) {
    state.range = e.target.value === '7d' ? '7d' : e.target.value === '1h' ? '1h' : '24h';
    document.getElementById('trafficRange').value = state.range === '7d' ? '7d' : '24h';
    renderChart();
  });

  /* sparklines dos KPIs */
  SRH.charts.spark(document.getElementById('latSpark'), SRH.latency24h, '#D7FF00');
  SRH.charts.spark(document.getElementById('errSpark'), SRH.errors24h, '#D7FF00');

  /* status dos serviços */
  document.getElementById('statusList').innerHTML = SRH.overviewStatus.map(function (s) {
    return '<a class="list-row" href="servico.html?id=' + s.id + '">' +
      '<span class="dot" data-state="' + s.state + '"></span>' +
      '<span class="row-main"><span class="row-title">' + s.name + '</span></span>' +
      '<span class="status" data-state="' + s.state + '">' + SRH.statusLabel[s.state] + '</span>' +
      '<span class="chev" data-icon="chevron-right"></span>' +
      '</a>';
  }).join('');

  /* eventos */
  const levelLabel = { info: 'INFO', warn: 'WARN', error: 'ERROR', debug: 'DEBUG' };
  const levelColor = { info: '#1AFF53', warn: '#FFC61A', error: '#FF2121', debug: '#6B6B6B' };
  const rows = document.getElementById('eventRows');
  SRH.events.forEach(function (ev, i) {
    const tr = document.createElement('tr');
    tr.className = 'is-clickable';
    tr.innerHTML =
      '<td><span class="mono dim">' + SRH.stamp(ev.at) + '</span></td>' +
      '<td class="cell-main">' + ev.service + '</td>' +
      '<td><span class="mono" style="color:' + levelColor[ev.level] + '">' + levelLabel[ev.level] + '</span></td>' +
      '<td class="muted">' + SRH.esc(ev.message) + '</td>' +
      '<td class="cell-actions"><button class="row-menu" aria-label="Ações do evento" data-event-menu="' + i + '"><span data-icon="more-vertical"></span></button></td>';
    tr.addEventListener('click', function (e) {
      if (e.target.closest('[data-event-menu]')) return;
      window.location.href = 'logs.html?service=' + encodeURIComponent(ev.service.toLowerCase().replace(/ /g, '-'));
    });
    rows.appendChild(tr);
  });
  document.getElementById('eventCount').textContent = SRH.events.length + ' eventos nas últimas 24h';

  /* menus dos eventos */
  SRH.events.forEach(function (ev, i) {
    const menu = document.createElement('div');
    menu.className = 'menu';
    menu.id = 'eventMenu' + i;
    menu.innerHTML =
      '<a href="logs.html?level=' + ev.level + '"><span data-icon="terminal"></span>Ver nos logs</a>' +
      '<button data-copy-event="' + i + '"><span data-icon="copy"></span>Copiar mensagem</button>' +
      '<div class="sep"></div>' +
      '<a href="servicos.html"><span data-icon="boxes"></span>Abrir serviços</a>';
    document.body.appendChild(menu);
  });
  document.addEventListener('click', function (e) {
    const btn = e.target.closest('[data-copy-event]');
    if (btn) {
      SRH.copy(SRH.events[Number(btn.getAttribute('data-copy-event'))].message);
      document.querySelectorAll('.menu.is-open').forEach(function (m) { m.classList.remove('is-open'); });
      return;
    }
    const trig = e.target.closest('[data-event-menu]');
    if (!trig) return;
    const menu = document.getElementById('eventMenu' + trig.getAttribute('data-event-menu'));
    if (!menu) return;
    document.querySelectorAll('.menu.is-open').forEach(function (m) { if (m !== menu) m.classList.remove('is-open'); });
    const r = trig.getBoundingClientRect();
    menu.classList.add('is-open');
    menu.style.position = 'fixed';
    menu.style.top = r.bottom + 6 + 'px';
    menu.style.left = Math.min(window.innerWidth - menu.offsetWidth - 16, r.right - menu.offsetWidth) + 'px';
  });

  SRH.hydrateIcons(document);
  renderChart();
  window.addEventListener('load', function () { SRH.charts.rerender(); });
})();
