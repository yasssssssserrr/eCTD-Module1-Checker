export function createDtdValidator(library) {
  return async ({ xml, dtdName, trustedFiles }) => {
    const byName = new Map(trustedFiles.map(file => [file.fileName, file.contents]));
    let definition = byName.get(dtdName);
    if (!definition) throw new Error('Pinned DTD unavailable.');
    if (dtdName === 'eu-regional.dtd') {
      for (const [entity, filename] of [['envelope-module','eu-envelope.mod'],['leaf-module','eu-leaf.mod']]) {
        const expression = new RegExp(`<!ENTITY % ${entity} SYSTEM "${filename.replace('.', '\\.')}"\\s*>\\s*%${entity};`);
        if (!expression.test(definition) || !byName.has(filename)) throw new Error('Pinned EU DTD dependency layout changed.');
        definition = definition.replace(expression, () => byName.get(filename));
      }
    }
    // All external parameter modules above are expanded from pinned files only.
    // No uploaded DTD, input provider, external entity or network resolver is used.
    const noComments = definition.replace(/<!--[\s\S]*?-->/g, '');
    if (/\b(?:SYSTEM|PUBLIC)\s+["']/.test(noComments)) throw new Error('Unexpected external dependency in pinned DTD.');
    let doc, validator;
    try {
      const dtd = library.XmlDtd.fromString(definition);
      validator = new library.DtdValidator(dtd);
      doc = library.XmlDocument.fromString(xml, { option: library.ParseOption.XML_PARSE_NO_XXE | library.ParseOption.XML_PARSE_NONET });
      validator.validate(doc);
      return { valid: true, rawOutput: '' };
    } catch (error) {
      if (error instanceof library.XmlValidateError || error instanceof library.XmlParseError) {
        return { valid: false, rawOutput: (error.details || []).map(detail => `Line ${detail.line}: ${detail.message}`).join('\n') || error.message };
      }
      throw error;
    } finally { doc?.dispose(); validator?.dispose(); }
  };
}
