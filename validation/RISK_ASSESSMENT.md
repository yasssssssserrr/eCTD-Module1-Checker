# RA-EU-001 — Initial risk assessment

Version 1.1 · 2026-11-03 · **DRAFT — residual-risk acceptance pending**

Qualitative assessment uses severity and potential for undetected error. Ratings guide testing; they are not a quantitative product-safety certification. All high-risk controls require independent OQ/PQ evidence and QA acceptance.

| Risk | Effect | Initial rating | Implemented controls | Remaining work |
| --- | --- | --- | --- | --- |
| R-01 Wrong/outdated rulepack | False technical conclusion | High | Fixed v8.2 IDs, hashes, provenance, build identifiers | SME source review and controlled update SOP |
| R-02 Malformed/hostile XML or uploaded DTD | Data disclosure, hangs, incorrect parse | High | Reject entities/subsets/base rewriting; trusted flattened DTD only; no external resolver; worker isolation/cancel/watchdog | Independent security tests and resource-bound PQ |
| R-03 Corrupted file/checksum implementation error | Undetected altered dossier | High | Original-byte streaming MD5; SHA-256 inventory; independent Node-crypto test vectors | Customer representative binary/large-file PQ |
| R-04 Missing historical context | False lifecycle conclusion | High | History-state rules not evaluated; absent historical references explicit; available reference files hashed | Full lifecycle engine or approved independent validator |
| R-05 PDF engine error or leniency | Unreadable/security-restricted/incorrect attachment document passes unnoticed, or a sound file is wrongly flagged | High | Pinned pdf.js with no rendering, script execution or font/network loading; unreadable, oversized and unidentified cases stay not evaluated; synthetic positive and negative cases per rule | Reference-validator reconciliation on real PDFs from each producing tool; review of documented interpretations |
| R-13 Hostile or very large PDF | Browser hang, memory exhaustion or parser vulnerability | High | Worker isolation, cancellation, 60-second no-progress watchdog, 1 GiB size guard, no network permitted by the content-security policy | Resource PQ on the qualified workstation; dependency vulnerability monitoring and patch change control |
| R-06 Empty/unseen folders and format guidance | Incomplete filesystem assessment | High | Explicit FileList limitation and open rule 15.10; remaining guidance listed | Independent filesystem review/full validator |
| R-07 Uncompleted/cancelled run | Partial results treated as complete | High | Discard report on cancel/error/input change; no completion badge; timeout | PQ of interrupted/oversized/slow input |
| R-08 Confidential filename/data leakage | Disclosure | High | Local browser processing, no upload/storage APIs, no dossier names in share links, escaped exports | Verify network/storage in qualified browser and control downloaded reports |
| R-09 Report modified or mistaken for signed approval | Invalid audit evidence | High | Run IDs, input/reference hashes, report digest, explicit unsigned/pending status | Independent document-control storage, review/signature and access SOP |
| R-10 Mutable site/browser/dependency drift | Validated state lost | High | Frozen release ZIP, artifact hashes, pinned packages, source manifest | Installation freeze, change control, vulnerability and periodic review |
| R-11 Rule applicability/interpretation mismatch | False pass or rejection | High | Procedure conditions, explicit unsupported state, documented interpretation decisions | CP/MRP/DCP/NP/EDQM negative controls and reference-tool reconciliation |
| R-12 Misleading UI/status/export | User relies on a limited check | High | 111-rule accounting, visible 93-rule scope, pending status, no full-validation pass, downloadable gaps | Training and approved intended-use limits |

Release recommendation: **not for operational reliance until approved IQ/OQ/PQ, remaining independent checks and residual-risk acceptance are documented.** Defects, incidents, source changes and customer requirements can change this assessment.
