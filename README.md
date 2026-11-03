# eCTD Workspace

[EU dossier preflight](https://yasssssssserrr.github.io/eCTD-Module1-Checker/?view=validate) · [Regional reference](https://yasssssssserrr.github.io/eCTD-Module1-Checker/) · [Internal validation plan](validation/VALIDATION_PLAN.md)

Software **7.1.0** is an **internal qualification candidate**. Organizational approval is pending. It is not certified and does not perform complete EU dossier validation.

## EU dossier preflight

Select a local sequence/application folder and the intended sequence. The app reads original bytes on your device in a Web Worker. No dossier upload, browser persistence or dossier names in URLs are implemented.

- Maps **93 of 111** official EU v8.2 criteria, including all 18 PDF criteria; every remaining ID is explicitly not evaluated.
- Checks trusted ICH/EU DTD structure, original utility hashes, index/leaf MD5, safe relative references, selected envelope/UUID/sequence/leaf rules, and selected filesystem/tracking criteria.
- Distinguishes P/F failures, BP warnings, not-applicable conditions and unavailable/unimplemented checks.
- Exports JSON and printable HTML with run IDs, build/rulepack/source identifiers, selected-file and referenced-history inventories, MD5/SHA-256 and a report integrity digest.
- Provides a versioned static release ZIP, SHA-256 sidecar, per-asset manifest, qualification documents and automated engineering evidence.

Historical lifecycle state, authority receipt state, empty-directory detection and other gaps remain outside the implemented scope. PDF results use pdf.js and still need comparison with an approved reference validator. A clean partial scope never becomes a full-EU pass. Reports are unsigned evidence, not an immutable audit trail or an electronic release signature.

## Internal validation and controlled operation

The [validation plan](validation/VALIDATION_PLAN.md), [IQ/OQ/PQ execution protocol](validation/QUALIFICATION_PROTOCOL.md), [requirements](validation/USER_REQUIREMENTS.md), [risks](validation/RISK_ASSESSMENT.md), [traceability](validation/TRACEABILITY.md), [operating procedure](validation/OPERATING_PROCEDURE.md) and [release-approval template](validation/RELEASE_APPROVAL.md) are reviewable drafts. Supplied test results are engineering evidence. Your organization must approve intended use, qualify its frozen installation through IQ/OQ/PQ using representative dossiers, accept deviations/residual risks and sign the release.

Use the downloadable frozen ZIP and independently retained hash for controlled installation; a mutable public website URL alone is not a qualified installation. Serve the extracted files through your approved HTTPS or loopback server. Chromium is the supplied browser test baseline; other environments require qualification.

## Regional reference

The separate German-language reference compares selected Module 1 headings across EU, UK, US, Canada, Switzerland, Australia and Japan. It includes source evidence, editorial topic/search/status filters, shareable comparison URLs, CSV/PDF and planning ZIP exports. Heading matches do not establish legal/content equivalence; requiredness is not assessed. See [the reference-data review](VALIDATION_REPORT.md).

## Develop and test

Use Node.js 24 or later:

```sh
npm ci
npm run check
npx playwright install chromium
npm run build
npm run test:browser
npm start
```

Local preview: `http://127.0.0.1:4173/?view=validate`. On restricted Windows PowerShell use `npm.cmd` and `npx.cmd`. The reference can run from `index.html`; the validator needs the built assets and HTTP(S) for module workers.

`npm run check` runs reference regressions and the EU engine cases, generating engineering execution evidence under `.artifacts/qualification/`. Browser tests cover selection, actual WASM DTD execution, corrupt data, XML safety, local-only processing, cancellation, exports, artifact hashes and mobile behavior. Build dependencies and runtime libraries are pinned; licences are included in the published build.

Verify a downloaded JSON report with `node scripts/verify-report.mjs report.json`. A matching digest is not proof of authenticity or approval.

## Hosting and release

GitHub Pages publishes `dist/` from the `master` workflow after software and browser tests pass. Relative assets support project-path hosting. Pull requests validate without deployment. The build allowlist excludes test fixtures and dossier input.

The official rule catalogue records workbook SHA-256 and worksheet rows. Original authority utilities are tracked byte-for-byte under `validation/vendor/` and must not undergo newline normalization. `scripts/import-eu-sources.ps1` is a controlled source-import helper; builds do not fetch changing authority specifications. Any update needs impact assessment and relevant requalification.
