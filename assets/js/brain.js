/* Second brain — grafo MOC e leitor de notas */
(function () {
  const SRH = window.SRH;
  const notes = SRH.notes;
  const root = SRH.noteBySlug('moc');
  const edges = [];
  const seen = new Set();
  notes.forEach(function (n) {
    n.links.forEach(function (to) {
      const target = SRH.noteBySlug(to);
      if (!target) return;
      const key = [n.slug, to].sort().join('::');
      if (seen.has(key)) return;
      seen.add(key);
      edges.push({ from: n.slug, to: to });
    });
  });

  const svg = document.getElementById('brainSvg');
  const group = document.getElementById('graphGroup');
  const edgesG = document.getElementById('graphEdges');
  const nodesG = document.getElementById('graphNodes');
  const zoomLabel = document.getElementById('graphZoom');
  const drawer = document.getElementById('noteDrawer');
  const backdrop = document.getElementById('noteBackdrop');
  const searchEl = document.getElementById('brainSearch');

  let scale = 1, tx = 0, ty = 0;
  let activeSlug = null;
  let hiddenClusters = new Set();
  let query = '';
  let mocOnly = false;
  let panning = null;
  let lastFocused = null;

  function applyTransform() {
    group.setAttribute('transform', 'translate(' + tx + ' ' + ty + ') scale(' + scale + ')');
    zoomLabel.textContent = Math.round(scale * 100) + '%';
  }

  function isDim(n) {
    if (hiddenClusters.has(n.cluster)) return true;
    if (mocOnly && n.slug !== root.slug && root.links.indexOf(n.slug) === -1) return true;
    if (query) {
      const q = query.toLowerCase();
      const hay = (n.title + ' ' + n.tags.join(' ') + ' ' + n.slug).toLowerCase();
      if (hay.indexOf(q) === -1) return true;
    }
    return false;
  }

  function neighbors(slug) {
    const set = new Set();
    edges.forEach(function (e) {
      if (e.from === slug) set.add(e.to);
      if (e.to === slug) set.add(e.from);
    });
    return set;
  }

  function renderGraph() {
    const near = activeSlug ? neighbors(activeSlug) : new Set();
    edgesG.innerHTML = edges.map(function (e) {
      const a = SRH.noteBySlug(e.from), b = SRH.noteBySlug(e.to);
      if (!a || !b) return '';
      const visible = !hiddenClusters.has(a.cluster) && !hiddenClusters.has(b.cluster);
      if (!visible) return '';
      if (mocOnly && e.from !== 'moc' && e.to !== 'moc') return '';
      const hot = activeSlug && (e.from === activeSlug || e.to === activeSlug);
      const strong = e.from === 'moc' || e.to === 'moc';
      const mx = (a.x + b.x) / 2;
      const my = (a.y + b.y) / 2 - Math.abs(a.x - b.x) * 0.06;
      return '<path class="graph-edge' + (strong ? ' is-strong' : '') + (hot ? ' is-hot' : '') +
        '" d="M' + a.x + ' ' + a.y + ' Q ' + mx + ' ' + my + ' ' + b.x + ' ' + b.y + '"/>';
    }).join('');

    nodesG.innerHTML = notes.map(function (n) {
      const c = SRH.clusters[n.cluster].color;
      const r = n.root ? 10 : 5.5;
      const labelLeft = n.x > 760;
      const label = n.root ? 'Mapa de conteúdo (MOC)' : n.title;
      const active = n.slug === activeSlug;
      const dim = isDim(n) || (activeSlug && neighbors(activeSlug).has(n.slug) === false && n.slug !== activeSlug);
      return '<g class="graph-node' + (n.root ? ' is-root' : '') + (active ? ' is-active' : '') + (dim ? ' is-dim' : '') +
        '" data-slug="' + n.slug + '" transform="translate(' + n.x + ' ' + n.y + ')">' +
        (n.root ? '<circle r="15" fill="none" stroke="' + c + '" stroke-opacity=".3"/>' : '') +
        '<circle r="' + r + '" fill="' + c + '"/>' +
        '<text x="' + (labelLeft ? -12 : 12) + '" y="3.5" text-anchor="' + (labelLeft ? 'end' : 'start') + '">' + SRH.esc(label) + '</text>' +
        '</g>';
    }).join('');

    nodesG.querySelectorAll('.graph-node').forEach(function (g) {
      g.addEventListener('click', function (e) {
        e.stopPropagation();
        openNote(g.getAttribute('data-slug'));
      });
      g.addEventListener('mouseenter', function () {
        if (activeSlug) return;
        const nearHover = neighbors(g.getAttribute('data-slug'));
        nodesG.querySelectorAll('.graph-node').forEach(function (other) {
          const s = other.getAttribute('data-slug');
          other.classList.toggle('is-dim', s !== g.getAttribute('data-slug') && !nearHover.has(s));
        });
      });
      g.addEventListener('mouseleave', function () {
        if (activeSlug) return;
        nodesG.querySelectorAll('.graph-node').forEach(function (other) {
          other.classList.toggle('is-dim', isDim(SRH.noteBySlug(other.getAttribute('data-slug'))));
        });
      });
    });
  }

  function renderLegend() {
    document.getElementById('graphLegend').innerHTML = Object.keys(SRH.clusters).map(function (k) {
      const c = SRH.clusters[k];
      const count = notes.filter(function (n) { return n.cluster === k; }).length;
      return '<button data-cluster="' + k + '" class="' + (hiddenClusters.has(k) ? 'is-off' : '') + '" title="Filtrar cluster">' +
        '<span class="swatch" style="background:' + c.color + '"></span>' + c.name + ' <span style="color:var(--text-4)">' + count + '</span></button>';
    }).join('');
    document.querySelectorAll('[data-cluster]').forEach(function (b) {
      b.addEventListener('click', function () {
        const k = b.getAttribute('data-cluster');
        if (hiddenClusters.has(k)) hiddenClusters.delete(k); else hiddenClusters.add(k);
        renderLegend();
        renderGraph();
        renderMoc();
      });
    });
  }

  function renderMoc() {
    const list = document.getElementById('mocList');
    const groups = SRH.mocOrder.map(function (clusterKey) {
      const items = notes.filter(function (n) {
        if (n.root || n.cluster !== clusterKey) return false;
        if (query) {
          const q = query.toLowerCase();
          if ((n.title + ' ' + n.tags.join(' ')).toLowerCase().indexOf(q) === -1) return false;
        }
        return true;
      });
      if (!items.length) return '';
      const c = SRH.clusters[clusterKey];
      return '<div class="moc-group">' +
        '<div class="moc-group-head"><span class="dot" style="background:' + c.color + '"></span><span class="name">' + c.name + '</span><span class="count">' + items.length + '</span></div>' +
        items.map(function (n) {
          return '<button class="moc-note" data-note="' + n.slug + '">' +
            '<span class="dot" style="background:' + c.color + '"></span>' +
            '<span>' + n.title + '</span><span class="links">' + n.links.length + '</span></button>';
        }).join('') + '</div>';
    }).join('');
    list.innerHTML = groups;
    document.getElementById('mocEmpty').hidden = !!groups;
    list.querySelectorAll('[data-note]').forEach(function (b) {
      b.addEventListener('click', function () { openNote(b.getAttribute('data-note')); });
    });
  }

  function linkRow(n) {
    const c = SRH.clusters[n.cluster].color;
    return '<button class="note-link" data-note="' + n.slug + '">' +
      '<span class="dot" style="background:' + c + '"></span>' + n.title +
      '<span style="margin-left:auto;color:var(--text-4);font-size:9.5px;font-family:var(--mono)">' + n.links.length + ' ligações</span></button>';
  }

  function openNote(slug) {
    const n = SRH.noteBySlug(slug);
    if (!n) return;
    activeSlug = slug;
    lastFocused = n;
    const c = SRH.clusters[n.cluster];
    document.getElementById('noteCluster').innerHTML = '<span style="display:inline-flex;align-items:center;gap:7px"><span class="dot" style="background:' + c.color + '"></span>' + c.name.toUpperCase() + '</span>';
    document.getElementById('noteTitle').textContent = n.title;
    document.getElementById('noteSub').textContent = n.updated + ' · ' + n.owner;
    document.getElementById('noteMetaRow').innerHTML =
      '<span>' + n.tags.map(function (t) { return '#' + t; }).join(' · ') + '</span>' +
      '<span>' + (n.links.length + SRH.backlinks(slug).length) + ' conexões</span>';
    document.getElementById('noteBody').innerHTML = n.body;

    const outgoing = n.links.map(function (s) { return SRH.noteBySlug(s); }).filter(Boolean);
    const incoming = SRH.backlinks(slug);
    document.getElementById('noteLinks').innerHTML = outgoing.length ? outgoing.map(linkRow).join('') :
      '<div class="dim" style="font-size:11px;padding:8px 0">Nenhuma ligação de saída.</div>';
    document.getElementById('noteBacklinks').innerHTML = incoming.length ? incoming.map(linkRow).join('') :
      '<div class="dim" style="font-size:11px;padding:8px 0">Nenhuma nota aponta para esta.</div>';
    document.querySelectorAll('#noteLinks [data-note], #noteBacklinks [data-note]').forEach(function (b) {
      b.addEventListener('click', function () { openNote(b.getAttribute('data-note')); });
    });

    renderGraph();
    SRH.hydrateIcons(document.getElementById('noteDrawer'));
    SRH.openDrawer(drawer, backdrop);
    const url = new URL(window.location.href);
    url.searchParams.set('note', slug);
    history.replaceState({}, '', url);
  }

  function closeNote() {
    activeSlug = null;
    SRH.closeDrawer(drawer, backdrop);
    renderGraph();
    const url = new URL(window.location.href);
    url.searchParams.delete('note');
    history.replaceState({}, '', url);
  }

  /* controles do grafo */
  function pxToUnit() {
    const r = svg.getBoundingClientRect();
    return 1 / Math.min(r.width / 1000, r.height / 520);
  }
  function zoomBy(f) {
    const ns = Math.min(2.2, Math.max(0.6, scale * f));
    tx = 500 - (500 - tx) * (ns / scale);
    ty = 260 - (260 - ty) * (ns / scale);
    scale = ns;
    applyTransform();
  }
  document.querySelectorAll('[data-graph]').forEach(function (b) {
    b.addEventListener('click', function () {
      const a = b.getAttribute('data-graph');
      if (a === 'in') zoomBy(1.2);
      if (a === 'out') zoomBy(0.83);
      if (a === 'reset') { scale = 1; tx = 0; ty = 0; applyTransform(); }
      if (a === 'moc') {
        mocOnly = !mocOnly;
        b.classList.toggle('is-active', mocOnly);
        renderGraph();
      }
    });
  });

  svg.addEventListener('pointerdown', function (e) {
    if (e.target.closest('.graph-node')) return;
    panning = { sx: e.clientX, sy: e.clientY, ox: tx, oy: ty, k: pxToUnit() };
    document.getElementById('brainGraph').classList.add('is-panning');
  });
  window.addEventListener('pointermove', function (e) {
    if (!panning) return;
    tx = panning.ox + (e.clientX - panning.sx) * panning.k;
    ty = panning.oy + (e.clientY - panning.sy) * panning.k;
    applyTransform();
  });
  window.addEventListener('pointerup', function () {
    panning = null;
    document.getElementById('brainGraph').classList.remove('is-panning');
  });

  document.getElementById('focusNote').addEventListener('click', function () {
    if (!lastFocused) return;
    scale = Math.max(scale, 1.1);
    tx = 500 - lastFocused.x * scale;
    ty = 260 - lastFocused.y * scale;
    applyTransform();
  });

  document.getElementById('closeNote').addEventListener('click', closeNote);
  backdrop.addEventListener('click', closeNote);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeNote(); });

  searchEl.addEventListener('input', function () {
    query = searchEl.value.trim();
    renderMoc();
    renderGraph();
  });

  document.getElementById('newNote').addEventListener('click', function () {
    SRH.toast('Nova nota criada em rascunho', { icon: 'file-text' });
  });

  /* painéis de estatística */
  const linkCount = edges.length;
  const orphans = notes.filter(function (n) {
    return !n.root && n.links.length === 0 && SRH.backlinks(n.slug).length === 0;
  });
  document.getElementById('graphMeta').textContent = notes.length + ' notas · ' + linkCount + ' ligações · 5 clusters';
  document.getElementById('statNotes').textContent = notes.length;
  document.getElementById('statLinks').textContent = linkCount;
  document.getElementById('statOrphans').textContent = orphans.length;
  document.getElementById('graphCounts').textContent = notes.length + ' nós · ' + linkCount + ' arestas';

  const recent = ['postmortem-12-10', 'adr-004-densidade', 'runbook-latencia', 'tracing-distribuido', 'adr-003-retencao'];
  document.getElementById('recentNotes').innerHTML = recent.map(function (slug) {
    const n = SRH.noteBySlug(slug);
    if (!n) return '';
    const c = SRH.clusters[n.cluster].color;
    return '<button class="moc-note" data-recent="' + slug + '" style="margin-left:0;width:100%">' +
      '<span class="dot" style="background:' + c + '"></span>' +
      '<span style="min-width:0"><span style="display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + n.title + '</span>' +
      '<span class="dim" style="font-size:9.5px">' + n.updated + '</span></span>' +
      '<span class="links">' + n.links.length + '</span></button>';
  }).join('');
  document.querySelectorAll('[data-recent]').forEach(function (b) {
    b.addEventListener('click', function () { openNote(b.getAttribute('data-recent')); });
  });

  SRH.hydrateIcons(document);
  renderLegend();
  renderMoc();
  renderGraph();
  applyTransform();
  const initialNote = new URLSearchParams(window.location.search).get('note');
  if (initialNote) openNote(initialNote);
})();
