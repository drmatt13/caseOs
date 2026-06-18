// Second hardcoded demo workspace: the 1994 defense of O.J. Simpson, built from
// the source materials in src/test_data/intake/oj. It is the stress-test of the
// data model — authored to exercise every version-history shape the schema
// supports, end to end:
//
//  - a 3-generation lineage (glove discovery fact: v1 → v2 → v3) and a
//    4-generation lineage (time-of-death fact: v1 → v2 → v3 → v4), where the
//    middle records have BOTH replaced a predecessor AND been replaced again
//  - a completed 1→2 SPLIT (broad blood-handling fact → EDTA-vial + late-Bronco
//    facts) and a 1→3 SPLIT (broad "bad investigation" theory → contamination,
//    Fuhrman-bias, chain-of-custody theories)
//  - a completed 3→1 MERGE (three documentation-discrepancy facts → one
//    chain-of-custody-integrity fact) and a 2→1 MERGE (two glove-fit arguments
//    → one glove-demonstration argument)
//  - PENDING replacements: a single proposed replacement against an accepted
//    record (Fuhrman "collateral" → "central"; Bronco blood reframe) and a
//    pending 1→N split proposal queued against one accepted objective
//  - a REPLACED document record (first-pass OCR re-extracted), many freshly
//    PROPOSED records awaiting review, and one REJECTED record
//
// Link statuses are normalized at build time (see linkSpecs): an ACCEPTED link
// can only exist between two authoritative endpoints, so accepted records never
// surface a link into a proposed or retired record.

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
import type {
  CaseDemo,
  DemoActivity,
  DemoAgentMessage,
} from "#/demo/caseDemoTypes";
import { demoUserId } from "#/demo/caseWorkspaceDemo";

export const OJ_WORKSPACE_ID = "22222222-2222-4222-8222-222222222222";
export const OJ_CASE_ID = "case-oj-simpson-demo";

const ojCase = {
  id: OJ_CASE_ID,
  title: "People v. Simpson",
  court: "Superior Court of California, County of Los Angeles",
  caseNumber: "BA097211",
  client: "Orenthal James Simpson",
};

const ojCaseContext: CaseContext = {
  id: "context-oj-simpson",
  workspaceId: OJ_WORKSPACE_ID,
  caseId: OJ_CASE_ID,
  sourceIntakeId: "case_oj_simpson_defense_1994",
  version: 4,
  caseName: "People of the State of California v. Orenthal James Simpson",
  caseNumberOrDocket: "BA097211",
  jurisdictionOrCourt: "Superior Court of California, County of Los Angeles",
  practiceArea: "criminal",
  representation: {
    clientRole: "defendant",
    representationRole: "defense_counsel",
    representedPartyName: "Orenthal James Simpson",
  },
  objectives: {
    ours: "Create reasonable doubt as to identity, forensic reliability, and investigative integrity without committing the defense to an alternative narrative the evidence cannot carry.",
    theirs:
      "Prove motive, opportunity, and physical connection through blood, glove, and timeline evidence, and present the investigation as careful and conclusive.",
    desiredOutcome:
      "Acquittal on both counts, or exclusion of the blood and glove evidence sufficient to prevent conviction.",
    biggestCurrentRisk:
      "The jury accepts the DNA and glove evidence as conclusive despite collection, contamination, and chain-of-custody challenges.",
  },
  claims: {
    dispute:
      "The State alleges Simpson murdered Nicole Brown Simpson and Ronald Goldman outside her Bundy Drive residence on June 12, 1994. The defense disputes identity and challenges the reliability of the physical evidence and the investigation.",
    claimsOrAllegations:
      "Two counts of first-degree murder. The defense challenges probable cause, the Rockingham search, forensic collection, chain of custody, DNA mixture interpretation, glove evidence, the timeline, and investigator bias.",
  },
  currentPosture:
    "Trial preparation. Suppression and admissibility motions active; defense consolidating a jury-facing credibility-and-handling narrative over a scattered set of evidentiary objections.",
  createdAt: "2026-06-08T15:00:00Z",
  updatedAt: "2026-06-13T18:30:00Z",
  lastReviewedAt: "2026-06-13T18:30:00Z",
};

// ─────────────────────────────────────────────────────────────────────────────
// Source documents (raw files in object storage)
// ─────────────────────────────────────────────────────────────────────────────

const documentDefaults = {
  workspaceId: OJ_WORKSPACE_ID,
  caseId: OJ_CASE_ID,
  uploadedByUserId: demoUserId,
} as const;

const ojDocuments: CaseDocument[] = [
  {
    ...documentDefaults,
    id: "doc-police-report",
    fileName: "Initial Police Response Report.pdf",
    storageKey: `cases/${OJ_CASE_ID}/documents/initial-police-response-report.pdf`,
    mimeType: "application/pdf",
    category: "evidence",
    description:
      "First-responder report: discovery of the victims at 875 Bundy Drive, scene security, and early investigative actions.",
    processingStatus: "processed",
    pageCount: 9,
    createdAt: "2026-06-08T12:00:00Z",
    updatedAt: "2026-06-08T12:30:00Z",
  },
  {
    ...documentDefaults,
    id: "doc-coc",
    fileName: "Biological Evidence Chain-of-Custody Log.pdf",
    storageKey: `cases/${OJ_CASE_ID}/documents/chain-of-custody-blood-samples.pdf`,
    mimeType: "application/pdf",
    category: "evidence",
    description:
      "Consolidated chain-of-custody log for blood items BS-001 through BS-012, including reference draws and audit observations.",
    processingStatus: "processed",
    pageCount: 28,
    createdAt: "2026-06-08T12:05:00Z",
    updatedAt: "2026-06-08T12:40:00Z",
  },
  {
    ...documentDefaults,
    id: "doc-dna",
    fileName: "DNA Laboratory Analysis Report.pdf",
    storageKey: `cases/${OJ_CASE_ID}/documents/dna-lab-analysis-report.pdf`,
    mimeType: "application/pdf",
    category: "expert_report",
    description:
      "SID serology/DNA report (RFLP) comparing evidentiary samples to references, with mixture and statistical analysis.",
    processingStatus: "processed",
    pageCount: 22,
    createdAt: "2026-06-08T12:10:00Z",
    updatedAt: "2026-06-08T12:45:00Z",
  },
  {
    ...documentDefaults,
    id: "doc-glove",
    fileName: "Glove Evidence Report.pdf",
    storageKey: `cases/${OJ_CASE_ID}/documents/glove-evidence-report.pdf`,
    mimeType: "application/pdf",
    category: "evidence",
    description:
      "Recovery, examination, and documentation of the Bundy glove (GE-001) and the Rockingham glove (GE-002).",
    processingStatus: "processed",
    pageCount: 17,
    createdAt: "2026-06-08T12:15:00Z",
    updatedAt: "2026-06-08T12:50:00Z",
  },
  {
    ...documentDefaults,
    id: "doc-bronco",
    fileName: "Ford Bronco Evidence Inventory.pdf",
    storageKey: `cases/${OJ_CASE_ID}/documents/bronco-evidence-inventory.pdf`,
    mimeType: "application/pdf",
    category: "evidence",
    description:
      "Inventory of items from the white Ford Bronco: blood traces, fibers, interior observations, and collection notes.",
    processingStatus: "processed",
    pageCount: 11,
    createdAt: "2026-06-08T12:20:00Z",
    updatedAt: "2026-06-08T12:55:00Z",
  },
  {
    ...documentDefaults,
    id: "doc-defense-timeline",
    fileName: "Defense Timeline Reconstruction Memo.pdf",
    storageKey: `cases/${OJ_CASE_ID}/documents/defense-timeline-reconstruction.pdf`,
    mimeType: "application/pdf",
    category: "research",
    description:
      "Attorney work product reconstructing June 12–13, 1994 and identifying timeline inconsistencies and feasibility issues.",
    processingStatus: "processed",
    pageCount: 14,
    createdAt: "2026-06-09T10:00:00Z",
    updatedAt: "2026-06-09T10:40:00Z",
  },
  {
    ...documentDefaults,
    id: "doc-park",
    fileName: "Allan Park Witness Statement.pdf",
    storageKey: `cases/${OJ_CASE_ID}/documents/allan-park-witness-statement.pdf`,
    mimeType: "application/pdf",
    category: "witness_statement",
    description:
      "Limousine driver's statement: arrival time at Rockingham, attempts to contact the residence, and observations.",
    processingStatus: "processed",
    pageCount: 6,
    createdAt: "2026-06-09T10:05:00Z",
    updatedAt: "2026-06-09T10:25:00Z",
  },
  {
    ...documentDefaults,
    id: "doc-kato",
    fileName: "Kato Kaelin Statement.pdf",
    storageKey: `cases/${OJ_CASE_ID}/documents/kato-kaelin-statement.pdf`,
    mimeType: "application/pdf",
    category: "witness_statement",
    description:
      "Guest-house occupant's statement: thumps heard near the guest house and related timeline details.",
    processingStatus: "processed",
    pageCount: 5,
    createdAt: "2026-06-09T10:10:00Z",
    updatedAt: "2026-06-09T10:30:00Z",
  },
  {
    ...documentDefaults,
    id: "doc-fuhrman",
    fileName: "Mark Fuhrman Impeachment Research.pdf",
    storageKey: `cases/${OJ_CASE_ID}/documents/mark-fuhrman-impeachment-research.pdf`,
    mimeType: "application/pdf",
    category: "research",
    description:
      "Defense work product on potential impeachment of Detective Fuhrman: bias, prior statements, and evidence-discovery role.",
    processingStatus: "processed",
    pageCount: 12,
    createdAt: "2026-06-09T10:15:00Z",
    updatedAt: "2026-06-09T10:50:00Z",
  },
  {
    ...documentDefaults,
    id: "doc-me",
    fileName: "Medical Examiner Report.pdf",
    storageKey: `cases/${OJ_CASE_ID}/documents/medical-examiner-report.pdf`,
    mimeType: "application/pdf",
    category: "expert_report",
    description:
      "Coroner findings: cause of death, estimated time-of-death window, injury patterns, and forensic observations.",
    processingStatus: "processed",
    pageCount: 16,
    createdAt: "2026-06-09T10:20:00Z",
    updatedAt: "2026-06-09T11:00:00Z",
  },
  {
    ...documentDefaults,
    id: "doc-domestic",
    fileName: "Prior Domestic Incident Records.pdf",
    storageKey: `cases/${OJ_CASE_ID}/documents/prior-domestic-incident-records.pdf`,
    mimeType: "application/pdf",
    category: "evidence",
    description:
      "Compilation of prior police contacts, incident reports, and 911 records the prosecution may use to argue motive.",
    processingStatus: "processed",
    pageCount: 19,
    createdAt: "2026-06-09T10:25:00Z",
    updatedAt: "2026-06-09T11:05:00Z",
  },
  {
    ...documentDefaults,
    id: "doc-forensic-notes",
    fileName: "Defense Forensic Expert Notes.txt",
    storageKey: `cases/${OJ_CASE_ID}/documents/defense-forensic-expert-notes.txt`,
    mimeType: "text/plain",
    category: "research",
    description:
      "Defense consultant notes flagging contamination, sample handling, testing interpretation, and collection concerns.",
    processingStatus: "processed",
    createdAt: "2026-06-09T10:30:00Z",
    updatedAt: "2026-06-09T11:10:00Z",
  },
  {
    ...documentDefaults,
    id: "doc-motion",
    fileName: "Draft Motion to Suppress Evidence.docx",
    storageKey: `cases/${OJ_CASE_ID}/documents/draft-motion-to-suppress-evidence.docx`,
    mimeType:
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    category: "motion",
    description:
      "Draft motion to suppress or limit physical evidence based on collection, warrant, and chain-of-custody concerns.",
    processingStatus: "processed",
    pageCount: 21,
    createdAt: "2026-06-10T09:00:00Z",
    updatedAt: "2026-06-10T09:45:00Z",
  },
  {
    ...documentDefaults,
    id: "doc-client",
    fileName: "O.J. Simpson Client Statement.txt",
    storageKey: `cases/${OJ_CASE_ID}/documents/oj-simpson-client-statement.txt`,
    mimeType: "text/plain",
    category: "client_statement",
    description:
      "Client-provided statement on whereabouts, relationship history, travel plans, and denial of involvement.",
    processingStatus: "processed",
    createdAt: "2026-06-10T09:05:00Z",
    updatedAt: "2026-06-10T09:20:00Z",
  },
  {
    ...documentDefaults,
    id: "doc-bundy-map",
    fileName: "875 Bundy Drive Scene Diagram.jpg",
    storageKey: `cases/${OJ_CASE_ID}/documents/875bundy-scene-diagram.jpg`,
    mimeType: "image/jpeg",
    category: "evidence",
    description:
      "Diagram of the Bundy courtyard showing victim positions, blood evidence, footprints, the gate area, and pathways.",
    processingStatus: "processed",
    createdAt: "2026-06-08T13:00:00Z",
    updatedAt: "2026-06-08T13:05:00Z",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Records
// ─────────────────────────────────────────────────────────────────────────────

const recordDefaults = {
  workspaceId: OJ_WORKSPACE_ID,
  caseId: OJ_CASE_ID,
  version: 1,
  createdBy: "agent",
  createdAt: "2026-06-10T12:00:00Z",
  updatedAt: "2026-06-13T12:00:00Z",
} as const;

const acceptedByUser = {
  status: "ACCEPTED",
  approvedByUserId: demoUserId,
  approvedAt: "2026-06-12T16:00:00Z",
} as const;

const humanAuthored = {
  createdBy: "human",
  createdByUserId: demoUserId,
} as const;

const ojRecords: TypedCaseRecord[] = [
  // ── People ────────────────────────────────────────────────────────────────
  {
    ...recordDefaults,
    ...humanAuthored,
    ...acceptedByUser,
    id: "person-oj",
    type: "PERSON",
    supportStatus: "SUPPORTED",
    supportStatusExplanation:
      "Supported by the charging posture, client statement, and case context identifying Simpson as the represented defendant.",
    name: "Orenthal James Simpson",
    roles: ["CLIENT", "DEFENDANT"],
    primaryRole: "CLIENT",
    title: "O.J. Simpson",
    summary: "Client and defendant on two counts of first-degree murder.",
    content:
      "Defendant. Provided a client statement on his whereabouts, travel plans, and denial of involvement. Can speak to the relationship history and his movements on the evening of June 12, 1994.",
    party: "ours",
  },
  {
    ...recordDefaults,
    ...acceptedByUser,
    id: "person-nicole",
    type: "PERSON",
    supportStatus: "SUPPORTED",
    supportStatusExplanation:
      "Supported by the case context and source records identifying Nicole Brown Simpson as a decedent at the Bundy scene.",
    name: "Nicole Brown Simpson",
    roles: ["THIRD_PARTY"],
    primaryRole: "THIRD_PARTY",
    title: "Nicole Brown Simpson (decedent)",
    summary: "Decedent; the defendant's former wife.",
    content:
      "One of the two homicide victims, found at 875 Bundy Drive. The prosecution relies on the prior relationship and domestic-incident history to argue motive.",
    party: "neutral",
  },
  {
    ...recordDefaults,
    ...acceptedByUser,
    id: "person-goldman",
    type: "PERSON",
    supportStatus: "SUPPORTED",
    supportStatusExplanation:
      "Supported by the case context and source records identifying Ronald Goldman as a decedent at the Bundy scene.",
    name: "Ronald Lyle Goldman",
    roles: ["THIRD_PARTY"],
    primaryRole: "THIRD_PARTY",
    title: "Ronald Goldman (decedent)",
    summary: "Decedent; worked at Mezzaluna.",
    content:
      "The second homicide victim, found at the Bundy scene. Worked at Mezzaluna restaurant; his movements that evening are part of the disputed timeline.",
    party: "neutral",
  },
  {
    ...recordDefaults,
    ...acceptedByUser,
    id: "person-fuhrman",
    type: "PERSON",
    supportStatus: "CONFLICTED",
    supportStatusExplanation:
      "Supported as an LAPD detective and witness associated with the Rockingham glove, but conflicted because the scope and documentation of his discovery role are disputed.",
    name: "Mark Fuhrman",
    roles: ["POLICE_OFFICER", "WITNESS"],
    primaryRole: "POLICE_OFFICER",
    organization: "Los Angeles Police Department",
    title: "Detective Mark Fuhrman",
    summary:
      "Detective associated with discovery of the Rockingham glove; central impeachment target.",
    content:
      "LAPD detective who participated in early investigative activity at Rockingham and is associated with discovery of the second glove. The defense is investigating bias, prior statements, and whether his evidence-discovery role was fully documented.",
    party: "opposing",
  },
  {
    ...recordDefaults,
    ...acceptedByUser,
    id: "person-vannatter",
    type: "PERSON",
    supportStatus: "SUPPORTED",
    supportStatusExplanation:
      "Supported by custody records tying Vannatter to the reference draw and transport of the blood vial.",
    name: "Philip Vannatter",
    roles: ["POLICE_OFFICER", "WITNESS"],
    primaryRole: "POLICE_OFFICER",
    organization: "Los Angeles Police Department",
    title: "Detective Philip Vannatter",
    summary:
      "Lead detective who witnessed the reference blood draw and carried the vial.",
    content:
      "LAPD detective who witnessed the controlled blood draw from Simpson and is documented transporting the reference vial. The reference-vial volume discrepancy is tied to his handling of the sample.",
    party: "opposing",
  },
  {
    ...recordDefaults,
    ...acceptedByUser,
    id: "person-park",
    type: "PERSON",
    supportStatus: "SUPPORTED",
    supportStatusExplanation:
      "Supported by the Allan Park witness statement identifying him as the limousine driver and timeline witness.",
    name: "Allan Park",
    roles: ["WITNESS", "FACT_WITNESS"],
    primaryRole: "FACT_WITNESS",
    title: "Allan Park (limousine driver)",
    summary:
      "Limo driver whose arrival and observations anchor the Rockingham timeline.",
    content:
      "Assigned to drive the defendant to LAX. Reported arriving at Rockingham around 10:22–10:25 PM, not initially seeing the defendant or his vehicle, and later seeing a figure near the grounds. Descriptions vary between his statements.",
    party: "neutral",
  },
  {
    ...recordDefaults,
    ...acceptedByUser,
    id: "person-kato",
    type: "PERSON",
    supportStatus: "SUPPORTED",
    supportStatusExplanation:
      "Supported by the Kato Kaelin statement identifying him as the guest-house occupant who heard the thumps.",
    name: 'Brian "Kato" Kaelin',
    roles: ["WITNESS", "FACT_WITNESS"],
    primaryRole: "FACT_WITNESS",
    title: "Brian \"Kato\" Kaelin",
    summary:
      "Guest-house occupant who heard thumps near the guest house around 10:40 PM.",
    content:
      "Lived in the Rockingham guest house. Reported hearing thumps/impact sounds near the guest house wall around 10:40 PM but could not identify the source, cause, or participants.",
    party: "neutral",
  },
  {
    ...recordDefaults,
    id: "person-wu",
    type: "PERSON",
    supportStatus: "PARTIALLY_SUPPORTED",
    supportStatusExplanation:
      "Partially supported by the DNA report materials identifying the analyst role; the witness profile remains proposed pending confirmation of testimony scope.",
    status: "PROPOSED",
    name: "Dr. Karen Wu",
    roles: ["EXPERT_WITNESS", "WITNESS"],
    primaryRole: "EXPERT_WITNESS",
    organization: "LAPD Scientific Investigation Division",
    title: "Dr. Karen Wu (DNA analyst)",
    summary:
      "Lead SID analyst on the DNA report; anticipated prosecution forensic witness.",
    content:
      "Lead analyst on the SID DNA report. Anticipated prosecution witness on RFLP results and mixture interpretation. Cross-examination would focus on the judgment involved in contributor assignment and the absence of detected-contamination caveats.",
    party: "opposing",
  },
  {
    ...recordDefaults,
    ...humanAuthored,
    ...acceptedByUser,
    id: "person-cochran",
    type: "PERSON",
    supportStatus: "SUPPORTED",
    supportStatusExplanation:
      "Supported by the case context and defense-team records identifying Cochran as lead defense counsel.",
    name: "Johnnie Cochran",
    roles: ["ATTORNEY"],
    primaryRole: "ATTORNEY",
    title: "Johnnie Cochran (defense)",
    summary: "Lead defense trial counsel.",
    content:
      "Lead defense counsel coordinating the credibility-and-handling trial narrative across the forensic, timeline, and impeachment workstreams.",
    party: "ours",
  },
  {
    ...recordDefaults,
    ...acceptedByUser,
    id: "person-clark",
    type: "PERSON",
    supportStatus: "SUPPORTED",
    supportStatusExplanation:
      "Supported by the case context identifying Clark as lead prosecutor for the State.",
    name: "Marcia Clark",
    roles: ["ATTORNEY"],
    primaryRole: "ATTORNEY",
    organization: "Los Angeles County District Attorney",
    title: "Marcia Clark (prosecution)",
    summary: "Lead prosecutor.",
    content:
      "Lead prosecutor expected to present the blood, glove, and timeline evidence as a careful, conclusive investigation. The defense strategy anticipates her narrowing of the timeline and reliance on DNA statistics.",
    party: "opposing",
  },

  // ── Objectives (level 1) ──────────────────────────────────────────────────
  {
    ...recordDefaults,
    ...humanAuthored,
    ...acceptedByUser,
    id: "objective-001",
    type: "OBJECTIVE",
    supportStatus: "SUPPORT_NOT_REQUIRED",
    supportStatusExplanation:
      "This is a defense strategy objective, not an evidentiary assertion; linked facts and theories supply the proof beneath it.",
    substatus: "ACTIVE",
    priority: "high",
    party: "ours",
    category: "Primary",
    title: "Establish reasonable doubt without proving an alternative case",
    summary:
      "Anchor objective: attack reliability and integrity rather than assert a competing narrative.",
    content:
      "Keep the defense focused on what the State must prove and cannot — reliable identity evidence. Attack collection, contamination, chain of custody, and investigator credibility instead of committing to an alternative theory of the crime.",
    createdAt: "2026-06-08T12:00:00Z",
  },
  {
    ...recordDefaults,
    ...humanAuthored,
    ...acceptedByUser,
    id: "objective-002",
    type: "OBJECTIVE",
    supportStatus: "SUPPORT_NOT_REQUIRED",
    supportStatusExplanation:
      "This is a litigation objective about preserving disputed evidence issues; support belongs to the linked forensic and glove records.",
    substatus: "ACTIVE",
    priority: "high",
    party: "ours",
    category: "Risk control",
    title: "Keep the blood and glove evidence in dispute through trial",
    summary:
      "Objective constraining the case to preserve live challenges to the physical evidence.",
    content:
      "Preserve admissibility and reliability challenges to the DNA and glove evidence so the prosecution can never present them as uncontested. Avoid concessions that would let the jury treat the forensic match as settled.",
  },
  // Pending 1→N split: an accepted objective targeted by two proposed
  // replacements that would split it into a forensic and an investigation track.
  {
    ...recordDefaults,
    ...humanAuthored,
    ...acceptedByUser,
    id: "objective-doubt-broad",
    type: "OBJECTIVE",
    supportStatus: "SUPPORT_NOT_REQUIRED",
    supportStatusExplanation:
      "This is a jury-strategy objective under version review, so it does not require factual support as a standalone proposition.",
    substatus: "ACTIVE",
    priority: "high",
    party: "ours",
    category: "Jury strategy",
    title: "Build one unified reasonable-doubt narrative for the jury",
    summary:
      "Accepted objective currently under review by a proposed split into two focused objectives.",
    content:
      "The workspace currently frames juror persuasion as a single broad reasonable-doubt narrative. A proposal asks whether splitting it into a forensic-reliability track and an investigative-integrity track would give the jury two clearer, separately provable stories.",
  },
  {
    ...recordDefaults,
    id: "objective-doubt-forensic",
    type: "OBJECTIVE",
    supportStatus: "SUPPORT_NOT_REQUIRED",
    supportStatusExplanation:
      "This proposed objective organizes forensic reliability work; linked contamination, DNA, and custody records carry the evidentiary support.",
    status: "PROPOSED",
    substatus: "AT_RISK",
    priority: "high",
    party: "ours",
    category: "Jury strategy",
    replacesIds: ["objective-doubt-broad"],
    title: "Forensic-reliability track: make the science feel uncertain",
    summary:
      "Proposed split objective focused on contamination and mixture-interpretation doubt.",
    content:
      "One half of the proposed split: a dedicated objective to make the jury feel the DNA evidence is the product of judgment and imperfect handling, not objective certainty, through contamination, mixture-interpretation, and chain-of-custody themes.",
  },
  {
    ...recordDefaults,
    id: "objective-doubt-investigation",
    type: "OBJECTIVE",
    supportStatus: "SUPPORT_NOT_REQUIRED",
    supportStatusExplanation:
      "This proposed objective organizes investigative-integrity work; linked Fuhrman and custody records carry the evidentiary support.",
    status: "PROPOSED",
    substatus: "AT_RISK",
    priority: "high",
    party: "ours",
    category: "Jury strategy",
    replacesIds: ["objective-doubt-broad"],
    title: "Investigative-integrity track: make the jury distrust the handling",
    summary:
      "Proposed split objective focused on bias, unilateral discovery, and documentation gaps.",
    content:
      "The other half of the proposed split: a dedicated objective tying detective bias, unilateral evidence discovery, and documentation gaps into a single message — that the jury cannot trust evidence produced by this investigation.",
  },
  {
    ...recordDefaults,
    id: "objective-003",
    type: "OBJECTIVE",
    supportStatus: "SUPPORT_NOT_REQUIRED",
    supportStatusExplanation:
      "This proposed objective describes how to use discovery gaps strategically rather than asserting a discrete fact.",
    status: "PROPOSED",
    substatus: "AT_RISK",
    priority: "medium",
    party: "ours",
    category: "Trial strategy",
    title: "Make discovery and personnel gaps a visible part of the story",
    summary:
      "Proposed objective for converting missing records into juror-facing doubt.",
    content:
      "Tie missing personnel records, undocumented movements, and unreconciled discrepancies to specific evidence items so the gaps read as prejudice and unreliability rather than as defense complaints.",
  },

  // ── Claims (level 1) ──────────────────────────────────────────────────────
  {
    ...recordDefaults,
    ...humanAuthored,
    ...acceptedByUser,
    id: "claim-001",
    type: "CLAIM",
    supportStatus: "SUPPORTED",
    supportStatusExplanation:
      "Supported by the case posture and charging context alleging two first-degree murder counts.",
    substatus: "ASSERTED",
    claimType: "affirmative",
    party: "opposing",
    category: "Murder counts",
    title: "Two counts of first-degree murder",
    summary:
      "The State's charge: premeditated unlawful killing of both victims.",
    content:
      "The People allege that the defendant committed the premeditated murders of Nicole Brown Simpson and Ronald Goldman, supported by blood evidence, glove evidence, timeline evidence, and prior relationship history.",
  },
  {
    ...recordDefaults,
    ...humanAuthored,
    ...acceptedByUser,
    id: "claim-002",
    type: "CLAIM",
    supportStatus: "PARTIALLY_SUPPORTED",
    supportStatusExplanation:
      "Partially supported by linked forensic, chain-of-custody, timeline, and impeachment records, but it remains the defense theory rather than a proven fact.",
    substatus: "ASSERTED",
    claimType: "defense",
    party: "ours",
    category: "Defense",
    title: "Reasonable doubt: unreliable evidence and a tainted investigation",
    summary:
      "Defense position: the State cannot prove identity beyond a reasonable doubt.",
    content:
      "The defense asserts that the physical evidence was collected, handled, and interpreted unreliably, that the investigation was compromised by bias and documentation failures, and that the prosecution timeline is not physically established.",
  },

  // ── Posture (level 1, completed replacement pair) ─────────────────────────
  {
    ...recordDefaults,
    ...humanAuthored,
    ...acceptedByUser,
    id: "posture-002",
    type: "POSTURE",
    supportStatus: "SUPPORT_NOT_REQUIRED",
    supportStatusExplanation:
      "This is the current litigation posture and strategic framing; it is not an evidentiary assertion needing proof.",
    category: "Trial posture",
    version: 2,
    replacesIds: ["posture-003"],
    title: "Trial-facing; leverage is credibility and handling, not suppression alone",
    summary:
      "Current posture: the suppression motion is one lever among several, not the whole case.",
    content:
      "The matter is trial-facing. Even if the suppression motion is denied, the same collection, contamination, and credibility facts remain usable before the jury. Preparation should center on cross-examination sequencing and a unified handling-and-credibility narrative.",
  },
  {
    ...recordDefaults,
    id: "posture-003",
    type: "POSTURE",
    supportStatus: "SUPPORT_NOT_REQUIRED",
    supportStatusExplanation:
      "This replaced posture is retained as version history for strategy, not as a fact requiring support.",
    status: "REPLACED",
    category: "Motion posture",
    replacedByIds: ["posture-002"],
    title: "Earlier posture treated the suppression motion as the decisive battle",
    summary: "Earlier posture replaced after the trial-leverage reassessment.",
    content:
      "An earlier posture treated the motion to suppress the Rockingham evidence as the case's decisive moment. Later review concluded that the underlying facts retain jury value regardless of the suppression ruling, so the posture was broadened.",
    createdAt: "2026-06-09T12:00:00Z",
    updatedAt: "2026-06-12T12:00:00Z",
  },

  // ── Theories (level 2) ────────────────────────────────────────────────────
  // 1→3 SPLIT: a broad "the investigation was bad" theory was split into three
  // separately-provable theories with distinct evidence and witnesses.
  {
    ...recordDefaults,
    id: "theory-investigation-broad",
    type: "THEORY",
    supportStatus: "PARTIALLY_SUPPORTED",
    supportStatusExplanation:
      "Partially supported by multiple investigative-integrity records, but replaced because it was too broad to show how each proof point worked.",
    status: "REPLACED",
    substatus: "ABANDONED",
    party: "ours",
    category: "Trial theory",
    replacedByIds: [
      "theory-contamination",
      "theory-fuhrman",
      "theory-coc",
    ],
    title: "The investigation as a whole was unreliable",
    summary:
      "Broad theory split into three precise theories with separate proof.",
    content:
      "An early catch-all theory asserted the investigation was simply unreliable. Because contamination, detective bias, and chain-of-custody gaps rest on different evidence and witnesses, it was split into three discrete theories that can each be proven and argued on its own terms.",
    createdAt: "2026-06-09T10:00:00Z",
    updatedAt: "2026-06-12T12:00:00Z",
  },
  {
    ...recordDefaults,
    ...humanAuthored,
    ...acceptedByUser,
    id: "theory-contamination",
    type: "THEORY",
    supportStatus: "PARTIALLY_SUPPORTED",
    supportStatusExplanation:
      "Partially supported by handling, access, and forensic-note records; the defense still needs expert development to convert risk into trial proof.",
    substatus: "ADOPTED",
    priority: "high",
    party: "ours",
    category: "Forensic theory",
    version: 2,
    replacesIds: ["theory-investigation-broad"],
    title: "Cross-contamination undermines the blood evidence",
    summary:
      "Forensic theory: collection and lab handling created contamination risk the results don't rule out.",
    content:
      "Field collection conditions and laboratory handling created realistic opportunities for cross-contamination and degradation that the reported results do not exclude. The DNA 'matches' should be evaluated against how the samples were obtained and processed.",
  },
  {
    ...recordDefaults,
    ...humanAuthored,
    ...acceptedByUser,
    id: "theory-fuhrman",
    type: "THEORY",
    supportStatus: "PARTIALLY_SUPPORTED",
    supportStatusExplanation:
      "Partially supported by the Rockingham glove chronology and impeachment research, but still depends on fuller personnel and credibility materials.",
    substatus: "ADOPTED",
    priority: "high",
    party: "ours",
    category: "Credibility theory",
    version: 2,
    replacesIds: ["theory-investigation-broad"],
    title: "Detective bias and unilateral discovery taint key items",
    summary:
      "Credibility theory tying investigator bias to the most important physical evidence.",
    content:
      "The most decisive evidence is associated with a detective whose credibility and neutrality are in question and whose movements were not fully documented. If the jury distrusts the messenger, the weight of the glove evidence falls with him.",
  },
  {
    ...recordDefaults,
    ...humanAuthored,
    ...acceptedByUser,
    id: "theory-coc",
    type: "THEORY",
    supportStatus: "SUPPORTED",
    supportStatusExplanation:
      "Supported by accepted custody discrepancies including the BS-010 volume gap, BS-007 correction, and BS-003 documentation mismatch.",
    substatus: "ADOPTED",
    party: "ours",
    category: "Chain-of-custody theory",
    version: 2,
    replacesIds: ["theory-investigation-broad"],
    title: "Chain-of-custody gaps make the blood evidence's provenance unprovable",
    summary:
      "Theory: documentation gaps prevent the State from accounting for the evidence with certainty.",
    content:
      "Time gaps, an unaccounted reference-vial volume, and uninitialed corrections mean the State cannot fully account for the blood evidence between collection and testing. Provenance gaps are independent of contamination and stand on their own.",
  },
  {
    ...recordDefaults,
    id: "theory-alt-timeline",
    type: "THEORY",
    supportStatus: "PARTIALLY_SUPPORTED",
    supportStatusExplanation:
      "Partially supported by Park, Kato, and time-of-death records, but the physical-impossibility framing remains proposed pending reconciliation of timing assumptions.",
    status: "PROPOSED",
    substatus: "EXPLORING",
    party: "ours",
    category: "Timeline theory",
    title: "The prosecution's compressed timeline is physically implausible",
    summary:
      "Proposed theory that the required sequence cannot fit the available window.",
    content:
      "The prosecution timeline requires departure, travel, confrontation, the killings, movement through the scene, return travel, evidence disposal, and airport preparation within a narrow window. The proposal is to make implausibility — not an alternative timeline — the defense point.",
  },

  // ── Issues (level 2) ──────────────────────────────────────────────────────
  {
    ...recordDefaults,
    ...humanAuthored,
    ...acceptedByUser,
    id: "issue-001",
    type: "ISSUE",
    supportStatus: "PARTIALLY_SUPPORTED",
    supportStatusExplanation:
      "Partially supported by the Rockingham glove records and warrantless-entry dispute; legal authority still needs motion-level development.",
    substatus: "OPEN",
    issueType: "legal",
    party: "ours",
    category: "Search & seizure",
    title: "Whether the Rockingham entry and glove recovery were lawful",
    summary:
      "Legal issue underlying the motion to suppress the Rockingham evidence.",
    content:
      "Whether detectives' warrantless entry onto the Rockingham property and the subsequent recovery of the second glove fall within a recognized exception, or whether the resulting evidence should be suppressed or limited.",
    createdAt: "2026-06-10T12:00:00Z",
  },
  {
    ...recordDefaults,
    id: "issue-002",
    type: "ISSUE",
    supportStatus: "PARTIALLY_SUPPORTED",
    supportStatusExplanation:
      "Partially supported by the DNA report mixture caveats and proposed Kelly/Frye research, but cite-checking and expert foundation remain open.",
    status: "PROPOSED",
    substatus: "RESERVED",
    issueType: "procedural",
    party: "ours",
    category: "DNA admissibility",
    title: "Whether the DNA mixture interpretation meets the admissibility standard",
    summary:
      "Procedural issue on the reliability of RFLP mixture interpretation under Kelly/Frye.",
    content:
      "Whether the laboratory's mixture interpretation — which the report concedes involves analyst judgment about contributor ratios and signal strength — satisfies California's admissibility standard for novel scientific methods, or is subject to limitation.",
  },
  {
    ...recordDefaults,
    id: "issue-003",
    type: "ISSUE",
    supportStatus: "PARTIALLY_SUPPORTED",
    supportStatusExplanation:
      "Partially supported by glove-fit variables and demonstration-risk records, but the practical trial risk is unresolved.",
    status: "PROPOSED",
    substatus: "OPEN",
    issueType: "strategic",
    party: "ours",
    category: "Demonstrative risk",
    title: "Whether to request or provoke a live courtroom glove demonstration",
    summary:
      "Strategic issue weighing the upside and risk of a glove-fit demonstration.",
    content:
      "Whether the defense should pursue a live glove-fit demonstration. Leather shrinkage, moisture, drying, and liners make fit unpredictable; the upside is a vivid reasonable-doubt moment, the downside is a demonstration that cuts the wrong way.",
  },
  {
    ...recordDefaults,
    ...humanAuthored,
    ...acceptedByUser,
    id: "issue-prior-domestic",
    type: "ISSUE",
    supportStatus: "SUPPORTED",
    supportStatusExplanation:
      "Supported by the domestic-incident records and Evidence Code framing for motive, propensity, and prejudice.",
    substatus: "OPEN",
    issueType: "legal",
    party: "ours",
    category: "Character evidence",
    title: "Whether prior domestic incidents are admissible for motive",
    summary:
      "Legal issue balancing motive relevance against §1101(b) propensity limits and prejudice.",
    content:
      "Whether the prior domestic-incident records come in to show motive, or are excluded as character/propensity evidence whose prejudicial effect substantially outweighs probative value, especially where several incidents resulted in no charges.",
  },

  // ── Arguments (level 2) ───────────────────────────────────────────────────
  // PENDING replacement: an accepted argument targeted by one proposed
  // replacement that reframes Fuhrman from collateral to central.
  {
    ...recordDefaults,
    ...humanAuthored,
    ...acceptedByUser,
    id: "arg-fuhrman-collateral",
    type: "ARGUMENT",
    substatus: "DRAFT",
    supportStatus: "PARTIALLY_SUPPORTED",
    supportStatusExplanation:
      "Supported by impeachment research and the glove-discovery dispute, but only partially because the accepted record frames Fuhrman as collateral rather than a necessary evidence witness.",
    party: "ours",
    category: "Impeachment",
    title: "Fuhrman bias is collateral impeachment",
    summary:
      "Accepted framing now challenged by a proposal to make Fuhrman central to the evidence.",
    content:
      "Current strategy treats Fuhrman's potential bias as collateral credibility impeachment. A newer proposal argues this is too modest, because his credibility goes directly to the weight of the glove evidence he is associated with discovering.",
  },
  {
    ...recordDefaults,
    id: "arg-fuhrman-central",
    type: "ARGUMENT",
    status: "PROPOSED",
    substatus: "DRAFT",
    supportStatus: "PARTIALLY_SUPPORTED",
    supportStatusExplanation:
      "Partially supported by the Rockingham glove record and Fuhrman impeachment materials; remains proposed because the defense still needs stronger personnel or internal-affairs grounding before making him central.",
    party: "ours",
    category: "Impeachment",
    replacesIds: ["arg-fuhrman-collateral"],
    title: "Fuhrman is a material witness whose credibility carries the glove",
    summary:
      "Proposed replacement elevating Fuhrman from collateral impeachment to a load-bearing argument.",
    content:
      "Because the second glove's evidentiary value depends on who reported finding it, where, and whether the discovery was documented, Fuhrman is a material fact witness — not a peripheral one. The jury cannot evaluate the glove without evaluating him.",
  },
  // 2→1 MERGE: two narrower glove-fit arguments merged into one demonstration
  // argument that states the combined effect.
  {
    ...recordDefaults,
    id: "arg-glove-fit-leather",
    type: "ARGUMENT",
    supportStatus: "PARTIALLY_SUPPORTED",
    supportStatusExplanation:
      "Partially supported by fit-condition variables in the glove report, but replaced because it was too narrow standing alone.",
    status: "REPLACED",
    substatus: "DRAFT",
    party: "ours",
    category: "Glove evidence",
    replacedByIds: ["arg-glove-demo"],
    title: "Leather changes after exposure make fit unreliable",
    summary: "Narrower glove-fit argument merged into the demonstration argument.",
    content:
      "The glove was exposed to moisture, soil, and drying, all of which alter leather. On its own this read as a technical quibble about condition rather than a persuasive jury point.",
    createdAt: "2026-06-09T11:00:00Z",
    updatedAt: "2026-06-12T12:00:00Z",
  },
  {
    ...recordDefaults,
    id: "arg-glove-fit-size",
    type: "ARGUMENT",
    supportStatus: "PARTIALLY_SUPPORTED",
    supportStatusExplanation:
      "Partially supported by glove-fit uncertainty, but replaced because size alone invited an avoidable factual fight without the demonstration frame.",
    status: "REPLACED",
    substatus: "DRAFT",
    party: "ours",
    category: "Glove evidence",
    replacedByIds: ["arg-glove-demo"],
    title: "The glove may simply be the wrong size",
    summary: "Narrower glove-fit argument merged into the demonstration argument.",
    content:
      "A separate draft argued the glove might not be the defendant's size at all. Standing alone it invited a factual dispute the defense could lose without a demonstration to show it.",
    createdAt: "2026-06-09T11:05:00Z",
    updatedAt: "2026-06-12T12:00:00Z",
  },
  {
    ...recordDefaults,
    ...humanAuthored,
    ...acceptedByUser,
    id: "arg-glove-demo",
    type: "ARGUMENT",
    substatus: "DRAFT",
    supportStatus: "PARTIALLY_SUPPORTED",
    supportStatusExplanation:
      "Partially supported by the fit-history and glove reports; the demonstrative force is clear, but trial risk and common-origin proof remain unresolved.",
    party: "ours",
    category: "Glove evidence",
    version: 2,
    replacesIds: ["arg-glove-fit-leather", "arg-glove-fit-size"],
    title: "A live glove demonstration would make fit problems undeniable",
    summary:
      "Merged argument combining the leather and size points into a single demonstrative strategy.",
    content:
      "Stated together, the leather-change and size points support one move: a courtroom demonstration. If the glove visibly does not fit, the combined effect is a reasonable-doubt moment no statistical argument can match — provided the risk in issue-003 is managed.",
  },
  {
    ...recordDefaults,
    id: "arg-edta",
    type: "ARGUMENT",
    status: "PROPOSED",
    substatus: "DRAFT",
    supportStatus: "PARTIALLY_SUPPORTED",
    supportStatusExplanation:
      "Partially supported by the BS-010 volume discrepancy and Vannatter handling records; the missing-volume premise is grounded, but the planting inference still requires expert and legal development.",
    party: "ours",
    category: "Blood evidence",
    title: "The unaccounted reference-vial volume supports a planting inference",
    summary:
      "Proposed argument tying the ~1.5 mL discrepancy to a handling-and-opportunity inference.",
    content:
      "About 8 mL was drawn from the defendant but only ~6.5 mL is logged at the lab, and a detective carried the vial. The argument is not that blood was planted, but that the missing volume and the opportunity create a reasonable inference the jury may weigh.",
  },
  {
    ...recordDefaults,
    id: "arg-mixture",
    type: "ARGUMENT",
    status: "PROPOSED",
    substatus: "DRAFT",
    supportStatus: "PARTIALLY_SUPPORTED",
    supportStatusExplanation:
      "Partially supported by the DNA report's mixture and contributor-judgment limits; it does not yet defeat the prosecution's matching evidence outright.",
    party: "ours",
    category: "DNA",
    title: "Mixture interpretation rests on analyst judgment, not objective matching",
    summary:
      "Proposed argument using the report's own concessions about contributor assignment.",
    content:
      "The DNA report itself states that mixture interpretation involves analyst judgment about contributor ratios and signal strength. That concession converts an apparent 'match' into an interpretation the jury is entitled to question.",
  },
  {
    ...recordDefaults,
    id: "arg-timeline-compressed",
    type: "ARGUMENT",
    status: "PROPOSED",
    substatus: "DRAFT",
    supportStatus: "PARTIALLY_SUPPORTED",
    supportStatusExplanation:
      "Partially supported by Park's arrival account, Kato's thumps, and timeline reconstruction; the full compression argument still depends on resolving disputed timing assumptions.",
    party: "ours",
    category: "Timeline",
    title: "The State's sequence does not fit the available window",
    summary:
      "Proposed argument that the required events cannot be performed in the time allowed.",
    content:
      "Against the limo arrival, the thumps, and the airport preparation, the prosecution's required sequence is tightly compressed. The defense can press feasibility without asserting where the defendant was minute by minute.",
  },
  {
    ...recordDefaults,
    ...humanAuthored,
    ...acceptedByUser,
    id: "arg-domestic-prejudice",
    type: "ARGUMENT",
    substatus: "TRIAL_READY",
    supportStatus: "SUPPORTED",
    supportStatusExplanation:
      "Supported by the prior-incident record and prejudice theory; the argument is trial-ready because the record can be framed as propensity evidence with high unfair-prejudice risk.",
    party: "ours",
    category: "Character evidence",
    title: "Prior incidents are propensity evidence, more prejudicial than probative",
    summary:
      "Accepted argument to exclude or limit the prior domestic-incident records.",
    content:
      "Several prior incidents involved no charges, conflicting accounts, and events years before the offense, while the parties continued interacting. As motive proof they are weak; as character evidence they are highly prejudicial and should be excluded or limited.",
    createdAt: "2026-06-11T12:00:00Z",
  },

  // ── Tasks (level 2) ───────────────────────────────────────────────────────
  {
    ...recordDefaults,
    ...humanAuthored,
    ...acceptedByUser,
    id: "task-001",
    type: "TASK",
    supportStatus: "SUPPORT_NOT_REQUIRED",
    supportStatusExplanation:
      "This is a work item for trial preparation; linked custody records support why the task matters.",
    substatus: "OPEN",
    priority: "high",
    dueDate: "2026-06-25",
    category: "Trial prep",
    title: "Build the evidence-handling timeline chart for cross",
    summary:
      "High-priority chart mapping each blood item from collection to lab with every gap.",
    content:
      "Create a single chart tracing BS-001 through BS-012 from collection through booking to laboratory submission, marking every time gap, uninitialed correction, and volume discrepancy for use on cross-examination.",
  },
  {
    ...recordDefaults,
    id: "task-002",
    type: "TASK",
    supportStatus: "SUPPORT_NOT_REQUIRED",
    supportStatusExplanation:
      "This is a work item for a risk memo; the underlying glove-fit issue carries the evidentiary support.",
    status: "ACCEPTED",
    substatus: "IN_PROGRESS",
    priority: "medium",
    category: "Demonstrative",
    title: "Prepare a glove-demonstration risk memo",
    summary:
      "Proposed memo weighing the demonstration's upside against its failure modes.",
    content:
      "Assess whether to pursue a live glove-fit demonstration, including leather/moisture variables and courtroom failure modes. Blocked until the issue-003 decision on whether to take the risk.",
  },
  {
    ...recordDefaults,
    ...humanAuthored,
    ...acceptedByUser,
    id: "task-coc",
    type: "TASK",
    supportStatus: "SUPPORT_NOT_REQUIRED",
    supportStatusExplanation:
      "This is a discovery task; the Fuhrman and chain-of-custody records support why it should be done.",
    substatus: "IN_PROGRESS",
    priority: "high",
    dueDate: "2026-06-20",
    category: "Discovery",
    title: "Subpoena Fuhrman personnel and internal-affairs records",
    summary:
      "Discovery task to obtain the impeachment materials the Fuhrman theory depends on.",
    content:
      "Request and review Fuhrman's personnel file, internal-affairs materials, prior complaints, and any prior recorded statements, then map them to specific evidence-discovery actions for admissibility briefing.",
  },

  // ── Questions (level 2) ───────────────────────────────────────────────────
  // Open analytical questions the team needs to resolve — the analysis-layer
  // counterpart to tasks. UNANSWERED questions surface in Needs Attention;
  // ANSWERED ones carry the written answer (`answer`) on the record itself.
  {
    ...recordDefaults,
    id: "question-glove-demo",
    type: "QUESTION",
    supportStatus: "SUPPORT_NOT_REQUIRED",
    supportStatusExplanation:
      "An open strategic question; the linked glove-demonstration issue and risk records carry the evidentiary support.",
    status: "PROPOSED",
    substatus: "UNANSWERED",
    party: "ours",
    category: "Demonstrative risk",
    title: "Is a live glove demonstration worth the downside risk?",
    summary:
      "Proposed open question feeding the issue-003 strategic decision (migrated from a working note).",
    content:
      "If the glove demonstration is ambiguous or cuts the wrong way in front of the jury, is the potential reasonable-doubt payoff still worth it? A decision is needed before the glove-demonstration risk memo (task-002) can be finalized.",
  },
  {
    ...recordDefaults,
    ...humanAuthored,
    ...acceptedByUser,
    id: "question-edta-trace",
    type: "QUESTION",
    supportStatus: "SUPPORT_NOT_REQUIRED",
    supportStatusExplanation:
      "An open research question; the reference-vial fact and EDTA argument it points at carry the support.",
    substatus: "UNANSWERED",
    party: "ours",
    category: "Blood evidence",
    title: "Can the missing 1.5 mL be tied to a specific custody handoff?",
    summary:
      "Open question on whether the unaccounted reference volume can be localized to one transfer.",
    content:
      "The reference draw is short by roughly 1.5 mL with no explanatory memo. Can we localize where in the custody chain the volume goes missing — collection, booking, or laboratory intake — closely enough to put a name and a time on it for cross-examination?",
  },
  {
    ...recordDefaults,
    ...humanAuthored,
    ...acceptedByUser,
    id: "question-tod-window",
    type: "QUESTION",
    supportStatus: "SUPPORT_NOT_REQUIRED",
    supportStatusExplanation:
      "An analytical question now resolved; the accepted time-of-death fact and alternative-timeline theory carry the support.",
    substatus: "ANSWERED",
    party: "ours",
    category: "Time of death",
    title:
      "What is the narrowest time-of-death window the medical evidence supports?",
    summary:
      "Answered question fixing how tightly the defense can argue the death window.",
    content:
      "How tightly can we honestly argue the time-of-death window? The prosecution leans on a single-point estimate; we need to know the narrowest range the medical-examiner materials will actually bear before committing to it on cross.",
    answer:
      "Only a broad window — roughly an hour — is defensible. The medical-examiner materials support an approximate range, not the single 10:15 PM point in the prosecution summary, which rests on assumptions the examiner did not make. Anchor cross on the range and on the uncertainty itself, never on a competing point estimate.",
  },
  {
    ...recordDefaults,
    id: "question-fuhrman-scope",
    type: "QUESTION",
    supportStatus: "SUPPORT_NOT_REQUIRED",
    supportStatusExplanation:
      "A strategic question now resolved; the Fuhrman arguments and theory it points at carry the support.",
    status: "ACCEPTED",
    substatus: "ANSWERED",
    party: "ours",
    category: "Witness strategy",
    title: "Do we make Fuhrman central or keep him collateral?",
    summary:
      "Answered question setting how far to foreground Fuhrman before the personnel records land.",
    content:
      "Should the Fuhrman-bias line be the centerpiece of the defense, or a collateral impeachment that supports the contamination story? Going central raises both the payoff and the risk if the personnel records underdeliver.",
    answer:
      "Keep him collateral until the subpoenaed personnel and internal-affairs records are reviewed (task-coc). The collateral framing (arg-fuhrman-collateral) is the accepted line; the central reframing stays a proposal we adopt only if the records support it. Staking reasonable doubt on impeachment we cannot yet prove is the larger risk.",
  },
  {
    ...recordDefaults,
    id: "question-jury-narrative",
    type: "QUESTION",
    supportStatus: "SUPPORT_NOT_REQUIRED",
    supportStatusExplanation:
      "An open strategic question; the contamination theory and cross-theme note it points at carry the support.",
    status: "ACCEPTED",
    substatus: "UNANSWERED",
    party: "ours",
    category: "Strategy",
    title: "Will a contamination story hold without naming an alternative suspect?",
    summary:
      "Open question on whether reasonable doubt can rest on contamination and handling alone.",
    content:
      "Can the jury sustain reasonable doubt on a contamination-and-handling story alone, or does the absence of a named alternative suspect leave a gap they will fill against us? This governs how much weight the contamination theory can carry by itself.",
  },

  // ── Facts (level 3) ───────────────────────────────────────────────────────
  // 3-GENERATION lineage: the glove-discovery fact was sharpened twice; the
  // middle version both replaces v1 and is itself replaced by v3.
  {
    ...recordDefaults,
    id: "fact-glove-v1",
    type: "FACT",
    supportStatus: "SUPPORTED",
    supportStatusExplanation:
      "Supported at a high level by glove evidence records, but replaced because it was too vague to identify the disputed discovery details.",
    status: "REPLACED",
    isContextual: true,
    party: "ours",
    category: "Glove evidence",
    replacedByIds: ["fact-glove-v2"],
    title: "A bloody glove was found at Rockingham",
    summary: "First, vague version of the glove-discovery fact.",
    content:
      "An initial fact simply recorded that a bloody glove was found at the Rockingham property. It captured nothing about who found it, the entry justification, or documentation, so it could not support any argument.",
    createdAt: "2026-06-09T09:00:00Z",
    updatedAt: "2026-06-10T12:00:00Z",
  },
  {
    ...recordDefaults,
    id: "fact-glove-v2",
    type: "FACT",
    supportStatus: "CONFLICTED",
    supportStatusExplanation:
      "Conflicted because Fuhrman is tied to the Rockingham glove, but the warrantless-entry framing overstates a disputed legal characterization.",
    status: "REPLACED",
    version: 2,
    party: "ours",
    category: "Glove evidence",
    replacesIds: ["fact-glove-v1"],
    replacedByIds: ["fact-glove-v3"],
    title: "Fuhrman found the Rockingham glove during a warrantless entry",
    summary:
      "Sharper but overreaching version — replaced for asserting more than the record supports.",
    content:
      "A second version asserted that Fuhrman found the glove during a warrantless entry. It correctly centered the detective but overreached on the legal characterization of the entry, which is disputed and not yet established, so it was replaced by a more careful statement.",
    createdAt: "2026-06-10T12:00:00Z",
    updatedAt: "2026-06-12T12:00:00Z",
  },
  {
    ...recordDefaults,
    ...humanAuthored,
    ...acceptedByUser,
    id: "fact-glove-v3",
    type: "FACT",
    supportStatus: "CONFLICTED",
    supportStatusExplanation:
      "Conflicted because the glove reports document a Rockingham discovery, while Fuhrman's entry chronology and documentation leave the discovery sequence open to attack.",
    version: 3,
    party: "ours",
    category: "Glove evidence",
    replacesIds: ["fact-glove-v2"],
    title:
      "Fuhrman reported locating a second glove at Rockingham; the entry and discovery chronology are disputed",
    summary:
      "Accepted final version — precise about what is documented and what is contested.",
    content:
      "Detective Fuhrman reported locating a second dark glove on the rear pathway at Rockingham, near the guest house. The justification for entry, who first observed the item, and whether the discovery was contemporaneously documented are disputed and only partly recorded.",
    createdAt: "2026-06-12T12:00:00Z",
  },
  // 4-GENERATION lineage: the time-of-death fact was narrowed and re-broadened
  // across four versions as the defense settled on emphasizing uncertainty.
  {
    ...recordDefaults,
    id: "fact-tod-v1",
    type: "FACT",
    supportStatus: "CONFLICTED",
    supportStatusExplanation:
      "Conflicted because a prosecution summary supports the approximate time, while medical-examiner materials do not support that single-point precision.",
    status: "REPLACED",
    isContextual: true,
    party: "opposing",
    category: "Time of death",
    replacedByIds: ["fact-tod-v2"],
    title: "Time of death was about 10:15 PM",
    summary: "First version stating a single time, taken from a prosecution summary.",
    content:
      "An initial fact recorded a single estimated time of death of approximately 10:15 PM, drawn from a prosecution-leaning summary. It overstated the precision of the underlying medical estimate.",
    createdAt: "2026-06-09T09:10:00Z",
    updatedAt: "2026-06-10T12:00:00Z",
  },
  {
    ...recordDefaults,
    id: "fact-tod-v2",
    type: "FACT",
    supportStatus: "CONFLICTED",
    supportStatusExplanation:
      "Conflicted because investigative summaries support the half-hour window, while the medical-examiner estimate remains broader.",
    status: "REPLACED",
    isContextual: true,
    version: 2,
    party: "ours",
    category: "Time of death",
    replacesIds: ["fact-tod-v1"],
    replacedByIds: ["fact-tod-v3"],
    title: "Time of death was between 10:15 and 10:45 PM",
    summary: "Second version widened to a half-hour window.",
    content:
      "A second version widened the estimate to roughly 10:15–10:45 PM to reflect investigative summaries. It was still narrower than the underlying medical evidence supports.",
    createdAt: "2026-06-10T12:00:00Z",
    updatedAt: "2026-06-11T12:00:00Z",
  },
  {
    ...recordDefaults,
    id: "fact-tod-v3",
    type: "FACT",
    supportStatus: "SUPPORTED",
    supportStatusExplanation:
      "Supported as a general uncertainty point by the medical-examiner materials, but replaced for not tying the uncertainty to the actual range.",
    status: "REPLACED",
    isContextual: true,
    version: 3,
    party: "ours",
    category: "Time of death",
    replacesIds: ["fact-tod-v2"],
    replacedByIds: ["fact-tod-v4"],
    title: "Time of death is an estimate, not a fixed time",
    summary:
      "Third version reframed from a window to a statement about uncertainty.",
    content:
      "A third version reframed the fact away from any specific window toward the point that time of death is inherently an estimate affected by temperature, environment, and measurement timing. Useful, but not yet tied to the medical examiner's actual range.",
    createdAt: "2026-06-11T12:00:00Z",
    updatedAt: "2026-06-12T12:00:00Z",
  },
  {
    ...recordDefaults,
    ...humanAuthored,
    ...acceptedByUser,
    id: "fact-tod-v4",
    type: "FACT",
    supportStatus: "CONFLICTED",
    supportStatusExplanation:
      "Conflicted because the medical examiner supports a broad death window, but the prosecution's narrower timeline relies on additional assumptions the defense disputes.",
    version: 4,
    party: "ours",
    category: "Time of death",
    replacesIds: ["fact-tod-v3"],
    title:
      "The medical examiner's time-of-death estimate spans a wide window the prosecution narrows",
    summary:
      "Accepted final version anchoring uncertainty to the medical examiner report.",
    content:
      "The medical examiner's report provides a broad estimated time-of-death range, not a fixed point. The prosecution's narrower figure is an inference the defense can attribute to a compressed reading of the medical evidence.",
    createdAt: "2026-06-12T12:00:00Z",
  },
  // 1→2 SPLIT: a broad blood-handling fact split into two specific, separately
  // provable facts.
  {
    ...recordDefaults,
    id: "fact-blood-broad",
    type: "FACT",
    supportStatus: "PARTIALLY_SUPPORTED",
    supportStatusExplanation:
      "Partially supported by multiple blood-handling concerns, but replaced because the broad phrasing blended distinct evidence problems.",
    status: "REPLACED",
    isContextual: true,
    party: "ours",
    category: "Blood evidence",
    replacedByIds: ["fact-edta-vial", "fact-bronco-late"],
    title: "Blood evidence handling was unreliable",
    summary:
      "Broad blood-handling fact split into the reference-vial and late-Bronco facts.",
    content:
      "An early catch-all fact asserted that blood evidence handling was unreliable. Because the reference-vial volume issue and the late Bronco collection rest on different records and prove different things, the fact was split into two.",
    createdAt: "2026-06-09T09:20:00Z",
    updatedAt: "2026-06-12T12:00:00Z",
  },
  {
    ...recordDefaults,
    ...humanAuthored,
    ...acceptedByUser,
    id: "fact-edta-vial",
    type: "FACT",
    supportStatus: "SUPPORTED",
    supportStatusExplanation:
      "Supported by the custody and volume log showing a discrepancy in the reference draw after collection, with Vannatter tied to the vial's handling.",
    version: 2,
    party: "ours",
    category: "Blood evidence",
    replacesIds: ["fact-blood-broad"],
    title: "About 1.5 mL of the reference draw is unaccounted for",
    summary:
      "Discrete reference-vial fact carved out of the broad blood-handling fact.",
    content:
      "Roughly 8 mL was drawn from the defendant on June 13 in a purple-top EDTA tube, but laboratory intake documents only about 6.5 mL, leaving roughly 1.5 mL unaccounted for. No explanatory memorandum appears in the reviewed file.",
    createdAt: "2026-06-12T12:00:00Z",
  },
  {
    ...recordDefaults,
    ...humanAuthored,
    ...acceptedByUser,
    id: "fact-bronco-late",
    type: "FACT",
    supportStatus: "CONFLICTED",
    supportStatusExplanation:
      "Conflicted because Bronco inventory records support later collection timing, while DNA reports still treat the blood evidence as probative unless handling and access concerns are accepted.",
    version: 2,
    party: "ours",
    category: "Blood evidence",
    replacesIds: ["fact-blood-broad"],
    title: "Bronco interior blood was collected hours after initial processing",
    summary:
      "Discrete late-collection fact carved out of the broad blood-handling fact.",
    content:
      "Blood from the Bronco interior (BS-008 and BS-009) was collected in the evening of June 13, hours after initial scene processing and after multiple people had access to the vehicle, raising timing and opportunity questions about those samples.",
    createdAt: "2026-06-12T12:00:00Z",
  },
  // 3→1 MERGE: three documentation-discrepancy facts merged into one
  // chain-of-custody-integrity fact stating their combined effect.
  {
    ...recordDefaults,
    id: "fact-disc-photo",
    type: "FACT",
    supportStatus: "SUPPORTED",
    supportStatusExplanation:
      "Supported by the BS-003 photo-numbering mismatch between crime-scene and property records, though merged into the broader custody-integrity fact.",
    status: "REPLACED",
    isContextual: true,
    party: "ours",
    category: "Documentation",
    replacedByIds: ["fact-coc-integrity"],
    title: "BS-003 photo numbering does not match across records",
    summary: "Discrepancy fact merged into the chain-of-custody-integrity fact.",
    content:
      "Photograph references for the gate-post sample BS-003 differ between the crime-scene log and the property sheet (IMG-442–447 vs IMG-447–451), flagged during audit with no explanation recorded. Alone it reads as a clerical slip.",
    createdAt: "2026-06-09T09:30:00Z",
    updatedAt: "2026-06-12T12:00:00Z",
  },
  {
    ...recordDefaults,
    id: "fact-disc-bs007",
    type: "FACT",
    supportStatus: "SUPPORTED",
    supportStatusExplanation:
      "Supported by the BS-007 transfer sheet showing an uninitialed 4:11 to 5:11 PM correction, later merged into the custody-integrity fact.",
    status: "REPLACED",
    isContextual: true,
    party: "ours",
    category: "Documentation",
    replacedByIds: ["fact-coc-integrity"],
    title: "BS-007 transfer time was changed from 4:11 to 5:11 PM without initials",
    summary: "Discrepancy fact merged into the chain-of-custody-integrity fact.",
    content:
      "The transfer sheet for the Rockingham-driveway sample BS-007 contains a handwritten change of the transfer time from 4:11 to 5:11 PM with no accompanying initials. On its own it is one uninitialed correction.",
    createdAt: "2026-06-09T09:35:00Z",
    updatedAt: "2026-06-12T12:00:00Z",
  },
  {
    ...recordDefaults,
    id: "fact-disc-volume",
    type: "FACT",
    supportStatus: "SUPPORTED",
    supportStatusExplanation:
      "Supported by the BS-010 collection and lab-intake volume discrepancy, later merged into the custody-integrity fact.",
    status: "REPLACED",
    isContextual: true,
    party: "ours",
    category: "Documentation",
    replacedByIds: ["fact-coc-integrity"],
    title: "Reference-vial volume differs between collection and lab intake",
    summary: "Discrepancy fact merged into the chain-of-custody-integrity fact.",
    content:
      "The reference draw (BS-010) is documented at about 8 mL collected but about 6.5 mL at laboratory intake. As a standalone fact it duplicates the reference-vial point without adding the systemic angle.",
    createdAt: "2026-06-09T09:40:00Z",
    updatedAt: "2026-06-12T12:00:00Z",
  },
  {
    ...recordDefaults,
    ...humanAuthored,
    ...acceptedByUser,
    id: "fact-coc-integrity",
    type: "FACT",
    supportStatus: "SUPPORTED",
    supportStatusExplanation:
      "Supported by multiple accepted custody discrepancies, including BS-003 documentation, BS-007 correction issues, and the BS-010 volume gap.",
    version: 2,
    party: "ours",
    category: "Chain of custody",
    replacesIds: ["fact-disc-photo", "fact-disc-bs007", "fact-disc-volume"],
    title: "Multiple uncorrected discrepancies undermine the chain of custody",
    summary:
      "Merged fact stating the combined effect of the individual documentation discrepancies.",
    content:
      "Photo-numbering mismatches, an uninitialed time correction, and an unaccounted reference volume are individually small, but together they show a custody record that cannot be reconstructed to the minute — the systemic point no single discrepancy makes alone.",
    createdAt: "2026-06-12T12:00:00Z",
  },
  // PENDING replacement: an accepted fact targeted by one proposed replacement
  // that reframes the Bronco blood as innocent rather than incriminating.
  {
    ...recordDefaults,
    ...humanAuthored,
    ...acceptedByUser,
    id: "fact-bronco-his",
    type: "FACT",
    supportStatus: "CONFLICTED",
    supportStatusExplanation:
      "Conflicted because the DNA report supports consistency with Simpson's blood, while the defense challenges how probative that is given vehicle ownership and collection timing.",
    party: "opposing",
    category: "Blood evidence",
    title: "DNA in the Bronco is consistent with the defendant's blood",
    summary:
      "Accepted fact now under review by a proposal that reframes its significance.",
    content:
      "The Bronco driver-area and console samples returned profiles consistent with the defendant. Recorded as an opposing-favorable fact; a proposal questions whether this framing concedes too much by treating presence as probative of guilt.",
  },
  {
    ...recordDefaults,
    id: "fact-bronco-innocent",
    type: "FACT",
    status: "PROPOSED",
    supportStatus: "PARTIALLY_SUPPORTED",
    supportStatusExplanation:
      "Partially supported because ordinary use of Simpson's own vehicle explains some blood presence, but the proposal still needs stronger evidence separating innocent transfer from case-relevant traces.",
    party: "ours",
    category: "Blood evidence",
    replacesIds: ["fact-bronco-his"],
    title: "The defendant's blood in his own vehicle is expected, not probative",
    summary:
      "Proposed replacement reframing the Bronco DNA as innocuous given ordinary use.",
    content:
      "The defendant's own blood in his own frequently used vehicle is unremarkable and does not establish when or how it was deposited. The proposal reframes the same DNA finding from incriminating to neutral, subject to confirming low-level mixture caveats.",
  },
  {
    ...recordDefaults,
    id: "fact-dna-bundy",
    type: "FACT",
    status: "PROPOSED",
    supportStatus: "CONFLICTED",
    supportStatusExplanation:
      "Conflicted because the DNA report supports consistency with Simpson, while collection, mixture interpretation, and contamination theories challenge reliability and weight.",
    party: "opposing",
    category: "DNA",
    title: "Bundy blood drops are reported consistent with the defendant",
    summary:
      "Disputed opposing-favorable fact the defense meets with contamination and handling.",
    content:
      "The gate-post sample BS-003 returned a profile consistent with the defendant at frequencies the lab describes as highly uncommon. The defense disputes weight via collection conditions, the late-appearing rear sample, and mixture limitations rather than the chemistry.",
  },
  {
    ...recordDefaults,
    ...acceptedByUser,
    id: "fact-park-timeline",
    type: "FACT",
    supportStatus: "SUPPORTED",
    supportStatusExplanation:
      "Supported by Allan Park's statement and limo timing records documenting arrival around 10:25 PM and the initial non-observation.",
    party: "ours",
    category: "Timeline",
    title: "Allan Park arrived ~10:25 PM and did not initially see the defendant",
    summary:
      "Accepted timeline fact establishing the limousine arrival and early non-observation.",
    content:
      "Allan Park reported arriving at Rockingham around 10:22–10:25 PM, finding the property quiet, not initially seeing the defendant or his vehicle, and making multiple attempts to reach the residence before contact was made.",
    createdAt: "2026-06-11T12:00:00Z",
  },
  {
    ...recordDefaults,
    ...acceptedByUser,
    id: "fact-kato-thumps",
    type: "FACT",
    supportStatus: "SUPPORTED",
    supportStatusExplanation:
      "Supported by Kato Kaelin's statement documenting thumps near the guest house around 10:40 PM, while preserving that the source was unidentified.",
    party: "ours",
    category: "Timeline",
    title: "Kato Kaelin heard thumps near the guest house ~10:40 PM",
    summary:
      "Accepted fact preserving the ambiguity of the thumps the prosecution leans on.",
    content:
      "Kato Kaelin reported hearing thumps near the guest-house wall around 10:40 PM. He could not identify the source, cause, or participants, or determine whether the noise came from a person, an animal, or an object.",
    createdAt: "2026-06-11T12:00:00Z",
  },
  {
    ...recordDefaults,
    id: "fact-dog-timeline",
    type: "FACT",
    status: "PROPOSED",
    supportStatus: "PARTIALLY_SUPPORTED",
    supportStatusExplanation:
      "Partially supported by retrospective witness and source references, but the timing appears reconstructed after the fact and is not independently fixed.",
    party: "ours",
    category: "Timeline",
    title: "Neighbor dog-activity times are retrospective and unverified",
    summary:
      "Proposed fact characterizing the dog-activity timeline as reconstructed after the fact.",
    content:
      "Neighbor reports of barking and a distressed dog (roughly 10:45–11:30 PM) are retrospective approximations made after witnesses learned of the crime, subject to memory reconstruction and media influence, and none is independently verified.",
  },
  {
    ...recordDefaults,
    id: "fact-second-glove-fit",
    type: "FACT",
    status: "PROPOSED",
    supportStatus: "PARTIALLY_SUPPORTED",
    supportStatusExplanation:
      "Partially supported by glove records and fit-history materials, but the current sources do not establish common origin or resolve fit-condition variables.",
    party: "ours",
    category: "Glove evidence",
    title: "Whether the two gloves originate from the same pair is unestablished",
    summary:
      "Proposed fact preserving that visual similarity is not common origin.",
    content:
      "The glove report states the two gloves appeared visually consistent but that visual similarity does not establish common origin, and that additional testing is required. The proposal records this as an open evidentiary point rather than a concession.",
  },
  // One frozen ("Rejected") record to exercise the frozen disposition + filter.
  // Frozen is orthogonal to lifecycle: this was a proposal that was declined and
  // kept for reference, so its lifecycle is PROPOSED and `rejectedAt` marks it
  // frozen. It reads as "Rejected", stays out of the review queue, and is
  // linkable via the picker's "Include rejected" toggle. See recordIsFrozen.
  {
    ...recordDefaults,
    id: "fact-alt-suspect-rejected",
    type: "FACT",
    status: "PROPOSED",
    rejectedAt: "2026-06-13T12:00:00Z",
    supportStatus: "UNSUPPORTED",
    supportStatusExplanation:
      "Unsupported because no grounded source identifies a third-party perpetrator; the assertion overcommits the defense beyond reasonable-doubt strategy.",
    party: "ours",
    category: "Alternative theory",
    title: "An unidentified third party committed the murders",
    summary:
      "Rejected: asserts an affirmative alternative the evidence cannot support.",
    content:
      "A proposed fact asserting that an unidentified third party committed the murders. Rejected because it commits the defense to proving an alternative narrative, contrary to objective-001's reasonable-doubt strategy, and is unsupported by the record.",
    rejectionReason:
      "Commits the defense to affirmatively proving an alternative narrative — contrary to objective-001's reasonable-doubt strategy — and is unsupported by the record. Kept as reference so the agent doesn't re-propose it.",
  },

  // ── Timeline events (level 3) ─────────────────────────────────────────────
  {
    ...recordDefaults,
    ...acceptedByUser,
    id: "timeline-dinner",
    type: "TIMELINE_EVENT",
    supportStatus: "SUPPORTED",
    supportStatusExplanation:
      "Supported as a background anchor by witness and restaurant-context records for the evening of June 12.",
    eventDate: "1994-06-12",
    party: "neutral",
    category: "Background",
    title: "Mezzaluna family dinner",
    summary: "Confirmed anchor event earlier in the evening.",
    content:
      "Nicole Brown Simpson attended a family dinner at Mezzaluna during the evening of June 12, 1994, confirmed by multiple witnesses. Ronald Goldman worked at the restaurant that evening.",
    createdAt: "2026-06-10T12:00:00Z",
  },
  {
    ...recordDefaults,
    id: "timeline-tod",
    type: "TIMELINE_EVENT",
    status: "PROPOSED",
    supportStatus: "CONFLICTED",
    supportStatusExplanation:
      "Conflicted because the proposed minute window narrows the medical examiner's broader estimate and depends on disputed prosecution sequencing.",
    // Bounded uncertainty: the killings happened at one moment known only to
    // fall within this window — not an event that occupied the whole interval.
    eventDate: "1994-06-12T22:15:00",
    eventEndDate: "1994-06-12T22:45:00",
    datePrecision: "minute",
    party: "ours",
    category: "Time of death",
    title: "Estimated time-of-death window",
    summary:
      "Proposed event marking the disputed time-of-death range on the timeline.",
    content:
      "Investigative summaries reference roughly 10:15–10:45 PM, while the medical examiner's underlying estimate is broader. The proposal places the window on the timeline as a range, flagged for reconciliation against the ME report.",
  },
  {
    ...recordDefaults,
    ...acceptedByUser,
    id: "timeline-park",
    type: "TIMELINE_EVENT",
    supportStatus: "SUPPORTED",
    supportStatusExplanation:
      "Supported by Allan Park statement materials placing the limousine arrival at approximately 10:22 to 10:25 PM.",
    eventDate: "1994-06-12T22:25:00",
    datePrecision: "minute",
    party: "ours",
    category: "Timeline",
    title: "Limousine arrives at Rockingham (~10:25 PM)",
    summary: "Confirmed arrival event anchoring the defense timeline.",
    content:
      "Allan Park arrived at Rockingham around 10:22–10:25 PM, found the property quiet, and did not initially observe the defendant or his vehicle.",
    createdAt: "2026-06-11T12:00:00Z",
  },
  {
    ...recordDefaults,
    id: "timeline-kato",
    type: "TIMELINE_EVENT",
    supportStatus: "PARTIALLY_SUPPORTED",
    supportStatusExplanation:
      "Partially supported by Kato Kaelin statement materials; the exact time and source of the thumps remain approximate.",
    status: "PROPOSED",
    datePrecision: "minute",
    eventDate: "1994-06-12T22:40:00",
    party: "ours",
    category: "Timeline",
    title: "Kato hears thumps near the guest house (~10:40 PM)",
    summary: "Proposed approximate event for the unattributed thumps.",
    content:
      "Around 10:40 PM Kato Kaelin reported hearing thumps near the guest house. Time and source are approximate and unconfirmed; placed on the timeline pending corroboration.",
  },
  {
    ...recordDefaults,
    ...acceptedByUser,
    id: "timeline-departure",
    type: "TIMELINE_EVENT",
    supportStatus: "SUPPORTED",
    supportStatusExplanation:
      "Supported by timeline and client/travel records placing the LAX departure around 11:00 PM.",
    eventDate: "1994-06-12T23:00:00",
    datePrecision: "minute",
    party: "ours",
    category: "Timeline",
    title: "Departure for LAX (~11:00 PM)",
    summary: "Confirmed departure event for the airport trip.",
    content:
      "The defendant departed Rockingham for Los Angeles International Airport by limousine at approximately 11:00 PM for a scheduled flight to Chicago.",
    createdAt: "2026-06-11T12:00:00Z",
  },
  {
    ...recordDefaults,
    ...acceptedByUser,
    id: "timeline-bodies",
    type: "TIMELINE_EVENT",
    supportStatus: "SUPPORTED",
    supportStatusExplanation:
      "Supported by initial police response records documenting discovery of the victims at Bundy after midnight.",
    eventDate: "1994-06-13",
    party: "neutral",
    category: "Discovery",
    title: "Bodies discovered at 875 Bundy Drive",
    summary: "Confirmed discovery event beginning the investigation.",
    content:
      "The victims were discovered outside Nicole Brown Simpson's Bundy Drive residence after midnight on June 13, 1994, and responding officers secured the scene.",
    createdAt: "2026-06-10T12:00:00Z",
  },
  {
    ...recordDefaults,
    ...acceptedByUser,
    id: "timeline-rockingham-glove",
    type: "TIMELINE_EVENT",
    supportStatus: "CONFLICTED",
    supportStatusExplanation:
      "Conflicted because the reported 3:17 PM discovery is documented, but the entry and discovery chronology and Fuhrman's role remain disputed.",
    eventDate: "1994-06-13T15:17:00",
    datePrecision: "minute",
    party: "ours",
    category: "Evidence",
    title: "Second glove reported at Rockingham (3:17 PM)",
    summary:
      "Disputed event placing the Rockingham glove recovery many hours after the Bundy glove.",
    content:
      "The Rockingham glove (GE-002) was logged collected at 3:17 PM on June 13 — roughly nine hours after the Bundy glove (GE-001) was collected at 6:31 AM. The gap and the discovery circumstances are central to the credibility theory.",
    createdAt: "2026-06-12T12:00:00Z",
  },
  {
    ...recordDefaults,
    ...acceptedByUser,
    id: "timeline-bronco-pursuit",
    type: "TIMELINE_EVENT",
    supportStatus: "SUPPORTED",
    supportStatusExplanation:
      "Supported as a procedural event by case chronology records documenting the June 17 Bronco pursuit and arrest.",
    // True extent: the pursuit genuinely spanned the interval (~6:45–8:50 PM),
    // unlike the time-of-death window which is a single instant known only
    // approximately.
    eventDate: "1994-06-17T18:45:00",
    eventEndDate: "1994-06-17T20:50:00",
    datePrecision: "minute",
    party: "opposing",
    category: "Procedural",
    title: "Bronco pursuit and arrest",
    summary: "Confirmed procedural event the prosecution frames as consciousness of guilt.",
    content:
      "Following the failure to surrender as expected, the white Ford Bronco pursuit occurred and the defendant was arrested and charged. The prosecution may argue consciousness of guilt; the defense will contextualize.",
    createdAt: "2026-06-10T12:00:00Z",
  },
  {
    ...recordDefaults,
    ...acceptedByUser,
    id: "timeline-prior-1989",
    type: "TIMELINE_EVENT",
    supportStatus: "SUPPORTED",
    supportStatusExplanation:
      "Supported by prior domestic-incident records documenting the January 1, 1989 response and arrest-related event.",
    eventDate: "1989-01-01",
    party: "opposing",
    category: "Prior incidents",
    title: "1989 domestic incident and arrest (DR-1989-1127)",
    summary:
      "Confirmed prior incident the prosecution may use for motive; subject to admissibility.",
    content:
      "On January 1, 1989 LAPD responded to a reported domestic disturbance at Rockingham (report DR-1989-1127), documented injuries, and initiated arrest procedures. Admissibility for motive is contested under issue-prior-domestic.",
    createdAt: "2026-06-11T12:00:00Z",
  },

  // ── Testimony (level 3) ───────────────────────────────────────────────────
  {
    ...recordDefaults,
    ...acceptedByUser,
    id: "testimony-park",
    type: "TESTIMONY",
    supportStatus: "SUPPORTED",
    supportStatusExplanation:
      "Supported by Park statement records for arrival, contact attempts, and early non-observation, with the figure observation treated carefully.",
    substatus: "ANTICIPATED",
    witnessPersonRecordId: "person-park",
    party: "ours",
    category: "Anticipated",
    title: "Park should anchor the arrival timeline and early non-observation",
    summary:
      "Anticipated testimony module for the limousine timeline and ambiguity of the later figure.",
    content:
      "Allan Park can establish arrival around 10:25 PM, the quiet property, and his initial failure to see the defendant or vehicle, while the defense limits the weight of his later 'figure' observation given distance, darkness, and varying descriptions.",
    createdAt: "2026-06-11T12:00:00Z",
  },
  {
    ...recordDefaults,
    ...acceptedByUser,
    id: "testimony-kato",
    type: "TESTIMONY",
    supportStatus: "SUPPORTED",
    supportStatusExplanation:
      "Supported by Kato statement records confirming thumps while preserving that their source was unidentified.",
    substatus: "ANTICIPATED",
    witnessPersonRecordId: "person-kato",
    party: "ours",
    category: "Anticipated",
    title: "Kato should confirm the thumps were unattributed",
    summary:
      "Anticipated testimony preserving that the thumps identify nothing.",
    content:
      "Kato Kaelin can confirm hearing thumps around 10:40 PM while making clear he could not identify the source or participants, blunting any inference the prosecution draws from the sound.",
    createdAt: "2026-06-11T12:00:00Z",
  },
  {
    ...recordDefaults,
    id: "testimony-fuhrman-cross",
    type: "TESTIMONY",
    supportStatus: "PARTIALLY_SUPPORTED",
    supportStatusExplanation:
      "Partially supported by glove chronology and impeachment materials; final cross topics depend on personnel and prior-statement records.",
    status: "PROPOSED",
    substatus: "PREPARED",
    witnessPersonRecordId: "person-fuhrman",
    party: "opposing",
    category: "Cross-exam",
    title: "Cross Fuhrman on bias and the glove-discovery chronology",
    summary:
      "Proposed cross module linking credibility to the glove the prosecution relies on.",
    content:
      "A cross-examination module establishing Fuhrman's movements at Rockingham, who first observed the glove, whether it was photographed before being touched, and any prior statements bearing on bias and truthfulness.",
  },
  {
    ...recordDefaults,
    id: "testimony-wu-cross",
    type: "TESTIMONY",
    supportStatus: "PARTIALLY_SUPPORTED",
    supportStatusExplanation:
      "Partially supported by DNA report mixture caveats; final cross scope depends on analyst testimony and expert review.",
    status: "PROPOSED",
    substatus: "PREPARED",
    witnessPersonRecordId: "person-wu",
    party: "opposing",
    category: "Cross-exam",
    title: "Cross the DNA analyst on mixture judgment and contamination caveats",
    summary:
      "Proposed cross module surfacing the report's own concessions about interpretation.",
    content:
      "A cross-examination module having the analyst concede that mixture interpretation involves judgment about contributor ratios and signal strength, and that the report does not rule out pre-laboratory handling effects.",
  },

  // ── Legal precedent (level 3) ─────────────────────────────────────────────
  {
    ...recordDefaults,
    id: "precedent-kelly-frye",
    type: "LEGAL_PRECEDENT",
    supportStatus: "UNKNOWN",
    supportStatusExplanation:
      "Unknown until the candidate Kelly/Frye authority is cite-checked and confirmed as current, applicable California law.",
    status: "PROPOSED",
    citeChecked: false,
    jurisdiction: "California",
    category: "DNA admissibility",
    title: "Kelly/Frye standard for novel scientific evidence",
    summary:
      "Research item on the admissibility standard for the DNA mixture methodology.",
    content:
      "Candidate authority for challenging the general acceptance and reliable application of the laboratory's mixture-interpretation methodology under California's Kelly/Frye framework. Citations and current-law status must be verified before filing.",
  },
  {
    ...recordDefaults,
    id: "precedent-fourth-amendment",
    type: "LEGAL_PRECEDENT",
    supportStatus: "UNKNOWN",
    supportStatusExplanation:
      "Unknown until the warrantless-entry authorities are cite-checked and matched to the Rockingham entry facts.",
    status: "PROPOSED",
    citeChecked: false,
    jurisdiction: "Federal / California",
    category: "Search & seizure",
    title: "Warrantless-entry and exigent-circumstances authority",
    summary:
      "Research item supporting the motion to suppress the Rockingham evidence.",
    content:
      "Candidate Fourth Amendment authority on warrantless entry and the scope of exigent-circumstances and community-caretaking exceptions, for the motion to suppress the Rockingham glove and related evidence. Cite-check required.",
  },
  {
    ...recordDefaults,
    id: "precedent-1101b",
    type: "LEGAL_PRECEDENT",
    supportStatus: "UNKNOWN",
    supportStatusExplanation:
      "Unknown until the Evidence Code section 1101(b) and section 352 authorities are cite-checked for the prior-acts issue.",
    status: "PROPOSED",
    citeChecked: false,
    jurisdiction: "California",
    category: "Character evidence",
    title: "Evidence Code §1101(b) limits on prior-acts evidence",
    summary:
      "Research item for excluding or limiting the prior domestic-incident records.",
    content:
      "Candidate authority under California Evidence Code §1101(b) and §352 for excluding or limiting the prior domestic incidents as propensity evidence whose prejudice outweighs probative value. Citations must be verified.",
  },

  // ── Notes (level 3) ───────────────────────────────────────────────────────
  {
    ...recordDefaults,
    ...humanAuthored,
    ...acceptedByUser,
    id: "note-cross-theme",
    type: "NOTE",
    supportStatus: "SUPPORT_NOT_REQUIRED",
    supportStatusExplanation:
      "This is a pinned strategy note; its value comes from organizing linked forensic and handling records rather than asserting a discrete fact.",
    pinned: true,
    category: "Strategy",
    title: "Cross theme: trust the science, distrust the handling",
    summary:
      "Pinned framing note separating attacks on chemistry from attacks on procedure.",
    content:
      "Do not attack DNA science in the abstract — juries believe it. Attack collection, contamination, custody, and the people who handled the samples. The message is that good science was applied to evidence that cannot be trusted.",
  },
  {
    ...recordDefaults,
    ...humanAuthored,
    ...acceptedByUser,
    id: "note-fuhrman-caution",
    type: "NOTE",
    supportStatus: "SUPPORT_NOT_REQUIRED",
    supportStatusExplanation:
      "This is a human correction governing agent behavior and does not need evidentiary support as a standalone record.",
    pinned: true,
    category: "Human correction",
    title: "Do not assert evidence was planted as established fact",
    summary:
      "Human correction keeping the planting theory as an inference, not an assertion.",
    content:
      "Agent drafts should argue the conditions and opportunity that make planting or contamination possible, and let the jury draw the inference. They should not state as fact that any item was planted unless the record supports it.",
  },

  // ── Document records (level 4) ────────────────────────────────────────────
  // Glove report split into several DOCUMENT records.
  {
    ...recordDefaults,
    ...acceptedByUser,
    id: "docrec-glove-bundy",
    type: "DOCUMENT",
    supportStatus: "SUPPORTED",
    supportStatusExplanation:
      "Supported by the processed glove report section documenting GE-001 recovery, condition, and collection time.",
    documentId: "doc-glove",
    fileName: "Glove Evidence Report.pdf",
    pageRange: { start: 3, end: 5 },
    category: "Glove evidence",
    title: "Glove report — Bundy glove (GE-001) recovery",
    summary:
      "Section documenting the Bundy glove discovery, condition, and 6:31 AM collection.",
    content:
      "The section covering GE-001: a dark leather glove with apparent blood staining found partially concealed by vegetation on the Bundy side pathway, photographed in place, and collected by Richard Alvarez at 6:31 AM on June 13.",
    createdAt: "2026-06-08T13:30:00Z",
  },
  {
    ...recordDefaults,
    ...acceptedByUser,
    id: "docrec-glove-rockingham",
    type: "DOCUMENT",
    supportStatus: "SUPPORTED",
    supportStatusExplanation:
      "Supported by the processed glove report section documenting GE-002 recovery near the Rockingham guest house and collection time.",
    documentId: "doc-glove",
    fileName: "Glove Evidence Report.pdf",
    pageRange: { start: 6, end: 8 },
    category: "Glove evidence",
    title: "Glove report — Rockingham glove (GE-002) recovery",
    summary:
      "Section documenting the second glove behind the guest house, collected at 3:17 PM.",
    content:
      "The section covering GE-002: a dark glove found on the rear Rockingham pathway near the guest house during an expanded search, collected by Detective Ortega at 3:17 PM on June 13 — about nine hours after the Bundy glove.",
    createdAt: "2026-06-08T13:30:00Z",
  },
  {
    ...recordDefaults,
    ...acceptedByUser,
    id: "docrec-glove-discrepancy",
    type: "DOCUMENT",
    supportStatus: "SUPPORTED",
    supportStatusExplanation:
      "Supported by the glove report documentation-issues section noting inconsistent Bundy glove visibility descriptions.",
    documentId: "doc-glove",
    fileName: "Glove Evidence Report.pdf",
    pageRange: { start: 13, end: 14 },
    category: "Glove evidence",
    title: "Glove report — 'concealed vs plainly visible' discrepancy",
    summary:
      "The documentation-issues section noting conflicting descriptions of the Bundy glove.",
    content:
      "The report's documentation-issues section: early reports describe the Bundy glove as partially concealed while later summaries call it plainly visible, and the differing descriptions were never reconciled. Notes were also prepared hours after discovery.",
    createdAt: "2026-06-08T13:30:00Z",
  },
  {
    ...recordDefaults,
    id: "docrec-glove-fit-history",
    type: "DOCUMENT",
    supportStatus: "PARTIALLY_SUPPORTED",
    supportStatusExplanation:
      "Partially supported by the glove report fit-considerations section, but still proposed pending review of fit variables and conclusions.",
    status: "PROPOSED",
    documentId: "doc-glove",
    fileName: "Glove Evidence Report.pdf",
    pageRange: { start: 15, end: 16 },
    category: "Glove evidence",
    title: "Glove report — fit-demonstration considerations",
    summary:
      "Proposed extraction of the fit-demonstration variables (shrinkage, moisture, liners).",
    content:
      "The fit-demonstration section listing variables that could affect a glove fit — leather shrinkage, moisture exposure, drying, liners, and protective gloves beneath — with no fit conclusions reached. Proposed; relevant to the demonstration-risk analysis.",
  },
  // Chain-of-custody report records, including a REPLACED first-pass OCR record.
  {
    ...recordDefaults,
    id: "docrec-coc-firstpass",
    type: "DOCUMENT",
    supportStatus: "PARTIALLY_SUPPORTED",
    supportStatusExplanation:
      "Partially supported as an initial OCR extraction, but replaced because the tabular custody data was flattened and partly unreliable.",
    status: "REPLACED",
    replacedByIds: ["docrec-coc-bs010-volume"],
    documentId: "doc-coc",
    fileName: "Biological Evidence Chain-of-Custody Log.pdf",
    category: "Chain of custody",
    title: "Custody log — first-pass extraction (OCR)",
    summary:
      "Earlier OCR extraction replaced after the tabular custody entries were re-read.",
    content:
      "The first-pass OCR extraction of the custody log. Its tabular transfer times and volumes were flattened and partly garbled, so it was replaced by targeted section extractions checked against the source.",
    createdAt: "2026-06-08T12:40:00Z",
    updatedAt: "2026-06-08T13:10:00Z",
  },
  {
    ...recordDefaults,
    ...acceptedByUser,
    id: "docrec-coc-bs010-volume",
    type: "DOCUMENT",
    supportStatus: "SUPPORTED",
    supportStatusExplanation:
      "Supported by the processed custody-log section documenting the BS-010 reference draw and lab-intake volume discrepancy.",
    documentId: "doc-coc",
    fileName: "Biological Evidence Chain-of-Custody Log.pdf",
    pageRange: { start: 12, end: 13 },
    category: "Chain of custody",
    title: "Custody log — BS-010 reference draw (8 mL vs 6.5 mL)",
    summary:
      "Section documenting the reference draw and the unaccounted volume.",
    content:
      "The BS-010 section: roughly 8 mL drawn from the defendant in a purple-top EDTA tube, witnessed by Detective Vannatter, with laboratory intake reflecting about 6.5 mL and no explanatory memorandum located.",
    createdAt: "2026-06-08T13:10:00Z",
  },
  {
    ...recordDefaults,
    ...acceptedByUser,
    id: "docrec-coc-bs007",
    type: "DOCUMENT",
    supportStatus: "SUPPORTED",
    supportStatusExplanation:
      "Supported by the processed custody-log entry showing the uninitialed BS-007 time correction.",
    documentId: "doc-coc",
    fileName: "Biological Evidence Chain-of-Custody Log.pdf",
    pageRange: { start: 9, end: 9 },
    category: "Chain of custody",
    title: "Custody log — BS-007 uninitialed time change",
    summary: "Single-point record of the 4:11→5:11 PM correction without initials.",
    content:
      "The BS-007 entry showing the transfer time changed by hand from 4:11 to 5:11 PM with no accompanying initials, flagged during later review.",
    createdAt: "2026-06-08T13:10:00Z",
  },
  {
    ...recordDefaults,
    ...acceptedByUser,
    id: "docrec-coc-bs003",
    type: "DOCUMENT",
    supportStatus: "SUPPORTED",
    supportStatusExplanation:
      "Supported by the processed custody-log entry showing the BS-003 photo-numbering discrepancy.",
    documentId: "doc-coc",
    fileName: "Biological Evidence Chain-of-Custody Log.pdf",
    pageRange: { start: 6, end: 6 },
    category: "Chain of custody",
    title: "Custody log — BS-003 photo-numbering discrepancy",
    summary: "Single-point record of the gate-post photo-numbering mismatch.",
    content:
      "The BS-003 entry where photograph references differ between the crime-scene log (IMG-442–447) and the property sheet (IMG-447–451), flagged in audit with no explanation recorded.",
    createdAt: "2026-06-08T13:10:00Z",
  },
  {
    ...recordDefaults,
    id: "docrec-coc-access-log",
    type: "DOCUMENT",
    supportStatus: "PARTIALLY_SUPPORTED",
    supportStatusExplanation:
      "Partially supported by the custody-log access review, but still proposed pending review for the handling-timeline chart.",
    status: "PROPOSED",
    documentId: "doc-coc",
    fileName: "Biological Evidence Chain-of-Custody Log.pdf",
    pageRange: { start: 20, end: 21 },
    category: "Chain of custody",
    title: "Custody log — evidence access-log review",
    summary:
      "Proposed extraction of the access-log review and booking time gaps.",
    content:
      "The access-log review noting 17 authorized accesses, supervisory inspections, retrievals, and returns, plus 30-minute-to-several-hour gaps between collection and booking. Proposed; useful for the handling-timeline chart.",
  },
  // DNA report records.
  {
    ...recordDefaults,
    ...acceptedByUser,
    id: "docrec-dna-bundy",
    type: "DOCUMENT",
    supportStatus: "SUPPORTED",
    supportStatusExplanation:
      "Supported by the processed DNA report section covering Bundy samples BS-001 through BS-004.",
    documentId: "doc-dna",
    fileName: "DNA Laboratory Analysis Report.pdf",
    pageRange: { start: 5, end: 9 },
    category: "DNA",
    title: "DNA report — Bundy drops (BS-001 to BS-004)",
    summary:
      "Section reporting the Bundy walkway and gate-post profiles, including the partial rear sample.",
    content:
      "The section reporting profiles for the Bundy items: BS-001 consistent with Nicole Brown Simpson, BS-002 with Goldman, BS-003 (gate post) with the defendant, and BS-004 a degraded partial profile from the rear pathway.",
    createdAt: "2026-06-08T13:30:00Z",
  },
  {
    ...recordDefaults,
    ...acceptedByUser,
    id: "docrec-dna-gloves",
    type: "DOCUMENT",
    supportStatus: "SUPPORTED",
    supportStatusExplanation:
      "Supported by the processed DNA report section covering glove mixture samples BS-005 and BS-006.",
    documentId: "doc-dna",
    fileName: "DNA Laboratory Analysis Report.pdf",
    pageRange: { start: 10, end: 12 },
    category: "DNA",
    title: "DNA report — glove mixtures (BS-005, BS-006)",
    summary:
      "Section reporting the multi-contributor profiles on both gloves.",
    content:
      "The section reporting that biological material on both gloves contained mixed profiles with characteristics consistent with all three referenced individuals, with the report cautioning that mixture interpretation involves contributor-ratio assumptions.",
    createdAt: "2026-06-08T13:30:00Z",
  },
  {
    ...recordDefaults,
    ...acceptedByUser,
    id: "docrec-dna-mixture-limits",
    type: "DOCUMENT",
    supportStatus: "SUPPORTED",
    supportStatusExplanation:
      "Supported by the DNA report limitations section describing analyst judgment in mixture interpretation.",
    documentId: "doc-dna",
    fileName: "DNA Laboratory Analysis Report.pdf",
    pageRange: { start: 16, end: 17 },
    category: "DNA",
    title: "DNA report — mixture-interpretation limitations",
    summary:
      "The report's own statement that mixture interpretation involves analyst judgment.",
    content:
      "The mixture-analysis summary conceding that interpretation necessarily involves analyst judgment about contributor assignment, relative band intensity, and signal strength — the report's own language supporting the mixture argument.",
    createdAt: "2026-06-08T13:30:00Z",
  },
  {
    ...recordDefaults,
    id: "docrec-dna-bronco",
    type: "DOCUMENT",
    supportStatus: "PARTIALLY_SUPPORTED",
    supportStatusExplanation:
      "Partially supported by the DNA report Bronco sample section, but still proposed pending review of collection timing and probative value.",
    status: "PROPOSED",
    documentId: "doc-dna",
    fileName: "DNA Laboratory Analysis Report.pdf",
    pageRange: { start: 13, end: 15 },
    category: "DNA",
    title: "DNA report — Bronco samples (BS-008, BS-009)",
    summary:
      "Proposed extraction of the low-level Bronco mixtures and their caveats.",
    content:
      "The section on the Bronco driver-area and console samples, including low-level mixture components the report says are insufficient for definitive attribution. Proposed; central to the Bronco reframing proposal.",
  },
  // Defense timeline memo records.
  {
    ...recordDefaults,
    ...acceptedByUser,
    id: "docrec-timeline-tod",
    type: "DOCUMENT",
    supportStatus: "SUPPORTED",
    supportStatusExplanation:
      "Supported by the defense timeline memo section describing time-of-death uncertainty.",
    documentId: "doc-defense-timeline",
    fileName: "Defense Timeline Reconstruction Memo.pdf",
    pageRange: { start: 4, end: 6 },
    category: "Time of death",
    title: "Timeline memo — time-of-death uncertainty",
    summary:
      "Section arguing the ME estimate is a range and the prosecution narrows it.",
    content:
      "The memo section on time of death, noting medical estimates provide a range rather than a fixed point and that the prosecution may present a narrower timeline than the underlying evidence supports.",
    createdAt: "2026-06-09T11:00:00Z",
  },
  {
    ...recordDefaults,
    ...acceptedByUser,
    id: "docrec-timeline-compression",
    type: "DOCUMENT",
    supportStatus: "SUPPORTED",
    supportStatusExplanation:
      "Supported by the defense timeline memo section analyzing travel and sequence compression.",
    documentId: "doc-defense-timeline",
    fileName: "Defense Timeline Reconstruction Memo.pdf",
    pageRange: { start: 10, end: 12 },
    category: "Timeline",
    title: "Timeline memo — Rockingham–Bundy travel and compression",
    summary:
      "Section on the travel-time estimates and the compressed required sequence.",
    content:
      "The memo section estimating 5–15 minutes for the 2.5–3 mile Rockingham-to-Bundy trip and listing the sequence the prosecution timeline requires within a narrow window, supporting the implausibility argument.",
    createdAt: "2026-06-09T11:00:00Z",
  },
  // Witness statement records.
  {
    ...recordDefaults,
    ...acceptedByUser,
    id: "docrec-park-arrival",
    type: "DOCUMENT",
    supportStatus: "SUPPORTED",
    supportStatusExplanation:
      "Supported by the Park statement section on arrival time and contact attempts.",
    documentId: "doc-park",
    fileName: "Allan Park Witness Statement.pdf",
    pageRange: { start: 2, end: 3 },
    category: "Timeline",
    title: "Park statement — arrival and contact attempts",
    summary:
      "Section establishing the ~10:25 PM arrival and failure to initially see the defendant.",
    content:
      "Park's account of arriving around 10:22–10:25 PM, finding the property quiet, not initially seeing the defendant or vehicle, and making multiple attempts to contact the residence.",
    createdAt: "2026-06-09T11:00:00Z",
  },
  {
    ...recordDefaults,
    id: "docrec-park-figure",
    type: "DOCUMENT",
    supportStatus: "PARTIALLY_SUPPORTED",
    supportStatusExplanation:
      "Partially supported by Park statement materials, but proposed because the figure observation is variable and needs careful treatment.",
    status: "PROPOSED",
    documentId: "doc-park",
    fileName: "Allan Park Witness Statement.pdf",
    pageRange: { start: 4, end: 5 },
    category: "Timeline",
    title: "Park statement — the 'figure' observation",
    summary:
      "Proposed extraction of the later figure/shadow observation whose description varies.",
    content:
      "Park's later report of seeing a figure or shadow near the grounds, with descriptions varying between reports and interviews and limited detail given distance and darkness. Proposed; relevant to limiting that observation's weight.",
  },
  {
    ...recordDefaults,
    ...acceptedByUser,
    id: "docrec-kato-thumps",
    type: "DOCUMENT",
    supportStatus: "SUPPORTED",
    supportStatusExplanation:
      "Supported by the Kato statement section documenting thumps near the guest house.",
    documentId: "doc-kato",
    fileName: "Kato Kaelin Statement.pdf",
    pageRange: { start: 2, end: 3 },
    category: "Timeline",
    title: "Kato statement — thumps near the guest house",
    summary:
      "Section recording the ~10:40 PM thumps and Kato's inability to identify the source.",
    content:
      "Kato's account of hearing thumps near the guest-house wall around 10:40 PM, described variously as thumps, bumps, or impact sounds, with no ability to identify the source, cause, or participants.",
    createdAt: "2026-06-09T11:00:00Z",
  },
  // Medical examiner record.
  {
    ...recordDefaults,
    ...acceptedByUser,
    id: "docrec-me-tod",
    type: "DOCUMENT",
    supportStatus: "SUPPORTED",
    supportStatusExplanation:
      "Supported by the medical-examiner report section describing the estimated time-of-death range.",
    documentId: "doc-me",
    fileName: "Medical Examiner Report.pdf",
    pageRange: { start: 8, end: 10 },
    category: "Time of death",
    title: "ME report — estimated time-of-death range",
    summary:
      "Section establishing the broad time-of-death window and its variables.",
    content:
      "The coroner's time-of-death section presenting a broad estimated range and the variables affecting it — body temperature, environment, blood loss, clothing, and measurement timing — supporting the uncertainty argument.",
    createdAt: "2026-06-09T11:00:00Z",
  },
  // Fuhrman research records.
  {
    ...recordDefaults,
    ...acceptedByUser,
    id: "docrec-fuhrman-glove",
    type: "DOCUMENT",
    supportStatus: "SUPPORTED",
    supportStatusExplanation:
      "Supported by Fuhrman research materials focused on glove-discovery questions.",
    documentId: "doc-fuhrman",
    fileName: "Mark Fuhrman Impeachment Research.pdf",
    pageRange: { start: 6, end: 8 },
    category: "Impeachment",
    title: "Fuhrman research — glove-discovery questions",
    summary:
      "Section listing the unanswered questions about who saw and documented the glove.",
    content:
      "The glove-evidence connection section: who first observed the item, whether it was photographed before being touched, whether scene-entry logs were complete, and whether anyone could have accessed the area before documentation.",
    createdAt: "2026-06-09T11:00:00Z",
  },
  {
    ...recordDefaults,
    id: "docrec-fuhrman-bias",
    type: "DOCUMENT",
    supportStatus: "PARTIALLY_SUPPORTED",
    supportStatusExplanation:
      "Partially supported by Fuhrman research categories, but proposed pending verification of specific bias and prior-statement materials.",
    status: "PROPOSED",
    documentId: "doc-fuhrman",
    fileName: "Mark Fuhrman Impeachment Research.pdf",
    pageRange: { start: 3, end: 5 },
    category: "Impeachment",
    title: "Fuhrman research — bias and prior-statement categories",
    summary:
      "Proposed extraction of the bias and prior-inconsistent-statement impeachment categories.",
    content:
      "The impeachment-categories section on potential racial bias, prior statements, and credibility under oath. Proposed; should not be characterized as established until personnel records and recordings are obtained.",
  },
  // Prior domestic records.
  {
    ...recordDefaults,
    ...acceptedByUser,
    id: "docrec-domestic-1989",
    type: "DOCUMENT",
    supportStatus: "SUPPORTED",
    supportStatusExplanation:
      "Supported by the prior domestic records section for the 1989 incident.",
    documentId: "doc-domestic",
    fileName: "Prior Domestic Incident Records.pdf",
    pageRange: { start: 4, end: 6 },
    category: "Prior incidents",
    title: "Domestic records — 1989 incident (DR-1989-1127)",
    summary:
      "Section documenting the most serious prior incident and its disposition.",
    content:
      "The Incident Record 01 section: the January 1, 1989 disturbance with documented injuries, statements, and initiated arrest procedures — the prior incident most likely to be offered for motive and most contested for admissibility.",
    createdAt: "2026-06-09T11:00:00Z",
  },
  {
    ...recordDefaults,
    id: "docrec-domestic-911",
    type: "DOCUMENT",
    supportStatus: "PARTIALLY_SUPPORTED",
    supportStatusExplanation:
      "Partially supported by domestic-record materials, but proposed pending review of the 911-call details and admissibility value.",
    status: "PROPOSED",
    documentId: "doc-domestic",
    fileName: "Prior Domestic Incident Records.pdf",
    pageRange: { start: 12, end: 14 },
    category: "Prior incidents",
    title: "Domestic records — 911 call review",
    summary:
      "Proposed extraction of the 911 review and the defense relevance concerns.",
    content:
      "The 911-call review section noting calls spanning years with varying circumstances, several resulting in no arrest, and incomplete context — supporting the defense argument that the records are more prejudicial than probative.",
  },
  // Motion, client statement, Bronco inventory, scene diagram, forensic notes.
  {
    ...recordDefaults,
    ...acceptedByUser,
    id: "docrec-motion-suppress",
    type: "DOCUMENT",
    supportStatus: "SUPPORTED",
    supportStatusExplanation:
      "Supported by the draft motion section framing the Rockingham entry argument.",
    documentId: "doc-motion",
    fileName: "Draft Motion to Suppress Evidence.docx",
    pageRange: { start: 1, end: 6 },
    category: "Search & seizure",
    title: "Motion to suppress — Rockingham entry argument",
    summary:
      "The draft motion's core argument on the warrantless Rockingham entry.",
    content:
      "The opening sections of the draft motion to suppress, arguing the Rockingham entry and resulting glove recovery exceeded any recognized warrant exception and that the resulting evidence should be suppressed or limited.",
    createdAt: "2026-06-10T10:00:00Z",
  },
  {
    ...recordDefaults,
    ...acceptedByUser,
    id: "docrec-client-statement",
    type: "DOCUMENT",
    supportStatus: "SUPPORTED",
    supportStatusExplanation:
      "Supported by the client statement section covering whereabouts and denial.",
    documentId: "doc-client",
    fileName: "O.J. Simpson Client Statement.txt",
    category: "Client statement",
    title: "Client statement — whereabouts and denial",
    summary:
      "What the client statement asserts about the evening and the charges.",
    content:
      "The client's statement on his whereabouts and travel plans on the evening of June 12, the relationship history, and his denial of involvement, used to align the defense narrative with the timeline evidence.",
    createdAt: "2026-06-10T10:00:00Z",
  },
  {
    ...recordDefaults,
    ...acceptedByUser,
    id: "docrec-bronco-inventory",
    type: "DOCUMENT",
    supportStatus: "SUPPORTED",
    supportStatusExplanation:
      "Supported by the Bronco inventory section documenting interior blood and collection notes.",
    documentId: "doc-bronco",
    fileName: "Ford Bronco Evidence Inventory.pdf",
    pageRange: { start: 2, end: 5 },
    category: "Blood evidence",
    title: "Bronco inventory — interior blood and collection notes",
    summary:
      "Section inventorying the Bronco interior blood traces and when they were collected.",
    content:
      "The inventory section covering the driver-area and console blood traces and the collection notes, establishing that the interior samples were taken in the evening of June 13 after the vehicle had been accessed.",
    createdAt: "2026-06-08T13:30:00Z",
  },
  {
    ...recordDefaults,
    ...acceptedByUser,
    id: "docrec-bundy-map",
    type: "DOCUMENT",
    supportStatus: "SUPPORTED",
    supportStatusExplanation:
      "Supported by the Bundy scene diagram record showing victim and evidence positions.",
    documentId: "doc-bundy-map",
    fileName: "875 Bundy Drive Scene Diagram.jpg",
    category: "Scene",
    title: "Bundy scene diagram — victim and evidence positions",
    summary:
      "What the courtyard diagram depicts: victim positions, blood, footprints, and pathways.",
    content:
      "The diagram of the Bundy courtyard showing the relative positions of the victims, blood evidence, footwear impressions, the gate area, and pathways, used to orient the jury and to test movement assumptions.",
    createdAt: "2026-06-08T13:30:00Z",
  },
  {
    ...recordDefaults,
    id: "docrec-forensic-notes-contam",
    type: "DOCUMENT",
    supportStatus: "PARTIALLY_SUPPORTED",
    supportStatusExplanation:
      "Partially supported by defense forensic notes, but proposed pending expert review and translation into admissible testimony.",
    status: "PROPOSED",
    documentId: "doc-forensic-notes",
    fileName: "Defense Forensic Expert Notes.txt",
    category: "Contamination",
    title: "Forensic notes — contamination and handling concerns",
    summary:
      "Proposed extraction of the consultant's contamination and collection concerns.",
    content:
      "The defense consultant's notes identifying contamination risk, sample-handling concerns, testing-interpretation issues, and collection-procedure questions. Proposed; the specific concerns should be matched to individual evidence items before trial use.",
  },

  // ── Case summary (level 0) ────────────────────────────────────────────────
  // The evolving master brief synthesized from the live graph. Sections link
  // back to the records that ground them so the Overview can render chips.
  {
    ...recordDefaults,
    ...acceptedByUser,
    id: "case-summary-oj",
    type: "CASE_SUMMARY",
    party: "neutral",
    title: "People v. Simpson — Case Brief",
    summary:
      "Synthesized brief: a double-murder prosecution the defense meets with a reasonable-doubt strategy built on forensic-handling and investigative-integrity challenges.",
    content:
      "Living summary of the People v. Simpson defense, regenerated as records are accepted.",
    createdAt: "2026-06-13T18:30:00Z",
    updatedAt: "2026-06-13T18:30:00Z",
    summaryData: {
      caseContextSnapshot: ojCaseContext,
      overview:
        "The State charges Simpson with two counts of first-degree murder, building its case on blood, glove, and timeline evidence and presenting the investigation as careful and conclusive. The defense does not commit to an alternative narrative; it manufactures reasonable doubt by attacking forensic reliability, evidence collection, chain of custody, and investigator credibility — consolidating a scattered set of evidentiary objections into one jury-facing credibility-and-handling story.\n\nThe accepted graph now centers on a merged chain-of-custody-integrity fact, the EDTA-vial blood-handling fact, and the glove evidence in its latest form, supporting a unified glove-demonstration argument and a contamination theory. The Fuhrman-bias framing is mid-transition (a proposed reframe from \"collateral\" to \"central\"), and several forensic records remain proposed pending expert review. The dominant risk is that the jury accepts the DNA and glove evidence as conclusive despite the collection and chain-of-custody challenges.",
      sections: [
        {
          id: "sum-oj-claims",
          type: "CLAIMS",
          title: "Charges & posture",
          content:
            "Two counts of first-degree murder. The defense challenges probable cause, the Rockingham search, forensic collection, chain of custody, DNA mixture interpretation, glove evidence, the timeline, and investigator bias. Posture: trial prep with active suppression and admissibility motions.",
          recordIds: ["claim-001", "claim-002", "posture-002"],
          updatedAt: "2026-06-13T18:30:00Z",
        },
        {
          id: "sum-oj-facts",
          type: "FACTS",
          title: "Load-bearing facts",
          content:
            "The merged chain-of-custody-integrity fact consolidates three documentation discrepancies. The EDTA-vial fact and the current glove-discovery fact anchor the handling and identity challenges.",
          recordIds: ["fact-coc-integrity", "fact-edta-vial", "fact-glove-v3"],
          updatedAt: "2026-06-13T18:30:00Z",
        },
        {
          id: "sum-oj-arguments",
          type: "ARGUMENTS",
          title: "Theory & arguments",
          content:
            "The merged glove-demonstration argument carries the identity challenge; the contamination theory frames the forensic attack. A proposed reframe would move the Fuhrman bias argument from collateral to central.",
          recordIds: ["arg-glove-demo", "theory-contamination", "arg-fuhrman-central"],
          updatedAt: "2026-06-13T18:30:00Z",
        },
        {
          id: "sum-oj-risks",
          type: "RISKS",
          title: "Biggest current risk",
          content:
            "The jury accepts the DNA and glove evidence as conclusive despite collection, contamination, and chain-of-custody challenges — and the prior-domestic-violence evidence prejudices the identity question.",
          recordIds: ["fact-dna-bundy", "issue-prior-domestic", "objective-doubt-forensic"],
          updatedAt: "2026-06-13T18:30:00Z",
        },
        {
          id: "sum-oj-next",
          type: "NEXT_STEPS",
          title: "Next steps",
          content:
            "Tighten the chain-of-custody timeline into exhibits, prepare the Fuhrman cross, and finalize the glove-demonstration sequence.",
          recordIds: ["task-001", "task-coc", "task-002"],
          updatedAt: "2026-06-13T18:30:00Z",
        },
        {
          id: "sum-oj-open",
          type: "OPEN_QUESTIONS",
          title: "Open questions",
          content:
            "How far to push the Fuhrman-bias theme without overreaching, and whether to stage the glove demonstration live before the jury.",
          recordIds: ["note-fuhrman-caution", "question-glove-demo"],
          updatedAt: "2026-06-13T18:30:00Z",
        },
      ],
      generatedFromRecordIds: [
        "claim-001",
        "claim-002",
        "fact-coc-integrity",
        "fact-edta-vial",
        "fact-glove-v3",
        "arg-glove-demo",
        "theory-contamination",
      ],
      generatedAt: "2026-06-13T18:30:00Z",
    },
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Graph links
// ─────────────────────────────────────────────────────────────────────────────

const recordTypeById = new Map<string, RecordType>(
  ojRecords.map((record) => [record.id, record.type]),
);

const recordStatusById = new Map<string, RecordStatus>(
  ojRecords.map((record) => [record.id, record.status]),
);

const isAuthoritativeStatus = (status?: RecordStatus) =>
  status === "ACCEPTED" || status === "PENDING_REPLACEMENT";

const linkStrengthForStatus = (status: LinkStatus): LinkStrength => {
  if (status === "ACCEPTED") return "STRONG";
  if (status === "REJECTED") return "WEAK";
  return "MODERATE";
};

// Explanation is REQUIRED on every edge (mirrors GraphLink.explanation): the
// agent must state why a connection exists. Because a tuple can't carry a
// required element after an optional one, `status` is required too.
type LinkSpec = [
  fromId: string,
  type: RecordLinkType,
  toId: string,
  status: LinkStatus,
  explanation: string,
  rejectionReason?: string,
];

const linkSpecs: LinkSpec[] = [
  // Objectives → theories / issues
  ["objective-001", "REQUIRES", "theory-contamination", "ACCEPTED", "The acquittal objective requires the evidence-contamination theory to hold."],
  ["objective-001", "REQUIRES", "theory-fuhrman", "ACCEPTED", "Objective also depends on the Fuhrman-bias theory casting doubt on the glove evidence."],
  ["objective-002", "REQUIRES", "issue-001", "ACCEPTED", "This objective requires winning suppression of the warrantless Rockingham search."],
  ["objective-002", "REQUIRES", "theory-coc", "ACCEPTED", "Objective rests on the chain-of-custody theory undermining the blood evidence."],
  ["objective-doubt-broad", "DEPENDS_ON", "theory-contamination", "ACCEPTED", "Broad reasonable-doubt objective draws on the contamination theory."],
  ["objective-doubt-broad", "DEPENDS_ON", "theory-fuhrman", "ACCEPTED", "Broad-doubt objective also leans on the Fuhrman-bias theory."],
  ["objective-doubt-forensic", "DEPENDS_ON", "theory-contamination", "PROPOSED", "Forensic-doubt objective is built on the contamination theory."],
  ["objective-doubt-forensic", "DEPENDS_ON", "issue-002", "PROPOSED", "Objective depends on the DNA-admissibility issue limiting the mixture evidence."],
  ["objective-doubt-investigation", "DEPENDS_ON", "theory-fuhrman", "PROPOSED", "Investigation-doubt objective rests on the Fuhrman-bias theory."],
  ["objective-doubt-investigation", "DEPENDS_ON", "theory-coc", "PROPOSED", "Objective also depends on the chain-of-custody theory."],
  ["objective-003", "REQUIRES", "task-coc", "PROPOSED", "Objective can't be met until the chain-of-custody audit task is complete."],

  // Claims
  ["claim-001", "INVOLVES", "person-oj", "ACCEPTED", "The prosecution's murder charge names O.J. Simpson as the defendant."],
  ["docrec-dna-bundy", "EVIDENCES", "claim-001", "ACCEPTED", "The Bundy DNA report is the prosecution's central evidence for the murder claim."],
  ["claim-002", "DEPENDS_ON", "theory-contamination", "ACCEPTED", "The reasonable-doubt defense rests on the contamination theory."],
  ["claim-002", "DEPENDS_ON", "theory-fuhrman", "ACCEPTED", "Defense also depends on the Fuhrman-bias theory."],
  ["claim-002", "DEPENDS_ON", "theory-coc", "ACCEPTED", "Defense depends on the chain-of-custody theory."],

  // Posture (completed replacement pair)
  [
    "posture-002",
    "DERIVED_FROM",
    "posture-003",
    "ACCEPTED",
    "Current trial posture was synthesized after broadening the suppression-only posture.",
  ],
  ["posture-002", "LEADS_TO", "task-001", "ACCEPTED", "The trial posture makes the chain-of-custody prep task the next step."],
  ["posture-002", "SUPPORTS", "objective-002", "ACCEPTED", "Current posture favors the suppression-and-doubt objective."],

  // Theories — split successors grounded in evidence
  ["theory-contamination", "DEPENDS_ON", "fact-bronco-late", "ACCEPTED", "Contamination theory rests on the Bronco blood being collected and logged late."],
  ["theory-contamination", "CITES", "precedent-kelly-frye", "PROPOSED", "Theory invokes Kelly-Frye limits on the contested forensic methods."],
  ["docrec-forensic-notes-contam", "EVIDENCES", "theory-contamination", "PROPOSED", "Defense consultant's contamination notes evidence the theory."],
  ["theory-fuhrman", "DEPENDS_ON", "fact-glove-v3", "ACCEPTED", "Fuhrman theory rests on the disputed circumstances of the Rockingham glove."],
  ["theory-fuhrman", "INVOLVES", "person-fuhrman", "ACCEPTED", "Theory centers on Detective Fuhrman's conduct and credibility."],
  ["docrec-fuhrman-glove", "EVIDENCES", "theory-fuhrman", "ACCEPTED", "Fuhrman's glove-discovery report evidences the planting theory."],
  ["theory-coc", "DEPENDS_ON", "fact-coc-integrity", "ACCEPTED", "Chain-of-custody theory rests on the documented custody-integrity gaps."],
  ["theory-coc", "DEPENDS_ON", "fact-edta-vial", "ACCEPTED", "Theory also depends on the EDTA-in-the-vial fact pointing to planted blood."],
  ["theory-alt-timeline", "DEPENDS_ON", "fact-park-timeline", "PROPOSED", "Alternative-timeline theory rests on limo driver Allan Park's arrival times."],
  ["theory-alt-timeline", "DEPENDS_ON", "fact-kato-thumps", "PROPOSED", "Theory also depends on the timing of Kato Kaelin's 'thumps'."],
  ["theory-alt-timeline", "EXPLAINS", "fact-tod-v4", "PROPOSED", "Theory explains how the medical examiner's time-of-death window fits an alternative sequence."],

  // Issues
  ["issue-001", "DEPENDS_ON", "fact-glove-v3", "ACCEPTED", "Suppression issue turns on how the Rockingham glove was discovered."],
  ["docrec-motion-suppress", "EVIDENCES", "issue-001", "ACCEPTED", "The filed suppression motion frames the Fourth Amendment issue."],
  ["issue-001", "CITES", "precedent-fourth-amendment", "PROPOSED", "Issue cites Fourth Amendment warrantless-search authority."],
  ["issue-002", "DEPENDS_ON", "fact-dna-bundy", "PROPOSED", "DNA-admissibility issue turns on the Bundy mixture results."],
  ["docrec-dna-mixture-limits", "EVIDENCES", "issue-002", "PROPOSED", "Mixture-limits report documents the reliability problems behind the issue."],
  ["issue-002", "CITES", "precedent-kelly-frye", "PROPOSED", "Issue cites Kelly-Frye on novel-method admissibility."],
  ["issue-003", "DEPENDS_ON", "fact-second-glove-fit", "PROPOSED", "Glove-demonstration issue turns on the courtroom fact that the glove did not fit."],
  ["issue-prior-domestic", "DEPENDS_ON", "timeline-prior-1989", "ACCEPTED", "Prior-domestic issue turns on the 1989 incident on the timeline."],
  ["issue-prior-domestic", "CITES", "precedent-1101b", "PROPOSED", "Issue cites §1101(b) on the admissibility of prior bad acts."],

  // Arguments
  ["arg-fuhrman-collateral", "DEPENDS_ON", "fact-glove-v3", "ACCEPTED", "Collateral Fuhrman argument rests on the disputed glove discovery."],
  ["arg-fuhrman-collateral", "INVOLVES", "person-fuhrman", "ACCEPTED", "Argument concerns Fuhrman's credibility."],
  ["arg-fuhrman-central", "DERIVED_FROM", "arg-fuhrman-collateral", "PROPOSED", "Central Fuhrman argument was promoted from the collateral version."],
  ["arg-fuhrman-central", "DEPENDS_ON", "fact-glove-v3", "PROPOSED", "Argument depends on the disputed glove-discovery fact."],
  ["arg-fuhrman-central", "INVOLVES", "person-fuhrman", "PROPOSED", "Argument puts Fuhrman's conduct at the center of the defense."],
  ["docrec-fuhrman-glove", "EVIDENCES", "arg-fuhrman-central", "PROPOSED", "Fuhrman's glove report evidences the central argument."],
  ["arg-glove-demo", "DEPENDS_ON", "fact-second-glove-fit", "PROPOSED", "Glove-demonstration argument rests on the glove not fitting."],
  ["arg-glove-demo", "SUPPORTS", "issue-003", "PROPOSED", "Argument advances our side of the glove-demonstration issue."],
  ["docrec-glove-fit-history", "EVIDENCES", "arg-glove-demo", "PROPOSED", "Glove-fit history record evidences the demonstration argument."],
  ["arg-edta", "DEPENDS_ON", "fact-edta-vial", "PROPOSED", "EDTA argument rests on the preservative found in the blood evidence."],
  ["arg-edta", "INVOLVES", "person-vannatter", "PROPOSED", "Argument implicates Detective Vannatter's handling of the reference vial."],
  ["docrec-coc-bs010-volume", "EVIDENCES", "arg-edta", "PROPOSED", "Blood-volume custody record evidences the missing-blood premise of the EDTA argument."],
  ["arg-mixture", "DEPENDS_ON", "fact-dna-bundy", "PROPOSED", "Mixture argument rests on the Bundy DNA results."],
  ["docrec-dna-mixture-limits", "EVIDENCES", "arg-mixture", "PROPOSED", "Mixture-limits report evidences the argument."],
  ["arg-timeline-compressed", "DEPENDS_ON", "fact-park-timeline", "PROPOSED", "Compressed-timeline argument rests on Allan Park's arrival times."],
  ["arg-timeline-compressed", "DEPENDS_ON", "fact-kato-thumps", "PROPOSED", "Argument also relies on the timing of Kato's thumps."],
  ["docrec-timeline-compression", "EVIDENCES", "arg-timeline-compressed", "PROPOSED", "Timeline-compression analysis evidences the argument."],
  ["arg-domestic-prejudice", "SUPPORTS", "issue-prior-domestic", "ACCEPTED", "Argument advances exclusion of the prejudicial 1989 incident."],
  ["docrec-domestic-1989", "EVIDENCES", "arg-domestic-prejudice", "ACCEPTED", "The 1989 incident report is the record at issue in the prejudice argument."],

  // Tasks
  ["task-001", "REQUIRES", "fact-coc-integrity", "ACCEPTED", "Chain-of-custody prep can't finish until the custody-integrity fact is settled."],
  ["task-001", "REQUIRES", "fact-edta-vial", "ACCEPTED", "Task depends on confirming the EDTA-vial fact."],
  ["task-002", "REQUIRES", "issue-003", "PROPOSED", "Memo can't proceed until the glove-demonstration issue (whether to take the risk) is decided."],
  ["task-002", "SUPPORTS", "arg-glove-demo", "PROPOSED", "Task supports preparing the glove-demonstration argument."],
  ["task-coc", "SUPPORTS", "theory-fuhrman", "ACCEPTED", "Custody-audit task reinforces the Fuhrman-bias theory."],
  ["task-coc", "INVOLVES", "person-fuhrman", "ACCEPTED", "Task examines evidence Fuhrman handled."],

  // Glove-discovery fact lineage grounding
  ["docrec-glove-rockingham", "EVIDENCES", "fact-glove-v3", "ACCEPTED", "Rockingham glove report grounds the current glove fact."],
  ["docrec-glove-discrepancy", "EVIDENCES", "fact-glove-v3", "ACCEPTED", "Glove-discrepancy record corroborates the disputed-discovery fact."],
  ["fact-glove-v3", "INVOLVES", "person-fuhrman", "ACCEPTED", "Glove fact centers on the detective who reported finding it."],
  ["timeline-rockingham-glove", "SUPPORTS", "fact-glove-v3", "ACCEPTED", "The Rockingham discovery event substantiates the glove fact."],

  // Time-of-death fact lineage grounding
  ["docrec-me-tod", "EVIDENCES", "fact-tod-v4", "ACCEPTED", "Medical examiner report grounds the current time-of-death fact."],
  ["docrec-timeline-tod", "EVIDENCES", "fact-tod-v4", "ACCEPTED", "Timeline reconstruction corroborates the time-of-death window."],

  // Blood-handling split grounding
  ["docrec-coc-bs010-volume", "EVIDENCES", "fact-edta-vial", "ACCEPTED", "Blood-volume custody record grounds the EDTA-vial fact."],
  ["fact-edta-vial", "INVOLVES", "person-vannatter", "ACCEPTED", "EDTA fact concerns the reference vial Vannatter carried."],
  ["docrec-bronco-inventory", "EVIDENCES", "fact-bronco-late", "ACCEPTED", "Bronco inventory log shows the late collection of the blood."],
  ["docrec-dna-bronco", "EVIDENCES", "fact-bronco-late", "PROPOSED", "Bronco DNA report corroborates the late-collection fact."],

  // Documentation-discrepancy merge grounding (live successor)
  ["docrec-coc-bs003", "EVIDENCES", "fact-coc-integrity", "ACCEPTED", "BS-003 custody record is one source for the custody-integrity fact."],
  ["docrec-coc-bs007", "EVIDENCES", "fact-coc-integrity", "ACCEPTED", "BS-007 custody record corroborates the custody-integrity fact."],
  ["docrec-coc-bs010-volume", "EVIDENCES", "fact-coc-integrity", "ACCEPTED", "Blood-volume custody record contributes to the custody-integrity fact."],
  ["docrec-coc-access-log", "EVIDENCES", "fact-coc-integrity", "PROPOSED", "Evidence-room access log adds to the custody-integrity fact."],

  // Bronco-blood pending reframe
  ["docrec-dna-bronco", "EVIDENCES", "fact-bronco-his", "PROPOSED", "Bronco DNA report establishes the blood is consistent with O.J.'s."],
  ["fact-bronco-his", "INVOLVES", "person-oj", "ACCEPTED", "Fact concerns blood attributed to the defendant."],
  ["fact-bronco-innocent", "DERIVED_FROM", "fact-bronco-his", "PROPOSED", "Innocent-explanation fact is a proposed reframing of the Bronco-blood fact."],
  ["docrec-dna-bronco", "EVIDENCES", "fact-bronco-innocent", "PROPOSED", "The same Bronco DNA report is read to support an innocent explanation."],

  // Other facts
  ["docrec-dna-bundy", "EVIDENCES", "fact-dna-bundy", "PROPOSED", "Bundy DNA report grounds the Bundy-blood fact."],
  ["fact-bronco-late", "CONTEXTUALIZES", "fact-dna-bundy", "PROPOSED", "The late Bronco collection casts doubt on the parallel Bundy DNA handling."],
  ["docrec-park-arrival", "EVIDENCES", "fact-park-timeline", "ACCEPTED", "Limo records ground Allan Park's arrival-time fact."],
  ["fact-park-timeline", "INVOLVES", "person-park", "ACCEPTED", "Timeline fact is based on driver Allan Park's account."],
  ["docrec-kato-thumps", "EVIDENCES", "fact-kato-thumps", "ACCEPTED", "Kato's statement grounds the 'thumps' timing fact."],
  ["fact-kato-thumps", "INVOLVES", "person-kato", "ACCEPTED", "Fact is based on Kato Kaelin's account."],
  ["docrec-glove-bundy", "EVIDENCES", "fact-second-glove-fit", "PROPOSED", "Bundy glove record grounds the glove-fit fact."],
  ["docrec-glove-rockingham", "EVIDENCES", "fact-second-glove-fit", "PROPOSED", "Rockingham glove record also bears on the glove-fit fact."],

  // Timeline events
  ["docrec-park-arrival", "EVIDENCES", "timeline-park", "ACCEPTED", "Limo records fix Allan Park's arrival event."],
  ["docrec-kato-thumps", "EVIDENCES", "timeline-kato", "PROPOSED", "Kato's statement dates the 'thumps' event."],
  ["docrec-me-tod", "EVIDENCES", "timeline-tod", "PROPOSED", "Medical examiner report fixes the estimated time-of-death event."],
  ["docrec-glove-rockingham", "EVIDENCES", "timeline-rockingham-glove", "ACCEPTED", "Glove report dates the Rockingham discovery event."],
  ["docrec-domestic-1989", "EVIDENCES", "timeline-prior-1989", "ACCEPTED", "Incident report fixes the 1989 domestic event."],
  ["timeline-park", "CONTEXTUALIZES", "fact-park-timeline", "ACCEPTED", "The arrival event frames the driver-timeline fact."],
  ["timeline-departure", "RELATED_TO", "timeline-park", "ACCEPTED", "Departure and arrival events bracket the same window."],

  // Testimony
  ["testimony-park", "INVOLVES", "person-park", "ACCEPTED", "Testimony is Allan Park's."],
  ["testimony-park", "DEPENDS_ON", "fact-park-timeline", "ACCEPTED", "Park's testimony carries his arrival-time account."],
  ["testimony-kato", "INVOLVES", "person-kato", "ACCEPTED", "Testimony is Kato Kaelin's."],
  ["testimony-kato", "DEPENDS_ON", "fact-kato-thumps", "ACCEPTED", "Kato's testimony carries the 'thumps' timing."],
  ["testimony-fuhrman-cross", "INVOLVES", "person-fuhrman", "PROPOSED", "Planned cross-examination targets Fuhrman."],
  ["testimony-fuhrman-cross", "DEPENDS_ON", "fact-glove-v3", "PROPOSED", "Cross would probe Fuhrman on the disputed glove discovery."],
  ["docrec-fuhrman-bias", "EVIDENCES", "testimony-fuhrman-cross", "PROPOSED", "Fuhrman bias materials feed the planned cross-examination."],
  ["testimony-wu-cross", "INVOLVES", "person-wu", "PROPOSED", "Planned cross-examination targets the DNA analyst."],
  ["testimony-wu-cross", "DEPENDS_ON", "fact-dna-bundy", "PROPOSED", "Cross would probe the Bundy DNA-mixture results."],
  ["docrec-dna-mixture-limits", "EVIDENCES", "testimony-wu-cross", "PROPOSED", "Mixture-limits report supplies the basis for the DNA cross."],

  // Precedent
  ["precedent-kelly-frye", "SUPPORTS", "issue-002", "PROPOSED", "Kelly-Frye authority supports limiting the novel DNA-mixture evidence."],
  ["precedent-fourth-amendment", "SUPPORTS", "issue-001", "PROPOSED", "Fourth Amendment authority supports suppression of the warrantless search."],
  ["precedent-1101b", "SUPPORTS", "issue-prior-domestic", "PROPOSED", "§1101(b) authority supports excluding the 1989 prior-acts evidence."],

  // Notes
  ["note-cross-theme", "EXPLAINS", "theory-contamination", "ACCEPTED", "Cross-exam theme note explains how to present the contamination theory."],
  ["note-cross-theme", "SUPPORTS", "arg-mixture", "ACCEPTED", "Note reinforces the DNA-mixture argument with a cross plan."],
  [
    "note-fuhrman-caution",
    "ATTACKS",
    "fact-glove-v2",
    "ACCEPTED",
    "Human correction undercuts the overreaching warrantless-entry characterization that v2 asserted.",
  ],
  ["note-fuhrman-caution", "EXPLAINS", "fact-glove-v3", "ACCEPTED", "Caution note explains the documented-and-disputed framing of the current glove fact."],

  // Questions (level 2) — each open question wired to the records that answer it
  ["question-glove-demo", "RELATED_TO", "issue-003", "PROPOSED", "Whether the demonstration's payoff beats its risk is the strategic core of the glove-demonstration issue."],
  ["question-glove-demo", "DEPENDS_ON", "arg-glove-demo", "PROPOSED", "Answering the question means weighing the glove-demonstration argument's upside against its failure modes."],
  ["task-002", "REQUIRES", "question-glove-demo", "PROPOSED", "The glove-demonstration risk memo can't be finalized until this question is decided."],
  ["question-edta-trace", "DEPENDS_ON", "fact-edta-vial", "ACCEPTED", "The question builds directly on the unaccounted reference-volume fact."],
  ["question-edta-trace", "RELATED_TO", "arg-edta", "PROPOSED", "Localizing the missing volume would sharpen the still-proposed EDTA/handling argument."],
  ["question-edta-trace", "RELATED_TO", "theory-contamination", "ACCEPTED", "A located custody gap would feed the contamination theory."],
  ["question-tod-window", "DEPENDS_ON", "fact-tod-v4", "ACCEPTED", "The answer rests on the accepted medical-examiner time-of-death window."],
  ["question-tod-window", "RELATED_TO", "theory-alt-timeline", "PROPOSED", "Fixing the defensible window supports the still-proposed alternative-timeline theory."],
  ["question-fuhrman-scope", "RELATED_TO", "arg-fuhrman-collateral", "ACCEPTED", "The answer adopts the collateral-impeachment framing of Fuhrman."],
  ["question-fuhrman-scope", "RELATED_TO", "theory-fuhrman", "ACCEPTED", "The decision governs how far the Fuhrman-bias theory is foregrounded."],
  ["question-fuhrman-scope", "REQUIRES", "task-coc", "ACCEPTED", "Going central is deferred until the subpoenaed Fuhrman records are reviewed."],
  ["question-jury-narrative", "RELATED_TO", "theory-contamination", "ACCEPTED", "Whether contamination alone sustains reasonable doubt governs how much the theory must carry."],
  ["question-jury-narrative", "RELATED_TO", "note-cross-theme", "ACCEPTED", "The cross-exam theme note frames the contamination-over-suspect narrative the question tests."],

  // People cross-references
  ["claim-001", "INVOLVES", "person-clark", "ACCEPTED", "Murder charge is prosecuted by Marcia Clark."],
  ["claim-002", "INVOLVES", "person-cochran", "ACCEPTED", "Reasonable-doubt defense is led by Johnnie Cochran."],

  // ── Historical links retained on replaced records ───────────────────────
  // Specified as ACCEPTED (real when authored); the builder normalizes them to
  // PROPOSED because an endpoint is now retired, so they surface only inside the
  // replaced record's inspector.
  ["docrec-glove-rockingham", "EVIDENCES", "fact-glove-v1", "ACCEPTED", "Rockingham report originally grounded the first glove-fact version."],
  ["docrec-glove-rockingham", "EVIDENCES", "fact-glove-v2", "ACCEPTED", "Same report grounded the superseded warrantless-entry glove version."],
  ["fact-glove-v2", "INVOLVES", "person-fuhrman", "ACCEPTED", "The superseded glove fact also centered on Fuhrman."],
  [
    "fact-glove-v3",
    "DERIVED_FROM",
    "fact-glove-v2",
    "ACCEPTED",
    "Accepted glove fact replaces the overreaching warrantless-entry version with a documented-and-disputed framing.",
  ],
  ["docrec-me-tod", "EVIDENCES", "fact-tod-v1", "ACCEPTED", "Medical examiner report originally grounded the first time-of-death version."],
  ["docrec-me-tod", "EVIDENCES", "fact-tod-v3", "ACCEPTED", "Same report grounded a later, since-replaced time-of-death version."],
  ["docrec-coc-bs010-volume", "EVIDENCES", "fact-blood-broad", "ACCEPTED", "Blood-volume record originally grounded the retired broad blood fact."],
  ["docrec-coc-bs003", "EVIDENCES", "fact-disc-photo", "ACCEPTED", "BS-003 record originally grounded the retired photo-discrepancy fact."],
  ["docrec-coc-bs007", "EVIDENCES", "fact-disc-bs007", "ACCEPTED", "BS-007 record originally grounded the retired BS-007 discrepancy fact."],
  ["docrec-coc-firstpass", "EVIDENCES", "fact-coc-integrity", "ACCEPTED", "First-pass custody review was an earlier source for the custody-integrity fact."],
  [
    "theory-contamination",
    "DERIVED_FROM",
    "theory-investigation-broad",
    "ACCEPTED",
    "Contamination theory was narrowed from the earlier broad-investigation theory.",
  ],

  // Rejection as a graph signal. The rejected alternative-suspect fact stays
  // linked so it surfaces (red) on the objective it conflicts with — the agent
  // reads why it was abandoned without re-proposing it. And one rejected EDGE
  // between two live records: the link, not the records, was the bad idea.
  [
    "fact-alt-suspect-rejected",
    "CONTRADICTS",
    "objective-001",
    "ACCEPTED",
    "The alternative-suspect fact, if pursued, would cut against the reasonable-doubt objective.",
  ],
  [
    "fact-edta-vial",
    "SUPPORTS",
    "objective-001",
    "REJECTED",
    "Proposed that the EDTA-vial fact directly supports the acquittal objective.",
    "Too attenuated as a direct edge: the EDTA point supports the contamination theory, which in turn serves the objective. Linking it straight to the objective overstates its reach — keep the support routed through the theory.",
  ],
];

const ojLinks: GraphLink[] = linkSpecs.map(
  ([fromId, type, toId, status, explanation, rejectionReason], index) => {
    const fromRecordType = recordTypeById.get(fromId);
    const toRecordType = recordTypeById.get(toId);

    if (!fromRecordType || !toRecordType) {
      throw new Error(`OJ demo link references unknown record: ${fromId} → ${toId}`);
    }

    const endpointsAuthoritative =
      isAuthoritativeStatus(recordStatusById.get(fromId)) &&
      isAuthoritativeStatus(recordStatusById.get(toId));
    const normalizedStatus: LinkStatus =
      status === "ACCEPTED" && !endpointsAuthoritative ? "PROPOSED" : status;

    return {
      id: `oj-link-${String(index + 1).padStart(3, "0")}`,
      workspaceId: OJ_WORKSPACE_ID,
      caseId: OJ_CASE_ID,
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
        ? { approvedByUserId: demoUserId, approvedAt: "2026-06-12T16:00:00Z" }
        : {}),
      createdAt: "2026-06-10T12:00:00Z",
      updatedAt: "2026-06-13T12:00:00Z",
    };
  },
);

// ─────────────────────────────────────────────────────────────────────────────
// Activity feed + agent thread (UI-only demo data)
// ─────────────────────────────────────────────────────────────────────────────

const ojActivity: DemoActivity[] = [
  {
    id: "oj-act-001",
    actor: "Case Agent",
    action:
      "Proposed reframing the Fuhrman impeachment from collateral to a material-witness argument tied to the glove.",
    time: "12 minutes ago",
    tone: "info",
  },
  {
    id: "oj-act-002",
    actor: "Johnnie Cochran",
    action:
      "Accepted the merged chain-of-custody-integrity fact built from the three documentation discrepancies.",
    time: "55 minutes ago",
    tone: "success",
  },
  {
    id: "oj-act-003",
    actor: "Case Agent",
    action:
      "Flagged a date conflict: the time-of-death window narrows the medical examiner's broader estimate.",
    time: "2 hours ago",
    tone: "warning",
  },
  {
    id: "oj-act-004",
    actor: "Case Agent",
    action:
      "Split the broad 'bad investigation' theory into contamination, Fuhrman-bias, and chain-of-custody theories.",
    time: "3 hours ago",
    tone: "info",
  },
  {
    id: "oj-act-005",
    actor: "Johnnie Cochran",
    action:
      "Rejected the alternative-suspect fact as overreaching and off-strategy for a reasonable-doubt defense.",
    time: "4 hours ago",
    tone: "success",
  },
  {
    id: "oj-act-006",
    actor: "Case Agent",
    action:
      "Proposed a split of the unified reasonable-doubt objective into forensic and investigative tracks.",
    time: "5 hours ago",
    tone: "warning",
  },
  {
    id: "oj-act-007",
    actor: "Case Agent",
    action:
      "Re-extracted the chain-of-custody log after the first-pass OCR garbled the transfer tables.",
    time: "6 hours ago",
    tone: "info",
  },
];

const ojAgentThread: DemoAgentMessage[] = [
  {
    id: "oj-msg-001",
    role: "user",
    content:
      "What's our strongest path to reasonable doubt on the blood evidence?",
    time: "Yesterday, 3:40 PM",
  },
  {
    id: "oj-msg-002",
    role: "agent",
    content:
      "Three threads converge. The reference draw is missing about 1.5 mL between collection and the lab, and a detective carried the vial. The Bronco interior samples were collected hours later after access. And the documentation discrepancies — photo numbering, an uninitialed time change, the volume gap — together show a custody record that can't be reconstructed to the minute. I'd lead with handling and custody, not the chemistry, and keep the contamination theory as the frame.",
    citedRecordIds: [
      "fact-edta-vial",
      "fact-bronco-late",
      "fact-coc-integrity",
      "theory-contamination",
    ],
    time: "Yesterday, 3:41 PM",
  },
  {
    id: "oj-msg-003",
    role: "user",
    content: "Is Fuhrman worth making central, or does that overreach?",
    time: "Yesterday, 3:47 PM",
  },
  {
    id: "oj-msg-004",
    role: "agent",
    content:
      "I proposed elevating him to a material witness because the second glove's weight depends on who reported finding it and whether the discovery was documented — and the report itself leaves the entry and chronology disputed. It's a proposal, not accepted: it needs the personnel and internal-affairs records the open subpoena task is chasing. Until those land, keep the planting theory as an inference, per the pinned correction note.",
    citedRecordIds: [
      "arg-fuhrman-central",
      "fact-glove-v3",
      "task-coc",
      "note-fuhrman-caution",
    ],
    time: "Yesterday, 3:48 PM",
  },
];

const ojAgentInstructions = [
  "Draft case records as proposals first; never silently promote agent output to accepted.",
  "Attack collection, contamination, custody, and credibility — not DNA science in the abstract.",
  "Keep the planting and bias theories as inferences supported by conditions, not as asserted facts.",
  "Flag every timeline narrowing, volume discrepancy, and uninitialed correction before trial use.",
];

// ─────────────────────────────────────────────────────────────────────────────
// Bundle export
// ─────────────────────────────────────────────────────────────────────────────

export const ojCaseDemo: CaseDemo = {
  workspaceId: OJ_WORKSPACE_ID,
  caseId: OJ_CASE_ID,
  userId: demoUserId,
  meta: ojCase,
  caseContext: ojCaseContext,
  documents: ojDocuments,
  records: ojRecords,
  links: ojLinks,
  activity: ojActivity,
  agentThread: ojAgentThread,
  agentInstructions: ojAgentInstructions,
};
