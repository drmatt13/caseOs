// Hardcoded demo workspace simulating a real case as it would exist in the
// database: typed CaseRecords, GraphLinks between them, CaseDocuments with
// document records extracted from them, and a CaseContext.
//
// Demonstrates every part of the domain model:
//  - records at every level of RECORD_LEVEL (objective → document)
//  - PROPOSED / ACCEPTED / PENDING_REPLACEMENT / REPLACED lifecycles
//  - completed replacements (posture-003 → posture-002, fact-old-entry-vague
//    → fact-014, docrec-discovery-gaps-v0 → docrec-discovery-gaps) and pending
//    ones, plus many-to-many version history: a 1→2 SPLIT
//    (fact-habitability-broad → mold + heat) and a 2→1 MERGE
//    (fact-payment-raft-only + direct-only → fact-payment-cured)
//  - every multi-page source file split into several DOCUMENT records, each a
//    section/exhibit (e.g. the affidavit → seven §-records), with some still
//    PROPOSED (newly extracted, awaiting review)
//  - PERSON records referenced through INVOLVES links
//
// Link statuses are normalized at build time: an ACCEPTED link can only exist
// between two authoritative endpoints, so accepted records never surface a link
// into a proposed record.

import type { CaseContext } from "#/types/caseContext";
import type {
  CaseDocument,
  GraphLink,
  LinkStrength,
  LinkStatus,
  RecordLinkType,
  RecordStatus,
  RecordType,
  TypedCaseRecord,
} from "#/types/caseRecords";
import type { CaseDemo } from "#/demo/caseDemoTypes";

export const demoUserId = "5bdbb6c2-877a-4772-ad9e-00a10d6073b5";
export const DEMO_WORKSPACE_ID = "11111111-1111-4111-8111-111111111111";
export const DEMO_CASE_ID = "case-faxon-commons-demo";

// Workspace-level display metadata. Quantified vitals are derived from the graph.
export const demoCase = {
  id: DEMO_CASE_ID,
  title: "Faxon Commons v. Sweeney",
  court: "Massachusetts Housing Court, Metro South Division",
  caseNumber: "25H82SP02904",
  client: "Matthew Sweeney",
};

export const demoCaseContext: CaseContext = {
  id: "context-faxon-commons",
  workspaceId: DEMO_WORKSPACE_ID,
  caseId: DEMO_CASE_ID,
  sourceIntakeId: "case-intake-faxon-commons-001",
  version: 3,
  caseName: "Faxon Commons v. Sweeney",
  caseNumberOrDocket: "25H82SP02904",
  jurisdictionOrCourt: "Massachusetts Housing Court, Metro South Division",
  practiceArea: "landlord_tenant",
  representation: {
    clientRole: "defendant",
    representationRole: "other",
    representedPartyName: "Matthew Sweeney",
  },
  objectives: {
    ours: "Defeat or materially reduce possession and money claims while proving habitability, quiet enjoyment, mitigation, and c. 93A counterclaims.",
    theirs:
      "Keep the case narrow as straightforward nonpayment, obtain possession and a money judgment, and avoid discovery that expands the case.",
    desiredOutcome:
      "Defense verdict or materially reduced recovery, recognition of counterclaims, and a finding that the case cannot fairly be reduced to unpaid rent alone.",
    biggestCurrentRisk:
      "Plaintiffs may compress the story into nonpayment while key discovery remains missing.",
  },
  claims: {
    dispute:
      "Residential summary process eviction that Defendants contend also involves habitability, unauthorized entry, quiet enjoyment, unfair conduct, and damages increased by Plaintiffs' filing delay.",
    claimsOrAllegations:
      "Plaintiffs seek possession and money. Defendants assert habitability, quiet enjoyment, unauthorized entry, failure to mitigate, and c. 93A counterclaims.",
  },
  currentPosture:
    "Motion stage, trial preparation, discovery disputes active.",
  createdAt: "2026-05-08T15:00:00Z",
  updatedAt: "2026-05-16T18:30:00Z",
  lastReviewedAt: "2026-05-16T18:30:00Z",
};

// ─────────────────────────────────────────────────────────────────────────────
// Source documents (raw files in object storage)
// ─────────────────────────────────────────────────────────────────────────────

const documentDefaults = {
  workspaceId: DEMO_WORKSPACE_ID,
  caseId: DEMO_CASE_ID,
  uploadedByUserId: demoUserId,
} as const;

export const demoDocuments: CaseDocument[] = [
  {
    ...documentDefaults,
    id: "doc-affidavit",
    fileName: "Affidavit of Matthew Sweeney - Draft.pdf",
    storageKey: `cases/${DEMO_CASE_ID}/documents/affidavit-msweeney-draft.pdf`,
    mimeType: "application/pdf",
    category: "witness_statement",
    description:
      "Draft affidavit covering payment history, pest conditions, family hardship, RAFT, no-fault discussions, notices, entry, and filing-delay chronology.",
    processingStatus: "processed",
    pageCount: 18,
    createdAt: "2026-05-16T14:00:00Z",
    updatedAt: "2026-05-16T15:30:00Z",
  },
  {
    ...documentDefaults,
    id: "doc-notice-first",
    fileName: "2025-06-17 Notice to Quit - Posted Copy.jpg",
    storageKey: `cases/${DEMO_CASE_ID}/documents/2025-06-17-notice-to-quit-posted.jpg`,
    mimeType: "image/jpeg",
    category: "pleading",
    description:
      "Photograph of the posted nonpayment Notice to Quit that began the summary process sequence.",
    processingStatus: "processed",
    createdAt: "2026-05-10T12:00:00Z",
    updatedAt: "2026-05-10T12:20:00Z",
  },
  {
    ...documentDefaults,
    id: "doc-cert-letter",
    fileName: "2025-08-05 Certified Filing Request.pdf",
    storageKey: `cases/${DEMO_CASE_ID}/documents/2025-08-05-certified-filing-request.pdf`,
    mimeType: "application/pdf",
    category: "correspondence",
    description:
      "Tenant-side certified letter tying filing timing to mitigation and assistance options, with USPS receipt.",
    processingStatus: "processed",
    pageCount: 4,
    createdAt: "2026-05-10T12:05:00Z",
    updatedAt: "2026-05-10T12:25:00Z",
  },
  {
    ...documentDefaults,
    id: "doc-agreement",
    fileName: "Agreement to Vacate and September Emails.pdf",
    storageKey: `cases/${DEMO_CASE_ID}/documents/agreement-to-vacate-sept-emails.pdf`,
    mimeType: "application/pdf",
    category: "contract",
    description:
      "Agreement and email chain used to evaluate no-fault filing expectations, the September 12 deadline, and later classification tension.",
    processingStatus: "processed",
    pageCount: 9,
    createdAt: "2026-05-11T10:00:00Z",
    updatedAt: "2026-05-11T10:40:00Z",
  },
  {
    ...documentDefaults,
    id: "doc-raft",
    fileName: "RAFT Approval and Rent Ledger Packet.pdf",
    storageKey: `cases/${DEMO_CASE_ID}/documents/raft-approval-rent-ledger.pdf`,
    mimeType: "application/pdf",
    category: "financial",
    description:
      "RAFT and ledger materials for verifying payment amounts, cure timing, and the relationship between initial arrears and later notices.",
    processingStatus: "processed",
    pageCount: 12,
    createdAt: "2026-05-11T10:10:00Z",
    updatedAt: "2026-05-11T11:00:00Z",
  },
  {
    ...documentDefaults,
    id: "doc-discovery",
    fileName: "Plaintiffs Supplemental Discovery Responses.pdf",
    storageKey: `cases/${DEMO_CASE_ID}/documents/plaintiffs-supplemental-discovery.pdf`,
    mimeType: "application/pdf",
    category: "evidence",
    description:
      "Late supplemental responses with remaining gaps around entry, pest, and internal decision records. Table extraction needs manual verification.",
    processingStatus: "processed",
    pageCount: 31,
    createdAt: "2026-05-12T09:00:00Z",
    updatedAt: "2026-05-12T09:45:00Z",
  },
  {
    ...documentDefaults,
    id: "doc-maintenance",
    fileName: "Maintenance Portal Export - Work Orders.csv",
    storageKey: `cases/${DEMO_CASE_ID}/documents/maintenance-portal-work-orders.csv`,
    mimeType: "text/csv",
    category: "evidence",
    description:
      "Work-order export that may show response activity but does not by itself prove durable remediation.",
    processingStatus: "processed",
    createdAt: "2026-05-12T09:10:00Z",
    updatedAt: "2026-05-12T09:50:00Z",
  },
  {
    ...documentDefaults,
    id: "doc-photos",
    fileName: "Kitchen Condition Photo - Pest Damage.jpg",
    storageKey: `cases/${DEMO_CASE_ID}/documents/kitchen-condition-pest-damage.jpg`,
    mimeType: "image/jpeg",
    category: "evidence",
    description:
      "Photograph of kitchen pest damage. Strong visual content but missing capture metadata, so authentication leans on testimony.",
    processingStatus: "processed",
    createdAt: "2026-05-16T13:00:00Z",
    updatedAt: "2026-05-16T13:05:00Z",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Records
// ─────────────────────────────────────────────────────────────────────────────

const recordDefaults = {
  workspaceId: DEMO_WORKSPACE_ID,
  caseId: DEMO_CASE_ID,
  version: 1,
  createdBy: "agent",
  createdAt: "2026-05-14T12:00:00Z",
  updatedAt: "2026-05-16T12:00:00Z",
} as const;

const acceptedByUser = {
  status: "ACCEPTED",
  approvedByUserId: demoUserId,
  approvedAt: "2026-05-15T16:00:00Z",
} as const;

const humanAuthored = {
  createdBy: "human",
  createdByUserId: demoUserId,
} as const;

export const demoRecords: TypedCaseRecord[] = [
  // ── People ────────────────────────────────────────────────────────────────
  {
    ...recordDefaults,
    ...humanAuthored,
    ...acceptedByUser,
    id: "person-msweeney",
    type: "PERSON",
    name: "Matthew Sweeney",
    roles: ["CLIENT", "TENANT", "FACT_WITNESS"],
    primaryRole: "CLIENT",
    title: "Matthew Sweeney",
    summary: "Client, tenant, and primary fact witness, appearing pro se.",
    content:
      "Defendant and head of household. Can testify to move-in conditions, repeated complaints, hardship communications, the July 24, 2025 entry incident, RAFT and shelter pathway discussions, and discovery prejudice.",
    party: "ours",
  },
  {
    ...recordDefaults,
    ...acceptedByUser,
    id: "person-dferreira",
    type: "PERSON",
    name: "Denise Ferreira",
    roles: ["CASE_WORKER"],
    primaryRole: "CASE_WORKER",
    organization: "QCAP",
    title: "Denise Ferreira (QCAP Housing Coordinator)",
    summary:
      "Housing coordinator who allegedly tied shelter access to a no-fault court pathway.",
    content:
      "QCAP Housing Coordinator who, per the affidavit, informed the family that EA Family Shelter access and related assistance depended on a no-fault Housing Court pathway and a court-ordered move-out date. Potential corroborating witness for the reliance and prejudice theory.",
    party: "neutral",
  },
  {
    ...recordDefaults,
    id: "person-fc-management",
    type: "PERSON",
    status: "PROPOSED",
    name: "Faxon Commons property management",
    roles: ["PROPERTY_MANAGER", "CORPORATE_REPRESENTATIVE"],
    primaryRole: "PROPERTY_MANAGER",
    organization: "Faxon Commons",
    title: "Faxon Commons management witness",
    summary:
      "Management records witness for entry logs, work orders, vendors, and filing decisions.",
    content:
      "Management-side witness expected to testify about rent records, notices, portal records, maintenance handling, and the process used to classify the eviction filing. Identity of the specific records custodian still needs confirmation.",
    party: "opposing",
  },

  // ── Objectives (level 1) ──────────────────────────────────────────────────
  {
    ...recordDefaults,
    ...humanAuthored,
    ...acceptedByUser,
    id: "objective-001",
    type: "OBJECTIVE",
    substatus: "ACTIVE",
    priority: "high",
    party: "ours",
    category: "Primary",
    title: "Keep the factfinder focused on conduct, not just arrears",
    summary:
      "Active objective that keeps case presentation aligned to landlord conduct and prejudice.",
    content:
      "The case strategy should repeatedly connect rent allegations to landlord conduct, conditions, timing, and evidentiary gaps so the court never sees a ledger-only story.",
    createdAt: "2026-05-10T12:00:00Z",
  },
  {
    ...recordDefaults,
    ...humanAuthored,
    ...acceptedByUser,
    id: "objective-002",
    type: "OBJECTIVE",
    substatus: "ACTIVE",
    priority: "high",
    party: "ours",
    category: "Risk control",
    title: "Avoid overclaiming causation while preserving prejudice theme",
    summary:
      "Strategy objective constraining how filing-delay arguments should be framed.",
    content:
      "The workspace should preserve the filing-delay/prejudice theme while avoiding a factual assertion that assistance or mitigation would definitely have succeeded absent stronger support.",
  },
  {
    ...recordDefaults,
    id: "objective-003",
    type: "OBJECTIVE",
    status: "PROPOSED",
    substatus: "AT_RISK",
    priority: "high",
    party: "ours",
    category: "Trial strategy",
    title: "Turn discovery gaps into a proof structure, not only a grievance",
    summary:
      "Strategic objective for making missing records useful at trial.",
    content:
      "Discovery deficiencies should be connected to specific claims, defenses, witness questions, and exhibit gaps so the court sees prejudice rather than generalized frustration.",
  },

  // ── Claims (level 1) ──────────────────────────────────────────────────────
  {
    ...recordDefaults,
    ...humanAuthored,
    ...acceptedByUser,
    id: "claim-001",
    type: "CLAIM",
    substatus: "ASSERTED",
    claimType: "affirmative",
    party: "opposing",
    category: "Possession",
    title: "Plaintiffs' claim for possession and money damages",
    summary:
      "Nonpayment summary process claim seeking possession and alleged arrears.",
    content:
      "Plaintiffs seek possession of the unit and money allegedly owed for rent or use and occupancy, framed as straightforward nonpayment beginning from the June 2025 notice sequence.",
  },
  {
    ...recordDefaults,
    ...humanAuthored,
    ...acceptedByUser,
    id: "claim-002",
    type: "CLAIM",
    substatus: "ASSERTED",
    claimType: "counterclaim",
    party: "ours",
    category: "Counterclaims",
    title: "Habitability, quiet enjoyment, and c. 93A counterclaims",
    summary:
      "Defense counterclaims grounded in conditions, entry, and unfair conduct.",
    content:
      "Defendants assert breach of the implied warranty of habitability, interference with quiet enjoyment, unauthorized entry, failure to mitigate damages, and violations of G.L. c. 93A.",
  },

  // ── Posture (level 1, completed replacement pair) ───────────────────────
  {
    ...recordDefaults,
    ...humanAuthored,
    ...acceptedByUser,
    id: "posture-002",
    type: "POSTURE",
    category: "Trial posture",
    version: 2,
    replacesIds: ["posture-003"],
    title:
      "Trial-facing posture constrained by unresolved discovery and proof quality",
    summary:
      "Current posture linking urgency to missing records and exhibit foundation.",
    content:
      "The matter is trial-facing, but unresolved discovery gaps and evidence-integrity questions should shape preparation. The strongest work now is proof mapping, witness sequencing, and careful review of agent proposals before any trial use.",
  },
  {
    ...recordDefaults,
    id: "posture-003",
    type: "POSTURE",
    status: "REPLACED",
    category: "Discovery posture",
    replacedByIds: ["posture-002"],
    title: "Earlier posture treated discovery as mostly complete",
    summary:
      "Earlier posture replaced by newer discovery-pressure analysis.",
    content:
      "Earlier workspace notes treated the April supplemental response as mostly resolving discovery concerns. Later review identified remaining gaps in entry logs, internal communications, vendor records, and extraction quality.",
    createdAt: "2026-05-12T12:00:00Z",
    updatedAt: "2026-05-15T12:00:00Z",
  },

  // ── Theories (level 2) ────────────────────────────────────────────────────
  {
    ...recordDefaults,
    ...humanAuthored,
    ...acceptedByUser,
    id: "theory-001",
    type: "THEORY",
    substatus: "ADOPTED",
    priority: "high",
    party: "ours",
    category: "Trial theory",
    title: "This is not a ledger-only nonpayment case",
    summary:
      "Primary trial theory for keeping the case broader than rent accounting.",
    content:
      "The defense should resist a narrow rent-ledger frame and present a joined narrative of habitability, notice, management conduct, mitigation, and prejudice.",
    createdAt: "2026-05-12T12:00:00Z",
  },
  {
    ...recordDefaults,
    id: "theory-002",
    type: "THEORY",
    status: "PROPOSED",
    substatus: "EXPLORING",
    party: "ours",
    category: "Equitable prejudice",
    replacesIds: ["arg-003"],
    title:
      "Filing delay shows equitable prejudice more cleanly than strict mitigation",
    summary:
      "Alternative theory that may fit the record better than narrow causation.",
    content:
      "Rather than relying only on strict mitigation causation, the better framing may be that Plaintiffs' timing and communications created equitable prejudice by changing Defendants' practical options while preserving Plaintiffs' ability to present the matter as simple nonpayment.",
  },

  // ── Issues (level 2) ──────────────────────────────────────────────────────
  {
    ...recordDefaults,
    ...humanAuthored,
    ...acceptedByUser,
    id: "issue-001",
    type: "ISSUE",
    substatus: "OPEN",
    issueType: "legal",
    party: "ours",
    category: "Habitability",
    title: "Whether habitability conditions offset or defeat the rent claim",
    summary:
      "Legal issue connecting condition evidence to rent abatement and counterclaim value.",
    content:
      "The core factual and legal issue is whether prolonged pest and maintenance conditions support defenses, counterclaims, damages, or rent abatement.",
    createdAt: "2026-05-13T12:00:00Z",
  },
  {
    ...recordDefaults,
    id: "issue-002",
    type: "ISSUE",
    status: "PROPOSED",
    substatus: "RESERVED",
    issueType: "procedural",
    party: "ours",
    category: "Discovery",
    title: "Whether missing discovery supports adverse inference",
    summary:
      "Procedural issue for deciding how missing records should shape trial presentation.",
    content:
      "Missing entry logs, internal communications, extermination records, and decision-making documents may justify discovery sanctions or adverse inference framing.",
  },
  {
    ...recordDefaults,
    id: "issue-003",
    type: "ISSUE",
    status: "PROPOSED",
    substatus: "OPEN",
    issueType: "strategic",
    party: "ours",
    category: "Strategic",
    title: "Whether filing delay caused legally meaningful prejudice",
    summary:
      "Strategic issue separating strict mitigation from broader equitable prejudice.",
    content:
      "The key question is whether the timing and handling of the filing materially affected Defendants' assistance, housing, negotiation, or litigation position in a way the court can credit without overclaiming causation.",
  },
  {
    ...recordDefaults,
    id: "issue-006",
    type: "ISSUE",
    status: "PROPOSED",
    substatus: "OPEN",
    issueType: "procedural",
    party: "ours",
    category: "Procedural",
    title: "Whether RAFT curing June and July arrears changed the filing posture",
    summary:
      "Procedural issue for interpreting the second notice and later nonpayment complaint.",
    content:
      "The record needs to separate what RAFT paid, when it was credited, whether the first notice remained a viable procedural path, and how those facts affect the later second notice and October filing.",
  },

  // ── Arguments (level 2) ───────────────────────────────────────────────────
  {
    ...recordDefaults,
    id: "arg-002",
    type: "ARGUMENT",
    status: "PROPOSED",
    substatus: "DRAFT",
    supportStatus: "PARTIALLY_SUPPORTED",
    supportStatusExplanation:
      "Partially supported by the missing production categories and accepted discovery-gap facts, but still needs tighter linkage to the actual requests, responses, and trial prejudice.",
    party: "ours",
    category: "Discovery",
    replacesIds: ["arg-old-discovery-sanctions"],
    title: "Discovery gaps make Plaintiffs' clean-record story unreliable",
    summary:
      "Discovery theme challenging the completeness and reliability of landlord-side records.",
    content:
      "Where records are selectively unavailable, the argument should focus on control, notice, missing categories, and the prejudice caused by late or incomplete production.",
  },
  {
    ...recordDefaults,
    id: "arg-old-discovery-sanctions",
    type: "ARGUMENT",
    status: "PENDING_REPLACEMENT",
    substatus: "DRAFT",
    party: "ours",
    category: "Discovery",
    approvedByUserId: demoUserId,
    approvedAt: "2026-05-13T16:00:00Z",
    title: "Discovery argument depends entirely on sanctions",
    summary:
      "Accepted discovery framing now challenged by a broader trial-theme proposal.",
    content:
      "Current strategy treats missing discovery mainly as support for sanctions or a standalone discovery motion. A newer proposal asks whether that framing is too brittle for trial because the same record gaps may matter even without a sanctions order, especially for credibility, prejudice, and missing-proof themes.",
    createdAt: "2026-05-12T12:00:00Z",
  },
  {
    ...recordDefaults,
    id: "arg-003",
    type: "ARGUMENT",
    status: "PENDING_REPLACEMENT",
    substatus: "DRAFT",
    supportStatus: "PARTIALLY_SUPPORTED",
    supportStatusExplanation:
      "Partially supported because filing delay is documented, but the record still needs concrete causation evidence tying that delay to a specific mitigation pathway or assistance consequence.",
    party: "ours",
    category: "Mitigation",
    approvedByUserId: demoUserId,
    approvedAt: "2026-05-13T16:00:00Z",
    title: "Filing delay supports mitigation only if causation is shown",
    summary:
      "Accepted mitigation framing now being compared against equitable prejudice.",
    content:
      "The filing-delay theory is strongest if tied to concrete mitigation pathways or assistance consequences. Without that showing, the argument risks sounding like general unfairness rather than a legally useful mitigation point.",
    createdAt: "2026-05-12T12:00:00Z",
  },
  {
    ...recordDefaults,
    id: "arg-005",
    type: "ARGUMENT",
    status: "PROPOSED",
    substatus: "DRAFT",
    supportStatus: "PARTIALLY_SUPPORTED",
    supportStatusExplanation:
      "Partially supported by completed maintenance entries and tenant condition evidence; the argument is plausible but depends on showing recurrence or incomplete remediation.",
    party: "ours",
    category: "Evidence interpretation",
    title:
      "Completed maintenance entries show response activity, not condition proof",
    summary:
      "Counter-interpretation of landlord records that avoids denying they exist.",
    content:
      "The defense can concede that work orders or service entries exist while arguing that they show response activity, not necessarily durable remediation or absence of recurring conditions.",
  },
  {
    ...recordDefaults,
    id: "arg-006",
    type: "ARGUMENT",
    status: "PROPOSED",
    substatus: "DRAFT",
    supportStatus: "PARTIALLY_SUPPORTED",
    supportStatusExplanation:
      "Partially supported by the RAFT cure sequence and later arrears history, while still requiring ledger confirmation and careful framing that does not deny later nonpayment.",
    party: "ours",
    category: "Procedural framing",
    title: "RAFT payment weakens a clean nonpayment-only chronology",
    summary:
      "Alternative argument focused on sequence rather than denying later arrears.",
    content:
      "The defense can argue that RAFT curing the initial arrears before any court filing complicates Plaintiffs' clean nonpayment timeline, while still acknowledging that later arrears accumulated.",
  },

  // ── Facts (level 3) ───────────────────────────────────────────────────────
  {
    ...recordDefaults,
    ...humanAuthored,
    ...acceptedByUser,
    id: "fact-001",
    type: "FACT",
    supportStatus: "SUPPORTED",
    supportStatusExplanation:
      "Supported by the tenant affidavit and repeated notice history describing pest activity from move-in with inconsistent remediation.",
    party: "ours",
    category: "Habitability",
    title: "Move-in conditions included persistent pest activity",
    summary:
      "Habitability fact tying early tenancy conditions to later notice and rent defenses.",
    content:
      "Defendants report serious pest-related conditions beginning at move-in in 2021, with repeated notice to management and inconsistent remediation.",
    createdAt: "2026-05-13T12:00:00Z",
  },
  {
    ...recordDefaults,
    id: "fact-002",
    type: "FACT",
    status: "PROPOSED",
    supportStatus: "PARTIALLY_SUPPORTED",
    supportStatusExplanation:
      "Partially supported by communications about hardship and filing timing, but the downstream effect on RAFT, shelter access, or mitigation still needs corroborating records.",
    party: "ours",
    category: "Mitigation",
    replacesIds: ["fact-old-raft-timing"],
    title: "Management knew delayed filing could affect mitigation pathways",
    summary:
      "Proposed mitigation fact based on the certified request to file promptly.",
    content:
      "Financial hardship and RAFT/shelter timing concerns were communicated before the nonpayment filing, creating a mitigation and causation issue.",
  },
  {
    ...recordDefaults,
    id: "fact-old-raft-timing",
    type: "FACT",
    status: "PENDING_REPLACEMENT",
    isContextual: true,
    party: "ours",
    category: "Mitigation",
    approvedByUserId: demoUserId,
    approvedAt: "2026-05-13T16:00:00Z",
    title: "Filing delay was only background context",
    summary:
      "Accepted background framing currently under review by a stronger proposed fact.",
    content:
      "Current workspace reasoning treats the delayed filing as procedural background rather than a fact with potential downstream effects on RAFT, shelter access, arrears growth, and transition planning. A newer proposal asks the user to decide whether this framing is too narrow.",
    createdAt: "2026-05-12T12:00:00Z",
  },
  {
    ...recordDefaults,
    id: "fact-003",
    type: "FACT",
    status: "PROPOSED",
    supportStatus: "CONFLICTED",
    supportStatusExplanation:
      "Conflicted because landlord maintenance materials mark pest work as completed, while tenant chronology and later condition evidence suggest recurrence or incomplete remediation.",
    party: "opposing",
    category: "Habitability",
    title: "Landlord records characterize pest remediation as completed",
    summary:
      "Disputed landlord-side fact that conflicts with tenant condition evidence.",
    content:
      "Plaintiffs' maintenance materials appear to mark several pest-related work orders as completed, but the tenant chronology and later condition evidence suggest the underlying infestation or recurrence may not have been resolved.",
  },
  {
    ...recordDefaults,
    ...humanAuthored,
    ...acceptedByUser,
    id: "fact-005",
    type: "FACT",
    supportStatus: "PARTIALLY_SUPPORTED",
    supportStatusExplanation:
      "Partially supported by apparent gaps in entry logs, access records, and internal communications; completeness still depends on comparing the production against the actual requests.",
    party: "opposing",
    category: "Discovery",
    title: "Discovery production does not show a complete entry-log chain",
    summary:
      "Missing-record fact that supports discovery pressure without overstating intent.",
    content:
      "The current production does not appear to include a complete chain of entry logs, access records, or internal communications for the disputed entry and maintenance periods. This supports a record-gap theory but still requires careful comparison against the actual requests and responses.",
  },
  {
    ...recordDefaults,
    ...humanAuthored,
    ...acceptedByUser,
    id: "fact-007",
    type: "FACT",
    supportStatus: "SUPPORTED",
    supportStatusExplanation:
      "Supported by Matthew Sweeney's affidavit itemizing family payments and RAFT assistance totaling approximately $116,290.41 during the tenancy.",
    party: "ours",
    category: "Payment history",
    title: "Family and RAFT payments exceeded $116,000 during tenancy",
    summary:
      "Payment-context fact that complicates a simple nonpayment narrative.",
    content:
      "Matthew Sweeney's affidavit states that his family and RAFT assistance collectively paid approximately $116,290.41 in rent and arrears during the tenancy, including approximately $110,442.73 from the family and approximately $5,847.68 through RAFT.",
  },
  {
    ...recordDefaults,
    ...humanAuthored,
    ...acceptedByUser,
    id: "fact-008",
    type: "FACT",
    isContextual: true,
    supportStatus: "SUPPORTED",
    supportStatusExplanation:
      "Supported by the affidavit's description of the child's autism diagnosis, local services, therapy supports, and household stability needs.",
    party: "ours",
    category: "Household stability",
    title: "Child's local autism services made relocation materially harder",
    summary:
      "Context fact explaining why ordinary relocation assumptions may not fit the household.",
    content:
      "The affidavit states that the household depended on locally based Quincy services, evaluations, therapy supports, and stability for a child formally diagnosed with autism in 2024, making relocation more complicated than a standard market move.",
  },
  {
    ...recordDefaults,
    id: "fact-010",
    type: "FACT",
    status: "PROPOSED",
    supportStatus: "PARTIALLY_SUPPORTED",
    supportStatusExplanation:
      "Partially supported by the affidavit's RAFT cure account, but the exact approval and payment dates still need reconciliation against the RAFT record and ledger.",
    party: "ours",
    category: "RAFT",
    title: "Initial arrears were allegedly cured by RAFT before any court filing",
    summary:
      "Timing fact that affects the meaning of later notices and filing classification.",
    content:
      "The affidavit states that RAFT assistance was approved and covered the June and July arrears in full before Faxon Commons filed a Summary Process action. The exact approval and payment dates should be checked against the RAFT record and ledger.",
  },

  // ── Timeline events (level 3) ─────────────────────────────────────────────
  {
    ...recordDefaults,
    ...humanAuthored,
    ...acceptedByUser,
    id: "timeline-001",
    type: "TIMELINE_EVENT",
    eventDate: "2025-06-17",
    party: "opposing",
    category: "Filing",
    title: "First Notice to Quit served",
    summary: "Procedural anchor event for the summary process timeline.",
    content:
      "Plaintiffs served a nonpayment notice to quit, starting the procedural path toward summary process.",
    createdAt: "2026-05-11T12:00:00Z",
  },
  {
    ...recordDefaults,
    id: "timeline-002",
    type: "TIMELINE_EVENT",
    status: "PROPOSED",
    datePrecision: "month",
    eventDate: "2025-08-05",
    party: "ours",
    category: "Communication",
    title: "Certified request to file promptly",
    summary:
      "Communication event that supports mitigation and timing arguments.",
    content:
      "Defendants asked Plaintiffs to file promptly because timing affected mitigation and housing-assistance options.",
  },
  {
    ...recordDefaults,
    id: "timeline-007",
    type: "TIMELINE_EVENT",
    status: "PROPOSED",
    supportStatus: "CONFLICTED",
    supportStatusExplanation:
      "Conflicted because the affidavit says RAFT was approved on July 28, while the timeline file lists July 24 and the date should be reconciled against Exhibit B.",
    eventDate: "2025-07-28",
    party: "ours",
    category: "RAFT",
    title: "RAFT assistance approved after first notice expired",
    summary:
      "Timing event that may affect cure, filing posture, and later arrears analysis.",
    content:
      "The affidavit states that RAFT assistance was approved on July 28, 2025 and covered June and July arrears after the first Notice to Quit expired. The timeline file lists July 24, so the exact date should be reconciled against Exhibit B.",
  },
  {
    ...recordDefaults,
    ...humanAuthored,
    ...acceptedByUser,
    id: "timeline-009",
    type: "TIMELINE_EVENT",
    eventDate: "2025-08-19",
    party: "opposing",
    category: "Notice",
    title: "Second Notice to Quit issued after RAFT resolved initial arrears",
    summary:
      "Procedural event creating tension between cure, delay, and later nonpayment filing.",
    content:
      "Faxon Commons issued a second Notice to Quit on August 19, 2025, after the affidavit says RAFT had resolved the initial June and July arrears and while additional arrears were accumulating during the filing delay.",
  },
  {
    ...recordDefaults,
    ...humanAuthored,
    ...acceptedByUser,
    id: "timeline-011",
    type: "TIMELINE_EVENT",
    eventDate: "2025-10-14",
    party: "opposing",
    category: "Filing",
    title:
      "Fault-based nonpayment complaint filed thirty-two days after agreement deadline",
    summary:
      "Core filing event tying delay, classification, and accumulated arrears together.",
    content:
      "The affidavit states that Faxon Commons filed a nonpayment Summary Process action on October 14, 2025, thirty-two days after the September 12 filing deadline in the Agreement to Vacate.",
  },
  {
    ...recordDefaults,
    ...humanAuthored,
    ...acceptedByUser,
    id: "timeline-013",
    type: "TIMELINE_EVENT",
    eventDate: "2026-04-23",
    party: "ours",
    category: "Discovery",
    title: "Supplemental memorandum sought search certification and preclusion",
    summary:
      "Discovery-pressure event connecting missing records to requested relief.",
    content:
      "Defendants filed a supplemental memorandum on April 23, 2026, documenting continued discovery concerns and requesting search certification, production by a date certain, and preclusion of undisclosed evidence.",
  },

  // ── Testimony (level 3) ───────────────────────────────────────────────────
  {
    ...recordDefaults,
    ...humanAuthored,
    ...acceptedByUser,
    id: "testimony-001",
    type: "TESTIMONY",
    substatus: "ANTICIPATED",
    witnessPersonRecordId: "person-msweeney",
    party: "ours",
    category: "Anticipated",
    title: "Tenant testimony should anchor lived conditions and notice",
    summary:
      "Anticipated testimony module for conditions, notice, hardship, and discovery prejudice.",
    content:
      "Matthew Sweeney can testify to move-in conditions, repeated complaints, the July 2025 entry incident, hardship communications, and discovery prejudice.",
    createdAt: "2026-05-12T12:00:00Z",
  },
  {
    ...recordDefaults,
    id: "testimony-002",
    type: "TESTIMONY",
    status: "PROPOSED",
    substatus: "PREPARED",
    witnessPersonRecordId: "person-fc-management",
    party: "opposing",
    category: "Cross-exam",
    title: "Management witness should be crossed on records under its control",
    summary:
      "Cross-examination module for entry logs, work orders, vendors, and classification decisions.",
    content:
      "A management witness should establish what systems exist, who can access them, how entries are created, whether vendor or access logs are retained, and why certain categories are missing from the current production.",
  },

  // ── Legal precedent (level 3) ─────────────────────────────────────────────
  {
    ...recordDefaults,
    id: "precedent-001",
    type: "LEGAL_PRECEDENT",
    status: "PROPOSED",
    citeChecked: false,
    jurisdiction: "Massachusetts",
    category: "Research",
    title: "Quiet enjoyment and c. 93A authorities need final cite check",
    summary:
      "Research item that should not be used until citations and current-law status are verified.",
    content:
      "The workspace has candidate Massachusetts authority for quiet enjoyment, habitability, and unfair/deceptive conduct, but citations should be verified before filing.",
  },
  {
    ...recordDefaults,
    id: "precedent-003",
    type: "LEGAL_PRECEDENT",
    status: "PROPOSED",
    citeChecked: false,
    jurisdiction: "Massachusetts",
    category: "Discovery research",
    title: "Adverse-inference research is promising but not yet motion-ready",
    summary:
      "Research item separating trial theme from sanctions or evidentiary relief.",
    content:
      "Discovery-gap authority may help frame prejudice or adverse inference, but the current research should be cite-checked and matched to the actual missing categories before being used as a sanctions theory.",
  },

  // ── Tasks (level 2) ───────────────────────────────────────────────────────
  {
    ...recordDefaults,
    ...humanAuthored,
    ...acceptedByUser,
    id: "task-001",
    type: "TASK",
    substatus: "OPEN",
    priority: "high",
    dueDate: "2026-06-01",
    category: "Trial prep",
    title: "Build trial exhibit map",
    summary:
      "High-priority preparation task for tying claims and defenses to proof.",
    content:
      "Create a table that maps each defense element and counterclaim element to exhibits, witnesses, and missing discovery.",
  },
  {
    ...recordDefaults,
    id: "task-002",
    type: "TASK",
    status: "ACCEPTED",
    substatus: "IN_PROGRESS",
    priority: "high",
    category: "Discovery",
    title: "Prepare discovery-prejudice demonstrative",
    summary:
      "Trial prep item for showing requested, produced, and still-missing discovery.",
    content:
      "Show what was requested, what was produced, what remains missing, and why each gap matters to a live claim or defense. Blocked until the supplemental production is fully reconciled against the original requests.",
  },
  {
    ...recordDefaults,
    ...humanAuthored,
    ...acceptedByUser,
    id: "task-006",
    type: "TASK",
    substatus: "OPEN",
    priority: "high",
    dueDate: "2026-05-25",
    category: "Timeline integrity",
    title: "Reconcile affidavit timeline against exhibit dates before trial use",
    summary:
      "Quality-control task for RAFT date, notices, agreement deadline, and docket filing.",
    content:
      "Compare the affidavit, case timeline, RAFT approval record, notices, certified letter receipt, Agreement to Vacate, and Summary Process docket so trial materials distinguish exact dates from asserted or reconstructed dates.",
  },

  // ── Notes (level 3) ───────────────────────────────────────────────────────
  {
    ...recordDefaults,
    ...humanAuthored,
    ...acceptedByUser,
    id: "note-001",
    type: "NOTE",
    pinned: true,
    category: "Strategy",
    title: "Cross-exam focus: records under management control",
    summary:
      "Pinned strategy note for witness examination on missing management-controlled records.",
    content:
      "Ask concise foundation questions establishing that entry logs, work orders, pest records, and internal communications are kept by or available to management.",
  },
  {
    ...recordDefaults,
    ...humanAuthored,
    ...acceptedByUser,
    id: "note-003",
    type: "NOTE",
    pinned: true,
    category: "Human correction",
    title:
      "Agent summary overstated missing communications as intentional withholding",
    summary:
      "Human correction note preventing an unsupported inference from becoming strategy.",
    content:
      "The April discovery summary should say communications remain missing or unproduced in the current packet. It should not state that Plaintiffs intentionally withheld them unless the record later supports that characterization.",
  },

  // ── Document records (level 4) ────────────────────────────────────────────
  // The affidavit (one 18-page file) is split into four DOCUMENT records,
  // each grounding a different part of the graph.
  {
    ...recordDefaults,
    ...acceptedByUser,
    id: "docrec-affidavit-payments",
    type: "DOCUMENT",
    documentId: "doc-affidavit",
    fileName: "Affidavit of Matthew Sweeney - Draft.pdf",
    pageRange: { start: 2, end: 4 },
    category: "Payment history",
    title: "Affidavit §1 — payment history and family contributions",
    summary:
      "Affidavit section detailing the ~$116k paid by family and RAFT during the tenancy.",
    content:
      "Section of the affidavit covering total rent and arrears paid during the tenancy, including approximately $110,442.73 from family and approximately $5,847.68 through RAFT assistance.",
    createdAt: "2026-05-16T14:30:00Z",
  },
  {
    ...recordDefaults,
    ...acceptedByUser,
    id: "docrec-affidavit-raft",
    type: "DOCUMENT",
    documentId: "doc-affidavit",
    fileName: "Affidavit of Matthew Sweeney - Draft.pdf",
    pageRange: { start: 5, end: 7 },
    category: "RAFT",
    title: "Affidavit §2 — RAFT approval and arrears cure",
    summary:
      "Affidavit section asserting RAFT cured June and July arrears before any filing.",
    content:
      "Section of the affidavit describing RAFT approval (asserted July 28, 2025), coverage of the June and July arrears in full, and the relationship of the cure to the first Notice to Quit.",
    createdAt: "2026-05-16T14:30:00Z",
  },
  {
    ...recordDefaults,
    ...acceptedByUser,
    id: "docrec-affidavit-entry",
    type: "DOCUMENT",
    documentId: "doc-affidavit",
    fileName: "Affidavit of Matthew Sweeney - Draft.pdf",
    pageRange: { start: 8, end: 9 },
    category: "Entry",
    title: "Affidavit §3 — July 24 entry and balcony netting removal",
    summary:
      "Affidavit section on the maintenance entry while the family was asleep.",
    content:
      "Section of the affidavit describing the July 24, 2025 maintenance entry following a broad balcony notice, removal of protective balcony netting installed for child safety, and the subsequent discussion with management.",
    createdAt: "2026-05-16T14:30:00Z",
  },
  {
    ...recordDefaults,
    ...acceptedByUser,
    id: "docrec-affidavit-hardship",
    type: "DOCUMENT",
    documentId: "doc-affidavit",
    fileName: "Affidavit of Matthew Sweeney - Draft.pdf",
    pageRange: { start: 10, end: 12 },
    category: "Household stability",
    title: "Affidavit §4 — hardship, autism services, and shelter pathway",
    summary:
      "Affidavit section on household hardship, local services, and the QCAP shelter pathway.",
    content:
      "Section of the affidavit covering financial hardship communications, the household's dependence on local autism services and supports, and statements attributed to QCAP about the no-fault pathway requirement.",
    createdAt: "2026-05-16T14:30:00Z",
  },
  {
    ...recordDefaults,
    ...acceptedByUser,
    id: "docrec-notice-first",
    type: "DOCUMENT",
    documentId: "doc-notice-first",
    fileName: "2025-06-17 Notice to Quit - Posted Copy.jpg",
    category: "Notice",
    title: "First Notice to Quit (June 17, 2025)",
    summary: "Nonpayment notice that started the summary process sequence.",
    content:
      "The June 17, 2025 nonpayment Notice to Quit, captured as a photograph of the posted copy. Service details still need confirmation against the docket.",
    createdAt: "2026-05-10T12:30:00Z",
  },
  {
    ...recordDefaults,
    ...acceptedByUser,
    id: "docrec-cert-letter",
    type: "DOCUMENT",
    documentId: "doc-cert-letter",
    fileName: "2025-08-05 Certified Filing Request.pdf",
    category: "Communication",
    title: "Certified filing request (August 5, 2025)",
    summary:
      "Certified letter asking Plaintiffs to file promptly or confirm in writing.",
    content:
      "Certified letter in which Defendants asked Plaintiffs to file promptly because timing affected mitigation and housing-assistance options, with USPS receipt. The letter requested written confirmation if no filing would occur; no response is documented.",
    createdAt: "2026-05-10T12:30:00Z",
  },
  {
    ...recordDefaults,
    ...acceptedByUser,
    id: "docrec-agreement-deadline",
    type: "DOCUMENT",
    documentId: "doc-agreement",
    fileName: "Agreement to Vacate and September Emails.pdf",
    category: "Agreement to vacate",
    title: "Agreement to Vacate — September 12 filing deadline",
    summary:
      "Agreement sections establishing the no-fault pathway and filing deadline.",
    content:
      "Portions of the Agreement to Vacate and the September 10 email chain establishing that Faxon Commons was to file a no-fault Summary Process action no later than September 12, 2025.",
    createdAt: "2026-05-11T11:00:00Z",
  },
  {
    ...recordDefaults,
    ...acceptedByUser,
    id: "docrec-raft-approval",
    type: "DOCUMENT",
    documentId: "doc-raft",
    fileName: "RAFT Approval and Rent Ledger Packet.pdf",
    category: "RAFT",
    title: "RAFT approval record and rent ledger",
    summary:
      "RAFT approval and ledger entries for verifying cure timing and amounts.",
    content:
      "RAFT approval record and rent ledger pages used to verify payment amounts, cure timing, and the relationship between initial arrears and later notices. Contains a date conflict (July 24 vs July 28) that needs reconciliation.",
    createdAt: "2026-05-11T11:00:00Z",
  },
  {
    ...recordDefaults,
    ...acceptedByUser,
    id: "docrec-discovery-gaps",
    type: "DOCUMENT",
    documentId: "doc-discovery",
    fileName: "Plaintiffs Supplemental Discovery Responses.pdf",
    category: "Discovery",
    title: "Supplemental discovery responses — missing categories",
    summary:
      "Responses showing gaps in entry logs, internal communications, and vendor records.",
    content:
      "The April 3, 2026 supplemental responses, focusing on the categories that remain missing or incomplete: entry logs, access records, internal communications, extermination vendor records, and eviction decision-making documents. Table-based responses were flattened by OCR and should be checked against the PDF image.",
    createdAt: "2026-05-12T10:00:00Z",
  },
  {
    ...recordDefaults,
    ...acceptedByUser,
    id: "docrec-maintenance-orders",
    type: "DOCUMENT",
    documentId: "doc-maintenance",
    fileName: "Maintenance Portal Export - Work Orders.csv",
    category: "Maintenance",
    title: "Work-order export — pest-related entries",
    summary:
      "Pest-related work orders marked completed, with undefined completion codes.",
    content:
      "Pest-related work orders from the maintenance portal export. Several entries are marked completed, but completion-code definitions, vendor notes, and follow-up visits are not included in the export.",
    createdAt: "2026-05-12T10:00:00Z",
  },
  {
    ...recordDefaults,
    ...acceptedByUser,
    id: "docrec-photos-metadata",
    type: "DOCUMENT",
    documentId: "doc-photos",
    fileName: "Kitchen Condition Photo - Pest Damage.jpg",
    category: "Habitability",
    title: "Kitchen condition photo — visible pest damage",
    summary:
      "What the kitchen photo depicts: pest damage relevant to the habitability claim.",
    content:
      "The photograph depicts pest-related damage in the kitchen consistent with the tenant's habitability account. Capture metadata is incomplete, so chronology and authentication will depend on testimony.",
    createdAt: "2026-05-16T13:30:00Z",
  },

  // ── Additional document records (level 4) ────────────────────────────────
  // Every multi-page file is split into several DOCUMENT records, each a
  // distinct section/exhibit grounding a different part of the graph. A few are
  // PROPOSED (newly extracted, awaiting review) and one has REPLACED status
  // after a cleaner re-extraction to exercise the document lifecycle.

  // Affidavit — sections 5–7 (pages 13–18)
  {
    ...recordDefaults,
    ...acceptedByUser,
    id: "docrec-affidavit-notices",
    type: "DOCUMENT",
    documentId: "doc-affidavit",
    fileName: "Affidavit of Matthew Sweeney - Draft.pdf",
    pageRange: { start: 13, end: 14 },
    category: "Notice",
    title: "Affidavit §5 — notice chronology and second Notice to Quit",
    summary:
      "Affidavit section narrating the first notice, RAFT cure, and second notice sequence.",
    content:
      "Section of the affidavit describing the June 17 first Notice to Quit, the RAFT cure of the June and July arrears, and the August 19 second Notice to Quit issued while additional arrears accumulated during the filing delay.",
    createdAt: "2026-05-16T14:30:00Z",
  },
  {
    ...recordDefaults,
    ...acceptedByUser,
    id: "docrec-affidavit-filing-delay",
    type: "DOCUMENT",
    documentId: "doc-affidavit",
    fileName: "Affidavit of Matthew Sweeney - Draft.pdf",
    pageRange: { start: 15, end: 16 },
    category: "Filing delay",
    title: "Affidavit §6 — filing delay and the thirty-two-day gap",
    summary:
      "Affidavit section on the gap between the September 12 deadline and the October 14 filing.",
    content:
      "Section of the affidavit describing the Agreement to Vacate's September 12 filing deadline, the thirty-two-day delay before the October 14 nonpayment complaint, and the asserted effect of that delay on assistance and arrears.",
    createdAt: "2026-05-16T14:30:00Z",
  },
  {
    ...recordDefaults,
    id: "docrec-affidavit-conditions",
    type: "DOCUMENT",
    status: "PROPOSED",
    documentId: "doc-affidavit",
    fileName: "Affidavit of Matthew Sweeney - Draft.pdf",
    pageRange: { start: 17, end: 18 },
    category: "Habitability",
    title: "Affidavit §7 — ongoing conditions and recurrence",
    summary:
      "Newly extracted affidavit section on recurring pest conditions; awaiting review.",
    content:
      "Section of the affidavit describing continued and recurring pest activity after work orders were marked completed. Freshly extracted and proposed; the recurrence dates should be checked against the maintenance export and condition photos.",
  },

  // First Notice to Quit — service page (proposed extraction)
  {
    ...recordDefaults,
    id: "docrec-notice-first-service",
    type: "DOCUMENT",
    status: "PROPOSED",
    documentId: "doc-notice-first",
    fileName: "2025-06-17 Notice to Quit - Posted Copy.jpg",
    category: "Service",
    title: "Posted notice — visible posting location and date",
    summary:
      "Proposed record capturing what the photo shows about how and where the notice was posted.",
    content:
      "The photograph shows the Notice to Quit posted at the unit on June 17, 2025. Method and exact date of service still need confirmation against the docket before this can support any procedural argument.",
  },

  // Certified filing request — USPS receipt
  {
    ...recordDefaults,
    ...acceptedByUser,
    id: "docrec-cert-receipt",
    type: "DOCUMENT",
    documentId: "doc-cert-letter",
    fileName: "2025-08-05 Certified Filing Request.pdf",
    pageRange: { start: 3, end: 4 },
    category: "Service",
    title: "Certified filing request — USPS receipt and green card",
    summary:
      "Mailing proof tying the certified request to a verifiable delivery date.",
    content:
      "The USPS certified-mail receipt and return green card for the August 5 filing request, establishing a verifiable mailing and delivery date for the request that Plaintiffs file promptly.",
    createdAt: "2026-05-10T12:30:00Z",
  },

  // Agreement to Vacate — additional sections
  {
    ...recordDefaults,
    ...acceptedByUser,
    id: "docrec-agreement-nofault-terms",
    type: "DOCUMENT",
    documentId: "doc-agreement",
    fileName: "Agreement to Vacate and September Emails.pdf",
    category: "Agreement to vacate",
    title: "Agreement to Vacate — no-fault classification terms",
    summary:
      "Agreement terms specifying a no-fault Summary Process classification.",
    content:
      "The clauses of the Agreement to Vacate specifying that any filing would proceed as a no-fault Summary Process action, relevant to the later tension with the fault-based nonpayment complaint actually filed.",
    createdAt: "2026-05-11T11:00:00Z",
  },
  {
    ...recordDefaults,
    id: "docrec-agreement-sept-emails",
    type: "DOCUMENT",
    status: "PROPOSED",
    documentId: "doc-agreement",
    fileName: "Agreement to Vacate and September Emails.pdf",
    category: "Communication",
    title: "September email chain — filing expectations",
    summary:
      "Proposed extraction of the September 10 emails confirming the filing deadline.",
    content:
      "The September 10 email chain in which the parties discuss the expected filing and the September 12 deadline. Proposed for review; the sender/recipient identities should be matched to the parties before use.",
  },

  // RAFT packet — additional sections
  {
    ...recordDefaults,
    ...acceptedByUser,
    id: "docrec-raft-ledger",
    type: "DOCUMENT",
    documentId: "doc-raft",
    fileName: "RAFT Approval and Rent Ledger Packet.pdf",
    pageRange: { start: 1, end: 6 },
    category: "Payment history",
    title: "Rent ledger — monthly balances and credits",
    summary:
      "Ledger pages showing month-by-month balances, charges, and credits.",
    content:
      "Rent ledger pages laying out the monthly charges, payments, and running balance through the tenancy, used to corroborate the ~$116k paid and to locate when each arrears period began and was credited.",
    createdAt: "2026-05-11T11:00:00Z",
  },
  {
    ...recordDefaults,
    ...acceptedByUser,
    id: "docrec-raft-cure-detail",
    type: "DOCUMENT",
    documentId: "doc-raft",
    fileName: "RAFT Approval and Rent Ledger Packet.pdf",
    pageRange: { start: 7, end: 9 },
    category: "RAFT",
    title: "RAFT cure — June and July arrears applied",
    summary:
      "Approval and disbursement pages showing the cure of the initial arrears.",
    content:
      "The RAFT approval and disbursement pages showing the June and July arrears being paid in full, used to evaluate whether the initial arrears were cured before any court filing.",
    createdAt: "2026-05-11T11:00:00Z",
  },
  {
    ...recordDefaults,
    id: "docrec-raft-payment-breakdown",
    type: "DOCUMENT",
    status: "PROPOSED",
    documentId: "doc-raft",
    fileName: "RAFT Approval and Rent Ledger Packet.pdf",
    pageRange: { start: 10, end: 12 },
    category: "Payment history",
    title: "RAFT payment breakdown — family vs. assistance",
    summary:
      "Proposed extraction separating family payments from RAFT assistance.",
    content:
      "A proposed breakdown distinguishing the approximately $110,442.73 paid by family from the approximately $5,847.68 paid through RAFT. The arithmetic should be reconciled against the ledger before trial use.",
  },

  // Supplemental discovery responses — one record per missing category
  {
    ...recordDefaults,
    ...acceptedByUser,
    id: "docrec-discovery-entry-logs",
    type: "DOCUMENT",
    documentId: "doc-discovery",
    fileName: "Plaintiffs Supplemental Discovery Responses.pdf",
    pageRange: { start: 4, end: 9 },
    category: "Discovery",
    title: "Supplemental responses — entry-log gap",
    summary: "Section showing the absence of a complete entry-log chain.",
    content:
      "The portion of the supplemental responses addressing access and entry logs, where the production does not include a complete chain for the disputed entry and maintenance periods.",
    createdAt: "2026-05-12T10:00:00Z",
  },
  {
    ...recordDefaults,
    id: "docrec-discovery-internal-comms",
    type: "DOCUMENT",
    status: "PROPOSED",
    documentId: "doc-discovery",
    fileName: "Plaintiffs Supplemental Discovery Responses.pdf",
    pageRange: { start: 10, end: 17 },
    category: "Discovery",
    title: "Supplemental responses — internal communications gap",
    summary:
      "Proposed record isolating the missing internal-communications category.",
    content:
      "The portion of the supplemental responses addressing internal communications, where management-side messages about the conditions, entry, and filing decision remain unproduced. Proposed; should not be characterized as intentional withholding without further support.",
  },
  {
    ...recordDefaults,
    ...acceptedByUser,
    id: "docrec-discovery-vendor-records",
    type: "DOCUMENT",
    documentId: "doc-discovery",
    fileName: "Plaintiffs Supplemental Discovery Responses.pdf",
    pageRange: { start: 18, end: 24 },
    category: "Discovery",
    title: "Supplemental responses — extermination vendor records gap",
    summary: "Section showing missing third-party extermination vendor records.",
    content:
      "The portion of the supplemental responses addressing pest-control vendor records, where third-party extermination invoices and visit reports are absent from the production.",
    createdAt: "2026-05-12T10:00:00Z",
  },
  {
    ...recordDefaults,
    id: "docrec-discovery-decision-docs",
    type: "DOCUMENT",
    status: "PROPOSED",
    documentId: "doc-discovery",
    fileName: "Plaintiffs Supplemental Discovery Responses.pdf",
    pageRange: { start: 25, end: 31 },
    category: "Discovery",
    title: "Supplemental responses — eviction decision documents gap",
    summary:
      "Proposed record on the missing internal decision-making documents.",
    content:
      "The portion of the supplemental responses addressing how the eviction was classified and decided, where internal decision-making documents and approvals are not included. Proposed pending comparison against the original requests.",
  },
  {
    ...recordDefaults,
    id: "docrec-discovery-gaps-v0",
    type: "DOCUMENT",
    status: "REPLACED",
    replacedByIds: ["docrec-discovery-gaps"],
    documentId: "doc-discovery",
    fileName: "Plaintiffs Supplemental Discovery Responses.pdf",
    category: "Discovery",
    title: "Supplemental responses — first-pass extraction (OCR)",
    summary:
      "Earlier OCR extraction replaced after the table responses were re-read.",
    content:
      "The first-pass OCR extraction of the supplemental responses. Its table-based answers were flattened and partly garbled, so it was replaced by a cleaner extraction checked against the PDF image.",
    createdAt: "2026-05-12T09:30:00Z",
    updatedAt: "2026-05-12T10:00:00Z",
  },

  // Maintenance export — completion-code analysis (proposed)
  {
    ...recordDefaults,
    id: "docrec-maintenance-completion-codes",
    type: "DOCUMENT",
    status: "PROPOSED",
    documentId: "doc-maintenance",
    fileName: "Maintenance Portal Export - Work Orders.csv",
    category: "Maintenance",
    title: "Work-order export — completion-code ambiguity",
    summary:
      "Proposed analysis of undefined completion codes on pest work orders.",
    content:
      "A proposed record focusing on the completion codes used to mark pest work orders done. The codes are undefined in the export, so 'completed' may mean a visit occurred rather than that the condition was durably resolved.",
  },

  // ── Narrow-scope document records ─────────────────────────────────────────
  // Tight, single-point extractions so a fact or testimony can cite exactly the
  // sentence/figure it relies on, instead of a broad multi-page section.
  {
    ...recordDefaults,
    ...acceptedByUser,
    id: "docrec-affidavit-116k-figure",
    type: "DOCUMENT",
    documentId: "doc-affidavit",
    fileName: "Affidavit of Matthew Sweeney - Draft.pdf",
    pageRange: { start: 3, end: 3 },
    category: "Payment history",
    title: "Affidavit ¶8 — the $116,290.41 total figure",
    summary: "The single paragraph stating the exact total paid during tenancy.",
    content:
      "The affidavit paragraph stating that family and RAFT assistance paid approximately $116,290.41 in total — roughly $110,442.73 from family and $5,847.68 through RAFT.",
    createdAt: "2026-05-16T14:30:00Z",
  },
  {
    ...recordDefaults,
    ...acceptedByUser,
    id: "docrec-affidavit-raft-date",
    type: "DOCUMENT",
    documentId: "doc-affidavit",
    fileName: "Affidavit of Matthew Sweeney - Draft.pdf",
    pageRange: { start: 6, end: 6 },
    category: "RAFT",
    title: "Affidavit ¶12 — asserted RAFT approval date (July 28)",
    summary: "The sentence asserting the July 28, 2025 RAFT approval date.",
    content:
      "The affidavit sentence asserting RAFT approval on July 28, 2025 — the date that conflicts with the July 24 entry in the timeline file and must be reconciled.",
    createdAt: "2026-05-16T14:30:00Z",
  },
  {
    ...recordDefaults,
    ...acceptedByUser,
    id: "docrec-affidavit-netting",
    type: "DOCUMENT",
    documentId: "doc-affidavit",
    fileName: "Affidavit of Matthew Sweeney - Draft.pdf",
    pageRange: { start: 8, end: 8 },
    category: "Entry",
    title: "Affidavit ¶17 — balcony netting installed for child safety",
    summary:
      "The sentence describing why the removed balcony netting was installed.",
    content:
      "The affidavit sentence stating the balcony netting was installed specifically to protect a child with documented safety needs, framing the July 24 removal as more than incidental.",
    createdAt: "2026-05-16T14:30:00Z",
  },
  {
    ...recordDefaults,
    ...acceptedByUser,
    id: "docrec-affidavit-entry-asleep",
    type: "DOCUMENT",
    documentId: "doc-affidavit",
    fileName: "Affidavit of Matthew Sweeney - Draft.pdf",
    pageRange: { start: 9, end: 9 },
    category: "Entry",
    title: "Affidavit ¶18 — entry occurred while the family was asleep",
    summary: "The sentence describing the timing of the July 24 entry.",
    content:
      "The affidavit sentence stating that the July 24 maintenance entry happened in the early morning while the family was asleep, following a broad balcony notice.",
    createdAt: "2026-05-16T14:30:00Z",
  },
  {
    ...recordDefaults,
    ...acceptedByUser,
    id: "docrec-affidavit-autism-dx",
    type: "DOCUMENT",
    documentId: "doc-affidavit",
    fileName: "Affidavit of Matthew Sweeney - Draft.pdf",
    pageRange: { start: 10, end: 10 },
    category: "Household stability",
    title: "Affidavit ¶22 — child's 2024 autism diagnosis",
    summary:
      "The sentence establishing the formal 2024 autism diagnosis and local supports.",
    content:
      "The affidavit sentence stating a child was formally diagnosed with autism in 2024 and depended on locally based Quincy services and supports, bearing on relocation difficulty.",
    createdAt: "2026-05-16T14:30:00Z",
  },
  {
    ...recordDefaults,
    id: "docrec-affidavit-qcap-statement",
    type: "DOCUMENT",
    status: "PROPOSED",
    documentId: "doc-affidavit",
    fileName: "Affidavit of Matthew Sweeney - Draft.pdf",
    pageRange: { start: 11, end: 11 },
    category: "Household stability",
    title: "Affidavit ¶24 — QCAP no-fault pathway statement",
    summary:
      "Single-source sentence attributing the no-fault pathway requirement to QCAP.",
    content:
      "The affidavit sentence attributing to QCAP that EA Family Shelter access depended on a no-fault Housing Court pathway and a court-ordered move-out date. Single-source; corroboration is the reason this stays proposed.",
  },
  {
    ...recordDefaults,
    ...acceptedByUser,
    id: "docrec-raft-approval-letter",
    type: "DOCUMENT",
    documentId: "doc-raft",
    fileName: "RAFT Approval and Rent Ledger Packet.pdf",
    pageRange: { start: 8, end: 8 },
    category: "RAFT",
    title: "RAFT approval letter — dated approval line",
    summary: "The approval line carrying the official RAFT decision date.",
    content:
      "The single RAFT approval-letter line carrying the program's official approval date, used to reconcile the July 24 vs. July 28 conflict against the affidavit.",
    createdAt: "2026-05-11T11:00:00Z",
  },

  // ── Additional substantive records (accepted / proposed / replaced) ─────
  {
    ...recordDefaults,
    ...humanAuthored,
    ...acceptedByUser,
    id: "fact-012",
    type: "FACT",
    supportStatus: "SUPPORTED",
    supportStatusExplanation:
      "Supported by the affidavit's July 24 entry account, including maintenance entering after the balcony notice and removing protective netting.",
    party: "ours",
    category: "Entry",
    title: "Maintenance entered the unit on July 24 and removed balcony netting",
    summary:
      "Entry fact grounding the quiet-enjoyment and unauthorized-entry theory.",
    content:
      "The affidavit states that on July 24, 2025 maintenance entered the unit following a broad balcony notice while the family was asleep and removed protective balcony netting installed for child safety, prompting a same-day discussion with management.",
    createdAt: "2026-05-13T12:00:00Z",
  },
  {
    ...recordDefaults,
    id: "fact-013",
    type: "FACT",
    status: "PROPOSED",
    supportStatus: "PARTIALLY_SUPPORTED",
    supportStatusExplanation:
      "Partially supported by the stated RAFT cure and August 19 second notice sequence, but needs ledger and notice-date confirmation before being treated as fully proven.",
    party: "ours",
    category: "Procedural framing",
    title: "Second notice issued after the initial arrears were already cured",
    summary:
      "Proposed sequencing fact connecting the cure to the August 19 second notice.",
    content:
      "After RAFT cured the June and July arrears, Faxon Commons issued a second Notice to Quit on August 19, 2025. The proposal asks whether issuing the second notice post-cure undercuts a clean nonpayment chronology.",
  },
  {
    ...recordDefaults,
    ...humanAuthored,
    ...acceptedByUser,
    id: "fact-014",
    type: "FACT",
    isContextual: true,
    supportStatus: "SUPPORTED",
    supportStatusExplanation:
      "Supported by the refined entry context tying the removed balcony netting to a child's documented safety needs rather than a vague protective item.",
    version: 2,
    replacesIds: ["fact-old-entry-vague"],
    party: "ours",
    category: "Entry",
    title: "Balcony netting protected a child with documented safety needs",
    summary:
      "Refined entry-context fact tying the removed netting to a specific safety purpose.",
    content:
      "The netting removed during the July 24 entry had been installed specifically to protect a child with documented safety needs, sharpening the earlier, vaguer description of 'protective netting' into a concrete quiet-enjoyment and conduct point.",
    createdAt: "2026-05-15T12:00:00Z",
  },
  {
    ...recordDefaults,
    id: "fact-old-entry-vague",
    type: "FACT",
    status: "REPLACED",
    isContextual: true,
    replacedByIds: ["fact-014"],
    party: "ours",
    category: "Entry",
    title: "Entry removed 'some protective netting'",
    summary:
      "Earlier, vaguer description of the netting removed during the entry.",
    content:
      "An earlier draft described the July 24 entry as removing 'some protective netting' without specifying its purpose. It was replaced by a more precise statement tying the netting to a child's documented safety needs.",
    createdAt: "2026-05-13T12:00:00Z",
    updatedAt: "2026-05-15T12:00:00Z",
  },
  // ── Version history: a 1→2 SPLIT ─────────────────────────────────────────
  // One broad habitability fact was found to conflate two distinct conditions,
  // so it was split into two precise, separately-provable facts. The source is
  // REPLACED and points forward to both successors; each successor replaces it.
  {
    ...recordDefaults,
    id: "fact-habitability-broad",
    type: "FACT",
    status: "REPLACED",
    isContextual: true,
    replacedByIds: ["fact-habitability-mold", "fact-habitability-heat"],
    party: "ours",
    category: "Habitability",
    title: "Unit had ongoing habitability problems throughout the tenancy",
    summary:
      "Broad habitability fact split into two separately-provable conditions.",
    content:
      "An early catch-all fact asserted the unit had 'ongoing habitability problems.' Because the mold and the heating-outage conditions have different evidence, timelines, and responsible-party theories, this was split into two discrete facts so each can be proven and disputed on its own terms.",
    createdAt: "2026-05-13T10:00:00Z",
    updatedAt: "2026-05-15T12:00:00Z",
  },
  {
    ...recordDefaults,
    ...acceptedByUser,
    id: "fact-habitability-mold",
    type: "FACT",
    supportStatus: "SUPPORTED",
    supportStatusExplanation:
      "Supported by dated maintenance-order history showing visible bathroom mold reports and an approximately three-month delay before remediation was attempted.",
    version: 2,
    replacesIds: ["fact-habitability-broad"],
    party: "ours",
    category: "Habitability",
    title: "Bathroom mold went unremediated for roughly three months",
    summary:
      "Discrete mold-condition fact carved out of the broad habitability fact.",
    content:
      "Tenant reported visible bathroom mold in maintenance requests; the condition remained unaddressed for approximately three months before any remediation was attempted, supported by the dated maintenance order log.",
    createdAt: "2026-05-15T12:00:00Z",
  },
  {
    ...recordDefaults,
    ...acceptedByUser,
    id: "fact-habitability-heat",
    type: "FACT",
    supportStatus: "CONFLICTED",
    supportStatusExplanation:
      "Conflicted because loss of heat is corroborated, but the tenant's claimed 11-day duration conflicts with landlord records suggesting a shorter outage.",
    version: 2,
    replacesIds: ["fact-habitability-broad"],
    party: "ours",
    category: "Habitability",
    title: "Unit lost heat for 11 days during January",
    summary:
      "Discrete heating-outage fact carved out of the broad habitability fact.",
    content:
      "The unit was without functioning heat for an 11-day stretch in January. The duration is contested — the landlord's records suggest a shorter outage — but the loss of heat itself is corroborated by the maintenance order log.",
    createdAt: "2026-05-15T12:00:00Z",
  },
  // ── Version history: a 2→1 MERGE ─────────────────────────────────────────
  // Two separate payment facts were redundant and individually misleading
  // (each looked like a partial payment), so they were merged into one fact
  // that states the combined effect. Both sources are REPLACED and point
  // forward to the single successor, which replaces both.
  {
    ...recordDefaults,
    id: "fact-payment-raft-only",
    type: "FACT",
    status: "REPLACED",
    isContextual: true,
    replacedByIds: ["fact-payment-cured"],
    party: "ours",
    category: "Payments",
    title: "RAFT covered part of the outstanding arrears",
    summary: "Partial payment fact merged into the consolidated cure fact.",
    content:
      "A RAFT approval covered a portion of the June–July arrears. On its own this read as a partial payment, understating how the balance was actually resolved.",
    createdAt: "2026-05-13T11:00:00Z",
    updatedAt: "2026-05-15T12:00:00Z",
  },
  {
    ...recordDefaults,
    id: "fact-payment-direct-only",
    type: "FACT",
    status: "REPLACED",
    isContextual: true,
    replacedByIds: ["fact-payment-cured"],
    party: "ours",
    category: "Payments",
    title: "Tenant made direct payments toward the arrears",
    summary: "Partial payment fact merged into the consolidated cure fact.",
    content:
      "The tenant also made direct payments toward the same June–July arrears. Standing alone this likewise understated the full picture by omitting the RAFT contribution.",
    createdAt: "2026-05-13T11:05:00Z",
    updatedAt: "2026-05-15T12:00:00Z",
  },
  {
    ...recordDefaults,
    ...acceptedByUser,
    id: "fact-payment-cured",
    type: "FACT",
    supportStatus: "SUPPORTED",
    supportStatusExplanation:
      "Supported by the merged RAFT and direct-payment facts showing the June and July arrears were cured before the nonpayment action advanced.",
    version: 2,
    replacesIds: ["fact-payment-raft-only", "fact-payment-direct-only"],
    party: "ours",
    category: "Payments",
    title: "RAFT and direct payments together cured the arrears before filing",
    summary:
      "Consolidated payment fact merged from the RAFT-only and direct-only facts.",
    content:
      "The combined RAFT approval and the tenant's direct payments fully cured the June–July arrears before the nonpayment action advanced. Stating the combined effect in a single fact prevents either contribution from being read in isolation as a mere partial payment.",
    createdAt: "2026-05-15T12:00:00Z",
  },
  {
    ...recordDefaults,
    ...humanAuthored,
    ...acceptedByUser,
    id: "arg-007",
    type: "ARGUMENT",
    substatus: "TRIAL_READY",
    supportStatus: "SUPPORTED",
    supportStatusExplanation:
      "Supported by accepted habitability facts and payment context; the argument can proceed even if the ledger is accepted because abatement depends on condition evidence.",
    party: "ours",
    category: "Habitability",
    title: "Persistent conditions support rent abatement regardless of the ledger",
    summary:
      "Accepted habitability argument linking conditions to abatement of the rent claim.",
    content:
      "Even taking the ledger at face value, persistent habitability conditions support rent abatement and counterclaim value, so the rent total cannot be evaluated in isolation from the condition evidence.",
    createdAt: "2026-05-14T12:00:00Z",
  },
  {
    ...recordDefaults,
    id: "testimony-003",
    type: "TESTIMONY",
    status: "PROPOSED",
    substatus: "ANTICIPATED",
    witnessPersonRecordId: "person-dferreira",
    party: "neutral",
    category: "Anticipated",
    title: "Case worker testimony could corroborate the shelter-pathway reliance",
    summary:
      "Proposed testimony module for the QCAP coordinator's no-fault pathway statements.",
    content:
      "Denise Ferreira may corroborate that EA Family Shelter access was tied to a no-fault Housing Court pathway and a court-ordered move-out date, supporting the reliance and prejudice theory. Availability and willingness to testify still need confirmation.",
  },

  // ── Case summary (level 0) ────────────────────────────────────────────────
  // The evolving master brief synthesized from the live graph. Sections link
  // back to the records that ground them so the Overview can render chips.
  {
    ...recordDefaults,
    ...acceptedByUser,
    id: "case-summary-faxon",
    type: "CASE_SUMMARY",
    party: "neutral",
    title: "Faxon Commons v. Sweeney — Case Brief",
    summary:
      "Synthesized brief: a nonpayment eviction the defense is reframing around habitability, unlawful entry, and discovery prejudice.",
    content:
      "Living summary of the Faxon Commons matter, regenerated as records are accepted.",
    createdAt: "2026-05-16T18:30:00Z",
    updatedAt: "2026-05-16T18:30:00Z",
    summaryData: {
      caseContextSnapshot: demoCaseContext,
      overview:
        "Faxon Commons brought a summary-process action framed as straightforward nonpayment, seeking possession and a money judgment of roughly $116k. The defense's strategy is to deny the court a ledger-only story: the same period is marked by persistent habitability defects, an unauthorized entry while the household slept, and a RAFT cure plus direct payments that together resolved the June–July arrears before the case advanced. A parallel theme is prejudice — the landlord's filing timing and missing discovery have made key facts harder to prove.\n\nThe graph currently anchors on accepted habitability and payment-cure facts and a trial-ready abatement argument, while the higher-risk equitable-prejudice theory and corroborating case-worker testimony remain proposed pending stronger support. Discovery gaps are the through-line: they weaken causation on the prejudice theory and are the largest open exposure heading toward trial.",
      sections: [
        {
          id: "sum-faxon-claims",
          type: "CLAIMS",
          title: "Claims & posture",
          content:
            "Plaintiffs seek possession and money on a nonpayment theory. Defendants assert habitability, quiet enjoyment, unauthorized entry, failure to mitigate, and c. 93A counterclaims. Posture: motion stage with active discovery disputes.",
          recordIds: ["claim-001", "claim-002", "posture-002"],
          updatedAt: "2026-05-16T18:30:00Z",
        },
        {
          id: "sum-faxon-facts",
          type: "FACTS",
          title: "Load-bearing facts",
          content:
            "The strongest grounded facts are the cured June–July arrears (RAFT approval plus direct payments) and the documented entry-while-asleep incident. Habitability conditions are evidenced by maintenance work orders.",
          recordIds: ["fact-payment-cured", "fact-012", "fact-014"],
          updatedAt: "2026-05-16T18:30:00Z",
        },
        {
          id: "sum-faxon-arguments",
          type: "ARGUMENTS",
          title: "Theory & arguments",
          content:
            "The trial-ready position is that persistent conditions support abatement regardless of the ledger. The equitable-prejudice theory tying filing delay to provable harm is more ambitious and still needs causation support.",
          recordIds: ["arg-007", "arg-003", "theory-002"],
          updatedAt: "2026-05-16T18:30:00Z",
        },
        {
          id: "sum-faxon-risks",
          type: "RISKS",
          title: "Biggest current risk",
          content:
            "Plaintiffs may compress the matter into nonpayment while key discovery stays missing — collapsing the conduct and prejudice themes and leaving the abatement and counterclaim value hard to prove.",
          recordIds: ["fact-002", "arg-003", "objective-001"],
          updatedAt: "2026-05-16T18:30:00Z",
        },
        {
          id: "sum-faxon-next",
          type: "NEXT_STEPS",
          title: "Next steps",
          content:
            "Close the discovery gaps into a proof structure, confirm the corroborating case-worker testimony, and finish exhibit mapping for the affidavit sections.",
          recordIds: ["task-001", "task-002", "task-006"],
          updatedAt: "2026-05-16T18:30:00Z",
        },
        {
          id: "sum-faxon-open",
          type: "OPEN_QUESTIONS",
          title: "Open questions",
          content:
            "How far the prejudice/causation framing can go without overclaiming, and which records custodian the management witness will be.",
          recordIds: ["note-001", "note-003"],
          updatedAt: "2026-05-16T18:30:00Z",
        },
      ],
      generatedFromRecordIds: [
        "claim-001",
        "claim-002",
        "fact-payment-cured",
        "fact-012",
        "fact-014",
        "arg-007",
        "arg-003",
        "theory-002",
      ],
      generatedAt: "2026-05-16T18:30:00Z",
    },
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Graph links
// ─────────────────────────────────────────────────────────────────────────────

const recordTypeById = new Map<string, RecordType>(
  demoRecords.map((record) => [record.id, record.type]),
);

const recordStatusById = new Map<string, RecordStatus>(
  demoRecords.map((record) => [record.id, record.status]),
);

// A record is authoritative once accepted (including while a replacement is
// pending). An accepted link must not point at a non-authoritative record, so
// any ACCEPTED spec touching a proposed/replaced endpoint is normalized down
// to PROPOSED at construction time — keeping the demo graph internally honest.
const isAuthoritativeStatus = (status?: RecordStatus) =>
  status === "ACCEPTED" || status === "PENDING_REPLACEMENT";

const linkStrengthForStatus = (status: LinkStatus): LinkStrength => {
  if (status === "ACCEPTED") return "STRONG";
  if (status === "REJECTED") return "WEAK";
  return "MODERATE";
};

// Explanation is REQUIRED on every edge (mirrors GraphLink.explanation): the
// agent must state why a connection exists. Because a tuple can't carry a
// required element after an optional one, `status` is required too — every spec
// names its status explicitly.
type LinkSpec = [
  fromId: string,
  type: RecordLinkType,
  toId: string,
  status: LinkStatus,
  explanation: string,
  rejectionReason?: string,
];

// Links are authored in their CANONICAL direction (fromRecord → type →
// toRecord). For evidence/contradiction/context the source is the grounding
// record (e.g. a DOCUMENT EVIDENCES a FACT); the inverse label ("Evidenced by")
// is derived in the UI when the target record is viewed. Prefer the most
// specific semantic link available; RELATED_TO should be a sparse last resort.
const linkSpecs: LinkSpec[] = [
  // Theory 1 (adopted) grounding
  ["theory-001", "DEPENDS_ON", "fact-001", "ACCEPTED", "The adopted habitability theory rests on the documented move-in pest and maintenance conditions."],
  ["theory-001", "DEPENDS_ON", "fact-007", "ACCEPTED", "Theory needs the payment history showing rent was substantially paid, defeating any willful-nonpayment narrative."],
  ["theory-001", "DEPENDS_ON", "fact-005", "ACCEPTED", "Theory leans on the missing management records, since the absence of remediation proof strengthens the habitability defense."],
  ["theory-001", "SUPPORTS", "claim-002", "ACCEPTED", "The habitability theory is the through-line that carries the c. 93A and quiet-enjoyment counterclaims."],
  ["theory-001", "CITES", "precedent-001", "PROPOSED", "Theory invokes the Massachusetts quiet-enjoyment and 93A authorities, still pending a cite check."],

  // Theory 2 (proposed equitable prejudice)
  ["theory-002", "DERIVED_FROM", "arg-003", "PROPOSED", "Equitable-prejudice theory was synthesized from the filing-delay argument about the agreed cure deadline."],
  ["theory-002", "DEPENDS_ON", "fact-002", "PROPOSED", "Theory turns on the RAFT application date establishing a timely cure attempt."],
  ["theory-002", "DEPENDS_ON", "fact-010", "PROPOSED", "Theory relies on the RAFT cure payment as proof the arrears were actively being resolved."],
  ["docrec-cert-letter", "EVIDENCES", "theory-002", "PROPOSED", "QCAP certification letter is the primary source for the timely-cure premise the theory depends on."],
  ["docrec-agreement-deadline", "EVIDENCES", "theory-002", "PROPOSED", "Agreement deadline document anchors the claim that plaintiffs filed despite an agreed timeline."],
  ["theory-002", "EXPLAINS", "issue-003", "PROPOSED", "Theory frames why the filing-delay issue matters: plaintiffs proceeded against their own agreed deadline."],

  // Claims
  ["docrec-notice-first", "EVIDENCES", "claim-001", "ACCEPTED", "The first notice to quit is the founding document for plaintiffs' nonpayment claim."],
  ["claim-001", "INVOLVES", "person-fc-management", "ACCEPTED", "The nonpayment claim is asserted by Faxon Commons management as plaintiff and landlord."],
  ["claim-002", "DEPENDS_ON", "fact-001", "ACCEPTED", "The counterclaims rest on the move-in habitability conditions as their factual core."],
  ["claim-002", "DEPENDS_ON", "fact-008", "ACCEPTED", "The counterclaims draw on the documented hardship and disability-accommodation facts."],
  ["docrec-maintenance-orders", "EVIDENCES", "claim-002", "ACCEPTED", "Maintenance work orders evidence the conditions underlying the habitability counterclaim."],

  // Objectives
  ["objective-001", "REQUIRES", "theory-001", "ACCEPTED", "This objective can't be pursued until the habitability theory is settled as the case's spine."],
  ["objective-002", "REQUIRES", "issue-003", "ACCEPTED", "Objective depends on resolving the filing-delay issue in our favor first."],
  ["objective-003", "REQUIRES", "issue-002", "PROPOSED", "Objective hinges on the discovery-gaps issue being established."],
  ["objective-003", "REQUIRES", "arg-002", "PROPOSED", "Objective needs the unreliable-records argument to land before it is achievable."],

  // Posture
  [
    "posture-002",
    "DERIVED_FROM",
    "posture-003",
    "ACCEPTED",
    "Current trial posture was synthesized after replacing the older discovery-complete posture.",
  ],
  ["posture-002", "LEADS_TO", "task-001", "ACCEPTED", "The trial posture makes the trial-prep task the immediate next step."],
  ["posture-002", "LEADS_TO", "task-002", "ACCEPTED", "The trial posture drives the outstanding discovery task before trial."],
  ["posture-002", "SUPPORTS", "objective-003", "ACCEPTED", "The current posture is favorable to the discovery-leverage objective."],

  // Issues
  ["issue-001", "DEPENDS_ON", "fact-001", "ACCEPTED", "Whether habitability offsets the rent claim turns first on the move-in conditions fact."],
  ["issue-001", "DEPENDS_ON", "fact-003", "ACCEPTED", "The offset issue must also weigh the landlord's contrary completion-code records."],
  ["issue-002", "DEPENDS_ON", "fact-005", "PROPOSED", "The discovery-gaps issue is defined by the specific management records that are missing."],
  ["docrec-discovery-gaps", "EVIDENCES", "issue-002", "PROPOSED", "Discovery-gaps memo documents the categories of records plaintiffs failed to produce."],
  ["issue-003", "DEPENDS_ON", "fact-002", "PROPOSED", "Filing-delay issue rests on the RAFT application date showing a cure in progress."],
  ["issue-003", "DEPENDS_ON", "fact-010", "PROPOSED", "Issue also relies on the RAFT cure payment as evidence of good-faith resolution."],
  ["issue-006", "DEPENDS_ON", "fact-010", "PROPOSED", "The RAFT issue is framed around the cure-payment fact."],
  ["docrec-raft-approval", "EVIDENCES", "issue-006", "PROPOSED", "RAFT approval record is the source that defines the RAFT issue."],

  // Arguments
  ["arg-002", "DERIVED_FROM", "arg-old-discovery-sanctions", "PROPOSED", "Reframed from the older sanctions-first argument into a narrower records-reliability attack."],
  ["arg-002", "DEPENDS_ON", "issue-002", "PROPOSED", "Argument is built on the discovery-gaps issue."],
  ["arg-002", "DEPENDS_ON", "fact-005", "PROPOSED", "Argument needs the specific missing records to show the clean-record story is incomplete."],
  ["docrec-discovery-gaps", "EVIDENCES", "arg-002", "PROPOSED", "Discovery-gaps memo is the evidentiary basis for the unreliable-records argument."],
  ["arg-002", "INVOLVES", "person-fc-management", "PROPOSED", "Argument targets management as the party that controlled and withheld the records."],
  ["arg-002", "CITES", "precedent-003", "PROPOSED", "Argument cites discovery authority on the consequences of incomplete production."],
  ["arg-old-discovery-sanctions", "DEPENDS_ON", "issue-002", "ACCEPTED", "The retired sanctions argument also rested on the discovery-gaps issue."],
  ["arg-003", "DEPENDS_ON", "fact-002", "ACCEPTED", "Filing-delay argument depends on the RAFT application date."],
  ["docrec-cert-letter", "EVIDENCES", "arg-003", "ACCEPTED", "Certification letter evidences the timely-cure premise of the filing-delay argument."],
  ["arg-005", "DEPENDS_ON", "fact-003", "PROPOSED", "Conditions argument engages the landlord's completion-code records directly."],
  ["docrec-maintenance-orders", "EVIDENCES", "arg-005", "PROPOSED", "Work orders supply the maintenance record the conditions argument turns on."],
  ["arg-006", "DEPENDS_ON", "fact-010", "PROPOSED", "RAFT-timing argument rests on the cure-payment fact."],
  ["docrec-raft-approval", "EVIDENCES", "arg-006", "PROPOSED", "RAFT approval record evidences the timing the argument asserts."],
  // Conflict demo: this proposed argument leans on fact-old-raft-timing, which
  // is itself mid-replacement (fact-002 would replace it). arg-006 therefore
  // can't be accepted until it is re-evaluated against fact-002.
  [
    "fact-old-raft-timing",
    "CONTEXTUALIZES",
    "arg-006",
    "PROPOSED",
    "Relies on the filing-delay framing currently under replacement review.",
  ],

  // Facts → sources / people / contradictions
  ["docrec-maintenance-orders", "EVIDENCES", "fact-001", "ACCEPTED", "Work orders corroborate the persistent pest and maintenance conditions."],
  ["docrec-photos-metadata", "EVIDENCES", "fact-001", "ACCEPTED", "Time-stamped photos document the move-in conditions firsthand."],
  [
    "fact-003",
    "CONTRADICTS",
    "fact-001",
    "PROPOSED",
    "Landlord completion codes conflict with tenant condition evidence.",
  ],
  ["fact-001", "INVOLVES", "person-msweeney", "ACCEPTED", "The conditions fact is grounded in the tenant's own lived experience."],
  ["docrec-cert-letter", "EVIDENCES", "fact-002", "PROPOSED", "Certification letter establishes the RAFT application date asserted by the fact."],
  ["docrec-affidavit-hardship", "EVIDENCES", "fact-002", "PROPOSED", "Affidavit hardship section corroborates the timing of the RAFT application."],
  ["fact-002", "DERIVED_FROM", "fact-old-raft-timing", "PROPOSED", "Sharpened from the older, vaguer RAFT-timing fact with a specific date."],
  ["fact-002", "INVOLVES", "person-dferreira", "PROPOSED", "RAFT fact involves Ferreira, whose contributions funded part of the cure."],
  ["docrec-cert-letter", "EVIDENCES", "fact-old-raft-timing", "ACCEPTED", "Certification letter was the original source for the now-superseded timing fact."],
  ["docrec-maintenance-orders", "EVIDENCES", "fact-003", "PROPOSED", "Completion codes in the work orders are the basis for the landlord's remediation fact."],
  ["fact-003", "INVOLVES", "person-fc-management", "PROPOSED", "The completion-code fact reflects management's own record-keeping."],
  ["docrec-discovery-gaps", "EVIDENCES", "fact-005", "ACCEPTED", "Discovery-gaps memo identifies precisely which management records are missing."],
  ["docrec-affidavit-payments", "EVIDENCES", "fact-007", "ACCEPTED", "Affidavit payment section documents the rent and arrears paid over the tenancy."],
  ["docrec-raft-approval", "EVIDENCES", "fact-007", "ACCEPTED", "RAFT approval shows the assistance portion of the total payments."],
  ["docrec-affidavit-hardship", "EVIDENCES", "fact-008", "ACCEPTED", "Affidavit hardship section establishes the disability and hardship facts."],
  ["fact-008", "INVOLVES", "person-msweeney", "ACCEPTED", "The hardship fact concerns the tenant's own household circumstances."],
  ["docrec-affidavit-raft", "EVIDENCES", "fact-010", "PROPOSED", "Affidavit RAFT section documents the cure payment."],
  ["docrec-raft-approval", "EVIDENCES", "fact-010", "PROPOSED", "RAFT approval letter corroborates the cure amount and date."],

  // Timeline events
  ["docrec-notice-first", "EVIDENCES", "timeline-001", "ACCEPTED", "The notice-to-quit document fixes the date the first notice was served."],
  ["docrec-cert-letter", "EVIDENCES", "timeline-002", "PROPOSED", "Certification letter dates the RAFT certification event."],
  ["timeline-002", "INVOLVES", "person-msweeney", "PROPOSED", "The RAFT certification event involves the tenant as the applicant."],
  [
    "docrec-raft-approval",
    "EVIDENCES",
    "timeline-007",
    "PROPOSED",
    "Approval date asserted as July 28; timeline file lists July 24.",
  ],
  ["docrec-affidavit-raft", "EVIDENCES", "timeline-007", "PROPOSED", "Affidavit RAFT section gives the tenant's account of the approval date."],
  ["fact-010", "CONTEXTUALIZES", "timeline-009", "ACCEPTED", "The RAFT cure payment frames the notice event, showing arrears were being addressed when notice issued."],
  ["docrec-agreement-deadline", "EVIDENCES", "timeline-011", "ACCEPTED", "Agreement document dates the agreed cure/move-out deadline event."],
  ["timeline-011", "LEADS_TO", "issue-003", "ACCEPTED", "The agreed deadline is what gives rise to the filing-delay issue."],
  ["docrec-discovery-gaps", "EVIDENCES", "timeline-013", "ACCEPTED", "Discovery-gaps memo marks when the production deficiencies first surfaced."],
  ["timeline-013", "SUPPORTS", "issue-002", "ACCEPTED", "The discovery-deficiency event substantiates the discovery-gaps issue."],

  // Testimony
  ["testimony-001", "INVOLVES", "person-msweeney", "ACCEPTED", "The anticipated testimony is the tenant's own."],
  ["testimony-001", "DEPENDS_ON", "fact-001", "ACCEPTED", "Tenant testimony anchors the move-in conditions fact."],
  ["testimony-001", "DEPENDS_ON", "fact-008", "ACCEPTED", "Testimony also carries the hardship and accommodation facts."],
  ["docrec-affidavit-entry", "EVIDENCES", "testimony-001", "ACCEPTED", "Affidavit entry section previews the tenant's testimony on the entry incident."],
  ["testimony-002", "INVOLVES", "person-fc-management", "PROPOSED", "The proposed testimony would come from management."],
  ["testimony-002", "DEPENDS_ON", "fact-005", "PROPOSED", "Management would be examined on the records shown to be missing."],
  ["testimony-002", "DEPENDS_ON", "fact-003", "PROPOSED", "Examination would probe the completion-code records management asserts."],

  // Precedent
  ["precedent-001", "SUPPORTS", "issue-001", "PROPOSED", "Quiet-enjoyment and 93A authority supports our side of the habitability-offset issue."],
  ["precedent-003", "SUPPORTS", "issue-002", "PROPOSED", "Discovery authority supports the consequences we seek on the discovery-gaps issue."],

  // Tasks
  ["task-001", "REQUIRES", "theory-001", "ACCEPTED", "Trial-prep task can't proceed until the habitability theory is locked."],
  ["task-001", "REQUIRES", "claim-002", "ACCEPTED", "Task organizes the proof for the habitability counterclaim."],
  ["task-002", "REQUIRES", "issue-002", "PROPOSED", "Discovery task can't proceed until the discovery-gaps issue is accepted."],
  ["task-002", "REQUIRES", "fact-005", "PROPOSED", "Task requires the missing-records fact to be confirmed before it can proceed."],
  ["task-006", "REQUIRES", "timeline-007", "ACCEPTED", "Task needs the RAFT approval date resolved before it can proceed."],
  ["task-006", "REQUIRES", "timeline-011", "ACCEPTED", "Task depends on the agreed-deadline event for its timeline."],

  // Notes
  ["note-001", "EXPLAINS", "issue-002", "ACCEPTED", "Strategy note explains how to exploit the discovery-gaps issue at cross-examination."],
  ["note-001", "SUPPORTS", "arg-002", "ACCEPTED", "Note reinforces the unreliable-records argument with a concrete cross-exam plan."],
  ["note-003", "EXPLAINS", "fact-005", "ACCEPTED", "Note clarifies the human-corrected framing of the missing-records fact."],
  [
    "note-003",
    "ATTACKS",
    "arg-old-discovery-sanctions",
    "ACCEPTED",
    "Human correction undercuts the older, sanctions-first framing if it implies intentional withholding.",
  ],
  [
    "note-003",
    "SUPPORTS",
    "arg-002",
    "ACCEPTED",
    "Human correction supports the narrower missing-record framing without overclaiming intent.",
  ],

  // ── New records: grounding for the expanded document set ──────────────────
  // Entry fact + its sources / witness
  ["docrec-affidavit-entry", "EVIDENCES", "fact-012", "ACCEPTED", "Affidavit entry section is the source for the July 2025 entry-while-asleep fact."],
  ["fact-012", "INVOLVES", "person-msweeney", "ACCEPTED", "The entry incident happened to the tenant's household."],
  ["docrec-affidavit-entry", "EVIDENCES", "fact-014", "ACCEPTED", "Affidavit entry section also grounds the safety-needs framing fact."],
  ["fact-014", "INVOLVES", "person-msweeney", "ACCEPTED", "The safety-needs fact concerns the tenant's household."],
  ["claim-002", "DEPENDS_ON", "fact-012", "ACCEPTED", "The quiet-enjoyment counterclaim depends on the unauthorized-entry fact."],
  ["testimony-001", "DEPENDS_ON", "fact-012", "ACCEPTED", "Tenant testimony will recount the entry incident."],

  // Habitability argument (accepted) grounding
  ["arg-007", "DEPENDS_ON", "fact-001", "ACCEPTED", "Habitability argument rests on the move-in conditions fact."],
  ["arg-007", "SUPPORTS", "issue-001", "ACCEPTED", "Argument advances our position on the habitability-offset issue."],
  ["docrec-maintenance-orders", "EVIDENCES", "arg-007", "ACCEPTED", "Work orders evidence the conditions the habitability argument asserts."],

  // Affidavit notice/filing-delay sections ground accepted timeline events
  ["docrec-affidavit-notices", "EVIDENCES", "timeline-009", "ACCEPTED", "Affidavit notices section dates the notice event on the timeline."],
  ["docrec-affidavit-filing-delay", "EVIDENCES", "timeline-011", "ACCEPTED", "Affidavit filing-delay section corroborates the agreed-deadline event."],

  // Payment fact grounded by the rent ledger section
  ["docrec-raft-ledger", "EVIDENCES", "fact-007", "ACCEPTED", "Rent ledger section documents the payment-history total."],
  ["docrec-raft-cure-detail", "EVIDENCES", "fact-010", "PROPOSED", "RAFT cure-detail section breaks down the cure payment."],

  // Missing-record fact grounded by the per-category discovery sections
  ["docrec-discovery-entry-logs", "EVIDENCES", "fact-005", "ACCEPTED", "Entry-log discovery section shows that record category was never produced."],
  ["docrec-discovery-vendor-records", "EVIDENCES", "fact-005", "ACCEPTED", "Vendor-records discovery section confirms another missing category."],
  ["docrec-discovery-internal-comms", "EVIDENCES", "issue-002", "PROPOSED", "Missing internal communications feed the discovery-gaps issue."],
  ["docrec-discovery-decision-docs", "EVIDENCES", "issue-002", "PROPOSED", "Missing decision documents further the discovery-gaps issue."],

  // Proposed records (sequencing, conditions, completion codes)
  ["docrec-affidavit-notices", "EVIDENCES", "fact-013", "PROPOSED", "Affidavit notices section supports the notice-sequencing fact."],
  ["fact-013", "DEPENDS_ON", "fact-010", "PROPOSED", "Sequencing fact relies on the RAFT cure-payment timing."],
  ["docrec-maintenance-completion-codes", "EVIDENCES", "fact-003", "PROPOSED", "Completion-codes record is the source for the landlord's remediation fact."],
  ["docrec-affidavit-conditions", "CONTEXTUALIZES", "fact-003", "PROPOSED", "Affidavit conditions section provides the tenant's context against the completion codes."],
  ["docrec-notice-first-service", "EVIDENCES", "claim-001", "PROPOSED", "Proof-of-service record supports the nonpayment claim's procedural footing."],
  ["docrec-agreement-sept-emails", "EVIDENCES", "theory-002", "PROPOSED", "September emails evidence the parties' agreed timeline behind the equitable theory."],
  ["docrec-raft-payment-breakdown", "EVIDENCES", "arg-006", "PROPOSED", "Payment breakdown evidences the RAFT timing the argument asserts."],
  ["docrec-agreement-nofault-terms", "EVIDENCES", "timeline-011", "ACCEPTED", "No-fault agreement terms date and define the agreed-deadline event."],

  // Proposed corroborating-witness testimony
  ["testimony-003", "INVOLVES", "person-dferreira", "PROPOSED", "The corroborating testimony would come from Ferreira."],
  ["testimony-003", "DEPENDS_ON", "fact-002", "PROPOSED", "Ferreira's testimony would corroborate the RAFT application timing."],
  ["docrec-affidavit-hardship", "EVIDENCES", "testimony-003", "PROPOSED", "Affidavit hardship section previews the corroborating testimony."],

  // ── Facts cite narrow, single-point document records ──────────────────────
  ["docrec-affidavit-116k-figure", "EVIDENCES", "fact-007", "ACCEPTED", "The affidavit's $116k figure is the precise source for the payment-total fact."],
  ["docrec-affidavit-autism-dx", "EVIDENCES", "fact-008", "ACCEPTED", "The affidavit's diagnosis line grounds the disability hardship fact."],
  ["docrec-affidavit-netting", "EVIDENCES", "fact-012", "ACCEPTED", "The affidavit's window-netting passage supports the entry-incident fact."],
  ["docrec-affidavit-entry-asleep", "EVIDENCES", "fact-012", "ACCEPTED", "The affidavit's 'entry while asleep' line is the direct source for the entry fact."],
  ["docrec-affidavit-netting", "EVIDENCES", "fact-014", "ACCEPTED", "The affidavit's window-netting passage also grounds the safety-needs fact."],
  ["docrec-affidavit-qcap-statement", "EVIDENCES", "fact-002", "PROPOSED", "The affidavit's QCAP statement evidences the RAFT application date."],
  ["docrec-affidavit-raft-date", "EVIDENCES", "fact-010", "PROPOSED", "The affidavit's RAFT-date line documents the cure-payment date."],
  ["docrec-raft-approval-letter", "EVIDENCES", "fact-010", "PROPOSED", "RAFT approval letter corroborates the cure payment."],
  ["docrec-affidavit-raft-date", "EVIDENCES", "timeline-007", "PROPOSED", "The affidavit's RAFT-date line gives the tenant's account of the approval timeline."],
  ["docrec-raft-approval-letter", "EVIDENCES", "timeline-007", "PROPOSED", "Approval letter is the documentary source for the RAFT approval event."],

  // ── Historical links retained on replaced records ───────────────────────
  // Specified as ACCEPTED (they were real when authored); the builder normalizes
  // them to PROPOSED because an endpoint is now retired, so they stay hidden on
  // the live records and surface only inside the replaced record's inspector.
  ["posture-003", "CONTEXTUALIZES", "objective-001", "ACCEPTED", "The retired discovery-complete posture framed this objective when it was authored."],
  ["posture-003", "CONTEXTUALIZES", "task-001", "ACCEPTED", "The retired posture set the original context for this trial-prep task."],
  ["docrec-affidavit-entry", "EVIDENCES", "fact-old-entry-vague", "ACCEPTED", "Affidavit entry section was the source for the now-superseded vague entry fact."],
  ["fact-old-entry-vague", "INVOLVES", "person-msweeney", "ACCEPTED", "The superseded entry fact concerned the tenant's household."],
  [
    "fact-014",
    "DERIVED_FROM",
    "fact-old-entry-vague",
    "ACCEPTED",
    "Accepted entry fact replaces the earlier vague netting description with a more specific safety-needs framing.",
  ],
  ["docrec-discovery-gaps-v0", "EVIDENCES", "fact-005", "ACCEPTED", "Earlier discovery-gaps draft originally grounded the missing-records fact."],

  // ── Grounding for the split/merge version-history facts ───────────────────
  // Live successors are grounded in authoritative document records.
  ["docrec-maintenance-orders", "EVIDENCES", "fact-habitability-mold", "ACCEPTED", "Work orders evidence the mold-specific habitability successor fact."],
  ["docrec-maintenance-orders", "EVIDENCES", "fact-habitability-heat", "ACCEPTED", "Work orders evidence the heat-specific habitability successor fact."],
  ["docrec-raft-ledger", "EVIDENCES", "fact-payment-cured", "ACCEPTED", "Rent ledger evidences the merged cured-payment fact."],
  // Retired sources keep their original grounding (normalized to PROPOSED by the
  // builder because the fact endpoint is now REPLACED) so it shows in-inspector.
  ["docrec-maintenance-orders", "EVIDENCES", "fact-habitability-broad", "ACCEPTED", "Work orders were the original grounding for the retired broad habitability fact."],
  ["docrec-raft-ledger", "EVIDENCES", "fact-payment-raft-only", "ACCEPTED", "Rent ledger originally grounded the retired RAFT-only payment fact."],
];

export const demoLinks: GraphLink[] = linkSpecs.map(
  ([fromId, type, toId, status, explanation, rejectionReason], index) => {
    const fromRecordType = recordTypeById.get(fromId);
    const toRecordType = recordTypeById.get(toId);

    if (!fromRecordType || !toRecordType) {
      throw new Error(`Demo link references unknown record: ${fromId} → ${toId}`);
    }

    const endpointsAuthoritative =
      isAuthoritativeStatus(recordStatusById.get(fromId)) &&
      isAuthoritativeStatus(recordStatusById.get(toId));
    // A link can only be ACCEPTED if both endpoints are authoritative.
    const normalizedStatus: LinkStatus =
      status === "ACCEPTED" && !endpointsAuthoritative ? "PROPOSED" : status;

    return {
      id: `link-${String(index + 1).padStart(3, "0")}`,
      workspaceId: DEMO_WORKSPACE_ID,
      caseId: DEMO_CASE_ID,
      fromRecordId: fromId,
      fromRecordType,
      toRecordId: toId,
      toRecordType,
      type,
      status: normalizedStatus,
      strength: linkStrengthForStatus(normalizedStatus),
      explanation,
      ...(normalizedStatus === "REJECTED" && rejectionReason
        ? { rejectionReason }
        : {}),
      createdBy: "agent",
      ...(normalizedStatus === "ACCEPTED"
        ? { approvedByUserId: demoUserId, approvedAt: "2026-05-15T16:00:00Z" }
        : {}),
      createdAt: "2026-05-14T12:00:00Z",
      updatedAt: "2026-05-16T12:00:00Z",
    };
  },
);

// ─────────────────────────────────────────────────────────────────────────────
// Activity feed (UI-only demo data)
// ─────────────────────────────────────────────────────────────────────────────

export type DemoActivity = {
  id: string;
  actor: string;
  action: string;
  time: string;
  tone: "info" | "success" | "warning";
};

export const demoActivity: DemoActivity[] = [
  {
    id: "act-001",
    actor: "Case Agent",
    action:
      "Proposed equitable-prejudice theory to replace the narrower mitigation argument.",
    time: "8 minutes ago",
    tone: "info",
  },
  {
    id: "act-002",
    actor: "Matthew Sweeney",
    action:
      "Accepted discovery-gap fact after comparing requests against supplemental responses.",
    time: "42 minutes ago",
    tone: "success",
  },
  {
    id: "act-003",
    actor: "Case Agent",
    action:
      "Flagged photo metadata and OCR extraction issues before exhibit mapping.",
    time: "1 hour ago",
    tone: "warning",
  },
  {
    id: "act-004",
    actor: "Case Agent",
    action:
      "Split the affidavit into four document records and linked them to payment, RAFT, entry, and hardship facts.",
    time: "2 hours ago",
    tone: "info",
  },
  {
    id: "act-005",
    actor: "Matthew Sweeney",
    action:
      "Pinned correction note limiting unsupported claims about intentional withholding.",
    time: "3 hours ago",
    tone: "success",
  },
  {
    id: "act-006",
    actor: "Case Agent",
    action:
      "Proposed RAFT cure and second-notice issue after comparing affidavit against the timeline file.",
    time: "4 hours ago",
    tone: "warning",
  },
  {
    id: "act-007",
    actor: "Matthew Sweeney",
    action:
      "Accepted task to reconcile affidavit dates against exhibits before trial use.",
    time: "5 hours ago",
    tone: "success",
  },
  {
    id: "act-008",
    actor: "Case Agent",
    action:
      "Linked Agreement to Vacate deadline to the October nonpayment filing and equitable-prejudice theory.",
    time: "6 hours ago",
    tone: "info",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Demo agent chat thread (UI-only demo data)
// ─────────────────────────────────────────────────────────────────────────────

export type DemoAgentMessage = {
  id: string;
  role: "user" | "agent";
  content: string;
  // Record IDs the agent cited; rendered as clickable chips.
  citedRecordIds?: string[];
  time: string;
};

export const demoAgentThread: DemoAgentMessage[] = [
  {
    id: "msg-001",
    role: "user",
    content:
      "What are the weakest points in our filing-delay theory right now?",
    time: "Yesterday, 4:12 PM",
  },
  {
    id: "msg-002",
    role: "agent",
    content:
      "The filing-delay theory has three open weaknesses. First, the mitigation framing needs causation support — the certified letter shows notice, but not that assistance would have succeeded. Second, the RAFT approval date conflicts between the affidavit (July 28) and the timeline file (July 24), which must be reconciled before trial use. Third, the QCAP shelter-pathway statement is single-source and needs corroboration. I proposed an equitable-prejudice reframing that avoids the strict causation problem.",
    citedRecordIds: ["arg-003", "timeline-007", "fact-002", "theory-002"],
    time: "Yesterday, 4:13 PM",
  },
  {
    id: "msg-003",
    role: "user",
    content: "What discovery is still missing that would help?",
    time: "Yesterday, 4:18 PM",
  },
  {
    id: "msg-004",
    role: "agent",
    content:
      "The supplemental production still lacks entry logs, internal communications, extermination vendor records, and eviction decision-making documents. Those gaps support both the adverse-inference issue and the cross-examination module for the management witness. I drafted a blocked task for a discovery-prejudice demonstrative that becomes actionable once the production is reconciled.",
    citedRecordIds: ["fact-005", "issue-002", "testimony-002", "task-002"],
    time: "Yesterday, 4:19 PM",
  },
];

// Default agent instructions shown in the agent view.
export const demoAgentInstructions = [
  "Draft case records as proposals first; never silently promote agent output to accepted.",
  "Ground every strategic record in a document record or accepted fact via links.",
  "Prefer short, reviewable proposals over long freeform analysis.",
  "Flag missing evidence, date conflicts, and unsupported legal citations before trial use.",
];

// ─────────────────────────────────────────────────────────────────────────────
// Bundle export — everything the case route needs for this demo, resolved by
// caseId in caseDemos.ts.
// ─────────────────────────────────────────────────────────────────────────────

export const faxonCaseDemo: CaseDemo = {
  workspaceId: DEMO_WORKSPACE_ID,
  caseId: DEMO_CASE_ID,
  userId: demoUserId,
  meta: demoCase,
  caseContext: demoCaseContext,
  documents: demoDocuments,
  records: demoRecords,
  links: demoLinks,
  activity: demoActivity,
  agentThread: demoAgentThread,
  agentInstructions: demoAgentInstructions,
};
