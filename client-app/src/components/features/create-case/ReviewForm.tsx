import { useState, type ReactNode } from "react";
import { ChevronDown, Eye, Flag, Pencil } from "lucide-react";

import type { CaseIntake } from "#/types/caseWorkspace";
import { TONES } from "#/lib/tones";
import { US_STATE_LABELS } from "#/lib/usJurisdictions";
import Button from "#/components/ui/Button";
import {
  claimHasAnchor,
  eventHasAnchor,
  personHasAnchor,
  taskHasAnchor,
} from "#/components/features/create-case/caseIntakeForm";
import ReviewSectionDetails, {
  COURT_SYSTEM_LABELS,
  humanize,
  REVIEW_SECTION_META,
} from "#/components/features/create-case/ReviewSectionDetails";
import IntakePreviewModal from "#/components/features/create-case/IntakePreviewModal";

type ReviewFormProps = {
  caseIntake: CaseIntake;
  onEditStep: (step: number) => void;
};

const truncate = (value: string, max = 120) =>
  value.length > max ? `${value.slice(0, max).trimEnd()}…` : value;

const plural = (count: number, noun: string) =>
  `${count} ${noun}${count === 1 ? "" : "s"}`;

// One line of the collapsed recap. Muted lines are quiet summaries, not warnings.
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
  const [expanded, setExpanded] = useState<Set<number>>(() => new Set());
  const [previewOpen, setPreviewOpen] = useState(false);

  const toggle = (step: number) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(step)) next.delete(step);
      else next.add(step);
      return next;
    });

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
  const hasPeopleContent = people.length > 0 || Boolean(c.peopleNarrative?.trim());
  const hasDocumentContent = docCount > 0;

  const strategyFlags = [
    c.theoryOfTheCase?.trim() ? "Theory" : null,
    c.keyDisputedIssues?.trim() ? "Issues" : null,
    c.openQuestions?.trim() ? "Open questions" : null,
    c.biggestRisk?.trim() ? "Risk" : null,
  ].filter(Boolean);

  // Prefer the most specific jurisdiction signal for the one-line recap: the
  // state name, then the free-text court, then the bare court-system label.
  const courtSummary =
    c.courtSystem === "state" && c.jurisdictionState
      ? US_STATE_LABELS[c.jurisdictionState]
      : c.jurisdictionOrCourt?.trim() ||
        (c.courtSystem ? COURT_SYSTEM_LABELS[c.courtSystem] : null);

  const statusByStep: Record<number, "skipped" | undefined> = {
    1: undefined,
    2: undefined,
    3: hasTimelineContent ? undefined : "skipped",
    4: hasTaskContent ? undefined : "skipped",
    5: undefined,
    6: hasPeopleContent ? undefined : "skipped",
    7: hasDocumentContent ? undefined : "skipped",
  };

  const summaryByStep: Record<number, ReactNode> = {
    1: (
      <>
        <Line>
          <span className="text-black/80">{c.caseName || "Untitled case"}</span>
          {c.representedPartyName ? ` · for ${c.representedPartyName}` : ""}
        </Line>
        <Line>
          {[
            humanize(c.clientRole),
            courtSummary,
            humanize(c.representationPracticeArea),
          ]
            .filter(Boolean)
            .join(" · ")}
        </Line>
      </>
    ),
    2: (
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
    3: hasTimelineContent ? (
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
    4: hasTaskContent ? (
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
    5: (
      <>
        <Line>{c.objective?.trim() ? truncate(c.objective) : "—"}</Line>
        {strategyFlags.length > 0 ? (
          <Line>{strategyFlags.join(" · ")}</Line>
        ) : (
          <Line muted>Theory, issues, and questions not added yet.</Line>
        )}
      </>
    ),
    6: hasPeopleContent ? (
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
    7: hasDocumentContent ? (
      <Line>{plural(docCount, "file")} ready to process</Line>
    ) : (
      <Line muted>No files added.</Line>
    ),
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col">
          <h2 className="text-xl font-semibold text-black">
            Review &amp; generate
          </h2>
          <p className="text-sm text-black/60">
            Review what you’ve provided before generating the workspace. Expand a
            section to read it back, or preview everything at once. Optional
            sections can stay blank.
          </p>
        </div>
        <Button
          style="secondary"
          size="sm"
          icon={Eye}
          text="Preview full intake"
          onClick={() => setPreviewOpen(true)}
        />
      </div>

      <div className="divide-y divide-black/10 overflow-hidden rounded-2xl border border-black/15 bg-white/40">
        {REVIEW_SECTION_META.map(({ step, icon: Icon, title }) => {
          const isSkipped = statusByStep[step] === "skipped";
          const isOpen = expanded.has(step);

          return (
            <div
              key={step}
              className={isSkipped ? TONES.caution.surface : undefined}
            >
              <div className="flex items-stretch">
                <button
                  type="button"
                  onClick={() => toggle(step)}
                  aria-expanded={isOpen}
                  className={`group flex flex-1 cursor-pointer items-start gap-3 px-4 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-black/10 ${
                    isSkipped ? "hover:bg-amber-50/70" : "hover:bg-black/3"
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
                    {summaryByStep[step]}
                  </div>
                  <ChevronDown
                    className={`ml-auto h-4 w-4 shrink-0 self-center text-black/30 transition-transform ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
                <button
                  type="button"
                  onClick={() => onEditStep(step)}
                  className="flex shrink-0 cursor-pointer items-center gap-1 self-center px-3 text-xs text-black/40 transition-colors hover:text-black/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-black/10"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Edit
                </button>
              </div>
              {isOpen ? (
                <div className="border-t border-black/5 px-4 pt-3 pb-4 pl-14">
                  <ReviewSectionDetails step={step} caseIntake={c} />
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      <p className="text-xs text-black/45">
        Generated records start in review, and nothing becomes final until you
        accept it. Use “Generate Workspace” below when you’re ready.
      </p>

      <IntakePreviewModal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        caseIntake={c}
      />
    </div>
  );
};

export default ReviewForm;
