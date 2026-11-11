/* Núcleo da aplicação: navegação, menus, paleta de comandos, avisos e utilidades */
(function () {
  const SRH = (window.SRH = window.SRH || {});

  const PAGES = [
    { key: 'visao', label: 'Visão geral', href: 'index.html', icon: 'home', kind: 'Tela' },
    { key: 'topologia', label: 'Mapa topológico', href: 'topologia.html', icon: 'git-fork', kind: 'Tela' },
    { key: 'servicos', label: 'Serviços', href: 'servicos.html', icon: 'boxes', kind: 'Tela' },
    { key: 'tracing', label: 'Distributed tracing', href: 'tracing.html', icon: 'waypoints', kind: 'Tela' },
    { key: 'metricas', label: 'Métricas de infraestrutura', href: 'metricas.html', icon: 'activity', kind: 'Tela' },
    { key: 'logs', label: 'Logs e registros', href: 'logs.html', icon: 'terminal', kind: 'Tela' },
    { key: 'alertas', label: 'Alertas e incidentes', href: 'alertas.html', icon: 'bell', kind: 'Tela' },
    { key: 'second-brain', label: 'Second brain', href: 'second-brain.html', icon: 'brain', kind: 'Conhecimento' },
    { key: 'configuracoes', label: 'Configurações', href: 'configuracoes.html', icon: 'settings', kind: 'Sistema' }
  ];

  function qs(sel, root) { return (root || document).querySelector(sel); }
  function qsa(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function esc(v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function debounce(fn, ms) {
    let t;
    return function () {
      const args = arguments, self = this;
      clearTimeout(t);
      t = setTimeout(function () { fn.apply(self, args); }, ms || 120);
    };
  }
  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }
  function num(v, digits) {
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: digits || 0,
      maximumFractionDigits: digits == null ? 0 : digits
    }).format(v);
  }
  function compact(v) {
    if (Math.abs(v) >= 1e6) return (v / 1e6).toFixed(1).replace('.', ',') + 'M';
    if (Math.abs(v) >= 1e3) return (v / 1e3).toFixed(v >= 1e4 ? 0 : 1).replace('.', ',') + 'K';
    return num(v);
  }
  function pct(v) { return num(v, 1) + '%'; }
  function ms(v) { return v >= 1000 ? num(v / 1000, 2) + 's' : num(v) + 'ms'; }
  function today(off) {
    const d = new Date();
    d.setDate(d.getDate() + (off || 0));
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  /* ---------- sidebar / mobile ---------- */
  function setupNav() {
    const page = document.body.getAttribute('data-page');
    qsa('[data-nav]').forEach(function (a) {
      if (a.getAttribute('data-nav') === page) {
        a.classList.add('is-active');
        a.setAttribute('aria-current', 'page');
      }
    });
    const sidebar = qs('.sidebar');
    const toggle = qs('[data-nav-toggle]');
    if (!sidebar || !toggle) return;
    let overlay = null;
    function close() {
      sidebar.classList.remove('is-open');
      if (overlay) { overlay.remove(); overlay = null; }
    }
    toggle.addEventListener('click', function () {
      const open = !sidebar.classList.contains('is-open');
      if (open) {
        sidebar.classList.add('is-open');
        overlay = document.createElement('div');
        overlay.className = 'overlay-close';
        overlay.addEventListener('click', close);
        document.body.appendChild(overlay);
      } else close();
    });
    qsa('.nav-item', sidebar).forEach(function (a) { a.addEventListener('click', close); });
  }

  /* ---------- menus ---------- */
  function setupMenus() {
    document.addEventListener('click', function (e) {
      const trigger = e.target.closest('[data-menu-trigger]');
      qsa('.menu.is-open').forEach(function (m) {
        if (!trigger || m !== qs('#' + m.id)) m.classList.remove('is-open');
      });
      if (!trigger) return;
      e.preventDefault();
      const menu = qs('#' + trigger.getAttribute('data-menu-trigger'));
      if (!menu) return;
      const r = trigger.getBoundingClientRect();
      menu.classList.add('is-open');
      const width = menu.offsetWidth || 190;
      menu.style.position = 'fixed';
      menu.style.top = r.bottom + 6 + 'px';
      menu.style.left = Math.max(12, Math.min(window.innerWidth - width - 12, r.right - width)) + 'px';
      const mb = menu.getBoundingClientRect();
      if (mb.bottom > window.innerHeight - 12) menu.style.top = r.top - mb.height - 6 + 'px';
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') qsa('.menu.is-open').forEach(function (m) { m.classList.remove('is-open'); });
    });
  }

  /* ---------- toast ---------- */
  function toast(message, opts) {
    let stack = qs('.toast-stack');
    if (!stack) {
      stack = document.createElement('div');
      stack.className = 'toast-stack';
      stack.setAttribute('aria-live', 'polite');
      document.body.appendChild(stack);
    }
    const t = document.createElement('div');
    t.className = 'toast';
    t.innerHTML = SRH.icon((opts && opts.icon) || 'check-circle') + '<span>' + esc(message) + '</span>';
    stack.appendChild(t);
    setTimeout(function () {
      t.style.opacity = '0';
      t.style.transform = 'translateY(6px)';
      t.style.transition = 'all .18s linear';
      setTimeout(function () { t.remove(); }, 220);
    }, (opts && opts.duration) || 2600);
  }

  /* ---------- drawer ---------- */
  function openDrawer(drawer, backdrop) {
    if (!drawer) return;
    drawer.classList.add('is-open');
    drawer.setAttribute('aria-hidden', 'false');
    if (backdrop) backdrop.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }
  function closeDrawer(drawer, backdrop) {
    if (!drawer) return;
    drawer.classList.remove('is-open');
    drawer.setAttribute('aria-hidden', 'true');
    if (backdrop) backdrop.classList.remove('is-open');
    document.body.style.overflow = '';
  }

  /* ---------- copy ---------- */
  function copy(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { toast('Copiado para a área de transferência'); });
    } else {
      toast('Cópia indisponível neste navegador');
    }
  }

  /* ---------- command palette ---------- */
  function buildPalette() {
    const backdrop = document.createElement('div');
    backdrop.className = 'palette-backdrop';
    backdrop.hidden = true;
    backdrop.innerHTML =
      '<div class="palette" role="dialog" aria-modal="true" aria-label="Busca rápida">' +
        '<div class="palette-input">' + SRH.icon('search') +
          '<input type="text" placeholder="Buscar telas, serviços, notas..." aria-label="Busca rápida">' +
          '<kbd>esc</kbd>' +
        '</div>' +
        '<div class="palette-list"></div>' +
        '<div class="palette-foot"><span><span class="keys">enter</span> abrir</span><span><span class="keys">ctrl k</span> fechar</span><span class="dim">SrHarpia 2.8.0</span></div>' +
      '</div>';
    document.body.appendChild(backdrop);
    const input = backdrop.querySelector('input');
    const list = backdrop.querySelector('.palette-list');
    let items = [], active = 0, open = false;

    function itemRow(it, i) {
      return '<button class="palette-item' + (i === active ? ' is-active' : '') + '" data-idx="' + i + '">' +
        SRH.icon(it.icon) + '<span>' + esc(it.label) + '</span><span class="kind">' + esc(it.kind) + '</span></button>';
    }

    function paint() {
      if (!items.length) {
        list.innerHTML = '<div class="palette-empty">Nada encontrado para esta busca.</div>';
        return;
      }
      list.innerHTML = items.map(itemRow).join('');
    }

    function search(term) {
      const t = term.trim().toLowerCase();
      const notes = (SRH.notes || []).map(function (n) {
        return { label: n.title, href: 'second-brain.html?note=' + n.slug, icon: 'file-text', kind: 'Nota' };
      });
      const services = (SRH.services || []).slice(0, 20).map(function (s) {
        return { label: s.name, href: 'servico.html?id=' + s.id, icon: 'server', kind: 'Serviço' };
      });
      const all = PAGES.concat(notes, services);
      items = (t ? all.filter(function (it) { return it.label.toLowerCase().indexOf(t) > -1; }) : PAGES).slice(0, 9);
      active = 0;
      paint();
    }

    function go(i) {
      const it = items[i];
      if (!it) return;
      close();
      window.location.href = it.href;
    }

    function openPalette() {
      backdrop.hidden = false;
      open = true;
      input.value = '';
      search('');
      setTimeout(function () { input.focus(); }, 20);
    }
    function close() {
      backdrop.hidden = true;
      open = false;
    }

    backdrop.addEventListener('click', function (e) {
      if (e.target === backdrop) close();
      const btn = e.target.closest('.palette-item');
      if (btn) go(Number(btn.getAttribute('data-idx')));
    });
    input.addEventListener('input', function () { search(input.value); });
    document.addEventListener('keydown', function (e) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        open ? close() : openPalette();
        return;
      }
      if (!open) return;
      if (e.key === 'Escape') { close(); }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        active = (active + 1) % Math.max(items.length, 1);
        paint();
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        active = (active - 1 + Math.max(items.length, 1)) % Math.max(items.length, 1);
        paint();
      }
      if (e.key === 'Enter') { go(active); }
    });
    qsa('[data-palette]').forEach(function (b) { b.addEventListener('click', openPalette); });
    window.SRH.palette = { open: openPalette, close: close };
  }

  /* ---------- tabs ---------- */
  function setupTabs() {
    qsa('[data-tabs]').forEach(function (group) {
      const tabs = qsa('.tab', group);
      tabs.forEach(function (tab) {
        tab.addEventListener('click', function () {
          const target = tab.getAttribute('data-tab');
          tabs.forEach(function (t) { t.classList.toggle('is-active', t === tab); });
          const scope = group.getAttribute('data-tabs');
          qsa('[data-tab-panel]').forEach(function (p) {
            if (scope && p.getAttribute('data-scope') && p.getAttribute('data-scope') !== scope) return;
            p.hidden = p.getAttribute('data-tab-panel') !== target;
          });
        });
      });
    });
  }

  function init() {
    SRH.hydrateIcons(document);
    setupNav();
    setupMenus();
    setupTabs();
    buildPalette();
  }

  SRH.qs = qs;
  SRH.qsa = qsa;
  SRH.esc = esc;
  SRH.debounce = debounce;
  SRH.clamp = clamp;
  SRH.num = num;
  SRH.compact = compact;
  SRH.pct = pct;
  SRH.ms = ms;
  SRH.today = today;
  SRH.toast = toast;
  SRH.copy = copy;
  SRH.openDrawer = openDrawer;
  SRH.closeDrawer = closeDrawer;
  SRH.pages = PAGES;

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
