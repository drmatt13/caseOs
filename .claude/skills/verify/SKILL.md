---
name: verify
description: Drive the client-app headlessly to verify frontend changes at runtime (no backend, no login) — launch recipe, auth/GraphQL mocks, and gotchas.
---

# Verifying client-app changes at runtime

Recipe for observing frontend changes in the real running app without Docker,
a backend, or a Cognito login. Proven for layout/sizing checks; reusable for
any authed-route UI verification.

## Launch

```powershell
npm --workspace client-app run dev   # Vite; picks 3001 if 3000 is busy
```

**Gotcha — two servers on one port:** Vite binds IPv4 (`--host 0.0.0.0`); other
local dev tools (websocket test client) may sit on IPv6 `::1` at the same port,
and `localhost` resolves to IPv6 first. **Always use `http://127.0.0.1:<port>`**,
never `localhost`. A plain-text "Not Found" page or a "Connect / Send Payload /
Messages" UI means you hit the wrong server.

Deep links work on the Vite server directly (SPA fallback serves index.html).

## Drive (headless Edge via puppeteer-core)

No browser automation is installed in the repo. In a scratch dir:
`npm i puppeteer-core`, then launch with
`executablePath: "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe"`.

## Reaching authed routes without a backend

`requireAuth` needs: (1) localStorage `has-session` = `"1"` (seed via
`page.evaluateOnNewDocument`), and (2) a 200 from `GET <api>/verify-session`.
Mock the API with `page.setRequestInterception(true)`:

- The app fetches with credentials, so **wildcard CORS is rejected**. Mock
  responses need `access-control-allow-origin: http://127.0.0.1:<port>` (exact
  origin) plus `access-control-allow-credentials: true` and explicit
  allow-headers/methods.
- Respond to GraphQL POSTs by sniffing `req.postData()` for the operation name:
  `GetCurrentUser` → `{ data: { currentUser: { idToken, user: {...} } } }`,
  `GetWorkspace` → `{ data: { workspace: { id, name, currentUserMembership:
  { id, role: "OWNER", membershipStatus: "ACTIVE" }, memberships, invitations } } }`.
  Anything else → `{ "data": {} }`.
- Any caseId renders the Faxon demo (`getCaseDemo` falls back), so
  `/workspaces/demo/cases/anything` gives a fully populated case workspace.

## Waiting

Vite's HMR websocket defeats `networkidle0`. Use `waitUntil: "domcontentloaded"`
then `page.waitForFunction` for an app-shell marker (e.g. a div whose className
includes `lg:w-5xl`), then a short settle sleep.

## Flows worth driving

- Root font-size tiers: check `getComputedStyle(document.documentElement).fontSize`
  at viewport widths 1512 / 1600 / 1920 / 2400 / 2560 (expect 21 / 19 / 19 / 17 / 17 px).
- Nav panel scroll-follow: scroll the case route, give the max-height chase
  ~1.5s to settle; at full scroll the panel bottom must sit flush (gap 0) with
  the ContentShell bottom (`min-w-0 flex-1 flex justify-center` div). For the
  px↔rem conversion, a 60px scroll must grow the panel exactly 60px at every
  root size (sub-cap region is < ~5.3rem of scroll).
