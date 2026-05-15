# Frontend Style Parity Agent

Use this agent when adding or reviewing UI in `client-app`. Its job is to keep new screens visually aligned with the existing CaseOS frontend, especially outside `Workspace.tsx`.

## Source Of Truth

Before implementing new UI, inspect nearby route/component patterns first. The strongest current references are:

- App shell: `client-app/src/routes/__root.tsx`
- App layout: `client-app/src/components/layouts/AppLayout.tsx`
- Auth layout: `client-app/src/components/layouts/LoginLayout.tsx`
- Left rail: `client-app/src/components/layouts/LeftPanelLayout.tsx`
- Main work panel: `client-app/src/components/layouts/WorkPanelLayout.tsx`
- Buttons: `client-app/src/components/Button.tsx`
- Modals: `client-app/src/components/AppModal.tsx`
- Popup menus: `client-app/src/components/popups/SettingsPopup.tsx`
- Case intake forms: `client-app/src/components/features/case-intake/fields.tsx`

Do not use `Workspace.tsx` as a style reference for this agent unless the task specifically asks for workspace-internal UI.

## Overall Visual Language

CaseOS uses a quiet, legal-work dashboard style:

- Light mode only today: root uses `bg-gray-100`, `font-geist`, `text-black`, `text-sm`.
- App/auth pages sit over the same top image treatment: full-width fixed image, object-top, masked/faded downward.
- Main surfaces are translucent glass panels: `bg-white/40`, `backdrop-blur-sm`, `border border-black/15`, `shadow-md`, usually `rounded-2xl`.
- Controls are compact, text-first, and dense: `text-xs` and `text-sm` are common; large typography is reserved for auth headings and the CaseOS logo.
- The dominant neutral system is black alpha, not hard grays: prefer `border-black/10`, `border-black/15`, `bg-black/10`, `hover:bg-black/10`, `text-black/60`.
- Blue appears mostly as a link/accent/status color, not as the main chrome.

## Layout Standards

For authenticated app routes:

- Wrap pages in `AppLayout`.
- Use `LeftPanelLayout` for the fixed-width left rail: `w-64 min-w-64`, `gap-4`, sticky scrollable menu panel.
- Use `WorkPanelLayout` for the main panel: `flex-1 min-w-0`, `px-4 py-4`, `rounded-2xl bg-white/40 backdrop-blur-sm border border-black/15 shadow-md`.
- Keep the main app content max-width aligned with `AppLayout`: `max-w-4xl`, `px-8`, `pt-16`, `pb-16`, `gap-6`.
- Loading states use full viewport centering: `w-full h-dvh flex justify-center items-center`.

For auth routes:

- Wrap pages in `LoginLayout`.
- Auth form cards use `w-84` and `flex flex-col px-5 pt-8 pb-5 rounded-2xl bg-white/40 backdrop-blur-sm border border-black/15 shadow-md`.
- Auth headings use `text-[1.7rem] font-bold`.
- Auth helper copy uses `mt-0.5 text-sm text-gray-600`.

## Typography

- Root font is `font-geist`.
- CaseOS logo uses `font-bj-cree`.
- Left rail subtitles may use `font-inconsolata`.
- Some modal and menu labels intentionally use `font-serif`; preserve this where modals, tier cards, and create-case steps already do.
- Standard UI text sizes:
  - Main body: `text-sm`
  - Menus, panels, form helpers: `text-xs`
  - Tiny metadata/badges: `text-[11px]`, `text-[10px]`, or `text-[.625rem]`
  - Form section title: `text-[1.1rem] font-semibold`
  - Modal title: `font-serif text-base`

## Color And Border Standards

Prefer these reusable ingredients:

- Default border: `border border-black/15`
- Softer nested border: `border border-black/10`
- Default hover fill: `hover:bg-black/10`
- Icon button hover fill: `hover:bg-black/15`
- Selected menu item: `bg-black/10`
- Muted text: `text-gray-600`, `text-gray-500`, `text-black/60`, `text-black/65`
- Disabled text: `text-gray-400`
- Subtle nested panel: `bg-black/[0.03]`
- Input backgrounds:
  - Auth/simple route forms: `bg-gray-100`
  - Modals: `bg-white/70`
  - Intake fields: `bg-white`

Status colors:

- Success alerts: `border-green-200 bg-green-50 text-green-800`
- Error alerts: `border-red-200 bg-red-50 text-red-800` or `text-red-700`
- Warning alerts: `border-amber-200 bg-amber-50 text-amber-800`
- Info alerts: `border-blue-200 bg-blue-50 text-blue-800`

## Spacing And Radius

- Outer app gaps: `gap-6`.
- Left rail/menu gaps: `gap-4` for groups, `gap-1` or `gap-2` for menu stacks.
- Card/panel padding:
  - App work panel: `px-4 py-4`
  - Auth cards: `px-5 pt-8 pb-5`
  - Login preview cards: `p-4`
  - Modal content wrapper: `px-4 py-3`
  - Modal body inner wrapper: `p-1` or `p-2`
  - Menu items: `p-2`
  - Icon buttons: `p-1.5`
- Radius:
  - Major panels/auth cards/popups/upload dropzone: `rounded-2xl`
  - Modals and most interactive rows/cards: `rounded-xl` or `rounded-lg`
  - Inputs on auth screens: `rounded-md`
  - Buttons: `rounded`
  - Avatars/badges: `rounded-full`

## Buttons And Interactive Rows

Use `client-app/src/components/Button.tsx` for primary and secondary actions.

Button standards:

- Primary: `bg-[#282828] text-white`, hover to black.
- Secondary: `bg-black/10 text-black/75 border-black/10 shadow-sm`, hover to `bg-gray-300 text-black`.
- Disabled: `bg-gray-300 !text-gray-400 cursor-not-allowed`.
- Icons come from the shared `Button` icon prop when available.
- Use the rainbow button only for special generation/AI confirmation moments, such as generating a workspace.

Interactive row standards:

- Menus use `text-xs p-2 rounded-lg`.
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

Intake field class standard:

```tsx
"w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm text-black shadow-sm outline-none transition focus:border-black/30 focus:ring-2 focus:ring-black/5"
```

Auth/simple route inputs:

```tsx
"rounded-md px-2 py-2.5 text-xs bg-gray-100 border border-black/15"
```

Modal inputs:

```tsx
"rounded-lg border border-black/15 bg-white/70 px-2 py-2 outline-none transition-colors focus:border-black/40 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
```

Form layout:

- Prefer `grid gap-4 md:grid-cols-2` for two-column form sections.
- Use `md:col-span-2` for full-width important fields.
- Labels are usually `text-sm font-medium`; descriptions are `text-xs text-black/60`.
- Validation helper text uses `text-[11px] text-red-600`.

## Modals

All app modals should render through `AppModal`.

Outer modal standards:

- Backdrop tint: `bg-black/10`.
- Blur transition: `backdrop-blur-xs` while open.
- Container: `top-12 max-h-[calc(100vh-6rem)] border rounded-xl bg-white/90 backdrop-blur-sm border-black/15 shadow-md`.
- Inner scroll area: `max-h-[calc(100vh-6rem)] overflow-x-hidden overflow-y-auto px-4 py-3`.

Modal content standards:

- Widths are explicit: `w-lg` for compact modals, `w-3xl` for subscription-tier workflows.
- Always include `max-w-[calc(100vw-3rem)]`.
- Use `p-1` or `p-2` inside modal content.
- Title row: `mb-4 flex items-start justify-between gap-4`.
- Title: `font-serif text-base`.
- Subtitle: `mt-0.5 text-gray-600`.
- Close button: `rounded-lg p-1.5 hover:bg-black/15` with `XIcon h-5 w-5`.
- Action row: `mt-4 flex justify-end gap-2`.
- Loading skeletons use `rounded bg-black/10`.

## Popups

Floating popups use `@floating-ui/react` with portal rendering.

Settings popup standard:

- Placement: `right-start`.
- Middleware: `offset(8)`, `flip()`, `shift({ padding: 8 })`.
- Shell: `relative text-xs pl-3 pr-4 pt-4 pb-3 z-50 flex flex-col gap-1.5 rounded-2xl border border-black/15 bg-white/80 shadow-md backdrop-blur-sm`.
- Popup rows: `pr-4 mr-3 flex text-xs p-2 rounded-lg hover:bg-black/10 cursor-pointer transition-colors ease-in duration-150 hover:ease-out hover:duration-100`.

## Icons

- Use `lucide-react`.
- Standard row icons: `w-4 h-4`.
- Small back/close row icons: `w-3 h-3`.
- Modal close icon: `h-5 w-5`.
- Form section icon: `w-5 h-5` inside `rounded-lg bg-black/15 p-2.5`.
- Feature preview cards may use larger icons, but keep stroke width around `1.5` where existing marketing/auth visuals do.

## Links

- Inline links use `text-blue-600 hover:underline`.
- Links inside menu rows should wrap the row and preserve the row’s neutral hover style.

## Feature-Specific Patterns

Case intake:

- Use `FormSection` headers and shared field helpers.
- Section layout should be `flex flex-col gap-6`.
- The final review screen uses centered content, black alpha icon disk, and compact bordered summary tiles.
- Upload dropzone uses `rounded-2xl border-2 border-dashed`, `border-black/15`, `hover:border-black/40`, `hover:bg-gray-300/20`.

Create-case left menu:

- Step rows use `p-2 rounded-lg flex items-center gap-[.7rem] font-serif text-[.8rem]`.
- Active step icon circle uses `bg-black text-white`.
- Completed step icon circle uses `bg-green-600/60 text-black`.
- Step detail line uses `text-gray-700 text-xs`.

Subscription modal:

- Tier cards use `rounded-lg border p-3 text-left transition-colors`.
- Selected tier uses `border-black/50 bg-black/[0.06]`.
- Available tier uses `border-black/10 bg-white/60 hover:border-black/25 hover:bg-black/[0.03]`.
- Current tier uses `cursor-not-allowed border-black/10 bg-gray-100 text-gray-500`.
- Summary chips use `rounded-full border border-black/10 bg-white/80 px-3 py-1 text-[11px] text-gray-700`.

## Implementation Checklist

When adding a new frontend feature:

1. Pick the closest existing context: app route, auth route, modal, popup, menu, or intake form.
2. Reuse the relevant layout wrapper and shared components before creating new shell styles.
3. Use the existing neutral palette: black alpha borders/fills, white translucent panels, muted gray text.
4. Keep controls compact and aligned to the current density.
5. Prefer lucide icons and the shared `Button` component.
6. Match radius/padding by component type.
7. Add loading, error, disabled, empty, and hover/selected states.
8. Check responsive width constraints, especially modal `max-w-[calc(100vw-3rem)]` and `min-w-0` around truncating text.
9. Run a build or relevant verification command before finishing when code changes are made.

## Anti-Drift Rules

- Do not introduce a new color palette for ordinary product UI.
- Do not use heavy shadows, saturated backgrounds, or large marketing-style sections inside app workflows.
- Do not create one-off buttons when the shared `Button` supports the action.
- Do not use hard black borders where `border-black/10` or `border-black/15` is enough.
- Do not make app workflow cards visually louder than the translucent shell.
- Do not add decorative gradients or large hero sections to operational screens.
- Do not ignore the existing difference between app panels, auth cards, modals, popup menus, and intake forms.
