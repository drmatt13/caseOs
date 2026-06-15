import type { ClientRole } from "#/types/caseDomain";
import type { TypedCaseRecord } from "#/types/caseRecords";
import {
  ATTENTION_SUBSTATUSES,
  RECORD_DISPLAY_STATUS_CLASSES,
  RECORD_DISPLAY_STATUS_LABELS,
  RECORD_PARTY_CLASSES,
  RECORD_SUBSTATUS_LABELS,
  type RecordDisplayStatus,
  recordPartyLabel,
} from "#/lib/caseRecordPresentation";
import { TONES } from "#/lib/tones";

export function StatusBadge({ status }: { status: RecordDisplayStatus }) {
  // Accepted is the authoritative default — it wears no badge. Its absence,
  // alongside Proposed / Proposed Replacement / Pending Replacement, is the
  // signal. Only unsettled states are labeled.
  if (status === "ACCEPTED") return null;
  return (
    <span
      className={`rounded-full border px-2 py-0.5 text-xs ${RECORD_DISPLAY_STATUS_CLASSES[status]}`}
    >
      {RECORD_DISPLAY_STATUS_LABELS[status]}
    </span>
  );
}

export function SubstatusBadge({ record }: { record: TypedCaseRecord }) {
  if (!record.substatus) return null;
  const needsAttention = ATTENTION_SUBSTATUSES.includes(record.substatus);

  return (
    <span
      className={`rounded-full border px-2 py-0.5 text-xs ${
        needsAttention ? TONES.caution.badge : TONES.neutral.badge
      }`}
    >
      {RECORD_SUBSTATUS_LABELS[record.substatus]}
    </span>
  );
}

export function PartyBadge({
  record,
  clientRole,
}: {
  record: TypedCaseRecord;
  clientRole: ClientRole;
}) {
  if (!record.party) return null;

  return (
    <span
      className={`rounded-full border px-2 py-0.5 text-xs ${RECORD_PARTY_CLASSES[record.party]}`}
    >
      {recordPartyLabel(record.party, clientRole)}
    </span>
  );
}
