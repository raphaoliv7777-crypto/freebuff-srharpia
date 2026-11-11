/* Gráficos em SVG puro — área, linha múltipla, sparkline e barras */
(function () {
  const SRH = (window.SRH = window.SRH || {});
  const instances = new Set();

  function hexToRgb(hex) {
    const h = hex.replace('#', '');
    const n = parseInt(h.length === 3 ? h.split('').map(function (c) { return c + c; }).join('') : h, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function rgba(hex, a) {
    const c = hexToRgb(hex);
    return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')';
  }
  function niceMax(v) {
    if (v <= 0) return 1;
    const mag = Math.pow(10, Math.floor(Math.log10(v)));
    const norm = v / mag;
    const step = norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 2.5 ? 2.5 : norm <= 5 ? 5 : 10;
    return step * mag;
  }
  function uid() { return 'c' + Math.random().toString(36).slice(2, 8); }
  function trimNum(v, digits) {
    return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: digits == null ? 0 : digits }).format(v);
  }

  function area(el, cfg) {
    if (!el) return null;
    const state = { el: el, cfg: cfg, svg: null, tip: null };
    let width = 0;

    function pathFrom(points) {
      if (!points.length) return '';
      return points.map(function (p, i) { return (i ? 'L' : 'M') + p[0].toFixed(2) + ' ' + p[1].toFixed(2); }).join(' ');
    }

    function draw() {
      width = Math.max(220, el.clientWidth || 480);
      const c = state.cfg;
      const height = c.height || 200;
      const pad = Object.assign({ l: 42, r: 8, t: 12, b: 22 }, c.pad || {});
      const series = c.series || [];
      const n = Math.max.apply(null, series.map(function (s) { return s.data.length; }).concat([2]));
      const maxVal = c.yMax || niceMax(Math.max.apply(null, series.map(function (s) { return Math.max.apply(null, s.data); }).concat([1])) * 1.06);
      const minVal = c.yMin || 0;
      const plotW = width - pad.l - pad.r;
      const plotH = height - pad.t - pad.b;
      const ticks = c.yTicks || 4;
      const uidv = uid();

      function X(i) { return pad.l + (i / (n - 1)) * plotW; }
      function Y(v) { return pad.t + plotH - ((v - minVal) / (maxVal - minVal)) * plotH; }

      let out = '<svg viewBox="0 0 ' + width + ' ' + height + '" height="' + height + '" preserveAspectRatio="none" role="img">';
      out += '<defs>';
      series.forEach(function (s, si) {
        const color = s.color || '#D7FF00';
        out += '<linearGradient id="' + uidv + '-g' + si + '" x1="0" y1="0" x2="0" y2="1">' +
          '<stop offset="0%" stop-color="' + color + '" stop-opacity="' + (s.fillOpacity == null ? 0.28 : s.fillOpacity) + '"/>' +
          '<stop offset="100%" stop-color="' + color + '" stop-opacity="0"/></linearGradient>';
      });
      out += '</defs>';

      if (c.grid !== false) {
        for (let i = 0; i <= ticks; i++) {
          const v = minVal + ((maxVal - minVal) / ticks) * i;
          const y = Y(v);
          out += '<line class="grid-line" x1="' + pad.l + '" y1="' + y.toFixed(1) + '" x2="' + (width - pad.r) + '" y2="' + y.toFixed(1) + '"/>';
          out += '<text class="axis-label" x="' + (pad.l - 8) + '" y="' + (y + 3).toFixed(1) + '" text-anchor="end">' + (c.yFormat ? c.yFormat(v) : trimNum(v)) + '</text>';
        }
      }

      if (c.xLabels && c.xLabels.length) {
        const step = Math.max(1, Math.ceil(c.xLabels.length / (c.xTicks || 6)));
        c.xLabels.forEach(function (lab, i) {
          if (i % step !== 0 && i !== c.xLabels.length - 1) return;
          out += '<text class="axis-label" x="' + X(i).toFixed(1) + '" y="' + (height - 5) + '" text-anchor="middle">' + lab + '</text>';
        });
      }

      series.forEach(function (s, si) {
        const color = s.color || '#D7FF00';
        const pts = s.data.map(function (v, i) { return [X(i), Y(v)]; });
        if (s.area !== false) {
          out += '<path d="' + pathFrom(pts) + ' L' + X(n - 1) + ' ' + (pad.t + plotH) + ' L' + pad.l + ' ' + (pad.t + plotH) + ' Z" fill="url(#' + uidv + '-g' + si + ')"/>';
        }
        out += '<path d="' + pathFrom(pts) + '" fill="none" stroke="' + color + '" stroke-width="' + (s.width || 1.6) + '" stroke-linejoin="round" stroke-linecap="round"' + (s.dash ? ' stroke-dasharray="4 4"' : '') + '/>';
      });

      if (c.markers) {
        c.markers.forEach(function (m) {
          const x = X(m.index);
          out += '<line x1="' + x.toFixed(1) + '" y1="' + pad.t + '" x2="' + x.toFixed(1) + '" y2="' + (pad.t + plotH) + '" stroke="' + (m.color || '#FF2121') + '" stroke-width="1" stroke-dasharray="3 3"/>';
        });
      }

      out += '<line class="crosshair" x1="0" y1="0" x2="0" y2="' + (pad.t + plotH) + '" style="display:none"/>';
      series.forEach(function (s, si) {
        out += '<circle r="3.5" fill="#0a0a0a" stroke="' + (s.color || '#D7FF00') + '" stroke-width="2" style="display:none" data-dot="' + si + '"/>';
      });
      out += '<rect x="' + pad.l + '" y="' + pad.t + '" width="' + plotW + '" height="' + plotH + '" fill="transparent" style="cursor:crosshair"/>';
      out += '</svg>';
      el.innerHTML = out;

      const svg = el.querySelector('svg');
      state.svg = svg;
      const cross = svg.querySelector('.crosshair');
      const dots = Array.prototype.slice.call(svg.querySelectorAll('[data-dot]'));
      let tip = el.querySelector('.chart-tip');
      if (!tip) {
        tip = document.createElement('div');
        tip.className = 'chart-tip';
        el.appendChild(tip);
      }
      state.tip = tip;

      const hit = svg.querySelector('rect[style]');
      hit.addEventListener('mousemove', function (e) {
        const box = svg.getBoundingClientRect();
        const rel = ((e.clientX - box.left) / box.width) * width;
        let idx = Math.round(((rel - pad.l) / plotW) * (n - 1));
        idx = Math.max(0, Math.min(n - 1, idx));
        const x = X(idx);
        cross.style.display = '';
        cross.setAttribute('x1', x);
        cross.setAttribute('x2', x);
        dots.forEach(function (d) {
          const si = Number(d.getAttribute('data-dot'));
          const v = series[si].data[idx];
          d.style.display = v == null ? 'none' : '';
          if (v != null) {
            d.setAttribute('cx', x);
            d.setAttribute('cy', Y(v));
          }
        });
        const rows = series.map(function (s) {
          const v = s.data[idx];
          return '<div class="tip-row"><span class="tip-label"><span class="tip-dot" style="background:' + (s.color || '#D7FF00') + '"></span>' + (s.name || '') + '</span><b>' + (c.valueFormat ? c.valueFormat(v) : trimNum(v)) + '</b></div>';
        }).join('');
        const time = c.xLabels && c.xLabels[idx] != null ? c.xLabels[idx] : (c.title || '');
        tip.innerHTML = (time ? '<div class="tip-time">' + time + '</div>' : '') + rows;
        tip.style.left = (x / width) * box.width + 'px';
        tip.style.top = (e.clientY - box.top - 12) + 'px';
        tip.style.opacity = '1';
      });
      hit.addEventListener('mouseleave', function () {
        cross.style.display = 'none';
        dots.forEach(function (d) { d.style.display = 'none'; });
        tip.style.opacity = '0';
      });
    }

    state.redraw = draw;
    draw();
    instances.add(state);
    return state;
  }

  function spark(el, data, color, opts) {
    if (!el) return null;
    const state = { el: el, kind: 'spark', data: data, color: color || '#D7FF00', opts: opts || {} };
    function draw() {
      const w = Math.max(40, el.clientWidth || 120);
      const h = el.clientHeight || state.opts.height || 34;
      const max = Math.max.apply(null, data) * 1.08;
      const min = Math.min.apply(null, data) * 0.9;
      const id = uid();
      const pts = data.map(function (v, i) {
        return [ (i / (data.length - 1)) * w, h - ((v - min) / (max - min || 1)) * h ];
      });
      const line = pts.map(function (p, i) { return (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join(' ');
      el.innerHTML = '<svg viewBox="0 0 ' + w + ' ' + h + '" preserveAspectRatio="none" height="' + h + '">' +
        '<defs><linearGradient id="' + id + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + state.color + '" stop-opacity=".55"/><stop offset="1" stop-color="' + state.color + '" stop-opacity="0"/></linearGradient></defs>' +
        '<path d="' + line + ' L' + w + ' ' + h + ' L0 ' + h + ' Z" fill="url(#' + id + ')"/>' +
        '<path d="' + line + '" fill="none" stroke="' + state.color + '" stroke-width="' + (state.opts.width || 1.6) + '" stroke-linejoin="round"/></svg>';
    }
    state.redraw = draw;
    draw();
    instances.add(state);
    return state;
  }

  const rerender = SRH.debounce ? SRH.debounce(function () {
    instances.forEach(function (i) { i.redraw(); });
  }, 140) : function () {};

  window.addEventListener('resize', rerender);

  SRH.charts = { area: area, spark: spark, niceMax: niceMax, rgba: rgba, rerender: rerender, instances: instances };
})();
