import { useMemo } from "react";
import { FileText, Image as ImageIcon } from "lucide-react";

import type { CaseDocument, TypedCaseRecord } from "#/types/caseRecords";
import {
  VIEW_DESCRIPTIONS,
  VIEW_LABELS,
} from "#/lib/caseRecordPresentation";
import Button from "#/components/ui/Button";

import { formatDate, isImageDocument } from "../helpers";
import { DocumentViewButton } from "../common";
import RecordChip from "../RecordChip";
import type { WorkspaceGraph } from "../useWorkspaceGraph";

function DocumentCard({
  document,
  documentRecords,
  graph,
  onOpenRecord,
}: {
  document: CaseDocument;
  documentRecords: TypedCaseRecord[];
  graph: WorkspaceGraph;
  onOpenRecord: (recordId: string) => void;
}) {
  return (
    <article className="rounded-xl border border-black/15 bg-white/70 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          {isImageDocument(document) ? (
            <ImageIcon className="h-5 w-5 shrink-0 text-black/65" />
          ) : (
            <FileText className="h-5 w-5 shrink-0 text-black/65" />
          )}
          <h3 className="truncate text-md font-semibold">
            {document.fileName}
          </h3>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="rounded-full border border-black/15 bg-white/80 px-2 py-0.5 text-xs capitalize text-black/70">
            {document.processingStatus}
          </span>
          <DocumentViewButton document={document} />
        </div>
      </div>
      <p className="mt-1 text-sm text-black/65">
        <span className="capitalize">
          {document.category.replaceAll("_", " ")}
        </span>
        {document.pageCount ? ` · ${document.pageCount} pages` : ""} · Uploaded{" "}
        {formatDate(document.createdAt)}
      </p>
      {document.description && (
        <p className="mt-3 text-md leading-6 text-black/75">
          {document.description}
        </p>
      )}
      <div className="mt-3">
        <p className="mb-1.5 text-xs text-black/65">
          Document records extracted from this file ({documentRecords.length})
        </p>
        {documentRecords.length === 0 ? (
          <p className="text-sm text-black/50">
            No document records yet — processing will propose them.
          </p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {documentRecords.map((record) => (
              <RecordChip
                key={record.id}
                record={record}
                graph={graph}
                onOpenRecord={onOpenRecord}
              />
            ))}
          </div>
        )}
      </div>
    </article>
  );
}

function DocumentsView({
  graph,
  onOpenRecord,
}: {
  graph: WorkspaceGraph;
  onOpenRecord: (recordId: string) => void;
}) {
  const documentRecordsByDocumentId = useMemo(() => {
    const map = new Map<string, TypedCaseRecord[]>();
    for (const record of graph.records) {
      if (record.type !== "DOCUMENT") continue;
      map.set(record.documentId, [
        ...(map.get(record.documentId) ?? []),
        record,
      ]);
    }
    return map;
  }, [graph.records]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-serif text-lg">{VIEW_LABELS.documents}</h2>
          <p className="mt-1 text-sm text-black/70">
            {VIEW_DESCRIPTIONS.documents}
          </p>
        </div>
        <Button text="Upload document" icon="upload" />
      </div>
      <div className="grid grid-cols-1 gap-3">
        {graph.demo.documents.map((document) => (
          <DocumentCard
            key={document.id}
            document={document}
            documentRecords={documentRecordsByDocumentId.get(document.id) ?? []}
            graph={graph}
            onOpenRecord={onOpenRecord}
          />
        ))}
      </div>
    </div>
  );
}

export default DocumentsView;
