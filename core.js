/* eCTD Checker domain model and pure comparison utilities. */
(function attachEctdCore(global) {
  'use strict';

  const VALID_REQUIREMENTS = new Set(['mandatory', 'conditional', 'optional', 'not-assessed']);

  function normalizeSearch(value) {
    return String(value || '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('de').trim();
  }

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
      const parentId = entry.parentId || (parentTopic ? topicToId.get(parentTopic) || slugify(parentTopic) : null);
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
            requirement: section.requirement || entry.requirement || 'not-assessed',
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
        if ((!section.num && !section.unnumbered) || !section.title) {
          errors.push(`${entry.id}/${regionKey} requires num and title.`);
        }
        if (!VALID_REQUIREMENTS.has(section.requirement)) {
          errors.push(`${entry.id}/${regionKey} has invalid requirement ${section.requirement}.`);
        }
        if (!Array.isArray(section.submissionTypes)) {
          errors.push(`${entry.id}/${regionKey} requires a submissionTypes array.`);
        }
        (Array.isArray(section.submissionTypes) ? section.submissionTypes : []).forEach(type => {
          if (!submissionTypes[type] || type === 'all') {
            errors.push(`${entry.id}/${regionKey} has invalid submission type ${type}.`);
          }
        });

        if (!section.unnumbered && !/^(?:1(?:\.\d+)+|6\.1)$/.test(section.num)) errors.push(`${entry.id}/${regionKey} has invalid section number ${section.num}.`);
        const signature = section.num || section.title;
        const previous = regionNumbers[regionKey].get(signature);
        if (previous) {
          errors.push(`Duplicate ${regionKey} section ${signature}: ${previous} and ${entry.id}.`);
        } else {
          regionNumbers[regionKey].set(signature, entry.id);
        }
        if (!section.source?.url) {
          warnings.push(`${entry.id}/${regionKey} has no authoritative source URL.`);
        } else {
          try {
            if (new URL(section.source.url).protocol !== 'https:') throw new Error('HTTPS required');
          } catch {
            errors.push(`${entry.id}/${regionKey} has an invalid source URL.`);
          }
        }
        if (['source-checked', 'format-reference'].includes(section.reviewStatus)) {
          if (!section.source?.locator || !/^\d{4}-\d{2}-\d{2}$/.test(section.reviewedAt || '')) {
            errors.push(`${entry.id}/${regionKey} lacks review evidence.`);
          }
        }
      });
    });

    entries.forEach(entry => {
      Object.entries(entry.crossReferences || {}).forEach(([regionKey, references]) => {
        if (!regions[regionKey]) errors.push(`${entry.id} has a cross-reference for unknown region ${regionKey}.`);
        references.forEach(reference => {
          const label = `${entry.id}/${regionKey} cross-reference ${reference.num || reference.title}`;
          if (entry.regions?.[regionKey]) errors.push(`${label} duplicates a direct mapping.`);
          if (!reference.title || (!reference.unnumbered && !/^1(?:\.\d+)+$/.test(reference.num))) errors.push(`${label} is invalid.`);
          const mapped = entries.find(other => other.regions?.[regionKey]?.num === reference.num && reference.num);
          if (mapped && mapped.regions[regionKey].title !== reference.title) errors.push(`${label} differs from ${mapped.id}.`);
        });
      });
    });

    entries.forEach(entry => {
      if (entry.parentId && !entryById.has(entry.parentId)) {
        errors.push(`${entry.id} references missing parent ${entry.parentId}.`);
      }
      Object.entries(entry.regionalParentIds || {}).forEach(([regionKey, parentId]) => {
        if (!regions[regionKey]) errors.push(`${entry.id} has parent override for unknown region ${regionKey}.`);
        if (parentId && !entryById.has(parentId)) errors.push(`${entry.id}/${regionKey} references missing parent ${parentId}.`);
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
      Object.keys(regions).forEach(regionKey => {
        const seen = new Set([entry.id]);
        let parentId = getRegionalParentId(entry, regionKey);
        while (parentId) {
          if (seen.has(parentId)) {
            errors.push(`Regional hierarchy cycle detected at ${entry.id}/${regionKey}.`);
            break;
          }
          seen.add(parentId);
          const parent = entryById.get(parentId);
          parentId = parent ? getRegionalParentId(parent, regionKey) : null;
        }
      });
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
      const relatedA = pair.a || contextOnly ? [] : entry.crossReferences?.[regionKeyA] || [];
      const relatedB = pair.b || contextOnly ? [] : entry.crossReferences?.[regionKeyB] || [];
      const searchText = normalizeSearch([
        ...[...relatedA, ...relatedB].flatMap(reference => [reference.num, reference.title]),
        entry.topic,
        pair.a?.num,
        pair.a?.title,
        pair.b?.num,
        pair.b?.title,
        entry.note,
        pair.a?.reqCondition,
        pair.b?.reqCondition,
        pair.a?.source?.name,
        pair.b?.source?.name,
      ].filter(Boolean).join(' '));

      rows.push({
        id: entry.id,
        parentId: entry.parentId,
        depth,
        entry,
        a: pair.a,
        b: pair.b,
        relatedA,
        relatedB,
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
    const search = normalizeSearch(options.search);
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
    return Object.hasOwn(entry.regionalParentIds || {}, regionKey)
      ? entry.regionalParentIds[regionKey]
      : entry.parentId || null;
  }

  function folderSegment(section) {
    const number = String(section.num).replace(/[^a-zA-Z0-9]+/g, '');
    const title = slugify(section.title).slice(0, 48) || 'document';
    return number ? `${number}-${title}` : title;
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
        const section = cursor.regions[regionKey];
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
    if (/^[\s\u0000-\u001f]*[=+\-@]/.test(text) || /^[\t\r\n]/.test(text)) text = `'${text}`;
    return `"${text.replace(/"/g, '""')}"`;
  }

  function buildComparisonCsv(rows, regionA, regionB, metadata = {}) {
    const headers = [
      'Thema',
      `${regionA.label} â€“ Nr.`, `${regionA.label} â€“ Titel`, `${regionA.label} â€“ Anforderung`,
      `${regionB.label} â€“ Nr.`, `${regionB.label} â€“ Titel`, `${regionB.label} â€“ Anforderung`,
      'Strukturstatus', 'Hinweis', 'Quelle A', 'Quelle B', 'PrÃ¼fstatus A', 'PrÃ¼fstatus B', 'Fundstelle A', 'Fundstelle B',
      'Verwandte Stelle A (redaktionell)', 'Verwandte Stelle B (redaktionell)',
    ];
    const relatedCell = references => (references || []).map(reference => [reference.num, reference.title].filter(Boolean).join(' ')).join('; ');
    const statusLabels = {
      match: 'Gleiche Nummer und Bezeichnung',
      partial: 'Abweichende Struktur',
      missing: 'Keine thematische Zuordnung in der anderen Region erfasst',
      context: 'Gruppierung',
    };
    const lines = [
      ['Datenstand', metadata.lastReviewedAt || ''].map(csvCell).join(','),
      ['Version', metadata.version || ''].map(csvCell).join(','),
      ['PrÃ¼fumfang', metadata.scope || ''].map(csvCell).join(','),
      ['Ansicht', metadata.focus || 'all', 'Suche', metadata.search || '', 'Filter', metadata.filter || 'all'].map(csvCell).join(','),
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
        row.a?.reviewStatus || '', row.b?.reviewStatus || '',
        row.a?.source?.locator || '', row.b?.source?.locator || '',
        relatedCell(row.relatedA), relatedCell(row.relatedB),
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
