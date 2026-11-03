# eCTD Module 1 reference review

Source validation date: **2026-11-03**, for software 8.0.0 and dataset **2026.11.03-3**; see [the source validation](#source-validation-2026-11-03). The initial review was dated 2026-10-16 and performed under application 6.0.0.

## Scope and interpretation

This review checks the selected section numbers, heading labels and specification notes against the official sources below. It does **not** certify a submission or a complete regional checklist. Titles retain the authority's terminology with presentation capitalization/spacing; German topic names and cross-region topic groupings are editorial.

`source-checked` means that the selected heading was checked against the cited authority document. UK records use `format-reference`: the cited MHRA guidance requires EU format with UK-specific Module 1 content for International Recognition Procedure (IRP) applications, so the EU headings are used as a structure reference. This is not an independent check of UK legal or procedure requirements and does not establish the format for other UK procedures.

Requiredness is explicitly **not assessed**. XML element cardinality, presence of a heading, and whether a particular application must supply a document are different questions. The old global mandatory/conditional labels and cross-region variation/PSUR/annual-report filters have been removed. The new topic focus is editorial navigation.

An unmapped cell means this selected dataset contains no topic mapping. It does not establish that a document or obligation is absent in that jurisdiction. Identical numbers and labels do not establish equivalent document contents, procedures, or legal requirements.

## Official evidence

| Region | Reviewed source and location | Limits |
| --- | --- | --- |
| EU | [EU M1 Implementation Guide v3.1.1](https://esubmission.ema.europa.eu/eumodule1/eCTD%203.2.2%20-%20EU%20M1%20Implementation%20Guide%20v3.1.1.pdf), Appendix 2, pp. 32–49; [EMA version announcements](https://esubmission.ema.europa.eu/eumodule1/index.htm) | eCTD 3.2.2 headings only. v3.1.1 and validation criteria v8.2 mandatory from 1 December 2025. No EU eCTD v4 model; [EMA's v4.0 timeline](https://esubmission.ema.europa.eu/eCTD%20NMV/eCTD.html) gives optional use for new centrally authorised MAAs from 22 December 2025, strongly recommended use from Q1 2027 and mandatory use from Q1 2028. |
| UK | [MHRA eCTD guidance for marketing authorisation and post-authorisation applications](https://www.gov.uk/government/publications/international-recognition-procedure/ectd-guidance-for-irp-mas-and-lifecycle), EU-format instruction for IRP applications; EU guide above | Structure reference; other UK procedures, UK-specific contents and application procedures require separate review. |
| US | [FDA Module 1 Backbone Specification v2.6](https://www.fda.gov/media/159382/download), Appendix 1, DTD v3.3, pp. 23–43; Comprehensive Table of Contents Headings and Hierarchy v2.3.5; [FDA implementation overview](https://www.fda.gov/drugs/electronic-regulatory-submission-and-review/electronic-common-technical-document-ectd) | DTD v3.3 is distinct from the eCTD message version. FDA accepts new regulatory applications in v4.0 from 16 September 2024 and supports Forward Compatibility for NDA, BLA, ANDA, IND and MF from 16 October 2026; v4.0 is not modeled here. FDA lists Specifications for eCTD Validation Criteria v4.7 from 16 October 2026, and rejects submissions failing the new high-severity v3.2.2 validations 2024 and 2025 from 16 January 2027. |
| Canada | [Organization and document placement for Canadian module 1](https://www.canada.ca/en/health-canada/services/drugs-health-products/drug-products/applications-submissions/guidance-documents/organization-document-placement-canadian-module-1.html), 2 April 2024; [Creation of the Canadian Module 1 Backbone](https://www.canada.ca/content/dam/hc-sc/migration/hc-sc/dhp-mps/alt_formats/pdf/prodpharma/applic-demande/guide-ld/ctd/ectd/ectd_mod1_guide-ld_fin-eng.pdf), Appendix B, Table 5, pp. 19–21; [validation rules v5.3](https://www.canada.ca/en/health-canada/services/drugs-health-products/drug-products/applications-submissions/guidance-documents/ectd/notice-validation-rules-regulatory-transactions-submitted-health-canada-electronic-common-technical-document-format-2016-12-1.html) | Health Canada states that the placement table takes precedence over other publications and changes periodically. The 2012 backbone guide describes Schema v2.2, which Health Canada still lists. The eCTD preparation guidance is available only on request and was not reviewed. |
| Switzerland | [Official Swissmedic eCTD resources](https://www.swissmedic.ch/swissmedic/en/home/services/submissions/ectd.html); [Swiss M1 specification](https://www.swissmedic.ch/dam/swissmedic/en/dokumente/infrastruktur/os/swiss_m1_specificationforectdv.pdf.download.pdf/swiss_m1_specificationforectdv15.pdf), Appendix 1, Tables 1 and 4 | The PDF title/filename says v1.5 while its footer records document revision 1.6 dated 18 July 2024. Its change history records 1.6 as a new layout without content adjustments. No invented implementation date is asserted. Swissmedic lists Swiss eCTD Validation Criteria v1.5. |
| Australia | [TGA AU Module 1 and regional information v3.2](https://www.tga.gov.au/resources/resources/user-guide/ectd-au-module-1-and-regional-information-v32), Heading elements, Tables 6–18 and implementation timeline | v3.2 effective from 1 April 2025; v3.1 accepted through 31 October 2025. Required documents depend on the TGA Document Matrix and sequence type; no document-matrix validator is implemented. |
| Japan | [PMDA implementation package page](https://www.pmda.go.jp/int-activities/int-harmony/ich/0092.html), [package v1.6.0.3](https://www.pmda.go.jp/files/000280834.zip), `JP_Genericode/JP_CL4-context-of-use.gc_v4.xml` | The ZIP was downloaded and all 20 Module 1 Context-of-Use codes were inspected directly. Package lists JP CV 2026-06, JP IG v1.6.0 and Check Items v1.6.0.0. Comparison does not model v4.0 messages. |

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
| Japan 1.10 patent / 1.11 re-examination / 1.12 similar products / 1.13 foreign clinical data | Unsupported mappings removed. 1.10 is poison/deleterious-substance designation review data. The official 1.13 codes were added in the 2026-11-03 validation. |
| ZIP described as a real eCTD folder structure | Renamed planning ZIP; generated readable folder names are not authority submission paths. An embedded README carries the limitation with every download. |

## Source validation 2026-11-03

Dataset 2026.11.03-3 was validated against authority documents and pages, including section descriptions and notices, not only heading titles. All 256 headings and 130 pointers were compared by script with text extracted from the sources below, and the pairing of number and title was checked. The comparison shows no remaining difference. Long PDFs were compared in full for their heading tables and searched for the passages relevant to this dataset; they were not read line by line. The Canadian, Australian and Japanese reference lists were taken from the authority pages and the PMDA code file. UK records use the EU structure and remain `format-reference`. **This validation has not had independent review.**

| Region | Headings | Compared with | SHA-256 begins |
| --- | --- | --- | --- |
| EU | 32 | EU M1 Implementation Guide v3.1.1, Appendix 2, with release notes and Harmonised Guidance 6.0.1 | `ae27b9a2258ac396` |
| UK | 32 | Full text of the MHRA guidance, updated 9 October 2026; structure from the EU guide | Web page |
| US | 35 | FDA heading list v2.3.5, Specification v2.6 and its DTD, FDA v3.2.2 and v4.0 standards pages, Federal Register documents 2026-21197 and 2026-21195 | `04069ba39807b7d5`, `1adcbc40ad55adc6`, `6eab75bd8d636d0d`, `16eca79cafbc242c` |
| Canada | 35 | Health Canada placement table of 2 April 2024, including its document lists and descriptions; backbone guide Table 5, from the Internet Archive copy because canada.ca did not deliver the PDF to the download tools, although its link responds; filing and schema pages | Web page; `edb4c0e16f53b9fc` |
| Switzerland | 36 | Swiss M1 Specification, Tables 1 and 4, including its footnotes and change history; Swissmedic eCTD page | `d88512e460f57efb` |
| Australia | 66 | TGA v3.2 page, Tables 6–18, footnotes and page history, compared on the live page | Web page |
| Japan | 20 | PMDA package v1.6.0.3, `JP_CL4-context-of-use.gc_v4.xml`, package history; all codes are Active | `fc0b69e8a892c7ec` |

### Findings corrected

| Finding | Correction |
| --- | --- |
| Canada 1.2.2 Fee Forms and 1.5 Environmental Assessment Statement were shown as ordinary headings | Health Canada says not to include documents there. The restriction now appears beside the heading. |
| Canada 1.0.2 Life Cycle Management Table was shown without its status | Health Canada no longer requires it but accepts it. |
| Canadian parent sections did not show that documents belong only in subsections | The restriction now appears on 1.0, 1.2, 1.2.5, 1.3, 1.3.8, 1.4, 1.6 and 1.7. |
| Canada 1.1 Table of Contents was missing | Added. It applies to the non-eCTD format only. |
| Canadian source was the 2012 guide alone | The placement table is now the primary source, because it takes precedence. The 2012 guide remains linked for structure. |
| Canada 1.0.1 used the title "Cover letter" | Now "Cover Letter", as in the placement table. |
| Japan was described as complete at 12 codes | The package has 20 Module 1 codes. The eight 1.13 codes were added. |
| Australia was described as complete at 65 headings | Table 18 adds 6.1 Medical Device, now included. The dataset has all 66. |
| EU source location said pages 32–46 | Appendix 2 runs from page 32 to 49. Responses and Additional Data are on pages 46–47. |
| FDA source location said pages 21–46 | Appendix 1 runs from page 23 to 43. |
| FDA note said v4.0 applied to "specified" new applications | FDA says "new regulatory applications". |
| FDA rejection date was missing | Added: rejection for the new high-severity v3.2.2 validations starts 16 January 2027. |
| UK note named no date or locations | Added the guidance date, 9 October 2026, and the sections it uses. |
| EU tracking-table pointer omitted the exception | EDQM submissions are excepted, as stated in Harmonised Guidance 6.0.1. |
| Pointers missed related Canadian and Japanese sections | Added Canada 1.2.5.3, 1.2.6 and 1.4.2, and Japan 1.13.2 and 1.13.3. |

Earlier corrections in this dataset: FDA 1.4.1 "Letter of Authorization" and 1.16.2 "Risk Evaluation and Mitigation Strategy (REMS)", the FDA and EU eCTD v4.0 status, the FDA and Swiss validation-criteria names, the UK format statement's scope, and a corrupted character in "Antrag / Änderung (CH)".

### Confirmed as current on 2026-11-03

EU M1 v3.1.1 and criteria v8.2, mandatory from 1 December 2025, with EMA's v4.0 timeline. FDA spec v2.6, DTD v3.3, heading list v2.3.5 and criteria v4.7. Canadian Schema v2.2 and validation rules v5.3, effective 31 May 2025. Swiss specification v1.5 with revision 1.6, and criteria v1.5. TGA v3.2, effective 1 April 2025, with v3.1 accepted through 31 October 2025. PMDA package v1.6.0.3, JP CV 2026-06, JP IG v1.6.0 and check items v1.6.0.0.

All links in the project were tested. Canada.ca, TGA and PMDA do not reliably answer scripted requests, so their links were confirmed in a browser.

### Not verified

- **TGA CTD Module 1 guidance:** the PDF that describes each Australian section could not be downloaded. Australian numbers and titles are verified, but section content and the Australian pointers rest on heading text and search excerpts.
- **Health Canada eCTD preparation guidance:** available only on request.
- **PMDA documents:** the implementation guide and history are largely in Japanese and were only partly read. Japanese comparison uses the English code descriptions.
- **eCTD v4.0 structures:** not modeled for any region, although Japan's headings come from its v4.0 package.
- **Cross-region topic grouping:** an editorial decision that needs regulatory review.
- **Coverage:** the US, Canada and Switzerland remain selected headings (35 of 146, 35 of 57 and 36 of 80 numbered headings in the sources). An unmapped cell does not mean that content is absent.

Authorities can change these sources at any time. The result reflects 3 November 2026.

## Cross-references for unmapped regions

Dataset 2026.11.03-3 has 130 pointers for regions without a direct mapping. Each names a heading to look at in that region, for example FDA 1.12.14 Environmental Analysis for the EU Environmental Risk Assessment topic. Where no pointer exists, the interface links to the region's official source and its location. Across all region pairs, 174 of 1,148 unmapped cells have a pointer.

**Which topics are related is an editorial decision that has not had independent review.** A pointer shows where to look and does not establish equivalent content, procedure or requirement. Rows with a pointer keep the status "Keine Zuordnung", and matching and difference counts are unchanged. The absence of a pointer does not mean that the region has no such content.

## Technical verification

The project provides reproducible domain regression tests and Chromium interaction tests. Run `npm ci`, `npm run check`, `npx playwright install chromium`, `npm run build`, and `npm run test:browser`.

The domain suite checks all 21 region pairs across all five topic views; known corrected regulatory positions; review evidence; hierarchy and regional overrides; duplicate numbers; malformed data; accent-insensitive filtering; CSV formula protection; and ZIP contents, CRC values and path safety. Browser tests exercise default loading, shared links, collapsed-tree searching, region swapping, untrusted URL values, exports, source disclosure, printing and mobile layout.

These are software and reference-data checks. **No dossier files are uploaded or validated.** No XML/DTD/XSD conformance, document matrix, lifecycle, checksum, PDF accessibility, signature or authority acceptance check is performed. Browser interaction tests do not replace formal regulatory review. Source availability and regulatory requirements may change after the review date.

## Maintenance

Review changed headings against the authority's current specification before changing `reviewedAt`. Record source locations and distinguish direct checks from inferred format references. Reassess regional versions separately from this selected heading inventory. GitHub Actions tests the software before publishing the allowlisted static build.
