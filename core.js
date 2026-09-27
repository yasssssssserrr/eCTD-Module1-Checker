/* eCTD Checker domain model and pure comparison utilities. */
(function attachEctdCore(global) {
  'use strict';

  const VALID_REQUIREMENTS = new Set(['mandatory', 'conditional', 'optional']);

  function slugify(value) {
    return String(value || '')
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  function cloneList(value) {
    return Array.isArray(value) ? value.map(item => ({ ...item })) : [];
  }

  function normalizeDatabase(rawEntries, options) {
    const {
      regions,
      parentByTopic = {},
      parentByRegion = {},
    } = options;

    const topicToId = new Map(
      rawEntries.map(entry => [entry.topic, entry.id || slugify(entry.topic)])
    );

    return rawEntries.map((entry, order) => {
      const id = entry.id || topicToId.get(entry.topic);
      const parentTopic = entry.parentTopic || parentByTopic[entry.topic] || null;
      const parentId = parentTopic ? topicToId.get(parentTopic) || slugify(parentTopic) : null;
      const regionalParentTopics = parentByRegion[entry.topic] || {};
      const regionalParentIds = Object.fromEntries(
        Object.entries(regionalParentTopics).map(([regionKey, topic]) => [
          regionKey,
          topicToId.get(topic) || slugify(topic),
        ])
      );

      const normalizedRegions = Object.fromEntries(
        Object.entries(entry.regions || {}).map(([regionKey, section]) => [
          regionKey,
          {
            ...section,
            requirement: section.requirement || entry.requirement || 'optional',
            reqCondition: section.reqCondition || entry.reqCondition || '',
            submissionTypes: [...(section.submissionTypes || entry.submissionTypes || [])],
            documents: cloneList(section.documents || entry.documents),
            links: cloneList(section.links || entry.links),
            source: section.source || regions[regionKey]?.source || null,
          },
        ])
      );

      return {
        ...entry,
        id,
        order,
        parentId,
        regionalParentIds,
        level: parentId ? 1 : 0,
        regions: normalizedRegions,
      };
    });
  }

  function validateDatabase(entries, regions, submissionTypes) {
    const errors = [];
    const warnings = [];
    const ids = new Set();
    const entryById = new Map();
    const regionNumbers = Object.fromEntries(Object.keys(regions).map(key => [key, new Map()]));

    entries.forEach((entry, index) => {
      if (!entry.id) errors.push(`Entry ${index} has no id.`);
      if (ids.has(entry.id)) errors.push(`Duplicate entry id: ${entry.id}.`);
      ids.add(entry.id);
      entryById.set(entry.id, entry);

      if (!entry.topic) errors.push(`Entry ${entry.id || index} has no topic.`);
      if (entry.parentId === entry.id) errors.push(`Entry ${entry.id} cannot parent itself.`);

      Object.entries(entry.regions || {}).forEach(([regionKey, section]) => {
        if (!regions[regionKey]) {
          errors.push(`${entry.id} uses unknown region ${regionKey}.`);
          return;
        }
        if (!section.num || !section.title) {
          errors.push(`${entry.id}/${regionKey} requires num and title.`);
        }
        if (!VALID_REQUIREMENTS.has(section.requirement)) {
          errors.push(`${entry.id}/${regionKey} has invalid requirement ${section.requirement}.`);
        }
        section.submissionTypes.forEach(type => {
          if (!submissionTypes[type] || type === 'all') {
            errors.push(`${entry.id}/${regionKey} has invalid submission type ${type}.`);
          }
        });

        const signature = `${section.num}|${section.title}`;
        const previous = regionNumbers[regionKey].get(signature);
        if (previous) {
          errors.push(`Duplicate ${regionKey} section ${signature}: ${previous} and ${entry.id}.`);
        } else {
          regionNumbers[regionKey].set(signature, entry.id);
        }
        if (!section.source?.url) {
          warnings.push(`${entry.id}/${regionKey} has no authoritative source URL.`);
        }
      });
    });

    entries.forEach(entry => {
      if (entry.parentId && !entryById.has(entry.parentId)) {
        errors.push(`${entry.id} references missing parent ${entry.parentId}.`);
      }
      Object.entries(entry.regionalParentIds || {}).forEach(([regionKey, parentId]) => {
        if (!regions[regionKey]) errors.push(`${entry.id} has parent override for unknown region ${regionKey}.`);
        if (!entryById.has(parentId)) errors.push(`${entry.id}/${regionKey} references missing parent ${parentId}.`);
      });

      const visited = new Set([entry.id]);
      let cursor = entry;
      while (cursor?.parentId) {
        if (visited.has(cursor.parentId)) {
          errors.push(`Hierarchy cycle detected at ${entry.id}.`);
          break;
        }
        visited.add(cursor.parentId);
        cursor = entryById.get(cursor.parentId);
      }
    });

    return { errors, warnings };
  }

  function sectionForSubmission(entry, regionKey, submissionType) {
    const section = entry.regions[regionKey];
    if (!section) return null;
    if (submissionType === 'all') return section;
    return section.submissionTypes.includes(submissionType) ? section : null;
  }

  function structuralStatus(a, b) {
    if (a && b && a.num === b.num && a.title === b.title) return 'match';
    if (a && b) return 'partial';
    return 'missing';
  }

  function buildComparisonModel(entries, regionKeyA, regionKeyB, submissionType = 'all') {
    const entryById = new Map(entries.map(entry => [entry.id, entry]));
    const direct = new Map();

    entries.forEach(entry => {
      const a = sectionForSubmission(entry, regionKeyA, submissionType);
      const b = sectionForSubmission(entry, regionKeyB, submissionType);
      if (a || b) direct.set(entry.id, { a, b });
    });

    const includedIds = new Set(direct.keys());
    direct.forEach((_, id) => {
      let parentId = entryById.get(id)?.parentId;
      while (parentId) {
        includedIds.add(parentId);
        parentId = entryById.get(parentId)?.parentId || null;
      }
    });

    const childrenByParent = new Map();
    entries.forEach(entry => {
      const key = entry.parentId || '__root__';
      if (!childrenByParent.has(key)) childrenByParent.set(key, []);
      childrenByParent.get(key).push(entry);
    });
    childrenByParent.forEach(children => children.sort((left, right) => left.order - right.order));

    const rows = [];
    function visit(entry, depth) {
      if (!includedIds.has(entry.id)) return;
      const pair = direct.get(entry.id) || { a: null, b: null };
      const contextOnly = !direct.has(entry.id);
      const status = contextOnly ? 'context' : structuralStatus(pair.a, pair.b);
      const searchText = [
        entry.topic,
        pair.a?.num,
        pair.a?.title,
        pair.b?.num,
        pair.b?.title,
        entry.note,
        pair.a?.reqCondition,
        pair.b?.reqCondition,
      ].filter(Boolean).join(' ').toLocaleLowerCase('de');

      rows.push({
        id: entry.id,
        parentId: entry.parentId,
        depth,
        entry,
        a: pair.a,
        b: pair.b,
        status,
        contextOnly,
        searchText,
        childIds: (childrenByParent.get(entry.id) || [])
          .filter(child => includedIds.has(child.id))
          .map(child => child.id),
      });
      (childrenByParent.get(entry.id) || []).forEach(child => visit(child, depth + 1));
    }
    (childrenByParent.get('__root__') || []).forEach(root => visit(root, 0));

    const dataRows = rows.filter(row => !row.contextOnly);
    return {
      rows,
      stats: {
        total: dataRows.length,
        matches: dataRows.filter(row => row.status === 'match').length,
        differences: dataRows.filter(row => row.status !== 'match').length,
      },
    };
  }

  function filterComparisonRows(rows, options = {}) {
    const status = options.status || 'all';
    const search = String(options.search || '').trim().toLocaleLowerCase('de');
    const byId = new Map(rows.map(row => [row.id, row]));
    const matchingIds = new Set();
    const includedIds = new Set();

    rows.forEach(row => {
      if (row.contextOnly) return;
      if (status !== 'all' && row.status !== status) return;
      if (search && !row.searchText.includes(search)) return;
      matchingIds.add(row.id);
      includedIds.add(row.id);
      let parentId = row.parentId;
      while (parentId) {
        includedIds.add(parentId);
        parentId = byId.get(parentId)?.parentId || null;
      }
    });

    return {
      matchingIds,
      includedIds,
      rows: rows.filter(row => includedIds.has(row.id)),
    };
  }

  function getRegionalParentId(entry, regionKey) {
    return entry.regionalParentIds?.[regionKey] || entry.parentId || null;
  }

  function folderSegment(section) {
    const number = String(section.num).replace(/[^a-zA-Z0-9]+/g, '') || 'section';
    const title = slugify(section.title).slice(0, 48) || 'document';
    return `${number}-${title}`;
  }

  function buildFolderPaths(entries, regionKey, submissionType = 'all') {
    const entryById = new Map(entries.map(entry => [entry.id, entry]));
    const selected = entries.filter(entry => sectionForSubmission(entry, regionKey, submissionType));
    const paths = new Set();

    function sectionChain(entry) {
      const chain = [];
      const visited = new Set();
      let cursor = entry;
      while (cursor && !visited.has(cursor.id)) {
        visited.add(cursor.id);
        const section = sectionForSubmission(cursor, regionKey, submissionType);
        if (section) chain.unshift(folderSegment(section));
        cursor = entryById.get(getRegionalParentId(cursor, regionKey));
      }
      return chain;
    }

    selected.forEach(entry => {
      paths.add(`m1/${regionKey}/${sectionChain(entry).join('/')}/`);
    });
    return [...paths].sort((left, right) => left.localeCompare(right));
  }

  function csvCell(value) {
    let text = String(value ?? '');
    if (/^[=+\-@]/.test(text)) text = `'${text}`;
    return `"${text.replace(/"/g, '""')}"`;
  }

  function buildComparisonCsv(rows, regionA, regionB, metadata = {}) {
    const headers = [
      'Thema',
      `${regionA.label} – Nr.`, `${regionA.label} – Titel`, `${regionA.label} – Anforderung`,
      `${regionB.label} – Nr.`, `${regionB.label} – Titel`, `${regionB.label} – Anforderung`,
      'Strukturstatus', 'Hinweis', 'Quelle A', 'Quelle B',
    ];
    const statusLabels = {
      match: 'Gleiche Nummer und Bezeichnung',
      partial: 'Abweichende Struktur',
      missing: 'Nur in einer Region vorhanden',
      context: 'Gruppierung',
    };
    const lines = [
      ['Datenstand', metadata.lastReviewedAt || ''].map(csvCell).join(','),
      ['Haftungshinweis', metadata.disclaimer || ''].map(csvCell).join(','),
      headers.map(csvCell).join(','),
    ];
    rows.forEach(row => {
      lines.push([
        row.entry.topic,
        row.a?.num, row.a?.title, row.a?.requirement,
        row.b?.num, row.b?.title, row.b?.requirement,
        statusLabels[row.status] || row.status,
        row.entry.note || '',
        row.a?.source?.url || '', row.b?.source?.url || '',
      ].map(csvCell).join(','));
    });
    return `\uFEFF${lines.join('\n')}`;
  }

  global.EctdCore = Object.freeze({
    slugify,
    normalizeDatabase,
    validateDatabase,
    buildComparisonModel,
    filterComparisonRows,
    buildFolderPaths,
    buildComparisonCsv,
    structuralStatus,
    getRegionalParentId,
  });
})(globalThis);
