import { RELEASE, IMPLEMENTED_IDS } from './config.mjs';
import catalogue from '../validation/eu-v8.2-catalogue.json' with { type: 'json' };
const byId = id => document.getElementById(id);
const labels = { pass: 'Bestanden', fail: 'Abweichung', 'not-evaluated': 'Nicht geprüft', 'not-applicable': 'Nicht anwendbar' };
let worker, report, selectedFiles = [], watchdog;
const ids = ['dossierFiles','dossierSequence','runDossier','demoDossier','cancelDossier','clearDossier','dossierProgress','dossierResults','dossierSummary','dossierRules','dossierFilter','downloadDossierJson','downloadDossierHtml','dossierInventory'];
const dom = Object.fromEntries(ids.map(id => [id, byId(id)]));
const escape = value => String(value ?? '').replace(/[&<>"']/g, character => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[character]);

function mode(view) {
  const validation = view === 'validate';
  byId('validatorWorkspace').hidden = !validation;
  byId('referenceWorkspace').hidden = validation;
  document.querySelector('.skip-link').href = validation ? '#validatorWorkspace' : '#referenceWorkspace';
  for (const [id, active] of [['validationTab',validation],['comparisonTab',!validation]]) {
    byId(id).setAttribute('aria-selected', String(active));
    byId(id).classList.toggle('active', active);
  }
  if (location.protocol !== 'file:') {
    const url = new URL(location.href);
    if (validation) url.searchParams.set('view','validate'); else url.searchParams.delete('view');
    history.replaceState(null,'',url);
  }
}
byId('validationTab').addEventListener('click', () => mode('validate'));
byId('comparisonTab').addEventListener('click', () => mode('compare'));
for (const id of ['validationTab','comparisonTab']) byId(id).addEventListener('keydown', event => {
  if (!['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) return;
  event.preventDefault();
  const target = event.key === 'Home' ? 'validationTab' : event.key === 'End' ? 'comparisonTab' : id === 'validationTab' ? 'comparisonTab' : 'validationTab';
  byId(target).focus(); mode(target === 'validationTab' ? 'validate' : 'compare');
});
addEventListener('popstate', () => mode(new URLSearchParams(location.search).get('view')));
mode(new URLSearchParams(location.search).get('view'));
byId('validatorVersion').textContent = `v${RELEASE.version} · ${IMPLEMENTED_IDS.length}/${catalogue.rules.length} Kriterien umgesetzt · Regelbasis EU v8.2`;

function status(message, error = false) {
  dom.dossierProgress.textContent = message;
  dom.dossierProgress.classList.toggle('input-error', error);
}
function busy(value) {
  dom.runDossier.disabled = value || !selectedFiles.length;
  dom.demoDossier.disabled = value;
  dom.dossierFiles.disabled = value;
  dom.dossierSequence.disabled = value || !selectedFiles.length;
  dom.cancelDossier.hidden = !value;
  byId('validatorWorkspace').setAttribute('aria-busy', String(value));
}
function stop() {
  clearTimeout(watchdog);
  if(worker) { worker.onmessage=null;worker.onerror=null;worker.terminate(); } worker = null;
  busy(false);
}
function watch() {
  clearTimeout(watchdog);
  watchdog = setTimeout(() => { stop(); status('Zeitlimit der Prüfengine erreicht. Kein vollständiger Bericht erzeugt; Eingabe unabhängig prüfen.', true); }, 60000);
}
function clear() {
  stop(); report = null; selectedFiles = [];
  dom.dossierFiles.value = '';
  dom.dossierSequence.replaceChildren();
  dom.dossierResults.hidden = true;
  dom.dossierInventory.textContent = 'Noch kein Ordner ausgewählt.';
  busy(false);
  status('Wählen Sie einen Sequenzordner (z. B. 0000) oder den Anwendungsordner mit mehreren Sequenzen.');
}
dom.dossierFiles.addEventListener('change', () => {
  report = null; dom.dossierResults.hidden = true;
  selectedFiles = Array.from(dom.dossierFiles.files);
  dom.dossierSequence.replaceChildren();
  const choices = [...new Set(selectedFiles.filter(file => /\/index\.xml$/i.test(file.webkitRelativePath)).map(file => file.webkitRelativePath.split('/').at(-2)))].sort();
  choices.forEach(value => { const option = new Option(value,value); dom.dossierSequence.add(option); });
  dom.dossierSequence.value = choices.at(-1) || '';
  const bytes = selectedFiles.reduce((sum,file) => sum + file.size,0);
  dom.dossierInventory.textContent = `${selectedFiles.length} Dateien · ${(bytes/1024**2).toFixed(2)} MiB · ${choices.length} Sequenz(en) gefunden. Die gewählte Sequenz wird geprüft; frühere Dateien dienen nur zur Link-/Hashprüfung.`;
  busy(false);
  dom.runDossier.disabled = !choices.length;
  status(choices.length ? 'Bereit. Dateien werden ausschließlich lokal verarbeitet.' : 'Kein index.xml in einem benannten Sequenzordner gefunden.', !choices.length);
});
dom.dossierSequence.addEventListener('change', () => { report = null; dom.dossierResults.hidden = true; status('Neue Sequenz ausgewählt. Starten Sie eine neue Prüfung.'); });

function start(demo) {
  stop(); report = null; dom.dossierResults.hidden = true;
  if (!globalThis.Worker || location.protocol === 'file:') { status('Die Dossierprüfung benötigt einen aktuellen Browser und HTTPS oder localhost. Nutzen Sie npm start.', true); return; }
  busy(true); status('Lokale Prüfengine wird gestartet …'); watch();
  try {
    worker = new Worker(new URL('./validator.worker.js', import.meta.url), { type:'module' });
    worker.onmessage = ({ data }) => {
      watch();
      if (data.type === 'ready') worker.postMessage({ demo, files: demo ? undefined : selectedFiles.map(file => ({ path: file.webkitRelativePath, file })), sequence: demo ? '0000' : dom.dossierSequence.value });
      else if (data.type === 'progress') status(data.progress.stage === 'dtd' ? `DTD-Strukturprüfung: ${data.progress.path}` : `Datei ${data.progress.current}/${data.progress.total}: ${data.progress.path}`);
      else if (data.type === 'result') { report = data.report; stop(); render(); status('Prüflauf beendet. Gesamtprüfung unvollständig; offene Kriterien und Qualifizierungsstatus beachten.'); }
      else if (data.type === 'error') { stop(); status(`Prüfung abgebrochen: ${data.message}`, true); }
    };
    worker.onerror = () => { stop(); status('Prüfengine konnte nicht vollständig ausgeführt werden. Kein Freigabeergebnis erzeugt. Prüfen Sie Browserunterstützung und lokale Installation.', true); };
  } catch (error) { stop(); status(`Prüfung konnte nicht starten: ${error.message}`, true); }
}
dom.runDossier.addEventListener('click', () => start(false));
dom.demoDossier.addEventListener('click', () => start(true));
dom.cancelDossier.addEventListener('click', () => { stop(); report = null; dom.dossierResults.hidden = true; status('Prüfung abgebrochen. Es gibt keinen vollständigen Bericht.'); });
dom.clearDossier.addEventListener('click', clear);
dom.dossierFilter.addEventListener('change', renderRules);

function card(label, value) {
  const item = document.createElement('div'); item.className='validator-metric';
  const number = document.createElement('strong'); number.textContent=value;
  const caption = document.createElement('span'); caption.textContent=label;
  item.append(number, caption); return item;
}
function render() {
  dom.dossierResults.hidden = false;
  const s = report.summary;
  byId('dossierConclusion').textContent = s.failedRules || s.localErrors ? 'Abweichungen gefunden · keine Freigabe' : 'Geprüfter Umfang ohne P/F-Abweichung · Gesamtprüfung unvollständig';
  byId('dossierRunMeta').textContent = `${report.inputKind === 'synthetic-demo' ? 'SYNTHETISCHE DEMO · ' : ''}Sequenz ${report.sequence} · ${report.createdAt} · Lauf ${report.runId}`;
  dom.dossierSummary.replaceChildren(card('Dateien',s.files),card('P/F-Kriterien mit Fehler',s.failedRules),card('BP-Kriterien mit Hinweis',s.bestPracticeWarnings),card('Kriterien nicht geprüft',s.notEvaluated));
  byId('dossierDigest').textContent = `Bericht SHA-256: ${report.reportSha256}`;
  renderRules();
}
function renderRules() {
  if (!report) return;
  const filter=dom.dossierFilter.value;
  const rows=report.rules.filter(rule => filter==='all' || (filter==='attention' ? ['fail','not-evaluated'].includes(rule.status) : rule.status===filter));
  dom.dossierRules.replaceChildren();
  const fragment=document.createDocumentFragment();
  for(const rule of rows) {
    const tr=document.createElement('tr');
    const id=document.createElement('td');
    const link=document.createElement('a');link.textContent=rule.id;link.href=catalogue.sourceUrl;link.target='_blank';link.rel='noopener noreferrer';id.append(link);
    const description=document.createElement('td');description.textContent=rule.title;
    const type=document.createElement('td');type.textContent=rule.type;
    const state=document.createElement('td'); const badge=document.createElement('span');badge.className=`validation-status validation-${rule.status}`;badge.textContent=labels[rule.status];state.append(badge);
    const details=document.createElement('td');
    if(rule.message) { const p=document.createElement('p');p.textContent=rule.message;details.append(p); }
    for(const finding of rule.findings) { const p=document.createElement('p');p.textContent=[finding.path,finding.leafId && `Leaf ${finding.leafId}`,finding.message].filter(Boolean).join(' · ');details.append(p); }
    if(rule.findingsTruncated) { const p=document.createElement('p');p.textContent='Anzeige auf 500 Befunde begrenzt; vollständige Anzahl im Bericht.';details.append(p); }
    if(!rule.message&&!rule.findings.length) details.textContent = rule.status==='pass' ? 'Keine Abweichung im geprüften Umfang.' : 'Bedingung in diesem Lauf nicht anwendbar.';
    tr.append(id,description,type,state,details);fragment.append(tr);
  }
  dom.dossierRules.append(fragment);
  byId('dossierLocalErrors').replaceChildren();
  report.localFindings.forEach(finding=>{const p=document.createElement('p');p.textContent=`${finding.path}: ${finding.message}`;byId('dossierLocalErrors').append(p);});
}
function download(content,type,name) {
  const url=URL.createObjectURL(new Blob([content],{type}));
  const link=document.createElement('a');link.href=url;link.download=name;link.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
}
dom.downloadDossierJson.addEventListener('click',()=>{
  if(report) download(JSON.stringify(report,null,2)+'\n','application/json',`eu-ectd-${report.sequence}-${report.runId}.json`);
});
dom.downloadDossierHtml.addEventListener('click',()=>{
  if(!report)return;
  const content=`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="referrer" content="no-referrer"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'"><title>EU eCTD preflight report</title><style>body{font:12px/1.5 system-ui;margin:30px;color:#111}table{border-collapse:collapse;width:100%;margin:20px 0}td,th{border:1px solid #aaa;padding:6px;text-align:left;vertical-align:top;overflow-wrap:anywhere}h1{font-size:23px}code{overflow-wrap:anywhere}@media print{@page{size:A4 landscape;margin:12mm}body{margin:0}thead{display:table-header-group}tr{break-inside:avoid}}</style><h1>EU eCTD 3.2.2 — technical preflight</h1><p><strong>NOT CERTIFIED · ORGANIZATIONAL APPROVAL PENDING · FULL EU VALIDATION INCOMPLETE</strong></p><p>Run ${escape(report.runId)} · ${escape(report.createdAt)} · Sequence ${escape(report.sequence)} · ${escape(report.inputKind)}</p><p>Software ${escape(report.applicationVersion)} · Rulepack ${escape(report.rulepack)} · Build ${escape(report.buildCommit)}</p><p>Implemented ${report.summary.implemented}/${report.summary.catalogue}; failed P/F criteria ${report.summary.failedRules}; BP warnings ${report.summary.bestPracticeWarnings}; not evaluated ${report.summary.notEvaluated}.</p><ul>${report.limitations.map(item=>`<li>${escape(item)}</li>`).join('')}</ul><p>Source: <a href="${escape(report.sources.criteriaUrl)}">EU validation criteria v8.2</a> · SHA-256 ${escape(report.sources.criteriaSha256)}</p><table><thead><tr><th>Rule</th><th>Category / check</th><th>Type</th><th>Status</th><th>Evidence / limitations</th></tr></thead><tbody>${report.rules.map(rule=>`<tr><td>${escape(rule.id)}</td><td>${escape(rule.title)}</td><td>${escape(rule.type)}</td><td>${escape(rule.status)}</td><td>${escape(rule.message)}${rule.findings.map(finding=>`<p>${escape(JSON.stringify(finding))}</p>`).join('')}${rule.findingsTruncated?'<p>Findings truncated at 500; counts retained.</p>':''}</td></tr>`).join('')}</tbody></table><h2>Local execution findings</h2><pre>${escape(JSON.stringify(report.localFindings,null,2))}</pre><h2>Input inventory</h2><table><thead><tr><th>Path</th><th>Bytes</th><th>MD5</th><th>SHA-256</th></tr></thead><tbody>${report.manifest.map(file=>`<tr><td>${escape(file.path)}</td><td>${file.size}</td><td>${escape(file.md5)}</td><td>${escape(file.sha256)}</td></tr>`).join('')}</tbody></table><p>Companion JSON report SHA-256: ${escape(report.reportSha256)}. This is an integrity digest, not a digital signature for this HTML document.</p></html>`;
  download(content,'text/html;charset=utf-8',`eu-ectd-${report.sequence}-${report.runId}.html`);
});
busy(false);
