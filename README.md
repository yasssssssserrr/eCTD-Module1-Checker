# eCTD Module 1 Checker

Static browser application for comparing regional Module 1 structures across EU, UK, US, Canada, Switzerland, Australia and Japan.

## Run

Open `index.html` in a current browser. No build step or external JavaScript dependency is required.

## Verify

With Node.js installed:

```powershell
npm test
npm run check
```

The regression suite validates the dataset, hierarchy, every region/submission combination, CSV behavior, nested folder paths and ZIP structure.

## Data responsibility

This is a reference aid, not an authority validator. The app displays its dataset version, review date and links to official regional sources. Regulatory content must be reviewed against the current authority specification before operational use.
