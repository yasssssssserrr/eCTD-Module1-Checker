# eCTD Module 1 reference review

Review date: **2026-10-16**. Dataset: **2026.10.16**. Application: **6.0.0**.

## Scope and interpretation

This review checks the selected section numbers, heading labels and specification notes against the official sources below. It does **not** certify a submission or a complete regional checklist. Titles retain the authority's terminology with presentation capitalization/spacing; German topic names and cross-region topic groupings are editorial.

`source-checked` means that the selected heading was checked against the cited authority document. UK records use `format-reference`: MHRA requires EU format with UK-specific Module 1 content, so the EU headings are used as a structure reference. This is not an independent check of UK legal or procedure requirements.

Requiredness is explicitly **not assessed**. XML element cardinality, presence of a heading, and whether a particular application must supply a document are different questions. The old global mandatory/conditional labels and cross-region variation/PSUR/annual-report filters have been removed. The new topic focus is editorial navigation.

An unmapped cell means this selected dataset contains no topic mapping. It does not establish that a document or obligation is absent in that jurisdiction. Identical numbers and labels do not establish equivalent document contents, procedures, or legal requirements.

## Official evidence

| Region | Reviewed source and location | Limits |
| --- | --- | --- |
| EU | [EU M1 Implementation Guide v3.1.1](https://esubmission.ema.europa.eu/eumodule1/eCTD%203.2.2%20-%20EU%20M1%20Implementation%20Guide%20v3.1.1.pdf), Appendix 2, pp. 32–46; [EMA version announcements](https://esubmission.ema.europa.eu/eumodule1/index.htm) | eCTD 3.2.2 headings only. v3.1.1 and validation criteria v8.2 mandatory from 1 December 2025. No EU eCTD v4 model. |
| UK | [MHRA eCTD guidance for marketing authorisation and post-authorisation applications](https://www.gov.uk/government/publications/international-recognition-procedure/ectd-guidance-for-irp-mas-and-lifecycle), EU-format instruction; EU guide above | Structure reference; UK-specific contents and application procedures require separate review. |
| US | [FDA Module 1 Backbone Specification v2.6](https://www.fda.gov/media/159382/download), Appendix 1, DTD v3.3; [FDA implementation overview](https://www.fda.gov/drugs/electronic-regulatory-submission-and-review/electronic-common-technical-document-ectd) | DTD v3.3 is distinct from the eCTD message version. FDA supports v4.0 for specified new applications from 16 September 2024; v4.0 is not modeled here. |
| Canada | [Creation of the Canadian Module 1 Backbone](https://www.canada.ca/content/dam/hc-sc/migration/hc-sc/dhp-mps/alt_formats/pdf/prodpharma/applic-demande/guide-ld/ctd/ectd/ectd_mod1_guide-ld_fin-eng.pdf), Appendix B, Table 5, pp. 19–21; [validation rules v5.3](https://www.canada.ca/en/health-canada/services/drugs-health-products/drug-products/applications-submissions/guidance-documents/ectd/notice-validation-rules-regulatory-transactions-submitted-health-canada-electronic-common-technical-document-format-2016-12-1.html) | The publicly available heading reference is dated 2012 and describes Schema v2.2, not a regional DTD. This does not establish that all procedural content remains current. |
| Switzerland | [Official Swissmedic eCTD resources](https://www.swissmedic.ch/swissmedic/en/home/services/submissions/ectd.html); [Swiss M1 specification](https://www.swissmedic.ch/dam/swissmedic/en/dokumente/infrastruktur/os/swiss_m1_specificationforectdv.pdf.download.pdf/swiss_m1_specificationforectdv15.pdf), Appendix 1, Table 4 | The PDF title/filename says v1.5 while its footer records document revision 1.6 dated 18 July 2024. Both are displayed; no invented implementation date is asserted. |
| Australia | [TGA AU Module 1 and regional information v3.2](https://www.tga.gov.au/resources/resources/user-guide/ectd-au-module-1-and-regional-information-v32), Heading elements, Tables 6–17 and implementation timeline | v3.2 effective from 1 April 2025; v3.1 accepted through 31 October 2025. Required documents depend on the TGA Document Matrix and sequence type; no document-matrix validator is implemented. |
| Japan | [PMDA implementation package page](https://www.pmda.go.jp/int-activities/int-harmony/ich/0092.html), [package v1.6.0.3](https://www.pmda.go.jp/files/000280834.zip), `JP_Genericode/JP_CL4-context-of-use.gc_v4.xml` | The ZIP was downloaded and the Module 1 Context-of-Use codes were inspected directly. Package lists JP CV 2026-06, JP IG v1.6.0 and Check Items v1.6.0.0. Comparison does not model v4.0 messages. |

## Substantive corrections

| Previous data | Corrected reference |
| --- | --- |
| EU/UK Braille: 1.3.3 | 1.3.6; 1.3.3 is Specimen. |
| EU/UK generics and bibliographical applications merged at 1.5.1 | Bibliographical applications: 1.5.1; generic/hybrid/biosimilar: 1.5.2. |
| EU/UK conditional and exceptional applications merged at 1.5.2 | Exceptional circumstances: 1.5.4; conditional marketing authorisation: 1.5.5. |
| FDA field copy certification: 1.1.2 | 1.3.2 under Administrative Information. |
| FDA 1.5 described as clinical pharmacology | Application Status. |
| FDA 1.8 described as IND safety reports | Special Protocol Assessment Request. |
| FDA 1.10 described as a general investigational plan | Dispute Resolution. Initial-IND General Investigational Plan is 1.20. |
| FDA References grouped as if equivalent to Health Canada Summaries | Separate topics; both use 1.4 for different meanings. |
| Canada Forms: 1.1; cover letter at correspondence parent | Forms: 1.2.1; Cover letter: 1.0.1; correspondence parent: 1.0. |
| Canada lifecycle table: 1.0.1 | 1.0.2. |
| Australia application forms at 1.2, patent at 1.2.2 | Administrative parent: 1.2; application forms: 1.2.1; patent certification: 1.2.3. |
| Australia label mock-ups: 1.3.4 | Label mock-ups and specimens: 1.3.3. |
| Australia orphan designation incorrectly used as all of 1.5 | 1.5 is specific requirements; designation supporting documents are 1.5.2. |
| Switzerland patient information grouped as packaging mock-ups at 1.3.2 | Patient information: 1.3.2; packaging information: 1.3.3. |
| Switzerland 1.5 treated as EU-style application requirements | Bioavailability studies; selected 1.5.1 heading follows the Swiss specification. |
| Japan certificates/product information/experts/RMP modeled after EU headings | Certificates: 1.3; patent status: 1.4; development: 1.5; foreign use: 1.6; related products: 1.7; draft package insert: 1.8; draft RMP: 1.11; attached-document list: 1.12. |
| Japan 1.10 patent / 1.11 re-examination / 1.12 similar products / 1.13 foreign clinical data | Unsupported mappings removed. 1.10 is poison/deleterious-substance designation review data. |
| ZIP described as a real eCTD folder structure | Renamed planning ZIP; generated readable folder names are not authority submission paths. An embedded README carries the limitation with every download. |

## Technical verification

The project provides reproducible domain regression tests and Chromium interaction tests. Run `npm ci`, `npm run check`, `npx playwright install chromium`, `npm run build`, and `npm run test:browser`.

The domain suite checks all 21 region pairs across all five topic views; known corrected regulatory positions; review evidence; hierarchy and regional overrides; duplicate numbers; malformed data; accent-insensitive filtering; CSV formula protection; and ZIP contents, CRC values and path safety. Browser tests exercise default loading, shared links, collapsed-tree searching, region swapping, untrusted URL values, exports, source disclosure, printing and mobile layout.

These are software and reference-data checks. **No dossier files are uploaded or validated.** No XML/DTD/XSD conformance, document matrix, lifecycle, checksum, PDF accessibility, signature or authority acceptance check is performed. Browser interaction tests do not replace formal regulatory review. Source availability and regulatory requirements may change after the review date.

## Maintenance

Review changed headings against the authority's current specification before changing `reviewedAt`. Record source locations and distinguish direct checks from inferred format references. Reassess regional versions separately from this selected heading inventory. GitHub Actions tests the software before publishing the allowlisted static build.
