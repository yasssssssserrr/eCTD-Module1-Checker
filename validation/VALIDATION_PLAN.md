# VP-EU-001 — Internal software validation plan

Version 1.0 · Software 7.0.0 · 2026-10-16 · **DRAFT — NOT APPROVED FOR OPERATIONAL RELIANCE**

## Intended use and boundary

The system provides supplementary, browser-local technical preflight of one selected EU eCTD 3.2.2 sequence using EU Module 1 specification 3.1.1, DTD 3.1 and validation criteria 8.2. It may support an independently performed regulatory submission review after organizational qualification. It does not authorize submission release, validate clinical/CMC content, or certify a dossier.

The controlled implementation maps 75 of 111 official rule IDs. The remaining 36 IDs are explicitly not evaluated. In particular, PDF criteria, historical lifecycle-state checks, empty-directory detection, some naming/format guidance and other outstanding rules need independent checks. A clean implemented scope is not a successful full EU validation. The official catalogue, not the regional heading-comparison dataset, drives this engine.

The live GitHub Pages deployment is a qualification candidate and demonstration. A mutable website URL alone is not a qualified installation. Freeze the versioned release ZIP, its separately recorded SHA-256, the source commit and the deployment manifest for a controlled installation. Qualify the actual browser, operating system, hosting arrangement and procedures used by your organization.

## Basis and applicability

- [EMA eCTD reference page](https://esubmission.ema.europa.eu/ectd/) and [EU M1 specification](https://esubmission.ema.europa.eu/eumodule1/index.htm).
- Official EU validation criteria v8.2: source URL, workbook SHA-256, rule IDs and worksheet rows are recorded in `eu-v8.2-catalogue.json`.
- Six original utility files are pinned by MD5 and SHA-256 in the source repository. The EU DTD version remains 3.1 although the implementation guide is 3.1.1.
- [EU GMP Annex 11](https://health.ec.europa.eu/medicinal-products/eudralex/eudralex-volume-4_en), current listing reviewed 2026-10-16: risk assessment, requirements, testing, change control and periodic review are design references. Annex 11 applies to GMP activities; QA must determine whether this particular regulatory-affairs workflow is GxP-regulated. This project makes no automatic GMP, CE, Part 11 or authority-certification claim. Draft guidance is not treated as an effective requirement.

## Responsibilities

| Role | Required action | Approval |
| --- | --- | --- |
| Process owner | Approve intended use, requirements and independent submission-release checks | Pending |
| Regulatory subject-matter reviewer | Approve rule interpretation, profile restrictions, applicability and coverage gaps | Pending |
| System owner / IT | Approve installation, browser baseline, access and evidence storage | Pending |
| Independent tester | Execute approved IQ/OQ/PQ with controlled fixtures and retain actual results | Pending |
| QA | Approve risk acceptance, deviations, validation report and operational release | Pending |

## Qualification protocol

Use `QUALIFICATION_PROTOCOL.md` for case-level expected/actual results, evidence references and preapproval records. Expand its OQ matrix to cover each implemented rule and applicable branch before approval.

1. **Preapproval:** assign organization/document IDs; approve this plan, requirements, risk register, protocol fixtures and acceptance criteria before formal qualification. Existing automated runs are engineering evidence, not retrospectively approved validation executions.
2. **IQ:** independently record release ZIP SHA-256, extract it, verify every file against `release-manifest.json`, record commit/browser/OS, serve via approved HTTPS or loopback HTTP, verify dependency licences and content-security policy, and confirm no dossier data transmission or browser persistence. Record expected/actual outcomes and tester/date.
3. **OQ:** run the automated cases and browser suite against the frozen source/build; retain complete logs and `automated-execution.json`. Exercise positive and negative controls for every implemented rule and applicability branch. Supplement the supplied test cases where independent rule coverage is incomplete. Verify rule IDs, P/F versus BP handling, missing-history behavior, invalid input, cancellation, engine errors and export integrity. Resolve deviations.
4. **PQ:** use organization-approved, non-confidential representative dossiers for CP, MRP/DCP, NP and EDQM as applicable. Include initial and follow-up sequences, legacy/reused documents, large files, non-ASCII/malformed input, expected failures and known reference-validator reports. Establish agreement for the supported scope and document every discrepancy; no patient/confidential dossier is included in this public repository.
5. **Release:** confirm all high-risk requirements have independent evidence; accept/mitigate residual risks; complete training and SOP approval; explicitly identify the remaining independent validators and manual checks; obtain process-owner, regulatory reviewer and QA signatures in `RELEASE_APPROVAL.md`.

## Acceptance criteria

- All required IQ/OQ/PQ cases executed under the preapproved protocol and linked to actual evidence.
- No unexplained false pass, incomplete run marked complete, or confidential-data transmission.
- All high-risk deviations closed; other deviations justified and approved.
- All 111 official IDs accounted for; unimplemented/unavailable checks are never passed by default.
- Release hash, source commit, exact rulepack, dependency lockfile and test environment retained.
- Authorized organizational approval obtained. Until then, status remains **PENDING_ORGANIZATIONAL_APPROVAL**.

## Controlled interpretation decisions to approve

The implementation uses decimal 500 MB / 1 GB size thresholds; supports safe, percent-free relative leaf file URIs; rejects internal XML subsets/entities and `xml:base`; interprets the tracking-file variable suffix as optional under the general filename convention; and uses a syntactically constrained UUID profile. Confirm each against the intended dossiers and an approved reference validator during OQ/PQ. Unsupported but otherwise legal inputs must be escalated, not automatically declared a compliant dossier.

## Change and periodic review

Reassess authority sources before any rulepack change. Record impact, requirement/risk changes, test changes and retraining; requalify affected functions. Pin dependencies and retain their lockfile/licences. Review browser/security changes, defect reports and source revisions at an organization-defined interval and before reliance on a changed installation. Do not replace a qualified frozen build with an unreviewed live update.
