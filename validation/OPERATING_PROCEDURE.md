# SOP-EU-001 — Operation, evidence and change control

Version 1.0 · 2026-10-16 · **DRAFT — training and QA approval pending**

## Before first operational use

Complete the approved IQ/OQ/PQ and release approval for the defined supplementary scope. Use the approved frozen installation. Do not use the mutable demonstration site as a substitute for approved installation/change records.

Download `eu-validator-v7.0.0.zip` and record its hash from `eu-validator-v7.0.0.zip.sha256` in your controlled records. Independently calculate SHA-256, compare with the independently retained expected value, extract the archive and verify its individual files against `release-manifest.json`. A hash downloaded from the same site is an integrity reference, not an authenticated signature or an independently trusted provenance anchor.

Serve the extracted static files using your approved HTTPS server or loopback static server. Do not open the validator through `file://`. Qualify exact browser/OS versions; Chromium is the supplied automated baseline. Other browsers need their own evidence. Preserve the entire release, notices, lockfile/source reference and records.

## Per-dossier operation

1. Obtain authorized access to a read-only source copy of the intended sequence/application and retain a separate authoritative master.
2. Confirm software version, build commit, EU rulepack and organization approval. Select **EU Dossier prüfen**.
3. Choose the named sequence folder (e.g. `0000`) or application folder. Select the intended sequence explicitly. Prior files may be used for reference availability/hash checks; their presence does not establish valid lifecycle or authority receipt state.
4. Start the run. Wait for completion; observe execution messages. Cancellation, parser/worker errors or timeout produce no complete report. Re-run after input/version changes.
5. Review P/F deviations and local execution findings. Review BP warnings separately. Inspect all **Nicht geprüft** criteria and perform their required independent checks.
6. Download the JSON and HTML reports. Open the standalone HTML and print to PDF if needed. The JSON preserves the selected-sequence inventory and hashes of earlier referenced files. The HTML digest refers to the companion JSON, not a signature on HTML/PDF.
7. Store original input identification, report JSON, report digest, printable report, source/build/installation reference, independent validator/manual-check evidence and reviewer decisions in your approved document-control system. Reports contain filenames and can be confidential.
8. Apply the organization's independent submission-release process. This tool never authorizes submission release or certifies content.

## Digest verification

From the controlled source checkout, run `node scripts/verify-report.mjs <report.json>` to recompute the JSON payload digest. The `reportSha256` property is omitted from the hashed payload; property order is retained. The digest detects changes only when compared with an independently trusted stored record. It does not prove identity, approval, authenticity or an immutable audit trail.

## Exceptions and limitations

- Internal XML subsets/entities, `xml:base`, unsupported encodings, unsafe/ambiguous paths or excessive input are not an assessed normal case. Escalate to the process owner; do not reinterpret a stopped run as a technical pass.
- The entire source directory is read-only from the app's perspective. No upload or browser persistence is implemented. Closing/clearing the page releases references; the application does not make a forensic secure-erasure guarantee.
- Browser FileList does not enumerate empty directories. The tool therefore cannot assess rule 15.10.
- MD5 is used only because the eCTD specification requires it; SHA-256 is also recorded for inventory/report integrity. MD5 is not used for signatures or authentication.
- File counts and memory guards are not a completed performance qualification. Large files, low-memory devices, timeout behavior, video formats and rule interpretations must be qualified for actual use.
- This release does not include a full PDF engine, historical lifecycle engine, malware scanner, signed audit log or electronic-signature service. Record the independent controls used instead.

## Changes, incidents and retention

Record defects/deviations with source/build/rule/run identifiers. Preserve evidence before retrying. Assess impact on earlier relied-on reports. Changes to rules, dependencies, browser, OS, hosting, security settings, intended use or SOPs require documented impact assessment, relevant regression/qualification testing and approval before replacing the frozen build.

Set organization-specific access roles, retention periods, backup/recovery and periodic review intervals. Assess authority revisions and security updates before continued reliance. Maintain training records and the independent full-validation process.
