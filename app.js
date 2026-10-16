/* eCTD Module 1 Checker — browser controller. */
(function startEctdChecker(global) {
  'use strict';

  const { EctdCore: core, EctdZip: zip, EctdData: data } = global;
  if (!core || !zip || !data) {
    document.body.textContent = 'Die Anwendung konnte nicht geladen werden (fehlende Kernmodule).';
    return;
  }

  const { DATASET_META, SUBMISSION_TYPES, REGIONS, ECTD_DATABASE } = data;
  const byId = id => document.getElementById(id);
  const state = {
    model: null,
    filter: 'all',
    search: '',
    expandedIds: new Set(),
    rowElements: new Map(),
  };
  const dom = {};

  const statusPresentation = {
    match: { icon: '✓', label: 'Nr. & Titel gleich' },
    partial: { icon: '≈', label: 'Abweichend' },
    missing: { icon: '—', label: 'Keine Zuordnung' },
    context: { icon: '↳', label: 'Gruppierung' },
  };

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function safeUrl(value) {
    try {
      const url = new URL(String(value));
      return url.protocol === 'https:' ? url.href : '';
    } catch {
      return '';
    }
  }

  function debounce(fn, delay) {
    let timer;
    return (...args) => {
      global.clearTimeout(timer);
      timer = global.setTimeout(() => fn(...args), delay);
    };
  }

  function cacheDom() {
    [
      'regionA', 'regionB', 'submissionType', 'swapBtn', 'comparisonSection',
      'comparisonBody', 'emptyState', 'statsBar', 'toolbar', 'specInfo',
      'noResults', 'searchInput', 'searchClear', 'filterPills', 'thRegionA',
      'thRegionB', 'statPairs', 'statMatches', 'statDiffs', 'statFilterChip',
      'statVisible', 'toggleExpandAll', 'exportFolders', 'exportPdf',
      'exportCsv', 'dataStatus', 'bgParticles', 'shareComparison', 'resetFilters',
      'coverageCount', 'sourceGrid', 'reviewDate', 'reviewScope', 'notification', 'printContext',
    ].forEach(id => { dom[id] = byId(id); });
  }

  function initialize() {
    cacheDom();
    const validation = core.validateDatabase(ECTD_DATABASE, REGIONS, SUBMISSION_TYPES);
    if (validation.errors.length) {
      showFatalDataError(validation.errors);
      return;
    }
    if (validation.warnings.length) {
      console.warn('eCTD-Datenhinweise:', validation.warnings);
    }
    populateSelectors();
    bindEvents();
    renderDataStatus();
    renderSources();
    restoreComparison();
  }

  function showFatalDataError(errors) {
    document.querySelector('main').innerHTML = `
      <section class="data-error" role="alert">
        <h2>Datenvalidierung fehlgeschlagen</h2>
        <p>Die Vergleichsdaten enthalten Fehler. Es wurden keine möglicherweise falschen Ergebnisse angezeigt.</p>
        <ul>${errors.map(error => `<li>${escapeHtml(error)}</li>`).join('')}</ul>
      </section>`;
  }

  function populateSelectors() {
    const regionOptions = Object.values(REGIONS)
      .map(region => `<option value="${escapeHtml(region.id)}">${escapeHtml(region.flag)} ${escapeHtml(region.label)}</option>`)
      .join('');
    dom.regionA.insertAdjacentHTML('beforeend', regionOptions);
    dom.regionB.insertAdjacentHTML('beforeend', regionOptions);
    Object.values(SUBMISSION_TYPES)
      .filter(type => type.id !== 'all')
      .forEach(type => {
        const option = document.createElement('option');
        option.value = type.id;
        option.textContent = type.label;
        dom.submissionType.append(option);
      });
  }

  function bindEvents() {
    dom.regionA.addEventListener('change', () => {
      if (dom.regionA.value === dom.regionB.value) dom.regionB.value = Object.keys(REGIONS).find(key => key !== dom.regionA.value);
      buildComparison();
    });
    dom.regionB.addEventListener('change', () => {
      if (dom.regionA.value === dom.regionB.value) dom.regionA.value = Object.keys(REGIONS).find(key => key !== dom.regionB.value);
      buildComparison();
    });
    dom.submissionType.addEventListener('change', buildComparison);
    dom.swapBtn.addEventListener('click', swapRegions);
    dom.filterPills.addEventListener('click', event => {
      const button = event.target.closest('[data-filter]');
      if (!button) return;
      state.filter = button.dataset.filter;
      dom.filterPills.querySelectorAll('[data-filter]').forEach(candidate => {
        const active = candidate === button;
        candidate.classList.toggle('active', active);
        candidate.setAttribute('aria-pressed', String(active));
      });
      applyFilters();
    });
    const refreshSearch = debounce(applyFilters, 120);
    dom.searchInput.addEventListener('input', () => {
      state.search = dom.searchInput.value;
      dom.searchClear.hidden = !state.search;
      refreshSearch();
    });
    dom.searchClear.addEventListener('click', clearSearch);
    dom.comparisonBody.addEventListener('click', event => {
      const toggle = event.target.closest('[data-tree-toggle]');
      if (!toggle) return;
      toggleRow(toggle.dataset.treeToggle);
    });
    dom.toggleExpandAll.addEventListener('click', toggleAll);
    dom.exportCsv.addEventListener('click', exportCsv);
    dom.exportPdf.addEventListener('click', exportPdf);
    dom.exportFolders.addEventListener('click', exportFolders);
    dom.shareComparison.addEventListener('click', shareComparison);
    dom.resetFilters.addEventListener('click', resetFilters);
    global.addEventListener('popstate', restoreComparison);
    global.addEventListener('afterprint', () => document.body.classList.remove('print-export'));
  }

  function swapRegions() {
    const previous = dom.regionA.value;
    dom.regionA.value = dom.regionB.value;
    dom.regionB.value = previous;
    dom.swapBtn.classList.add('is-swapping');
    global.setTimeout(() => dom.swapBtn.classList.remove('is-swapping'), 250);
    buildComparison();
  }

  function clearSearch() {
    dom.searchInput.value = '';
    state.search = '';
    dom.searchClear.hidden = true;
    dom.searchInput.focus();
    applyFilters();
  }

  function buildComparison() {
    const regionAKey = dom.regionA.value;
    const regionBKey = dom.regionB.value;
    if (!regionAKey || !regionBKey) {
      setResultsVisible(false);
      return;
    }
    for (const option of dom.regionA.options) option.disabled = option.value === regionBKey || !option.value;
    for (const option of dom.regionB.options) option.disabled = option.value === regionAKey || !option.value;

    state.model = core.buildComparisonModel(
      ECTD_DATABASE,
      regionAKey,
      regionBKey,
      dom.submissionType.value
    );
    state.expandedIds = new Set(
      state.model.rows.filter(row => row.childIds.length).map(row => row.id)
    );
    renderSpecInfo(REGIONS[regionAKey], REGIONS[regionBKey]);
    renderRows(regionAKey, regionBKey);
    updateStats();
    setResultsVisible(true);
    applyFilters();
  }

  function setResultsVisible(visible) {
    dom.emptyState.hidden = visible;
    [dom.specInfo, dom.toolbar, dom.statsBar, dom.comparisonSection]
      .forEach(element => { element.hidden = !visible; });
  }

  function renderSpecInfo(regionA, regionB) {
    const regionCard = region => {
      const source = safeUrl(region.source.url);
      return `
        <div class="spec-region">
          <strong>${escapeHtml(region.flag)} ${escapeHtml(region.specVersion)}</strong>
          <span>${escapeHtml(region.specDate)} · ${escapeHtml(region.validationCriteria)}</span>
          <small>${escapeHtml(region.reviewNote)}</small>
          ${source ? `<a class="spec-source" href="${escapeHtml(source)}" target="_blank" rel="noopener noreferrer">Offizielle Quelle ↗</a>` : ''}
        </div>`;
    };
    dom.specInfo.innerHTML = regionCard(regionA) + '<span class="spec-vs">vs.</span>' + regionCard(regionB);
  }

  function renderRows(regionAKey, regionBKey) {
    const regionA = REGIONS[regionAKey];
    const regionB = REGIONS[regionBKey];
    dom.thRegionA.textContent = `${regionA.flag} ${regionA.label}`;
    dom.thRegionB.textContent = `${regionB.flag} ${regionB.label}`;
    dom.comparisonBody.textContent = '';
    state.rowElements.clear();

    const fragment = document.createDocumentFragment();
    state.model.rows.forEach(row => {
      const tr = document.createElement('tr');
      tr.dataset.rowId = row.id;
      tr.dataset.parentId = row.parentId || '';
      tr.dataset.status = row.status;
      tr.style.setProperty('--row-depth', row.depth);
      tr.className = `comparison-row row-${row.status}${row.contextOnly ? ' row-context' : ''}`;
      tr.innerHTML = rowHtml(row, regionA, regionB);
      state.rowElements.set(row.id, tr);
      fragment.append(tr);
    });
    dom.comparisonBody.append(fragment);
    syncExpansionControls();
  }

  function rowHtml(row, regionA, regionB) {
    const hasChildren = row.childIds.length > 0;
    const toggle = hasChildren
      ? `<button type="button" class="tree-toggle" data-tree-toggle="${escapeHtml(row.id)}" aria-expanded="true" aria-label="Unterabschnitte ein- oder ausblenden">⌄</button>`
      : '<span class="tree-toggle-spacer" aria-hidden="true"></span>';
    const status = statusPresentation[row.status];
    return `
      <td class="td-topic">
        <div class="topic-heading">${toggle}<strong>${escapeHtml(row.entry.topic)}</strong></div>
        ${row.entry.note ? `<div class="topic-note">${escapeHtml(row.entry.note)}</div>` : ''}
      </td>
      <td class="td-region">${sectionHtml(row.a, regionA)}</td>
      <td class="td-region">${sectionHtml(row.b, regionB)}</td>
      <td class="td-req">${requirementsHtml(row)}</td>
      <td class="td-status"><span class="status-badge status-${escapeHtml(row.status)}"><span aria-hidden="true">${status.icon}</span> ${escapeHtml(status.label)}</span></td>`;
  }

  function sectionHtml(section, region) {
    if (!section) return '<span class="section-missing" title="In dieser redaktionellen Auswahl ist keine Zuordnung erfasst; dies belegt keine Abwesenheit einer regionalen Anforderung.">Keine Zuordnung erfasst</span>';
    const sourceUrl = safeUrl(section.source?.url);
    const documents = (section.documents || []).map(document => {
      const suffix = [document.format, document.note].filter(Boolean).join(' · ');
      return `<li>${escapeHtml(document.name)}${suffix ? ` <small>(${escapeHtml(suffix)})</small>` : ''}</li>`;
    }).join('');
    const links = (section.links || []).map(link => {
      const url = safeUrl(link.url);
      return url ? `<li><a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(link.name)} ↗</a></li>` : '';
    }).join('');
    const details = documents || links ? `
      <details class="section-details">
        <summary>Dokumente und Links</summary>
        ${documents ? `<ul>${documents}</ul>` : ''}
        ${links ? `<ul>${links}</ul>` : ''}
      </details>` : '';
    return `
      <span class="section-number">${escapeHtml(section.num)}</span>
      <span class="section-title">${escapeHtml(section.title)}</span>
      ${section.reqCondition ? `<span class="section-condition">${escapeHtml(section.reqCondition)}</span>` : ''}
      ${details}
      ${sourceUrl ? `<a class="section-source" href="${escapeHtml(sourceUrl)}" target="_blank" rel="noopener noreferrer" title="${escapeHtml(section.source.name)} · ${escapeHtml(section.source.locator)}">Quelle ↗</a>` : ''}
      ${region.structureSource ? `<a class="section-source" href="${escapeHtml(safeUrl(region.structureSource.url))}" target="_blank" rel="noopener noreferrer">EU-Format ↗</a>` : ''}`;
  }

  function requirementsHtml(row) {
    if (row.contextOnly) return '<span class="req-context">Kontext</span>';
    const badge = (section, side) => section
      ? `<span class="req-region"><small>${side}</small><span class="req-badge evidence-badge" title="Nummer und Titel geprüft; Einreichpflicht nicht bewertet">${escapeHtml(({ 'format-reference': 'Formatreferenz', 'source-checked': 'Quelle geprüft' })[section.reviewStatus] || 'Nicht geprüft')}</span></span>`
      : `<span class="req-region"><small>${side}</small><span class="req-none">—</span></span>`;
    return `<span class="req-pair">${badge(row.a, 'A')}${badge(row.b, 'B')}</span>`;
  }

  function toggleRow(id) {
    if (state.expandedIds.has(id)) state.expandedIds.delete(id);
    else state.expandedIds.add(id);
    applyFilters();
  }

  function toggleAll() {
    const expandableIds = state.model.rows
      .filter(row => row.childIds.length)
      .map(row => row.id);
    const shouldExpand = expandableIds.some(id => !state.expandedIds.has(id));
    state.expandedIds = shouldExpand ? new Set(expandableIds) : new Set();
    applyFilters();
  }

  function isExpandedThroughAncestors(row, rowsById) {
    let parentId = row.parentId;
    while (parentId) {
      if (!state.expandedIds.has(parentId)) return false;
      parentId = rowsById.get(parentId)?.parentId || null;
    }
    return true;
  }

  function applyFilters() {
    if (!state.model) return;
    const result = core.filterComparisonRows(state.model.rows, {
      status: state.filter,
      search: state.search,
    });
    const rowsById = new Map(state.model.rows.map(row => [row.id, row]));
    let visibleDataRows = 0;

    state.model.rows.forEach(row => {
      const element = state.rowElements.get(row.id);
      const exportVisible = result.includedIds.has(row.id);
      const filtering = state.filter !== 'all' || Boolean(state.search.trim());
      const uiVisible = exportVisible && (filtering || isExpandedThroughAncestors(row, rowsById));
      element.hidden = !uiVisible;
      element.dataset.exportVisible = String(exportVisible);
      element.classList.toggle('row-filtered-out', !exportVisible);
      if (uiVisible && !row.contextOnly && result.matchingIds.has(row.id)) visibleDataRows += 1;
      const toggle = element.querySelector('[data-tree-toggle]');
      if (toggle) {
        const expanded = state.expandedIds.has(row.id);
        toggle.setAttribute('aria-expanded', String(expanded));
        toggle.textContent = expanded ? '⌄' : '›';
      }
    });

    dom.noResults.hidden = visibleDataRows !== 0;
    const filtering = state.filter !== 'all' || Boolean(state.search.trim());
    dom.statFilterChip.hidden = !filtering;
    dom.statVisible.textContent = visibleDataRows;
    syncExpansionControls();
    updateUrl();
  }

  function syncExpansionControls() {
    if (!state.model) return;
    const expandableIds = state.model.rows.filter(row => row.childIds.length).map(row => row.id);
    const allExpanded = expandableIds.length > 0 && expandableIds.every(id => state.expandedIds.has(id));
    dom.toggleExpandAll.setAttribute('aria-expanded', String(allExpanded));
    dom.toggleExpandAll.lastElementChild.textContent = allExpanded ? 'Alle zuklappen' : 'Alle aufklappen';
  }

  function updateStats() {
    dom.statPairs.textContent = state.model.stats.total;
    dom.statMatches.textContent = state.model.stats.matches;
    dom.statDiffs.textContent = state.model.stats.differences;
  }

  function filteredRowsForExport() {
    return core.filterComparisonRows(state.model.rows, {
      status: state.filter,
      search: state.search,
    }).rows;
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.append(link);
    link.click();
    link.remove();
    global.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function exportCsv() {
    if (!state.model) return;
    const regionA = REGIONS[dom.regionA.value];
    const regionB = REGIONS[dom.regionB.value];
    const csv = core.buildComparisonCsv(filteredRowsForExport(), regionA, regionB, {
      ...DATASET_META, focus: dom.submissionType.value, search: state.search, filter: state.filter,
    });
    downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8' }),
      `ectd-${regionA.id}-${regionB.id}-${dom.submissionType.value}.csv`);
  }

  function exportPdf() {
    if (!state.model) return;
    applyFilters();
    dom.printContext.textContent = `${REGIONS[dom.regionA.value].label} / ${REGIONS[dom.regionB.value].label} · ${SUBMISSION_TYPES[dom.submissionType.value].label} · Filter: ${state.filter} · Suche: ${state.search || '—'} · Datensatz ${DATASET_META.version}`;
    document.body.classList.add('print-export');
    global.print();
  }

  function exportFolders() {
    const regionKeys = [...new Set([dom.regionA.value, dom.regionB.value])].filter(Boolean);
    const paths = regionKeys.flatMap(regionKey =>
      core.buildFolderPaths(ECTD_DATABASE, regionKey, dom.submissionType.value)
    );
    const readme = [
      'eCTD MODULE 1 — PLANNING ONLY / NUR ZUR PLANUNG',
      `Dataset: ${DATASET_META.version}; source review: ${DATASET_META.lastReviewedAt}`,
      `Focus: ${SUBMISSION_TYPES[dom.submissionType.value].label}`,
      DATASET_META.scope, DATASET_META.disclaimer,
      'These are readable planning folders, NOT official eCTD submission paths. No backbone XML, documents, lifecycle operations or validation is provided.',
      'The ZIP includes both regions and the entire topic focus. Search and status filters apply to CSV/PDF only.',
      ...regionKeys.map(key => `${REGIONS[key].label}: ${REGIONS[key].source.url} (${REGIONS[key].source.locator})`),
    ].join('\r\n\r\n');
    const bytes = zip.createFolderZip(paths, new Date(), { 'README-PLANNING-ONLY.txt': readme });
    downloadBlob(new Blob([bytes], { type: 'application/zip' }),
      `ectd-planning-only-${regionKeys.join('-')}-${dom.submissionType.value}.zip`);
    notify('Planungs-ZIP erstellt. Keine einreichfähige eCTD-Struktur; Hinweise im Quellenbereich beachten.');
  }

  function renderDataStatus() {
    if (!dom.dataStatus) return;
    dom.dataStatus.textContent = `Datensatz ${DATASET_META.version} · Quellenprüfung ${DATASET_META.lastReviewedAt} · ${DATASET_META.disclaimer}`;
  }

  function renderSources() {
    dom.coverageCount.textContent = `${ECTD_DATABASE.reduce((sum, entry) => sum + Object.keys(entry.regions).length, 0)} Abschnittszuordnungen`;
    dom.reviewDate.textContent = DATASET_META.lastReviewedAt;
    dom.reviewScope.textContent = DATASET_META.scope;
    dom.sourceGrid.innerHTML = Object.values(REGIONS).map(region => `
      <article class="source-card">
        <h3>${escapeHtml(region.flag)} ${escapeHtml(region.label)}</h3>
        <strong>${escapeHtml(region.specVersion)}</strong>
        <p>${escapeHtml(region.source.locator)}</p>
        <p>${escapeHtml(region.reviewNote)}</p>
        <a href="${escapeHtml(safeUrl(region.source.url))}" target="_blank" rel="noopener noreferrer">Offizielle Quelle ↗</a>
        ${region.structureSource ? `<a href="${escapeHtml(safeUrl(region.structureSource.url))}" target="_blank" rel="noopener noreferrer">EU-Strukturreferenz ↗</a>` : ''}
        ${region.overviewUrl ? `<a href="${escapeHtml(safeUrl(region.overviewUrl))}" target="_blank" rel="noopener noreferrer">Vorgaben &amp; Versionen ↗</a>` : ''}
        ${region.packageUrl ? `<a href="${escapeHtml(safeUrl(region.packageUrl))}" target="_blank" rel="noopener noreferrer">Geprüftes Paket ↗</a>` : ''}
      </article>`).join('');
  }

  function restoreComparison() {
    const params = new URLSearchParams(global.location.search);
    dom.regionA.value = REGIONS[params.get('a')] ? params.get('a') : 'eu';
    dom.regionB.value = REGIONS[params.get('b')] ? params.get('b') : 'us';
    if (dom.regionA.value === dom.regionB.value) dom.regionB.value = Object.keys(REGIONS).find(key => key !== dom.regionA.value);
    dom.submissionType.value = SUBMISSION_TYPES[params.get('focus')] ? params.get('focus') : 'all';
    state.filter = ['all', 'match', 'partial', 'missing'].includes(params.get('status')) ? params.get('status') : 'all';
    state.search = (params.get('q') || '').slice(0, 300);
    dom.searchInput.value = state.search;
    dom.searchClear.hidden = !state.search;
    syncFilterPills();
    buildComparison();
  }

  function updateUrl() {
    if (!state.model || global.location.protocol === 'file:') return;
    const url = new URL(global.location.href);
    url.search = '';
    url.searchParams.set('a', dom.regionA.value);
    url.searchParams.set('b', dom.regionB.value);
    if (dom.submissionType.value !== 'all') url.searchParams.set('focus', dom.submissionType.value);
    if (state.filter !== 'all') url.searchParams.set('status', state.filter);
    if (state.search.trim()) url.searchParams.set('q', state.search.trim());
    try { global.history.replaceState(null, '', url); } catch { /* Some file/embedded contexts restrict history. */ }
  }

  function syncFilterPills() {
    dom.filterPills.querySelectorAll('[data-filter]').forEach(button => {
      const active = button.dataset.filter === state.filter;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });
  }

  function resetFilters() {
    state.filter = 'all';
    dom.submissionType.value = 'all';
    syncFilterPills();
    clearSearch();
    buildComparison();
  }

  let notificationTimer;
  function notify(message) {
    global.clearTimeout(notificationTimer);
    dom.notification.textContent = message;
    dom.notification.hidden = false;
    notificationTimer = global.setTimeout(() => { dom.notification.hidden = true; }, 7000);
  }

  async function shareComparison() {
    updateUrl();
    try {
      await global.navigator.clipboard.writeText(global.location.href);
      notify('Link zum aktuellen Vergleich kopiert.');
    } catch {
      notify('Kopieren nicht verfügbar. Der Vergleich ist in der Browseradresse gespeichert; kopieren Sie diese manuell.');
    }
  }


  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize, { once: true });
  } else {
    initialize();
  }
})(globalThis);
