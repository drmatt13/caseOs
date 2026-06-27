import type { CaseIntake } from "#/types/caseWorkspace";

const caseIntake: CaseIntake = {
  id: "case-intake-faxon-commons-001",

  intakePerspective: "self",
  caseName: "Faxon Commons v. Sweeney",
  intakeProvidedBy: "Matthew Sweeney, Defendant (Pro Se)",
  representationPracticeArea: "landlord_tenant",
  representationRole: "pro_se",
  clientRole: "defendant",
  representedPartyName: "Matthew Sweeney and household",
  jurisdictionOrCourt: "Massachusetts Housing Court, Metro South Division",

  whatIsTheDisputeAbout:
    "This is a residential landlord-tenant dispute arising from a summary process eviction at Faxon Commons in Quincy, Massachusetts. Although Plaintiffs frame the matter as a simple nonpayment case, Defendants contend the case also involves long-standing habitability issues, unauthorized entry into the apartment, interference with quiet enjoyment, unfair and deceptive conduct, and damages that were increased by Plaintiffs' delay in filing and handling the eviction process.",

  claimsAndDefenses:
    "Plaintiffs seek possession of the unit and money allegedly owed for rent or use and occupancy. Defendants dispute the claim as framed and assert defenses and counterclaims including breach of the implied warranty of habitability, interference with quiet enjoyment, unauthorized entry, failure to mitigate damages, and violations of G.L. c. 93A. Defendants also contend that Plaintiffs delayed filing despite knowing of financial hardship and despite knowing that eviction timing and classification would affect available mitigation and housing-assistance pathways.",
  claims: [
    {
      id: "claim_faxon_possession",
      label: "Possession and unpaid rent / use and occupancy",
      side: "opposing",
      kind: "affirmative",
      description:
        "Plaintiffs' nonpayment summary process claim for possession and money damages.",
    },
    {
      id: "claim_faxon_habitability",
      label: "Breach of the implied warranty of habitability",
      side: "ours",
      kind: "counterclaim",
      description:
        "Long-standing pest infestation and maintenance failures despite repeated notice.",
    },
    {
      id: "claim_faxon_quiet_enjoyment",
      label: "Interference with quiet enjoyment (G.L. c. 186 §14)",
      side: "ours",
      kind: "counterclaim",
      description: "Includes the July 24, 2025 unauthorized entry incident.",
    },
    {
      id: "claim_faxon_unauthorized_entry",
      label: "Unauthorized entry",
      side: "ours",
      kind: "counterclaim",
    },
    {
      id: "claim_faxon_93a",
      label: "Unfair and deceptive conduct (G.L. c. 93A)",
      side: "ours",
      kind: "counterclaim",
      description:
        "Delay in filing and classification of the eviction despite knowledge of hardship and mitigation consequences.",
    },
    {
      id: "claim_faxon_mitigation",
      label: "Failure to mitigate damages",
      side: "ours",
      kind: "defense",
      description:
        "Plaintiffs' own delay increased the damages they now seek.",
    },
  ],

  caseNumber: "25H82SP02904",
  currentCaseStatus: "motion_stage",

  objective:
    "Defeat or reduce Plaintiffs' claims for possession and money damages, prove the broader factual context beyond simple nonpayment, establish Defendants' defenses and counterclaims, and show that Plaintiffs' own conduct increased the damages they now seek. A related objective is to organize the matter into a durable workspace that preserves facts, issues, arguments, timelines, and record gaps for litigation support.",
  desiredOutcome:
    "A defense verdict or materially reduced recovery for Plaintiffs, recognition of Defendants' affirmative claims and defenses, and a factual finding that the case cannot fairly be reduced to unpaid rent alone, including acknowledgment that Plaintiffs failed to act reasonably once hardship and mitigation consequences were known.",
  opposingObjective:
    "Plaintiffs' likely objective is to keep the case narrow by presenting it as straightforward nonpayment, obtain possession and a money judgment, minimize exposure to counterclaims, and avoid producing records that would expand the case into habitability, entry, quiet enjoyment, mitigation, or c. 93A litigation.",
  theoryOfTheCase:
    "This was never a simple nonpayment case. The landlord knew of hardship and of long-standing habitability and entry problems, then delayed and misclassified the filing in ways that increased the damages it now seeks — and the records that would prove it are exactly the ones that remain missing.",
  keyDisputedIssues:
    "Whether entry on July 24, 2025 was authorized; whether habitability notice was given and ignored; whether Plaintiffs failed to mitigate by delaying the filing; whether the missing records support an adverse inference; whether the conduct rises to a c. 93A violation.",
  biggestRisk:
    "The biggest current risk is that Plaintiffs successfully simplify the case into a ledger-and-notice story while key records remain missing, forcing Defendants to rely heavily on testimony and adverse-inference arguments instead of complete documentary proof. Another major risk is that a factfinder gives too much weight to formal property-management records even where those records are incomplete, selective, or backfilled.",

  people: [
    {
      id: "person_faxon_sweeney",
      name: "Matthew Sweeney",
      roles: ["DEFENDANT", "CLIENT", "TENANT"],
      side: "ours",
      isKeyPlayer: true,
      notes:
        "Defendant, appearing pro se. Primary fact witness for conditions, complaints, hardship communications, and the entry incident.",
      anticipatedTestimony:
        "Move-in conditions, repeated in-person complaints, inconsistent extermination and maintenance responses, financial hardship communications, reliance on representations about filing and assistance pathways, the July 24, 2025 entry incident, and discovery deficiencies.",
    },
    {
      id: "person_faxon_household",
      name: "Defendant household members",
      roles: ["TENANT", "FACT_WITNESS"],
      side: "ours",
      notes: "Residents of the unit.",
      anticipatedTestimony:
        "Day-to-day conditions in the apartment, cleaning and mitigation efforts, the practical effect of infestation and entry on the household, and communications with management.",
    },
    {
      id: "person_faxon_landlord",
      name: "Faxon Commons (property management / landlord)",
      roles: ["LANDLORD", "CORPORATE_REPRESENTATIVE"],
      side: "opposing",
      organization: "Faxon Commons",
      notes: "Plaintiff entity and landlord-side management.",
    },
    {
      id: "person_faxon_counsel",
      name: "Plaintiffs' counsel (SLG Legal Group)",
      roles: ["ATTORNEY"],
      side: "opposing",
      organization: "SLG Legal Group",
      isKeyPlayer: true,
    },
    {
      id: "person_faxon_management_witness",
      name: "Management / maintenance personnel",
      roles: ["PROPERTY_MANAGER", "FACT_WITNESS"],
      side: "opposing",
      organization: "Faxon Commons",
      notes:
        "Personnel with firsthand knowledge of entry, extermination, or eviction timing.",
      anticipatedTestimony:
        "Rent, notices, portal records, maintenance, and case handling.",
    },
    {
      id: "person_faxon_judge",
      name: "Trial judge",
      roles: ["JUDGE"],
      side: "neutral",
      isKeyPlayer: true,
      organization: "Massachusetts Housing Court, Metro South Division",
    },
  ],
  peopleNarrative:
    "The most important people right now are the trial judge, Plaintiffs' counsel, any management or maintenance personnel with firsthand knowledge of entry, extermination, or eviction timing, and the Defendants as primary fact witnesses who can explain what occurred outside the limited records produced.",

  narrativeOfEvents:
    "Defendants moved into the unit in 2021 and immediately experienced serious pest-related conditions. Over time, Defendants repeatedly reported infestation and maintenance issues, often in person. In 2025, Defendants informed Plaintiffs of financial hardship before missed payment and discussed RAFT and shelter-related options. Plaintiffs served notices to quit but delayed filing summary process. The parties later discussed an agreement to vacate tied to a no-fault filing deadline, but Plaintiffs did not timely follow through and ultimately filed as nonpayment. After the case was filed, Defendants served discovery, Plaintiffs responded only after motion pressure, and major discovery disputes developed over missing communications, entry records, extermination records, and decision-making documents.",
  keyEvents: [
    {
      id: "event_faxon_movein",
      label: "Defendants moved into the unit; immediate pest conditions",
      date: "2021",
      datePrecision: "year",
      kind: "incident",
    },
    {
      id: "event_faxon_ntq",
      label: "Notice to Quit served",
      date: "2025-06-17",
      datePrecision: "day",
      kind: "filing",
    },
    {
      id: "event_faxon_entry",
      label: "Unauthorized entry incident",
      date: "2025-07-24",
      datePrecision: "day",
      kind: "incident",
    },
    {
      id: "event_faxon_certified_request",
      label:
        "Certified request asking Plaintiffs to file promptly to preserve mitigation options",
      date: "2025-08-05",
      datePrecision: "day",
      kind: "communication",
    },
    {
      id: "event_faxon_agreement_discussions",
      label: "Agreement-to-vacate discussions tied to a no-fault filing deadline",
      date: "2025-09",
      datePrecision: "month",
      kind: "communication",
    },
    {
      id: "event_faxon_filing",
      label: "Summary process filed as nonpayment",
      date: "2025-10-14",
      datePrecision: "day",
      kind: "filing",
    },
    {
      id: "event_faxon_answer",
      label: "Answer and Counterclaims with discovery requests",
      date: "2025-11-25",
      datePrecision: "day",
      kind: "filing",
    },
    {
      id: "event_faxon_motion_compel",
      label: "Motion to compel",
      date: "2026-01-05",
      datePrecision: "day",
      kind: "filing",
    },
    {
      id: "event_faxon_pretrial",
      label: "Pretrial conference and meet-and-confer order",
      date: "2026-01-22",
      datePrecision: "day",
      kind: "ruling",
    },
    {
      id: "event_faxon_renewed_compel",
      label: "Renewed motion to compel",
      date: "2026-03-26",
      datePrecision: "day",
      kind: "filing",
    },
    {
      id: "event_faxon_supplemental_responses",
      label: "Plaintiffs' supplemental discovery responses",
      date: "2026-04-03",
      datePrecision: "day",
      kind: "document_production",
    },
  ],
  urgentDeadlines:
    "The most urgent issues are trial preparation, organizing the case around the strongest integrated theories, and addressing ongoing discovery prejudice caused by missing records. Missing entry logs, access records, internal communications, extermination records, and eviction decision-making materials remain especially important because they affect Defendants' ability to prove unauthorized entry, habitability notice, quiet enjoyment, c. 93A, and failure to mitigate.",

  knownAuthorities:
    "G.L. c. 93A (unfair and deceptive practices); G.L. c. 186 §14 (quiet enjoyment); the implied warranty of habitability (Boston Housing Authority v. Hemingway); summary process rules governing discovery and adverse inferences for missing records.",
  focusFirst:
    "Reconstruct the entry and extermination timeline, then flag every counterclaim element that currently depends on records Plaintiffs have not produced so the adverse-inference argument can be built.",
  additionalContext:
    "A central strategic aim is to resist reduction of the case to a ledger-and-notice story; the integrated theory (delay, entry, habitability, mitigation, and c. 93A together) is more persuasive than any single counterclaim in isolation.",

  documents: {},
};

export default caseIntake;
