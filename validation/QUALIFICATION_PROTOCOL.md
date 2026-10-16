# QP-EU-001 — IQ/OQ/PQ execution record

Version 1.0 · Candidate software 7.0.0 · 2026-10-16 · **DRAFT — NOT EXECUTED OR APPROVED**

Use with `VALIDATION_PLAN.md`, `USER_REQUIREMENTS.md`, `RISK_ASSESSMENT.md` and `TRACEABILITY.md`. Complete organization-specific fixtures, scope, branch coverage and expected results before protocol approval. Supplied engineering executions are supporting evidence; no result below has been executed or signed by the organization.

## Preapproval and installation identification

| Field | Controlled record |
| --- | --- |
| Organization / installation / environment ID | Pending |
| Approved intended use, URS and risk revisions | Pending |
| Source commit, rulepack and release ZIP SHA-256 | Pending; retain independent expected digest |
| Operating system, browser and hosting versions | Pending |
| Fixture inventory, versions and independent expected outcomes | Pending regulatory SME approval |
| Independent reference validator / version / approved scope | Pending |
| Tester / process owner / regulatory reviewer / QA preapproval | Pending signatures and dates |

For each case retain steps performed, fixture IDs/hashes, actual result, evidence path/hash, pass/fail, tester/date and deviation ID. Blank fields mean not executed. Record deviations without overwriting original evidence. Re-execution needs a linked reason and new record. Use approved synthetic or otherwise authorized dossiers; keep confidential qualification records outside this public repository.

## Installation qualification

| ID | Procedure | Expected result | Actual / evidence / tester / date / deviation |
| --- | --- | --- | --- |
| IQ-01 | Obtain the frozen release and independently recorded SHA-256. Calculate archive SHA-256; extract; compare every listed asset with `release-manifest.json`. | Archive and every asset match; exact version, commit and pending qualification status recorded; no dirty source build accepted. | Not executed |
| IQ-02 | Record browser/OS/host, deployment path, access permissions and dependency notices. Open through approved HTTPS or loopback HTTP. | Approved environment; worker and WASM load from the controlled origin; versions and licences retained. | Not executed |
| IQ-03 | Capture network traffic, browser storage and URL before/during/after selecting and scanning an approved fixture. Clear and reload. | No dossier bytes or names transmitted, persisted in browser storage or added to URLs; only controlled static assets requested. | Not executed |
| IQ-04 | Export a report; store it with independent digest and build/source identifiers; exercise approved backup/restore and reviewer access. | Evidence recoverable unchanged, access follows approved procedure, independent digest matches restored JSON. | Not executed |

## Operational qualification

| ID | Procedure | Expected result | Actual / evidence / tester / date / deviation |
| --- | --- | --- | --- |
| OQ-01 | Reconcile the pinned source hashes and all official rule IDs/types with the approved workbook. | 111 unique IDs, 75 implemented and 36 unimplemented; source rows and P/F versus BP preserved. | Not executed |
| OQ-02 | Execute the supplied reference, engine and browser suites from the frozen source, retaining full logs and generated execution JSON. Review URS traceability independently. | All expected checks succeed; source hashes match the tested checkout. Uncovered branches are identified and supplemental cases approved/executed. | Not executed |
| OQ-03 | Run an independently reviewed valid technical fixture. Alter a trusted DTD, XML structure, index MD5, document bytes, required reference and duplicate leaf ID in separate controlled copies. | Supported positive checks pass; each corruption produces its independently specified failure or unavailable result. Altered DTD is never executed or reported as a valid baseline. | Not executed |
| OQ-04 | Test each implemented rule and applicability branch using a preapproved matrix: CP, MRP/DCP, NP, CEP; initial/follow-up; grouping/worksharing; leaf operations; names, paths, countries and thresholds. | Each expected pass/fail/not-applicable/not-evaluated result agrees with the approved interpretation and independent reference. Attach the completed rule-to-case matrix; supplied engineering cases alone do not establish exhaustive coverage. | Not executed |
| OQ-05 | Supply a missing current file, missing earlier reference, supplied earlier reference, future reference and external URI. | Missing current/future/external references fail applicable checks; unavailable history stays unevaluated; supplied history is hashed without claiming authority receipt/lifecycle validity. | Not executed |
| OQ-06 | Test XML entities, unsafe paths, case collisions, unsupported encoding, unreadable data, cancelled run, unavailable worker and configured capacity boundaries. | No external entity resolution or unsafe path use; stopped/unsupported runs yield no completed pass; no stale report survives cancellation/clear. Record qualified performance limits. | Not executed |
| OQ-07 | Export JSON/HTML; independently verify JSON digest; alter a JSON field without updating its stored digest; inspect printable output. | Original digest verifies, altered payload fails comparison, reports retain scope, inventories and build/run IDs; report digest is not presented as a signature. | Not executed |
| OQ-08 | Review results for a fixture with no supported-scope failures and one with BP-only warnings. | Neither produces a complete-EU, certified or organizationally approved conclusion; all gaps visible; BP warnings separate from P/F. | Not executed |

## Performance qualification

| ID | Procedure | Expected result | Actual / evidence / tester / date / deviation |
| --- | --- | --- | --- |
| PQ-01 | Trained users run approved representative initial/follow-up dossiers for every intended procedure and document class; compare supported findings with the approved independent validator. | Expected outcomes agree; every discrepancy investigated; PDF/lifecycle and other omitted checks supplied by named independent controls. | Not executed |
| PQ-02 | Exercise representative largest inputs, earlier-file reuse, interrupted operation and repeat runs on the actual approved workstation/host. | Measured resource/time limits acceptable; no unexplained result differences, silent omissions, false passes or confidential transmission. | Not executed |
| PQ-03 | Complete an end-to-end review, evidence retention, exception handling and independent submission-release rehearsal under the approved SOP. | Users trained, records retrievable, reviewer decisions traceable, independent release controls effective. | Not executed |

## Completion record

List evidence IDs, executed/passed/failed/not-executed counts, deviations and coverage gaps. QA must approve all deviations and residual risks before the intended supplementary operational use. Complete `RELEASE_APPROVAL.md` with authorized signatures. This protocol does not grant authority certification or make the 36 unimplemented criteria evaluated.

**Execution summary:** Not executed. **Qualification/release decision:** Pending organizational approval.
