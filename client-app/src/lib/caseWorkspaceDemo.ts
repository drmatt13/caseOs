import type {
  RecordParty,
  RecordStatus,
  ViewTypes,
} from "#/types/caseWorkspace";

export type DemoRecordStatus = RecordStatus;
export type DemoRecordParty = RecordParty;

export type DemoRecord = {
  id: string;
  type: Exclude<ViewTypes, "agent_config" | "case_summary" | "documents_index">;
  title: string;
  miniDescription: string;
  content: string;
  category: string;
  party?: DemoRecordParty;
  status: DemoRecordStatus;
  typeStatus: string;
  createdBy: "Human" | "CaseOS Agent";
  updatedAt: string;
  date?: string;
  priority?: "Low" | "Medium" | "High";
  sources: string[];
  linkedRecords: string[];
  supersedes?: {
    id: string;
    title: string;
    summary: string;
  };
};

export type DemoDocument = {
  id: string;
  fileName: string;
  category: string;
  status: "Processed" | "Uploaded" | "Needs review";
  date: string;
  summary: string;
  linkedRecords: number;
  gaps: string[];
};

export type DemoActivity = {
  id: string;
  actor: string;
  action: string;
  time: string;
  tone: "info" | "success" | "warning";
};

export const demoUserId = "5bdbb6c2-877a-4772-ad9e-00a10d6073b5";

export const demoCase = {
  id: "case-faxon-commons-demo",
  title: "Faxon Commons v. Sweeney",
  court: "Massachusetts Housing Court, Metro South Division",
  caseNumber: "25H82SP02904",
  client: "Matthew Sweeney",
  posture: "Motion stage, trial preparation, discovery disputes active",
  risk: "Plaintiffs may compress the story into nonpayment while key discovery remains missing.",
  objective:
    "Defeat or materially reduce possession and money claims while proving habitability, quiet enjoyment, mitigation, and c. 93A counterclaims.",
  health: 78,
  trialReadiness: 64,
  proposalQueue: 14,
  unresolvedGaps: 7,
};

export const demoRecords: DemoRecord[] = [
  {
    id: "fact-001",
    type: "facts",
    title: "Move-in conditions included persistent pest activity",
    miniDescription:
      "Habitability fact tying early tenancy conditions to later notice and rent defenses.",
    content:
      "Defendants report serious pest-related conditions beginning at move-in in 2021, with repeated notice to management and inconsistent remediation.",
    category: "Habitability",
    party: "defense",
    status: "accepted",
    typeStatus: "Undisputed fact",
    createdBy: "Human",
    updatedAt: "May 14, 2026",
    date: "2021-08-01",
    sources: ["Tenant chronology", "Maintenance portal export"],
    linkedRecords: [
      "issue-001",
      "arg-001",
      "timeline-001",
      "fact-003",
      "testimony-002",
    ],
  },
  {
    id: "fact-002",
    type: "facts",
    title: "Management knew delayed filing could affect mitigation pathways",
    miniDescription:
      "Proposed mitigation fact based on the certified request to file promptly.",
    content:
      "Financial hardship and RAFT/shelter timing concerns were communicated before the nonpayment filing, creating a mitigation and causation issue.",
    category: "Mitigation",
    party: "defense",
    status: "proposed",
    typeStatus: "Needs source review",
    createdBy: "CaseOS Agent",
    updatedAt: "May 15, 2026",
    date: "2025-08-05",
    sources: ["Certified letter dated Aug. 5, 2025"],
    linkedRecords: [
      "issue-003",
      "arg-003",
      "arg-004",
      "timeline-006",
      "fact-old-raft-timing",
    ],
    supersedes: {
      id: "fact-old-raft-timing",
      title: "Filing delay was only background context",
      summary:
        "Reframes the delay as a live mitigation and causation fact instead of a background note.",
    },
  },
  {
    id: "fact-old-raft-timing",
    type: "facts",
    title: "Filing delay was only background context",
    miniDescription:
      "Accepted background framing currently under review by a stronger proposed fact.",
    content:
      "Current workspace reasoning treats the delayed filing as procedural background rather than a fact with potential downstream effects on RAFT, shelter access, arrears growth, and transition planning. A newer proposal asks the user to decide whether this framing is too narrow.",
    category: "Mitigation",
    party: "defense",
    status: "supersession_pending",
    typeStatus: "Pending supersession",
    createdBy: "CaseOS Agent",
    updatedAt: "May 14, 2026",
    date: "2025-08-05",
    sources: ["Certified letter dated Aug. 5, 2025", "Hardship communications"],
    linkedRecords: ["fact-002", "issue-003", "arg-004", "timeline-006"],
  },
  {
    id: "issue-001",
    type: "issues",
    title: "Whether habitability conditions offset or defeat rent claim",
    miniDescription:
      "Legal issue connecting condition evidence to rent abatement and counterclaim value.",
    content:
      "The core factual and legal issue is whether prolonged pest and maintenance conditions support defenses, counterclaims, damages, or rent abatement.",
    category: "Legal",
    party: "defense",
    status: "accepted",
    typeStatus: "Open issue",
    createdBy: "Human",
    updatedAt: "May 13, 2026",
    sources: ["Answer and counterclaims", "Tenant chronology"],
    linkedRecords: ["fact-001", "arg-001"],
  },
  {
    id: "issue-002",
    type: "issues",
    title: "Whether missing discovery supports adverse inference",
    miniDescription:
      "Procedural issue for deciding how missing records should shape trial presentation.",
    content:
      "Missing entry logs, internal communications, extermination records, and decision-making documents may justify discovery sanctions or adverse inference framing.",
    category: "Procedural",
    party: "defense",
    status: "proposed",
    typeStatus: "Reserved issue",
    createdBy: "CaseOS Agent",
    updatedAt: "May 15, 2026",
    sources: ["Motion to compel", "Supplemental discovery responses"],
    linkedRecords: ["arg-002", "task-002", "fact-005", "testimony-002"],
  },
  {
    id: "arg-001",
    type: "arguments",
    title: "This is not a ledger-only nonpayment case",
    miniDescription:
      "Primary trial theory for keeping the case broader than rent accounting.",
    content:
      "The defense should resist a narrow rent-ledger frame and present a joined narrative of habitability, notice, management conduct, mitigation, and prejudice.",
    category: "Theory",
    party: "defense",
    status: "accepted",
    typeStatus: "Trial theory",
    createdBy: "Human",
    updatedAt: "May 12, 2026",
    sources: ["Answer", "Discovery timeline", "Tenant chronology"],
    linkedRecords: ["fact-001", "issue-001", "objective-001", "arg-004"],
  },
  {
    id: "arg-002",
    type: "arguments",
    title: "Discovery gaps make Plaintiffs' clean-record story unreliable",
    miniDescription:
      "Discovery theme challenging the completeness and reliability of landlord-side records.",
    content:
      "Where records are selectively unavailable, the argument should focus on control, notice, missing categories, and the prejudice caused by late or incomplete production.",
    category: "Discovery",
    party: "defense",
    status: "proposed",
    typeStatus: "Needs support",
    createdBy: "CaseOS Agent",
    updatedAt: "May 15, 2026",
    sources: ["Renewed motion to compel", "Meet-and-confer order"],
    linkedRecords: [
      "issue-002",
      "task-002",
      "fact-005",
      "testimony-002",
      "arg-old-discovery-sanctions",
    ],
    supersedes: {
      id: "arg-old-discovery-sanctions",
      title: "Discovery argument depends entirely on sanctions",
      summary:
        "Narrows the older framing into a trial theme that can stand even without a separate sanctions order.",
    },
  },
  {
    id: "arg-old-discovery-sanctions",
    type: "arguments",
    title: "Discovery argument depends entirely on sanctions",
    miniDescription:
      "Accepted discovery framing now challenged by a broader trial-theme proposal.",
    content:
      "Current strategy treats missing discovery mainly as support for sanctions or a standalone discovery motion. A newer proposal asks whether that framing is too brittle for trial because the same record gaps may matter even without a sanctions order, especially for credibility, prejudice, and missing-proof themes.",
    category: "Discovery",
    party: "defense",
    status: "supersession_pending",
    typeStatus: "Pending supersession",
    createdBy: "CaseOS Agent",
    updatedAt: "May 14, 2026",
    sources: ["Renewed motion to compel", "Meet-and-confer order"],
    linkedRecords: ["arg-002", "issue-002", "task-002", "objective-003"],
  },
  {
    id: "timeline-001",
    type: "timeline",
    title: "Notice to quit served",
    miniDescription:
      "Procedural anchor event for the summary process timeline.",
    content:
      "Plaintiffs served a nonpayment notice to quit, starting the procedural path toward summary process.",
    category: "Filing",
    party: "plaintiff",
    status: "accepted",
    typeStatus: "Confirmed event",
    createdBy: "Human",
    updatedAt: "May 11, 2026",
    date: "2025-06-17",
    sources: ["Notice to quit"],
    linkedRecords: ["fact-002", "issue-003"],
  },
  {
    id: "timeline-002",
    type: "timeline",
    title: "Certified request to file promptly",
    miniDescription:
      "Communication event that supports mitigation and timing arguments.",
    content:
      "Defendants asked Plaintiffs to file promptly because timing affected mitigation and housing-assistance options.",
    category: "Communication",
    party: "defense",
    status: "proposed",
    typeStatus: "Approximate event",
    createdBy: "CaseOS Agent",
    updatedAt: "May 15, 2026",
    date: "2025-08-05",
    sources: ["Certified letter", "USPS receipt"],
    linkedRecords: ["fact-002", "arg-003"],
  },
  {
    id: "task-001",
    type: "tasks",
    title: "Build trial exhibit map",
    miniDescription:
      "High-priority preparation task for tying claims and defenses to proof.",
    content:
      "Create a table that maps each defense element and counterclaim element to exhibits, witnesses, and missing discovery.",
    category: "Trial prep",
    status: "accepted",
    typeStatus: "Open task",
    createdBy: "Human",
    updatedAt: "May 15, 2026",
    priority: "High",
    sources: ["Case strategy"],
    linkedRecords: ["arg-001", "issue-001", "task-003", "fact-005"],
  },
  {
    id: "task-002",
    type: "tasks",
    title: "Prepare discovery-prejudice demonstrative",
    miniDescription:
      "Trial prep item for showing requested, produced, and still-missing discovery.",
    content:
      "Show what was requested, what was produced, what remains missing, and why each gap matters to a live claim or defense.",
    category: "Discovery",
    status: "proposed",
    typeStatus: "Blocked task",
    createdBy: "CaseOS Agent",
    updatedAt: "May 15, 2026",
    priority: "High",
    sources: ["Discovery requests", "Supplemental responses"],
    linkedRecords: ["issue-002", "arg-002", "fact-005", "testimony-002"],
  },
  {
    id: "objective-001",
    type: "objectives",
    title: "Keep the factfinder focused on conduct, not just arrears",
    miniDescription:
      "Active objective that keeps case presentation aligned to landlord conduct and prejudice.",
    content:
      "The case strategy should repeatedly connect rent allegations to landlord conduct, conditions, timing, and evidentiary gaps.",
    category: "Primary",
    party: "defense",
    status: "accepted",
    typeStatus: "Active objective",
    createdBy: "Human",
    updatedAt: "May 10, 2026",
    priority: "High",
    sources: ["Intake objectives"],
    linkedRecords: ["arg-001", "issue-001"],
  },
  {
    id: "note-001",
    type: "case_notes",
    title: "Cross-exam focus: records under management control",
    miniDescription:
      "Pinned strategy note for witness examination on missing management-controlled records.",
    content:
      "Ask concise foundation questions establishing that entry logs, work orders, pest records, and internal communications are kept by or available to management.",
    category: "Strategy",
    status: "accepted",
    typeStatus: "Pinned note",
    createdBy: "Human",
    updatedAt: "May 14, 2026",
    sources: ["Strategy session"],
    linkedRecords: ["issue-002", "arg-002"],
  },
  {
    id: "precedent-001",
    type: "legal_precedent",
    title: "Quiet enjoyment and c. 93A authorities need final cite check",
    miniDescription:
      "Research item that should not be used until citations and current-law status are verified.",
    content:
      "The workspace has candidate Massachusetts authority for quiet enjoyment, habitability, and unfair/deceptive conduct, but citations should be verified before filing.",
    category: "Research",
    status: "proposed",
    typeStatus: "Needs cite check",
    createdBy: "CaseOS Agent",
    updatedAt: "May 15, 2026",
    sources: ["Research notes"],
    linkedRecords: ["issue-001", "arg-001"],
  },
  {
    id: "testimony-001",
    type: "testimony",
    title: "Tenant testimony should anchor lived conditions and notice",
    miniDescription:
      "Anticipated testimony module for conditions, notice, hardship, and discovery prejudice.",
    content:
      "Matthew Sweeney can testify to move-in conditions, repeated complaints, July 2025 entry incident, hardship communications, and discovery prejudice.",
    category: "Anticipated",
    party: "defense",
    status: "accepted",
    typeStatus: "Anticipated testimony",
    createdBy: "Human",
    updatedAt: "May 12, 2026",
    sources: ["Intake", "Witness outline"],
    linkedRecords: ["fact-001", "timeline-002"],
  },
  {
    id: "posture-001",
    type: "posture",
    title: "Case is trial-facing with unresolved discovery pressure",
    miniDescription:
      "Current posture note for prioritizing trial prep over broad intake or investigation.",
    content:
      "The immediate posture is not intake or investigation; the system should prioritize trial prep, evidence mapping, and review of proposed discovery arguments.",
    category: "Litigation",
    status: "accepted",
    typeStatus: "Current posture",
    createdBy: "Human",
    updatedAt: "May 15, 2026",
    sources: ["Procedural history"],
    linkedRecords: ["task-001", "task-002", "posture-002"],
  },
  {
    id: "fact-003",
    type: "facts",
    title: "Landlord records characterize pest remediation as completed",
    miniDescription:
      "Disputed landlord-side fact that conflicts with tenant condition evidence.",
    content:
      "Plaintiffs' maintenance materials appear to mark several pest-related work orders as completed, but the tenant chronology and later condition evidence suggest the underlying infestation or recurrence may not have been resolved.",
    category: "Habitability",
    party: "plaintiff",
    status: "proposed",
    typeStatus: "Disputed fact",
    createdBy: "CaseOS Agent",
    updatedAt: "May 16, 2026",
    date: "2021-09-14",
    sources: [
      "Maintenance portal export",
      "Tenant chronology",
      "Apartment condition photos",
    ],
    linkedRecords: ["fact-001", "issue-001", "arg-005", "testimony-002"],
  },
  {
    id: "fact-004",
    type: "facts",
    title: "Photo packet lacks reliable capture metadata for several images",
    miniDescription:
      "Evidence integrity concern affecting how condition photos should be used at trial.",
    content:
      "Several condition photographs in the working packet have useful visual content but incomplete capture metadata, making chronology, authentication, and exhibit sequencing more dependent on testimony and surrounding communications.",
    category: "Evidence integrity",
    status: "proposed",
    typeStatus: "Needs source review",
    createdBy: "CaseOS Agent",
    updatedAt: "May 16, 2026",
    sources: [
      "Apartment condition photos",
      "Photo metadata extraction report",
      "Tenant chronology",
    ],
    linkedRecords: ["issue-004", "task-004", "testimony-001", "testimony-003"],
  },
  {
    id: "fact-005",
    type: "facts",
    title: "Discovery production does not show a complete entry-log chain",
    miniDescription:
      "Missing-record fact that supports discovery pressure without overstating intent.",
    content:
      "The current production does not appear to include a complete chain of entry logs, access records, or internal communications for the disputed entry and maintenance periods. This supports a record-gap theory but still requires careful comparison against the actual requests and responses.",
    category: "Discovery",
    party: "plaintiff",
    status: "accepted",
    typeStatus: "Needs source review",
    createdBy: "Human",
    updatedAt: "May 16, 2026",
    sources: [
      "Discovery requests",
      "Plaintiffs supplemental discovery responses",
      "Meet-and-confer order",
    ],
    linkedRecords: ["issue-002", "arg-002", "task-002", "testimony-002"],
  },
  {
    id: "fact-006",
    type: "facts",
    title: "Extracted discovery text omits portions of the response tables",
    miniDescription:
      "Document extraction weakness that could distort search and agent summaries.",
    content:
      "The extracted text from Plaintiffs' supplemental discovery responses appears to omit or flatten portions of table-based responses, so search results and agent summaries should be checked against the PDF image before any representation is used.",
    category: "Evidence integrity",
    status: "proposed",
    typeStatus: "Needs source review",
    createdBy: "CaseOS Agent",
    updatedAt: "May 16, 2026",
    sources: [
      "Plaintiffs Supplemental Discovery Responses.pdf",
      "OCR extraction log",
    ],
    linkedRecords: ["issue-004", "task-004", "note-003"],
  },
  {
    id: "issue-003",
    type: "issues",
    title: "Whether filing delay caused legally meaningful prejudice",
    miniDescription:
      "Strategic issue separating strict mitigation from broader equitable prejudice.",
    content:
      "The key question is whether the timing and handling of the filing materially affected Defendants' assistance, housing, negotiation, or litigation position in a way the court can credit without overclaiming causation.",
    category: "Strategic",
    party: "defense",
    status: "proposed",
    typeStatus: "Open issue",
    createdBy: "CaseOS Agent",
    updatedAt: "May 16, 2026",
    sources: ["Certified filing request", "Hardship communications"],
    linkedRecords: ["fact-002", "arg-003", "arg-004", "timeline-006"],
  },
  {
    id: "issue-004",
    type: "issues",
    title: "Whether evidence integrity limits condition exhibit strength",
    miniDescription:
      "Proof issue for photo metadata gaps and incomplete extraction artifacts.",
    content:
      "The workspace should distinguish between evidence that is visually persuasive and evidence that is cleanly authenticated. Metadata gaps and imperfect extraction do not make the evidence unusable, but they affect foundation, sequencing, and proof weight.",
    category: "Evidence",
    status: "proposed",
    typeStatus: "Reserved issue",
    createdBy: "CaseOS Agent",
    updatedAt: "May 16, 2026",
    sources: [
      "Photo metadata extraction report",
      "OCR extraction log",
      "Apartment condition photos",
    ],
    linkedRecords: ["fact-004", "fact-006", "task-004", "testimony-001"],
  },
  {
    id: "issue-005",
    type: "issues",
    title: "Whether completed work orders prove remediation or only response activity",
    miniDescription:
      "Fact/legal bridge for interpreting landlord maintenance records.",
    content:
      "A completed work order may prove that management logged or attempted a response, but it does not necessarily prove durable remediation. The distinction matters for habitability, notice, and credibility.",
    category: "Factual",
    status: "proposed",
    typeStatus: "Open issue",
    createdBy: "CaseOS Agent",
    updatedAt: "May 16, 2026",
    sources: ["Maintenance portal export", "Tenant chronology"],
    linkedRecords: ["fact-003", "arg-005", "testimony-002", "note-002"],
  },
  {
    id: "arg-003",
    type: "arguments",
    title: "Filing delay supports a mitigation theory only if causation is shown",
    miniDescription:
      "Accepted mitigation framing now being compared against equitable prejudice.",
    content:
      "The filing-delay theory is strongest if tied to concrete mitigation pathways or assistance consequences. Without that showing, the argument risks sounding like general unfairness rather than a legally useful mitigation point.",
    category: "Mitigation",
    party: "defense",
    status: "supersession_pending",
    typeStatus: "Pending supersession",
    createdBy: "CaseOS Agent",
    updatedAt: "May 15, 2026",
    sources: ["Certified filing request", "Hardship communications"],
    linkedRecords: ["fact-002", "issue-003", "arg-004"],
  },
  {
    id: "arg-004",
    type: "arguments",
    title: "Filing delay may show equitable prejudice more cleanly than strict mitigation",
    miniDescription:
      "Alternative theory that may fit the record better than narrow causation.",
    content:
      "Rather than relying only on strict mitigation causation, the better framing may be that Plaintiffs' timing and communications created equitable prejudice by changing Defendants' practical options while preserving Plaintiffs' ability to present the matter as simple nonpayment.",
    category: "Equitable prejudice",
    party: "defense",
    status: "proposed",
    typeStatus: "Trial theory",
    createdBy: "CaseOS Agent",
    updatedAt: "May 16, 2026",
    sources: [
      "Certified filing request",
      "Hardship communications",
      "Procedural timeline",
    ],
    linkedRecords: ["fact-002", "issue-003", "timeline-006", "objective-002"],
    supersedes: {
      id: "arg-003",
      title: "Filing delay supports a mitigation theory only if causation is shown",
      summary:
        "Replaces a narrow mitigation-only framing with a broader equitable-prejudice theory that may better fit the mixed record.",
    },
  },
  {
    id: "arg-005",
    type: "arguments",
    title: "Completed maintenance entries show response activity, not condition proof",
    miniDescription:
      "Counter-interpretation of landlord records that avoids denying they exist.",
    content:
      "The defense can concede that work orders or service entries exist while arguing that they show response activity, not necessarily durable remediation or absence of recurring conditions.",
    category: "Evidence interpretation",
    party: "defense",
    status: "proposed",
    typeStatus: "Needs support",
    createdBy: "CaseOS Agent",
    updatedAt: "May 16, 2026",
    sources: [
      "Maintenance portal export",
      "Tenant chronology",
      "Apartment condition photos",
    ],
    linkedRecords: ["fact-003", "issue-005", "testimony-002", "note-002"],
  },
  {
    id: "timeline-003",
    type: "timeline",
    title: "Condition complaints appear in notes before formal filing activity",
    miniDescription:
      "Timeline event linking habitability notice to later procedural posture.",
    content:
      "Tenant notes and communications indicate condition complaints predate the formal summary process filing sequence. The exact complaint dates still need source-by-source normalization.",
    category: "Condition notice",
    party: "defense",
    status: "proposed",
    typeStatus: "Approximate event",
    createdBy: "CaseOS Agent",
    updatedAt: "May 16, 2026",
    date: "2021-09-01",
    sources: ["Tenant chronology", "Maintenance portal export"],
    linkedRecords: ["fact-001", "fact-003", "issue-001"],
  },
  {
    id: "timeline-004",
    type: "timeline",
    title: "Gap between certified request and summary process filing remains material",
    miniDescription:
      "Timeline-integrity concern showing the period that needs explanation.",
    content:
      "The timeline contains a significant gap between the certified request to file promptly and the later summary process filing. That gap matters because the parties may interpret it differently: delay, negotiation, administrative handling, or strategic timing.",
    category: "Timeline gap",
    status: "accepted",
    typeStatus: "Confirmed event",
    createdBy: "Human",
    updatedAt: "May 16, 2026",
    date: "2025-08-05",
    sources: ["Certified filing request", "Summary process docket"],
    linkedRecords: ["issue-003", "arg-004", "timeline-006"],
  },
  {
    id: "timeline-005",
    type: "timeline",
    title: "Supplemental discovery production followed motion pressure",
    miniDescription:
      "Procedural event supporting discovery-pressure and prejudice themes.",
    content:
      "Plaintiffs' supplemental discovery responses arrived after motion practice and court pressure, which may matter for prejudice, completeness, and trial preparation timing.",
    category: "Discovery",
    party: "plaintiff",
    status: "accepted",
    typeStatus: "Confirmed event",
    createdBy: "Human",
    updatedAt: "May 16, 2026",
    date: "2026-04-03",
    sources: [
      "Renewed motion to compel",
      "Plaintiffs supplemental discovery responses",
    ],
    linkedRecords: ["issue-002", "arg-002", "task-002", "posture-002"],
  },
  {
    id: "timeline-006",
    type: "timeline",
    title: "No-fault discussions and nonpayment filing create classification tension",
    miniDescription:
      "Timeline event showing why the filing theory is not just a date dispute.",
    content:
      "The record suggests discussions around an agreement to vacate or no-fault posture before the matter was ultimately filed as nonpayment. The exact sequence and legal significance require careful human review.",
    category: "Procedural posture",
    status: "proposed",
    typeStatus: "Disputed event",
    createdBy: "CaseOS Agent",
    updatedAt: "May 16, 2026",
    date: "2025-09-15",
    sources: [
      "Tenant chronology",
      "Hardship communications",
      "Summary process docket",
    ],
    linkedRecords: ["fact-002", "issue-003", "arg-004"],
  },
  {
    id: "task-003",
    type: "tasks",
    title: "Map each legal theory to exhibits, witnesses, and missing proof",
    miniDescription:
      "Trial-prep task that ties legal theories to usable proof and gaps.",
    content:
      "Create a theory matrix for habitability, quiet enjoyment, c. 93A, mitigation/equitable prejudice, and discovery prejudice. Each row should list exhibits, witness testimony, missing records, and the risk of overstatement.",
    category: "Trial prep",
    status: "accepted",
    typeStatus: "Open task",
    createdBy: "Human",
    updatedAt: "May 16, 2026",
    priority: "High",
    sources: ["Case strategy", "Answer and counterclaims"],
    linkedRecords: [
      "arg-001",
      "arg-004",
      "arg-005",
      "task-001",
      "fact-005",
    ],
  },
  {
    id: "task-004",
    type: "tasks",
    title: "Verify evidence integrity before adding condition photos to exhibit list",
    miniDescription:
      "Proof-quality task for metadata, extraction, and authentication concerns.",
    content:
      "Review image metadata, file provenance, OCR extraction limits, and witness foundation before treating condition photographs or extracted document text as clean exhibit support.",
    category: "Evidence integrity",
    status: "proposed",
    typeStatus: "Blocked task",
    createdBy: "CaseOS Agent",
    updatedAt: "May 16, 2026",
    priority: "High",
    sources: [
      "Apartment condition photos",
      "Photo metadata extraction report",
      "OCR extraction log",
    ],
    linkedRecords: ["fact-004", "fact-006", "issue-004", "testimony-001"],
  },
  {
    id: "task-005",
    type: "tasks",
    title: "Prepare management-record cross-examination packet",
    miniDescription:
      "Trial-prep task focused on records controlled by Plaintiffs or management.",
    content:
      "Build a witness packet with foundation questions for maintenance systems, access logs, extermination vendors, internal communications, and the process used to classify the eviction filing.",
    category: "Cross-exam",
    status: "proposed",
    typeStatus: "Open task",
    createdBy: "CaseOS Agent",
    updatedAt: "May 16, 2026",
    priority: "High",
    sources: [
      "Discovery requests",
      "Plaintiffs supplemental discovery responses",
      "Tenant chronology",
    ],
    linkedRecords: ["testimony-002", "fact-005", "issue-002", "arg-002"],
  },
  {
    id: "objective-002",
    type: "objectives",
    title: "Avoid overclaiming causation while preserving prejudice theme",
    miniDescription:
      "Strategy objective constraining how filing-delay arguments should be framed.",
    content:
      "The workspace should preserve the filing-delay/prejudice theme while avoiding a factual assertion that assistance or mitigation would definitely have succeeded absent stronger support.",
    category: "Risk control",
    party: "defense",
    status: "accepted",
    typeStatus: "Active objective",
    createdBy: "Human",
    updatedAt: "May 16, 2026",
    priority: "High",
    sources: ["Case strategy", "Certified filing request"],
    linkedRecords: ["arg-003", "arg-004", "issue-003"],
  },
  {
    id: "objective-003",
    type: "objectives",
    title: "Turn discovery gaps into a proof structure, not only a grievance",
    miniDescription:
      "Strategic objective for making missing records useful at trial.",
    content:
      "Discovery deficiencies should be connected to specific claims, defenses, witness questions, and exhibit gaps so the court sees prejudice rather than generalized frustration.",
    category: "Trial strategy",
    party: "defense",
    status: "proposed",
    typeStatus: "At-risk objective",
    createdBy: "CaseOS Agent",
    updatedAt: "May 16, 2026",
    priority: "High",
    sources: ["Renewed motion to compel", "Discovery requests"],
    linkedRecords: ["issue-002", "arg-002", "task-003", "task-005"],
  },
  {
    id: "note-002",
    type: "case_notes",
    title: "Do not treat maintenance completion codes as admissions of remediation",
    miniDescription:
      "Interpretation note preserving a careful distinction for trial use.",
    content:
      "A completion code may be useful to show management had notice and logged activity, but the record should not assume the condition was actually resolved without testimony, vendor records, or follow-up condition evidence.",
    category: "Evidence interpretation",
    status: "accepted",
    typeStatus: "Pinned note",
    createdBy: "Human",
    updatedAt: "May 16, 2026",
    sources: ["Maintenance portal export", "Tenant chronology"],
    linkedRecords: ["fact-003", "issue-005", "arg-005"],
  },
  {
    id: "note-003",
    type: "case_notes",
    title: "Agent summary overstated missing communications as intentional withholding",
    miniDescription:
      "Human correction note preventing an unsupported inference from becoming strategy.",
    content:
      "The April discovery summary should say communications remain missing or unproduced in the current packet. It should not state that Plaintiffs intentionally withheld them unless the record later supports that characterization.",
    category: "Human correction",
    status: "accepted",
    typeStatus: "Pinned note",
    createdBy: "Human",
    updatedAt: "May 16, 2026",
    sources: ["Plaintiffs supplemental discovery responses", "Agent draft"],
    linkedRecords: ["fact-005", "arg-002", "objective-003"],
  },
  {
    id: "note-004",
    type: "case_notes",
    title: "Potential exhibit problem: condition photos need witness sequencing",
    miniDescription:
      "Practical trial note connecting evidence integrity to witness preparation.",
    content:
      "If metadata remains incomplete, testimony should establish approximate timing, who took the photos, what each image depicts, and how the condition persisted or recurred.",
    category: "Trial prep",
    status: "proposed",
    typeStatus: "Open question",
    createdBy: "CaseOS Agent",
    updatedAt: "May 16, 2026",
    sources: ["Apartment condition photos", "Photo metadata extraction report"],
    linkedRecords: ["fact-004", "issue-004", "testimony-001", "task-004"],
  },
  {
    id: "precedent-002",
    type: "legal_precedent",
    title: "Massachusetts habitability authorities require careful damages framing",
    miniDescription:
      "Research record for abatement and counterclaim framing that needs cite verification.",
    content:
      "Candidate Massachusetts habitability authorities may support rent abatement or damages theories, but the workspace should verify current law, procedural posture, and whether the authority applies in summary process before relying on it.",
    category: "Research",
    status: "proposed",
    typeStatus: "Needs cite check",
    createdBy: "CaseOS Agent",
    updatedAt: "May 16, 2026",
    sources: ["Research notes", "Answer and counterclaims"],
    linkedRecords: ["issue-001", "arg-001", "task-003"],
  },
  {
    id: "precedent-003",
    type: "legal_precedent",
    title: "Adverse-inference research is promising but not yet motion-ready",
    miniDescription:
      "Research item separating trial theme from sanctions or evidentiary relief.",
    content:
      "Discovery-gap authority may help frame prejudice or adverse inference, but the current research should be cite-checked and matched to the actual missing categories before being used as a sanctions theory.",
    category: "Discovery research",
    status: "proposed",
    typeStatus: "Needs cite check",
    createdBy: "CaseOS Agent",
    updatedAt: "May 16, 2026",
    sources: ["Research notes", "Renewed motion to compel"],
    linkedRecords: ["issue-002", "arg-002", "objective-003"],
  },
  {
    id: "testimony-002",
    type: "testimony",
    title: "Management witness should be crossed on records under its control",
    miniDescription:
      "Cross-examination module for entry logs, work orders, vendors, and classification decisions.",
    content:
      "A management witness should establish what systems exist, who can access them, how entries are created, whether vendor or access logs are retained, and why certain categories are missing from the current production.",
    category: "Cross-exam",
    party: "plaintiff",
    status: "proposed",
    typeStatus: "Prepared testimony",
    createdBy: "CaseOS Agent",
    updatedAt: "May 16, 2026",
    sources: [
      "Discovery requests",
      "Plaintiffs supplemental discovery responses",
      "Maintenance portal export",
    ],
    linkedRecords: ["fact-003", "fact-005", "issue-002", "task-005"],
  },
  {
    id: "testimony-003",
    type: "testimony",
    title: "Tenant testimony should avoid certainty where dates are reconstructed",
    miniDescription:
      "Witness-prep guardrail for timeline gaps and photo metadata issues.",
    content:
      "Where dates are reconstructed from notes, photos, or surrounding events, testimony should use careful language and explain the basis for memory instead of overstating exact dates.",
    category: "Witness prep",
    party: "defense",
    status: "accepted",
    typeStatus: "Prepared testimony",
    createdBy: "Human",
    updatedAt: "May 16, 2026",
    sources: ["Tenant chronology", "Photo metadata extraction report"],
    linkedRecords: ["fact-004", "issue-004", "timeline-003"],
  },
  {
    id: "posture-002",
    type: "posture",
    title: "Trial-facing posture is constrained by unresolved discovery and proof quality",
    miniDescription:
      "Current posture update linking urgency to missing records and exhibit foundation.",
    content:
      "The matter is trial-facing, but unresolved discovery gaps and evidence-integrity questions should shape preparation. The strongest work now is proof mapping, witness sequencing, and careful review of agent proposals before any trial use.",
    category: "Trial posture",
    status: "accepted",
    typeStatus: "Current posture",
    createdBy: "Human",
    updatedAt: "May 16, 2026",
    sources: [
      "Procedural history",
      "Plaintiffs supplemental discovery responses",
      "Case strategy",
    ],
    linkedRecords: ["task-003", "task-004", "task-005", "objective-003"],
  },
  {
    id: "posture-003",
    type: "posture",
    title: "Earlier posture treated discovery as mostly complete",
    miniDescription:
      "Superseded posture record replaced by newer discovery-pressure analysis.",
    content:
      "Earlier workspace notes treated the April supplemental response as mostly resolving discovery concerns. Later review identified remaining gaps in entry logs, internal communications, vendor records, and extraction quality.",
    category: "Discovery posture",
    status: "superseded",
    typeStatus: "Stale posture",
    createdBy: "CaseOS Agent",
    updatedAt: "May 15, 2026",
    sources: ["Plaintiffs supplemental discovery responses"],
    linkedRecords: ["posture-002", "fact-005", "fact-006"],
  },
  {
    id: "fact-007",
    type: "facts",
    title: "Family and RAFT payments exceeded $116,000 during tenancy",
    miniDescription:
      "Payment-context fact that complicates a simple nonpayment narrative.",
    content:
      "Matthew Sweeney's affidavit states that his family and RAFT assistance collectively paid approximately $116,290.41 in rent and arrears during the tenancy, including approximately $110,442.73 from the family and approximately $5,847.68 through RAFT.",
    category: "Payment history",
    party: "defense",
    status: "accepted",
    typeStatus: "Undisputed fact",
    createdBy: "Human",
    updatedAt: "May 16, 2026",
    sources: ["Affidavit of Matthew Sweeney", "Rent ledger", "RAFT approval record"],
    linkedRecords: ["arg-001", "objective-001", "task-003"],
  },
  {
    id: "fact-008",
    type: "facts",
    title: "Child's local autism services made relocation materially harder",
    miniDescription:
      "Context fact explaining why ordinary relocation assumptions may not fit the household.",
    content:
      "The affidavit states that the household depended on locally based Quincy services, evaluations, therapy supports, and stability for a child formally diagnosed with autism in 2024, making relocation more complicated than a standard market move.",
    category: "Household stability",
    party: "defense",
    status: "accepted",
    typeStatus: "Context fact",
    createdBy: "Human",
    updatedAt: "May 16, 2026",
    sources: ["Affidavit of Matthew Sweeney", "Early Intervention history"],
    linkedRecords: ["issue-003", "arg-004", "objective-002", "testimony-004"],
  },
  {
    id: "fact-009",
    type: "facts",
    title: "QCAP housing coordinator allegedly tied shelter pathway to no-fault process",
    miniDescription:
      "Assistance-pathway fact that needs corroboration before being treated as decisive.",
    content:
      "The affidavit states that Denise Ferreira, a QCAP Housing Coordinator, informed the family that EA Family Shelter access and related assistance depended on a no-fault Housing Court pathway and a court-ordered move-out date.",
    category: "Housing assistance",
    party: "defense",
    status: "proposed",
    typeStatus: "Needs source review",
    createdBy: "CaseOS Agent",
    updatedAt: "May 16, 2026",
    sources: ["Affidavit of Matthew Sweeney", "QCAP communications"],
    linkedRecords: ["issue-003", "arg-004", "timeline-006", "testimony-004"],
  },
  {
    id: "fact-010",
    type: "facts",
    title: "Initial arrears were allegedly cured by RAFT before any court filing",
    miniDescription:
      "Timing fact that affects the meaning of later notices and filing classification.",
    content:
      "The affidavit states that RAFT assistance was approved and covered the June and July arrears in full before Faxon Commons filed a Summary Process action. The exact approval and payment dates should be checked against the RAFT record and ledger.",
    category: "RAFT",
    party: "defense",
    status: "proposed",
    typeStatus: "Needs source review",
    createdBy: "CaseOS Agent",
    updatedAt: "May 16, 2026",
    date: "2025-07-28",
    sources: ["RAFT approval record", "Rent ledger", "Affidavit of Matthew Sweeney"],
    linkedRecords: ["timeline-007", "issue-006", "arg-006", "fact-002"],
  },
  {
    id: "fact-011",
    type: "facts",
    title: "July 24 entry involved balcony netting used for child safety",
    miniDescription:
      "Entry and safety fact that links quiet enjoyment, notice, and household-stability themes.",
    content:
      "The affidavit states that maintenance entered the apartment after a broad balcony notice while the family was asleep and removed protective balcony netting installed for child safety. The record should verify the notice language and any maintenance records.",
    category: "Entry",
    party: "defense",
    status: "proposed",
    typeStatus: "Needs source review",
    createdBy: "CaseOS Agent",
    updatedAt: "May 16, 2026",
    date: "2025-07-24",
    sources: ["Affidavit of Matthew Sweeney", "Balcony inspection notice", "Entry/access records"],
    linkedRecords: ["issue-007", "arg-007", "timeline-008", "testimony-004"],
  },
  {
    id: "fact-012",
    type: "facts",
    title: "Agreement to Vacate allegedly required filing by September 12",
    miniDescription:
      "Contract/process fact central to the no-fault versus nonpayment timeline.",
    content:
      "The affidavit states that the negotiated Agreement to Vacate required Faxon Commons to file a Summary Process action no later than September 12, 2025, and that the filing did not occur by that deadline.",
    category: "Agreement to vacate",
    party: "defense",
    status: "proposed",
    typeStatus: "Needs source review",
    createdBy: "CaseOS Agent",
    updatedAt: "May 16, 2026",
    date: "2025-09-12",
    sources: ["Agreement to Vacate", "September 10 email", "Summary process docket"],
    linkedRecords: ["timeline-010", "timeline-011", "issue-003", "arg-004"],
  },
  {
    id: "issue-006",
    type: "issues",
    title: "Whether RAFT curing June and July arrears changed the filing posture",
    miniDescription:
      "Procedural issue for interpreting the second notice and later nonpayment complaint.",
    content:
      "The record needs to separate what RAFT paid, when it was credited, whether the first notice remained a viable procedural path, and how those facts affect the later second notice and October filing.",
    category: "Procedural",
    party: "defense",
    status: "proposed",
    typeStatus: "Open issue",
    createdBy: "CaseOS Agent",
    updatedAt: "May 16, 2026",
    sources: ["RAFT approval record", "Rent ledger", "First Notice to Quit", "Second Notice to Quit"],
    linkedRecords: ["fact-010", "timeline-007", "timeline-009", "arg-006"],
  },
  {
    id: "issue-007",
    type: "issues",
    title: "Whether the July 24 entry supports quiet enjoyment or notice theories",
    miniDescription:
      "Legal/factual issue connecting entry notice, household safety, and later management communications.",
    content:
      "The July 24 entry may support quiet-enjoyment or notice-related arguments, but the workspace should verify the notice, entry authority, what was removed, and whether the incident is strategically useful or secondary to the filing-delay theory.",
    category: "Legal",
    party: "defense",
    status: "proposed",
    typeStatus: "Reserved issue",
    createdBy: "CaseOS Agent",
    updatedAt: "May 16, 2026",
    sources: ["Balcony inspection notice", "Affidavit of Matthew Sweeney", "Entry/access records"],
    linkedRecords: ["fact-011", "arg-007", "timeline-008", "testimony-004"],
  },
  {
    id: "issue-008",
    type: "issues",
    title: "Whether lack of response to certified letter supports reliance or prejudice",
    miniDescription:
      "Strategic issue about silence after a written request for prompt filing or clarification.",
    content:
      "The affidavit states that the August 5 certified letter requested prompt filing or written confirmation if no filing would occur, and that no response was received. The significance depends on proof of receipt, surrounding communications, and how the delay affected practical options.",
    category: "Strategic",
    party: "defense",
    status: "proposed",
    typeStatus: "Open issue",
    createdBy: "CaseOS Agent",
    updatedAt: "May 16, 2026",
    sources: ["Certified filing request", "USPS receipt", "Affidavit of Matthew Sweeney"],
    linkedRecords: ["timeline-002", "arg-004", "objective-002", "testimony-004"],
  },
  {
    id: "arg-006",
    type: "arguments",
    title: "RAFT payment weakens a clean nonpayment-only chronology",
    miniDescription:
      "Alternative argument focused on sequence rather than denying later arrears.",
    content:
      "The defense can argue that RAFT curing the initial arrears before any court filing complicates Plaintiffs' clean nonpayment timeline, while still acknowledging that later arrears accumulated.",
    category: "Procedural framing",
    party: "defense",
    status: "proposed",
    typeStatus: "Needs support",
    createdBy: "CaseOS Agent",
    updatedAt: "May 16, 2026",
    sources: ["RAFT approval record", "Rent ledger", "Summary process docket"],
    linkedRecords: ["fact-010", "issue-006", "timeline-007", "arg-004"],
  },
  {
    id: "arg-007",
    type: "arguments",
    title: "Unauthorized-entry evidence should support context, not distract from filing prejudice",
    miniDescription:
      "Strategy argument limiting how the July 24 entry should be used.",
    content:
      "The July 24 entry may help explain why management communications and household safety mattered, but it should not consume the trial narrative unless entry records or notice defects become stronger proof points.",
    category: "Strategy",
    party: "defense",
    status: "proposed",
    typeStatus: "Trial theory",
    createdBy: "CaseOS Agent",
    updatedAt: "May 16, 2026",
    sources: ["Affidavit of Matthew Sweeney", "Balcony inspection notice"],
    linkedRecords: ["fact-011", "issue-007", "testimony-004", "objective-004"],
  },
  {
    id: "timeline-007",
    type: "timeline",
    title: "RAFT assistance approved after first notice expired",
    miniDescription:
      "Timing event that may affect cure, filing posture, and later arrears analysis.",
    content:
      "The affidavit states that RAFT assistance was approved on July 28, 2025 and covered June and July arrears after the first Notice to Quit expired. The timeline file lists July 24, so the exact date should be reconciled against Exhibit B.",
    category: "RAFT",
    party: "defense",
    status: "proposed",
    typeStatus: "Date conflict",
    createdBy: "CaseOS Agent",
    updatedAt: "May 16, 2026",
    date: "2025-07-28",
    sources: ["RAFT approval record", "Case timeline", "Affidavit of Matthew Sweeney"],
    linkedRecords: ["fact-010", "issue-006", "arg-006"],
  },
  {
    id: "timeline-008",
    type: "timeline",
    title: "Maintenance entered unit and removed balcony netting",
    miniDescription:
      "Entry event that also prompted renewed discussion about delayed filing.",
    content:
      "The affidavit states that on July 24, 2025, maintenance entered following a broad balcony notice, removed protective balcony netting, and the subsequent discussion with management returned to the absence of a Summary Process filing.",
    category: "Entry",
    party: "plaintiff",
    status: "proposed",
    typeStatus: "Disputed event",
    createdBy: "CaseOS Agent",
    updatedAt: "May 16, 2026",
    date: "2025-07-24",
    sources: ["Affidavit of Matthew Sweeney", "Balcony inspection notice"],
    linkedRecords: ["fact-011", "issue-007", "arg-007"],
  },
  {
    id: "timeline-009",
    type: "timeline",
    title: "Second Notice to Quit issued after RAFT resolved initial arrears",
    miniDescription:
      "Procedural event creating tension between cure, delay, and later nonpayment filing.",
    content:
      "Faxon Commons issued a second Notice to Quit on August 19, 2025, after the affidavit says RAFT had resolved the initial June and July arrears and while additional arrears were accumulating during the filing delay.",
    category: "Notice",
    party: "plaintiff",
    status: "accepted",
    typeStatus: "Confirmed event",
    createdBy: "Human",
    updatedAt: "May 16, 2026",
    date: "2025-08-19",
    sources: ["Second Notice to Quit", "RAFT approval record", "Affidavit of Matthew Sweeney"],
    linkedRecords: ["fact-010", "issue-006", "arg-006", "timeline-004"],
  },
  {
    id: "timeline-010",
    type: "timeline",
    title: "Agreement to Vacate contemplated no-fault filing by September 12",
    miniDescription:
      "Agreement event anchoring the later classification and missed-deadline theory.",
    content:
      "The affidavit states that the Agreement to Vacate contemplated a no-fault Housing Court process and required Faxon Commons to file a Summary Process action by September 12, 2025.",
    category: "Agreement to vacate",
    status: "proposed",
    typeStatus: "Needs source review",
    createdBy: "CaseOS Agent",
    updatedAt: "May 16, 2026",
    date: "2025-09-12",
    sources: ["Agreement to Vacate", "September 10 email", "Affidavit of Matthew Sweeney"],
    linkedRecords: ["fact-012", "issue-003", "arg-004", "timeline-011"],
  },
  {
    id: "timeline-011",
    type: "timeline",
    title: "Fault-based nonpayment complaint filed thirty-two days after agreement deadline",
    miniDescription:
      "Core filing event tying delay, classification, and accumulated arrears together.",
    content:
      "The affidavit states that Faxon Commons filed a nonpayment Summary Process action on October 14, 2025, thirty-two days after the September 12 filing deadline in the Agreement to Vacate.",
    category: "Filing",
    party: "plaintiff",
    status: "accepted",
    typeStatus: "Confirmed event",
    createdBy: "Human",
    updatedAt: "May 16, 2026",
    date: "2025-10-14",
    sources: ["Summary process complaint", "Agreement to Vacate", "Summary process docket"],
    linkedRecords: ["fact-012", "timeline-010", "arg-004", "posture-002"],
  },
  {
    id: "timeline-012",
    type: "timeline",
    title: "April 9 follow-up requested search certification after supplementation",
    miniDescription:
      "Discovery event showing why April 3 production did not end the dispute.",
    content:
      "After reviewing the April 3 supplemental responses, Defendants sent an April 9 follow-up asking Plaintiffs to confirm search scope, sources reviewed, completeness, and whether additional materials existed. The timeline states no response was received.",
    category: "Discovery",
    party: "defense",
    status: "accepted",
    typeStatus: "Confirmed event",
    createdBy: "Human",
    updatedAt: "May 16, 2026",
    date: "2026-04-09",
    sources: ["April 9 follow-up email", "Supplemental discovery responses"],
    linkedRecords: ["fact-005", "issue-002", "task-002", "timeline-013"],
  },
  {
    id: "timeline-013",
    type: "timeline",
    title: "Supplemental memorandum sought search certification and preclusion",
    miniDescription:
      "Discovery-pressure event connecting missing records to requested relief.",
    content:
      "Defendants filed a supplemental memorandum on April 23, 2026, documenting continued discovery concerns and requesting search certification, production by a date certain, and preclusion of undisclosed evidence.",
    category: "Discovery",
    party: "defense",
    status: "accepted",
    typeStatus: "Confirmed event",
    createdBy: "Human",
    updatedAt: "May 16, 2026",
    date: "2026-04-23",
    sources: ["Supplemental memorandum", "April 9 follow-up email"],
    linkedRecords: ["issue-002", "arg-002", "precedent-003", "task-006"],
  },
  {
    id: "task-006",
    type: "tasks",
    title: "Reconcile affidavit timeline against exhibit dates before trial use",
    miniDescription:
      "Quality-control task for RAFT date, notices, agreement deadline, and docket filing.",
    content:
      "Compare the affidavit, case timeline, RAFT approval record, notices, certified letter receipt, Agreement to Vacate, and Summary Process docket so trial materials distinguish exact dates from asserted or reconstructed dates.",
    category: "Timeline integrity",
    status: "accepted",
    typeStatus: "Open task",
    createdBy: "Human",
    updatedAt: "May 16, 2026",
    priority: "High",
    sources: ["Affidavit of Matthew Sweeney", "Case timeline", "Exhibits A-H"],
    linkedRecords: ["timeline-007", "timeline-010", "timeline-011", "testimony-003"],
  },
  {
    id: "objective-004",
    type: "objectives",
    title: "Keep hardship context humanizing without shifting responsibility",
    miniDescription:
      "Trial objective preserving nuance around employment, services, and housing barriers.",
    content:
      "The affidavit accepts responsibility for broader employment and financial circumstances while explaining why local services, autism-related stability, and housing-market barriers made the transition difficult. Trial framing should preserve that nuance.",
    category: "Narrative control",
    party: "defense",
    status: "accepted",
    typeStatus: "Active objective",
    createdBy: "Human",
    updatedAt: "May 16, 2026",
    priority: "Medium",
    sources: ["Affidavit of Matthew Sweeney"],
    linkedRecords: ["fact-008", "arg-004", "testimony-004"],
  },
  {
    id: "testimony-004",
    type: "testimony",
    title: "Matthew Sweeney testimony should separate asserted reliance from legal conclusion",
    miniDescription:
      "Witness-prep module for no-fault reliance, shelter pathway, and family stability.",
    content:
      "Testimony should establish what was said by management and housing personnel, what the family understood, what actions were taken in reliance, and what changed after delay, while avoiding legal conclusions about entitlement or causation.",
    category: "Witness prep",
    party: "defense",
    status: "proposed",
    typeStatus: "Prepared testimony",
    createdBy: "CaseOS Agent",
    updatedAt: "May 16, 2026",
    sources: [
      "Affidavit of Matthew Sweeney",
      "Certified filing request",
      "Agreement to Vacate",
      "QCAP communications",
    ],
    linkedRecords: ["fact-008", "fact-009", "fact-011", "arg-004"],
  },
];

export const demoDocuments: DemoDocument[] = [
  {
    id: "doc-001",
    fileName: "2025-06-17 Notice to Quit.pdf",
    category: "Pleadings",
    status: "Processed",
    date: "Jun 17, 2025",
    summary:
      "Nonpayment notice used by Plaintiffs to begin summary process sequence.",
    linkedRecords: 6,
    gaps: ["Confirm service details", "Connect to classification timeline"],
  },
  {
    id: "doc-002",
    fileName: "2025-08-05 Certified Filing Request.pdf",
    category: "Correspondence",
    status: "Needs review",
    date: "Aug 5, 2025",
    summary:
      "Tenant-side communication tying filing timing to mitigation and assistance options.",
    linkedRecords: 10,
    gaps: ["Verify receipt page", "Extract exact requested relief"],
  },
  {
    id: "doc-003",
    fileName: "Plaintiffs Supplemental Discovery Responses.pdf",
    category: "Discovery",
    status: "Processed",
    date: "Apr 3, 2026",
    summary:
      "Late supplemental responses with remaining gaps around entry, pest, and internal decision records.",
    linkedRecords: 14,
    gaps: [
      "Entry logs",
      "Internal communications",
      "Extermination vendor records",
      "OCR table extraction",
    ],
  },
  {
    id: "doc-004",
    fileName: "Tenant Chronology and Conditions Notes.md",
    category: "Case notes",
    status: "Uploaded",
    date: "May 15, 2026",
    summary:
      "Working chronology for move-in conditions, complaints, hardship communications, and trial themes.",
    linkedRecords: 17,
    gaps: ["Normalize dates", "Attach photos", "Separate exact from reconstructed dates"],
  },
  {
    id: "doc-005",
    fileName: "Maintenance Portal Export - Work Orders.csv",
    category: "Discovery",
    status: "Needs review",
    date: "Apr 3, 2026",
    summary:
      "Work-order export that may show response activity but does not by itself prove durable remediation.",
    linkedRecords: 8,
    gaps: ["Completion code definitions", "Vendor notes", "Follow-up visits"],
  },
  {
    id: "doc-006",
    fileName: "Apartment Condition Photos - Metadata Report.csv",
    category: "Evidence",
    status: "Needs review",
    date: "May 16, 2026",
    summary:
      "Metadata review for condition photos, highlighting missing capture data and authentication needs.",
    linkedRecords: 7,
    gaps: ["Missing EXIF data", "Witness foundation", "Photo sequence"],
  },
  {
    id: "doc-007",
    fileName: "Summary Process Docket and Filing Timeline.pdf",
    category: "Pleadings",
    status: "Processed",
    date: "May 16, 2026",
    summary:
      "Docket and filing timeline used to compare notice, filing delay, classification, and motion pressure.",
    linkedRecords: 9,
    gaps: ["No-fault discussion source", "Agreement-to-vacate exhibits"],
  },
  {
    id: "doc-008",
    fileName: "OCR Extraction Log - Supplemental Responses.json",
    category: "Discovery",
    status: "Needs review",
    date: "May 16, 2026",
    summary:
      "Extraction log showing where table-based discovery responses may need manual verification against the PDF.",
    linkedRecords: 5,
    gaps: ["Flattened tables", "Manual PDF comparison"],
  },
  {
    id: "doc-009",
    fileName: "Affidavit of Matthew Sweeney - Draft.pdf",
    category: "Testimony",
    status: "Needs review",
    date: "May 16, 2026",
    summary:
      "Draft affidavit covering payment history, pest conditions, family hardship, RAFT, no-fault discussions, notices, entry, and filing-delay chronology.",
    linkedRecords: 18,
    gaps: ["Exhibit cross-check", "Date reconciliation", "Avoid legal conclusions"],
  },
  {
    id: "doc-010",
    fileName: "Agreement to Vacate and September Emails.pdf",
    category: "Correspondence",
    status: "Needs review",
    date: "Sep 10, 2025",
    summary:
      "Agreement and email chain used to evaluate no-fault filing expectations, the September 12 deadline, and later classification tension.",
    linkedRecords: 11,
    gaps: ["Execution history", "Attorney review email", "Filing-deadline communications"],
  },
  {
    id: "doc-011",
    fileName: "RAFT Approval and Rent Ledger Packet.pdf",
    category: "Evidence",
    status: "Needs review",
    date: "Jul 28, 2025",
    summary:
      "RAFT and ledger materials for verifying payment amounts, cure timing, and the relationship between initial arrears and later notices.",
    linkedRecords: 9,
    gaps: ["Approval date conflict", "Ledger credit date", "June-July arrears allocation"],
  },
  {
    id: "doc-012",
    fileName: "Balcony Inspection Notice and Entry Notes.pdf",
    category: "Evidence",
    status: "Uploaded",
    date: "Jul 24, 2025",
    summary:
      "Entry-related materials for analyzing unit-specific notice, balcony netting removal, and subsequent management communications.",
    linkedRecords: 6,
    gaps: ["Access log", "Maintenance personnel identity", "Unit-specific notice"],
  },
];

export const demoActivity: DemoActivity[] = [
  {
    id: "act-001",
    actor: "CaseOS Agent",
    action: "Proposed equitable-prejudice theory to supersede the narrower mitigation argument.",
    time: "8 minutes ago",
    tone: "info",
  },
  {
    id: "act-002",
    actor: "Matthew Sweeney",
    action: "Accepted discovery-gap fact after comparing requests against supplemental responses.",
    time: "42 minutes ago",
    tone: "success",
  },
  {
    id: "act-003",
    actor: "CaseOS Agent",
    action: "Flagged photo metadata and OCR extraction issues before exhibit mapping.",
    time: "1 hour ago",
    tone: "warning",
  },
  {
    id: "act-004",
    actor: "CaseOS Agent",
    action: "Linked maintenance completion codes to disputed remediation and cross-exam modules.",
    time: "2 hours ago",
    tone: "info",
  },
  {
    id: "act-005",
    actor: "Matthew Sweeney",
    action: "Pinned correction note limiting unsupported claims about intentional withholding.",
    time: "3 hours ago",
    tone: "success",
  },
  {
    id: "act-006",
    actor: "CaseOS Agent",
    action: "Proposed RAFT cure and second-notice issue after comparing affidavit against the timeline file.",
    time: "4 hours ago",
    tone: "warning",
  },
  {
    id: "act-007",
    actor: "Matthew Sweeney",
    action: "Accepted task to reconcile affidavit dates against exhibits before trial use.",
    time: "5 hours ago",
    tone: "success",
  },
  {
    id: "act-008",
    actor: "CaseOS Agent",
    action: "Linked Agreement to Vacate deadline to the October nonpayment filing and equitable-prejudice theory.",
    time: "6 hours ago",
    tone: "info",
  },
];

export const demoViewCounts = demoRecords.reduce<
  Partial<Record<ViewTypes, number>>
>((counts, record) => {
  counts[record.type] = (counts[record.type] ?? 0) + 1;
  return counts;
}, {});

demoViewCounts.documents_index = demoDocuments.length;
demoViewCounts.case_summary = 1;
demoViewCounts.agent_config = 1;
