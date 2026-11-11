/* Logs em tempo real */
(function () {
  const SRH = window.SRH;
  const params = new URLSearchParams(window.location.search);
  const stream = document.getElementById('logStream');
  const searchEl = document.getElementById('logSearch');
  const serviceEl = document.getElementById('logService');
  const hostEl = document.getElementById('logHost');
  const regexBtn = document.getElementById('regexToggle');
  const errorEl = document.getElementById('regexError');
  const liveDot = document.getElementById('liveDot');
  const liveText = document.getElementById('liveText');
  const pauseLabel = document.getElementById('pauseLabel');
  const openSet = new Set();

  const state = {
    level: params.get('level') || '',
    q: '',
    regex: false,
    service: params.get('service') || '',
    host: '',
    filters: [],
    paused: false,
    logs: SRH.logs.slice().reverse()
  };
  if (params.get('trace')) state.filters.push({ field: 'trace', value: params.get('trace') });

  /* selects */
  const services = [];
  SRH.logs.forEach(function (l) { if (services.indexOf(l.service) === -1) services.push(l.service); });
  services.sort();
  serviceEl.innerHTML = '<option value="">Todo serviço</option>' + services.map(function (s) {
    return '<option value="' + s + '">' + s + '</option>';
  }).join('');
  if (state.service) serviceEl.value = state.service;

  const hosts = [];
  SRH.logs.forEach(function (l) { if (hosts.indexOf(l.host) === -1) hosts.push(l.host); });
  hostEl.innerHTML = '<option value="">Todo host</option>' + hosts.map(function (h) {
    return '<option value="' + h + '">' + h + '</option>';
  }).join('');

  /* nível por URL */
  if (state.level) {
    document.querySelectorAll('#levelGroup button').forEach(function (b) {
      b.classList.toggle('is-active', b.getAttribute('data-level') === state.level);
    });
  }

  function escapeRegExp(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function searchRegex(global) {
    if (!state.q) return null;
    try {
      return new RegExp(state.regex ? state.q : escapeRegExp(state.q), global ? 'gi' : 'i');
    } catch (err) {
      return { invalid: true };
    }
  }

  function highlight(text) {
    const re = searchRegex(true);
    if (!re || re.invalid) return SRH.esc(text);
    let out = '', last = 0, m, guard = 0;
    re.lastIndex = 0;
    while ((m = re.exec(text)) !== null && guard++ < 200) {
      out += SRH.esc(text.slice(last, m.index));
      out += '<mark>' + SRH.esc(m[0]) + '</mark>';
      last = m.index + m[0].length;
      if (m[0].length === 0) re.lastIndex++;
    }
    out += SRH.esc(text.slice(last));
    return out;
  }

  function passes(l) {
    if (state.level && l.level !== state.level) return false;
    if (state.service && l.service !== state.service) return false;
    if (state.host && l.host !== state.host) return false;
    for (let i = 0; i < state.filters.length; i++) {
      const f = state.filters[i];
      if (String(l[f.field]).toLowerCase().indexOf(f.value.toLowerCase()) === -1) return false;
    }
    if (state.q) {
      const re = searchRegex(false);
      if (re && re.invalid) return true;
      if (re && !re.test(l.message + ' ' + l.service + ' ' + l.trace + ' ' + l.host)) return false;
    }
    return true;
  }

  function detail(l) {
    return '<div class="log-detail" onclick="event.stopPropagation()">' +
      '<dl class="kv"><dt>id</dt><dd>' + l.id + '</dd>' +
      '<dt>timestamp</dt><dd>' + l.at.toISOString() + '</dd>' +
      '<dt>serviço</dt><dd>' + l.service + '</dd>' +
      '<dt>host</dt><dd>' + l.host + '</dd>' +
      '<dt>trace id</dt><dd>' + l.trace + '</dd>' +
      '<dt>span id</dt><dd>' + l.span + '</dd>' +
      '<dt>http status</dt><dd>' + l.attrs.http_status + '</dd>' +
      '<dt>duração</dt><dd>' + l.attrs.duration_ms + 'ms</dd></dl>' +
      '<div class="json-head mt-12"><span>evento estruturado</span><button class="btn btn-sm btn-outline" data-copy-log="' + l.id + '">' + SRH.icon('copy') + 'Copiar JSON</button></div>' +
      '<pre>' + SRH.esc(JSON.stringify({
        timestamp: l.at.toISOString(), level: l.level, service: l.service,
        host: l.host, message: l.message, trace_id: l.trace, span_id: l.span, ...l.attrs
      }, null, 2)) + '</pre>' +
    '</div>';
  }

  function render() {
    const re = state.q ? searchRegex(false) : null;
    if (re && re.invalid) {
      errorEl.textContent = 'Expressão regular inválida';
      errorEl.style.display = '';
    } else {
      errorEl.textContent = '';
      errorEl.style.display = 'none';
    }

    const visible = state.logs.filter(passes);
    if (!visible.length) {
      stream.innerHTML = '<div class="empty-state">' + SRH.icon('terminal') +
        '<span class="t">Nenhum log corresponde aos filtros atuais.</span>' +
        '<span style="font-size:11px">Remova um filtro ou desative o modo regex.</span></div>';
    } else {
      stream.innerHTML = visible.slice(0, 300).map(function (l) {
        const expanded = openSet.has(l.id);
        return '<div class="log-row is-' + l.level + '" data-log="' + l.id + '">' +
          '<span class="log-time">' + l.at.toLocaleTimeString('pt-BR', { hour12: false }) + '</span>' +
          '<span class="log-level" data-level="' + l.level + '">' + l.level.toUpperCase() + '</span>' +
          '<span class="log-service">' + l.service + '</span>' +
          '<span class="log-msg">' + highlight(l.message) + '</span>' +
          (expanded ? detail(l) : '') +
        '</div>';
      }).join('');
    }

    const total = state.logs.length;
    const errs = state.logs.filter(function (l) { return l.level === 'error'; }).length;
    const warns = state.logs.filter(function (l) { return l.level === 'warn'; }).length;
    document.getElementById('statTotal').textContent = SRH.num(total);
    document.getElementById('statErr').textContent = SRH.num(errs);
    document.getElementById('statWarn').textContent = SRH.num(warns);
    document.getElementById('statRate').textContent = SRH.num((errs / Math.max(1, total)) * 100, 1) + '%';
    document.getElementById('logCounts').innerHTML =
      '<span>' + visible.length + ' visíveis</span><span>' + total + ' na sessão</span><span>' + (state.paused ? 'pausado' : 'ao vivo') + '</span>';

    /* filtros ativos */
    const active = document.getElementById('activeFilters');
    const chips = [];
    if (state.service) chips.push({ field: 'service', value: state.service, builtin: true });
    if (state.host) chips.push({ field: 'host', value: state.host, builtin: true });
    if (state.level) chips.push({ field: 'level', value: state.level, builtin: true });
    state.filters.forEach(function (f, i) { chips.push({ field: f.field, value: f.value, idx: i }); });
    active.hidden = !chips.length;
    active.innerHTML = chips.map(function (c) {
      return '<span class="active-filter"><span class="lbl">' + c.field + ':</span>' + SRH.esc(c.value) +
        '<button data-remove-filter="' + (c.builtin ? c.field : c.idx) + '" data-builtin="' + (c.builtin ? '1' : '0') + '" aria-label="Remover filtro">' + SRH.icon('x') + '</button></span>';
    }).join('');
    active.querySelectorAll('[data-remove-filter]').forEach(function (b) {
      b.addEventListener('click', function () {
        const val = b.getAttribute('data-remove-filter');
        const builtin = b.getAttribute('data-builtin') === '1';
        if (builtin) {
          if (val === 'service') { state.service = ''; serviceEl.value = ''; }
          if (val === 'host') { state.host = ''; hostEl.value = ''; }
          if (val === 'level') { state.level = ''; document.querySelectorAll('#levelGroup button').forEach(function (x) { x.classList.toggle('is-active', x.getAttribute('data-level') === ''); }); }
        } else {
          state.filters.splice(Number(val), 1);
        }
        render();
      });
    });
  }

  /* expansão dos detalhes */
  stream.addEventListener('click', function (e) {
    const copyBtn = e.target.closest('[data-copy-log]');
    if (copyBtn) {
      const l = state.logs.filter(function (x) { return x.id === copyBtn.getAttribute('data-copy-log'); })[0];
      if (l) SRH.copy(JSON.stringify(l, null, 2));
      return;
    }
    if (e.target.closest('.log-detail')) return;
    const row = e.target.closest('[data-log]');
    if (!row) return;
    const id = row.getAttribute('data-log');
    if (openSet.has(id)) openSet.delete(id); else openSet.add(id);
    render();
  });

  /* filtros */
  searchEl.addEventListener('input', function () {
    state.q = searchEl.value.trim();
    render();
  });
  regexBtn.addEventListener('click', function () {
    state.regex = !state.regex;
    regexBtn.classList.toggle('is-on', state.regex);
    document.getElementById('regexHint').textContent = state.regex ? 'regex' : 'texto';
    render();
    searchEl.focus();
  });
  serviceEl.addEventListener('change', function () { state.service = serviceEl.value; render(); });
  hostEl.addEventListener('change', function () { state.host = hostEl.value; render(); });
  document.querySelectorAll('#levelGroup button').forEach(function (b) {
    b.addEventListener('click', function () {
      document.querySelectorAll('#levelGroup button').forEach(function (x) { x.classList.remove('is-active'); });
      b.classList.add('is-active');
      state.level = b.getAttribute('data-level');
      render();
    });
  });

  /* builder de filtros */
  const builder = document.getElementById('filterBuilder');
  document.getElementById('addFilterBtn').addEventListener('click', function () {
    builder.hidden = !builder.hidden;
    if (!builder.hidden) document.getElementById('filterValue').focus();
  });
  document.getElementById('cancelFilter').addEventListener('click', function () { builder.hidden = true; });
  document.getElementById('applyFilter').addEventListener('click', function () {
    const field = document.getElementById('filterField').value;
    const value = document.getElementById('filterValue').value.trim();
    if (!value) return;
    state.filters.push({ field: field, value: value });
    document.getElementById('filterValue').value = '';
    builder.hidden = true;
    render();
  });
  document.getElementById('filterValue').addEventListener('keydown', function (e) {
    if (e.key === 'Enter') document.getElementById('applyFilter').click();
  });

  /* stream */
  const pauseBtn = document.getElementById('pauseBtn');
  function setPaused(p) {
    state.paused = p;
    pauseBtn.querySelector('svg').outerHTML = SRH.icon(p ? 'play' : 'pause');
    pauseLabel.textContent = p ? 'Retomar' : 'Pausar';
    liveDot.style.animation = p ? 'none' : '';
    liveDot.style.background = p ? 'var(--text-3)' : 'var(--green)';
    liveText.textContent = p ? 'Pausado' : 'Ao vivo';
    render();
  }
  pauseBtn.addEventListener('click', function () { setPaused(!state.paused); });

  document.getElementById('clearLogs').addEventListener('click', function () {
    state.logs = [];
    openSet.clear();
    render();
    SRH.toast('Stream limpo · novos eventos continuam chegando');
  });
  document.getElementById('downloadLogs').addEventListener('click', function () {
    SRH.toast('Exportação NDJSON preparada com ' + state.logs.length + ' eventos');
  });

  setInterval(function () {
    if (state.paused) return;
    const n = Math.random() > 0.65 ? 2 : 1;
    for (let i = 0; i < n; i++) {
      const roll = Math.random();
      const lv = roll < 0.06 ? 'warn' : roll < 0.09 ? 'error' : 'info';
      const log = SRH.makeLog(SRH.logRng, new Date(), lv);
      state.logs.unshift(log);
    }
    if (state.logs.length > 420) state.logs.length = 420;
    render();
  }, 1800);

  SRH.hydrateIcons(document);
  render();
})();
