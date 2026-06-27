import type { CaseIntake } from "#/types/caseWorkspace";

const caseIntake: CaseIntake = {
  id: "case_oj_simpson_defense_1994",

  intakePerspective: "attorney",
  caseName: "People of the State of California v. Orenthal James Simpson",
  intakeProvidedBy: "Defense trial team intake coordinator",
  representationPracticeArea: "criminal",
  representationRole: "defense_counsel",
  clientRole: "defendant",
  representedPartyName: "Orenthal James Simpson",
  jurisdictionOrCourt: "Superior Court of California, County of Los Angeles",

  whatIsTheDisputeAbout:
    "The State alleges that Orenthal James Simpson committed the murders of Nicole Brown Simpson and Ronald Goldman. The defense disputes the allegations and intends to challenge the reliability of the physical evidence, the police investigation, witness timelines, and the prosecution's theory of identity and motive.",

  claimsAndDefenses:
    "The prosecution brings two counts of murder arising from the deaths of Nicole Brown Simpson and Ronald Goldman, alleging premeditated unlawful killing. The defense does not assert affirmative claims but advances defenses going to identity and reasonable doubt: challenges to probable cause, forensic collection methods, chain of custody, timeline reconstruction, glove evidence, blood and DNA interpretation, and investigative bias.",
  claims: [
    {
      id: "claim_oj_count1",
      label: "Count 1 — Murder of Nicole Brown Simpson (Penal Code § 187)",
      side: "opposing",
      kind: "affirmative",
      description:
        "Premeditated murder. Prosecution must prove identity and intent beyond a reasonable doubt.",
    },
    {
      id: "claim_oj_count2",
      label: "Count 2 — Murder of Ronald Goldman (Penal Code § 187)",
      side: "opposing",
      kind: "affirmative",
      description: "Premeditated murder arising from the same incident.",
    },
    {
      id: "claim_oj_reasonable_doubt",
      label: "Reasonable doubt as to identity",
      side: "ours",
      kind: "defense",
      description:
        "Defense theory that the physical evidence is unreliable and the investigation was compromised, leaving identity unproven.",
    },
  ],

  caseNumber: "BA097211",
  currentCaseStatus: "trial_preparation",

  objective:
    "Defend O.J. Simpson against the murder charges by creating reasonable doubt as to identity, forensic reliability, investigative integrity, and the prosecution's timeline.",
  desiredOutcome:
    "Acquittal on all criminal charges, or alternatively exclusion or weakening of key prosecution evidence sufficient to prevent conviction.",
  opposingObjective:
    "The prosecution will likely seek to prove that Simpson had motive, opportunity, and a physical connection to the crime scene through blood evidence, glove evidence, timeline evidence, prior relationship history, and forensic analysis.",
  theoryOfTheCase:
    "This is not a case of overwhelming proof but of a rushed, contaminated investigation. The evidence connecting Simpson to the scene was mishandled, the collection and chain of custody were unreliable, and at least one key investigator carries demonstrable bias — so the prosecution cannot meet its burden on identity.",
  keyDisputedIssues:
    "Whether the blood and DNA evidence was collected and preserved reliably; whether the chain of custody is intact; whether the glove evidence is credible; whether the prosecution's timeline is physically possible; whether investigator bias tainted the case.",
  openQuestions:
    "Should the defense lead with contamination or with investigator bias as the primary frame? Is the glove demonstration worth the risk of an in-court reenactment? Do we move to suppress, or save the chain-of-custody gaps for cross at trial?",
  biggestRisk:
    "The biggest risk is the jury accepting the prosecution's forensic evidence as reliable and directly tying Simpson to the crime scene despite defense challenges to collection, contamination, chain of custody, and investigative bias.",

  people: [
    {
      id: "person_oj_simpson",
      name: "Orenthal James Simpson",
      roles: ["DEFENDANT", "CLIENT"],
      side: "ours",
      isKeyPlayer: true,
      notes: "Defendant. Charged with both counts.",
    },
    {
      id: "person_nicole_brown",
      name: "Nicole Brown Simpson",
      roles: ["THIRD_PARTY"],
      side: "neutral",
      notes: "Decedent / victim. Prior relationship history with the defendant.",
    },
    {
      id: "person_ron_goldman",
      name: "Ronald Goldman",
      roles: ["THIRD_PARTY"],
      side: "neutral",
      notes: "Decedent / victim.",
    },
    {
      id: "person_cochran",
      name: "Johnnie Cochran",
      roles: ["ATTORNEY"],
      side: "ours",
      organization: "Defense trial team",
      isKeyPlayer: true,
      notes: "Lead trial counsel.",
    },
    {
      id: "person_shapiro",
      name: "Robert Shapiro",
      roles: ["ATTORNEY"],
      side: "ours",
      organization: "Defense trial team",
    },
    {
      id: "person_bailey",
      name: "F. Lee Bailey",
      roles: ["ATTORNEY"],
      side: "ours",
      organization: "Defense trial team",
      notes: "Expected to handle cross-examination of investigating officers.",
    },
    {
      id: "person_dershowitz",
      name: "Alan Dershowitz",
      roles: ["ATTORNEY"],
      side: "ours",
      organization: "Defense trial team",
      notes: "Appellate strategy.",
    },
    {
      id: "person_kardashian",
      name: "Robert Kardashian",
      roles: ["ATTORNEY"],
      side: "ours",
      organization: "Defense trial team",
    },
    {
      id: "person_scheck",
      name: "Barry Scheck",
      roles: ["ATTORNEY"],
      side: "ours",
      organization: "Defense trial team",
      isKeyPlayer: true,
      notes: "DNA and forensic evidence challenges.",
    },
    {
      id: "person_neufeld",
      name: "Peter Neufeld",
      roles: ["ATTORNEY"],
      side: "ours",
      organization: "Defense trial team",
      notes: "DNA and forensic evidence challenges.",
    },
    {
      id: "person_douglas",
      name: "Carl Douglas",
      roles: ["ATTORNEY"],
      side: "ours",
      organization: "Defense trial team",
    },
    {
      id: "person_clark",
      name: "Marcia Clark",
      roles: ["ATTORNEY"],
      side: "opposing",
      organization: "Los Angeles County District Attorney",
      isKeyPlayer: true,
      notes: "Lead prosecutor.",
    },
    {
      id: "person_darden",
      name: "Christopher Darden",
      roles: ["ATTORNEY"],
      side: "opposing",
      organization: "Los Angeles County District Attorney",
    },
    {
      id: "person_fuhrman",
      name: "Mark Fuhrman",
      roles: ["POLICE_OFFICER"],
      side: "opposing",
      organization: "Los Angeles Police Department",
      isKeyPlayer: true,
      notes: "Detective; central to the glove evidence and to investigative-bias impeachment.",
      anticipatedTestimony:
        "Expected to testify to discovery of the glove. Defense anticipates impeachment on bias and credibility.",
    },
    {
      id: "person_allan_park",
      name: "Allan Park",
      roles: ["FACT_WITNESS"],
      side: "neutral",
      notes: "Limousine driver; timeline witness.",
      anticipatedTestimony:
        "Expected to testify to arrival time and observations at the residence, bearing on the prosecution's timeline.",
    },
    {
      id: "person_kato_kaelin",
      name: "Kato Kaelin",
      roles: ["FACT_WITNESS"],
      side: "neutral",
      notes: "Houseguest; timeline witness.",
      anticipatedTestimony:
        "Expected to testify to movements and sounds on the night in question.",
    },
  ],
  peopleNarrative:
    "Additional anticipated witnesses include responding officers, forensic analysts, DNA experts, and medical examiner personnel who are not yet individually identified.",

  narrativeOfEvents:
    "Nicole Brown Simpson and Ronald Goldman were found deceased outside Nicole Brown Simpson's residence on June 12, 1994. O.J. Simpson became a suspect following police investigation. A Bronco pursuit occurred on June 17, 1994 after Simpson failed to surrender as expected, ending in his arrest. He was arraigned and charged. Discovery, forensic evidence review, and witness preparation are ongoing.",
  keyEvents: [
    {
      id: "event_oj_murders",
      label: "Nicole Brown Simpson and Ronald Goldman found deceased",
      date: "1994-06-12",
      datePrecision: "day",
      kind: "incident",
    },
    {
      id: "event_oj_bronco",
      label: "Bronco pursuit and arrest of O.J. Simpson",
      date: "1994-06-17",
      datePrecision: "day",
      kind: "incident",
    },
    {
      id: "event_oj_arraignment",
      label: "Arraignment completed",
      date: "1994-06",
      datePrecision: "month",
      kind: "filing",
    },
  ],

  tasks: [
    {
      id: "task_oj_chain_of_custody",
      title: "Assemble the chain-of-custody record for every blood/DNA exhibit",
      detail:
        "Pull collection logs, transfer records, and lab intake for each exhibit to map every gap and contamination opportunity.",
      isTimeSensitive: true,
    },
    {
      id: "task_oj_timeline_reconstruction",
      title: "Reconstruct the night-of timeline against the physical evidence",
      detail:
        "Build a minute-by-minute timeline from witness accounts and forensics to test whether the prosecution's window is physically possible.",
      dueDate: "1994-09-01",
      datePrecision: "day",
      isTimeSensitive: true,
    },
    {
      id: "task_oj_fung_cross",
      title: "Prepare cross-examination of the criminalist on collection practices",
      detail:
        "Focus on swatch handling, drying, and storage deviations from protocol.",
    },
  ],
  urgentDeadlines:
    "The defense team must urgently review forensic evidence, police reports, chain-of-custody documentation, witness statements, timeline evidence, and potential impeachment material before trial strategy is finalized.",

  knownAuthorities:
    "California Penal Code § 187 (murder). Anticipated motions implicate chain-of-custody doctrine, admissibility standards for forensic/DNA methodology, and suppression of evidence obtained without proper warrant or probable cause.",
  focusFirst:
    "Reconstruct the night-of timeline against the physical evidence, and assemble the chain-of-custody and contamination record for every blood and DNA exhibit.",

  documents: {},
};

export default caseIntake;
