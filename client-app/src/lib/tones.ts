// ─────────────────────────────────────────────────────────────────────────────
// Semantic tone system — the single source of truth for status/role/party color.
// ─────────────────────────────────────────────────────────────────────────────
//
// Every colored surface in the app (status pills, card tints, role badges,
// party tags) resolves to one of a small fixed set of TONES. Domain enums map
// onto a tone; they never name raw Tailwind colors directly. This guarantees
// that a thing's badge, border, surface, and text can never drift apart — they
// are all derived from the same tone — and that "the same idea" is the same
// color everywhere (e.g. Owner, a proposed replacement, and an elevated record
// all read as `special`).
//
// Palette philosophy — "Ink & Tint":
//   Color lives in the INK (text + a hairline border), not the fill. Fills are
//   near-transparent washes so chips sit *in* the translucent glass surface
//   rather than as opaque stickers on top of it. The result reads as a quiet
//   document/legal field that only raises its voice where it must.
//
// Each tone exposes:
//   badge   — pill/chip: hairline colored border + whisper fill + dark ink
//   surface — card/panel tint: colored border + wash (text inherits)
//   dot     — small status dot (border + solid-ish fill) for dense lists
//   badgeInteractive — badge + group-hover deepening, for clickable chips
//   ink     — bare text color only (no fill/border), for "color in the ink"
//             headings/verbs that sit directly on a tinted surface

export type ToneName =
  | "neutral"
  | "info"
  | "positive"
  | "caution"
  | "critical"
  | "special";

export type Tone = {
  badge: string;
  surface: string;
  dot: string;
  badgeInteractive: string;
  ink: string;
};

export const TONES: Record<ToneName, Tone> = {
  neutral: {
    badge: "border-black/12 bg-black/[0.03] text-black/65",
    surface: "border-black/10 bg-black/[0.04]",
    dot: "border-black/20 bg-black/30",
    badgeInteractive:
      "border-black/12 bg-black/[0.03] text-black/65 group-hover:border-black/20 group-hover:text-black/75",
    ink: "text-black/70",
  },
  info: {
    badge: "border-sky-700/25 bg-sky-50/50 text-sky-800",
    surface: "border-sky-700/20 bg-sky-50/40",
    dot: "border-sky-700/30 bg-sky-500/70",
    badgeInteractive:
      "border-sky-700/25 bg-sky-50/50 text-sky-800 group-hover:border-sky-800/35 group-hover:text-sky-900",
    ink: "text-sky-800",
  },
  positive: {
    badge: "border-emerald-600/30 bg-emerald-50/50 text-emerald-800",
    surface: "border-emerald-600/20 bg-emerald-50/40",
    dot: "border-emerald-700/30 bg-emerald-500/70",
    badgeInteractive:
      "border-emerald-600/30 bg-emerald-50/50 text-emerald-800 group-hover:border-emerald-700/40 group-hover:text-emerald-900",
    ink: "text-emerald-800",
  },
  caution: {
    badge: "border-amber-600/35 bg-amber-50/60 text-amber-900",
    surface: "border-amber-600/25 bg-amber-50/50",
    dot: "border-amber-700/30 bg-amber-500/80",
    badgeInteractive:
      "border-amber-600/35 bg-amber-50/60 text-amber-900 group-hover:border-amber-700/45 group-hover:text-amber-950",
    ink: "text-amber-900",
  },
  critical: {
    badge: "border-red-700/30 bg-red-50/50 text-red-800",
    surface: "border-red-700/20 bg-red-50/40",
    dot: "border-red-700/30 bg-red-500/70",
    badgeInteractive:
      "border-red-700/30 bg-red-50/50 text-red-800 group-hover:border-red-800/40 group-hover:text-red-900",
    ink: "text-red-800",
  },
  special: {
    badge: "border-violet-700/25 bg-violet-50/50 text-violet-800",
    surface: "border-violet-700/20 bg-violet-50/45",
    dot: "border-violet-700/30 bg-violet-500/70",
    badgeInteractive:
      "border-violet-700/25 bg-violet-50/50 text-violet-800 group-hover:border-violet-800/35 group-hover:text-violet-900",
    ink: "text-violet-800",
  },
};

// The authoritative default surface: a blank glass panel with no semantic tint.
// Used for records that ARE the source of truth (accepted) — their lack of tint
// is itself the signal, the same way accepted records wear no badge.
export const BLANK_SURFACE = "border-black/15 bg-white/70";

// Party is a distinct axis (which side of the matter), so it keeps its own
// two-color sub-palette rather than borrowing status tones — but it's built
// from the same Ink & Tint recipe and lives here so all color stays in one file.
export type PartyToneName = "ours" | "opposing" | "neutral";

export const PARTY_TONES: Record<PartyToneName, { badge: string }> = {
  ours: { badge: "border-sky-700/25 bg-sky-50/50 text-sky-800" },
  opposing: { badge: "border-rose-700/25 bg-rose-50/50 text-rose-800" },
  neutral: { badge: "border-black/12 bg-white/70 text-black/65" },
};
