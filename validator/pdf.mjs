import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';
import * as pdfjsWorker from 'pdfjs-dist/legacy/build/pdf.worker.mjs';

// Runs the parser on the current thread: this module is already inside the isolated validator worker.
globalThis.pdfjsWorker = pdfjsWorker;
const ALL_PERMISSIONS = Object.values(pdfjs.PermissionFlag);
const PAGE_LINK_LIMIT = 5000;
const WEB_LINK = /^(?:https?|ftp|mailto|tel|news):/i;

export const pdfEngine = { name: 'pdfjs-dist', version: pdfjs.version };

function headerVersion(bytes) {
  const match = /^%PDF-(\d\.\d)/.exec(new TextDecoder('latin1').decode(bytes.subarray(0, 8)));
  return match ? match[1] : null;
}

function zoomOf(destination) {
  if (!Array.isArray(destination)) return 'unknown';
  const fit = destination[1]?.name;
  if (fit !== 'XYZ') return fit ? 'fixed' : 'unknown';
  const zoom = destination[4];
  return zoom === null || zoom === undefined || zoom === 0 ? 'inherit' : 'fixed';
}

async function resolveInternal(doc, destination, pageCount) {
  try {
    const target = typeof destination === 'string' ? await doc.getDestination(destination) : destination;
    if (!Array.isArray(target) || !target.length) return { valid: false, zoom: 'unknown' };
    const page = target[0];
    const index = Number.isInteger(page) ? page : await doc.getPageIndex(page);
    return { valid: index >= 0 && index < pageCount, zoom: zoomOf(target) };
  } catch { return { valid: false, zoom: 'unknown' }; }
}

function remoteZoom(fragment) {
  try { return zoomOf(JSON.parse(fragment).map((value, index) => index === 1 && typeof value === 'string' ? { name: value } : value)); }
  catch { return 'unknown'; }
}

async function normalizeLink(doc, item, pageCount, origin) {
  if (item.dest) return { kind: 'internal', origin, ...await resolveInternal(doc, item.dest, pageCount) };
  const raw = item.unsafeUrl ?? item.url;
  if (typeof raw !== 'string' || !raw || WEB_LINK.test(raw)) return null;
  const hash = raw.indexOf('#');
  const fragment = hash < 0 ? '' : raw.slice(hash + 1);
  return { kind: 'file', origin, target: hash < 0 ? raw : raw.slice(0, hash), zoom: fragment ? remoteZoom(fragment) : 'unknown' };
}

function flattenOutline(items, list = []) {
  for (const item of items || []) { list.push(item); flattenOutline(item.items, list); }
  return list;
}

function hasEscapedBackslashLink(bytes) {
  // pdf.js normalizes file-specification dictionaries, so the original bytes are the only evidence of backslashes.
  return /\/U?F\s*\((?:[^()\\]|\\.)*\\\\(?:[^()\\]|\\.)*\)/.test(new TextDecoder('latin1').decode(bytes));
}

/** Reads the properties needed by EU criteria group 16. Never renders pages or fetches external resources. */
export async function inspectPdf(bytes, onProgress) {
  const facts = { header: headerVersion(bytes), opened: false };
  const task = pdfjs.getDocument({
    data: bytes.slice(), isEvalSupported: false, disableFontFace: true, useSystemFonts: false, useWorkerFetch: false,
    isOffscreenCanvasSupported: false, stopAtErrors: false, verbosity: pdfjs.VerbosityLevel.ERRORS,
  });
  try {
    const doc = await task.promise;
    const { info } = await doc.getMetadata();
    await doc.getPage(1);
    facts.parsed = true;
    const permissions = new Set(await doc.getPermissions() || ALL_PERMISSIONS);
    const outline = flattenOutline(await doc.getOutline());
    const attachments = [...(await doc.getAttachments() || new Map()).values()].map(item => item.filename);
    const links = [];
    for (const item of outline) {
      const link = await normalizeLink(doc, item, doc.numPages, 'bookmark');
      if (link) links.push(link);
    }
    const scanned = Math.min(doc.numPages, PAGE_LINK_LIMIT);
    for (let number = 1; number <= scanned; number += 1) {
      if (number % 50 === 0) onProgress?.(number, scanned);
      const page = await doc.getPage(number);
      for (const annotation of await page.getAnnotations({ intent: 'display' })) {
        if (annotation.subtype !== 'Link') continue;
        const link = await normalizeLink(doc, annotation, doc.numPages, 'link');
        if (link) links.push(link);
      }
      page.cleanup();
    }
    Object.assign(facts, {
      opened: true, version: info.PDFFormatVersion || facts.header, pages: doc.numPages, linearized: Boolean(info.IsLinearized),
      encrypted: Boolean(info.IsEncrypted || info.EncryptFilterName), signed: Boolean(info.IsSignaturesPresent),
      restricted: ALL_PERMISSIONS.filter(flag => !permissions.has(flag)),
      pageLayout: await doc.getPageLayout() || '', pageMode: await doc.getPageMode() || 'UseNone', openAction: Object.fromEntries(await doc.getOpenAction() || []),
      properties: { title: info.Title || '', author: info.Author || '', subject: info.Subject || '', keywords: info.Keywords || '', creator: info.Creator || '', producer: info.Producer || '' },
      attachments, bookmarks: outline.length, links, linksComplete: scanned === doc.numPages,
      rawBackslashLink: links.some(link => link.kind === 'file') && hasEscapedBackslashLink(bytes),
    });
    if (facts.openAction?.dest) facts.openZoom = zoomOf(facts.openAction.dest);
  } catch (error) {
    facts.error = facts.parsed ? 'read' : error?.name === 'PasswordException' ? 'password' : /encrypt/i.test(error?.message || '') ? 'encryption' : 'corrupt';
    facts.message = String(error?.message || error).slice(0, 300);
  } finally { await task.destroy(); }
  return facts;
}
