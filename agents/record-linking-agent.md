# Record Linking & Supersession Agent

Authoritative reference for how case records connect to each other (the
knowledge **graph links**) and how they evolve over time (the **replacement /
supersession lifecycle**). Read this before touching anything that renders links,
replacement proposals, version history, or status pills in the case workspace.

Role you assume when working here: **master data engineer + agentic engineer +
UX expert.** The hard part is not drawing chips — it is keeping the *derived*
view of a mutable, human-in-the-loop graph consistent so a reference never lies
about a relationship that does (or no longer will) exist.

---

## 1. Mental model

A case is a directed graph of typed **records** (facts, issues, objectives,
theories, claims, precedent, testimony, timeline events, documents, people,
notes…) joined by typed, directional **links**. Both records and links move
through a review lifecycle: nothing is authoritative until a human accepts it,
and an accepted record is never edited in place — it is **replaced** by a new
proposed record that, once accepted, retires the old one.

Two relationships are easy to conflate; keep them distinct:

| Relationship | Stored as | Meaning |
|---|---|---|
| **Link** | a `GraphLink` in `demo.links` | "record A *evidences / depends on / contradicts…* record B" |
| **Replacement** | `replacesIds` / `replacedByIds` on the record itself | "this record is a new version of / supersedes that record" |

Replacement is record **versioning**; links are record **relationships**. The
fix that motivated this brief lives exactly at their intersection (§5).

---

## 2. Data model

`client-app/src/types/caseRecords.ts`.

### Record (`CaseRecord` / `TypedCaseRecord`)

- `status: RecordStatus` — `PROPOSED | ACCEPTED | REJECTED | PENDING_REPLACEMENT | REPLACED`
- `version: number`
- `replacesIds?: string[]` — older record(s) this one supersedes (set on the
  **successor**). Many-valued → supports **N→1 merges**.
- `replacedByIds?: string[]` — successor record(s) that supersede this one (set on
  the **predecessor**). Many-valued → supports **1→N splits**.
- `substatus?`, `supportStatus?`, `party?`, `priority?` — orthogonal axes that
  feed the attention/pill derivations, not lifecycle.

The two replacement arrays are **inverse views of the same edge**. In the demo
seed only `replacesIds` is authored on successors; the forward direction
(`replaced by`) is *derived* at render time (§3), so a 1→N split shows every
successor even when `replacedByIds` was never written.

### Link (`GraphLink`)

- `fromRecordId → type → toRecordId` — **direction is canonical and stored once.**
  The inverse ("evidenced by") is never stored; it is a presentation label.
- `type: RecordLinkType` — 14 types: `DEPENDS_ON, SUPPORTS, EVIDENCES,
  CONTRADICTS, ATTACKS, EXPLAINS, CONTEXTUALIZES, CITES, DERIVED_FROM, REQUIRES,
  LEADS_TO, INVOLVES, DUPLICATES, RELATED_TO`.
- `status: LinkStatus` — `PROPOSED | ACCEPTED | REJECTED`.
- `explanation?`, `confidence?` — agent rationale, surfaced on proposals/replaced.

Directional labels live in `caseRecordPresentation.ts` as
`LINK_TYPE_LABEL_PAIRS` (`{ forward, inverse }`), exposed as `LINK_TYPE_LABELS`
(outbound, source's view) and `LINK_TYPE_INBOUND_LABELS` (inbound, target's
view). e.g. `DEPENDS_ON` = "Depends on" / "Dependency of".

---

## 3. Graph derivations — `useWorkspaceGraph.ts`

The hook owns all derived structure and the simulated lifecycle (accept/reject,
propose revision, delete, create note). **Never recompute these inline in a
component — read them off the `WorkspaceGraph`.**

| Member | What it is |
|---|---|
| `records`, `recordsById` | live records (added + notes + demo, minus deleted) |
| `outboundLinks: Map<id, GraphLink[]>` | links where `fromRecordId === id` |
| `inboundLinks: Map<id, GraphLink[]>` | links where `toRecordId === id` |
| `pendingReplacementByTargetId: Map<id, Record[]>` | **proposed** successors keyed by each id in their `replacesIds` (the live replacement proposals targeting a record) |
| `acceptedReplacementsByTargetId: Map<id, Record[]>` | accepted/retired successors keyed by target — powers "Replaced by" in version history |
| `effectiveStatus(record)` | lifecycle after simulated decisions (§4) |
| `effectiveLinkStatus(link)` | link status after endpoint lifecycle (§4) |
| `proposedRecords` | the review-queue feed |
| `decideProposal`, `proposeRevision`, `deleteRecord`, `createNote` | mutations |

**Finding what points into / out of a record** is just `inboundLinks.get(id)` /
`outboundLinks.get(id)`. To find records with a *proposed* link into R, filter
`inboundLinks.get(R.id)` by `effectiveLinkStatus(link) === "PROPOSED"`.

---

## 4. The two consistency rules (the load-bearing logic)

Everything visible about lifecycle flows from two functions. Understand them
before changing any pill or link visibility.

**`effectiveStatus(record)`** — the single source of truth for a record's
lifecycle:
1. An explicit session decision (accept/reject) wins.
2. A record retired this session reads `REPLACED`.
3. An `ACCEPTED` / `PENDING_REPLACEMENT` record reads `PENDING_REPLACEMENT`
   **only while** `pendingReplacementByTargetId` still has a live proposal
   against it — if that proposal is decided away, it reverts to plain `ACCEPTED`.
4. Otherwise its raw status.

**`effectiveLinkStatus(link)`** — *a link is `ACCEPTED` iff BOTH endpoints are
authoritative* (`ACCEPTED` or `PENDING_REPLACEMENT`); else `PROPOSED`
(`REJECTED` stays rejected). This one rule both **promotes** a proposal's links
on acceptance and **demotes** an accepted link whose endpoint slips back to
proposed/replaced — so an accepted record never displays a link into a proposed
record. Because any link touching a `PROPOSED` record resolves to `PROPOSED`,
"does this proposed successor link to R?" is expressible purely through
`effectiveLinkStatus`.

`isAuthoritative(status) = status === "ACCEPTED" || status === "PENDING_REPLACEMENT"`.

---

## 5. Rendering surfaces & their rules

### `RecordChip.tsx` — the universal reference

Neutral white chip; **lifecycle is carried entirely by ONE right-side pill**, by
a strict cascade so a chip never stacks badges:

> cycle (`In path`) → status pill (if unsettled) → attention pill (if accepted but flagged) → nothing (accepted + calm)

Key props: `isCycle` (already-open-in-path lock; always wins, even under
`hidePill`), `pairedReplacement` (render a Proposed-Replacement record as its
green "Proposed Replacement" identity instead of collapsing to plain blue
"Proposed" — only valid when its retired counterpart is shown alongside),
`showPendingReplacement` (opt in to the amber "Pending Replacement" badge, which
is otherwise suppressed in link lists), `hidePill`, `hideProposedReplacementPill`.

### `helpers.ts` — pill selection (single source of truth)

- `recordDisplayStatus(record, graph)` → `effectiveStatus`, except a proposed
  record with `replacesIds` reads as the cosmetic `PROPOSED_REPLACEMENT` (violet).
  Drives every badge, card tint, and inspector wash so they never diverge.
- `recordAttention(record)` → short reason label (Conflicted, Unsupported,
  At risk, Stale…) **derived** from `supportStatus` / `substatus` / cite-check /
  staleness — never a hand-set flag.
- `resolveStatePill(record, graph)` → the ONE pill for dense views, cascade:
  review status → attention → support → phase → null.
- `needsAttention(record, graph)` → powers the Overview "Needs Attention" panel.

### `RecordLinksPanel.tsx` — the knowledge-graph link lists

Renders a record R's links, grouped by directional type label (outbound forward
phrasing, inbound inverse phrasing). Visibility of each link respects the viewed
record's lifecycle:
- **Proposed / pending-replacement** record: shows proposed links in full (it's
  already unsettled), but never a link to a `REPLACED` endpoint.
- **Plain accepted** record: authoritative links always; proposed links to
  records-in-review only behind the "Show proposed links" checkbox.
- **Replaced** record: all historical links, for provenance.

**Carry-forward rule for "Proposed Replacement Records" (the canonical rule):**
when a linked target `T` is mid-replacement, the panel inlines beneath `T`'s chip
**only** the proposed successors that carry *this* relationship forward to the
viewed record `R` — i.e. a successor `S` is shown iff there is a `PROPOSED` link
**mirroring the displayed link's orientation** between `S` and `R`:
- inbound group (`T` is the link's `from`): require `S → R` in `inboundLinks.get(R.id)`;
- outbound group (`T` is the link's `to`): require `R → S` in `outboundLinks.get(R.id)`.

If `T` has live successors but **none** carry the relationship forward, render no
section and instead flag `T`'s own chip with the amber **"Pending Replacement"**
badge (`showPendingReplacement`) — a warning that `R`'s link to `T` will not
survive the replacement. Section and badge are mutually exclusive.

> **Why:** `pendingReplacementByTargetId` is target-keyed and knows nothing about
> R. A 1→N split fans a record's links across several successors; surfacing a
> successor that never links back to R would assert a relationship it doesn't
> have. *Canonical example (OJ demo):* viewing `theory-contamination`, the linked
> objective `objective-doubt-broad` splits into `objective-doubt-forensic`
> (which `DEPENDS_ON theory-contamination`) and `objective-doubt-investigation`
> (which links to `theory-fuhrman`/`theory-coc` instead). Only the forensic track
> may appear under that link; viewing `theory-fuhrman` shows only the
> investigation track. The earlier bug showed both everywhere.

### `RecordNotices.tsx` — replacement framing in the inspector

- `ReplacementNotice` — on a **proposed successor**: "This proposed record would
  replace:" + its `replacesIds` targets (green).
- `PendingReplacementNotice` — on a **target under replacement**: "Record locked
  while replacement proposal(s) are pending" + the live successors (red lock).
- `VersionHistoryNotice` — both lineages: "Replaced by" (union of
  `acceptedReplacementsByTargetId` and `replacedByIds`, deduped → branch-aware)
  and "Replaces" (`replacesIds`, hidden while still a proposal).

---

## 6. Invariants & gotchas

- **Direction is stored once; inverse is a label.** To answer "what points into
  R" use `inboundLinks`; to answer "what does R point to" use `outboundLinks`.
  Never synthesize reverse edges into the data.
- **Read lifecycle through `effectiveStatus` / `effectiveLinkStatus`**, never raw
  `record.status` / `link.status`, anywhere visibility or pills depend on it.
- **One pill per chip.** New signals must slot into the existing cascade, not add
  a parallel badge.
- **Replacement fan-out is many-valued.** Any "replaced by" / "replaces" /
  "pending replacement" code must handle arrays (1→N splits, N→1 merges), not a
  single successor/predecessor.
- **The carry-forward rule is orientation-aware on purpose.** Don't simplify it
  to "links into R" — that silently breaks outbound link groups.

---

## 7. File map

| Concern | File |
|---|---|
| Record + link types, enums | `client-app/src/types/caseRecords.ts` |
| Labels, status/tone classes, link label pairs | `client-app/src/lib/caseRecordPresentation.ts` |
| Status → color recipes ("Ink & Tint") | `client-app/src/lib/tones.ts` |
| Graph derivations + lifecycle simulation | `client-app/src/components/features/case-workspace/useWorkspaceGraph.ts` |
| Pill selection / attention derivation | `client-app/src/components/features/case-workspace/helpers.ts` |
| Universal record reference chip | `client-app/src/components/features/case-workspace/RecordChip.tsx` |
| Knowledge-graph link lists + carry-forward rule | `client-app/src/components/features/case-workspace/RecordLinksPanel.tsx` |
| Replacement / version-history notices | `client-app/src/components/features/case-workspace/RecordNotices.tsx` |
| Demo graph (records + `links` tuples) | `client-app/src/lib/caseWorkspaceDemoOj.ts` |

Related briefs: `lawstruct-ai-product-architecture-agent.md` (Human-In-The-Loop
Lifecycle), `frontend-style-parity-agent.md` (chip/pill visual language).
