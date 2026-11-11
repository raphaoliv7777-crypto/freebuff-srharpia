/* Ícones de linha (traço 1.7) no padrão do protótipo */
(function () {
  const P = {
    home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5.5 9.5V21h13V9.5"/><path d="M9.5 21v-6h5v6"/>',
    network: '<rect x="8.5" y="3" width="7" height="5.5" rx="1.2"/><rect x="2.5" y="15.5" width="7" height="5.5" rx="1.2"/><rect x="14.5" y="15.5" width="7" height="5.5" rx="1.2"/><path d="M12 8.5v3.5M6 15.5V12h12v3.5"/>',
    boxes: '<rect x="3" y="3" width="7.5" height="7.5" rx="1.4"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="1.4"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="1.4"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.4"/>',
    waypoints: '<circle cx="5" cy="6" r="2.2"/><circle cx="19" cy="6" r="2.2"/><circle cx="12" cy="18" r="2.2"/><path d="M7.2 6h4.6M16.8 6h-4.6M12 8.2v7.6"/>',
    activity: '<path d="M22 12h-4l-3 8-5.5-16L7 12H2"/>',
    terminal: '<path d="M4 17l6-5-6-5"/><path d="M12 19h8"/><rect x="2" y="3" width="20" height="18" rx="2" opacity=".35"/>',
    bell: '<path d="M18 8.5a6 6 0 1 0-12 0c0 6.5-2.5 8-2.5 8h17S18 15 18 8.5Z"/><path d="M10.3 20.5a2 2 0 0 0 3.4 0"/>',
    brain: '<path d="M9.5 3.2A2.7 2.7 0 0 1 12 5.9v12.6a2.6 2.6 0 0 1-4.6 1.4A2.7 2.7 0 0 1 4.6 15a2.7 2.7 0 0 1 1-3.9 2.7 2.7 0 0 1 .9-4.2 2.7 2.7 0 0 1 3-3.7Z"/><path d="M14.5 3.2A2.7 2.7 0 0 0 12 5.9v12.6a2.6 2.6 0 0 0 4.6 1.4A2.7 2.7 0 0 0 19.4 15a2.7 2.7 0 0 0-1-3.9 2.7 2.7 0 0 0-.9-4.2 2.7 2.7 0 0 0-3-3.7Z"/>',
    settings: '<path d="M12 2.6 20.2 7v10L12 21.4 3.8 17V7L12 2.6Z"/><circle cx="12" cy="12" r="3.1"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.6-3.6"/>',
    'chevron-down': '<path d="m6 9 6 6 6-6"/>',
    'chevron-right': '<path d="m9 6 6 6-6 6"/>',
    'chevron-left': '<path d="m15 6-6 6 6 6"/>',
    'arrow-up-right': '<path d="M7 17 17 7"/><path d="M8 7h9v9"/>',
    'arrow-down-right': '<path d="M7 7l10 10"/><path d="M17 8v9H8"/>',
    'arrow-right': '<path d="M4 12h15"/><path d="m13 6 6 6-6 6"/>',
    'arrow-left': '<path d="M20 12H5"/><path d="m11 6-6 6 6 6"/>',
    'arrow-up': '<path d="M12 19V5"/><path d="m6 11 6-6 6 6"/>',
    'arrow-down': '<path d="M12 5v14"/><path d="m6 13 6 6 6-6"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5.2l3.4 2"/>',
    cpu: '<rect x="6" y="6" width="12" height="12" rx="2"/><path d="M9.2 2v4M14.8 2v4M9.2 18v4M14.8 18v4M2 9.2h4M2 14.8h4M18 9.2h4M18 14.8h4"/>',
    server: '<rect x="3" y="4" width="18" height="7" rx="1.6"/><rect x="3" y="13" width="18" height="7" rx="1.6"/><path d="M7 7.5h.01M7 16.5h.01"/>',
    database: '<ellipse cx="12" cy="5.5" rx="8" ry="3"/><path d="M4 5.5v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"/><path d="M4 11.5v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"/>',
    'hard-drive': '<rect x="2.5" y="4" width="19" height="16" rx="2"/><path d="M2.5 13h19"/><path d="M17 16.5h.01M13 16.5h.01"/>',
    memory: '<rect x="3" y="7" width="18" height="10" rx="1.6"/><path d="M7 3.5V7M12 3.5V7M17 3.5V7M7 17v3.5M12 17v3.5M17 17v3.5"/>',
    lock: '<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/><path d="M12 15v2.5"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3c2.6 2.6 4 5.6 4 9s-1.4 6.4-4 9c-2.6-2.6-4-5.6-4-9s1.4-6.4 4-9Z"/>',
    zap: '<path d="M13 2 4.5 13.5H11l-1 8.5 9-12H12.5l.5-8Z"/>',
    filter: '<path d="M3 4.5h18l-7 8v6l-4 2v-8l-7-8Z"/>',
    pause: '<rect x="7" y="4.5" width="3.5" height="15" rx="1"/><rect x="13.5" y="4.5" width="3.5" height="15" rx="1"/>',
    play: '<path d="M7 4.5 19 12 7 19.5v-15Z"/>',
    refresh: '<path d="M20 11a8 8 0 1 0-2.6 6"/><path d="M20 4.5V11h-6.5"/>',
    maximize: '<path d="M8 3H3v5M16 3h5v5M8 21H3v-5M16 21h5v-5"/>',
    'zoom-in': '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.6-3.6M11 8v6M8 11h6"/>',
    'zoom-out': '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.6-3.6M8 11h6"/>',
    crosshair: '<circle cx="12" cy="12" r="8"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/><circle cx="12" cy="12" r="2.4"/>',
    layers: '<path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="m3 12.5 9 5 9-5"/><path d="m3 17 9 5 9-5"/>',
    'file-text': '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z"/><path d="M14 3v5h5"/><path d="M9 13h6M9 17h6"/>',
    link: '<path d="M10 13.5a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1.4 1.4"/><path d="M14 10.5a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1.4-1.4"/>',
    'external-link': '<path d="M14 4h6v6"/><path d="M20 4 11 13"/><path d="M18 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h5"/>',
    'alert-triangle': '<path d="M12 3.5 22 20H2L12 3.5Z"/><path d="M12 9.5v5"/><path d="M12 17.5h.01"/>',
    check: '<path d="m5 12.5 5 5L20 6.5"/>',
    'check-circle': '<circle cx="12" cy="12" r="9"/><path d="m8 12.5 2.6 2.6L16.5 9"/>',
    x: '<path d="M6 6l12 12M18 6 6 18"/>',
    copy: '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1"/>',
    download: '<path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M4 20h16"/>',
    sliders: '<path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/>',
    eye: '<path d="M2 12s3.5-6.5 10-6.5S22 12 22 12s-3.5 6.5-10 6.5S2 12 2 12Z"/><circle cx="12" cy="12" r="2.8"/>',
    mic: '<rect x="9" y="2.5" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0"/><path d="M12 17.5V21"/>',
    'git-branch': '<circle cx="6" cy="5" r="2.4"/><circle cx="6" cy="19" r="2.4"/><circle cx="18" cy="8" r="2.4"/><path d="M6 7.4v9.2"/><path d="M18 10.4c0 4-3 4.4-6 5.2"/>',
    'corner-down-right': '<path d="M5 4v7a3 3 0 0 0 3 3h11"/><path d="m15 10 4 4-4 4"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    'more-vertical': '<circle cx="12" cy="5" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="12" cy="19" r="1.2"/>',
    'more-horizontal': '<circle cx="5" cy="12" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="19" cy="12" r="1.2"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    users: '<circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.2 2.7-5.3 6-5.3s6 2.1 6 5.3"/><path d="M16 4.6a3.2 3.2 0 0 1 0 6.4M18 14.9c2 .7 3.4 2.4 3.4 5.1"/>',
    key: '<circle cx="8" cy="15" r="4"/><path d="m11 12 8-8"/><path d="m16 7 2 2M19 4l2 2"/>',
    shield: '<path d="M12 3 20 6v6c0 4.4-3.4 7.6-8 9-4.6-1.4-8-4.6-8-9V6l8-3Z"/><path d="m9 12 2 2 4-4"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3.5 7 8.5 6 8.5-6"/>',
    share: '<circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="m8.3 10.8 7.4-4.3M8.3 13.2l7.4 4.3"/>',
    list: '<path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01"/>',
    'panel-right': '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M15 4v16"/>',
    'rotate-ccw': '<path d="M4 11a8 8 0 1 1 2.6 6"/><path d="M4 4.5V11h6.5"/>',
    trash: '<path d="M4 7h16"/><path d="M9 7V4h6v3"/><path d="M6 7l1 13h10l1-13"/><path d="M10 11v5M14 11v5"/>',
    edit: '<path d="M4 20h4L20 8l-4-4L4 16v4Z"/><path d="m14 6 4 4"/>',
    'circle-dot': '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="2.6"/>',
    'git-fork': '<circle cx="6" cy="5" r="2.4"/><circle cx="18" cy="5" r="2.4"/><circle cx="12" cy="19" r="2.4"/><path d="M6 7.4v2c0 2.5 2 4 4.5 4.4M18 7.4v2c0 2.5-2 4-4.5 4.4"/><path d="M12 13.8v2.8"/>',
    'map-pin': '<path d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11Z"/><circle cx="12" cy="10" r="2.6"/>',
    inbox: '<path d="M3 13h5l1.5 3h5L16 13h5"/><path d="M5 5h14l2 8v6H3v-6l2-8Z"/>',
    'trending-up': '<path d="m3 17 6-6 4 4 8-8"/><path d="M21 7h-5M21 7v5"/>',
    'trending-down': '<path d="m3 7 6 6 4-4 8 8"/><path d="M21 17h-5M21 17v-5"/>',
    scan: '<path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3"/><path d="M4 12h16"/>'
  };

  function svg(name, cls) {
    const inner = P[name];
    if (!inner) return '';
    return '<svg class="icon ' + (cls || '') + '" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' + inner + '</svg>';
  }

  function hydrate(root) {
    (root || document).querySelectorAll('[data-icon]').forEach(function (el) {
      const name = el.getAttribute('data-icon');
      const extra = el.className && el.className.indexOf('icon') === -1 ? el.className : '';
      const size = el.getAttribute('data-size');
      el.outerHTML = svg(name, [extra, size === 'sm' ? 'icon-sm' : size === 'lg' ? 'icon-lg' : ''].filter(Boolean).join(' '));
    });
  }

  window.SRH = window.SRH || {};
  window.SRH.icon = svg;
  window.SRH.icons = P;
  window.SRH.hydrateIcons = hydrate;
})();
