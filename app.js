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

  const requirementLabels = {
    mandatory: 'Pflicht',
    conditional: 'Bedingt',
    optional: 'Optional',
  };
  const statusPresentation = {
    match: { icon: '✓', label: 'Gleiche Struktur' },
    partial: { icon: '≈', label: 'Abweichend' },
    missing: { icon: '✕', label: 'Fehlt regional' },
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
      'exportCsv', 'dataStatus', 'bgParticles',
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
    createParticles();
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
    dom.regionA.addEventListener('change', buildComparison);
    dom.regionB.addEventListener('change', buildComparison);
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
    dom.searchInput.addEventListener('input', debounce(() => {
      state.search = dom.searchInput.value;
      dom.searchClear.hidden = !state.search;
      applyFilters();
    }, 120));
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
    if (!section) return '<span class="section-missing">—</span>';
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
      ${sourceUrl ? `<a class="section-source" href="${escapeHtml(sourceUrl)}" target="_blank" rel="noopener noreferrer" title="${escapeHtml(region.source.name)}">Quelle ↗</a>` : ''}`;
  }

  function requirementsHtml(row) {
    if (row.contextOnly) return '<span class="req-context">Kontext</span>';
    const badge = (section, side) => section
      ? `<span class="req-region"><small>${side}</small><span class="req-badge req-${escapeHtml(section.requirement)}">${escapeHtml(requirementLabels[section.requirement])}</span></span>`
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
      const uiVisible = exportVisible && isExpandedThroughAncestors(row, rowsById);
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
    const csv = core.buildComparisonCsv(filteredRowsForExport(), regionA, regionB, DATASET_META);
    downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8' }),
      `ectd-${regionA.id}-${regionB.id}-${dom.submissionType.value}.csv`);
  }

  function exportPdf() {
    if (!state.model) return;
    document.body.classList.add('print-export');
    global.print();
  }

  function exportFolders() {
    const regionKeys = [...new Set([dom.regionA.value, dom.regionB.value])].filter(Boolean);
    const paths = regionKeys.flatMap(regionKey =>
      core.buildFolderPaths(ECTD_DATABASE, regionKey, dom.submissionType.value)
    );
    const bytes = zip.createFolderZip(paths);
    downloadBlob(new Blob([bytes], { type: 'application/zip' }),
      `ectd-folder-${regionKeys.join('-')}-${dom.submissionType.value}.zip`);
  }

  function renderDataStatus() {
    if (!dom.dataStatus) return;
    dom.dataStatus.textContent = `Datensatz ${DATASET_META.version} · geprüft am ${DATASET_META.lastReviewedAt} · ${DATASET_META.disclaimer}`;
  }

  function createParticles() {
    if (!dom.bgParticles || global.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const fragment = document.createDocumentFragment();
    for (let index = 0; index < 12; index += 1) {
      const particle = document.createElement('span');
      particle.style.setProperty('--particle-x', `${(index * 37) % 100}%`);
      particle.style.setProperty('--particle-delay', `${-(index % 6)}s`);
      fragment.append(particle);
    }
    dom.bgParticles.append(fragment);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize, { once: true });
  } else {
    initialize();
  }
})(globalThis);
