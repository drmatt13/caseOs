export type ClassValue = string | false | null | undefined;

// Tiny class-name joiner. Deliberately NOT tailwind-merge: when two utilities
// conflict, resolve it with a Tailwind `!` important token (the pattern already
// used in TextAreaField), not by relying on string/merge order.
export const cn = (...classes: ClassValue[]): string =>
  classes.filter(Boolean).join(" ");
