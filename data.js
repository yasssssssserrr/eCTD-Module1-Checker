/* Selected source-reviewed headings. Topic mappings are editorial; requiredness is not assessed. */
(function attachEctdData(global) {
  'use strict';
  const DATASET_META = Object.freeze({
    version: '2026.11.03', lastReviewedAt: '2026-11-03',
    scope: 'Ausgewählte Module-1-Überschriften; Nummern und Titel anhand offizieller Quellen geprüft. UK: EU-Format gemäß MHRA-Leitfaden für das International Recognition Procedure (IRP). Themenzuordnung redaktionell.',
    disclaimer: 'Referenzhilfe, keine Dossiervalidierung. Gleiche Überschriften belegen keine regulatorische Gleichwertigkeit. Die Auswahl ist nicht vollständig; Einreichpflicht und Verfahrensrelevanz sind nicht bewertet. ZIP-Ordner sind ausschließlich Planungshilfen.',
  });
  const SUBMISSION_TYPES = {
    all: { id: 'all', label: 'Alle Themen' },
    admin: { id: 'admin', label: 'Administration & Korrespondenz' },
    product: { id: 'product', label: 'Produktinformation & Kennzeichnung' },
    safety: { id: 'safety', label: 'Sicherheit & Risikomanagement' },
    clinical: { id: 'clinical', label: 'Klinische & besondere Anforderungen' },
  };
  const EU_SPEC = 'https://esubmission.ema.europa.eu/eumodule1/eCTD%203.2.2%20-%20EU%20M1%20Implementation%20Guide%20v3.1.1.pdf';
  const CA_SPEC = 'https://www.canada.ca/content/dam/hc-sc/migration/hc-sc/dhp-mps/alt_formats/pdf/prodpharma/applic-demande/guide-ld/ctd/ectd/ectd_mod1_guide-ld_fin-eng.pdf';
  const CH_SPEC = 'https://www.swissmedic.ch/dam/swissmedic/en/dokumente/infrastruktur/os/swiss_m1_specificationforectdv.pdf.download.pdf/swiss_m1_specificationforectdv15.pdf';
  const AU_SPEC = 'https://www.tga.gov.au/resources/resources/user-guide/ectd-au-module-1-and-regional-information-v32';
  const source = (name, url, locator) => ({ name, url, locator, reviewedAt: DATASET_META.lastReviewedAt });
  const REGIONS = {
    eu: {
      id: 'eu', label: 'EU (EMA)', flag: '🇪🇺', specVersion: 'EU M1 v3.1.1 · eCTD 3.2.2', specDate: 'Pflicht seit 01.12.2025', validationCriteria: 'EU Validation Criteria v8.2',
      source: source('EU M1 Implementation Guide v3.1.1', EU_SPEC, 'Appendix 2, S. 32–46'),
      overviewUrl: 'https://esubmission.ema.europa.eu/eumodule1/index.htm',
      reviewNote: 'Ausgewählte Überschriften aus Appendix 2. eCTD v4.0 ist hier nicht modelliert: optional für neue zentralisierte Zulassungsanträge seit 22.12.2025, dringend empfohlen ab Q1 2027, verpflichtend ab Q1 2028.',
    },
    uk: {
      id: 'uk', label: 'UK (MHRA)', flag: '🇬🇧', specVersion: 'EU-Format gemäß MHRA-IRP-Leitfaden', specDate: 'UK-spezifische Inhalte in Modul 1', validationCriteria: 'MHRA-Anleitung und EU-Struktur',
      source: source('MHRA eCTD guidance', 'https://www.gov.uk/government/publications/international-recognition-procedure/ectd-guidance-for-irp-mas-and-lifecycle', 'EU-Format-Vorgabe; Überschriften aus EU Appendix 2'),
      structureSource: source('EU-Struktur als Formatreferenz', EU_SPEC, 'Appendix 2'),
      reviewNote: 'Der zitierte MHRA-Leitfaden verlangt für IRP-Zulassungsanträge EU-Format mit UK-Inhalten in Modul 1. Andere UK-Verfahren sind damit nicht belegt. Keine unabhängige Prüfung aller UK-Verfahrensregeln und keine Gleichsetzung mit EU-Recht.',
    },
    us: {
      id: 'us', label: 'USA (FDA)', flag: '🇺🇸', specVersion: 'US Regional DTD v3.3 · eCTD 3.2.2', specDate: 'Backbone Specification v2.6', validationCriteria: 'FDA Specifications for eCTD Validation Criteria v4.7 (ab 16.10.2026)',
      source: source('FDA Module 1 Backbone Specification v2.6', 'https://www.fda.gov/media/159382/download', 'Appendix 1: DTD v3.3, S. 21–46; Titel: Comprehensive Table of Contents Headings and Hierarchy v2.3.5'),
      overviewUrl: 'https://www.fda.gov/drugs/electronic-regulatory-submission-and-review/electronic-common-technical-document-ectd',
      reviewNote: 'eCTD v4.0 wird für bestimmte neue Anträge seit 16.09.2024 unterstützt. Seit 16.10.2026 können auch in v3.2.2 begonnene NDA, BLA, ANDA, IND und Master Files per Forward Compatibility in v4.0 fortgeführt werden. Hier wird die DTD-v3.3-Struktur gezeigt, kein v4.0-Modell.',
    },
    ca: {
      id: 'ca', label: 'Kanada (Health Canada)', flag: '🇨🇦', specVersion: 'Canadian M1 Schema v2.2', specDate: 'Heading-Referenz: Backbone Guide 2012', validationCriteria: 'eCTD Validation Rules v5.3',
      source: source('Creation of the Canadian Module 1 Backbone', CA_SPEC, 'Appendix B, Table 5, S. 19–21'),
      overviewUrl: 'https://www.canada.ca/en/health-canada/services/drugs-health-products/drug-products/applications-submissions/guidance-documents/ectd/notice-validation-rules-regulatory-transactions-submitted-health-canada-electronic-common-technical-document-format-2016-12-1.html',
      reviewNote: 'Nummern aus der veröffentlichten Schema-v2.2-Referenz. Aktuelle Verfahrensanforderungen zusätzlich mit Health Canada abstimmen.',
    },
    ch: {
      id: 'ch', label: 'Schweiz (Swissmedic)', flag: '🇨🇭', specVersion: 'Swiss M1 Specification (Titel: v1.5)', specDate: 'Dokumentrevision 1.6 · 18.07.2024', validationCriteria: 'Swiss eCTD Validation Criteria v1.5',
      source: source('Swiss Module 1 Specification for eCTD', CH_SPEC, 'Appendix 1, Table 4'),
      overviewUrl: 'https://www.swissmedic.ch/swissmedic/en/home/services/submissions/ectd.html',
      reviewNote: 'Das offiziell verlinkte PDF heißt im Titel v1.5; der Dokumentfuß nennt Revision 1.6 vom 18.07.2024. Laut Änderungshistorie brachte 1.6 ein neues Layout ohne inhaltliche Anpassungen.',
    },
    au: {
      id: 'au', label: 'Australien (TGA)', flag: '🇦🇺', specVersion: 'AU M1 Specification v3.2', specDate: 'v3.1 nur bis 31.10.2025 akzeptiert', validationCriteria: 'AU Validation Criteria v3.2',
      source: source('TGA AU Module 1 and regional information v3.2', AU_SPEC, 'Heading elements, Tabellen 6–17'),
      reviewNote: 'Alle 65 Einträge der Heading-Tabelle v3.2 erfasst und geprüft. Erforderliche Dokumente richten sich nach der TGA Document Matrix und dem Sequenztyp.',
    },
    jp: {
      id: 'jp', label: 'Japan (PMDA)', flag: '🇯🇵', specVersion: 'JP eCTD v4.0 · Package v1.6.0.3', specDate: 'JP CV 2026-06 · JP IG v1.6.0', validationCriteria: 'JP Check Items v1.6.0.0',
      source: source('PMDA eCTD v4 implementation package', 'https://www.pmda.go.jp/int-activities/int-harmony/ich/0092.html', 'Package v1.6.0.3: JP_CL4-context-of-use.gc_v4.xml'),
      packageUrl: 'https://www.pmda.go.jp/files/000280834.zip',
      reviewNote: 'Context-of-Use-Codes mit der offiziellen Genericode-Datei abgeglichen. Englische Titel stammen von PMDA; Themenübersetzungen sind redaktionell.',
    },
  };
  const raw = [];
  function row(id, topic, focus, definitions, parentId = null, note = '') {
    const regions = Object.fromEntries(Object.entries(definitions).map(([region, definition]) => {
      const [num, title] = definition.split('|');
      return [region, { num, title, unnumbered: !num, requirement: 'not-assessed', submissionTypes: [focus], reviewedAt: DATASET_META.lastReviewedAt, reviewStatus: region === 'uk' ? 'format-reference' : 'source-checked' }];
    }));
    raw.push({ id, topic, parentId, note, regions });
  }
  const euUk = (num, title) => ({ eu: `${num}|${title}`, uk: `${num}|${title}` });

  row('correspondence', 'Korrespondenz', 'admin', { ca: '1.0|Correspondence', au: '1.0|Correspondence' });
  row('cover-letter', 'Anschreiben / Cover Letter', 'admin', { ...euUk('1.0', 'Cover Letter'), us: '1.2|Cover Letters', ca: '1.0.1|Cover letter', ch: '1.0|Cover Letter', au: '1.0.1|Cover letter' });
  row('lifecycle-table', 'Lifecycle Management Table', 'admin', { ca: '1.0.2|Life Cycle Management Table', au: '1.0.2|Lifecycle management tracking table' }, 'correspondence');
  row('response-rfi-au', 'Antwort auf Informationsanfrage (AU)', 'admin', { au: '1.0.3|Response to Request for Information' }, 'correspondence');
  row('hc-correspondence-ca', 'Von Health Canada ausgestellte Korrespondenz (CA)', 'admin', { ca: '1.0.3|Copy of Health Canada issued correspondence' }, 'correspondence');
  row('solicited-information-ca', 'Angeforderte Informationen (CA)', 'admin', { ca: '1.0.4|Health Canada Solicited Information' }, 'correspondence');
  row('meeting-information-ca', 'Meeting-Informationen (CA)', 'admin', { ca: '1.0.5|Meeting Information' }, 'correspondence');
  row('reconsideration-ca', 'Unterlagen zur Überprüfungsanfrage (CA)', 'admin', { ca: '1.0.6|Request for Reconsideration Documentation' }, 'correspondence');
  row('note-to-reviewer-ca', 'Allgemeiner Hinweis an Gutachter (CA)', 'admin', { ca: '1.0.7|General Note to Reviewer' }, 'correspondence');
  row('table-of-contents', 'Inhaltsverzeichnis (JP)', 'admin', { jp: '1.1|table of contents' }, null, 'Ein index.xml ist kein einzureichendes Inhaltsverzeichnis-Dokument. Für EU/UK wird kein fiktiver 1.1-Ordner erzeugt.');
  row('administrative-information', 'Administrative Informationen', 'admin', { us: '1.3|Administrative Information', ca: '1.2|Administrative Information', au: '1.2|Administrative Information' });
  row('application-forms', 'Antragsformulare', 'admin', { ...euUk('1.2', 'Application Form'), us: '1.1|Forms', ca: '1.2.1|Application Forms', ch: '1.2.1|Form - Application', au: '1.2.1|Application forms', jp: '1.2|application form (copy)' });
  row('application-group-ch', 'Antrag / Änderung (CH)', 'admin', { ch: '1.2|Application for Marketing Authorisation and Variation' });
  row('additional-forms-ch', 'Weitere Formulare (CH)', 'admin', { ch: '1.2.2|Forms - Additional' }, 'application-group-ch');
  row('quality-annexes-ch', 'Anhänge zur Arzneimittelqualität (CH)', 'admin', { ch: '1.2.3|Annexes - Documents on Drug Quality' }, 'application-group-ch');
  row('manufacturing-annexes-ch', 'Anhänge zur Herstellung (CH)', 'admin', { ch: '1.2.4|Annexes - Manufacturing' }, 'application-group-ch');
  row('other-annexes-ch', 'Weitere Anhänge (CH)', 'admin', { ch: '1.2.5|Annexes - Others' }, 'application-group-ch');
  row('field-copy', 'Field Copy Certification', 'admin', { us: '1.3.2|Field Copy Certification' }, 'administrative-information');
  row('fee-forms', 'Fee Forms (Gebühren)', 'admin', { ca: '1.2.2|Fee Forms' }, 'administrative-information');
  row('patent-exclusivity', 'Patent & Exklusivität', 'admin', { us: '1.3.5|Patent and Exclusivity', ca: '1.2.4|Intellectual Property Information', au: '1.2.3|Patent certification', jp: '1.4|patent status' }, 'administrative-information', 'Thematische Zuordnung: Patentstatus, Zertifizierung und Exklusivität haben unterschiedliche rechtliche Bedeutungen.');
  row('debarment', 'Debarment Certification', 'admin', { us: '1.3.3|Debarment Certification' }, 'administrative-information');
  row('presubmission-details-au', 'Pre-submission-Angaben (AU)', 'admin', { au: '1.2.2|Pre-submission details' }, 'administrative-information');
  row('change-sponsor-au', 'Sponsorwechsel (AU)', 'admin', { au: '1.2.4|Change in sponsor' }, 'administrative-information');
  row('certification-forms-ca', 'Zertifizierungs- und Bestätigungsformulare (CA)', 'admin', { ca: '1.2.3|Certification and Attestation Forms' }, 'administrative-information');
  row('compliance-site-ca', 'Compliance- und Standortinformationen (CA)', 'admin', { ca: '1.2.5|Compliance and Site Information' }, 'administrative-information');
  row('financial-certification-us', 'Finanzielle Offenlegung (US)', 'admin', { us: '1.3.4|Financial Certification and Disclosure' }, 'administrative-information');
  row('priority-voucher-us', 'Priority Review Voucher (US)', 'admin', { us: '1.3.6|Tropical Disease Priority Review Voucher' }, 'administrative-information');
  row('certificates-jp', 'Bescheinigungen (JP)', 'admin', { jp: '1.3|certificates' });
  row('references-us', 'References (US)', 'admin', { us: '1.4|References' });
  row('letters-of-authorization', 'Letters of Authorization (LoA)', 'admin', { us: '1.4.1|Letter of Authorization' }, 'references-us');
  row('hc-summaries', 'Health Canada Summaries', 'clinical', { ca: '1.4|Health Canada Summaries' });
  row('pseat-cta', 'PSEAT-CTA (Kanada)', 'clinical', { ca: '1.4.1|PSEAT-CTA' }, 'hc-summaries');
  row('application-status', 'Application Status (US)', 'admin', { us: '1.5|Application Status' });
  row('meetings-us', 'Meetings (US)', 'admin', { us: '1.6|Meetings' });
  row('fast-track-us', 'Fast Track (US)', 'admin', { us: '1.7|Fast Track' });
  row('protocol-assessment', 'Special Protocol Assessment (US)', 'clinical', { us: '1.8|Special Protocol Assessment Request' });
  row('dispute-resolution', 'Dispute Resolution (US)', 'admin', { us: '1.10|Dispute Resolution' });
  row('information-amendment', 'Information Amendment (US)', 'admin', { us: '1.11|Information Amendment: Information Not Covered Under Modules 2 to 5' });
  row('other-correspondence', 'Other Correspondence (US)', 'admin', { us: '1.12|Other Correspondence' });
  row('annual-report', 'Jahresbericht / Annual Report (US)', 'safety', { us: '1.13|Annual Report' }, null, 'Annual Report, PSUR und PBRER sind keine gleichwertigen Verfahren.');
  row('product-information', 'Produktinformation (Labeling)', 'product', { ...euUk('1.3', 'Product Information'), us: '1.14|Labeling', ca: '1.3|Product Information', ch: '1.3|Product Information and Packaging Material', au: '1.3|Medicine information and labelling' });
  row('prescribing-information', 'SmPC / Product Monograph / PI', 'product', { ...euUk('1.3.1', 'SmPC, Labelling and Package Leaflet'), ca: '1.3.1|Product Monograph', ch: '1.3.1|Information for Professionals', au: '1.3.1|Product Information and package insert', jp: '1.8|package insert (draft)' }, 'product-information', 'Dokumentarten überschneiden sich thematisch; Umfang und Genehmigungsstatus sind regionsabhängig.');
  row('pi-clean-au', 'Product Information, bereinigt (AU)', 'product', { au: '1.3.1.1|Product Information -clean' }, 'prescribing-information');
  row('pi-annotated-au', 'Product Information, annotiert (AU)', 'product', { au: '1.3.1.2|Product Information - annotated' }, 'prescribing-information');
  row('pi-approved-au', 'Product Information, genehmigt (AU)', 'product', { au: '1.3.1.3|Product Information - approved' }, 'prescribing-information');
  row('insert-clean-au', 'Package Insert, bereinigt (AU)', 'product', { au: '1.3.1.4|Package insert - clean' }, 'prescribing-information');
  row('insert-annotated-au', 'Package Insert, annotiert (AU)', 'product', { au: '1.3.1.5|Package insert - annotated' }, 'prescribing-information');
  row('insert-approved-au', 'Package Insert, genehmigt (AU)', 'product', { au: '1.3.1.6|Package insert - approved' }, 'prescribing-information');
  row('draft-labeling-us', 'Draft Labeling (US)', 'product', { us: '1.14.1|Draft Labeling' }, 'product-information');
  row('final-labeling-us', 'Final Labeling (US)', 'product', { us: '1.14.2|Final Labeling' }, 'product-information');
  row('listed-drug-labeling-us', 'Listed Drug Labeling (US)', 'product', { us: '1.14.3|Listed Drug Labeling' }, 'product-information');
  row('investigational-labeling-us', 'Investigational Drug Labeling (US)', 'product', { us: '1.14.4|Investigational Drug Labeling' }, 'product-information');
  row('foreign-labeling-us', 'Foreign Labeling (US)', 'product', { us: '1.14.5|Foreign Labeling' }, 'product-information');
  row('labeling-2253-us', 'Labeling für 2253-Einreichungen (US)', 'product', { us: '1.14.6|Product Labeling for 2253 Submissions' }, 'product-information');
  row('labels', 'Labels (Etikettierung Mock-ups)', 'product', { ...euUk('1.3.2', 'Mock-up'), ca: '1.3.2|Inner and Outer Labels', ch: '1.3.3|Packaging Information', au: '1.3.3|Label mock-ups and specimens' }, 'product-information');
  row('mockup-clean-au', 'Label-Mock-ups, bereinigt (AU)', 'product', { au: '1.3.3.1|Label mock-ups and specimens - clean' }, 'labels');
  row('mockup-annotated-au', 'Label-Mock-ups, annotiert (AU)', 'product', { au: '1.3.3.2|Label mock-ups and specimens - annotated' }, 'labels');
  row('mockup-approved-au', 'Label-Mock-ups, genehmigt (AU)', 'product', { au: '1.3.3.3|Label mock-ups and specimens - approved' }, 'labels');
  row('patient-information', 'Patienteninformation / CMI', 'product', { ch: '1.3.2|Patient Information', au: '1.3.2|Consumer Medicine Information' }, 'product-information');
  row('cmi-clean-au', 'Consumer Medicine Information, bereinigt (AU)', 'product', { au: '1.3.2.1|Consumer Medicine Information - clean' }, 'patient-information');
  row('cmi-annotated-au', 'Consumer Medicine Information, annotiert (AU)', 'product', { au: '1.3.2.2|Consumer Medicine Information - annotated' }, 'patient-information');
  row('cmi-approved-au', 'Consumer Medicine Information, genehmigt (AU)', 'product', { au: '1.3.2.3|Consumer Medicine Information - approved' }, 'patient-information');
  row('specimen', 'Specimen (EU/UK)', 'product', euUk('1.3.3', 'Specimen'), 'product-information');
  row('patient-consultation', 'Konsultation mit Patientengruppen', 'product', euUk('1.3.4', 'Consultation with Target Patient Groups'), 'product-information');
  row('approved-pi-eu', 'Bereits genehmigte Produktinformation', 'product', euUk('1.3.5', 'Product Information already approved in the Member States'), 'product-information');
  row('braille', 'Braille (EU)', 'product', euUk('1.3.6', 'Braille'), 'product-information');
  row('foreign-labeling', 'Ausländische Produktinformation', 'product', { ca: '1.3.3|Non-Canadian Labelling', ch: '1.3.4|Information for Professionals from Other Countries', au: '1.11.2|Foreign Product Information' }, 'product-information');
  row('investigators-brochure-ca', 'Investigator\'s Brochure (CA)', 'product', { ca: '1.3.4|Investigator\'s Brochure' }, 'product-information');
  row('promotional-material', 'Promotional Material (US)', 'product', { us: '1.15|Promotional Material' });
  row('experts', 'Sachverständige / Experts', 'clinical', { ...euUk('1.4', 'Information about the Experts'), ch: '1.4|Information about the Expert', au: '1.4|Information about the experts' });
  row('quality-expert', 'Quality Expert', 'clinical', { ...euUk('1.4.1', 'Quality'), ch: '1.4.1|Quality', au: '1.4.1|Quality' }, 'experts');
  row('nonclinical-expert', 'Non-clinical Expert', 'clinical', { ...euUk('1.4.2', 'Non-Clinical'), ch: '1.4.2|Nonclinical', au: '1.4.2|Nonclinical' }, 'experts');
  row('clinical-expert', 'Clinical Expert', 'clinical', { ...euUk('1.4.3', 'Clinical'), ch: '1.4.3|Clinical', au: '1.4.3|Clinical' }, 'experts');
  row('special-requirements', 'Besondere Anforderungen / Special Requirements', 'clinical', { ...euUk('1.5', 'Specific Requirements for Different Types of Applications'), au: '1.5|Specific requirements for different types of applications' });
  row('bibliographical', 'Bibliografische Anträge', 'clinical', { ...euUk('1.5.1', 'Information for Bibliographical Applications'), au: '1.5.1|Literature-based submission documents' }, 'special-requirements');
  row('generics', 'Generika / Biosimilars', 'clinical', euUk('1.5.2', 'Information for Generic, ‘Hybrid’ or Bio-similar Applications'), 'special-requirements');
  row('data-exclusivity', 'Daten- / Marktexklusivität', 'clinical', euUk('1.5.3', '(Extended) Data/Market Exclusivity'), 'special-requirements');
  row('exceptional', 'Exceptional Circumstances', 'clinical', euUk('1.5.4', 'Exceptional Circumstances'), 'special-requirements');
  row('conditional-ma', 'Conditional Marketing Authorisation', 'clinical', euUk('1.5.5', 'Conditional Marketing Authorisation'), 'special-requirements');
  row('designation-au', 'Designation-Unterlagen (AU)', 'clinical', { au: '1.5.2|Designation applications - supporting documents' }, 'special-requirements');
  row('gmo-consents-au', 'GMO-Zustimmungen (AU)', 'clinical', { au: '1.5.3|Genetically modified organisms consents' }, 'special-requirements');
  row('trade-name-au', 'Erklärungen zu weiteren Handelsnamen (AU)', 'clinical', { au: '1.5.4|Additional trade name declarations' }, 'special-requirements');
  row('co-marketed-au', 'Erklärungen zu Co-Marketing (AU)', 'clinical', { au: '1.5.5|Co-marketed medicines declarations' }, 'special-requirements');
  row('combination-consent-au', 'Zustimmung zu Kombinationsarzneimitteln (AU)', 'clinical', { au: '1.5.6|Combination medicine consent' }, 'special-requirements');
  row('otc-assurances-au', 'OTC-Produktzusicherungen (AU)', 'clinical', { au: '1.5.7|OTC product assurances' }, 'special-requirements');
  row('umbrella-brand-au', 'Umbrella-Brand-Bewertung (AU)', 'clinical', { au: '1.5.8|Umbrella brand assessment' }, 'special-requirements');
  row('bioavailability-ch', 'Bioverfügbarkeit (CH)', 'clinical', { ch: '1.5|Data of Bioavailability Studies (Known Active Substance without Innovation)' });
  row('bioequivalence-ch', 'Bioäquivalenz-Nachweise (CH)', 'clinical', { ch: '1.5.1|Information according to Appendix IV of the Guideline on the Investigation on Bioequivalence' }, 'bioavailability-ch');
  row('reference-product-ch', 'Unterlagen zum Referenzprodukt (CH)', 'clinical', { ch: '1.5.2|Documents on the Reference Product' }, 'bioavailability-ch');
  row('environment', 'Umweltrisikoprüfung (ERA)', 'safety', { ...euUk('1.6', 'Environmental Risk Assessment'), ca: '1.5|Environmental Assessment Statement', ch: '1.6|Environmental Risk Assessment' });
  row('non-gmo', 'Non-GMO', 'safety', { ...euUk('1.6.1', 'Non-GMO'), ch: '1.6.1|Non-GMO' }, 'environment');
  row('gmo', 'GMO', 'safety', { ...euUk('1.6.2', 'GMO'), ch: '1.6.2|GMO' }, 'environment');
  row('orphan-exclusivity', 'Orphan Market Exclusivity', 'clinical', euUk('1.7', 'Information relating to Orphan Market Exclusivity'));
  row('similarity', 'Similarity', 'clinical', euUk('1.7.1', 'Similarity'), 'orphan-exclusivity');
  row('market-exclusivity', 'Market Exclusivity Claim', 'clinical', euUk('1.7.2', 'Market Exclusivity'), 'orphan-exclusivity');
  row('pharmacovigilance', 'Pharmakovigilanz / Risikomanagement', 'safety', { ...euUk('1.8', 'Information relating to Pharmacovigilance'), us: '1.16|Risk Management Plan', ca: '1.3.8|Pharmacovigilance Information', ch: '1.8|Information Relating to Pharmacovigilance', au: '1.8|Information relating to Pharmacovigilance' });
  row('pv-system', 'Pharmakovigilanzsystem', 'safety', { ...euUk('1.8.1', 'Pharmacovigilance System'), ch: '1.8.1|Pharmacovigilance System', au: '1.8.1|Pharmacovigilance systems' }, 'pharmacovigilance');
  row('risk-management', 'Risk Management Plan / System', 'safety', { ...euUk('1.8.2', 'Risk-management System'), ca: '1.3.8.2|Risk Management Plan', ch: '1.8.2|Risk-Management System', au: '1.8.2|Risk management plan -clean', jp: '1.11|risk management plan (draft)' }, 'pharmacovigilance');
  row('risk-management-non-rems-us', 'Risk Management ohne REMS (US)', 'safety', { us: '1.16.1|Risk Management (Non-REMS)' }, 'pharmacovigilance');
  row('rems', 'REMS (US)', 'safety', { us: '1.16.2|Risk Evaluation and Mitigation Strategy (REMS)' }, 'pharmacovigilance', 'REMS ist ein US-spezifisches Instrument und wird nicht als rechtlich gleichwertig mit einem EU-RMP eingestuft.');
  row('rmp-annotated-au', 'Risk Management Plan, annotiert (AU)', 'safety', { au: '1.8.3|Risk management plan -annotated' }, 'pharmacovigilance');
  row('rmp-approved-au', 'Risk Management Plan, genehmigt (AU)', 'safety', { au: '1.8.4|Risk management plan - approved' }, 'pharmacovigilance');
  row('annex-clean-au', 'Australian Specific Annex, bereinigt (AU)', 'safety', { au: '1.8.5|Australian Specific Annex - clean' }, 'pharmacovigilance');
  row('annex-annotated-au', 'Australian Specific Annex, annotiert (AU)', 'safety', { au: '1.8.6|Australian Specific Annex - annotated' }, 'pharmacovigilance');
  row('annex-approved-au', 'Australian Specific Annex, genehmigt (AU)', 'safety', { au: '1.8.7|Australian Specific Annex - approved' }, 'pharmacovigilance');
  row('other-rmp-au', 'Weitere RMP-Materialien (AU)', 'safety', { au: '1.8.8|Other RMP Materials' }, 'pharmacovigilance');
  row('postmarketing-studies', 'Postmarketing Studies (US)', 'safety', { us: '1.17|Postmarketing Studies' });
  row('paediatrics', 'Pädiatrie', 'clinical', { ...euUk('1.10', 'Information relating to Paediatrics'), us: '1.9|Pediatric Administrative Information', ch: '1.10|Information Relating to Paediatrics', au: '1.10|Information relating to paediatrics' });
  row('pediatric-waiver', 'Pädiatrische Waiver (US)', 'clinical', { us: '1.9.1|Request for Waiver of Pediatric Studies' }, 'paediatrics');
  row('clinical-trials-eu', 'Klinische Prüfungen', 'clinical', euUk('1.9', 'Information relating to Clinical Trials'));
  row('regional-clinical-ca', 'Regional Clinical Information (CA)', 'clinical', { ca: '1.6|Regional Clinical Information' });
  row('bioavailability-info-ca', 'Vergleichende Bioverfügbarkeit (CA)', 'clinical', { ca: '1.6.1|Comparative Bioavailability Information' }, 'regional-clinical-ca');
  row('core-data-sheets-ca', 'Company Core Data Sheets (CA)', 'clinical', { ca: '1.6.2|Company Core Data Sheets' }, 'regional-clinical-ca');
  row('priority-review-ca', 'Priority-Review-Anträge (CA)', 'clinical', { ca: '1.6.3|Priority Review Requests' }, 'regional-clinical-ca');
  row('notice-compliance-ca', 'Notice of Compliance with Conditions (CA)', 'clinical', { ca: '1.6.4|Notice of Compliance with Conditions' }, 'regional-clinical-ca');
  row('clinical-trials-ca', 'Clinical Trial Information (CA)', 'clinical', { ca: '1.7|Clinical Trial Information' });
  row('study-protocol-ca', 'Studienprotokoll (CA)', 'clinical', { ca: '1.7.1|Study Protocol' }, 'clinical-trials-ca', 'In Table 5 sind die XML-Elementnamen unter 1.7 um eine Stelle versetzt (1.7.1 = m1-7-2-study-protocol).');
  row('informed-consent-ca', 'Einwilligungsformulare (CA)', 'clinical', { ca: '1.7.2|Informed Consent Forms' }, 'clinical-trials-ca');
  row('reb-refusals-ca', 'Ablehnungen durch Ethikkommissionen (CA)', 'clinical', { ca: '1.7.3|Canadian Research Ethics Board (REB) Refusals' }, 'clinical-trials-ca');
  row('prior-applications-ca', 'Frühere verwandte Anträge (CA)', 'clinical', { ca: '1.7.4|Information on Prior-related Applications' }, 'clinical-trials-ca');
  row('proprietary-names', 'Proprietary Names (US)', 'product', { us: '1.18|Proprietary Names' });
  row('eua', 'Pre-EUA / EUA', 'admin', { us: '1.19|Pre-EUA and EUA' });
  row('investigational-plan', 'General Investigational Plan (Initial IND)', 'clinical', { us: '1.20|General Investigational Plan for Initial IND' });
  row('master-files-au', 'Master Files & Certificates (AU)', 'admin', { au: '1.6|Master files and certificates of suitability' });
  row('external-sources-au', 'Relevante externe Quellen (AU)', 'admin', { au: '1.6.1|Relevant external sources' }, 'master-files-au');
  row('applicant-declaration-au', 'Erklärung des Antragstellers (AU)', 'admin', { au: '1.6.2|Applicant\'s declaration' }, 'master-files-au');
  row('letters-of-access-au', 'Letters of Access (AU)', 'admin', { au: '1.6.3|Letters of access' }, 'master-files-au');
  row('presubmission-au', 'Pre-submission Compliance (AU)', 'admin', { au: '1.7|Compliance with meetings and pre-submission processes' });
  row('presub-outcomes-au', 'Einhaltung von Pre-submission-Ergebnissen (AU)', 'admin', { au: '1.7.1|Details of compliance with pre-submission meeting outcomes' }, 'presubmission-au');
  row('additional-data-au', 'Nachzureichende Daten (AU)', 'admin', { au: '1.7.2|Details of any additional data to be submitted' }, 'presubmission-au');
  row('planning-declaration-au', 'Erklärung zum Planungsformular (AU)', 'admin', { au: '1.7.3|Declaration of compliance with pre-submission planning form and planning letter' }, 'presubmission-au');
  row('biopharm-au', 'Biopharmazeutische Studien (AU)', 'clinical', { au: '1.9|Summary of biopharmaceutic studies' });
  row('ba-be-summary-au', 'BA-/BE-Studienzusammenfassung (AU)', 'clinical', { au: '1.9.1|Summary of bioavailability or bioequivalence study' }, 'biopharm-au');
  row('biopharm-justification-au', 'Begründung fehlender Biopharmazie-Studien (AU)', 'clinical', { au: '1.9.2|Justification for not providing biopharmaceutic studies' }, 'biopharm-au');
  row('foreign-regulatory-au', 'Ausländische regulatorische Informationen (AU)', 'admin', { au: '1.11|Foreign regulatory information' });
  row('foreign-status-au', 'Ausländischer Zulassungsstatus (AU)', 'admin', { au: '1.11.1|Foreign regulatory status' }, 'foreign-regulatory-au');
  row('data-similarities-au', 'Ähnlichkeiten und Unterschiede der Daten (AU)', 'admin', { au: '1.11.3|Data similarities and differences' }, 'foreign-regulatory-au');
  row('foreign-reports-au', 'Ausländische Beurteilungsberichte (AU)', 'admin', { au: '1.11.4|Foreign evaluation reports' }, 'foreign-regulatory-au');
  row('antibiotic-resistance-au', 'Antibiotikaresistenz-Daten (AU)', 'safety', { au: '1.12|Antibiotic resistance data' });
  row('foreign-decisions-ch', 'Entscheidungen ausländischer Behörden (CH)', 'admin', { ch: '1.7|Decisions of Foreign Authorities' });
  row('responses-loq-ch', 'Antworten auf LoQ ausländischer Behörden (CH)', 'admin', { ch: '1.7.1|Responses to LoQ' }, 'foreign-decisions-ch');
  row('assessment-report-ch', 'Beurteilungsbericht (CH)', 'admin', { ch: '1.7.2|Assessment Report' }, 'foreign-decisions-ch');
  row('eu-decision-ch', 'EU-Entscheidung (CH)', 'admin', { ch: '1.7.3|EU Decision' }, 'foreign-decisions-ch');
  row('fda-decision-ch', 'FDA-Entscheidung (CH)', 'admin', { ch: '1.7.4|FDA Decision' }, 'foreign-decisions-ch');
  row('other-decisions-ch', 'Entscheidungen anderer Behörden (CH)', 'admin', { ch: '1.7.5|Decisions of Other Foreign Authorities' }, 'foreign-decisions-ch');
  row('article-13-documents-ch', 'Zusatzunterlagen nach Art. 13 HMG (CH)', 'admin', { ch: '1.7.6|Article 13 TPA Additional Documentation' }, 'foreign-decisions-ch');
  row('article-14-documents-ch', 'Unterlagen nach Art. 14 Abs. 1 Bst. abis–quater HMG (CH)', 'admin', { ch: '1.12|Art 14 Sec 1 let abis-quater TPA Documents' });
  row('fast-track-ch', 'Fast Track Status Decision (CH)', 'admin', { ch: '1.9|Fast Track Status Decision' });
  row('orphan-decision-ch', 'Orphan Drug Status Decision (CH)', 'clinical', { ch: '1.11|Orphan Drug Status Decision' });
  row('development-jp', 'Entwicklungsgeschichte (JP)', 'clinical', { jp: '1.5|origin, discovery and development' });
  row('foreign-use-jp', 'Verwendung im Ausland (JP)', 'admin', { jp: '1.6|use in foreign countries' });
  row('related-products-jp', 'Vergleichbare Produkte (JP)', 'clinical', { jp: '1.7|list of related products' });
  row('nonproprietary-name-jp', 'Nicht geschützter Name (JP)', 'product', { jp: '1.9|documents concerning non-proprietary name' });
  row('poison-designation-jp', 'Einstufung als giftiger Stoff (JP)', 'safety', { jp: '1.10|data for review of designation as poisons, deleterious substances, etc.' });
  row('attached-documents-jp', 'Verzeichnis beigefügter Dokumente (JP)', 'admin', { jp: '1.12|list of attached documentation' });
  row('responses-eu', 'Antworten auf Fragen (EU/UK)', 'admin', euUk('', 'Responses to Questions'), null, 'Abschnitt ohne Nummer in der EU-Struktur.');
  row('additional-data-eu', 'Zusätzliche Daten (EU/UK)', 'admin', euUk('', 'Additional Data'), null, 'Abschnitt ohne Nummer in der EU-Struktur. MHRA verlangt hier für IRP-Anträge bestimmte Dokumente.');

  const ECTD_DATABASE = global.EctdCore.normalizeDatabase(raw, { regions: REGIONS });
  const regionalParents = {
    'cover-letter': { ca: 'correspondence', au: 'correspondence' },
    'application-forms': { ca: 'administrative-information', au: 'administrative-information', ch: 'application-group-ch' },
    'foreign-labeling': { au: 'foreign-regulatory-au' },
    'pharmacovigilance': { ca: 'product-information' },
  };
  ECTD_DATABASE.forEach(entry => {
    entry.regionalParentIds = regionalParents[entry.id] || {};
    if (entry.regions.jp) entry.regionalParentIds.jp = null;
  });
  global.EctdData = Object.freeze({ DATASET_META, SUBMISSION_TYPES: Object.freeze(SUBMISSION_TYPES), REGIONS: Object.freeze(REGIONS), ECTD_DATABASE: Object.freeze(ECTD_DATABASE) });
})(globalThis);
