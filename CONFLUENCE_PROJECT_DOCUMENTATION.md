# eCTD Module 1 Checker

> Historical version 5.1 documentation. Version 6.0.0 is documented in [README.md](README.md) and [VALIDATION_REPORT.md](VALIDATION_REPORT.md). Earlier mandatory labels, regional submission-type equivalences and official-folder claims are superseded by the reviewed scope in those documents.

| Document field | Value |
|---|---|
| Application version | 5.1.0 |
| Documentation status | Historical / superseded by version 6.0.0 |
| Application status | Local prototype / internal reference tool |
| Dataset version | 2026.09 |
| Dataset last reviewed | 24 September 2026 |
| Supported regions | European Union, United Kingdom, United States, Canada, Switzerland, Australia and Japan |
| Application owner | To be assigned |
| Regulatory data owner | To be assigned |
| Technical owner | To be assigned |

> **Important:** The current version is not a publicly hosted website. It is a static application that runs locally in a web browser. This documentation describes the application, its intended use and its operating model so that stakeholders can understand and evaluate it before any future deployment.

## 1. Executive summary

The **eCTD Module 1 Checker** is a browser-based reference application for comparing regional eCTD Module 1 structures.

Module 1 is region-specific. The numbering, naming and applicability of its sections can therefore differ between regulatory authorities. The application brings these structures into one comparison view and helps regulatory users identify:

- sections with the same number and title in both selected regions;
- sections that exist in both regions but use a different structure;
- sections that exist in only one of the selected regions;
- mandatory, conditional and optional requirements;
- relevant official authority sources;
- the effect of a selected submission type on the displayed sections.

The application is intended to improve orientation and planning. It does **not** validate an eCTD sequence, inspect submitted files or replace current authority specifications and regulatory expertise.

## 2. Purpose and business value

Regulatory teams working across several markets must repeatedly determine how the administrative content of one region maps to another. Performing this comparison manually is time-consuming and can produce inconsistent results when source documents, local spreadsheets or individual interpretations differ.

The application provides a common reference view that can:

- reduce the time required for an initial regional gap assessment;
- support submission planning and cross-region discussions;
- make region-specific differences more visible;
- provide a shared vocabulary for Regulatory Affairs, Regulatory Operations and publishing teams;
- give users direct access to the source links recorded in the dataset;
- generate a preliminary folder structure for planning purposes;
- export comparison results for review and documentation.

## 3. Scope

### 3.1 Included in the current version

The current dataset covers Module 1 reference structures for:

| Code | Region | Authority |
|---|---|---|
| EU | European Union | EMA / EU eSubmission |
| UK | United Kingdom | MHRA |
| US | United States | FDA |
| CA | Canada | Health Canada |
| CH | Switzerland | Swissmedic |
| AU | Australia | TGA |
| JP | Japan | PMDA |

The application supports the following submission filters:

- all sections;
- initial application;
- Variation Type IA;
- Variation Type IB;
- Variation Type II / Major Supplement / SNDS;
- renewal;
- PSUR / PBRER / Annual Report.

### 3.2 Outside the current scope

The application does not currently:

- accept or inspect an eCTD submission;
- parse XML backbones or lifecycle metadata;
- validate file names, leaf attributes, checksums or sequence operations;
- validate content against an authority validator;
- guarantee that a section is required for a specific product or procedure;
- manage user accounts, roles or permissions;
- store comparison history in a database;
- provide collaboration, commenting or approval workflows;
- update regulatory data automatically;
- provide a centrally hosted URL.

## 4. Intended users

| User group | Typical use |
|---|---|
| Regulatory Affairs | Understand high-level regional differences and applicability |
| Regulatory Operations | Plan Module 1 content and folder structures |
| Submission Publishing | Review regional organization before publishing activities |
| Project and Submission Managers | Support scope, effort and gap discussions |
| Quality or Process Owners | Review the reference model and data governance |
| Developers and Support | Maintain the application, data and test suite |

The tool assumes that users understand basic eCTD terminology. It is not a substitute for regulatory training.

## 5. Current access model

The current application is delivered as a set of static files. There is no application server and no installation wizard.

To open it:

1. Obtain the complete application folder.
2. Keep all files in their existing relative locations.
3. Open `index.html` in a current browser.
4. Select two regions to display the comparison.

Current project location:

```text
C:\Users\Ibourk\Desktop\eCTD_Checker_App_v5
```

Because this is a local build:

- users do not access it through a shared corporate URL;
- updates must be distributed as a new application folder or through source control;
- all comparison processing takes place in the browser;
- there is no central usage tracking or audit trail;
- users may unknowingly run different dataset versions unless distribution is controlled.

## 6. User workflow

### 6.1 Create a comparison

1. Select the first region.
2. Select the second region.
3. Optionally select a submission type.
4. Review the specification summary and official source links.
5. Use search or a structure-status filter to narrow the result.
6. Expand or collapse hierarchical groups as needed.

The comparison is recalculated whenever a region or submission type changes.

### 6.2 Interpret the structure status

| Status | Meaning |
|---|---|
| **Same structure** | Both regions use the same recorded section number and title |
| **Different** | Both regions contain the logical topic, but their recorded number or title differs |
| **Missing regionally** | The logical topic is represented in only one selected region |
| **Grouping** | The row is included as hierarchy context for a matching child |

“Same structure” refers only to the recorded section number and title. It does not mean that the required documents, content expectations or regulatory assessment are identical.

### 6.3 Interpret requirement indicators

Requirements are shown independently for Region A and Region B:

| Requirement | Meaning |
|---|---|
| **Mandatory** | The dataset marks the topic as generally required for the applicable submission type |
| **Conditional** | Applicability depends on product, procedure, submission or authority-specific conditions |
| **Optional** | The section may be provided where relevant |

Any explanatory condition stored in the dataset is displayed below the regional section.

### 6.4 Search and filter

Search considers:

- logical topic;
- regional section number;
- regional section title;
- notes;
- requirement conditions.

Structure filters can show:

- all result rows;
- only the same structures;
- only different structures;
- topics missing from one region.

When a child matches a search or filter, its parent grouping remains visible to preserve context.

### 6.5 Export options

| Export | Behavior |
|---|---|
| CSV | Exports the current comparison filter, including context rows, requirements, notes, source URLs, dataset date and disclaimer |
| PDF | Opens the browser print workflow and prints the current filtered result |
| Folder ZIP | Generates a real ZIP archive containing nested, empty reference folders for both selected regions |

The generated ZIP is a planning aid. It is not an authority-ready eCTD sequence and does not contain XML, metadata or submission documents.

## 7. Data model and governance

### 7.1 Dataset structure

The application uses a normalized logical-topic model. A logical topic can contain:

- a stable internal identifier;
- a display topic;
- a logical parent;
- an optional region-specific parent override;
- region-specific section number and title;
- region-specific requirement level and condition;
- applicable submission types;
- supporting documents and links;
- an authority source and review date;
- explanatory notes.

Explicit parent identifiers ensure that hierarchy does not change when users search, filter or reorder the display.

### 7.2 Dataset validation

The application validates its dataset during startup. It refuses to show comparison results if critical structural errors are detected, including:

- duplicate entry identifiers;
- unknown regions or submission types;
- missing numbers or titles;
- invalid requirement values;
- duplicate regional number/title combinations;
- missing parent entries;
- hierarchy cycles.

### 7.3 Regulatory ownership

The dataset requires an assigned regulatory owner. The owner should:

1. monitor relevant authority specification changes;
2. assess whether a change affects section numbering, naming, hierarchy or applicability;
3. update the affected regional records;
4. update the dataset version and review date;
5. record the authority source used;
6. execute the regression suite;
7. arrange a subject-matter review before release.

Recommended review frequency: at least quarterly and whenever an authority announces a relevant specification change.

### 7.4 Source hierarchy

The following source priority should be used:

1. current authority specification or implementation package;
2. current authority validation criteria or technical guidance;
3. current authority procedure guidance;
4. internal interpretation approved by the regulatory data owner.

The application contains links to the authority pages used as starting points. The linked material remains authoritative over the local dataset.

## 8. Technical architecture

The application has no backend and no framework dependency.

```text
index.html
    |
    +-- core.js  ------ comparison, filtering, validation and folder-path logic
    |
    +-- data.js  ------ regions, submission types and normalized regulatory dataset
    |
    +-- zip.js   ------ dependency-free ZIP generation
    |
    +-- app.js   ------ browser state, rendering, interactions and exports
    |
    +-- style.css ----- responsive layout, accessibility and print presentation
```

| Component | Responsibility |
|---|---|
| `index.html` | Semantic page structure and loading order |
| `core.js` | Pure domain functions independent of the browser UI |
| `data.js` | Regulatory reference records and dataset metadata |
| `zip.js` | Creation of nested ZIP directory entries |
| `app.js` | UI controller, state management and browser export actions |
| `style.css` | Visual design, responsive behavior and print rules |
| `tests/run-tests.js` | Dependency-free regression suite |

The browser loads the scripts in this order:

1. `core.js`
2. `data.js`
3. `zip.js`
4. `app.js`

Changing this order can prevent the application from starting.

## 9. Security and privacy

The current application:

- does not contain a backend;
- does not request user credentials;
- does not upload comparison data;
- does not persist user selections;
- does not use browser local storage or cookies;
- escapes dynamic values before rendering them as HTML;
- accepts only HTTPS links for dynamic external references;
- protects CSV exports against spreadsheet formula injection.

The page currently loads the Inter font from Google Fonts. Opening authority source links also connects the browser to external authority websites. These external requests should be reviewed against the organization’s privacy, network and content-security requirements before corporate deployment.

## 10. Quality assurance

The project includes an automated regression suite that verifies:

- dataset validity;
- hierarchy integrity and cycle prevention;
- known parent-child relationships;
- every region-pair and submission-filter combination;
- uniqueness and nesting of folder paths;
- the Australia patent-information parent mapping;
- search/filter context behavior;
- CSV content and formula-injection protection;
- ZIP signatures and directory entries;
- rejection of duplicate regional sections.

Current result:

| Measure | Result |
|---|---|
| Automated tests | 10 passed, 0 failed |
| Region pairs checked | 21 |
| Submission filters checked | 7 |
| JavaScript syntax check | Passed |
| HTML/JavaScript element contract | 27 required elements found |
| Duplicate HTML identifiers | None |

With Node.js installed, run:

```powershell
npm test
npm run check
```

Interactive browser and visual regression testing are not yet automated.

## 11. Known limitations and risks

| Risk or limitation | Impact | Recommended control |
|---|---|---|
| Regulatory content is maintained manually | Dataset may become outdated | Assign an owner, review regularly and display the dataset date |
| No central deployment | Users may run different versions | Use controlled distribution or deploy internally |
| No authority validation engine | Results can be mistaken for formal validation | Retain the visible disclaimer and user training |
| Applicability is simplified | Product/procedure-specific exceptions may not be represented | Confirm all decisions against current authority guidance |
| No audit trail | Comparisons and exports are not centrally traceable | Store approved outputs in the regulated document repository |
| No automated browser tests | UI regressions may not be detected by unit tests | Add end-to-end and visual testing before deployment |
| External font request | May conflict with privacy or network policy | Self-host the font or use a system-font stack |
| No authentication or authorization | Unsuitable for protected data if publicly hosted as-is | Add enterprise access controls during deployment design |

## 12. Maintenance procedure

### 12.1 Regulatory data change

1. Identify the changed authority requirement.
2. Save the official source URL and effective date.
3. Update only the affected records in `data.js`.
4. Update `DATASET_META.version` and `lastReviewedAt`.
5. Run `npm run check`.
6. Perform a peer review with a regulatory subject-matter expert.
7. Test the changed region against at least two other regions in the browser.
8. Distribute the complete approved application folder as a new version.

### 12.2 Functional code change

1. Keep domain logic in `core.js` where possible.
2. Add or update a regression test.
3. Run the full check command.
4. Test search, filters, hierarchy expansion and all three exports.
5. Update the application version and this documentation when behavior changes.

## 13. Recommended path to an internal web application

The static architecture can be deployed internally, but production use should include:

### Phase 1 — Controlled static hosting

- host the files on an approved internal web platform;
- assign a stable internal URL;
- use HTTPS;
- remove or self-host external font dependencies;
- add security headers and a Content Security Policy;
- establish release ownership and version control;
- perform accessibility and cross-browser testing.

### Phase 2 — Governed regulatory content

- separate regulatory content from presentation code;
- introduce a controlled review and approval workflow;
- record source version, effective date, reviewer and approval date per region;
- add a visible change log;
- notify users when a dataset version changes.

### Phase 3 — Extended product capabilities

- saved and shareable comparisons;
- downloadable comparison reports with approval metadata;
- role-based administration;
- structured content management;
- automated source-change monitoring;
- optional eCTD sequence inspection as a separate, validated capability;
- usage analytics that comply with organizational privacy requirements.

## 14. Support and ownership

Before wider distribution, the following responsibilities must be assigned:

| Role | Responsibility | Assigned to |
|---|---|---|
| Product owner | Scope, priorities and stakeholder decisions | To be assigned |
| Regulatory data owner | Accuracy, review cadence and authority interpretation | To be assigned |
| Technical owner | Code, deployment, security and support | To be assigned |
| Quality reviewer | Release evidence and process compliance | To be assigned |
| User support contact | Questions, incidents and feedback | To be assigned |

## 15. Glossary

| Term | Definition |
|---|---|
| eCTD | Electronic Common Technical Document |
| Module 1 | Region-specific administrative and prescribing information |
| MAA | Marketing Authorisation Application |
| NDA | New Drug Application |
| BLA | Biologics License Application |
| NDS / SNDS | New Drug Submission / Supplemental New Drug Submission |
| PSUR / PBRER | Periodic Safety Update Report / Periodic Benefit-Risk Evaluation Report |
| RMP | Risk Management Plan |
| REMS | Risk Evaluation and Mitigation Strategy |
| DTD | Document Type Definition |
| Lifecycle | Management of submission content across sequences and regulatory activities |

## 16. Disclaimer

The eCTD Module 1 Checker is a reference and planning aid. It is not a regulatory authority system, an approved submission validator or a substitute for current official guidance and qualified regulatory judgment. Users remain responsible for verifying all submission requirements against the latest specifications and instructions of the relevant authority.
# Historical documentation

This document describes an earlier application version. For version 6.0.0, use [README.md](README.md) and [VALIDATION_REPORT.md](VALIDATION_REPORT.md). The previous mandatory labels, cross-region submission-type equivalences and official-folder claims have been superseded by the reviewed scope documented there.
