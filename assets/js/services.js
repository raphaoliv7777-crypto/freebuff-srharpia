/* Catálogo de serviços */
(function () {
  const SRH = window.SRH;
  const rows = document.getElementById('svcRows');
  const countEl = document.getElementById('svcCount');
  const searchEl = document.getElementById('svcSearch');
  const kindEl = document.getElementById('kindFilter');
  const statusEl = document.getElementById('statusFilter');

  const kinds = [];
  SRH.services.forEach(function (s) { if (kinds.indexOf(s.kind) === -1) kinds.push(s.kind); });
  kindEl.innerHTML = '<option value="">Todo tipo</option>' + kinds.map(function (k) {
    return '<option value="' + k + '">' + k + '</option>';
  }).join('');

  function paint() {
    const q = searchEl.value.trim().toLowerCase();
    const kind = kindEl.value;
    const status = statusEl.value;
    const list = SRH.services.filter(function (s) {
      if (kind && s.kind !== kind) return false;
      if (status && s.status !== status) return false;
      if (q && (s.name + ' ' + s.id + ' ' + s.ip + ' ' + s.owner).toLowerCase().indexOf(q) === -1) return false;
      return true;
    });

    countEl.textContent = list.length + ' de ' + SRH.services.length + ' serviços exibidos';

    if (!list.length) {
      rows.innerHTML = '<tr><td colspan="9"><div class="empty-state">' +
        SRH.icon('search') + '<span class="t">Nenhum serviço corresponde a estes filtros.</span>' +
        '<span>Limpe a busca ou selecione outro tipo.</span></div></td></tr>';
      return;
    }

    rows.innerHTML = list.map(function (s) {
      const latColor = s.p95 > 500 ? 'var(--red)' : s.p95 > 220 ? 'var(--amber)' : 'var(--text)';
      const errColor = s.err >= 3 ? 'var(--red)' : s.err >= 1 ? 'var(--amber)' : 'var(--text-2)';
      const sloColor = s.slo >= 99.9 ? 'var(--green)' : s.slo >= 99.5 ? 'var(--amber)' : 'var(--red)';
      return '<tr class="is-clickable" data-id="' + s.id + '">' +
        '<td><div class="row-inline" style="gap:10px;flex-wrap:nowrap">' +
          '<span class="node-icon" style="display:flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:4px;background:var(--surface-3);color:var(--text-2)">' + SRH.icon(s.icon) + '</span>' +
          '<div><div class="cell-main">' + s.name + '</div><div class="cell-sub mono">' + s.id + '</div></div>' +
        '</div></td>' +
        '<td class="muted">' + s.kind + '</td>' +
        '<td class="cell-num">' + SRH.num(s.rps) + '</td>' +
        '<td class="cell-num" style="color:' + latColor + '">' + SRH.ms(s.p95) + '</td>' +
        '<td class="cell-num" style="color:' + errColor + '">' + SRH.num(s.err, 1) + '%</td>' +
        '<td class="cell-num muted">' + (s.deps.length || '—') + '</td>' +
        '<td class="cell-num" style="color:' + sloColor + '">' + SRH.num(s.slo, 2) + '%</td>' +
        '<td><span class="status" data-state="' + s.status + '"><span class="dot"></span>' + SRH.statusLabel[s.status] + '</span></td>' +
        '<td class="cell-actions"><span class="chev dim">' + SRH.icon('chevron-right') + '</span></td>' +
      '</tr>';
    }).join('');

    rows.querySelectorAll('tr[data-id]').forEach(function (tr) {
      tr.addEventListener('click', function () {
        window.location.href = 'servico.html?id=' + tr.getAttribute('data-id');
      });
    });
  }

  searchEl.addEventListener('input', paint);
  kindEl.addEventListener('change', paint);
  statusEl.addEventListener('change', paint);
  document.getElementById('newMonitor').addEventListener('click', function () {
    SRH.toast('Monitor criado em modo observação', { icon: 'check-circle' });
  });
  document.getElementById('exportSvc').addEventListener('click', function () {
    SRH.toast('Exportação CSV preparada com 24 serviços');
  });

  SRH.hydrateIcons(document);
  paint();
})();
