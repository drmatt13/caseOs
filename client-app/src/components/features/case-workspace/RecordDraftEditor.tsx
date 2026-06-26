import { useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowLeftRight,
  ArrowRight,
  Link2,
  Plus,
  Trash2,
  X,
} from "lucide-react";

import type {
  ClaimRecord,
  DatePrecision,
  GraphLink,
  IssueRecord,
  PersonRole,
  RecordLinkType,
  RecordParty,
  RecordSubstatus,
  RecordType,
  SupportStatus,
  TypedCaseRecord,
} from "#/types/caseRecords";
import type { CaseDemo } from "#/demo/caseDemoTypes";
import {
  isSymmetricLink,
  LINK_TYPE_LABEL_PAIRS,
  RECORD_DISPLAY_STATUS_CARD_CLASSES,
  RECORD_SUBSTATUS_LABELS,
  RECORD_TYPE_LABELS,
  SUPPORT_STATUS_LABELS,
  recordPartyLabel,
} from "#/lib/caseRecordPresentation";
import Button from "#/components/ui/Button";
import TextAreaField from "#/components/ui/TextAreaField";
import { TextInputField } from "#/components/features/create-case/fields";

import { recordDisplayStatus, recordMatchesSearch } from "./helpers";
import { StatusBadge } from "./RecordBadges";
import { displayRejectionReason } from "./LinkInfoPopover";
import { WorkPanelSearch } from "./RecordFilters";
import type { WorkspaceGraph } from "./useWorkspaceGraph";

// ─────────────────────────────────────────────────────────────────────────────
// Shared record draft-editing core.
//
// The reusable body of the manual record editor: the common text fields, the
// per-type essential fields, the record-attribute controls (party / phase /
// evidence support), and the knowledge-graph link curation surface. It is the
// single source consumed by BOTH editor shells:
//   • ProposalManualEditor — edit an existing PROPOSED record (saveProposalDraft)
//   • RecordCreateEditor    — author a brand-new record (createRecord)
//
// Nothing here mutates the workspace graph directly: the shells own a `draft`
// and feed changes back through `onChange`. The draft is plain data (RecordDraft)
// so the same shape flows into both graph mutations. All edits are ephemeral
// session state — refresh restores the original test data.
// ─────────────────────────────────────────────────────────────────────────────

// Superset of every field a manual editor can touch: the common record fields
// plus the per-type essentials. Only the fields relevant to a given record type
// are ever read (see RecordTypeFields / seedDraft / the graph mutations).
export type RecordDraft = {
  // Common
  title: string;
  summary: string;
  content: string;
  category: string;
  supportStatus?: SupportStatus;
  supportStatusExplanation: string;
  substatus?: RecordSubstatus;
  party?: RecordParty;
  links: GraphLink[];
  // Per-type essentials
  answer?: string; // QUESTION
  dueDate?: string; // TASK
  isContextual?: boolean; // FACT
  eventDate?: string; // TIMELINE_EVENT
  eventEndDate?: string; // TIMELINE_EVENT
  datePrecision?: DatePrecision; // TIMELINE_EVENT
  citation?: string; // LEGAL_PRECEDENT
  jurisdiction?: string; // LEGAL_PRECEDENT
  court?: string; // LEGAL_PRECEDENT
  citeChecked?: boolean; // LEGAL_PRECEDENT
  pinned?: boolean; // NOTE
  claimType?: ClaimRecord["claimType"]; // CLAIM
  issueType?: IssueRecord["issueType"]; // ISSUE
  name?: string; // PERSON
  roles?: PersonRole[]; // PERSON
  organization?: string; // PERSON
};

const LINK_TYPES = Object.keys(LINK_TYPE_LABEL_PAIRS) as RecordLinkType[];
// "Unverified" (UNKNOWN) is intentionally omitted: the blank "No evidence
// support" already means "not assessed", so offering both is redundant. A record
// that still carries a legacy UNKNOWN keeps it (the option is re-added below only
// when that is the current value).
const SUPPORT_STATUS_OPTIONS = (
  Object.keys(SUPPORT_STATUS_LABELS) as SupportStatus[]
).filter((status) => status !== "UNKNOWN");
const PARTY_OPTIONS: RecordParty[] = ["ours", "opposing"];
const DATE_PRECISION_OPTIONS: DatePrecision[] = [
  "year",
  "month",
  "day",
  "minute",
  "second",
];
const CLAIM_TYPE_OPTIONS: NonNullable<ClaimRecord["claimType"]>[] = [
  "affirmative",
  "counterclaim",
  "cross",
  "third_party",
  "defense",
];
const ISSUE_TYPE_OPTIONS: NonNullable<IssueRecord["issueType"]>[] = [
  "legal",
  "factual",
  "procedural",
  "strategic",
];
// Runtime enumeration of PersonRole (the type itself can't be iterated). Mirrors
// the union in types/caseDomain.ts — keep in sync if roles are added there.
const PERSON_ROLE_OPTIONS: PersonRole[] = [
  "PLAINTIFF",
  "DEFENDANT",
  "PETITIONER",
  "RESPONDENT",
  "WITNESS",
  "EXPERT_WITNESS",
  "FACT_WITNESS",
  "ATTORNEY",
  "PARALEGAL",
  "JUDGE",
  "MAGISTRATE",
  "MEDIATOR",
  "ARBITRATOR",
  "CLIENT",
  "PROPERTY_MANAGER",
  "LANDLORD",
  "TENANT",
  "EMPLOYER",
  "EMPLOYEE",
  "CONTRACTOR",
  "PHYSICIAN",
  "THERAPIST",
  "CASE_WORKER",
  "POLICE_OFFICER",
  "INVESTIGATOR",
  "GOVERNMENT_OFFICIAL",
  "AGENCY_REPRESENTATIVE",
  "CORPORATE_REPRESENTATIVE",
  "THIRD_PARTY",
  "UNKNOWN",
];

const SUBSTATUS_OPTIONS_BY_TYPE: Partial<
  Record<RecordType, readonly RecordSubstatus[]>
> = {
  OBJECTIVE: ["ACTIVE", "AT_RISK", "ACHIEVED", "ABANDONED"],
  CLAIM: ["ASSERTED", "ANTICIPATED", "WITHDRAWN", "DISMISSED"],
  THEORY: ["ADOPTED", "EXPLORING", "BACKUP", "ABANDONED"],
  ISSUE: ["OPEN", "RESERVED", "RESOLVED"],
  ARGUMENT: ["DRAFT", "TRIAL_READY"],
  TASK: ["OPEN", "IN_PROGRESS", "DONE"],
  TESTIMONY: ["ANTICIPATED", "PREPARED", "GIVEN"],
  LEGAL_PRECEDENT: ["GOOD_LAW", "DISTINGUISHED", "QUESTIONED", "OVERRULED"],
  NOTE: ["OPEN_QUESTION", "RESOLVED"],
};
const OPTIONAL_SUBSTATUS_TYPES = new Set<RecordType>([
  "LEGAL_PRECEDENT",
  "NOTE",
]);
const SUBSTATUS_FIELD_LABELS_BY_TYPE: Partial<Record<RecordType, string>> = {
  OBJECTIVE: "Objective state",
  CLAIM: "Claim posture",
  THEORY: "Theory posture",
  ISSUE: "Issue state",
  ARGUMENT: "Argument readiness",
  TASK: "Task progress",
  TESTIMONY: "Testimony stage",
  LEGAL_PRECEDENT: "Precedent treatment",
  NOTE: "Note state",
};

const compactSelectClass =
  "rounded-lg border border-black/15 bg-white/80 px-2 py-1 text-sm text-black/75 outline-none transition focus:border-black/30";
const compactInputClass = `${compactSelectClass} w-full`;

function formatRoleLabel(role: PersonRole): string {
  return role.replaceAll("_", " ").toLowerCase();
}

// Which end of an edge the record sits on, read from its perspective.
function linkDirectionFor(
  link: GraphLink,
  recordId: string,
): "outbound" | "inbound" {
  return link.fromRecordId === recordId ? "outbound" : "inbound";
}

function otherIdFor(link: GraphLink, recordId: string): string {
  return link.fromRecordId === recordId ? link.toRecordId : link.fromRecordId;
}

// Re-orient an edge so the record sits on the requested side, swapping the
// from/to endpoints (and their types) when the direction flips. The link type
// itself is canonical and unchanged — only which record reads as source moves.
function orientLink(
  link: GraphLink,
  recordId: string,
  direction: "outbound" | "inbound",
): GraphLink {
  const recordIsFrom = link.fromRecordId === recordId;
  const wantRecordFrom = direction === "outbound";
  if (recordIsFrom === wantRecordFrom) return link;
  return {
    ...link,
    fromRecordId: link.toRecordId,
    toRecordId: link.fromRecordId,
    fromRecordType: link.toRecordType,
    toRecordType: link.fromRecordType,
  };
}

// Build the record's incident links (both directions), de-duplicated by id.
function incidentLinks(graph: WorkspaceGraph, recordId: string): GraphLink[] {
  const seen = new Set<string>();
  const result: GraphLink[] = [];
  for (const link of [
    ...(graph.outboundLinks.get(recordId) ?? []),
    ...(graph.inboundLinks.get(recordId) ?? []),
  ]) {
    if (seen.has(link.id)) continue;
    seen.add(link.id);
    result.push(link);
  }
  return result;
}

// Default phase for a type, used when seeding a record that has no substatus
// yet. Optional-substatus types (Precedent, Note) start with none.
function defaultSubstatusFor(type: RecordType): RecordSubstatus | undefined {
  const options = SUBSTATUS_OPTIONS_BY_TYPE[type];
  if (!options || OPTIONAL_SUBSTATUS_TYPES.has(type)) return undefined;
  return options[0];
}

// Seed a draft from a record (its current values), used by both the edit shell
// (an existing proposal) and the create shell (an empty skeleton record).
export function seedDraft(
  record: TypedCaseRecord,
  graph: WorkspaceGraph,
): RecordDraft {
  const substatusOptions = SUBSTATUS_OPTIONS_BY_TYPE[record.type];
  const substatus =
    record.substatus && substatusOptions?.includes(record.substatus)
      ? record.substatus
      : defaultSubstatusFor(record.type);

  const base: RecordDraft = {
    title: record.title,
    summary: record.summary ?? "",
    content: record.content,
    category: record.category ?? "",
    supportStatus: record.supportStatus,
    supportStatusExplanation: record.supportStatusExplanation ?? "",
    substatus,
    party: record.party === "neutral" ? undefined : record.party,
    links: incidentLinks(graph, record.id),
  };

  switch (record.type) {
    case "QUESTION":
      return { ...base, answer: record.answer ?? "" };
    case "TASK":
      return { ...base, dueDate: record.dueDate ?? "" };
    case "FACT":
      return { ...base, isContextual: record.isContextual ?? false };
    case "TIMELINE_EVENT":
      return {
        ...base,
        eventDate: record.eventDate ?? "",
        eventEndDate: record.eventEndDate ?? "",
        datePrecision: record.datePrecision ?? "day",
      };
    case "LEGAL_PRECEDENT":
      return {
        ...base,
        citation: record.citation ?? "",
        jurisdiction: record.jurisdiction ?? "",
        court: record.court ?? "",
        citeChecked: record.citeChecked ?? false,
      };
    case "NOTE":
      return { ...base, pinned: record.pinned ?? false };
    case "CLAIM":
      return { ...base, claimType: record.claimType };
    case "ISSUE":
      return { ...base, issueType: record.issueType };
    case "PERSON":
      return {
        ...base,
        name: record.name ?? "",
        roles: record.roles ?? [],
        organization: record.organization ?? "",
      };
    default:
      return base;
  }
}

// A blank, type-correct record used to seed the create shell. Carries the IDs
// and type-required defaults so it satisfies TypedCaseRecord and seedDraft can
// read it; the user fills in the actual content. The id is reused as the new
// record's id, so links curated during creation already point at it.
export function makeSkeletonRecord(
  type: RecordType,
  demo: CaseDemo,
  id: string,
): TypedCaseRecord {
  const now = new Date().toISOString();
  return {
    id,
    workspaceId: demo.workspaceId,
    caseId: demo.caseId,
    type,
    title: "",
    content: "",
    status: "PROPOSED",
    version: 1,
    createdBy: "human",
    createdByUserId: demo.userId,
    createdAt: now,
    updatedAt: now,
    substatus: type === "QUESTION" ? "UNANSWERED" : defaultSubstatusFor(type),
    // Type-required fields so the union is satisfied; overwritten by the user.
    ...(type === "PERSON" ? { name: "", roles: [] } : {}),
    ...(type === "TIMELINE_EVENT" ? { eventDate: "" } : {}),
  } as TypedCaseRecord;
}

// First blocking validation message for a draft, or null when it can be saved.
// Shared by both shells so create and edit enforce the same rules.
export function draftBlockingIssue(
  type: RecordType,
  draft: RecordDraft,
): string | null {
  // A person is identified by its Name (Title is hidden); everything else needs
  // a Title.
  if (type === "PERSON") {
    if (!draft.name?.trim()) return "Add a name before saving.";
    if (!draft.roles || draft.roles.length === 0) {
      return "Add at least one role before saving.";
    }
  } else if (!draft.title.trim()) {
    return "Add a title before saving.";
  }
  if (type === "TIMELINE_EVENT" && !draft.eventDate?.trim()) {
    return "Add an event date before saving.";
  }
  if (draft.links.some((link) => !link.explanation.trim())) {
    return "Every link needs a reason before saving.";
  }
  return null;
}

function FieldLabel({ children }: { children: string }) {
  return <span className="text-xs text-black/60">{children}</span>;
}

function FieldBox({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-5 rounded-lg border border-black/15 bg-black/[0.025] p-3">
      <p className="mb-2 text-xs text-black/65">{title}</p>
      <div className="grid gap-3 sm:grid-cols-2">{children}</div>
    </div>
  );
}

function CheckboxField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex w-fit cursor-pointer select-none items-center gap-2 text-sm text-black/70 sm:col-span-2">
      <input
        type="checkbox"
        className="h-3.5 w-3.5 accent-[#282828]"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      {label}
    </label>
  );
}

// Per-type essential fields — the inputs that only make sense for one record
// type (an event's date, a person's name and roles, a question's answer, …).
// Returns null for types whose common fields + attributes already suffice.
function RecordTypeFields({
  record,
  draft,
  onChange,
}: {
  record: TypedCaseRecord;
  draft: RecordDraft;
  onChange: (next: Partial<RecordDraft>) => void;
}) {
  switch (record.type) {
    case "TIMELINE_EVENT":
      return (
        <FieldBox title="Event details">
          <label className="flex flex-col gap-1.5">
            <FieldLabel>Event date (required)</FieldLabel>
            <input
              type="date"
              className={compactInputClass}
              value={draft.eventDate?.slice(0, 10) ?? ""}
              onChange={(event) => onChange({ eventDate: event.target.value })}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <FieldLabel>End date (optional)</FieldLabel>
            <input
              type="date"
              className={compactInputClass}
              value={draft.eventEndDate?.slice(0, 10) ?? ""}
              onChange={(event) =>
                onChange({ eventEndDate: event.target.value })
              }
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <FieldLabel>Date precision</FieldLabel>
            <select
              className={compactSelectClass}
              value={draft.datePrecision ?? "day"}
              onChange={(event) =>
                onChange({ datePrecision: event.target.value as DatePrecision })
              }
            >
              {DATE_PRECISION_OPTIONS.map((precision) => (
                <option key={precision} value={precision}>
                  {precision}
                </option>
              ))}
            </select>
          </label>
        </FieldBox>
      );

    case "PERSON":
      return (
        <FieldBox title="Person details">
          <label className="flex flex-col gap-1.5 sm:col-span-2">
            <FieldLabel>Name (required)</FieldLabel>
            <input
              className={compactInputClass}
              value={draft.name ?? ""}
              onChange={(event) => onChange({ name: event.target.value })}
              placeholder="Full name"
            />
          </label>
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <FieldLabel>Roles (at least one)</FieldLabel>
            <div className="flex max-h-40 flex-wrap gap-1.5 overflow-y-auto">
              {PERSON_ROLE_OPTIONS.map((role) => {
                const selected = draft.roles?.includes(role) ?? false;
                return (
                  <button
                    key={role}
                    type="button"
                    className={`rounded-full border px-2.5 py-1 text-xs capitalize transition-colors ${
                      selected
                        ? "border-black/30 bg-black/10 text-black/80"
                        : "border-black/15 bg-white/70 text-black/60 hover:bg-black/5"
                    }`}
                    onClick={() =>
                      onChange({
                        roles: selected
                          ? (draft.roles ?? []).filter((r) => r !== role)
                          : [...(draft.roles ?? []), role],
                      })
                    }
                  >
                    {formatRoleLabel(role)}
                  </button>
                );
              })}
            </div>
          </div>
          <label className="flex flex-col gap-1.5 sm:col-span-2">
            <FieldLabel>Organization (optional)</FieldLabel>
            <input
              className={compactInputClass}
              value={draft.organization ?? ""}
              onChange={(event) =>
                onChange({ organization: event.target.value })
              }
              placeholder="Affiliation or employer"
            />
          </label>
        </FieldBox>
      );

    case "QUESTION":
      return (
        <FieldBox title="Answer">
          <TextAreaField
            className="w-full sm:col-span-2"
            label="Answer"
            description="Writing an answer marks the question answered; leaving it blank keeps it open."
            placeholder="The resolution to this question, once known."
            value={draft.answer ?? ""}
            onChange={(event) => onChange({ answer: event.target.value })}
            rows={2}
            minRows={2}
          />
        </FieldBox>
      );

    case "TASK":
      return (
        <FieldBox title="Task details">
          <label className="flex flex-col gap-1.5">
            <FieldLabel>Due date (optional)</FieldLabel>
            <input
              type="date"
              className={compactInputClass}
              value={draft.dueDate?.slice(0, 10) ?? ""}
              onChange={(event) => onChange({ dueDate: event.target.value })}
            />
          </label>
        </FieldBox>
      );

    case "LEGAL_PRECEDENT":
      return (
        <FieldBox title="Authority details">
          <label className="flex flex-col gap-1.5 sm:col-span-2">
            <FieldLabel>Citation (optional)</FieldLabel>
            <input
              className={compactInputClass}
              value={draft.citation ?? ""}
              onChange={(event) => onChange({ citation: event.target.value })}
              placeholder='e.g. "410 U.S. 113 (1973)"'
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <FieldLabel>Jurisdiction (optional)</FieldLabel>
            <input
              className={compactInputClass}
              value={draft.jurisdiction ?? ""}
              onChange={(event) =>
                onChange({ jurisdiction: event.target.value })
              }
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <FieldLabel>Court (optional)</FieldLabel>
            <input
              className={compactInputClass}
              value={draft.court ?? ""}
              onChange={(event) => onChange({ court: event.target.value })}
            />
          </label>
          <CheckboxField
            label="Citation has been verified"
            checked={draft.citeChecked ?? false}
            onChange={(checked) => onChange({ citeChecked: checked })}
          />
        </FieldBox>
      );

    case "FACT":
      return (
        <FieldBox title="Fact details">
          <CheckboxField
            label="Background context (frames the case, not load-bearing proof)"
            checked={draft.isContextual ?? false}
            onChange={(checked) => onChange({ isContextual: checked })}
          />
        </FieldBox>
      );

    case "NOTE":
      return (
        <FieldBox title="Note details">
          <CheckboxField
            label="Pin this note"
            checked={draft.pinned ?? false}
            onChange={(checked) => onChange({ pinned: checked })}
          />
        </FieldBox>
      );

    case "CLAIM":
      return (
        <FieldBox title="Claim details">
          <label className="flex flex-col gap-1.5">
            <FieldLabel>Claim type</FieldLabel>
            <select
              className={compactSelectClass}
              value={draft.claimType ?? ""}
              onChange={(event) =>
                onChange({
                  claimType: event.target.value
                    ? (event.target.value as ClaimRecord["claimType"])
                    : undefined,
                })
              }
            >
              <option value="">No claim type</option>
              {CLAIM_TYPE_OPTIONS.map((claimType) => (
                <option key={claimType} value={claimType}>
                  {claimType.replaceAll("_", " ")}
                </option>
              ))}
            </select>
          </label>
        </FieldBox>
      );

    case "ISSUE":
      return (
        <FieldBox title="Issue details">
          <label className="flex flex-col gap-1.5">
            <FieldLabel>Issue type</FieldLabel>
            <select
              className={compactSelectClass}
              value={draft.issueType ?? ""}
              onChange={(event) =>
                onChange({
                  issueType: event.target.value
                    ? (event.target.value as IssueRecord["issueType"])
                    : undefined,
                })
              }
            >
              <option value="">No issue type</option>
              {ISSUE_TYPE_OPTIONS.map((issueType) => (
                <option key={issueType} value={issueType}>
                  {issueType}
                </option>
              ))}
            </select>
          </label>
        </FieldBox>
      );

    default:
      return null;
  }
}

function RecordAttributeEditor({
  record,
  graph,
  draft,
  onChange,
}: {
  record: TypedCaseRecord;
  graph: WorkspaceGraph;
  draft: RecordDraft;
  onChange: (next: Partial<RecordDraft>) => void;
}) {
  const substatusOptions = SUBSTATUS_OPTIONS_BY_TYPE[record.type];
  const substatusIsOptional = OPTIONAL_SUBSTATUS_TYPES.has(record.type);
  const clientRole = graph.demo.caseContext.representation.clientRole;
  const substatusFieldLabel =
    SUBSTATUS_FIELD_LABELS_BY_TYPE[record.type] ??
    `${RECORD_TYPE_LABELS[record.type]} state`;

  // No rationale when there's no support level, or when support isn't required —
  // there's nothing to justify in either case.
  const supportRationaleDisabled =
    !draft.supportStatus || draft.supportStatus === "SUPPORT_NOT_REQUIRED";
  // Surface a legacy "Unverified" value if the record already carries one, so
  // editing it doesn't blank the control or silently drop the status.
  const supportOptions =
    draft.supportStatus === "UNKNOWN"
      ? [...SUPPORT_STATUS_OPTIONS, "UNKNOWN" as SupportStatus]
      : SUPPORT_STATUS_OPTIONS;

  return (
    <div className="mt-5 rounded-lg border border-black/15 bg-black/[0.025] p-3">
      <p className="mb-2 text-xs text-black/65">Record attributes</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <FieldLabel>Side</FieldLabel>
          <select
            className={compactSelectClass}
            value={draft.party ?? ""}
            onChange={(event) =>
              onChange({
                party: event.target.value
                  ? (event.target.value as RecordParty)
                  : undefined,
              })
            }
          >
            <option value="">No party</option>
            {PARTY_OPTIONS.map((party) => (
              <option key={party} value={party}>
                {recordPartyLabel(party, clientRole)}
              </option>
            ))}
          </select>
          <p className="text-xs leading-4 text-black/45">
            Which side this record mainly concerns. Leave blank when it is not
            tied to either party.
          </p>
        </label>

        {substatusOptions && (
          <label className="flex flex-col gap-1.5">
            <FieldLabel>{substatusFieldLabel}</FieldLabel>
            <select
              className={compactSelectClass}
              value={
                draft.substatus ??
                (substatusIsOptional ? "" : substatusOptions[0])
              }
              onChange={(event) =>
                onChange({
                  substatus: event.target.value
                    ? (event.target.value as RecordSubstatus)
                    : undefined,
                })
              }
            >
              {substatusIsOptional && (
                <option value="">No {substatusFieldLabel.toLowerCase()}</option>
              )}
              {substatusOptions.map((substatus) => (
                <option key={substatus} value={substatus}>
                  {RECORD_SUBSTATUS_LABELS[substatus]}
                </option>
              ))}
            </select>
            <p className="text-xs leading-4 text-black/45">
              Where this record sits in its own workflow or legal lifecycle.
            </p>
          </label>
        )}

        <div className="flex flex-col gap-1.5">
          <FieldLabel>Evidence support</FieldLabel>
          <select
            className={compactSelectClass}
            value={draft.supportStatus ?? ""}
            onChange={(event) => {
              const value = event.target.value as SupportStatus | "";
              const keepsRationale = value && value !== "SUPPORT_NOT_REQUIRED";
              onChange({
                supportStatus: value ? value : undefined,
                ...(keepsRationale ? {} : { supportStatusExplanation: "" }),
              });
            }}
          >
            <option value="">No evidence support</option>
            {supportOptions.map((status) => (
              <option key={status} value={status}>
                {SUPPORT_STATUS_LABELS[status]}
              </option>
            ))}
          </select>
          <p className="text-xs leading-4 text-black/45">
            How strongly the current record graph supports this record's
            identity, role, or assertion.
          </p>
        </div>

        <TextAreaField
          className="w-full sm:col-span-2"
          label="Support rationale"
          description={
            !draft.supportStatus
              ? "Choose an evidence support level before adding a rationale."
              : draft.supportStatus === "SUPPORT_NOT_REQUIRED"
                ? "No rationale needed when support isn't required."
                : undefined
          }
          placeholder="Why is this support level appropriate? Cite the evidence, conflict, or gap."
          value={supportRationaleDisabled ? "" : draft.supportStatusExplanation}
          onChange={(event) =>
            onChange({ supportStatusExplanation: event.target.value })
          }
          rows={2}
          minRows={2}
          maxRows={4}
          disabled={supportRationaleDisabled}
        />
      </div>
    </div>
  );
}

// Small read-only chip for the "other" record on a link — mirrors the type tag
// + title of a RecordChip but is inert (no navigation while editing). Accepts a
// minimal shape so a dangling-reference fallback can be rendered without a full
// record.
function OtherRecordTag({
  record,
}: {
  record: { type: RecordType; title: string };
}) {
  return (
    <span className="inline-flex min-w-0 items-center gap-2">
      <span className="shrink-0 rounded border border-black/15 bg-black/[0.03] px-1.5 py-0.5 text-[0.65rem] uppercase tracking-wide text-black/50">
        {RECORD_TYPE_LABELS[record.type]}
      </span>
      <span className="min-w-0 truncate text-sm text-black/75">
        {record.title}
      </span>
    </span>
  );
}

// One editable edge: the related record, a relationship-type select, a
// direction toggle whose two options ARE the live forward/inverse phrasings, an
// explanation, and a delete. The phrasing line always anchors "This record" on
// the left; inverse direction flips the arrows instead of moving the records.
function LinkEditorRow({
  link,
  recordId,
  graph,
  onChange,
  onRemove,
}: {
  link: GraphLink;
  recordId: string;
  graph: WorkspaceGraph;
  onChange: (next: GraphLink) => void;
  onRemove: () => void;
}) {
  const direction = linkDirectionFor(link, recordId);
  const other = graph.recordsById.get(otherIdFor(link, recordId));
  const otherType =
    direction === "outbound" ? link.toRecordType : link.fromRecordType;
  const pair = LINK_TYPE_LABEL_PAIRS[link.type];
  const symmetric = isSymmetricLink(link.type);
  const verb = pair.forward;
  const otherTitle = other?.title ?? "Unknown record";
  const ThisRecord = (
    <span className="font-medium text-black/75">This record</span>
  );
  const OtherRecord = (
    <span className="min-w-0 truncate text-black/70">{otherTitle}</span>
  );
  const Arrow = symmetric
    ? ArrowLeftRight
    : direction === "outbound"
      ? ArrowRight
      : ArrowLeft;
  const missingReason = !link.explanation.trim();
  const otherDisplayStatus = other
    ? recordDisplayStatus(other, graph)
    : undefined;
  const rejectionReason =
    otherDisplayStatus === "REJECTED" ? other?.rejectionReason : undefined;

  return (
    <div
      className={`rounded-lg border p-2.5 ${
        otherDisplayStatus
          ? RECORD_DISPLAY_STATUS_CARD_CLASSES[otherDisplayStatus]
          : "border-black/15 bg-white/70"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
          <OtherRecordTag
            record={other ?? { type: otherType, title: "Unknown record" }}
          />
          {otherDisplayStatus && <StatusBadge status={otherDisplayStatus} />}
        </div>
        <button
          type="button"
          aria-label="Remove link"
          className="shrink-0 rounded-md p-1 text-black/45 transition-colors hover:bg-black/10 hover:text-red-700"
          onClick={onRemove}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
      {rejectionReason && (
        <p className="mt-1.5 text-xs leading-snug text-red-800/90 line-clamp-2">
          <span className="font-medium">Rejected:</span>{" "}
          {displayRejectionReason(rejectionReason)}
        </p>
      )}

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <select
          className={compactSelectClass}
          value={link.type}
          onChange={(event) =>
            onChange({ ...link, type: event.target.value as RecordLinkType })
          }
        >
          {LINK_TYPES.map((type) => {
            const labels = LINK_TYPE_LABEL_PAIRS[type];
            return (
              <option key={type} value={type}>
                {labels.forward === labels.inverse
                  ? labels.forward
                  : `${labels.forward} / ${labels.inverse}`}
              </option>
            );
          })}
        </select>

        {!symmetric && (
          <div className="inline-flex overflow-hidden rounded-lg border border-black/15">
            {(["outbound", "inbound"] as const).map((option, index) => {
              const active = direction === option;
              const label = option === "outbound" ? pair.forward : pair.inverse;
              return (
                <button
                  key={option}
                  type="button"
                  className={`px-2 py-1 text-sm transition-colors ${
                    index > 0 ? "border-l border-black/15" : ""
                  } ${
                    active
                      ? "bg-black/10 text-black/80"
                      : "bg-white/60 text-black/55 hover:bg-black/5"
                  }`}
                  onClick={() => onChange(orientLink(link, recordId, option))}
                >
                  {label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <p className="mt-2 flex items-center gap-1.5 text-xs text-black/55">
        {ThisRecord}
        <Arrow className="h-3 w-3 shrink-0 text-black/30" />
        <span className="shrink-0 font-medium text-black/75">{verb}</span>
        <Arrow className="h-3 w-3 shrink-0 text-black/30" />
        {OtherRecord}
      </p>

      <div className="mt-2">
        <TextAreaField
          className="w-full"
          label="Why are they related?"
          placeholder="State the rationale for this edge — every link must say why it exists."
          value={link.explanation}
          onChange={(event) =>
            onChange({ ...link, explanation: event.target.value })
          }
          rows={2}
          minRows={2}
        />
        {missingReason && (
          <p className="mt-1 text-xs text-amber-700">
            Add a reason before saving.
          </p>
        )}
      </div>
    </div>
  );
}

// Search-and-pick a record to link. Filters the workspace by text; checkboxes opt
// proposed and rejected (frozen) records into the candidate set (both off by
// default — links usually attach to authoritative records). Replaced records are
// retired version history and are never offered, even one that was also rejected.
function LinkSearchPicker({
  record,
  graph,
  existingOtherIds,
  onPick,
  onClose,
}: {
  record: TypedCaseRecord;
  graph: WorkspaceGraph;
  existingOtherIds: Set<string>;
  onPick: (target: TypedCaseRecord) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [includeProposed, setIncludeProposed] = useState(false);
  const [includeRejected, setIncludeRejected] = useState(false);
  const clientRole = graph.demo.caseContext.representation.clientRole;
  const searchTerm = query.trim();

  const candidates = useMemo(() => {
    if (!searchTerm) return [];

    return graph.records
      .filter((candidate) => {
        if (candidate.id === record.id) return false;
        if (existingOtherIds.has(candidate.id)) return false;
        const status = graph.effectiveStatus(candidate);
        if (status === "REPLACED") return false;
        if (graph.recordIsFrozen(candidate)) {
          if (!includeRejected) return false;
        } else if (status === "PROPOSED" && !includeProposed) {
          return false;
        }
        return recordMatchesSearch(candidate, searchTerm, clientRole);
      })
      .slice(0, 12);
  }, [
    graph,
    record.id,
    existingOtherIds,
    includeProposed,
    includeRejected,
    searchTerm,
    clientRole,
  ]);

  return (
    <div className="rounded-lg border border-black/15 bg-black/[0.025] p-2.5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-black/65">Link a record</p>
        <button
          type="button"
          aria-label="Close link search"
          className="rounded-md p-1 text-black/45 transition-colors hover:bg-black/10"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-2">
        <WorkPanelSearch
          value={query}
          onChange={setQuery}
          placeholder="Search records to link…"
        />
      </div>

      <div className="mt-2 flex flex-col items-start gap-1.5">
        <label className="flex w-fit cursor-pointer select-none items-center gap-2 text-xs text-black/60">
          <input
            type="checkbox"
            className="h-3.5 w-3.5 accent-[#282828]"
            checked={includeProposed}
            onChange={(event) => setIncludeProposed(event.target.checked)}
          />
          Include proposed records
        </label>
        <label className="flex w-fit cursor-pointer select-none items-center gap-2 text-xs text-black/60">
          <input
            type="checkbox"
            className="h-3.5 w-3.5 accent-[#282828]"
            checked={includeRejected}
            onChange={(event) => setIncludeRejected(event.target.checked)}
          />
          Include rejected records
        </label>
      </div>

      <div className="mt-2 flex max-h-56 flex-col gap-1 overflow-y-auto">
        {candidates.length === 0 ? (
          <p className="px-1 py-2 text-sm text-black/50">
            {searchTerm ? "No matching records." : "Search to find records."}
          </p>
        ) : (
          candidates.map((candidate) => {
            const candidateDisplayStatus = recordDisplayStatus(candidate, graph);
            const candidateReason =
              candidateDisplayStatus === "REJECTED"
                ? candidate.rejectionReason
                : undefined;
            return (
              <button
                key={candidate.id}
                type="button"
                className={`group flex w-full flex-col gap-1 rounded-lg border px-2.5 py-1.5 text-left transition-colors hover:border-black/30 ${RECORD_DISPLAY_STATUS_CARD_CLASSES[candidateDisplayStatus]}`}
                onClick={() => onPick(candidate)}
              >
                <div className="flex w-full items-center gap-2">
                  <OtherRecordTag record={candidate} />
                  <StatusBadge status={candidateDisplayStatus} />
                  <Plus className="ml-auto h-4 w-4 shrink-0 text-black/30 group-hover:text-black/70" />
                </div>
                {candidateReason && (
                  <p className="text-xs leading-snug text-red-800/90 line-clamp-2">
                    <span className="font-medium">Rejected:</span>{" "}
                    {displayRejectionReason(candidateReason)}
                  </p>
                )}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

// The full editable body of a record draft: common fields → per-type essentials
// → record attributes → knowledge-graph link curation. The owning shell holds
// the draft and feeds changes back through onChange. `record` supplies the type
// and the id that links orient against (a real proposal when editing, a skeleton
// when creating).
export function RecordDraftFields({
  record,
  graph,
  draft,
  onChange,
}: {
  record: TypedCaseRecord;
  graph: WorkspaceGraph;
  draft: RecordDraft;
  onChange: (next: Partial<RecordDraft>) => void;
}) {
  const [picking, setPicking] = useState(false);

  const existingOtherIds = useMemo(
    () => new Set(draft.links.map((link) => otherIdFor(link, record.id))),
    [draft.links, record.id],
  );

  const updateLink = (id: string, next: GraphLink) =>
    onChange({
      links: draft.links.map((link) => (link.id === id ? next : link)),
    });

  const removeLink = (id: string) =>
    onChange({ links: draft.links.filter((link) => link.id !== id) });

  const addLink = (target: TypedCaseRecord) => {
    const newLink: GraphLink = {
      id: `link-draft-${Date.now()}`,
      workspaceId: record.workspaceId,
      caseId: record.caseId,
      fromRecordId: record.id,
      fromRecordType: record.type,
      toRecordId: target.id,
      toRecordType: target.type,
      type: "RELATED_TO",
      status: "PROPOSED",
      strength: "MODERATE",
      explanation: "",
      createdAt: new Date().toISOString(),
    };
    onChange({ links: [newLink, ...draft.links] });
    setPicking(false);
  };

  // A person's identity is its Name (in RecordTypeFields); the common Title is
  // redundant there and is kept synced to the name by the graph mutations.
  const showTitle = record.type !== "PERSON";

  return (
    <>
      <div className="flex flex-col gap-3">
        {showTitle && (
          <TextInputField
            className="w-full"
            label="Title"
            value={draft.title}
            onChange={(event) => onChange({ title: event.target.value })}
            placeholder="Record title"
          />
        )}
        <TextInputField
          className="w-full"
          label="Category"
          value={draft.category}
          onChange={(event) => onChange({ category: event.target.value })}
          placeholder="Free-form segmentation tag (optional)"
        />
        <TextAreaField
          className="w-full"
          label="Mini summary"
          value={draft.summary}
          onChange={(event) => onChange({ summary: event.target.value })}
          placeholder="Short blurb for cards and search."
          rows={2}
          minRows={2}
        />
        <TextAreaField
          className="w-full"
          label="Content"
          value={draft.content}
          onChange={(event) => onChange({ content: event.target.value })}
          placeholder="Full prose content."
          rows={6}
          minRows={6}
        />
      </div>

      <RecordTypeFields record={record} draft={draft} onChange={onChange} />

      <RecordAttributeEditor
        record={record}
        graph={graph}
        draft={draft}
        onChange={onChange}
      />

      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="flex items-center gap-1.5 text-xs text-black/65">
            <Link2 className="h-3.5 w-3.5" />
            Linked records ({draft.links.length})
          </p>
          {!picking && (
            <Button
              style="secondary"
              size="sm"
              icon={Plus}
              text="Add link"
              onClick={() => setPicking(true)}
            />
          )}
        </div>

        {picking && (
          <div className="mb-2">
            <LinkSearchPicker
              record={record}
              graph={graph}
              existingOtherIds={existingOtherIds}
              onPick={addLink}
              onClose={() => setPicking(false)}
            />
          </div>
        )}

        {draft.links.length === 0 ? (
          <div className="rounded-lg border border-black/15 bg-black/[0.025] p-3 text-sm text-black/50">
            No links yet. Add one to connect this record into the graph.
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {draft.links.map((link) => (
              <LinkEditorRow
                key={link.id}
                link={link}
                recordId={record.id}
                graph={graph}
                onChange={(next) => updateLink(link.id, next)}
                onRemove={() => removeLink(link.id)}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
