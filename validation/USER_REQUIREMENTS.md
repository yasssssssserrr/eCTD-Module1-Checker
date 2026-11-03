# URS-EU-001 — User requirements

Version 1.1 · 2026-11-03 · **DRAFT — process-owner and QA approval pending**

User population: trained regulatory-operations personnel. Intended use: supplementary EU eCTD 3.2.2 technical preflight; independent full validation and submission-release decisions remain outside this system.

| ID | Requirement | Risk |
| --- | --- | --- |
| URS-01 | Identify authority, eCTD/M1/criteria versions and account for all 111 source rule IDs without ID collisions or inferred completion | High |
| URS-02 | Pin original authority utility files and source provenance; compare uploaded utility checksums against the approved baseline | High |
| URS-03 | Read a local sequence/application folder without modifying files; select one named sequence; preserve case and reject ambiguous/unsafe paths | High |
| URS-04 | Safely parse backbones and validate structure against trusted ICH/EU DTDs; never execute uploaded DTDs/entities or fetch their references | High |
| URS-05 | Check selected envelope, UUID, sequence, related-sequence, procedure/country, INN and submission-mode criteria with explicit applicability | High |
| URS-06 | Check leaf attributes, titles, uniqueness and low-level headings without claiming historical lifecycle validation | High |
| URS-07 | Compare MD5 against original file bytes; inventory file paths, sizes and independent SHA-256 values; fail closed on unreadable data | High |
| URS-08 | Check relative reference availability and MD5; distinguish missing current files, unavailable historical evidence and future/external references | High |
| URS-09 | Check implemented naming/path/location/unreferenced-file/tracking criteria and separate best-practice findings from P/F criteria | High |
| URS-10 | Export a run-identified, dated JSON report, original/reference inventories, source/build versions and reproducible integrity digest; provide an escaped printable HTML report | High |
| URS-11 | Distinguish fail/pass/not-applicable/not-evaluated; always disclose coverage gaps and prohibit a full-EU/certified/organizationally-approved conclusion | High |
| URS-12 | Bound input sizes, isolate processing, allow cancellation and fail closed on parser/worker errors; do not allow XML/filepath injection or network resolution | High |
| URS-13 | Keep dossier bytes and names local; do not upload, persist in browser storage, include in URLs or embed in the publicly published build | High |
| URS-14 | Provide a frozen build manifest, requirements, risks, protocols, traceability, operating instructions, approval template and engineering evidence | High |
| URS-15 | Permit authorized users to review results and gaps in a usable desktop/mobile interface and reproduce a chosen rulepack/build | Medium |
| URS-16 | Evaluate EU PDF criteria 16.1–16.BP11 locally without rendering, script execution or network access; keep oversized, unidentified or unreadable cases not evaluated; never report a password-protected file as corrupted | High |

Capacity profile: at most 20,000 files and 32 GiB selected input; each backbone XML at most 20 MiB; each inspected PDF at most 1 GiB, with link annotations read for at most 5,000 pages. Hashing is incremental. These are implementation guards, not a completed performance qualification. Empty directories are not observable via browser FileList.

Out of scope: all non-EU formats; EU eCTD v4.0; PDF/A or full ISO 32000 conformance and PDF content validation; full dossier completeness; signed or immutable audit records; user authentication/authorization management; authority receipt-state integration; clinical/CMC assessment; electronic submission; regulatory certification.

Organization-specific requirements, retention periods, GxP applicability, installation scale, access management and reference-validator comparison must be added and approved before operational release.
