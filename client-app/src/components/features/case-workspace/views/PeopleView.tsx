import { ChevronRight } from "lucide-react";

import type { RecordType } from "#/types/caseRecords";
import {
  VIEW_DESCRIPTIONS,
  VIEW_LABELS,
} from "#/lib/caseRecordPresentation";

import { recordDisplayStatus } from "../helpers";
import { RecordCreateActions } from "../common";
import { StatusBadge } from "../RecordBadges";
import type { WorkspaceGraph } from "../useWorkspaceGraph";

function PeopleView({
  graph,
  onOpenRecord,
  onCreateRecord,
  onGenerateRecord,
}: {
  graph: WorkspaceGraph;
  onOpenRecord: (recordId: string) => void;
  onCreateRecord: (type: RecordType) => void;
  onGenerateRecord: (type: RecordType) => void;
}) {
  const people = graph.records.filter((record) => record.type === "PERSON");

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-serif text-lg">{VIEW_LABELS.people}</h2>
          <p className="mt-1 text-sm text-black/70">
            {VIEW_DESCRIPTIONS.people}
          </p>
        </div>
        <RecordCreateActions
          type="PERSON"
          singular="person"
          onCreate={onCreateRecord}
          onGenerate={onGenerateRecord}
        />
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {people.map((person) => {
          if (person.type !== "PERSON") return null;
          const involvedIn = (graph.inboundLinks.get(person.id) ?? []).filter(
            (link) => link.type === "INVOLVES",
          );

          return (
            <article
              key={person.id}
              className="rounded-xl border border-black/15 bg-white/70 p-4"
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-md font-semibold">{person.name}</h3>
                <StatusBadge status={recordDisplayStatus(person, graph)} />
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {person.roles.map((role) => (
                  <span
                    key={role}
                    className="rounded-full border border-black/15 bg-white/80 px-2 py-0.5 text-xs capitalize text-black/70"
                  >
                    {role.replaceAll("_", " ").toLowerCase()}
                  </span>
                ))}
                {person.organization && (
                  <span className="rounded-full border border-black/15 bg-black/[0.03] px-2 py-0.5 text-xs text-black/70">
                    {person.organization}
                  </span>
                )}
              </div>
              <p className="mt-3 line-clamp-3 text-sm leading-5 text-black/70">
                {person.content}
              </p>
              <div className="mt-3 flex items-center justify-between gap-2">
                <span className="text-xs text-black/50">
                  Involved in {involvedIn.length} record
                  {involvedIn.length === 1 ? "" : "s"}
                </span>
                <button
                  type="button"
                  className="inline-flex items-center gap-1 rounded-lg border border-black/15 bg-white/80 px-2.5 py-1.5 text-sm text-black/65 transition-colors hover:bg-black/10"
                  onClick={() => onOpenRecord(person.id)}
                >
                  Open
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

export default PeopleView;
