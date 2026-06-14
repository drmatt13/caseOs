// Hardcoded demo workspace simulating a real case as it would exist in the
// database: typed CaseRecords, GraphLinks between them, CaseDocuments with
// document records extracted from them, and a CaseContext.
//
// Demonstrates every part of the domain model:
//  - records at every level of RECORD_LEVEL (objective → document)
//  - PROPOSED / ACCEPTED / PENDING_REPLACEMENT / REPLACED lifecycles
//  - completed replacements (posture-003 → posture-002, fact-old-entry-vague
//    → fact-014, docrec-discovery-gaps-v0 → docrec-discovery-gaps) and pending
//    ones
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
  LinkStatus,
  RecordLinkType,
  RecordStatus,
  RecordType,
  TypedCaseRecord,
} from "#/types/caseRecords";

export const demoUserId = "5bdbb6c2-877a-4772-ad9e-00a10d6073b5";
export const DEMO_WORKSPACE_ID = "11111111-1111-4111-8111-111111111111";
export const DEMO_CASE_ID = "case-faxon-commons-demo";

// Workspace-level display metrics for the overview dashboard.
export const demoCase = {
  id: DEMO_CASE_ID,
  title: "Faxon Commons v. Sweeney",
  court: "Massachusetts Housing Court, Metro South Division",
  caseNumber: "25H82SP02904",
  client: "Matthew Sweeney",
  health: 78,
  trialReadiness: 64,
  unresolvedGaps: 7,
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
    substatus: "CURRENT",
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
    substatus: "STALE",
    category: "Discovery posture",
    replacedById: "posture-002",
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
    substatus: "NEEDS_SUPPORT",
    supportStatus: "PARTIALLY_SUPPORTED",
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
    substatus: "NEEDS_SUPPORT",
    supportStatus: "PARTIALLY_SUPPORTED",
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
    substatus: "NEEDS_SUPPORT",
    supportStatus: "PARTIALLY_SUPPORTED",
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
    substatus: "NEEDS_SUPPORT",
    supportStatus: "PARTIALLY_SUPPORTED",
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
    substatus: "UNDISPUTED",
    supportStatus: "SUPPORTED",
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
    substatus: "NEEDS_SOURCE_REVIEW",
    supportStatus: "PARTIALLY_SUPPORTED",
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
    substatus: "CONTEXT",
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
    substatus: "DISPUTED",
    supportStatus: "PARTIALLY_SUPPORTED",
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
    substatus: "NEEDS_SOURCE_REVIEW",
    supportStatus: "PARTIALLY_SUPPORTED",
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
    substatus: "UNDISPUTED",
    supportStatus: "SUPPORTED",
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
    substatus: "CONTEXT",
    supportStatus: "SUPPORTED",
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
    substatus: "NEEDS_SOURCE_REVIEW",
    supportStatus: "PARTIALLY_SUPPORTED",
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
    substatus: "CONFIRMED",
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
    substatus: "APPROXIMATE",
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
    substatus: "DATE_CONFLICT",
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
    substatus: "CONFIRMED",
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
    substatus: "CONFIRMED",
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
    substatus: "CONFIRMED",
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
    substatus: "NEEDS_CITE_CHECK",
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
    substatus: "NEEDS_CITE_CHECK",
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
    status: "PROPOSED",
    substatus: "BLOCKED",
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
    substatus: "PINNED",
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
    substatus: "PINNED",
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
    replacedById: "docrec-discovery-gaps",
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
    substatus: "DISPUTED",
    supportStatus: "SUPPORTED",
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
    substatus: "NEEDS_SOURCE_REVIEW",
    supportStatus: "PARTIALLY_SUPPORTED",
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
    substatus: "CONTEXT",
    supportStatus: "SUPPORTED",
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
    substatus: "CONTEXT",
    replacedById: "fact-014",
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
  {
    ...recordDefaults,
    ...humanAuthored,
    ...acceptedByUser,
    id: "arg-007",
    type: "ARGUMENT",
    substatus: "TRIAL_READY",
    supportStatus: "SUPPORTED",
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

type LinkSpec = [
  fromId: string,
  type: RecordLinkType,
  toId: string,
  status?: LinkStatus,
  explanation?: string,
];

// Links are authored in their CANONICAL direction (fromRecord → type →
// toRecord). For evidence/contradiction/context the source is the grounding
// record (e.g. a DOCUMENT EVIDENCES a FACT); the inverse label ("Evidenced by")
// is derived in the UI when the target record is viewed. Prefer the most
// specific semantic link available; RELATED_TO should be a sparse last resort.
const linkSpecs: LinkSpec[] = [
  // Theory 1 (adopted) grounding
  ["theory-001", "DEPENDS_ON", "fact-001", "ACCEPTED"],
  ["theory-001", "DEPENDS_ON", "fact-007", "ACCEPTED"],
  ["theory-001", "DEPENDS_ON", "fact-005", "ACCEPTED"],
  ["theory-001", "SUPPORTS", "claim-002", "ACCEPTED"],
  ["theory-001", "CITES", "precedent-001", "PROPOSED"],

  // Theory 2 (proposed equitable prejudice)
  ["theory-002", "DERIVED_FROM", "arg-003", "PROPOSED"],
  ["theory-002", "DEPENDS_ON", "fact-002", "PROPOSED"],
  ["theory-002", "DEPENDS_ON", "fact-010", "PROPOSED"],
  ["docrec-cert-letter", "EVIDENCES", "theory-002", "PROPOSED"],
  ["docrec-agreement-deadline", "EVIDENCES", "theory-002", "PROPOSED"],
  ["theory-002", "EXPLAINS", "issue-003", "PROPOSED"],

  // Claims
  ["docrec-notice-first", "EVIDENCES", "claim-001", "ACCEPTED"],
  ["claim-001", "INVOLVES", "person-fc-management", "ACCEPTED"],
  ["claim-002", "DEPENDS_ON", "fact-001", "ACCEPTED"],
  ["claim-002", "DEPENDS_ON", "fact-008", "ACCEPTED"],
  ["docrec-maintenance-orders", "EVIDENCES", "claim-002", "ACCEPTED"],

  // Objectives
  ["objective-001", "REQUIRES", "theory-001", "ACCEPTED"],
  ["objective-002", "REQUIRES", "issue-003", "ACCEPTED"],
  ["objective-003", "REQUIRES", "issue-002", "PROPOSED"],
  ["objective-003", "REQUIRES", "arg-002", "PROPOSED"],

  // Posture
  [
    "posture-002",
    "DERIVED_FROM",
    "posture-003",
    "ACCEPTED",
    "Current trial posture was synthesized after replacing the older discovery-complete posture.",
  ],
  ["posture-002", "LEADS_TO", "task-001", "ACCEPTED"],
  ["posture-002", "LEADS_TO", "task-002", "ACCEPTED"],
  ["posture-002", "SUPPORTS", "objective-003", "ACCEPTED"],

  // Issues
  ["issue-001", "DEPENDS_ON", "fact-001", "ACCEPTED"],
  ["issue-001", "DEPENDS_ON", "fact-003", "ACCEPTED"],
  ["issue-002", "DEPENDS_ON", "fact-005", "PROPOSED"],
  ["docrec-discovery-gaps", "EVIDENCES", "issue-002", "PROPOSED"],
  ["issue-003", "DEPENDS_ON", "fact-002", "PROPOSED"],
  ["issue-003", "DEPENDS_ON", "fact-010", "PROPOSED"],
  ["issue-006", "DEPENDS_ON", "fact-010", "PROPOSED"],
  ["docrec-raft-approval", "EVIDENCES", "issue-006", "PROPOSED"],

  // Arguments
  ["arg-002", "DERIVED_FROM", "arg-old-discovery-sanctions", "PROPOSED"],
  ["arg-002", "DEPENDS_ON", "issue-002", "PROPOSED"],
  ["arg-002", "DEPENDS_ON", "fact-005", "PROPOSED"],
  ["docrec-discovery-gaps", "EVIDENCES", "arg-002", "PROPOSED"],
  ["arg-002", "INVOLVES", "person-fc-management", "PROPOSED"],
  ["arg-002", "CITES", "precedent-003", "PROPOSED"],
  ["arg-old-discovery-sanctions", "DEPENDS_ON", "issue-002", "ACCEPTED"],
  ["arg-003", "DEPENDS_ON", "fact-002", "ACCEPTED"],
  ["docrec-cert-letter", "EVIDENCES", "arg-003", "ACCEPTED"],
  ["arg-005", "DEPENDS_ON", "fact-003", "PROPOSED"],
  ["docrec-maintenance-orders", "EVIDENCES", "arg-005", "PROPOSED"],
  ["arg-006", "DEPENDS_ON", "fact-010", "PROPOSED"],
  ["docrec-raft-approval", "EVIDENCES", "arg-006", "PROPOSED"],
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
  ["docrec-maintenance-orders", "EVIDENCES", "fact-001", "ACCEPTED"],
  ["docrec-photos-metadata", "EVIDENCES", "fact-001", "ACCEPTED"],
  [
    "fact-003",
    "CONTRADICTS",
    "fact-001",
    "PROPOSED",
    "Landlord completion codes conflict with tenant condition evidence.",
  ],
  ["fact-001", "INVOLVES", "person-msweeney", "ACCEPTED"],
  ["docrec-cert-letter", "EVIDENCES", "fact-002", "PROPOSED"],
  ["docrec-affidavit-hardship", "EVIDENCES", "fact-002", "PROPOSED"],
  ["fact-002", "DERIVED_FROM", "fact-old-raft-timing", "PROPOSED"],
  ["fact-002", "INVOLVES", "person-dferreira", "PROPOSED"],
  ["docrec-cert-letter", "EVIDENCES", "fact-old-raft-timing", "ACCEPTED"],
  ["docrec-maintenance-orders", "EVIDENCES", "fact-003", "PROPOSED"],
  ["fact-003", "INVOLVES", "person-fc-management", "PROPOSED"],
  ["docrec-discovery-gaps", "EVIDENCES", "fact-005", "ACCEPTED"],
  ["docrec-affidavit-payments", "EVIDENCES", "fact-007", "ACCEPTED"],
  ["docrec-raft-approval", "EVIDENCES", "fact-007", "ACCEPTED"],
  ["docrec-affidavit-hardship", "EVIDENCES", "fact-008", "ACCEPTED"],
  ["fact-008", "INVOLVES", "person-msweeney", "ACCEPTED"],
  ["docrec-affidavit-raft", "EVIDENCES", "fact-010", "PROPOSED"],
  ["docrec-raft-approval", "EVIDENCES", "fact-010", "PROPOSED"],

  // Timeline events
  ["docrec-notice-first", "EVIDENCES", "timeline-001", "ACCEPTED"],
  ["docrec-cert-letter", "EVIDENCES", "timeline-002", "PROPOSED"],
  ["timeline-002", "INVOLVES", "person-msweeney", "PROPOSED"],
  [
    "docrec-raft-approval",
    "EVIDENCES",
    "timeline-007",
    "PROPOSED",
    "Approval date asserted as July 28; timeline file lists July 24.",
  ],
  ["docrec-affidavit-raft", "EVIDENCES", "timeline-007", "PROPOSED"],
  ["fact-010", "CONTEXTUALIZES", "timeline-009", "ACCEPTED"],
  ["docrec-agreement-deadline", "EVIDENCES", "timeline-011", "ACCEPTED"],
  ["timeline-011", "LEADS_TO", "issue-003", "ACCEPTED"],
  ["docrec-discovery-gaps", "EVIDENCES", "timeline-013", "ACCEPTED"],
  ["timeline-013", "SUPPORTS", "issue-002", "ACCEPTED"],

  // Testimony
  ["testimony-001", "INVOLVES", "person-msweeney", "ACCEPTED"],
  ["testimony-001", "DEPENDS_ON", "fact-001", "ACCEPTED"],
  ["testimony-001", "DEPENDS_ON", "fact-008", "ACCEPTED"],
  ["docrec-affidavit-entry", "EVIDENCES", "testimony-001", "ACCEPTED"],
  ["testimony-002", "INVOLVES", "person-fc-management", "PROPOSED"],
  ["testimony-002", "DEPENDS_ON", "fact-005", "PROPOSED"],
  ["testimony-002", "DEPENDS_ON", "fact-003", "PROPOSED"],

  // Precedent
  ["precedent-001", "SUPPORTS", "issue-001", "PROPOSED"],
  ["precedent-003", "SUPPORTS", "issue-002", "PROPOSED"],

  // Tasks
  ["task-001", "REQUIRES", "theory-001", "ACCEPTED"],
  ["task-001", "REQUIRES", "claim-002", "ACCEPTED"],
  ["task-002", "DEPENDS_ON", "issue-002", "PROPOSED"],
  ["task-002", "DEPENDS_ON", "fact-005", "PROPOSED"],
  ["task-006", "REQUIRES", "timeline-007", "ACCEPTED"],
  ["task-006", "REQUIRES", "timeline-011", "ACCEPTED"],

  // Notes
  ["note-001", "EXPLAINS", "issue-002", "ACCEPTED"],
  ["note-001", "SUPPORTS", "arg-002", "ACCEPTED"],
  ["note-003", "EXPLAINS", "fact-005", "ACCEPTED"],
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
  ["docrec-affidavit-entry", "EVIDENCES", "fact-012", "ACCEPTED"],
  ["fact-012", "INVOLVES", "person-msweeney", "ACCEPTED"],
  ["docrec-affidavit-entry", "EVIDENCES", "fact-014", "ACCEPTED"],
  ["fact-014", "INVOLVES", "person-msweeney", "ACCEPTED"],
  ["claim-002", "DEPENDS_ON", "fact-012", "ACCEPTED"],
  ["testimony-001", "DEPENDS_ON", "fact-012", "ACCEPTED"],

  // Habitability argument (accepted) grounding
  ["arg-007", "DEPENDS_ON", "fact-001", "ACCEPTED"],
  ["arg-007", "SUPPORTS", "issue-001", "ACCEPTED"],
  ["docrec-maintenance-orders", "EVIDENCES", "arg-007", "ACCEPTED"],

  // Affidavit notice/filing-delay sections ground accepted timeline events
  ["docrec-affidavit-notices", "EVIDENCES", "timeline-009", "ACCEPTED"],
  ["docrec-affidavit-filing-delay", "EVIDENCES", "timeline-011", "ACCEPTED"],

  // Payment fact grounded by the rent ledger section
  ["docrec-raft-ledger", "EVIDENCES", "fact-007", "ACCEPTED"],
  ["docrec-raft-cure-detail", "EVIDENCES", "fact-010", "PROPOSED"],

  // Missing-record fact grounded by the per-category discovery sections
  ["docrec-discovery-entry-logs", "EVIDENCES", "fact-005", "ACCEPTED"],
  ["docrec-discovery-vendor-records", "EVIDENCES", "fact-005", "ACCEPTED"],
  ["docrec-discovery-internal-comms", "EVIDENCES", "issue-002", "PROPOSED"],
  ["docrec-discovery-decision-docs", "EVIDENCES", "issue-002", "PROPOSED"],

  // Proposed records (sequencing, conditions, completion codes)
  ["docrec-affidavit-notices", "EVIDENCES", "fact-013", "PROPOSED"],
  ["fact-013", "DEPENDS_ON", "fact-010", "PROPOSED"],
  ["docrec-maintenance-completion-codes", "EVIDENCES", "fact-003", "PROPOSED"],
  ["docrec-affidavit-conditions", "CONTEXTUALIZES", "fact-003", "PROPOSED"],
  ["docrec-notice-first-service", "EVIDENCES", "claim-001", "PROPOSED"],
  ["docrec-agreement-sept-emails", "EVIDENCES", "theory-002", "PROPOSED"],
  ["docrec-raft-payment-breakdown", "EVIDENCES", "arg-006", "PROPOSED"],
  ["docrec-agreement-nofault-terms", "EVIDENCES", "timeline-011", "ACCEPTED"],

  // Proposed corroborating-witness testimony
  ["testimony-003", "INVOLVES", "person-dferreira", "PROPOSED"],
  ["testimony-003", "DEPENDS_ON", "fact-002", "PROPOSED"],
  ["docrec-affidavit-hardship", "EVIDENCES", "testimony-003", "PROPOSED"],

  // ── Facts cite narrow, single-point document records ──────────────────────
  ["docrec-affidavit-116k-figure", "EVIDENCES", "fact-007", "ACCEPTED"],
  ["docrec-affidavit-autism-dx", "EVIDENCES", "fact-008", "ACCEPTED"],
  ["docrec-affidavit-netting", "EVIDENCES", "fact-012", "ACCEPTED"],
  ["docrec-affidavit-entry-asleep", "EVIDENCES", "fact-012", "ACCEPTED"],
  ["docrec-affidavit-netting", "EVIDENCES", "fact-014", "ACCEPTED"],
  ["docrec-affidavit-qcap-statement", "EVIDENCES", "fact-002", "PROPOSED"],
  ["docrec-affidavit-raft-date", "EVIDENCES", "fact-010", "PROPOSED"],
  ["docrec-raft-approval-letter", "EVIDENCES", "fact-010", "PROPOSED"],
  ["docrec-affidavit-raft-date", "EVIDENCES", "timeline-007", "PROPOSED"],
  ["docrec-raft-approval-letter", "EVIDENCES", "timeline-007", "PROPOSED"],

  // ── Historical links retained on replaced records ───────────────────────
  // Specified as ACCEPTED (they were real when authored); the builder normalizes
  // them to PROPOSED because an endpoint is now retired, so they stay hidden on
  // the live records and surface only inside the replaced record's inspector.
  ["posture-003", "CONTEXTUALIZES", "objective-001", "ACCEPTED"],
  ["posture-003", "CONTEXTUALIZES", "task-001", "ACCEPTED"],
  ["docrec-affidavit-entry", "EVIDENCES", "fact-old-entry-vague", "ACCEPTED"],
  ["fact-old-entry-vague", "INVOLVES", "person-msweeney", "ACCEPTED"],
  [
    "fact-014",
    "DERIVED_FROM",
    "fact-old-entry-vague",
    "ACCEPTED",
    "Accepted entry fact replaces the earlier vague netting description with a more specific safety-needs framing.",
  ],
  ["docrec-discovery-gaps-v0", "EVIDENCES", "fact-005", "ACCEPTED"],
];

export const demoLinks: GraphLink[] = linkSpecs.map(
  ([fromId, type, toId, status = "ACCEPTED", explanation], index) => {
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
      explanation,
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
