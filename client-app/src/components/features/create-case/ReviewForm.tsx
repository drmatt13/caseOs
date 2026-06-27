import type { ReactNode } from "react";
import {
  Briefcase,
  Scale,
  Clock,
  ListChecks,
  Target,
  Users,
  FileText,
  Pencil,
  type LucideIcon,
} from "lucide-react";

import type { CaseIntake } from "#/types/caseWorkspace";
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

// One line of the recap. A `muted` line marks an optional section the user left
// for the assistant to draft — reinforcing that blanks are the agent's job, not
// an error.
const Line = ({
  children,
  muted = false,
}: {
  children: ReactNode;
  muted?: boolean;
}) => (
  <p className={`text-sm ${muted ? "italic text-black/40" : "text-black/60"}`}>
    {children}
  </p>
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
  }[] = [
    {
      step: 1,
      icon: Briefcase,
      title: "Case Basics",
      lines: (
        <>
          <Line>
            <span className="text-black/80">{c.caseName || "Untitled case"}</span>
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
      lines:
        eventCount > 0 || c.narrativeOfEvents?.trim() ? (
          <Line>
            {[
              c.narrativeOfEvents?.trim() ? "Story captured" : null,
              eventCount > 0 ? plural(eventCount, "pinned date") : null,
            ]
              .filter(Boolean)
              .join(" · ")}
          </Line>
        ) : (
          <Line muted>Nothing added — the assistant will build the timeline.</Line>
        ),
    },
    {
      step: 4,
      icon: ListChecks,
      title: "Tasks & Deadlines",
      lines:
        taskList.length > 0 || c.urgentDeadlines?.trim() ? (
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
          <Line muted>Nothing added — the assistant will propose first steps.</Line>
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
            <Line muted>
              Theory, issues, and questions left for the assistant to draft.
            </Line>
          )}
        </>
      ),
    },
    {
      step: 6,
      icon: Users,
      title: "People & Witnesses",
      lines:
        people.length > 0 || c.peopleNarrative?.trim() ? (
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
          <Line muted>Nothing added — the assistant will extract them.</Line>
        ),
    },
    {
      step: 7,
      icon: FileText,
      title: "Documents",
      lines:
        docCount > 0 ? (
          <Line>{plural(docCount, "file")} ready to process</Line>
        ) : (
          <Line muted>No files added.</Line>
        ),
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col">
        <h2 className="text-xl font-semibold text-black">Review &amp; generate</h2>
        <p className="text-sm text-black/60">
          A quick look at what you’ve provided. Anything blank becomes the
          assistant’s first task — you’ll review everything it drafts.
        </p>
      </div>

      <div className="divide-y divide-black/10 overflow-hidden rounded-2xl border border-black/15 bg-white/40">
        {sections.map(({ step, icon: Icon, title, lines }) => (
          <button
            key={step}
            type="button"
            onClick={() => onEditStep(step)}
            className="group flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-black/3 cursor-pointer"
          >
            <div className="mt-0.5 rounded-lg bg-black/10 p-2">
              <Icon className="h-4 w-4 text-black/70" />
            </div>
            <div className="flex min-w-0 flex-col gap-0.5">
              <span className="text-md font-medium text-black">{title}</span>
              {lines}
            </div>
            <span className="ml-auto flex shrink-0 items-center gap-1 self-center text-xs text-black/45 opacity-0 transition-opacity group-hover:opacity-100">
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </span>
          </button>
        ))}
      </div>

      <p className="text-xs text-black/45">
        Every record starts as a proposal — nothing is final until you accept it.
        Use “Generate Workspace” below when you’re ready.
      </p>
    </div>
  );
};

export default ReviewForm;
