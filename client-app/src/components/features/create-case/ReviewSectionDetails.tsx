import type { ReactNode } from "react";
import {
  AlarmClock,
  Briefcase,
  Clock,
  FileText,
  ListChecks,
  Scale,
  Sparkles,
  Star,
  Target,
  Users,
  type LucideIcon,
} from "lucide-react";

import type {
  CaseIntake,
  CourtSystem,
  DatePrecision,
  RecordParty,
} from "#/types/caseWorkspace";
import type { RecordType } from "#/types/caseRecords";
import { PARTY_TONES, TONES } from "#/lib/tones";
import { EVENT_DATE_FORMAT_OPTIONS } from "#/lib/datePrecision";
import { RECORD_TYPE_LABELS } from "#/lib/caseRecordPresentation";
import { US_STATE_LABELS } from "#/lib/usJurisdictions";
import {
  claimHasAnchor,
  eventHasAnchor,
  INTAKE_FIELD_SEEDS,
  personHasAnchor,
  taskHasAnchor,
} from "#/components/features/create-case/caseIntakeForm";

// ─────────────────────────────────────────────────────────────────────────────
// Read-only "full content" renderer for one review section. The same component
// powers both the inline expand on the Review step and the full-intake preview
// modal, so the two can never drift. Everything here is the user's own captured
// data rendered verbatim — no generated/summarized prose.
// ─────────────────────────────────────────────────────────────────────────────

export type ReviewStep = 1 | 2 | 3 | 4 | 5 | 6 | 7;

// Step → icon + title. Shared by the Review row headers and the preview modal so
// the section identity lives in one place.
export const REVIEW_SECTION_META: {
  step: ReviewStep;
  title: string;
  icon: LucideIcon;
}[] = [
  { step: 1, title: "Case Basics", icon: Briefcase },
  { step: 2, title: "Dispute", icon: Scale },
  { step: 3, title: "Timeline", icon: Clock },
  { step: 4, title: "Tasks & Deadlines", icon: ListChecks },
  { step: 5, title: "Goals & Strategy", icon: Target },
  { step: 6, title: "Parties & Witnesses", icon: Users },
  { step: 7, title: "Documents", icon: FileText },
];

// Title-cases an enum value ("expert_witness" / "EXPERT_WITNESS" → "Expert
// Witness"). Exported because the collapsed Review summaries use it too.
export const humanize = (value: string) =>
  value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

export const COURT_SYSTEM_LABELS: Record<CourtSystem, string> = {
  federal: "Federal",
  state: "State",
  other: "Other",
};

const PARTY_LABELS: Record<RecordParty, string> = {
  ours: "Our side",
  opposing: "Opposing",
  neutral: "Neutral",
};

// Formats an intake key-date at its precision, collapsing a start/end pair into a
// range. Mirrors case-workspace/helpers.ts `formatEventDate`, but takes the
// intake event's loose fields rather than a TimelineEventRecord.
const formatIntakeDate = (
  date?: string,
  precision: DatePrecision = "day",
  endDate?: string,
): string => {
  if (!date) return "";
  const start = new Date(date);
  if (Number.isNaN(start.getTime())) return date;
  const formatter = new Intl.DateTimeFormat(
    "en-US",
    EVENT_DATE_FORMAT_OPTIONS[precision],
  );
  if (endDate) {
    const end = new Date(endDate);
    if (!Number.isNaN(end.getTime()) && end.getTime() > start.getTime()) {
      return formatter.formatRange(start, end);
    }
  }
  return formatter.format(start);
};

// ── Read-only primitives ─────────────────────────────────────────────────────

const Prose = ({ label, value }: { label: string; value?: string }) =>
  value && value.trim() ? (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium uppercase tracking-wide text-black/40">
        {label}
      </span>
      <p className="whitespace-pre-wrap text-sm leading-relaxed text-black/75">
        {value.trim()}
      </p>
    </div>
  ) : null;

const Scalar = ({ label, value }: { label: string; value?: ReactNode }) =>
  value ? (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-black/45">{label}</span>
      <span className="text-sm text-black/75">{value}</span>
    </div>
  ) : null;

const ScalarGrid = ({ children }: { children: ReactNode }) => (
  <div className="grid grid-cols-2 gap-x-4 gap-y-3">{children}</div>
);

const MiniCard = ({ children }: { children: ReactNode }) => (
  <div className="flex flex-col gap-1 rounded-lg border border-black/10 bg-white/60 p-3">
    {children}
  </div>
);

const PartyChip = ({ side }: { side: RecordParty }) => (
  <span
    className={`inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-xs ${PARTY_TONES[side].badge}`}
  >
    {PARTY_LABELS[side]}
  </span>
);

const Muted = ({ children }: { children: ReactNode }) => (
  <p className="text-sm text-black/45">{children}</p>
);

const GroupLabel = ({ children }: { children: ReactNode }) => (
  <span className="text-xs font-medium uppercase tracking-wide text-black/40">
    {children}
  </span>
);

// ── Per-section bodies ───────────────────────────────────────────────────────

const renderBasics = (c: CaseIntake) => {
  const courtSystemText = c.courtSystem
    ? c.courtSystem === "state" && c.jurisdictionState
      ? `State — ${US_STATE_LABELS[c.jurisdictionState]}`
      : COURT_SYSTEM_LABELS[c.courtSystem]
    : undefined;

  return (
    <ScalarGrid>
      <Scalar label="Represented party" value={c.representedPartyName || undefined} />
      <Scalar label="Prepared by" value={c.intakeProvidedBy || undefined} />
      <Scalar
        label="Practice area"
        value={humanize(c.representationPracticeArea)}
      />
      <Scalar label="Client role" value={humanize(c.clientRole)} />
      {c.intakePerspective === "attorney" ? (
        <Scalar label="Representation" value={humanize(c.representationRole)} />
      ) : null}
      <Scalar label="Court or forum" value={c.jurisdictionOrCourt || undefined} />
      <Scalar label="Court system" value={courtSystemText} />
    </ScalarGrid>
  );
};

const renderDispute = (c: CaseIntake) => {
  const claims = (c.claims ?? []).filter(claimHasAnchor);
  return (
    <div className="flex flex-col gap-3">
      <Prose label="What the dispute is about" value={c.whatIsTheDisputeAbout} />
      <Prose
        label="Claims, defenses & allegations"
        value={c.claimsAndDefenses}
      />
      {claims.length > 0 ? (
        <div className="flex flex-col gap-2">
          <GroupLabel>Pinned claims</GroupLabel>
          {claims.map((claim) => (
            <MiniCard key={claim.id}>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-black">
                  {claim.label}
                </span>
                <PartyChip side={claim.side} />
                {claim.kind ? (
                  <span className="text-xs text-black/50">
                    {humanize(claim.kind)}
                  </span>
                ) : null}
              </div>
              {claim.description ? (
                <p className="whitespace-pre-wrap text-sm text-black/70">
                  {claim.description}
                </p>
              ) : null}
            </MiniCard>
          ))}
        </div>
      ) : null}
      <ScalarGrid>
        <Scalar label="Case number" value={c.caseNumber?.trim() || undefined} />
        <Scalar label="Case status" value={humanize(c.currentCaseStatus)} />
      </ScalarGrid>
      <Prose label="Known authorities" value={c.knownAuthorities} />
    </div>
  );
};

const renderTimeline = (c: CaseIntake) => {
  const events = (c.keyEvents ?? []).filter(eventHasAnchor);
  if (events.length === 0 && !c.narrativeOfEvents?.trim()) {
    return <Muted>No timeline details added.</Muted>;
  }
  return (
    <div className="flex flex-col gap-3">
      <Prose label="What has happened so far" value={c.narrativeOfEvents} />
      {events.length > 0 ? (
        <div className="flex flex-col gap-2">
          <GroupLabel>Pinned dates</GroupLabel>
          {events.map((event) => (
            <MiniCard key={event.id}>
              <div className="flex flex-wrap items-baseline gap-2">
                <span className="text-sm font-medium text-black">
                  {formatIntakeDate(
                    event.date,
                    event.datePrecision,
                    event.endDate,
                  )}
                </span>
                {event.kind ? (
                  <span className="text-xs text-black/50">
                    {humanize(event.kind)}
                  </span>
                ) : null}
              </div>
              <span className="text-sm text-black/75">{event.label}</span>
              {event.notes ? (
                <p className="whitespace-pre-wrap text-sm text-black/65">
                  {event.notes}
                </p>
              ) : null}
            </MiniCard>
          ))}
        </div>
      ) : null}
    </div>
  );
};

const renderTasks = (c: CaseIntake) => {
  const tasks = (c.tasks ?? []).filter(taskHasAnchor);
  if (tasks.length === 0 && !c.urgentDeadlines?.trim()) {
    return <Muted>No tasks or deadlines added.</Muted>;
  }
  return (
    <div className="flex flex-col gap-3">
      {tasks.length > 0 ? (
        <div className="flex flex-col gap-2">
          {tasks.map((task) => (
            <MiniCard key={task.id}>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-black">
                  {task.title}
                </span>
                {task.isTimeSensitive ? (
                  <span
                    className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs ${TONES.caution.badge}`}
                  >
                    <AlarmClock className="h-3 w-3" />
                    Time-sensitive
                  </span>
                ) : null}
                {task.dueDate ? (
                  <span className="text-xs text-black/50">
                    Due {formatIntakeDate(task.dueDate, task.datePrecision)}
                  </span>
                ) : null}
              </div>
              {task.detail ? (
                <p className="whitespace-pre-wrap text-sm text-black/70">
                  {task.detail}
                </p>
              ) : null}
            </MiniCard>
          ))}
        </div>
      ) : null}
      <Prose label="Other time-sensitive notes" value={c.urgentDeadlines} />
    </div>
  );
};

const GOAL_FIELDS: { label: string; key: keyof CaseIntake }[] = [
  { label: "Your objective", key: "objective" },
  { label: "Desired outcome", key: "desiredOutcome" },
  { label: "Theory of the case", key: "theoryOfTheCase" },
  { label: "Key disputed issues", key: "keyDisputedIssues" },
  { label: "Open questions", key: "openQuestions" },
  { label: "Other side's likely objective", key: "opposingObjective" },
  { label: "Biggest current risk", key: "biggestRisk" },
  { label: "Focus the assistant first on", key: "focusFirst" },
  { label: "Anything else", key: "additionalContext" },
];

const renderGoals = (c: CaseIntake) => (
  <div className="flex flex-col gap-3">
    {GOAL_FIELDS.map(({ label, key }) => {
      const value = c[key];
      return typeof value === "string" ? (
        <Prose key={key} label={label} value={value} />
      ) : null;
    })}
  </div>
);

const renderPeople = (c: CaseIntake) => {
  const people = c.people.filter(personHasAnchor);
  if (people.length === 0 && !c.peopleNarrative?.trim()) {
    return <Muted>No parties or witnesses added.</Muted>;
  }
  return (
    <div className="flex flex-col gap-3">
      {people.length > 0 ? (
        <div className="flex flex-col gap-2">
          {people.map((person) => {
            const roleText = person.roles
              .filter((role) => role && role !== "UNKNOWN")
              .map(humanize)
              .join(", ");
            const subline = [roleText, person.organization]
              .filter(Boolean)
              .join(" · ");
            return (
              <MiniCard key={person.id}>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium text-black">
                    {person.name}
                  </span>
                  <PartyChip side={person.side} />
                  {person.isKeyPlayer ? (
                    <span className="inline-flex items-center gap-1 text-xs text-black/55">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-500" />
                      Key
                    </span>
                  ) : null}
                </div>
                {subline ? (
                  <span className="text-xs text-black/50">{subline}</span>
                ) : null}
                {person.notes ? (
                  <p className="whitespace-pre-wrap text-sm text-black/70">
                    {person.notes}
                  </p>
                ) : null}
                {person.anticipatedTestimony ? (
                  <p className="text-sm text-black/65">
                    <span className="text-black/45">
                      Anticipated testimony —{" "}
                    </span>
                    {person.anticipatedTestimony}
                  </p>
                ) : null}
              </MiniCard>
            );
          })}
        </div>
      ) : null}
      <Prose label="Other people (narrative)" value={c.peopleNarrative} />
    </div>
  );
};

const renderDocuments = (c: CaseIntake) => {
  const docs = Object.values(c.documents ?? {});
  if (docs.length === 0) {
    return <Muted>No files added.</Muted>;
  }
  return (
    <div className="flex flex-col gap-2">
      {docs.map((doc, index) => (
        <MiniCard key={doc.documentId ?? `${doc.fileName}-${index}`}>
          <div className="flex flex-wrap items-center gap-2">
            <FileText className="h-4 w-4 text-black/45" />
            <span className="text-sm font-medium text-black">
              {doc.fileName}
            </span>
            {doc.category ? (
              <span className="text-xs text-black/50">
                {humanize(doc.category)}
              </span>
            ) : null}
          </div>
          {doc.whyThisMatters || doc.userDescription ? (
            <p className="whitespace-pre-wrap text-sm text-black/70">
              {doc.whyThisMatters || doc.userDescription}
            </p>
          ) : null}
        </MiniCard>
      ))}
    </div>
  );
};

// ── Deterministic "seeds" foreshadowing ──────────────────────────────────────
// Which records each section will seed, derived straight from INTAKE_FIELD_SEEDS
// (a fixed mapping — never generated text) and shown only for fields the user
// actually filled, so a skipped section shows nothing extra (its amber warning
// already speaks for it).

const SECTION_SEED_KEYS: Record<ReviewStep, (keyof CaseIntake)[]> = {
  1: [],
  2: [
    "whatIsTheDisputeAbout",
    "claimsAndDefenses",
    "claims",
    "currentCaseStatus",
    "knownAuthorities",
  ],
  3: ["narrativeOfEvents", "keyEvents"],
  4: ["tasks", "urgentDeadlines"],
  5: [
    "objective",
    "desiredOutcome",
    "opposingObjective",
    "theoryOfTheCase",
    "keyDisputedIssues",
    "openQuestions",
    "biggestRisk",
    "focusFirst",
    "additionalContext",
  ],
  6: ["people", "peopleNarrative"],
  7: ["documents"],
};

const keyHasContent = (c: CaseIntake, key: keyof CaseIntake): boolean => {
  switch (key) {
    case "claims":
      return (c.claims ?? []).some(claimHasAnchor);
    case "keyEvents":
      return (c.keyEvents ?? []).some(eventHasAnchor);
    case "people":
      return c.people.some(personHasAnchor);
    case "tasks":
      return (c.tasks ?? []).some(taskHasAnchor);
    case "documents":
      return Object.keys(c.documents ?? {}).length > 0;
    default: {
      const value = c[key];
      return typeof value === "string" && value.trim().length > 0;
    }
  }
};

const sectionSeeds = (step: ReviewStep, c: CaseIntake): RecordType[] => {
  const seen = new Set<RecordType>();
  const out: RecordType[] = [];
  for (const key of SECTION_SEED_KEYS[step]) {
    if (!keyHasContent(c, key)) continue;
    for (const type of INTAKE_FIELD_SEEDS[key] ?? []) {
      if (!seen.has(type)) {
        seen.add(type);
        out.push(type);
      }
    }
  }
  return out;
};

const SeedsLine = ({ seeds }: { seeds: RecordType[] }) => (
  <div className="flex items-center gap-1.5 border-t border-black/5 pt-2 text-xs text-black/40">
    <Sparkles className="h-3 w-3 shrink-0" />
    <span>Seeds {seeds.map((type) => RECORD_TYPE_LABELS[type]).join(" · ")}</span>
  </div>
);

// ── Public component ─────────────────────────────────────────────────────────

const ReviewSectionDetails = ({
  step,
  caseIntake,
}: {
  step: ReviewStep;
  caseIntake: CaseIntake;
}) => {
  const c = caseIntake;
  const body =
    step === 1
      ? renderBasics(c)
      : step === 2
        ? renderDispute(c)
        : step === 3
          ? renderTimeline(c)
          : step === 4
            ? renderTasks(c)
            : step === 5
              ? renderGoals(c)
              : step === 6
                ? renderPeople(c)
                : renderDocuments(c);

  const seeds = sectionSeeds(step, c);

  return (
    <div className="flex flex-col gap-3">
      {body}
      {seeds.length > 0 ? <SeedsLine seeds={seeds} /> : null}
    </div>
  );
};

export default ReviewSectionDetails;
