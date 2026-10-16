# RTM-EU-001 — Requirements and test traceability

Version 1.0 · 2026-10-16 · **DRAFT — independent coverage review pending**

`tests/validator/run-validation-tests.mjs` contains stable engineering test identifiers. Executed results, environment and source hashes are generated in `automated-execution.json`. The source catalogue maps each official ID to its worksheet row; every dossier report lists all IDs and implementation status.

| Requirement | Supplied automated evidence | Formal qualification supplement |
| --- | --- | --- |
| URS-01 | VAL-001, VAL-003 | Independent source/ID/applicability reconciliation |
| URS-02 | VAL-002, VAL-006 | Source approval and change-control review |
| URS-03 | VAL-014, VAL-015, browser folder selection | Customer OS/browser and sequence layouts |
| URS-04 | VAL-003, VAL-006–012, VAL-036 | DTD edge cases, namespace/encoding and resource controls |
| URS-05 | VAL-024–027, additional profile cases in executed evidence | Procedure, mode, UUID, related-sequence branch coverage and reference-tool comparison |
| URS-06 | VAL-020–023 | Each leaf operation, node-extension and CTD-heading boundary |
| URS-07 | VAL-004–005, VAL-018, VAL-031, VAL-033–034 | Organization-representative files, large-file and interrupted-read PQ |
| URS-08 | VAL-013, VAL-016–019 | Customer history availability/receipt-state SOP |
| URS-09 | VAL-028–030, additional utility/naming cases in executed evidence | Every mapped rule, threshold, country/name and EDQM exception |
| URS-10 | VAL-018, VAL-031, browser JSON/HTML export | Independent artifact/digest verification and controlled storage |
| URS-11 | VAL-003, VAL-017, VAL-032, browser explicit gaps | Train users on limits; approve independent checks |
| URS-12 | VAL-011–014, VAL-034–036, browser cancellation | Customer security/resource/timeout tests |
| URS-13 | Browser network/storage/URL checks | IQ/PQ network capture and endpoint/browser policy review |
| URS-14 | Generated package, catalogue, release manifest and source hashes | Review IQ evidence and sign all approval documents |
| URS-15 | Existing reference suite and validator browser suite | Customer user acceptance/accessibility and supported browsers |

## Official rule mapping

Implemented IDs are controlled in `validator/config.mjs` (`IMPLEMENTED_IDS`), not inferred from heading data. The full set is in `eu-v8.2-catalogue.json`. Rule result fields include `id`, `sourceRow`, `type`, `implemented`, `status`, probe counts, findings, and a truncation marker when detailed findings exceed 500. Counts remain available even when display detail is limited.

Utility groups 1–6 check names, locations and exact baseline hashes. Groups 7–9 check XML/checksum locations, parsing, DTDs, references and UUIDs. Selected groups 10–15 check headings, leaf attributes/references, envelopes, naming and tracking. PDF criteria (group 16), historical lifecycle and other omitted criteria remain open.

This is requirement-level traceability and a starting protocol. Supplied engineering cases do not constitute independent full branch coverage, authority certification or an approved OQ. QA must review the exact case execution output and close identified coverage gaps before approving operational reliance.
