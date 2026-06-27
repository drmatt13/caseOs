import type { ReactNode } from "react";
import {
  Briefcase,
  Scale,
  Clock,
  ListChecks,
  Target,
  Users,
  FileText,
  Flag,
  Pencil,
  type LucideIcon,
} from "lucide-react";

import type { CaseIntake } from "#/types/caseWorkspace";
import { TONES } from "#/lib/tones";
import {
  claimHasAnchor,
  eventHasAnchor,
  personHasAnchor,
  taskHasAnchor,
} from "#/components/features/create-case/caseIntakeForm";

type ReviewFormProps = {
  caseIntake: CaseIntake;
  onEditStep: (step: number) => void;
};

type ReviewSectionStatus = "skipped";

const humanize = (value: string) =>
  value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const truncate = (value: string, max = 120) =>
  value.length > max ? `${value.slice(0, max).trimEnd()}…` : value;

const plural = (count: number, noun: string) =>
  `${count} ${noun}${count === 1 ? "" : "s"}`;

// One line of the recap. Muted lines are quiet summaries, not warnings.
const Line = ({
  children,
  muted = false,
}: {
  children: ReactNode;
  muted?: boolean;
}) => (
  <p className={`text-sm ${muted ? "text-black/45" : "text-black/60"}`}>
    {children}
  </p>
);

const SkippedPill = () => (
  <span
    className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-xs ${TONES.caution.badge}`}
  >
    <Flag className="h-3 w-3" />
    Skipped
  </span>
);

const ReviewForm = ({ caseIntake, onEditStep }: ReviewFormProps) => {
  const c = caseIntake;

  const claimCount = (c.claims ?? []).filter(claimHasAnchor).length;
  const eventCount = (c.keyEvents ?? []).filter(eventHasAnchor).length;
  const taskList = (c.tasks ?? []).filter(taskHasAnchor);
  const urgentCount = taskList.filter((task) => task.isTimeSensitive).length;
  const people = c.people.filter(personHasAnchor);
  const keyPeople = people.filter((person) => person.isKeyPlayer).length;
  const docCount = Object.keys(c.documents ?? {}).length;
  const hasTimelineContent =
    eventCount > 0 || Boolean(c.narrativeOfEvents?.trim());
  const hasTaskContent =
    taskList.length > 0 || Boolean(c.urgentDeadlines?.trim());
  const hasPeopleContent =
    people.length > 0 || Boolean(c.peopleNarrative?.trim());
  const hasDocumentContent = docCount > 0;

  const strategyFlags = [
    c.theoryOfTheCase?.trim() ? "Theory" : null,
    c.keyDisputedIssues?.trim() ? "Issues" : null,
    c.openQuestions?.trim() ? "Open questions" : null,
    c.biggestRisk?.trim() ? "Risk" : null,
  ].filter(Boolean);

  const sections: {
    step: number;
    icon: LucideIcon;
    title: string;
    lines: ReactNode;
    status?: ReviewSectionStatus;
  }[] = [
    {
      step: 1,
      icon: Briefcase,
      title: "Case Basics",
      lines: (
        <>
          <Line>
            <span className="text-black/80">
              {c.caseName || "Untitled case"}
            </span>
            {c.representedPartyName ? ` · for ${c.representedPartyName}` : ""}
          </Line>
          <Line>
            {[
              humanize(c.clientRole),
              c.jurisdictionOrCourt || null,
              humanize(c.representationPracticeArea),
            ]
              .filter(Boolean)
              .join(" · ")}
          </Line>
        </>
      ),
    },
    {
      step: 2,
      icon: Scale,
      title: "Dispute",
      lines: (
        <>
          <Line>
            {c.whatIsTheDisputeAbout?.trim()
              ? truncate(c.whatIsTheDisputeAbout)
              : "—"}
          </Line>
          <Line>
            {[
              claimCount > 0
                ? `${plural(claimCount, "pinned claim")}`
                : "Claims described in prose",
              humanize(c.currentCaseStatus),
              c.caseNumber?.trim() ? `No. ${c.caseNumber}` : null,
            ]
              .filter(Boolean)
              .join(" · ")}
          </Line>
        </>
      ),
    },
    {
      step: 3,
      icon: Clock,
      title: "Timeline",
      status: hasTimelineContent ? undefined : "skipped",
      lines: hasTimelineContent ? (
        <Line>
          {[
            c.narrativeOfEvents?.trim() ? "Story captured" : null,
            eventCount > 0 ? plural(eventCount, "pinned date") : null,
          ]
            .filter(Boolean)
            .join(" · ")}
        </Line>
      ) : (
        <Line muted>No timeline details added.</Line>
      ),
    },
    {
      step: 4,
      icon: ListChecks,
      title: "Tasks & Deadlines",
      status: hasTaskContent ? undefined : "skipped",
      lines: hasTaskContent ? (
        <Line>
          {[
            taskList.length > 0 ? plural(taskList.length, "task") : null,
            urgentCount > 0 ? `${urgentCount} time-sensitive` : null,
            taskList.length === 0 && c.urgentDeadlines?.trim()
              ? "Described in prose"
              : null,
          ]
            .filter(Boolean)
            .join(" · ")}
        </Line>
      ) : (
        <Line muted>No tasks or deadlines added.</Line>
      ),
    },
    {
      step: 5,
      icon: Target,
      title: "Goals & Strategy",
      lines: (
        <>
          <Line>{c.objective?.trim() ? truncate(c.objective) : "—"}</Line>
          {strategyFlags.length > 0 ? (
            <Line>{strategyFlags.join(" · ")}</Line>
          ) : (
            <Line muted>Theory, issues, and questions not added yet.</Line>
          )}
        </>
      ),
    },
    {
      step: 6,
      icon: Users,
      title: "Parties & Witnesses",
      status: hasPeopleContent ? undefined : "skipped",
      lines: hasPeopleContent ? (
        <Line>
          {[
            people.length > 0 ? plural(people.length, "person") : null,
            keyPeople > 0 ? `${keyPeople} key` : null,
            people.length === 0 && c.peopleNarrative?.trim()
              ? "Described in prose"
              : null,
          ]
            .filter(Boolean)
            .join(" · ")}
        </Line>
      ) : (
        <Line muted>No parties or witnesses added.</Line>
      ),
    },
    {
      step: 7,
      icon: FileText,
      title: "Documents",
      status: hasDocumentContent ? undefined : "skipped",
      lines: hasDocumentContent ? (
        <Line>{plural(docCount, "file")} ready to process</Line>
      ) : (
        <Line muted>No files added.</Line>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col">
        <h2 className="text-xl font-semibold text-black">
          Review &amp; generate
        </h2>
        <p className="text-sm text-black/60">
          Review what you’ve provided before generating the workspace. Optional
          sections can stay blank.
        </p>
      </div>

      <div className="divide-y divide-black/10 overflow-hidden rounded-2xl border border-black/15 bg-white/40">
        {sections.map(({ step, icon: Icon, title, lines, status }) => {
          const isSkipped = status === "skipped";

          return (
            <button
              key={step}
              type="button"
              onClick={() => onEditStep(step)}
              className={`group flex w-full cursor-pointer items-start gap-3 px-4 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/10 ${
                isSkipped
                  ? `${TONES.caution.surface} hover:bg-amber-50/70`
                  : "hover:bg-black/3"
              }`}
            >
              <div
                className={`mt-0.5 rounded-lg p-2 ${
                  isSkipped ? "bg-amber-100/70" : "bg-black/10"
                }`}
              >
                <Icon
                  className={`h-4 w-4 ${
                    isSkipped ? TONES.caution.ink : "text-black/70"
                  }`}
                />
              </div>
              <div className="flex min-w-0 flex-col gap-0.5">
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <span className="text-md font-medium text-black">
                    {title}
                  </span>
                  {isSkipped ? <SkippedPill /> : null}
                </div>
                {lines}
              </div>
              <span className="ml-auto flex shrink-0 items-center gap-1 self-center text-xs text-black/40 opacity-70 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </span>
            </button>
          );
        })}
      </div>

      <p className="text-xs text-black/45">
        Generated records start in review, and nothing becomes final until you
        accept it. Use “Generate Workspace” below when you’re ready.
      </p>
    </div>
  );
};

export default ReviewForm;
