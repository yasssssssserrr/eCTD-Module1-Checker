# eCTD Module 1 Checker

[Open the website](https://yasssssssserrr.github.io/eCTD-Module1-Checker/) · [Source review and corrections](VALIDATION_REPORT.md)

A static, browser-local reference for comparing selected Module 1 headings across EU, UK, US, Canada, Switzerland, Australia and Japan. The interface is in German and retains the authorities' English heading terminology.

## What it does

- Compares selected regional numbers and headings, with official evidence and a dated review record.
- Distinguishes direct source checks from the UK's EU-format reference.
- Filters by editorial topic, search or heading status; keeps context parents visible.
- Saves the current comparison in a shareable URL.
- Exports filtered CSV, a printable PDF view, and a planning ZIP with an embedded scope notice.
- Runs without third-party runtime dependencies, external fonts, uploads or analytics. Search terms appear in share URLs: avoid entering confidential information when sharing a link.

This is a **reference aid**, not an authority validator. Requiredness and procedure applicability are not assessed. An unmapped cell does not establish the absence of a regional requirement. Planning folders are not official eCTD submission paths. See the [review scope](VALIDATION_REPORT.md).

## Run and verify

Use Node.js 24 or later. The application itself can also be opened directly from `index.html`.

```sh
npm ci
npm run check
npx playwright install chromium
npm run build
npm run test:browser
npm start
```

Local preview: `http://127.0.0.1:4173`. The preview server serves only `dist/` and binds to loopback. Windows PowerShell users with script execution restrictions can use `npm.cmd` and `npx.cmd`.

## Hosting on GitHub Pages

The existing repository uses the `master` branch. The Pages workflow runs syntax/data tests, builds the static allowlist, runs Chromium interaction tests, and deploys `dist/` only after success. In repository **Settings → Pages**, the source is **GitHub Actions**. Push changes to `master` to publish; pull requests run validation without deploying. All asset paths are relative, so project-path hosting works.

Other static hosts can serve `dist/` after `npm run build`. There is no backend, database, API key or production Node server.

## Project files

| File | Purpose |
| --- | --- |
| `data.js` | Selected source-reviewed headings, regional versions and evidence |
| `core.js` | Data validation, hierarchy, comparison, filtering and CSV generation |
| `app.js` | Accessible UI interactions, share state and downloads |
| `zip.js` | Stored ZIP writer with UTF-8 filenames, CRC and embedded text support |
| `VALIDATION_REPORT.md` | Review sources, substantive corrections and limits |
| `tests/` | Domain and browser regression tests |
| `scripts/build.js` | Publishes an explicit allowlist to `dist/` |

Dataset version: **2026.10.16**. Review dates describe the documented source check, not regulatory certification or automatic monitoring.
