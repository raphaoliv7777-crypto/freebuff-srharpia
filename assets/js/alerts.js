/* Alertas e incidentes */
(function () {
  const SRH = window.SRH;
  const listEl = document.getElementById('alertList');
  const activeCount = document.getElementById('countActive');
  const ackCount = document.getElementById('countAck');
  const silencedCount = document.getElementById('countSilenced');
  const tabCount = document.getElementById('tabActiveCount');

  const alerts = [
    { id: 1, sev: 'crit', title: 'Latência p95 acima de 200ms', svc: 'api-gateway', age: 'há 12 min', owner: 'Squad Borda', value: 'p95 412ms', state: 'open' },
    { id: 2, sev: 'crit', title: 'Taxa de erro 5xx acima de 2%', svc: 'frontend', age: 'há 18 min', owner: 'Squad Produto', value: '8,6% de erro', state: 'open' },
    { id: 3, sev: 'crit', title: 'Nó PC-02 sem resposta ao health check', svc: 'worker', age: 'há 26 min', owner: 'Squad Dados', value: '2 probes falhas', state: 'open' },
    { id: 4, sev: 'warn', title: 'Saturação de memória acima de 85%', svc: 'data-service', age: 'há 41 min', owner: 'Squad Dados', value: '88% de uso', state: 'open' },
    { id: 5, sev: 'warn', title: 'Consumer lag acima de 5.000 mensagens', svc: 'queue', age: 'há 52 min', owner: 'Squad Plataforma', value: '6.482 msgs', state: 'open' },
    { id: 6, sev: 'warn', title: 'Cache hit ratio abaixo de 80%', svc: 'cache-redis', age: 'há 1h', owner: 'Squad Plataforma', value: '76,4%', state: 'open' },
    { id: 7, sev: 'info', title: 'p99 acima do baseline por 30 min', svc: 'checkout', age: 'há 1h', owner: 'Squad Pagamentos', value: 'p99 1,2s', state: 'open' },
    { id: 8, sev: 'warn', title: 'Pool de conexões acima de 80%', svc: 'data-base', age: 'há 2h', owner: 'Squad Dados', value: '82/100', state: 'open' },
    { id: 9, sev: 'crit', title: 'Erro 5xx acima de 5% no checkout', svc: 'checkout', age: 'há 2h', owner: 'Squad Pagamentos', value: '6,1% de erro', state: 'open' },
    { id: 10, sev: 'warn', title: 'Disco acima de 90% no nó PC-04', svc: 'storage', age: 'há 3h', owner: 'Squad Plataforma', value: '93% de uso', state: 'open' },
    { id: 11, sev: 'warn', title: 'Latência p99 acima de 2s', svc: 'data-service', age: 'há 3h', owner: 'Squad Dados', value: 'p99 2,4s', state: 'open' },
    { id: 12, sev: 'info', title: 'Certificado TLS expira em 7 dias', svc: 'nginx', age: 'há 4h', owner: 'Squad Plataforma', value: 'expira 18 nov', state: 'open' },
    { id: 13, sev: 'warn', title: 'Saturação de CPU acima de 80%', svc: 'worker', age: 'há 5h', owner: 'Squad Dados', value: '84% de uso', state: 'ack' },
    { id: 14, sev: 'warn', title: 'Consumer lag acima de 3.000 mensagens', svc: 'queue', age: 'há 6h', owner: 'Squad Plataforma', value: '3.204 msgs', state: 'ack' },
    { id: 15, sev: 'info', title: 'p99 acima do baseline', svc: 'checkout', age: 'há 7h', owner: 'Squad Pagamentos', value: 'p99 1,2s', state: 'ack' },
    { id: 16, sev: 'warn', title: 'Cache hit ratio abaixo de 80%', svc: 'cache-redis', age: 'há 9h', owner: 'Squad Plataforma', value: '74,1%', state: 'silenced' },
    { id: 17, sev: 'warn', title: 'Saturação de memória acima de 85%', svc: 'frontend', age: 'há 11h', owner: 'Squad Produto', value: '87% de uso', state: 'silenced' }
  ];

  function paint() {
    const active = alerts.filter(function (a) { return a.state === 'open'; });
    tabCount.textContent = active.length;
    activeCount.textContent = active.length;
    ackCount.textContent = alerts.filter(function (a) { return a.state === 'ack'; }).length;
    silencedCount.textContent = alerts.filter(function (a) { return a.state === 'silenced'; }).length;

    if (!active.length) {
      listEl.innerHTML = '<div class="empty-state">' + SRH.icon('check-circle') +
        '<span class="t">Nenhum alerta ativo.</span><span>O plantão está em dia.</span></div>';
      return;
    }
    listEl.innerHTML = active.map(function (a) {
      return '<div class="alert-row" data-alert="' + a.id + '">' +
        '<span class="alert-sev" data-sev="' + (a.sev === 'crit' ? 'crit' : a.sev) + '"></span>' +
        '<div class="alert-main">' +
          '<div class="alert-title">' + a.title + '</div>' +
          '<div class="alert-meta"><span>' + a.svc + '</span><span>' + a.age + '</span><span>' + a.owner + '</span><span class="mono" style="color:' + (a.sev === 'crit' ? 'var(--red)' : a.sev === 'warn' ? 'var(--amber)' : 'var(--blue)') + '">' + a.value + '</span></div>' +
        '</div>' +
        '<div class="alert-actions">' +
          '<button class="btn btn-sm" data-ack="' + a.id + '">Reconhecer</button>' +
          '<button class="btn btn-sm btn-outline" data-silence="' + a.id + '">Silenciar</button>' +
        '</div>' +
      '</div>';
    }).join('');
  }

  listEl.addEventListener('click', function (e) {
    const ack = e.target.closest('[data-ack]');
    const sil = e.target.closest('[data-silence]');
    if (!ack && !sil) return;
    const id = Number((ack || sil).getAttribute(ack ? 'data-ack' : 'data-silence'));
    const alert = alerts.filter(function (a) { return a.id === id; })[0];
    if (!alert) return;
    alert.state = ack ? 'ack' : 'silenced';
    paint();
    SRH.toast(ack ? 'Alerta reconhecido por Débora Lima' : 'Alerta silenciado por 1 hora', { icon: ack ? 'check' : 'bell' });
  });

  document.getElementById('newRule').addEventListener('click', function () {
    SRH.toast('Nova regra criada em modo rascunho');
  });

  /* regras */
  const rules = [
    ['Latência p95', 'p95 > 200ms por 5 min', 'api-gateway', 'crítica', 34, true],
    ['Taxa de erro 5xx', 'erro > 2% por 5 min', 'frontend', 'crítica', 21, true],
    ['Saturação de memória', 'memória > 85% por 15 min', 'data-service', 'aviso', 12, true],
    ['Consumer lag', 'lag > 5.000 por 10 min', 'queue', 'aviso', 7, true],
    ['Cache hit ratio', 'ratio < 80% por 10 min', 'cache-redis', 'aviso', 4, true],
    ['Nó indisponível', 'health check falho 2x', 'worker', 'crítica', 3, true],
    ['Pool de conexões', 'pool > 80% por 5 min', 'data-base', 'aviso', 2, false]
  ];
  document.getElementById('rulesRows').innerHTML = rules.map(function (r, i) {
    const sevColor = r[3] === 'crítica' ? 'var(--red)' : 'var(--amber)';
    return '<tr><td class="cell-main">' + r[0] + '</td>' +
      '<td class="mono dim" style="font-size:10.5px">' + r[1] + '</td>' +
      '<td class="muted">' + r[2] + '</td>' +
      '<td style="color:' + sevColor + '">' + r[3] + '</td>' +
      '<td class="cell-num muted">' + r[4] + '</td>' +
      '<td><button class="switch' + (r[5] ? ' is-on' : '') + '" role="switch" aria-checked="' + r[5] + '" data-rule="' + i + '" aria-label="Ativar regra ' + r[0] + '"></button></td></tr>';
  }).join('');
  document.getElementById('tabRuleCount').textContent = rules.length;

  document.addEventListener('click', function (e) {
    const sw = e.target.closest('[data-rule]');
    if (!sw) return;
    const on = !sw.classList.contains('is-on');
    sw.classList.toggle('is-on', on);
    sw.setAttribute('aria-checked', String(on));
    SRH.toast(on ? 'Regra ativada' : 'Regra desativada', { icon: on ? 'check' : 'pause' });
  });

  SRH.hydrateIcons(document);
  paint();
})();
