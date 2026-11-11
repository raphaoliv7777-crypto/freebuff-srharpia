/* Configurações */
(function () {
  const SRH = window.SRH;

  /* navegação lateral */
  const nav = document.getElementById('settingsNav');
  nav.addEventListener('click', function (e) {
    const btn = e.target.closest('[data-section]');
    if (!btn) return;
    nav.querySelectorAll('button').forEach(function (b) { b.classList.remove('is-active'); });
    btn.classList.add('is-active');
    const target = btn.getAttribute('data-section');
    document.querySelectorAll('[data-panel]').forEach(function (p) {
      p.hidden = p.getAttribute('data-panel') !== target;
    });
  });

  /* integrações */
  const integrations = [
    ['share', 'Slack', 'Notificações de alerta e comandos de plantão no canal #sre-alertas.', 'Conectado', 'ok'],
    ['bell', 'PagerDuty', 'Escalonamento de incidentes críticos para o plantão.', 'Conectado', 'ok'],
    ['activity', 'Grafana', 'Consulta de dashboards e datasource compartilhado.', 'Conectado', 'ok'],
    ['git-branch', 'GitHub', 'Vincula deploys e pull requests às janelas de mudança.', 'Conectado', 'ok'],
    ['file-text', 'Jira', 'Abre ticket automaticamente para incidentes com postmortem.', 'Pendente', 'warn']
  ];
  document.getElementById('integrations').innerHTML = integrations.map(function (it, i) {
    return '<div class="option-row">' +
      '<div class="row-inline" style="align-items:flex-start;flex-wrap:nowrap;gap:12px">' +
        '<span style="display:flex;align-items:center;justify-content:center;width:30px;height:30px;border-radius:5px;background:var(--surface-3);color:var(--text-2);flex:0 0 auto">' + SRH.icon(it[0]) + '</span>' +
        '<div><div class="opt-title">' + it[1] + '</div><div class="opt-sub">' + it[2] + '</div>' +
        '<div class="mt-8"><span class="status" data-state="' + it[4] + '"><span class="dot"></span>' + it[3] + '</span></div></div>' +
      '</div>' +
      '<button class="btn btn-outline btn-sm" data-integration="' + i + '">Configurar</button>' +
    '</div>';
  }).join('');
  document.querySelectorAll('[data-integration]').forEach(function (b) {
    b.addEventListener('click', function () {
      SRH.toast('Configuração de ' + integrations[Number(b.getAttribute('data-integration'))][1] + ' aberta em modo demonstração');
    });
  });

  /* chaves fictícias — nenhum segredo real */
  const keys = [
    ['Agente de coleta · prd-south', 'shr_live_••••••••••••4f2a', '12 out 2026', 'há 12s'],
    ['Pipeline de CI', 'shr_ci_••••••••••••9b71', '03 set 2026', 'há 3h'],
    ['Leitura de relatórios', 'shr_ro_••••••••••••c0d8', '21 ago 2026', 'há 2 dias']
  ];
  document.getElementById('keyRows').innerHTML = keys.map(function (k, i) {
    return '<div class="key-row">' +
      '<div style="flex:1;min-width:0"><div class="key-name">' + k[0] + '</div><div class="key-val mt-4">' + k[1] + '</div></div>' +
      '<span class="dim" style="font-size:10.5px">criada em ' + k[2] + '</span>' +
      '<span class="dim mono" style="font-size:10px">' + k[3] + '</span>' +
      '<button class="btn btn-sm btn-outline" data-copy-key="' + i + '">' + SRH.icon('copy') + 'Copiar</button>' +
      '<button class="btn btn-sm btn-outline" data-rotate-key="' + i + '">' + SRH.icon('refresh') + 'Rotacionar</button>' +
    '</div>';
  }).join('');
  document.querySelectorAll('[data-copy-key]').forEach(function (b) {
    b.addEventListener('click', function () { SRH.toast('Chave copiada em ambiente seguro', { icon: 'copy' }); });
  });
  document.querySelectorAll('[data-rotate-key]').forEach(function (b) {
    b.addEventListener('click', function () { SRH.toast('Nova chave emitida · a anterior expira em 24h', { icon: 'refresh' }); });
  });
  document.getElementById('newKey').addEventListener('click', function () {
    SRH.toast('Chave criada · copie o valor antes de sair', { icon: 'key' });
  });

  /* switches */
  document.addEventListener('click', function (e) {
    const sw = e.target.closest('[data-switch]');
    if (!sw) return;
    const on = !sw.classList.contains('is-on');
    sw.classList.toggle('is-on', on);
    sw.setAttribute('aria-checked', String(on));
  });

  /* salvar / descartar */
  document.getElementById('saveAll').addEventListener('click', function () {
    SRH.toast('Alterações salvas em prd-south');
  });
  document.getElementById('resetSettings').addEventListener('click', function () {
    SRH.toast('Alterações locais descartadas');
  });

  SRH.hydrateIcons(document);
})();
