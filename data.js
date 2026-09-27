/* ============================================
   eCTD Module 1 Checker — Data Layer
   ============================================
   Datenstand:
     EU:  EU Module 1 eCTD Specification v3.1.1
     UK:  MHRA eCTD Guidance (2025/2026)
     US:  FDA eCTD Module 1 v3.3 (DTD 3.3)
     CA:  Health Canada Regional DTD v2.2
     CH:  Swissmedic Module 1 Specification v1.5
     AU:  TGA eCTD Module 1 Specification v3.2
   ============================================ */

const DATASET_META = Object.freeze({
  version: "2026.09",
  lastReviewedAt: "2026-09-24",
  disclaimer: "Referenzhilfe – keine behördliche Validierung. Maßgeblich sind stets die aktuellen Vorgaben der zuständigen Behörde.",
});

const SUBMISSION_TYPES = {
  all:      { id: "all",      label: "Alle Abschnitte anzeigen" },
  initial:  { id: "initial",  label: "Erstantrag (Initial MAA / NDA / BLA / NDS)" },
  var_ia:   { id: "var_ia",   label: "Variation Typ IA" },
  var_ib:   { id: "var_ib",   label: "Variation Typ IB" },
  var_ii:   { id: "var_ii",   label: "Variation Typ II / Major Supplement / SNDS" },
  renewal:  { id: "renewal",  label: "Renewal / Verlängerung" },
  psur:     { id: "psur",     label: "PSUR / PBRER / Annual Report" },
};

const REGIONS = {
  eu: {
    id: "eu", label: "Modul 1 — EU (EMA)", flag: "🇪🇺",
    specVersion: "EU M1 Spec v3.1.1", specDate: "Mandatory ab 01.12.2025", validationCriteria: "Validation Criteria v8.2",
    source: { name: "EU eSubmission – Module 1", url: "https://esubmission.ema.europa.eu/eumodule1/index.htm", reviewedAt: DATASET_META.lastReviewedAt },
  },
  uk: {
    id: "uk", label: "Modul 1 — UK (MHRA)", flag: "🇬🇧",
    specVersion: "MHRA eCTD", specDate: "Aktuell gültig 2025/2026", validationCriteria: "MHRA Validator",
    source: { name: "MHRA eCTD Guidance", url: "https://www.gov.uk/government/publications/international-recognition-procedure/ectd-guidance-for-irp-mas-and-lifecycle", reviewedAt: DATASET_META.lastReviewedAt },
  },
  us: {
    id: "us", label: "Modul 1 — US (FDA)", flag: "🇺🇸",
    specVersion: "FDA M1 v3.3 / v4.0", specDate: "v4.0 akzeptiert seit 16.09.2024", validationCriteria: "FDA Technical Conformance Guide",
    source: { name: "FDA eCTD", url: "https://www.fda.gov/drugs/electronic-regulatory-submission-and-review/electronic-common-technical-document-ectd", reviewedAt: DATASET_META.lastReviewedAt },
  },
  ca: {
    id: "ca", label: "Modul 1 — Kanada (HC)", flag: "🇨🇦",
    specVersion: "HC Regional DTD v2.2", specDate: "Stand prüfen", validationCriteria: "HC Validation Rules v5.3",
    source: { name: "Health Canada eCTD", url: "https://www.canada.ca/en/health-canada/services/drugs-health-products/drug-products/applications-submissions/guidance-documents.html", reviewedAt: DATASET_META.lastReviewedAt },
  },
  ch: {
    id: "ch", label: "Modul 1 — Schweiz (SMC)", flag: "🇨🇭",
    specVersion: "Swiss Module 1 Spec v1.5", specDate: "Mandatory seit 01.04.2020", validationCriteria: "Swissmedic eCTD Validation",
    source: { name: "Swissmedic eCTD Documents", url: "https://www.swissmedic.ch/swissmedic/de/home/services/submissions/ectd/dokumentenhistorie.html", reviewedAt: DATASET_META.lastReviewedAt },
  },
  au: {
    id: "au", label: "Modul 1 — Australien (TGA)", flag: "🇦🇺",
    specVersion: "TGA eCTD M1 Spec v3.2", specDate: "Mandatory seit 01.11.2025", validationCriteria: "TGA Validation Criteria v3.2",
    source: { name: "TGA eCTD AU Module 1 v3.2", url: "https://www.tga.gov.au/resources/resources/user-guide/ectd-au-module-1-and-regional-information-v32", reviewedAt: DATASET_META.lastReviewedAt },
  },
  jp: {
    id: "jp", label: "Modul 1 — Japan (PMDA)", flag: "🇯🇵",
    specVersion: "PMDA eCTD v4.0", specDate: "Aktueller Implementierungsstand", validationCriteria: "PMDA eCTD v4 Check Items",
    source: { name: "PMDA eCTD v4 Implementation Package", url: "https://www.pmda.go.jp/int-activities/int-harmony/ich/0092.html", reviewedAt: DATASET_META.lastReviewedAt },
  },
};

const RAW_ECTD_DATABASE = [
  // ==========================================
  // CORRESPONDENCE / COVER LETTER
  // ==========================================
  {
    topic: "Anschreiben / Cover Letter",
    level: 0,
    regions: {
      eu: { num: "1.0", title: "Cover Letter" },
      uk: { num: "1.0", title: "Cover Letter" },
      us: { num: "1.2", title: "Cover Letter" },
      ca: { num: "1.0", title: "Correspondence" },
      ch: { num: "1.0", title: "Cover Letter" },
      au: { num: "1.0", title: "Correspondence" },
      jp: { num: "1.0", title: "Cover Letter" },
    },
    requirement: "mandatory",
    submissionTypes: ["initial", "var_ia", "var_ib", "var_ii", "renewal", "psur"],
    documents: [
      { name: "Cover Letter", format: "PDF", note: "Searchable PDF" }
    ],
    links: [
      { name: "EMA Cover Letter Template", url: "https://www.ema.europa.eu/en/human-regulatory/research-development/submissions" },
      { name: "FDA Cover Letter Guidance", url: "https://www.fda.gov/drugs/electronic-regulatory-submission-and-review" },
      { name: "TGA Cover Letter Info", url: "https://www.tga.gov.au/how-we-regulate/manufacturing/manufacture-prescription-medicines/australian-regulatory-guidelines-prescription-medicines-argpm" }
    ],
  },
  {
    topic: "Lifecycle Management Table",
    level: 1,
    regions: {
      ca: { num: "1.0.1", title: "Life Cycle Management" },
      au: { num: "1.0.2", title: "Lifecycle management tracking table" },
    },
    requirement: "conditional",
    submissionTypes: ["var_ia", "var_ib", "var_ii", "renewal"],
  },

  // ==========================================
  // TABLE OF CONTENTS
  // ==========================================
  {
    topic: "Inhaltsverzeichnis",
    level: 0,
    regions: {
      eu: { num: "1.1", title: "Comprehensive Table of Contents" },
      uk: { num: "1.1", title: "Comprehensive Table of Contents" },
      ch: { num: "1.1", title: "Comprehensive Table of Contents" },
      jp: { num: "1.1", title: "Table of Contents" },
    },
    requirement: "mandatory",
    submissionTypes: ["initial", "var_ia", "var_ib", "var_ii", "renewal", "psur"],
    documents: [
      { name: "index.xml", format: "XML", note: "eCTD Backbone" }
    ],
    note: "US/CA/AU steuern dies rein über das XML-Backbone, ohne sichtbaren 1.1 Ordner.",
  },

  // ==========================================
  // FORMULARE
  // ==========================================
  {
    topic: "Antragsformulare",
    level: 0,
    regions: {
      eu: { num: "1.2", title: "Application Form" },
      uk: { num: "1.2", title: "Application Form" },
      us: { num: "1.1", title: "Forms" },
      ca: { num: "1.1", title: "Forms" },
      ch: { num: "1.2", title: "Form" },
      au: { num: "1.2", title: "Application" },
      jp: { num: "1.2", title: "Application Form (申請書)" },
    },
    requirement: "mandatory",
    submissionTypes: ["initial", "var_ia", "var_ib", "var_ii", "renewal"],
    documents: [
      { name: "Application Form", format: "PDF", note: "eAF (EU), Form 356h (US), 3011 (CA)" }
    ],
    links: [
      { name: "EMA eAF Portal", url: "https://esubmission.ema.europa.eu/eaf/" },
      { name: "FDA Form 356h", url: "https://www.fda.gov/about-fda/reports-manuals-forms/forms" },
      { name: "HC SC 3011 Form", url: "https://www.canada.ca/en/health-canada/services/drugs-health-products/drug-products/applications-submissions/forms.html" }
    ],
  },
  {
    topic: "Field Copy Certification",
    level: 1,
    regions: {
      us: { num: "1.1.2", title: "Field Copy Certification" },
    },
    requirement: "conditional",
    submissionTypes: ["initial"],
  },
  
  // ==========================================
  // ADMINISTRATIVE INFO (US/CA/AU)
  // ==========================================
  {
    topic: "Administrative Informationen",
    level: 0,
    regions: {
      us: { num: "1.3", title: "Administrative Information" },
      ca: { num: "1.2", title: "Administrative Information" },
    },
    requirement: "mandatory",
    submissionTypes: ["initial", "var_ii"],
    note: "EU/UK/CH inkludieren dies größtenteils im Antragsformular 1.2.",
  },
  {
    topic: "Fee Forms (Gebühren)",
    level: 1,
    regions: {
      ca: { num: "1.2.2", title: "Fee Forms" },
    },
    requirement: "mandatory",
    submissionTypes: ["initial", "var_ii"],
  },
  {
    topic: "Patent & Exklusivität",
    level: 1,
    regions: {
      us: { num: "1.3.5", title: "Patent and Exclusivity" },
      ca: { num: "1.2.4", title: "Patent and Data Protection" },
      au: { num: "1.2.2", title: "Patent Information" },
    },
    requirement: "conditional",
    submissionTypes: ["initial"],
  },
  {
    topic: "Debarment Certification",
    level: 1,
    regions: {
      us: { num: "1.3.3", title: "Debarment Certification" },
    },
    requirement: "mandatory",
    submissionTypes: ["initial"],
  },

  // ==========================================
  // FDA SPECIFIC: 1.4 - 1.13
  // ==========================================
  {
    topic: "References (US) / HC Summaries (CA)",
    level: 0,
    regions: {
      us: { num: "1.4", title: "References" },
      ca: { num: "1.4", title: "Health Canada Summaries" },
    },
    requirement: "conditional",
    submissionTypes: ["initial"],
  },
  {
    topic: "Letters of Authorization (LoA)",
    level: 1,
    regions: {
      us: { num: "1.4.1", title: "Letters of Authorization" },
    },
    requirement: "conditional",
    submissionTypes: ["initial"],
  },
  {
    topic: "PSEAT-CTA (Kanada)",
    level: 1,
    regions: {
      ca: { num: "1.4.1", title: "PSEAT-CTA" },
    },
    requirement: "conditional",
    submissionTypes: ["initial"],
  },
  {
    topic: "US Meetings & Fast Track",
    level: 0,
    regions: {
      us: { num: "1.6", title: "Meetings" },
    },
    requirement: "conditional",
    submissionTypes: ["initial"],
    note: "US 1.6 Meetings, US 1.7 Fast Track / Breakthrough Therapy.",
  },
  {
    topic: "Fast Track / Breakthrough Therapy",
    level: 1,
    regions: {
      us: { num: "1.7", title: "Fast Track" },
    },
    requirement: "conditional",
    submissionTypes: ["initial"],
  },

  // ==========================================
  // PEDIATRICS
  // ==========================================
  {
    topic: "Pädiatrie",
    level: 0,
    regions: {
      eu: { num: "1.10", title: "Paediatrics" },
      uk: { num: "1.10", title: "Paediatrics" },
      us: { num: "1.9", title: "Pediatric Administrative Information" },
    },
    requirement: "conditional",
    submissionTypes: ["initial", "var_ii"],
    links: [
      { name: "EMA PIP Guidance", url: "https://www.ema.europa.eu/en/human-regulatory/research-development/paediatric-medicines/paediatric-investigation-plans" }
    ],
  },
  {
    topic: "Waivers & Deferrals",
    level: 1,
    regions: {
      us: { num: "1.9.1", title: "Request for Waiver" },
    },
    requirement: "conditional",
    submissionTypes: ["initial"],
  },

  // ==========================================
  // PRODUKTINFORMATION (SmPC / Labeling)
  // ==========================================
  {
    topic: "Produktinformation (Labeling)",
    level: 0,
    regions: {
      eu: { num: "1.3", title: "Product Information" },
      uk: { num: "1.3", title: "Product Information" },
      us: { num: "1.14", title: "Labeling" },
      ca: { num: "1.3", title: "Product Information" },
      ch: { num: "1.3", title: "Product Information" },
      au: { num: "1.3", title: "Medicine Information and Labelling" },
      jp: { num: "1.3", title: "Product Information (添付文書)" },
    },
    requirement: "mandatory",
    submissionTypes: ["initial", "var_ib", "var_ii", "renewal"],
  },
  {
    topic: "SmPC / Product Monograph / PI",
    level: 1,
    regions: {
      eu: { num: "1.3.1", title: "SPC, Labelling and Package Leaflet" },
      uk: { num: "1.3.1", title: "Product Information" },
      us: { num: "1.14.1", title: "Draft Labeling" },
      ca: { num: "1.3.1", title: "Product Monograph" },
      ch: { num: "1.3.1", title: "Information for Professionals / Patient Info" },
      au: { num: "1.3.1", title: "Product Information (PI)" },
      jp: { num: "1.3.1", title: "Package Insert (添付文書案)" },
    },
    requirement: "mandatory",
    submissionTypes: ["initial", "var_ib", "var_ii"],
    documents: [
      { name: "Clean Word Document", format: "DOCX" },
      { name: "PDF Format (SPL in US)", format: "PDF/XML" }
    ],
    links: [
      { name: "EMA QRD Templates", url: "https://www.ema.europa.eu/en/human-regulatory/marketing-authorisation/product-information/quality-review-documents-qrd-templates" },
      { name: "HC Product Monograph", url: "https://www.canada.ca/en/health-canada/services/drugs-health-products/drug-products/applications-submissions/guidance-documents/product-monograph.html" }
    ],
  },
  {
    topic: "Labels (Etikettierung Mock-ups)",
    level: 1,
    regions: {
      eu: { num: "1.3.2", title: "Mock-Up" },
      uk: { num: "1.3.2", title: "Mock-Up" },
      us: { num: "1.14.2", title: "Final Labeling" },
      ca: { num: "1.3.2", title: "Inner and Outer Labels" },
      ch: { num: "1.3.2", title: "Mock-up" },
      au: { num: "1.3.4", title: "Label Mock-ups" },
    },
    requirement: "conditional",
    submissionTypes: ["initial", "var_ii"],
  },

  // ==========================================
  // EXPERTS / SACHVERSTÄNDIGE
  // ==========================================
  {
    topic: "Sachverständige / Experts",
    level: 0,
    regions: {
      eu: { num: "1.4", title: "Information about the Experts" },
      uk: { num: "1.4", title: "Information about the Experts" },
      ch: { num: "1.4", title: "Information about the Experts" },
      au: { num: "1.4", title: "Information about the Experts" },
      jp: { num: "1.4", title: "Expert Information" },
    },
    requirement: "mandatory",
    submissionTypes: ["initial"],
  },
  {
    topic: "Quality Expert",
    level: 1,
    regions: {
      eu: { num: "1.4.1", title: "Quality" },
      ch: { num: "1.4.1", title: "Quality" },
      au: { num: "1.4.1", title: "Quality" },
    },
    requirement: "mandatory",
    submissionTypes: ["initial"],
    documents: [
      { name: "Expert CV", format: "PDF" },
      { name: "Expert Declaration", format: "PDF", note: "Signed" }
    ],
  },

  // ==========================================
  // ENVIRONMENTAL RISK ASSESSMENT
  // ==========================================
  {
    topic: "Umweltrisikoprüfung (ERA)",
    level: 0,
    regions: {
      eu: { num: "1.6", title: "Environmental Risk Assessment" },
      uk: { num: "1.6", title: "Environmental Risk Assessment" },
      ca: { num: "1.5", title: "Environmental Assessment Statement" },
    },
    requirement: "mandatory",
    submissionTypes: ["initial"],
    links: [
      { name: "EMA ERA Guideline", url: "https://www.ema.europa.eu/en/environmental-risk-assessment-medicinal-products-human-use-scientific-guideline" }
    ],
  },

  // ==========================================
  // ORPHAN DRUGS
  // ==========================================
  {
    topic: "Orphan Market Exclusivity",
    level: 0,
    regions: {
      eu: { num: "1.7", title: "Orphan Market Exclusivity" },
      uk: { num: "1.7", title: "Orphan Market Exclusivity" },
      au: { num: "1.5", title: "Orphan Drug Designation" },
    },
    requirement: "conditional",
    submissionTypes: ["initial"],
  },
  {
    topic: "Similarity",
    level: 1,
    regions: {
      eu: { num: "1.7.1", title: "Similarity" },
      uk: { num: "1.7.1", title: "Similarity" },
    },
    requirement: "conditional",
    submissionTypes: ["initial"],
  },
  {
    topic: "Market Exclusivity Claim",
    level: 1,
    regions: {
      eu: { num: "1.7.2", title: "Market Exclusivity" },
      uk: { num: "1.7.2", title: "Market Exclusivity" },
    },
    requirement: "conditional",
    submissionTypes: ["initial"],
  },

  // ==========================================
  // PHARMACOVIGILANCE / REMS
  // ==========================================
  {
    topic: "Pharmakovigilanz / Risikomanagement",
    level: 0,
    regions: {
      eu: { num: "1.8", title: "Pharmacovigilance" },
      uk: { num: "1.8", title: "Pharmacovigilance" },
      us: { num: "1.16", title: "Risk Management Plans" },
      ch: { num: "1.8", title: "Pharmacovigilance" },
      jp: { num: "1.5", title: "Risk Management Plan" },
    },
    requirement: "mandatory",
    submissionTypes: ["initial", "var_ii", "renewal", "psur"],
    links: [
      { name: "FDA REMS Guidance", url: "https://www.fda.gov/drugs/drug-safety-and-availability/risk-evaluation-and-mitigation-strategies-rems" },
      { name: "EMA GVP Guidelines", url: "https://www.ema.europa.eu/en/human-regulatory/post-authorisation/pharmacovigilance/good-pharmacovigilance-practices" }
    ],
  },
  {
    topic: "Pharmacovigilance System Master File (PSMF)",
    level: 1,
    regions: {
      eu: { num: "1.8.1", title: "Pharmacovigilance System" },
      uk: { num: "1.8.1", title: "Pharmacovigilance System" },
      ch: { num: "1.8.1", title: "Pharmacovigilance System" },
    },
    requirement: "mandatory",
    submissionTypes: ["initial"],
  },
  {
    topic: "Risk Management Plan (RMP) / REMS",
    level: 1,
    regions: {
      eu: { num: "1.8.2", title: "Risk Management Plan" },
      uk: { num: "1.8.2", title: "Risk Management Plan" },
      us: { num: "1.16.2", title: "Risk Evaluation and Mitigation Strategy (REMS)" },
      ch: { num: "1.8.2", title: "Risk Management Plan" },
    },
    requirement: "mandatory",
    submissionTypes: ["initial", "var_ii"],
    documents: [
      { name: "RMP Document", format: "PDF" }
    ],
  },

  // ==========================================
  // POSTMARKETING & PROMOTIONAL (US)
  // ==========================================
  {
    topic: "Promotional Material (Werbung)",
    level: 0,
    regions: {
      us: { num: "1.15", title: "Promotional Material" },
    },
    requirement: "conditional",
    submissionTypes: ["initial", "var_ii"],
    documents: [
      { name: "Draft Promotional Material", format: "PDF" }
    ],
  },
  {
    topic: "Postmarketing Studies",
    level: 0,
    regions: {
      us: { num: "1.17", title: "Postmarketing Studies" },
    },
    requirement: "conditional",
    submissionTypes: ["psur", "var_ii"],
  },

  // ==========================================
  // ANNUAL REPORT / PSUR
  // ==========================================
  {
    topic: "Jahresbericht / Annual Report",
    level: 0,
    regions: {
      us: { num: "1.13", title: "Annual Report" },
    },
    requirement: "mandatory",
    submissionTypes: ["psur"],
  },
  
  // ==========================================
  // REGIONAL CLINICAL INFO (CA)
  // ==========================================
  {
    topic: "Regional Clinical Information (CA)",
    level: 0,
    regions: {
      ca: { num: "1.6", title: "Regional Clinical Information" },
    },
    requirement: "conditional",
    submissionTypes: ["initial"],
  },
  {
    topic: "Clinical Trial Information",
    level: 0,
    regions: {
      ca: { num: "1.7", title: "Clinical Trial Information" },
    },
    requirement: "conditional",
    submissionTypes: ["initial"],
  },

  // ==========================================
  // ADDITIONAL FDA SECTIONS
  // ==========================================
  {
    topic: "Clinical Pharmacology (Biopharm.)",
    level: 0,
    regions: {
      us: { num: "1.5", title: "Clinical Pharmacology Biopharmaceutics" },
    },
    requirement: "conditional",
    submissionTypes: ["initial"],
  },
  {
    topic: "IND Safety Reports",
    level: 0,
    regions: {
      us: { num: "1.8", title: "IND Safety Reports" },
    },
    requirement: "conditional",
    submissionTypes: ["initial"],
  },
  {
    topic: "General Investigational Plan",
    level: 0,
    regions: {
      us: { num: "1.10", title: "General Investigational Plan" },
    },
    requirement: "conditional",
    submissionTypes: ["initial"],
  },
  {
    topic: "Information Amendment",
    level: 0,
    regions: {
      us: { num: "1.11", title: "Information Amendment" },
    },
    requirement: "conditional",
    submissionTypes: ["var_ii"],
  },
  {
    topic: "Other Correspondence",
    level: 0,
    regions: {
      us: { num: "1.12", title: "Other Correspondence" },
    },
    requirement: "conditional",
    submissionTypes: ["initial", "var_ii"],
  },
  {
    topic: "Proprietary Name Review",
    level: 0,
    regions: {
      us: { num: "1.18", title: "Proprietary Names" },
    },
    requirement: "conditional",
    submissionTypes: ["initial"],
    links: [
      { name: "FDA Proprietary Name Review", url: "https://www.fda.gov/drugs/drug-approvals-and-databases/drugpatent-and-exclusivity" }
    ],
  },
  {
    topic: "Pre-EUA / EUA",
    level: 0,
    regions: {
      us: { num: "1.19", title: "Pre-EUA and EUA" },
    },
    requirement: "conditional",
    submissionTypes: ["initial"],
    note: "Emergency Use Authorization — nur bei Notfallzulassungen relevant.",
  },
  {
    topic: "Investigational Plan (IND)",
    level: 0,
    regions: {
      us: { num: "1.20", title: "General Investigational Plan" },
    },
    requirement: "conditional",
    submissionTypes: ["initial"],
  },

  // ==========================================
  // AU SPECIFIC SECTIONS
  // ==========================================
  {
    topic: "Consumer Medicine Information (CMI)",
    level: 1,
    regions: {
      au: { num: "1.3.2", title: "Consumer Medicine Information (CMI)" },
    },
    requirement: "mandatory",
    submissionTypes: ["initial", "var_ii"],
    documents: [
      { name: "CMI Clean", format: "PDF" },
      { name: "CMI Annotated", format: "PDF", note: "Nur bei Variations" }
    ],
    links: [
      { name: "TGA CMI Guidelines", url: "https://www.tga.gov.au/how-we-regulate/supply-therapeutic-good/supply-prescription-medicine/consumer-medicine-information" }
    ],
  },
  {
    topic: "Non-Canadian Labelling",
    level: 1,
    regions: {
      ca: { num: "1.3.3", title: "Non-Canadian Labelling" },
    },
    requirement: "conditional",
    submissionTypes: ["initial"],
  },
  {
    topic: "Braille (EU)",
    level: 1,
    regions: {
      eu: { num: "1.3.3", title: "Braille" },
      uk: { num: "1.3.3", title: "Braille" },
    },
    requirement: "mandatory",
    submissionTypes: ["initial"],
    documents: [
      { name: "Braille Certification", format: "PDF" }
    ],
  },

  // ==========================================
  // KLINISCHE PRÜFUNGEN (EU / UK)
  // ==========================================
  {
    topic: "Klinische Prüfungen",
    level: 0,
    regions: {
      eu: { num: "1.9", title: "Information relating to Clinical Trials" },
      uk: { num: "1.9", title: "Information relating to Clinical Trials" },
    },
    requirement: "conditional",
    submissionTypes: ["initial"],
  },

  // ==========================================
  // BESONDERE ANFORDERUNGEN (EU/UK/CH)
  // ==========================================
  {
    topic: "Generika / Bibliografisch",
    level: 1,
    regions: {
      eu: { num: "1.5.1", title: "Generic / Hybrid / Bio-similar" },
      uk: { num: "1.5.1", title: "Generic / Hybrid / Bio-similar" },
      ch: { num: "1.5.1", title: "Generic / Biosimilar" },
    },
    requirement: "conditional",
    submissionTypes: ["initial"],
  },
  {
    topic: "Conditional / Exceptional MA",
    level: 1,
    regions: {
      eu: { num: "1.5.2", title: "Conditional / Exceptional MA" },
      uk: { num: "1.5.2", title: "Conditional / Exceptional MA" },
    },
    requirement: "conditional",
    submissionTypes: ["initial"],
  },

  // ==========================================
  // EXPERTS (Remaining subsections)
  // ==========================================
  {
    topic: "Non-clinical Expert",
    level: 1,
    regions: {
      eu: { num: "1.4.2", title: "Non-clinical" },
      ch: { num: "1.4.2", title: "Non-clinical" },
      au: { num: "1.4.2", title: "Non-clinical" },
    },
    requirement: "mandatory",
    submissionTypes: ["initial"],
    documents: [
      { name: "Expert CV", format: "PDF" },
      { name: "Expert Declaration", format: "PDF", note: "Signed" }
    ],
  },
  {
    topic: "Clinical Expert",
    level: 1,
    regions: {
      eu: { num: "1.4.3", title: "Clinical" },
      ch: { num: "1.4.3", title: "Clinical" },
      au: { num: "1.4.3", title: "Clinical" },
    },
    requirement: "mandatory",
    submissionTypes: ["initial"],
    documents: [
      { name: "Expert CV", format: "PDF" },
      { name: "Expert Declaration", format: "PDF", note: "Signed" }
    ],
  },

  // ==========================================
  // JAPAN (PMDA) SPECIFIC SECTIONS
  // ==========================================
  {
    topic: "Ähnliche Produkte / Similar Products (JP)",
    level: 0,
    regions: {
      jp: { num: "1.12", title: "List of Similar Products (類似品目一覧)" },
    },
    requirement: "conditional",
    submissionTypes: ["initial"],
    note: "Japan-spezifisch: Liste vergleichbarer zugelassener Produkte.",
  },
  {
    topic: "Ausländische klinische Daten (JP)",
    level: 0,
    regions: {
      jp: { num: "1.13", title: "Foreign Clinical Data (外国臨床試験)" },
    },
    requirement: "conditional",
    submissionTypes: ["initial"],
    note: "Japan-spezifisch: Informationen zur Verwendung ausländischer klinischer Daten (ICH E5 Bridging).",
    links: [
      { name: "ICH E5 Guideline", url: "https://www.ich.org/page/efficacy-guidelines" }
    ],
  },
  {
    topic: "Patent Information (JP)",
    level: 0,
    regions: {
      jp: { num: "1.10", title: "Patent Information (特許)" },
    },
    requirement: "conditional",
    submissionTypes: ["initial"],
  },
  {
    topic: "Re-examination Period (JP)",
    level: 0,
    regions: {
      jp: { num: "1.11", title: "Re-examination Period Request (再審査期間)" },
    },
    requirement: "conditional",
    submissionTypes: ["initial"],
    note: "Japan-spezifisch: Antrag auf Re-examination Period (entspricht teilweise der Marktexklusivität).",
  },
];

// Logical groups are explicit and independent of array order or active filters.
const VIRTUAL_GROUPS = [
  {
    id: "special-requirements",
    topic: "Besondere Anforderungen / Special Requirements",
    regions: {
      eu: { num: "1.5", title: "Specific Requirements for Different Types of Applications" },
      uk: { num: "1.5", title: "Specific Requirements for Different Types of Applications" },
      ch: { num: "1.5", title: "Specific Requirements" },
    },
    requirement: "conditional",
    submissionTypes: ["initial"],
  },
];

const PARENT_BY_TOPIC = Object.freeze({
  "Lifecycle Management Table": "Anschreiben / Cover Letter",
  "Field Copy Certification": "Antragsformulare",
  "Fee Forms (Gebühren)": "Administrative Informationen",
  "Patent & Exklusivität": "Administrative Informationen",
  "Debarment Certification": "Administrative Informationen",
  "Letters of Authorization (LoA)": "References (US) / HC Summaries (CA)",
  "PSEAT-CTA (Kanada)": "References (US) / HC Summaries (CA)",
  "Fast Track / Breakthrough Therapy": "US Meetings & Fast Track",
  "Waivers & Deferrals": "Pädiatrie",
  "SmPC / Product Monograph / PI": "Produktinformation (Labeling)",
  "Labels (Etikettierung Mock-ups)": "Produktinformation (Labeling)",
  "Consumer Medicine Information (CMI)": "Produktinformation (Labeling)",
  "Non-Canadian Labelling": "Produktinformation (Labeling)",
  "Braille (EU)": "Produktinformation (Labeling)",
  "Quality Expert": "Sachverständige / Experts",
  "Non-clinical Expert": "Sachverständige / Experts",
  "Clinical Expert": "Sachverständige / Experts",
  "Similarity": "Orphan Market Exclusivity",
  "Market Exclusivity Claim": "Orphan Market Exclusivity",
  "Pharmacovigilance System Master File (PSMF)": "Pharmakovigilanz / Risikomanagement",
  "Risk Management Plan (RMP) / REMS": "Pharmakovigilanz / Risikomanagement",
  "Generika / Bibliografisch": "Besondere Anforderungen / Special Requirements",
  "Conditional / Exceptional MA": "Besondere Anforderungen / Special Requirements",
});

// A logical topic can sit under a different regulatory parent in a specific region.
const PARENT_BY_REGION = Object.freeze({
  "Patent & Exklusivität": { au: "Antragsformulare" },
});

const ECTD_DATABASE = EctdCore.normalizeDatabase(
  [...RAW_ECTD_DATABASE, ...VIRTUAL_GROUPS],
  { regions: REGIONS, parentByTopic: PARENT_BY_TOPIC, parentByRegion: PARENT_BY_REGION }
);

globalThis.EctdData = Object.freeze({
  DATASET_META,
  SUBMISSION_TYPES: Object.freeze(SUBMISSION_TYPES),
  REGIONS: Object.freeze(REGIONS),
  ECTD_DATABASE: Object.freeze(ECTD_DATABASE),
});
