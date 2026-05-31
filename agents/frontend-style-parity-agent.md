# Frontend Style Parity Agent

Use this agent when adding or reviewing UI in `client-app`. Its job is to keep new screens visually aligned with the current lawstruct-ai frontend after the recent CSS and layout pass. Treat this file as a field guide, but always inspect the nearest route/component before changing UI.

## Source Of Truth

Start with the global style/theme file, then inspect the closest matching surface:

- Global Tailwind/theme tokens: `client-app/src/styles.css`
- App shell: `client-app/src/routes/__root.tsx`
- Shared page background: `client-app/src/components/layouts/PageBackgroundLayout.tsx`
- App layout: `client-app/src/components/layouts/AppLayout.tsx`
- Left rail: `client-app/src/components/layouts/NavigationPanel.tsx`
- Main work panel: `client-app/src/components/layouts/ContentShell.tsx`
- Auth layout: `client-app/src/components/layouts/LoginLayout.tsx`
- Buttons: `client-app/src/components/Button.tsx`
- Modals: `client-app/src/components/AppModal.tsx`
- Popup menus: `client-app/src/components/popups/SettingsPopup.tsx`
- User/profile rail: `client-app/src/components/UserPanel.tsx`
- Workspace menu: `client-app/src/components/menus/ActiveWorkspaceMenu.tsx`
- Case intake fields: `client-app/src/components/features/case-intake/fields.tsx`
- Case intake wizard menu: `client-app/src/components/menus/CreateCaseMenu.tsx`
- Dense case workspace UI: `client-app/src/routes/case/$id.tsx`
- Auth preview cards: `client-app/src/components/menus/LoginLeftMenu.tsx`
- Subscription tier cards: `client-app/src/components/modals/modify-subscription/SelectTierStep.tsx`

For app workflow surfaces, prefer `/case/$id` over legacy `Workspace.tsx` as the stronger current reference for cards, chips, search, empty states, record rows, nested panels, and review actions.

## Global CSS And Theme

The app uses Tailwind CSS v4 through `@import "tailwindcss"` and `@plugin "@tailwindcss/typography"` in `styles.css`. Do not assume Tailwind's default type scale or breakpoints.

Custom breakpoints:

- `xs`: `45rem`
- `sm`: `50rem`
- `md`: `60rem`
- `lg`: `72.5rem`
- `xl`: `84rem`

Custom text scale:

- `text-xs`: `0.675rem`
- `text-sm`: `0.75rem`
- `text-md`: `0.875rem`
- `text-lg`: `1rem`
- `text-xl`: `1.125rem`
- `text-2xl`: `1.25rem`
- `text-3xl`: `1.5rem`
- `text-4xl`: `1.875rem`

The browser root is intentionally enlarged with `html, body { font-size: 21px; }`. In this app, `text-md` is the normal readable UI size, `text-sm` is compact secondary copy, and `text-xs` is for chips, metadata, and dense menus.

Fonts:

- `Geist` and `Cormorant Garamond` are self-hosted in `client-app/public/fonts`.
- Page wrappers use `font-sans`.
- The LAWSTRUCT logo uses `font-cormorant-garamond`.
- Modal titles, menu step labels, logo text, and some workspace headings intentionally use serif typography.

Theme additions:

- Mist colors exist as `mist-300`, `mist-500`, and `mist-600`, but ordinary product UI still mostly uses black-alpha neutrals and translucent whites.
- Rainbow animation tokens power the special primary AI/generation button treatment. Keep this rare.

## Overall Visual Language

lawstruct-ai uses a quiet, legal-work dashboard style:

- App/auth pages share `PageBackgroundLayout`: a relative isolated `min-h-dvh overflow-x-clip` page, a fixed full-viewport background image layer, and a foreground `relative z-10 mx-auto font-sans w-full` content wrapper.
- Main surfaces are translucent glass panels: `bg-white/40`, `backdrop-blur-sm`, `border border-black/15`, `shadow-md`, usually `rounded-2xl`.
- Nested product surfaces use softer fills such as `bg-white/55`, `bg-white/60`, `bg-white/65`, `bg-white/70`, `bg-white/75`, `bg-white/80`, `bg-black/3`, `bg-black/6`, `bg-black/[0.025]`, and `bg-black/[0.03]`.
- The dominant neutral system is black alpha, not hard grays: prefer `border-black/10`, `border-black/15`, `bg-black/10`, `hover:bg-black/10`, `text-black/60`, and `text-black/75`.
- Controls are compact, text-first, and dense. Use `text-md` for main UI text, `text-sm` for helper text, and `text-xs` for metadata and chips.
- Blue is acceptable for auth links, info states, preview-card accents, and status colors, but should not become ordinary app chrome.

## Layout Standards

For authenticated app routes:

- Wrap pages in `AppLayout`.
- `AppLayout` provides `relative flex flex-row lg:gap-6 lg:pt-14 lg:pb-7 lg:px-8 lg:w-5xl` through `PageBackgroundLayout`.
- Use `NavigationPanel` for the fixed-width left rail: `w-64 min-w-64`, sticky scrollable panel, and left-menu content in `font-serif text-sm`.
- `NavigationPanel` has special responsive behavior. Small screens use a fixed slide-out rail with `bg-neutral-400/40 backdrop-blur-lg`; large screens return to the inline rail with `lg:rounded-2xl`, `lg:border-black/15`, `lg:shadow-md`, and an inner `lg:bg-white/40 lg:backdrop-blur-sm` content layer.
- Large-screen left rail height is scroll-aware through CSS variables set in `NavigationPanel`; avoid replacing that shell with a static sidebar.
- Use `ContentShell` for the main panel: `relative min-w-0 flex-1 flex justify-center lg:block h-max lg:rounded-2xl bg-white/40 backdrop-blur-sm lg:border border-black/15 lg:shadow-md`.
- Keep work-panel inner spacing aligned with `ContentShell`: `w-full`, `pt-16 sm:pt-14 md:pt-5 lg:pt-4`, `px-6 sm:px-12 md:px-4`, `pb-6 md:pb-5 lg:pb-4`, `min-h-dvh lg:min-h-auto`.
- Mobile work panels include a top-left menu opener with `p-1.5 hover:bg-black/15 rounded-lg`.
- Loading states use full viewport centering: `w-full h-dvh flex justify-center items-center`.

For auth routes:

- Wrap pages in `LoginLayout`.
- `LoginLayout` uses `PageBackgroundLayout` with `min-h-dvh gap-6 pb-10 pt-20 px-8 xl:px-0 max-w-max xl:max-w-5xl`.
- Auth pages pair a `w-84` form card with `LoginLeftMenu` preview cards on wider layouts.
- Auth form cards use `w-84` and `flex flex-col px-5 pt-8 pb-5 rounded-2xl bg-white/40 backdrop-blur-sm border border-black/15 shadow-md`.
- Auth headings use `text-[1.7rem] font-bold`.
- Auth helper copy and labels now lean `text-md`; inputs use compact `text-sm`.

Route families:

- Home and create-case routes should use `AppLayout`, `NavigationPanel`, `ContentShell`, `UserPanel`, shared `Button`, and neutral menu rows.
- `/case/$id` is the main reference for dense case workspace UI: record cards, status chips, search inputs, empty states, timeline rows, proposal/review panels, and nested mini-panels.
- Auth routes should keep compact `LoginLayout` forms, `w-84` cards, blue inline links, and the `LoginLeftMenu` preview-card language.

## Typography

- Normal app body/control text: `text-md`.
- Secondary/helper copy: `text-sm`.
- Dense chips, counts, badges, and metadata: `text-xs`.
- Workspace/menu rows: usually `text-sm` because the custom scale is compact.
- Case intake section title: `text-xl font-semibold`.
- Case workspace/modals section heading: `font-serif text-lg`.
- Modal title: `font-serif text-lg`.
- Logo: `text-[1.6rem] tracking-widest font-cormorant-garamond font-medium`.
- Logo subtitle: `text-[0.575rem] whitespace-nowrap font-sans`.

Do not "correct" `text-md` to `text-sm` unless you are intentionally moving content into a secondary/help role. This app's `text-md` is only `0.875rem`.

## Color And Border Standards

Prefer these reusable ingredients:

- Default border: `border border-black/15`
- Softer nested border: `border border-black/10`
- Default hover fill: `hover:bg-black/10`
- Compact icon hover fill: `hover:bg-black/15`
- Selected menu item: `bg-black/10`
- Muted text: `text-gray-600`, `text-gray-500`, `text-black/55`, `text-black/60`, `text-black/65`, `text-black/75`
- Disabled text: `text-gray-400`
- Subtle white nested panels: `bg-white/55`, `bg-white/60`, `bg-white/65`, `bg-white/70`, `bg-white/75`, `bg-white/80`
- Subtle black nested panels: `bg-black/3`, `bg-black/6`, `bg-black/[0.025]`, `bg-black/[0.03]`, `bg-black/5`, `bg-black/10`
- Auth/simple route inputs: `bg-gray-100`
- Modal inputs: `bg-white/70`
- Intake fields and textareas: `bg-white`

Status colors:

- Success alerts/chips: `border-green-200 bg-green-50 text-green-800`
- Error alerts/chips: `border-red-200 bg-red-50 text-red-800` or `text-red-700`
- Warning alerts/chips: `border-amber-200 bg-amber-50 text-amber-800`
- Info alerts/chips: `border-blue-200 bg-blue-50 text-blue-800`
- Case party chips may use rose/sky variants: `border-rose-200 bg-rose-50 text-rose-800`, `border-sky-200 bg-sky-50 text-sky-800`.
- Superseded/metadata chips use black-alpha borders/fills such as `border-black/10 bg-black/5 text-black/55`, `bg-black/[0.03]`, or `bg-white/80`.

## Spacing And Radius

- Outer app gaps: `lg:gap-6`.
- Auth preview layout gap: `gap-4`.
- Left rail/menu gaps: `gap-2` for the rail body, `gap-1.5` or `gap-2` for rows and popup stacks.
- Work panel body padding: `px-6 sm:px-12 md:px-4`, `pt-16 sm:pt-14 md:pt-5 lg:pt-4`, `pb-6 md:pb-5 lg:pb-4`.
- Auth cards: `px-5 pt-8 pb-5`.
- Login preview cards: `p-4`.
- Modal content wrapper: `px-4 py-3`; modal inner content usually `p-1` or `p-2`.
- Case workspace cards: usually `p-4`; nested rows/mini-panels use `p-3`.
- Menu items: `p-2`, often with `h-8` in workspace menus.
- Icon buttons: `p-1.5`.

Radius:

- Major panels/auth cards/popups/upload dropzones: `rounded-2xl`.
- Modals, tier cards, record cards, and most nested cards: `rounded-xl` or `rounded-lg`.
- Inputs on auth screens: `rounded-md`.
- Buttons: `rounded`.
- Avatars/badges/chips: `rounded-full`.

## Buttons And Interactive Rows

Use `client-app/src/components/Button.tsx` for primary and secondary actions.

Button standards:

- Base: `text-sm inline-flex items-center justify-center whitespace-nowrap py-2 rounded border transition-colors`.
- Primary: `border-transparent bg-[#282828] text-white`, hover to black.
- Secondary: `border-black/10 bg-black/10 text-black/75 shadow-sm`, hover to `bg-gray-300 text-black`.
- Disabled: `border-transparent bg-gray-300 !text-gray-400 cursor-not-allowed`.
- Icons come from the shared `Button` icon prop when available: `briefcase`, `continue`, `mail`, `plus`, `reset`, `save`, `sparkles`, and `upload`.
- Use `minWidth` options for stable action sizing: `sm`, `md`, `lg`, or `xl`; use `fullWidth` inside narrow modal controls when needed.
- Use the rainbow button only for special generation/AI confirmation moments.

Interactive row standards:

- Menus use compact rows: `p-2 rounded-lg`, often `text-sm`.
- Workspace menu rows are `p-2 h-8 rounded-lg flex items-center justify-between gap-2`.
- Include `cursor-pointer transition-colors ease-in duration-150 hover:ease-out hover:duration-100`.
- Use `hover:bg-black/10` for standard rows and `hover:bg-black/15` for compact icon buttons.
- Active/selected state is usually `bg-black/10`.
- Disabled menu rows use `cursor-not-allowed text-gray-400` or `opacity-25`.

## Forms

For case intake forms, reuse `fields.tsx` helpers:

- `FormSection`
- `TextInputField`
- `TextAreaField`
- `SelectField`

Intake field standard:

```tsx
"w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-md text-black shadow-sm outline-none transition focus:border-black/30 focus:ring-2 focus:ring-black/5"
```

Intake textarea shell:

```tsx
"block w-full overflow-hidden rounded-xl border border-black/10 bg-white shadow-sm transition focus-within:border-black/30 focus-within:ring-2 focus-within:ring-black/5"
```

Auth/simple route inputs:

```tsx
"rounded-md px-2 py-2.5 text-sm bg-gray-100 border border-black/15"
```

Modal inputs:

```tsx
"rounded-lg border border-black/15 bg-white/70 px-2 py-2 outline-none transition-colors focus:border-black/40 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
```

Form layout:

- Intake sections use `FormSection` with `flex flex-col gap-6`.
- Intake form groups commonly use `grid gap-x-4 gap-y-3 md:grid-cols-2`.
- Use `md:col-span-2` for full-width important fields.
- `FieldShell` labels use `text-md font-medium text-black`.
- Field descriptions use `text-sm text-black/60`.
- Validation helper text uses `text-xs text-red-600`.
- Textareas auto-size; preserve the existing `TextAreaField` helper instead of writing ad hoc textarea logic.

## Modals

All app modals should render through `AppModal`.

Outer modal standards:

- Backdrop tint: `bg-black/10`.
- Blur transition: `backdrop-blur-xs` while open.
- Container: `top-12 h-max max-h-[calc(100vh-6rem)] max-w-full overflow-hidden text-md relative z-20 border rounded-xl bg-white/90 backdrop-blur-sm border-black/15 shadow-md`.
- Inner scroll area: `max-h-[calc(100vh-6rem)] overflow-x-hidden overflow-y-auto px-4 py-3`.

Modal content standards:

- Widths are explicit: `w-lg` for compact modals, `w-3xl` for subscription-tier workflows.
- Always include `max-w-[calc(100vw-3rem)]`.
- Use `p-1` or `p-2` inside modal content.
- Title row: `mb-4 flex items-start justify-between gap-4`.
- Title: `font-serif text-lg`.
- Subtitle: `mt-0.5 text-gray-600`; use `truncate` when it can contain email or long data.
- Close button: `cursor-pointer rounded-lg p-1.5 transition-colors ... hover:bg-black/15` with `XIcon h-5 w-5`.
- Action row: `mt-4 flex justify-end gap-2`.
- Loading skeletons use `rounded bg-black/10` or `rounded-lg bg-black/10`.

## Popups

Floating popups use `@floating-ui/react` with portal rendering.

Settings popup standard:

- Placement: `right-start`.
- Middleware: `offset(8)`, `flip()`, `shift({ padding: 8 })`.
- Shell: `relative text-sm pr-3 pl-3 pt-8 pb-3 z-50 flex flex-col gap-1.5 rounded-2xl border border-black/15 bg-white/80 shadow-md backdrop-blur-sm`.
- Popup rows: `pr-4 flex text-sm p-2 rounded-lg hover:bg-black/10 cursor-pointer transition-colors ease-in duration-150 hover:ease-out hover:duration-100`.
- Disabled popup rows keep the same geometry but switch to `cursor-not-allowed text-gray-400`.

## Icons

- Use `lucide-react`.
- Standard row icons: `w-4 h-4`.
- Small back/close row icons: `w-3 h-3`.
- Modal close icon: `h-5 w-5`.
- User/settings/menu opener icons: often `w-5 h-5`.
- Form section icon: `w-5 h-5` inside `rounded-lg bg-black/15 p-2.5`.
- Feature preview cards may use larger icons, but keep stroke width around `1.5` where existing auth visuals do.

## Links

- Inline links use `text-blue-600 hover:underline`.
- Links inside menu rows should wrap the row and preserve the row's neutral hover style.

## Feature-Specific Patterns

Dense case workspace (`/case/$id`):

- Record cards use `rounded-xl border border-black/10 bg-white/60 shadow-sm`.
- Summary cards use `rounded-xl border border-black/10 bg-white/55 p-4`.
- Work-panel search inputs use leading lucide icons and compact rounded fields: `rounded-lg border border-black/10 bg-white/65 py-2.5 pl-9 pr-3 text-md`.
- Left-rail search uses `rounded-lg border border-black/15 lg:border-black/10 bg-white/25 lg:bg-black/3 py-2.5 pl-8 pr-2 text-sm`.
- Empty states use `rounded-xl border border-dashed border-black/15 bg-white/40 p-8 text-center text-sm text-black/55`.
- Timeline rows use a black-alpha vertical line, small dot markers, `rounded-lg border border-black/10 bg-white/65 p-3`, and compact metadata chips.
- Proposal/review panels use neutral shells with status-colored actions: green accept, red reject/delete, black-alpha suggest/edit, and blue nested suggestion panels.
- Nested helper panels use `rounded-lg border border-black/10 bg-white/70 p-3`, `bg-white/75`, or `bg-black/[0.025]` for quieter supporting context.
- Record text uses `text-md` for titles/body and `text-sm` for mini descriptions.

Case intake:

- Use `FormSection` headers and shared field helpers.
- Section layout should be `flex flex-col gap-6`.
- Field groups should prefer `grid gap-x-4 gap-y-3 md:grid-cols-2`.
- Multi-row textarea layouts may use `row-span-2 grid-rows-subgrid`.
- The final review screen should stay centered, compact, and neutral with bordered summary tiles.
- Upload dropzone uses `rounded-2xl border-2 border-dashed`, `border-black/30 md:border-black/20`, `hover:border-black/40`, `bg-white/50 md:bg-transparent`, and `hover:bg-gray-300/20`.
- Uploaded file rows use `border border-black/15 rounded-lg p-3`, black-alpha icon disks, and compact remove icon buttons.

Create-case left menu:

- Step rows use `p-2 rounded-lg flex items-center gap-[.7rem] font-serif text-[.8rem]`.
- Active step icon circle uses `bg-black text-white`.
- Completed step icon circle uses `bg-green-600/60 text-black`.
- Step detail line uses `text-gray-700 text-sm`.
- Disabled future steps use `cursor-not-allowed opacity-25`.

Subscription modal:

- Tier grid uses `grid gap-2 md:grid-cols-2`.
- Tier cards use `flex min-h-64 flex-col rounded-lg border p-3 text-left transition-colors`.
- Selected tier uses `border-black/50 bg-black/6`.
- Available tier uses `cursor-pointer border-black/10 bg-white/60 hover:border-black/25 hover:bg-black/3`.
- Current tier uses `cursor-not-allowed border-black/10 bg-gray-100 text-gray-500`.
- Current-tier chips use `rounded-full border border-black/10 bg-white/80 px-2 py-0.5 text-xs text-gray-700`.
- Trial option rows use `rounded-lg border border-black/10 bg-white/70 p-2 text-xs text-gray-700`.

Auth preview cards:

- Cards use `h-52 p-4 border rounded-2xl bg-white/40 backdrop-blur-sm border-black/15 shadow-md`.
- Preview copy uses `text-md font-medium` for card titles and `text-sm text-gray-600` for descriptions.
- Accent badges use `text-[.625rem]`, blue translucent fills, and rounded-full geometry.
- Visual diagrams may use semantic colors for legal concept buckets, but keep them pale and translucent.

## Implementation Checklist

When adding a new frontend feature:

1. Pick the closest existing context: app route, auth route, modal, popup, menu, case workspace, or intake form.
2. Check `styles.css` for the custom type scale before choosing text classes.
3. Reuse the relevant layout wrapper and shared components before creating new shell styles.
4. Use the existing neutral palette: black-alpha borders/fills, white translucent panels, muted gray text.
5. Keep controls compact and aligned to the current density.
6. Prefer lucide icons and the shared `Button` component.
7. Match radius/padding by component type.
8. Add loading, error, disabled, empty, hover, selected, and focus states.
9. Check responsive width constraints, especially modal `max-w-[calc(100vw-3rem)]`, `min-w-0` around truncating text, and left-panel/mobile menu behavior.
10. Run a build or relevant verification command before finishing when code changes are made.

## Anti-Drift Rules

- Do not introduce a new color palette for ordinary product UI.
- Do not assume Tailwind default breakpoints or type sizes.
- Do not use `text-sm` as body text just because it would be body-sized in default Tailwind; in this app `text-sm` is compact secondary text.
- Do not use heavy shadows, saturated backgrounds, or large marketing-style sections inside app workflows.
- Do not create one-off buttons when the shared `Button` supports the action.
- Do not use hard black borders where `border-black/10` or `border-black/15` is enough.
- Do not make app workflow cards visually louder than the translucent shell.
- Do not add decorative gradients or large hero sections to operational screens.
- Do not ignore the existing difference between app panels, auth cards, modals, popup menus, case workspace cards, and intake forms.
- Do not copy disabled/comment-like class fragments such as slash-prefixed leftovers unless you have verified they are intentional and active.
