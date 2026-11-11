/* Mapa topológico interativo: pan, zoom, arraste de nós e inspetor */
(function () {
  const SRH = window.SRH;
  const W = 980, H = 430, NW = 154, NH = 56;
  const viewport = document.getElementById('topoViewport');
  const world = document.getElementById('topoWorld');
  const edgesSvg = document.getElementById('topoEdges');
  const inspector = document.getElementById('topoInspector');
  const zoomLabel = document.getElementById('zoomLabel');

  const nodes = SRH.nodes.map(function (n) { return Object.assign({}, n); });
  const edgeState = { ok: '#1AFF53', warn: '#FFC61A', crit: '#FF2121' };
  let view = { x: 0, y: 0, s: 1 };
  let labels = false;
  let flow = false;
  let query = '';
  let selected = null;
  let drag = null;
  let pan = null;

  function applyView() {
    world.style.transform = 'translate(' + view.x + 'px,' + view.y + 'px) scale(' + view.s + ')';
    zoomLabel.textContent = 'Zoom ' + Math.round(view.s * 100) + '%';
    viewport.style.backgroundSize = 'auto, ' + (22 * view.s) + 'px ' + (22 * view.s) + 'px';
    viewport.style.backgroundPosition = view.x + 'px ' + view.y + 'px, ' + view.x + 'px ' + view.y + 'px';
  }

  function nodeById(id) {
    return nodes.filter(function (n) { return n.id === id; })[0];
  }

  function matches(n) {
    if (!query) return true;
    const q = query.toLowerCase();
    return (n.label + ' ' + n.ip + ' ' + n.id).toLowerCase().indexOf(q) > -1;
  }

  function edgeGeometry(e) {
    const a = nodeById(e.from), b = nodeById(e.to);
    if (!a || !b) return null;
    const ay = a.y + NH / 2, by = b.y + NH / 2;
    const goingRight = b.x > a.x;
    const ax = goingRight ? a.x + NW + 2 : a.x - 2;
    const bx = goingRight ? b.x - 7 : b.x + NW + 7;
    const dx = bx - ax;
    const c1 = ax + dx * 0.45, c2 = bx - dx * 0.45;
    const mx = (ax + 3 * c1 + 3 * c2 + bx) / 8;
    const my = (ay + 3 * ay + 3 * by + by) / 8;
    return { ax: ax, ay: ay, bx: bx, by: by, c1: c1, c2: c2, mx: mx, my: my };
  }

  function drawEdges() {
    let defs = '<defs>';
    Object.keys(edgeState).forEach(function (k) {
      defs += '<marker id="arw-' + k + '" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto">' +
        '<path d="M0 0 L10 5 L0 10 z" fill="' + edgeState[k] + '"/></marker>';
    });
    defs += '</defs>';
    let body = '';
    SRH.edges.forEach(function (e) {
      const g = edgeGeometry(e);
      if (!g) return;
      const on = matches(nodeById(e.from)) && matches(nodeById(e.to));
      body += '<path class="topo-edge' + (flow ? ' flow' : '') + '" d="M' + g.ax + ' ' + g.ay +
        ' C ' + g.c1 + ' ' + g.ay + ', ' + g.c2 + ' ' + g.by + ', ' + g.bx + ' ' + g.by + '"' +
        ' stroke="' + edgeState[e.state] + '" marker-end="url(#arw-' + e.state + ')"' +
        (on ? '' : ' opacity=".12"') + '/>';
      if (labels) {
        body += '<text class="topo-edge-label" x="' + g.mx.toFixed(1) + '" y="' + (g.my - 5).toFixed(1) + '" text-anchor="middle"' + (on ? '' : ' opacity=".15"') + '>' + e.latency + 'ms</text>';
      }
    });
    edgesSvg.innerHTML = defs + body;
  }

  function drawNodes() {
    nodes.forEach(function (n) {
      let el = document.getElementById('tn-' + n.id);
      if (!el) {
        el = document.createElement('button');
        el.id = 'tn-' + n.id;
        el.className = 'topo-node';
        el.type = 'button';
        el.style.left = n.x + 'px';
        el.style.top = n.y + 'px';
        el.innerHTML = '<span class="node-icon">' + SRH.icon(n.icon) + '</span>' +
          '<span class="node-text"><span class="node-name">' + n.label + '</span><span class="node-ip">' + n.ip + '</span></span>' +
          '<span class="node-dot" data-state="' + n.status + '"></span>';
        el.addEventListener('pointerdown', startDrag);
        el.addEventListener('click', function (e) {
          e.stopPropagation();
          if (el.dataset.moved === '1') { el.dataset.moved = '0'; return; }
          select(n.id);
        });
        world.appendChild(el);
      }
      el.style.left = n.x + 'px';
      el.style.top = n.y + 'px';
      el.classList.toggle('is-dim', !matches(n));
      el.classList.toggle('is-selected', selected === n.id);
    });
  }

  function centerWorld() {
    const vw = viewport.clientWidth, vh = viewport.clientHeight;
    const s = Math.min(1, (vw - 24) / W);
    view.s = s;
    view.x = (vw - W * s) / 2;
    view.y = (vh - H * s) / 2;
    applyView();
  }

  function zoomAt(factor, cx, cy) {
    const rect = viewport.getBoundingClientRect();
    const px = cx == null ? rect.width / 2 : cx;
    const py = cy == null ? rect.height / 2 : cy;
    const s2 = SRH.clamp(view.s * factor, 0.55, 1.9);
    const wx = (px - view.x) / view.s;
    const wy = (py - view.y) / view.s;
    view.s = s2;
    view.x = px - wx * s2;
    view.y = py - wy * s2;
    applyView();
  }

  function startDrag(e) {
    if (e.button !== 0) return;
    e.stopPropagation();
    const n = nodeById(e.currentTarget.id.replace('tn-', ''));
    const el = e.currentTarget;
    drag = { n: n, el: el, sx: e.clientX, sy: e.clientY, nx: n.x, ny: n.y, moved: false };
  }

  viewport.addEventListener('pointerdown', function (e) {
    if (e.target.closest('.topo-node') || e.target.closest('.topo-inspector')) return;
    if (e.button !== 0) return;
    pan = { sx: e.clientX, sy: e.clientY, ox: view.x, oy: view.y, moved: false };
    viewport.classList.add('is-panning');
  });

  window.addEventListener('pointermove', function (e) {
    if (drag) {
      const dx = (e.clientX - drag.sx) / view.s;
      const dy = (e.clientY - drag.sy) / view.s;
      if (Math.abs(dx) + Math.abs(dy) > 2) drag.moved = true;
      drag.n.x = SRH.clamp(drag.nx + dx, 4, W - NW - 4);
      drag.n.y = SRH.clamp(drag.ny + dy, 4, H - NH - 4);
      drag.el.style.left = drag.n.x + 'px';
      drag.el.style.top = drag.n.y + 'px';
      drawEdges();
    } else if (pan) {
      pan.moved = true;
      view.x = pan.ox + (e.clientX - pan.sx);
      view.y = pan.oy + (e.clientY - pan.sy);
      applyView();
    }
  });

  window.addEventListener('pointerup', function (e) {
    if (drag) {
      if (drag.moved) drag.el.dataset.moved = '1';
      drawEdges();
      drag = null;
    }
    if (pan) {
      viewport.classList.remove('is-panning');
      if (!pan.moved) closeInspector();
      pan = null;
    }
  });

  viewport.addEventListener('wheel', function (e) {
    if (!(e.ctrlKey || e.metaKey)) return;
    e.preventDefault();
    const r = viewport.getBoundingClientRect();
    zoomAt(e.deltaY < 0 ? 1.12 : 0.89, e.clientX - r.left, e.clientY - r.top);
  }, { passive: false });

  document.querySelectorAll('[data-zoom]').forEach(function (b) {
    b.addEventListener('click', function () {
      const z = b.getAttribute('data-zoom');
      if (z === 'in') zoomAt(1.18);
      else if (z === 'out') zoomAt(0.85);
      else centerWorld();
    });
  });

  document.getElementById('toggleLabels').addEventListener('click', function () {
    labels = !labels;
    this.classList.toggle('is-active', labels);
    drawEdges();
  });
  document.getElementById('toggleFlow').addEventListener('click', function () {
    flow = !flow;
    this.classList.toggle('is-active', flow);
    drawEdges();
  });

  function metricCell(k, v, tone) {
    return '<div class="metric-cell"><div class="eyebrow">' + k + '</div><div class="val" ' + (tone ? 'style="color:' + tone + '"' : '') + '>' + v + '</div></div>';
  }

  function openInspector(n) {
    selected = n.id;
    drawNodes();
    document.querySelectorAll('.topo-node').forEach(function (el) {
      el.classList.toggle('is-selected', el.id === 'tn-' + n.id);
    });
    const conns = SRH.edges.filter(function (e) { return e.from === n.id || e.to === n.id; });
    const svc = n.serviceId ? SRH.serviceById(n.serviceId) : null;
    inspector.innerHTML =
      '<div class="inspector-head">' +
        '<div><div class="inspector-title">' + n.label + '</div><div class="inspector-ip">' + n.ip + ' · ' + n.region + '</div></div>' +
        '<button class="icon-btn" id="closeInspector" aria-label="Fechar detalhes">' + SRH.icon('x') + '</button>' +
      '</div>' +
      '<div class="row-inline mt-8"><span class="status" data-state="' + n.status + '"><span class="dot"></span>' + SRH.statusLabel[n.status] + '</span>' +
      '<span class="dim" style="font-size:10.5px">uptime ' + SRH.num(n.uptime, 2) + '%</span></div>' +
      '<div class="hr mt-16 mb-16"></div>' +
      '<div class="metric-grid">' +
        metricCell('CPU', n.cpu + '%', n.cpu > 80 ? '#FF2121' : n.cpu > 60 ? '#FFC61A' : '') +
        metricCell('Memória', n.mem + '%', n.mem > 85 ? '#FF2121' : '') +
        metricCell('Disco', n.disk + '%') +
        metricCell('Rede', n.net + '%') +
      '</div>' +
      '<div class="chart mt-16" id="inspark" style="height:38px"></div>' +
      '<div class="eyebrow mt-20 mb-8">Conexões observadas</div>' +
      (conns.length ? conns.map(function (e) {
        const other = e.from === n.id ? e.to : e.from;
        const o = nodeById(other);
        return '<div class="conn-row">' + SRH.icon(e.from === n.id ? 'arrow-up-right' : 'arrow-down-right') +
          '<span style="flex:1">' + (o ? o.label : other) + '</span>' +
          '<span class="mono" style="color:' + edgeState[e.state] + '">' + e.latency + 'ms</span></div>';
      }).join('') : '<div class="inspector-empty">Sem conexões na janela atual.</div>') +
      '<div class="row-inline mt-20">' +
        (svc ? '<a class="btn btn-lime btn-sm" href="servico.html?id=' + svc.id + '">Abrir serviço</a>' : '') +
        '<a class="btn btn-outline btn-sm" href="logs.html?service=' + encodeURIComponent(n.id) + '">Ver logs</a>' +
      '</div>';
    inspector.classList.add('is-open');
    inspector.setAttribute('aria-hidden', 'false');
    document.getElementById('closeInspector').addEventListener('click', closeInspector);
    const sparkEl = document.getElementById('inspark');
    SRH.charts.spark(sparkEl, SRH.series(n.seed || 55, 48, 40, 26, 0.4), n.status === 'crit' ? '#FF2121' : n.status === 'warn' ? '#FFC61A' : '#D7FF00', { height: 38 });
  }

  function closeInspector() {
    selected = null;
    inspector.classList.remove('is-open');
    inspector.setAttribute('aria-hidden', 'true');
    drawNodes();
  }

  function select(id) {
    const n = nodeById(id);
    if (!n) return;
    openInspector(n);
  }

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeInspector();
  });

  document.getElementById('nodeSearch').addEventListener('input', function (e) {
    query = e.target.value.trim();
    drawEdges();
    drawNodes();
  });

  /* logs resumidos */
  document.getElementById('topoLogs').innerHTML = SRH.logs.slice(-5).reverse().map(function (l) {
    const color = l.level === 'error' ? '#FF2121' : l.level === 'warn' ? '#FFC61A' : l.level === 'info' ? '#1AFF53' : '#6B6B6B';
    return '<a class="log-mini" href="logs.html?service=' + encodeURIComponent(l.service) + '">' +
      '<span class="t">' + SRH.clock(l.at) + '</span>' +
      '<span class="lvl" style="color:' + color + '">' + l.level.toUpperCase() + '</span>' +
      '<span class="msg">' + SRH.esc(l.message) + '</span></a>';
  }).join('');

  /* uso das peças */
  const usageDefs = [
    ['cpu', 'CPU', 'cpu', '#6F9AFF'],
    ['gpu', 'GPU', 'cpu', '#FF2121'],
    ['mem', 'Memória', 'memory', '#D3009E'],
    ['disk', 'Disco', 'hard-drive', '#1AFF53'],
    ['net', 'Internet', 'globe', '#8200BA']
  ];
  const hostSelect = document.getElementById('hostSelect');
  function renderUsage(hostId) {
    const h = SRH.hosts.filter(function (x) { return x.id === hostId; })[0] || SRH.hosts[0];
    document.getElementById('usageBody').innerHTML = usageDefs.map(function (u) {
      return '<div class="usage-row">' +
        '<span class="usage-label">' + SRH.icon(u[2]) + u[1] + '</span>' +
        '<div class="usage-track"><span style="width:' + h[u[0]] + '%;background:' + u[3] + '"></span></div>' +
        '<span class="usage-val">' + h[u[0]] + '%</span></div>';
    }).join('');
  }
  hostSelect.addEventListener('change', function () { renderUsage(hostSelect.value); });

  /* boot */
  drawNodes();
  drawEdges();
  centerWorld();
  renderUsage('pc-01');
  SRH.hydrateIcons(document);
  window.addEventListener('resize', function () {
    if (Math.abs(view.s - 1) < 0.001) centerWorld();
  });
})();
