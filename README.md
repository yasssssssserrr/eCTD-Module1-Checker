# eCTD Module 1 comparison

[Open the website](https://yasssssssserrr.github.io/eCTD-Module1-Checker/)

A German-language reference that compares selected Module 1 headings across EU, UK, US, Canada, Switzerland, Australia and Japan. It includes source evidence, editorial topic, search and status filters, shareable comparison URLs, and CSV, PDF and planning ZIP exports.

When a region has no direct mapping, the table points to a related heading in that region or to its official source. These pointers are editorial.

Heading matches do not establish legal or content equivalence, and requiredness is not assessed. The tool does not check dossiers. See [the reference-data review](VALIDATION_REPORT.md).

The EU dossier preflight that earlier versions included was removed in 8.0.0. Its last version is commit `2ad23ce` in the Git history.

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

Local preview: `http://127.0.0.1:4173/`. On restricted Windows PowerShell use `npm.cmd` and `npx.cmd`. The site can also run directly from `index.html`.

`npm run check` runs the reference regression tests. Browser tests cover loading, shared links, search, region swapping, untrusted URL values, exports, source disclosure, printing and mobile layout.

## Hosting

GitHub Pages publishes `dist/` from the `master` workflow after the tests pass. Relative assets support project-path hosting. Pull requests validate without deployment. The build allowlist keeps development files out of the published site.
