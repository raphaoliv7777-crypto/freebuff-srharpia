/* Dados simulados determinísticos — toda a plataforma lê daqui */
(function () {
  const SRH = (window.SRH = window.SRH || {});

  function mulberry32(a) {
    return function () {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function series(seed, n, base, amp, drift) {
    const r = mulberry32(seed);
    let v = base;
    const out = [];
    for (let i = 0; i < n; i++) {
      v += (r() - 0.5) * amp + (drift || 0);
      v = Math.max(base * 0.35, v);
      out.push(Math.round(v));
    }
    return out;
  }

  const statusLabel = { ok: 'Operacional', warn: 'Subdesempenho', crit: 'Atenção' };

  /* ---------------- serviços ---------------- */
  const rows = [
    ['api-gateway', 'API Gateway', 'Gateway', 'Node.js 20', 'ok', 1840, 124, 0.8, 'Squad Borda', '10.100.1', 99.95],
    ['auth-service', 'Auth Service', 'API', 'Go 1.22', 'ok', 620, 46, 0.2, 'Squad Identidade', '10.100.2', 99.99],
    ['data-service', 'Data Service', 'API', 'Java 21', 'warn', 410, 218, 2.4, 'Squad Dados', '10.100.3', 99.62],
    ['cache-redis', 'Cache Redis', 'Cache', 'Redis 7.2', 'ok', 5210, 12, 0.0, 'Squad Plataforma', '10.200.3', 100],
    ['worker', 'Worker', 'Worker', 'Python 3.12', 'warn', 96, 1840, 4.1, 'Squad Dados', '10.200.2', 98.9],
    ['storage', 'Storage', 'Storage', 'Rust 1.7', 'ok', 340, 34, 0.1, 'Squad Plataforma', '10.100.4', 99.98],
    ['frontend', 'Frontend', 'Frontend', 'Next.js 14', 'crit', 2260, 890, 8.6, 'Squad Produto', '10.200.1', 98.2],
    ['data-base', 'Data Base', 'Banco de dados', 'PostgreSQL 16', 'ok', 1180, 62, 0.2, 'Squad Dados', '10.200.4', 99.97],
    ['nginx', 'Nginx', 'Proxy', 'Nginx 1.26', 'ok', 6120, 8, 0.0, 'Squad Plataforma', '10.100.9', 100],
    ['notifications', 'Notifications', 'Worker', 'Node.js 20', 'ok', 220, 96, 0.4, 'Squad Engajamento', '10.100.12', 99.9],
    ['billing', 'Billing', 'API', 'Kotlin 2.0', 'ok', 180, 132, 0.6, 'Squad Financeiro', '10.100.14', 99.93],
    ['search', 'Search', 'API', 'Go 1.22', 'ok', 980, 74, 0.3, 'Squad Catálogo', '10.100.16', 99.95],
    ['scheduler', 'Scheduler', 'Worker', 'Python 3.12', 'ok', 42, 210, 0.2, 'Squad Plataforma', '10.200.7', 99.9],
    ['exporter', 'Metrics Exporter', 'Worker', 'Go 1.22', 'ok', 310, 28, 0.1, 'Squad Observabilidade', '10.200.8', 99.99],
    ['incident-bot', 'Incident Bot', 'Integração', 'Node.js 20', 'ok', 12, 180, 0.0, 'Squad SRE', '10.200.9', 99.9],
    ['reports', 'Reports', 'Worker', 'Python 3.12', 'warn', 18, 4200, 3.2, 'Squad Dados', '10.200.10', 98.7],
    ['media', 'Media Pipeline', 'Worker', 'Go 1.22', 'ok', 240, 460, 1.1, 'Squad Produto', '10.100.20', 99.6],
    ['session', 'Session Store', 'Cache', 'Redis 7.2', 'ok', 4120, 9, 0.0, 'Squad Identidade', '10.200.11', 100],
    ['catalog', 'Catalog', 'API', 'Java 21', 'ok', 760, 88, 0.5, 'Squad Catálogo', '10.100.22', 99.94],
    ['checkout', 'Checkout', 'API', 'Node.js 20', 'warn', 380, 640, 3.8, 'Squad Pagamentos', '10.100.23', 99.1],
    ['identity-sync', 'Identity Sync', 'Worker', 'Go 1.22', 'ok', 64, 320, 0.3, 'Squad Identidade', '10.200.13', 99.8],
    ['queue', 'Fila de Eventos', 'Fila', 'Kafka 3.7', 'ok', 3400, 14, 0.1, 'Squad Plataforma', '10.200.14', 99.99],
    ['ingest', 'Ingest API', 'API', 'Rust 1.7', 'ok', 8600, 18, 0.2, 'Squad Observabilidade', '10.100.30', 99.98],
    ['grafana-sync', 'Grafana Sync', 'Integração', 'Go 1.22', 'ok', 8, 220, 0.0, 'Squad Observabilidade', '10.200.16', 99.9]
  ];

  const kindIcon = {
    Gateway: 'globe', API: 'server', Cache: 'zap', Worker: 'cpu', Storage: 'hard-drive',
    Frontend: 'layers', 'Banco de dados': 'database', Proxy: 'network', Fila: 'inbox',
    'Integração': 'share'
  };

  const opSets = {
    'api-gateway': ['GET /v1/health', 'GET /v1/orders', 'POST /v1/orders', 'GET /v1/checkout', 'POST /v1/checkout', 'GET /v1/catalog'],
    'auth-service': ['POST /oauth/token', 'GET /v1/session', 'POST /v1/token/refresh', 'GET /v1/users/:id'],
    'data-service': ['GET /v1/orders/:id', 'GET /v1/metrics/query', 'POST /v1/events/batch', 'GET /v1/series'],
    'cache-redis': ['GET session:*', 'SET session:*', 'MGET product:*', 'EXPIRE session:*'],
    'data-base': ['SELECT orders', 'UPSERT sessions', 'SELECT metrics_rollup', 'VACUUM'],
    worker: ['job.process', 'job.retry', 'batch.flush', 'queue.consume'],
    frontend: ['GET /', 'GET /dashboard', 'GET /servicos', 'POST /login'],
    storage: ['PUT object', 'GET object', 'LIST bucket'],
    checkout: ['POST /v1/checkout', 'POST /v1/payment', 'GET /v1/cart'],
    search: ['GET /v1/search', 'POST /v1/reindex']
  };

  SRH.services = rows.map(function (r, i) {
    const s = {
      id: r[0], name: r[1], kind: r[2], lang: r[3], status: r[4],
      rps: r[5], p95: r[6], err: r[7], owner: r[8], ip: r[9], slo: r[10],
      p50: Math.round(r[6] * 0.42), p99: Math.round(r[6] * 1.9),
      uptime: Math.min(100, r[10] + 0.02),
      version: 'v2.8.' + (i % 9),
      icon: kindIcon[r[2]] || 'server',
      env: 'prd-south',
      seeded: 1200 + i * 37
    };
    const ops = opSets[s.id] || ['GET /v1/' + s.id, 'POST /v1/' + s.id, 'GET /v1/' + s.id + '/health'];
    s.endpoints = ops.map(function (op, j) {
      const parts = op.split(' ');
      const factor = 0.5 + ((i + j) % 5) * 0.22;
      return {
        method: parts[0], path: parts[1],
        p95: Math.round(s.p95 * factor),
        rps: Math.max(2, Math.round(s.rps / (j + 2.2))),
        err: Math.min(14, +(s.err * factor).toFixed(1))
      };
    });
    return s;
  });

  const byId = {};
  SRH.services.forEach(function (s) { byId[s.id] = s; });
  SRH.serviceById = function (id) { return byId[id] || null; };

  /* dependências declaradas */
  const depMap = {
    'api-gateway': ['auth-service', 'data-service', 'cache-redis', 'frontend'],
    'auth-service': ['cache-redis', 'data-base'],
    'data-service': ['data-base', 'cache-redis', 'storage'],
    worker: ['queue', 'data-base', 'storage'],
    frontend: ['api-gateway', 'auth-service'],
    checkout: ['api-gateway', 'billing', 'data-service'],
    search: ['cache-redis', 'data-base'],
    billing: ['queue', 'data-base'],
    catalog: ['cache-redis', 'data-base'],
    reports: ['data-base', 'storage'],
    media: ['storage', 'queue'],
    notifications: ['queue', 'auth-service'],
    session: ['data-base']
  };
  SRH.services.forEach(function (s) { s.deps = depMap[s.id] || []; });
  SRH.totalServices = 124;
  SRH.statusLabel = statusLabel;

  /* ---------------- topologia ---------------- */
  const nodeDefs = [
    ['pc-01', 'PC-01', '192.168.1.10', 'hard-drive', 'ok', 56, 112, 'host'],
    ['pc-02', 'PC-02', '192.168.1.11', 'hard-drive', 'crit', 56, 248, 'host'],
    ['cache-redis', 'Cache Redis', '10.200.3', 'zap', 'ok', 248, 48, 'service'],
    ['auth-service', 'Auth Service', '10.100.2', 'lock', 'ok', 248, 168, 'service'],
    ['worker', 'Worker', '10.200.2', 'layers', 'warn', 248, 288, 'service'],
    ['storage', 'Storage', '10.100.4', 'server', 'ok', 444, 92, 'service'],
    ['data-base', 'Data Base', '10.200.4', 'database', 'ok', 444, 232, 'service'],
    ['data-service', 'Data Service', '10.100.3', 'cpu', 'warn', 636, 48, 'service'],
    ['api-gateway', 'API Gateway', '10.100.1', 'globe', 'ok', 636, 168, 'service'],
    ['frontend', 'Frontend', '10.200.1', 'layers', 'ok', 636, 288, 'service'],
    ['pc-03', 'PC-03', '192.168.1.12', 'server', 'ok', 816, 112, 'host'],
    ['pc-04', 'PC-04', '192.168.1.13', 'server', 'crit', 816, 248, 'host']
  ];

  SRH.nodes = nodeDefs.map(function (n, i) {
    const r = mulberry32(900 + i * 13);
    return {
      id: n[0], label: n[1], ip: n[2], icon: n[3], status: n[4], x: n[5], y: n[6], kind: n[7],
      cpu: Math.round(18 + r() * 62), mem: Math.round(30 + r() * 55),
      disk: Math.round(12 + r() * 40), net: Math.round(10 + r() * 70),
      uptime: 99.2 + r() * 0.8, requests: Math.round(200 + r() * 4200),
      serviceId: byId[n[0]] ? n[0] : null,
      region: 'prd-south-a'
    };
  });

  const edgeDefs = [
    ['pc-01', 'cache-redis', 28], ['pc-01', 'auth-service', 44],
    ['pc-02', 'auth-service', 236], ['pc-02', 'worker', 96],
    ['cache-redis', 'storage', 22], ['auth-service', 'storage', 58],
    ['worker', 'storage', 132], ['storage', 'data-service', 74],
    ['storage', 'api-gateway', 61], ['data-base', 'data-service', 210],
    ['data-base', 'api-gateway', 168], ['data-service', 'pc-03', 88],
    ['api-gateway', 'pc-03', 52], ['api-gateway', 'pc-04', 118],
    ['worker', 'frontend', 64], ['frontend', 'pc-04', 340]
  ];
  SRH.edges = edgeDefs.map(function (e, i) {
    return {
      from: e[0], to: e[1], latency: e[2],
      state: e[2] >= 200 ? 'crit' : e[2] >= 80 ? 'warn' : 'ok',
      id: 'e' + i
    };
  });

  SRH.hosts = [
    { id: 'pc-01', name: 'PC-01', ip: '192.168.1.10', role: 'Nó de aplicação', status: 'ok', cpu: 28, gpu: 42, mem: 78, disk: 19, net: 67 },
    { id: 'pc-02', name: 'PC-02', ip: '192.168.1.11', role: 'Nó de aplicação', status: 'crit', cpu: 74, gpu: 61, mem: 88, disk: 44, net: 82 },
    { id: 'pc-03', name: 'PC-03', ip: '192.168.1.12', role: 'Nó de borda', status: 'ok', cpu: 36, gpu: 22, mem: 51, disk: 28, net: 55 },
    { id: 'pc-04', name: 'PC-04', ip: '192.168.1.13', role: 'Nó de dados', status: 'warn', cpu: 58, gpu: 47, mem: 69, disk: 63, net: 41 }
  ];

  /* ---------------- séries temporais ---------------- */
  SRH.series = series;
  SRH.traffic24h = series(7, 96, 11800, 2600, 12);
  SRH.latency24h = series(21, 96, 118, 26, 0.3);
  SRH.errors24h = series(33, 96, 0.7, 0.34, 0);
  SRH.hourLabels = (function () {
    const out = [];
    for (let h = 0; h <= 24; h += 4) out.push(String(h).padStart(2, '0') + ':00');
    return out;
  })();

  /* ---------------- eventos ---------------- */
  function clock(d) {
    return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }
  function stamp(d) {
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }) + ' (' + clock(d) + ')';
  }
  SRH.clock = clock;
  SRH.stamp = stamp;

  const now = new Date();
  SRH.events = [
    { at: new Date(now - 3 * 60000), service: 'Worker', level: 'info', message: 'Processamento do Job #6767 — concluído em 1,2s' },
    { at: new Date(now - 9 * 60000), service: 'Data Base', level: 'warn', message: 'Tempo de resposta acima do normal (320ms)' },
    { at: new Date(now - 16 * 60000), service: 'Nginx', level: 'error', message: 'Falha ao obter requisição GET /v1/checkout — status 502 (34ms)' },
    { at: new Date(now - 25 * 60000), service: 'Cache Redis', level: 'info', message: 'Cache hit ratio em 94,2% na última janela' },
    { at: new Date(now - 41 * 60000), service: 'Frontend', level: 'error', message: 'Timeout de 5s aguardando resposta de api-gateway' }
  ];

  SRH.overviewStatus = [
    { name: 'API', id: 'api-gateway', state: 'ok' },
    { name: 'Worker', id: 'worker', state: 'ok' },
    { name: 'Banco de dados', id: 'data-base', state: 'ok' },
    { name: 'Cache', id: 'cache-redis', state: 'warn' },
    { name: 'Nginx', id: 'nginx', state: 'ok' },
    { name: 'Frontend', id: 'frontend', state: 'crit' }
  ];

  /* ---------------- logs ---------------- */
  const logTemplates = [
    ['info', 'GET /v1/orders 200 em {ms}ms', 'api-gateway'],
    ['info', 'Health check respondido em 3ms', 'nginx'],
    ['info', 'Job #{n} concluído em {ms}ms', 'worker'],
    ['info', 'Cache hit ratio {pct}% na última janela', 'cache-redis'],
    ['info', 'Sessão renovada para usuário u_{n}', 'auth-service'],
    ['info', 'Batch de {n} eventos gravado com sucesso', 'data-service'],
    ['warn', 'Tempo de resposta acima do normal ({ms}ms) em GET /v1/checkout', 'checkout'],
    ['warn', 'Retry 2/3 para data-service após timeout de 800ms', 'api-gateway'],
    ['warn', 'Uso de memória em {pct}% no nó PC-02', 'exporter'],
    ['warn', 'Fila de eventos com lag de {n} mensagens', 'queue'],
    ['error', 'Falha ao obter requisição GET /v1/checkout — status 502 ({ms}ms)', 'nginx'],
    ['error', 'Não foi possível conectar ao Redis (ECONNREFUSED 10.200.3:6379)', 'auth-service'],
    ['error', 'Timeout de 5s aguardando resposta de auth-service', 'frontend'],
    ['error', 'Query SELECT orders excedeu o limite de 2s ({ms}ms)', 'data-base'],
    ['debug', 'Span span_{hex} encerrado com {n} eventos', 'ingest'],
    ['debug', 'Payload de fila drenado: {n} mensagens', 'worker'],
    ['debug', 'Amostragem ajustada para {pct}% (trace volume alto)', 'ingest']
  ];
  const logServices = ['api-gateway', 'auth-service', 'data-service', 'cache-redis', 'worker', 'data-base', 'frontend', 'nginx', 'checkout', 'queue', 'ingest'];

  function hex(n, r) {
    let out = '';
    const chars = '0123456789abcdef';
    for (let i = 0; i < n; i++) out += chars[Math.floor(r() * 16)];
    return out;
  }
  function fillTemplate(t, r) {
    return t
      .replace('{ms}', String(Math.round(8 + r() * 900)))
      .replace('{n}', String(Math.round(12 + r() * 9000)))
      .replace('{pct}', String((70 + r() * 29).toFixed(1)).replace('.', ','))
      .replace('{hex}', hex(8, r));
  }
  let logSeq = 4800;
  function makeLog(r, at, forceLevel) {
    const tpl = forceLevel ? logTemplates.filter(function (t) { return t[0] === forceLevel; })[Math.floor(r() * logTemplates.filter(function (t) { return t[0] === forceLevel; }).length)] : logTemplates[Math.floor(r() * logTemplates.length)];
    const service = tpl[2];
    logSeq += 1;
    return {
      id: 'log-' + logSeq,
      at: at,
      level: tpl[0],
      service: service,
      host: 'prd-south-' + (1 + Math.floor(r() * 4)),
      trace: hex(16, r),
      span: hex(8, r),
      message: fillTemplate(tpl[1], r),
      attrs: {
        env: 'prd-south', host: service + '-7d9f8c4b6-xxxxx', http_status: tpl[0] === 'error' ? 502 : 200,
        duration_ms: Math.round(8 + r() * 900), pod: service + '-' + Math.floor(r() * 900 + 100),
        region: 'south-america-east-1'
      }
    };
  }
  const seedLogs = mulberry32(2024);
  SRH.logs = [];
  for (let i = 60; i > 0; i--) {
    const lv = i % 23 === 0 ? 'error' : i % 6 === 0 ? 'warn' : i % 11 === 0 ? 'debug' : 'info';
    const log = makeLog(seedLogs, new Date(Date.now() - i * 42000), lv);
    log.at = new Date(Date.now() - i * 42000);
    SRH.logs.push(log);
  }
  SRH.makeLog = makeLog;
  SRH.logRng = mulberry32(991);

  /* ---------------- traces ---------------- */
  const traceSeeds = [
    ['POST /v1/checkout', 'api-gateway', 412, 0, 9], ['GET /v1/orders', 'api-gateway', 186, 0, 7],
    ['GET /v1/catalog', 'search', 94, 0, 5], ['POST /oauth/token', 'auth-service', 38, 0, 4],
    ['GET /dashboard', 'frontend', 890, 0, 12], ['POST /v1/orders', 'api-gateway', 1240, 2, 11],
    ['job.process', 'worker', 1840, 0, 8], ['GET /v1/orders/:id', 'data-service', 218, 1, 6],
    ['POST /v1/payment', 'checkout', 640, 1, 10], ['GET /v1/search', 'search', 74, 0, 4],
    ['PUT object', 'storage', 156, 0, 3], ['POST /v1/events/batch', 'data-service', 320, 0, 6],
    ['GET /v1/session', 'auth-service', 26, 0, 3], ['GET /v1/metrics/query', 'data-service', 2680, 2, 9],
    ['GET /', 'frontend', 420, 1, 8], ['job.retry', 'worker', 980, 1, 5]
  ];
  const tr = mulberry32(551);
  SRH.traces = traceSeeds.map(function (t, i) {
    const id = hex(16, tr);
    return {
      id: id,
      op: t[0], root: t[1], dur: t[2], errors: t[3], spans: t[4],
      at: new Date(Date.now() - (i * 4 + 1) * 60000),
      state: t[3] > 0 ? 'crit' : t[2] > 900 ? 'warn' : 'ok',
      sampled: true, http: t[2] > 1200 ? 504 : 200, host: t[1] + '-7d9f8c4b6-8xk2p',
      user: 'u_' + (1000 + i * 7)
    };
  });
  SRH.traceById = function (id) {
    return SRH.traces.filter(function (t) { return t.id === id; })[0] || null;
  };

  SRH.traceSpans = function (trace) {
    const r = mulberry32(parseInt(trace.id.slice(0, 8), 16) || 77);
    const total = trace.dur;
    const spans = [];
    let n = 0;
    function add(service, op, depth, start, dur, extra) {
      spans.push(Object.assign({
        id: 'span_' + hex(6, r), service: service, op: op, depth: depth,
        start: Math.round(start), dur: Math.max(2, Math.round(dur)),
        state: 'ok', kind: 'server'
      }, extra || {}));
      n++;
    }
    add(trace.root, trace.op, 0, 0, total, { kind: 'server', state: trace.errors ? 'crit' : 'ok' });
    const gw = trace.root === 'api-gateway' ? total * 0.12 : total * 0.18;
    add('api-gateway', 'HTTP ' + (trace.http || 200), 1, total * 0.04, gw);
    add('auth-service', 'POST /oauth/token', 2, total * 0.06, Math.max(8, total * 0.09), { kind: 'client' });
    add('cache-redis', 'GET session:*', 3, total * 0.08, Math.max(2, total * 0.02), { kind: 'client' });
    add('data-service', 'GET /v1/orders', 2, total * 0.2, total * 0.42);
    add('data-base', 'SELECT orders', 3, total * 0.26, total * 0.3, { kind: 'client', state: trace.errors ? 'warn' : 'ok' });
    add('cache-redis', 'MGET product:*', 3, total * 0.55, Math.max(2, total * 0.03), { kind: 'client' });
    add('worker', 'job.enqueue', 2, total * 0.7, Math.max(6, total * 0.12), { kind: 'producer' });
    add('queue', 'publish checkout.completed', 3, total * 0.72, Math.max(2, total * 0.02), { kind: 'client' });
    if (trace.errors) {
      add('checkout', 'POST /v1/payment', 2, total * 0.82, total * 0.16, { state: 'crit', kind: 'client' });
    }
    add('storage', 'PUT object', 2, total * 0.86, Math.max(4, total * 0.1), { kind: 'client' });
    trace.spans = spans.length;
    return spans;
  };

  /* ---------------- second brain ---------------- */
  const clusters = {
    arquitetura: { name: 'Arquitetura', color: '#D7FF00' },
    observabilidade: { name: 'Observabilidade', color: '#1AFF53' },
    operacao: { name: 'Operação', color: '#FFC61A' },
    dados: { name: 'Dados e retenção', color: '#D3009E' },
    decisoes: { name: 'Decisões', color: '#6F9AFF' }
  };
  SRH.clusters = clusters;

  const notes = [
    {
      slug: 'moc', title: 'Mapa de conteúdo', cluster: 'arquitetura', x: 500, y: 258, root: true,
      updated: '11 nov 2026', owner: 'SRE', tags: ['moc', 'índice'],
      links: ['arquitetura-referencia', 'pilares-observabilidade', 'runbook-latencia', 'modelo-de-dados', 'adr-001-topologia'],
      body: `<p>Este é o mapa de conteúdo (MOC) do second brain da SrHarpia. Ele organiza o conhecimento do time em cinco frentes: arquitetura, observabilidade, operação, dados e decisões.</p><p>Cada nota é curta e ligada a outras notas. Ao abrir uma nota, use as ligações no fim do texto para navegar pelo grafo — as notas que apontam para ela aparecem em <strong>Backlinks</strong>.</p><h4>Como usar</h4><ul><li>Comece pela nota de arquitetura de referência para entender o desenho dos serviços.</li><li>Para investigar latência, siga <em>Tracing distribuído</em> e o runbook de latência p95.</li><li>Toda decisão relevante vira uma ADR com contexto, decisão e consequências.</li></ul><p>O grafo é gerado a partir das ligações reais entre as notas: nada aqui é decorativo.</p>`
    },
    {
      slug: 'arquitetura-referencia', title: 'Arquitetura de referência', cluster: 'arquitetura', x: 350, y: 148,
      updated: '09 nov 2026', owner: 'Squad Plataforma', tags: ['arquitetura', 'visão geral'],
      links: ['mapa-de-servicos', 'api-gateway', 'mensageria', 'cache-estrategia', 'pilares-observabilidade', 'adr-001-topologia'],
      body: `<p>A plataforma é composta por 124 serviços distribuídos em três camadas: borda (gateway, frontend, proxy), domínio (auth, catálogo, checkout, dados) e plataforma (fila, storage, cache, observabilidade).</p><h4>Camadas</h4><ul><li><strong>Borda</strong> — termina TLS, aplica rate limit e injeta o trace id. Tudo que entra passa pelo API Gateway.</li><li><strong>Domínio</strong> — serviços de negócio, um banco por domínio, comunicação síncrona apenas quando necessário.</li><li><strong>Plataforma</strong> — cache, fila, storage e agentes de telemetria compartilhados.</li></ul><p>O acoplamento entre domínios acontece por eventos. Chamadas síncronas são permitidas somente na leitura de dados essenciais ao fluxo do usuário.</p>`
    },
    {
      slug: 'mapa-de-servicos', title: 'Mapa de serviços', cluster: 'arquitetura', x: 226, y: 214,
      updated: '08 nov 2026', owner: 'Squad Plataforma', tags: ['topologia', 'dependências'],
      links: ['api-gateway', 'cache-estrategia', 'tracing-distribuido', 'runbook-latencia'],
      body: `<p>O mapa topológico é a fonte primária de dependências. Ele é construído a partir dos spans exportados pelos agentes, não de um diagrama mantido à mão.</p><h4>Regra de leitura</h4><ul><li>Linhas verdes: latência abaixo de 80ms.</li><li>Linhas âmbar: entre 80ms e 200ms.</li><li>Linhas vermelhas: acima de 200ms ou erro na janela.</li></ul><p>Nós com ponto vermelho indicam serviço saturado ou indisponível. O mapa é atualizado a cada 30 segundos com base na janela de 5 minutos.</p>`
    },
    {
      slug: 'api-gateway', title: 'API Gateway', cluster: 'arquitetura', x: 330, y: 300,
      updated: '07 nov 2026', owner: 'Squad Borda', tags: ['gateway', 'tráfego'],
      links: ['mapa-de-servicos', 'cache-estrategia', 'metricas-retencao'],
      body: `<p>O API Gateway é o único ponto de entrada de tráfego externo. Responsável por autenticação, rate limit por chave, injeção de trace id e agregação de respostas do checkout.</p><h4>Limites atuais</h4><ul><li>3.000 req/s por região, com burst de 4.500.</li><li>Timeout padrão de 2s para serviços de domínio.</li><li>Circuit breaker aberto após 20% de erro em 30s.</li></ul><p>Latência p95 atual: 124ms. O gargalo conhecido é a serialização de payload de checkout, medida em 18ms por requisição.</p>`
    },
    {
      slug: 'mensageria', title: 'Mensageria e filas', cluster: 'arquitetura', x: 150, y: 132,
      updated: '06 nov 2026', owner: 'Squad Plataforma', tags: ['kafka', 'assíncrono'],
      links: ['mapa-de-servicos', 'capacidade-escala', 'pipeline-logs'],
      body: `<p>Eventos de domínio trafegam pelo Kafka em tópicos por bounded context. Consumidores usam commit manual e idempotência por chave de negócio.</p><h4>Práticas</h4><ul><li>Um tópico por evento de domínio, versionado no nome.</li><li>Retenção de 7 dias; compactação apenas em tópicos de estado.</li><li>Consumer lag acima de 5.000 mensagens dispara alerta de subdesempenho.</li></ul><p>O worker processa lotes de até 500 mensagens e publica o resultado em <code>checkout.completed</code>.</p>`
    },
    {
      slug: 'cache-estrategia', title: 'Cache e invalidação', cluster: 'arquitetura', x: 176, y: 296,
      updated: '05 nov 2026', owner: 'Squad Identidade', tags: ['redis', 'cache'],
      links: ['mapa-de-servicos', 'api-gateway'], body: `<p>Redis é usado para sessão, catálogo e rate limit. A política é cache-aside com TTL curto e invalidação por evento.</p><h4>Chaves</h4><ul><li><code>session:*</code> — TTL de 30 minutos, renovado a cada requisição autenticada.</li><li><code>product:*</code> — TTL de 5 minutos, invalidado por evento de catálogo.</li><li><code>ratelimit:*</code> — janela deslizante de 60s.</li></ul><p>Hit ratio saudável acima de 90%. Abaixo de 80% por 10 minutos, o alerta de cache é acionado.</p>`
    },
    {
      slug: 'pilares-observabilidade', title: 'Pilares de observabilidade', cluster: 'observabilidade', x: 664, y: 122,
      updated: '10 nov 2026', owner: 'Squad Observabilidade', tags: ['métricas', 'logs', 'tracing'],
      links: ['metricas-retencao', 'tracing-distribuido', 'pipeline-logs', 'slo-error-budget', 'alertas-plantao'],
      body: `<p>Métricas, logs e traces são tratados como um único sistema de investigação, não como ferramentas separadas. Todo sinal carrega <code>service</code>, <code>env</code> e <code>trace_id</code>.</p><h4>Padrões</h4><ul><li>Métricas no formato Prometheus, nomes com unidade explícita.</li><li>Logs estruturados em JSON, uma linha por evento, sem PII.</li><li>Traces com amostragem adaptativa e propagação W3C.</li></ul><p>A investigação começa pelo sintoma (métrica), desce para o trace e termina no log do span mais lento.</p>`
    },
    {
      slug: 'metricas-retencao', title: 'Métricas e resolução', cluster: 'observabilidade', x: 790, y: 92,
      updated: '09 nov 2026', owner: 'Squad Observabilidade', tags: ['séries temporais', 'prometheus'],
      links: ['retencao-camadas', 'amostragem-adaptativa', 'capacidade-escala'],
      body: `<p>Séries temporais são coletadas a cada 10 segundos pelos agentes e agregadas em rollups de 1 minuto, 1 hora e 1 dia.</p><h4>Resolução por janela</h4><ul><li>Últimas 6 horas: 10s, consulta direta.</li><li>24 horas: 1 minuto, rollup em memória.</li><li>30 dias: 1 hora, armazenamento em camadas.</li></ul><p>Consultas acima de 8.640 pontos são reduzidas automaticamente no servidor para manter o painel responsivo.</p>`
    },
    {
      slug: 'tracing-distribuido', title: 'Distributed tracing', cluster: 'observabilidade', x: 722, y: 216,
      updated: '10 nov 2026', owner: 'Squad Observabilidade', tags: ['trace', 'spans', 'latência'],
      links: ['amostragem-adaptativa', 'adr-002-tracing', 'runbook-latencia', 'pilares-observabilidade'],
      body: `<p>Toda requisição recebe um trace id no gateway e o propaga via header W3C <code>traceparent</code>. Cada serviço cria um span com atributos de operação, host e status.</p><h4>Análise de waterfall</h4><ul><li>Barras representam spans; o comprimento é proporcional à duração.</li><li>Espaços vazios indicam tempo de espera, não processamento.</li><li>O caminho crítico é destacado em lima.</li></ul><p>Amostragem atual: 20% fixa, com 100% para requisições com erro ou acima de 1s.</p>`
    },
    {
      slug: 'pipeline-logs', title: 'Pipeline de logs', cluster: 'observabilidade', x: 836, y: 262,
      updated: '08 nov 2026', owner: 'Squad Observabilidade', tags: ['logs', 'kafka', 'regex'],
      links: ['retencao-camadas', 'alertas-plantao', 'adr-003-retencao'],
      body: `<p>Agentes tailam stdout, aplicam parsing JSON e enviam em lote para o coletor. O coletor deduplica, aplica <code>sampling</code> por nível e grava no armazenamento de logs.</p><h4>Busca</h4><ul><li>Filtros por serviço, host, nível e trace id.</li><li>Busca textual livre com destaque de correspondência.</li><li>Modo regex para investigação avançada, com limite de complexidade.</li></ul><p>Logs de nível debug são amostrados em 10% por padrão para conter custo.</p>`
    },
    {
      slug: 'slo-error-budget', title: 'SLO e orçamento de erro', cluster: 'observabilidade', x: 604, y: 292,
      updated: '07 nov 2026', owner: 'SRE', tags: ['slo', 'confiabilidade'],
      links: ['alertas-plantao', 'runbook-latencia', 'postmortem-12-10'], body: `<p>Cada serviço de domínio tem um SLO de disponibilidade e outro de latência. O orçamento de erro é a diferença entre o SLO e 100%.</p><h4>Metas</h4><ul><li>API Gateway: 99,95% de disponibilidade, p95 abaixo de 200ms.</li><li>Checkout: 99,9% e p95 abaixo de 800ms.</li><li>Ingestão de telemetria: 99,98%.</li></ul><p>Quando 75% do orçamento mensal é consumido, o time entra em modo de confiabilidade: novas features pausam até o orçamento se recuperar.</p>`
    },
    {
      slug: 'alertas-plantao', title: 'Alertas e plantão', cluster: 'observabilidade', x: 806, y: 156,
      updated: '06 nov 2026', owner: 'SRE', tags: ['alertas', 'on-call'],
      links: ['runbook-latencia', 'postmortem-12-10', 'adr-002-tracing'],
      body: `<p>Alertas são sintomas de impacto no usuário, não causas internas. Cada alerta precisa de uma ação clara e de um runbook ligado a ele.</p><h4>Regras de ouro</h4><ul><li>Erro acima de 2% por 5 minutos: página imediata.</li><li>Latência p95 acima do SLO por 10 minutos: página.</li><li>Saturação de nó acima de 85% por 15 minutos: aviso no canal.</li></ul><p>Alertas sem ação nos últimos 90 dias são candidatos a remoção na revisão trimestral.</p>`
    },
    {
      slug: 'runbook-latencia', title: 'Runbook: latência p95', cluster: 'operacao', x: 298, y: 386,
      updated: '11 nov 2026', owner: 'SRE', tags: ['runbook', 'latência'],
      links: ['runbook-no-fora', 'capacidade-escala', 'postmortem-12-10', 'tracing-distribuido'],
      body: `<p>Use este runbook quando o alerta de latência p95 disparar para api-gateway ou checkout.</p><h4>Passos</h4><ul><li>Abra o mapa topológico e identifique as arestas acima de 200ms.</li><li>No tracing, filtre pela operação afetada e ordene por duração.</li><li>Verifique o span mais lento: banco, cache ou dependência externa.</li><li>Confira cache hit ratio e saturação do nó correspondente.</li><li>Se o gargalo for banco, verifique conexões ativas antes de escalar.</li></ul><p>Registre o trace id no incidente. Sem trace, a investigação não é considerada concluída.</p>`
    },
    {
      slug: 'runbook-no-fora', title: 'Runbook: nó fora', cluster: 'operacao', x: 168, y: 442,
      updated: '04 nov 2026', owner: 'SRE', tags: ['runbook', 'infraestrutura'],
      links: ['capacidade-escala', 'runbook-latencia'], body: `<p>Quando um nó sai do cluster, o tráfego é redistribuído automaticamente. O risco está na capacidade restante.</p><h4>Passos</h4><ul><li>Confirme o estado do nó no mapa e o motivo do desligamento.</li><li>Verifique CPU e memória dos nós restantes na página de métricas.</li><li>Se a saturação passar de 80%, reduza o tráfego não essencial.</li><li>Confirme que os pods migraram e que os health checks estão verdes.</li><li>Abra incidente se a recuperação passar de 15 minutos.</li></ul>`
    },
    {
      slug: 'capacidade-escala', title: 'Capacidade e escala', cluster: 'operacao', x: 390, y: 462,
      updated: '03 nov 2026', owner: 'Squad Plataforma', tags: ['capacidade', 'escala'],
      links: ['metricas-retencao', 'runbook-latencia', 'mensageria'],
      body: `<p>O cluster opera com 40% de folga planejada. Escalamos horizontalmente por CPU e por profundidade de fila, com limites por serviço.</p><h4>Limites</h4><ul><li>API Gateway: 12 réplicas por região.</li><li>Workers: 30 réplicas, escala por lag de fila.</li><li>Banco: somente vertical, com réplica de leitura.</li></ul><p>Revisão mensal de capacidade usa o pico dos últimos 90 dias e projeta 30% de crescimento.</p>`
    },
    {
      slug: 'postmortem-12-10', title: 'Postmortem: 12/10', cluster: 'operacao', x: 492, y: 386,
      updated: '13 out 2026', owner: 'SRE', tags: ['postmortem', 'incidente'],
      links: ['runbook-latencia', 'slo-error-budget', 'alertas-plantao'], body: `<p>Incidente de 38 minutos no checkout, iniciado às 14h12. Causa: pool de conexões do data-service esgotado após deploy de índice.</p><h4>Linha do tempo</h4><ul><li>14h12 — latência p95 sobe de 180ms para 2,4s.</li><li>14h18 — alerta de SLO dispara e o plantão assume.</li><li>14h31 — causa identificada no waterfall de tracing.</li><li>14h50 — pool ampliado e tráfego normalizado.</li></ul><h4>Ações</h4><ul><li>Aumentar o pool padrão e adicionar alerta de conexões ativas.</li><li>Incluir verificação de pool no runbook de latência.</li><li>Reduzir o tempo de detecção com alerta em 2 minutos.</li></ul>`
    },
    {
      slug: 'modelo-de-dados', title: 'Modelo de dados', cluster: 'dados', x: 590, y: 424,
      updated: '02 nov 2026', owner: 'Squad Dados', tags: ['modelagem', 'postgres'],
      links: ['retencao-camadas', 'mapa-de-servicos'], body: `<p>Cada domínio tem seu banco. Não há joins entre domínios: dados necessários são replicados por evento.</p><h4>Convenções</h4><ul><li>Chaves primárias UUID v7, ordenáveis por tempo.</li><li>Colunas de tempo em UTC, sufixo <code>_at</code>.</li><li>Soft delete com <code>deleted_at</code>, nunca remoção física.</li></ul><p>Métricas usam tabelas de rollup em vez de agregação em tempo de consulta.</p>`
    },
    {
      slug: 'retencao-camadas', title: 'Retenção em camadas', cluster: 'dados', x: 714, y: 374,
      updated: '06 nov 2026', owner: 'Squad Observabilidade', tags: ['retenção', 'custo'],
      links: ['adr-003-retencao', 'metricas-retencao', 'pipeline-logs'], body: `<p>Telemetria é armazenada em três camadas com custo decrescente: quente, morna e fria.</p><h4>Prazos</h4><ul><li>Métricas: 6h em 10s, 30 dias em 1 min, 13 meses em 1h.</li><li>Logs: 7 dias em busca completa, 30 dias em consulta lenta.</li><li>Traces: 7 dias, com 1% de amostragem permanente.</li></ul><p>A camada fria fica em storage de objetos e é consultada sob demanda.</p>`
    },
    {
      slug: 'amostragem-adaptativa', title: 'Amostragem adaptativa', cluster: 'dados', x: 800, y: 430,
      updated: '05 nov 2026', owner: 'Squad Observabilidade', tags: ['tracing', 'custo'],
      links: ['tracing-distribuido', 'metricas-retencao'], body: `<p>A amostragem adaptativa ajusta a taxa por serviço e por operação a cada minuto, mantendo traces de erro e de latência alta.</p><h4>Regras</h4><ul><li>Erro ou duração acima de 1s: sempre amostrar.</li><li>Tráfego saudável: taxa entre 5% e 20%.</li><li>Operações raras: 100% até 10 mil spans por minuto.</li></ul><p>O objetivo é manter o volume diário abaixo de 120 milhões de spans sem perder capacidade de diagnóstico.</p>`
    },
    {
      slug: 'adr-001-topologia', title: 'ADR-001 Topologia derivada', cluster: 'decisoes', x: 640, y: 472,
      updated: '28 out 2026', owner: 'Squad Plataforma', tags: ['adr', 'arquitetura'],
      links: ['arquitetura-referencia', 'mapa-de-servicos'], body: `<p><strong>Contexto.</strong> Diagramas manuais ficavam desatualizados em poucos dias. <strong>Decisão.</strong> A topologia passa a ser derivada dos spans e métricas dos agentes.</p><h4>Consequências</h4><ul><li>O mapa reflete o que está em execução, não o que foi documentado.</li><li>Dependências observadas aparecem mesmo que não estejam declaradas.</li><li>É necessário manter a instrumentação consistente entre serviços.</li></ul>`
    },
    {
      slug: 'adr-002-tracing', title: 'ADR-002 Amostragem adaptativa', cluster: 'decisoes', x: 880, y: 350,
      updated: '27 out 2026', owner: 'Squad Observabilidade', tags: ['adr', 'tracing'],
      links: ['tracing-distribuido', 'amostragem-adaptativa'], body: `<p><strong>Contexto.</strong> A amostragem fixa em 100% estourou o orçamento de armazenamento; em 5%, perdia incidentes. <strong>Decisão.</strong> Adotar amostragem adaptativa baseada em erro, latência e raridade da operação.</p><h4>Consequências</h4><ul><li>Redução de 68% no volume de spans.</li><li>Traces de erro continuam completos.</li><li>A taxa deixa de ser previsível, exigindo monitorar o volume por serviço.</li></ul>`
    },
    {
      slug: 'adr-003-retencao', title: 'ADR-003 Retenção em camadas', cluster: 'decisoes', x: 580, y: 316,
      updated: '26 out 2026', owner: 'Squad Observabilidade', tags: ['adr', 'custo'],
      links: ['retencao-camadas', 'pipeline-logs'], body: `<p><strong>Contexto.</strong> Consultas de 13 meses sobre dados brutos eram caras e lentas. <strong>Decisão.</strong> Separar retenção em camadas com resoluções diferentes e exportação fria.</p><h4>Consequências</h4><ul><li>Custo de armazenamento 54% menor.</li><li>Investigações antigas exigem rollup de 1 hora.</li><li>A exportação fria passa a fazer parte do fluxo de auditoria.</li></ul>`
    },
    {
      slug: 'adr-004-densidade', title: 'ADR-004 Densidade da interface', cluster: 'decisoes', x: 522, y: 152,
      updated: '25 out 2026', owner: 'Design', tags: ['adr', 'interface'],
      links: ['arquitetura-referencia', 'pilares-observabilidade'], body: `<p><strong>Contexto.</strong> Engenheiros alternam entre monitoramento e investigação; telas arejadas demais escondem informação e telas densas demais dificultam leitura. <strong>Decisão.</strong> Adotar densidade média em 13px, fundo escuro, acento lima e estados representados por cor e texto, sem pílulas.</p><h4>Consequências</h4><ul><li>Mais linhas visíveis sem perder legibilidade.</li><li>Hierarquia depende de tipografia e espaço, não de componentes chamativos.</li><li>Estados precisam ser legíveis também para quem não distingue cores: sempre há texto ao lado do indicador.</li></ul>`
    }
  ];
  SRH.notes = notes;
  SRH.noteBySlug = function (slug) {
    return notes.filter(function (n) { return n.slug === slug; })[0] || null;
  };
  SRH.backlinks = function (slug) {
    return notes.filter(function (n) { return n.links.indexOf(slug) > -1; });
  };
  SRH.mocOrder = ['arquitetura', 'observabilidade', 'operacao', 'dados', 'decisoes'];
})();
