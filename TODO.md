# SvelteKit → NestJS backend migration

Tracks porting the original SvelteKit app to the new NestJS app in
`apps/server`. The original app has since been removed, so SvelteKit file
names below are historical.

- `apps/web` — a clean Svelte (not SvelteKit) frontend, talking to
  `apps/server` over its API.
- `apps/server` — the NestJS backend.

Last verified against a live server + scratch DB on 2026-09-22.

## Done

- **DB schema**: `apps/server/src/drizzle/schema.ts` (+ `relations.ts`) reproduces
  the final `workspaces` / `categories` / `notes` tables from `database.js`
  (the v4 shape after `database_migration.js` ran), managed by drizzle-kit
  migrations.
- **Dependency majors aligned**: every `@nestjs/*` package (including
  `swagger`, `jwt`, `websockets` and `platform-socket.io`) is on `^12`. Mixing
  majors broke before: the `^12` swagger crashed at boot on Nest 11
  (`loadPackageSync` is not exported there), so keep them moving together.
- **Configuration — one entry point**: `constants.ts` is the only thing that
  reads `process.env`. It loads `.env` itself (`process.loadEnvFile`, without
  overriding variables already set) and validates required variables.
  `@nestjs/config` has been removed. `JWT_EXPIRY` is in milliseconds, and
  `JWT_CONSTANTS.EXPIRY_SECONDS` is what `@nestjs/jwt` gets, so the cookie and
  the token now both last the same 12h.
- **App wiring**: `AppModule` imports `DrizzleModule`, `WorkspacesModule`,
  `CategoriesModule`, `NotesModule` and `AuthModule` (`TokensModule` via
  `AuthModule`). `AuthController` is registered.
- **Auth**: `POST /api/login`, `DELETE /api/logout`,
  `GET /api/authenticated`. Login rules:
  - workspace exists with a password → the password must match
  - workspace doesn't exist and a password is supplied → the workspace is
    created locked with that (hashed) password, then the user is logged in
  - workspace exists and is open → a supplied password is ignored (locking an
    existing workspace goes through the workspace update, see below)
  - otherwise → a token is issued and nothing is persisted (the workspace is
    created lazily, see below)

  The cookie carries the raw JWT (it previously carried a serialised
  `{ token }` object).
- **Session resolution — `AuthGuard` only**: the global `APP_GUARD` is the
  single place a request's workspace is resolved (there are no SvelteKit hooks
  in the new frontend). `@Public()` opts out, and `@Passphrase()` reads the
  resolved workspace. A missing or invalid cookie is always a 401. A token for a workspace that isn't persisted yet
  resolves to an open, in-memory workspace.
- **Lazy workspace creation**: an open workspace's row is created
  (`WorkspacesService.ensureExists`) when the first note or category enters it.
  Categories are included because of the foreign key.
- **Workspace scoping on writes**: note and category upserts carry
  `setWhere: passphrase = <authenticated workspace>`, so an existing row from
  another workspace is never updated, even if a caller skipped the
  controller's ownership check. Controllers also 404 on ids outside the
  caller's workspace.
- **Token binding — password fingerprint**: every token carries
  `passwordFingerprint = HMAC(PASSWORD_FINGERPRINT_KEY, "<passphrase>:<password hash or ''>")`,
  and `TokensService.validateToken` requires it to equal the workspace's
  current fingerprint. Changing, adding or removing a password, or deleting
  and re-creating a workspace with one, invalidates every older token (bcrypt
  re-salts, so the same password yields a new hash). Open workspaces
  fingerprint an empty password, so the claim is always present and required —
  there's no "absent claim" path to fall into. The key comes from its own
  `PWF_SECRET`, separate from `JWT_SECRET`, with a version label so
  fingerprints can be invalidated without rotating either secret. The hash
  never leaves the server: HMAC makes the tag meaningless without the key, so
  it can't be tested against candidate hashes. Token algorithm is pinned to
  HS256. See `ERRORS-CORRECTION-API.md` §9.
- **Zod validation**: `nestjs-zod` — a global `ZodValidationPipe` plus
  `createZodDto` DTOs for login, notes, categories and workspaces; `PayloadSchema` re-validates decoded JWTs. `UpdateNoteSchema` no
  longer accepts `passphrase`, since the workspace always comes from
  authentication. Standards live in `apps/server/ERRORS-CORRECTION-API.md`.
- **Categories (full CRUD)**: `GET`/`POST /api/categories`,
  `PUT`/`DELETE /api/categories/:id`. Lookups are workspace-scoped, labels are
  trimmed and lowercased, and a label may only exist once per workspace.
  There are no reserved labels: built-in views like "to-dos"/"completed" are a
  frontend concern (backed by `?complete=`), and the frontend is free to name
  them however it likes.
- **Notes (full CRUD)**:
  - `GET /api/notes`: the workspace's notes
  - `GET /api/notes/category/:label`: notes in one category
  - Both GETs take optional `?complete=true|false` to narrow to
    complete/incomplete notes; omitted returns all notes regardless of
    completion (by design: the flag keeps behaviour predictable). This replaces the old
    `to-dos`/`completed` pseudo-categories, whose names no longer matter to
    the server.
  - `GET /api/notes/:id`: one note (404 outside the workspace)
  - `POST /api/notes`: create. `categoryId` is optional in the note body;
    missing or `null` means uncategorised. The old
    `POST /api/notes/:categoryLabel` is gone.
  - `PUT /api/notes/:id`: update. Persists `text`.
  - Create and update both reject a `categoryId` from another workspace.
  - `DELETE /api/notes/:id`: delete one note (404 if not in the workspace).
  - `DELETE /api/notes`: deletes all of the workspace's notes. Categories and
    the workspace row are left alone.
- **Workspaces (delete)**: `DELETE /api/workspaces` deletes the workspace
  entry entirely — notes, categories and the row, in one transaction — and
  clears the caller's auth cookie. A locked workspace must confirm with
  `{ "password": "…" }` in the body (401 otherwise). An open one needs no body,
  and a workspace that was never persisted is a no-op 204.
- **Workspace update**: `PUT /api/workspaces` and the `update.workspace`
  socket event replace the description and password. The password is hashed,
  never echoed back, and only re-hashed when it actually changes (a new salt
  would change the fingerprint and log every session out).
- **Realtime — Socket.IO gateway** (`apps/server/src/realtime`): replaces the
  deprecated SSE layer, on the `/api/workspace` namespace.
  - Every message goes through `AuthGuard` (`AuthWsGuard` for ws), which reads
    the JWT from the handshake's auth cookie, so it inherits the password
    fingerprint check: a socket whose cookie no longer validates can't change
    the workspace.
  - `join.workspace` puts the socket in a per-passphrase room. The client
    re-joins on every reconnect.
  - Note, category and workspace CRUD run over the socket (`add.note`,
    `update.note`, `delete.note`, `clear.notes`, `list.notes`,
    `list.categories`, `add/update/delete.category`, `update.workspace`). The
    acknowledgement is the answer itself: the data asked for, or `true` for
    a change with nothing to send back. Nest never acknowledges a `null` or
    `undefined` return, so every awaited handler must return something.
  - Domain events from the services are pushed to the room: `note.created`,
    `note.updated`, `note.deleted`, `notes.cleared`, `category.created`,
    `category.updated`, `category.deleted`, `workspace.updated` (plus
    `auth.refresh`) and `workspace.destroyed`, after which the room's sockets
    are disconnected.
- **Rejected socket messages**: every refusal (a missing id, a note or
  category that isn't found, a refused guard, a server error) is thrown as a
  `WsException` and reaches the client as an `exception` event, never as an
  acknowledgement. There is no `{ ok: false }` answer. The socket provider
  toasts the event's message, and the client's `ackTimeout` (5s) rejects the
  unanswered `emitWithAck` into the caller's `catch`, which stays quiet since
  the reason was already shown. Its only job is to skip the success toast.
- **Logout actually clears the cookie**: it used `res.cookie(…, { expires })`
  on top of the default `maxAge`, which Express lets win, so the "expired"
  cookie lived another 12h. Logout and workspace deletion now use
  `res.clearCookie`.
- **Health check**: `GET /api/health` is public, runs `SELECT 1` through
  `HealthRepository`, and returns `{ status, name, version }` or a 503 when
  the database is unreachable. The `Hello World!` scaffold
  (`AppController`/`AppService`/its spec) is deleted, so `GET /api` is
  404.
- **CORS**: `main.ts` calls `enableCors({ origin: CORS_ORIGINS, credentials: true })`
  when `CORS_ORIGINS` (comma separated, from `constants.ts`) is non-empty, and
  leaves CORS off otherwise, which is what a same-origin or reverse-proxied
  deployment wants. `PORT` moved into `constants.ts` as `APP_PORT` too, so
  `main.ts` no longer reads `process.env` directly.
- **Logging**: `nestjs-pino`, one log line per request via pino-http, level
  from an optional `LOG_LEVEL` (pino's names, default `info`). The auth
  cookie is redacted, since its JWT carries the passphrase. Rules in
  `ERRORS-CORRECTION-API.md` §10.
- **OpenAPI docs**: `@nestjs/swagger` serves Swagger UI at `/api/docs`
  (JSON at `/api/docs-json`), with `useGlobalPrefix` so it sits under the same
  prefix as the routes. Schemas come from the `nestjs-zod` DTOs (the document
  goes through `cleanupOpenApiDoc`; login's response uses `@ZodResponse`), so
  there are no parallel class DTOs to drift — the schema stays the single
  source of truth.
- **Test suite**: 27 e2e specs (`test/*.e2e-spec.ts`, `pnpm test:e2e`) covering
  health, auth, categories, notes and workspaces against a real app on a
  temporary database — happy paths plus the workspace-isolation and validation
  cases. Plus 4 unit tests (`pnpm test`). jest is wired for the path aliases
  and `constants.ts`'s environment in both configs; each e2e spec file gets its
  own database, and the run's temp directory is removed in `globalTeardown`.
- **`GET /api/authenticated` always answers**: any failure to validate the
  cookie now reports `{ authenticated: false }` instead of falling through to
  an empty 200 for exceptions other than `UnauthorizedException`.

## Missing

- **Realtime — what's left of the plan**:
  - **kick on password change**: a workspace update only emits `auth.refresh`;
    clients log in again and reconnect themselves. Stale sockets are refused
    message by message (see Done), but they stay connected and keep receiving
    the room's events. Disconnecting the room on a password change is still to
    do.
  - **heartbeat**: no periodic re-validation yet. The connection itself isn't
    authenticated either, only the messages it sends.
- **Deeper test coverage**: the suite covers the simple cases. Nothing tests
  the realtime gateway yet. Also not covered:
  concurrent writes, the `setWhere` guard at the repository level (only
  reachable by bypassing the controllers), cookie/JWT expiry behaviour, and
  malformed-payload edge cases.

## Security gaps

- **Logout doesn't revoke.** Logging out clears the cookie in that browser
  only; a token copied beforehand keeps working until `JWT_EXPIRY`. Same for
  a stolen cookie — changing the workspace password is the only kill switch
  (it invalidates every older token, see the fingerprint above). Per-device
  logout would need server-side sessions or a revocation table; not planned.

## Planned

- **Request size limits / rate limiting**: look into a body size limit in
  `main.ts` and a throttler (e.g. `@nestjs/throttler`), especially on login.
- **Note text length limits**: `CreateNoteSchema` / `UpdateNoteSchema` put no
  upper bound on `text` (or `backgroundColor`). Pick limits and enforce them
  in the schemas.
- **Passphrase normalisation**: `passphrase` is used verbatim for lookups,
  tokens and workspace creation, so `Work`, `work` and `work ` are three
  workspaces. Decide on a normalisation (trim? case-fold?) and apply it once
  at the login boundary (`LoginReqSchema`), keeping in mind existing data.

## Not porting (decided)

- **Global exception filter**: the two error shapes (`nestjs-zod`'s
  `{ statusCode, message, errors }` and Nest's `{ statusCode, message, error }`) are close
  enough — `message` is always a string and status codes are consistent.
  Revisit only if it actually bites. See `ERRORS-CORRECTION-API.md` §2.
- **Data migrations / seeding** (`database_migration.js`,
  `database_data_factory.js`, `notes_test_data.js`): older instances are
  invalidated regardless, so there's no data to carry forward.

## Left as is

- **`drizzle.config.ts` reads `process.env` directly**: drizzle-kit runs as
  its own process and can't import `@constants` (no tsconfig path aliases), so
  `pnpm db:*` gets `DB_FILE_NAME` from the calling shell. This is the one
  intentional exception to "constants is the only entry point".

## Deprecated — do not port

- **SSE** (`routes/api/sse/+server.js`, `lib/server/clientList.js`,
  `sveltekit-sse`, the frontend's `sse-handler.svelte`): superseded by
  WebSockets. Don't build a NestJS SSE equivalent.
- **Anonymous `session-id` cookie** (`hooks.server.js`): existed only to key
  SSE clients per tab.
- **Passphrase-only cookie** (`routes/api/passphrase/+server.js`): the JWT
  cookie already carries the passphrase.
- **SvelteKit server half** (`hooks.server.js`, `+page.server.js`, the
  `routes/api/*` handlers): `apps/web` is a pure API client, and session
  resolution is exclusively `AuthGuard`'s job.

## Frontend — providers

`apps/web` moves from module-level stores to provider components in
`src/lib/providers/`: a component that owns one thing for the subtree under
it, from mount to destroy, and hands it down through `createContext`.

### The contract

Every provider provides three things, all reachable through its getter
(`getSocket()`, `getWorkspace()`, `getCategories()`, `getNotes()`):

- **The state**: what it's for (the connection, the workspace, the
  categories, the notes), live, kept up to date by its socket listeners.
- **The loading state**: whether that state is still arriving, so the UI can
  show it was asked for and not yet there.
- **The errored state**: what went wrong, if loading (or staying connected)
  failed, so the UI can say so instead of showing an empty list.

The three are part of what's provided, not only something the provider shows
on its own while it gates its children. A consumer decides what to render for
each. Listeners are added when the provider is created and removed when it's
destroyed. Changes go through plain `emitWithAck` calls whose answer is the result
itself; a refusal is never answered, so the `ackTimeout` rejects it into the
caller's `catch` (no request helper wrapped around socket.io).

### Where each provider stands

All four are built and meet the contract. `/notes` nests them socket →
workspace → categories → notes, and `notes-page.svelte` decides what to show:
the first error of the four, otherwise the first still loading.

- **Socket** (`socket.svelte.js`): `client` (the socket.io connection),
  `loading` until the first connect, `error` once the server refuses it
  (dropped connections retry on their own). Joins the workspace room on every
  connect and handles `auth.refresh`.
- **Workspace** (`workspace.svelte.js`): `current`, `loading`, `error`. Its one
  REST call, `GET /api/workspaces/me`, is allowed. The provider sends 401/403
  back to `/`.
- **Categories** (`categories.svelte.js`): `list`, `loading`, `error`. Loads
  with `list.categories` on every connect, so a reconnect catches up. Also
  owns the open folder (`selectedId`, `activeId`, `select()`), remembered in
  localStorage and forgotten on "Leave workspace".
- **Notes** (`notes.svelte.js`): `list`, `loading`, `error`. Loads every note
  with `list.notes` on every connect, never over REST; the page filters by
  folder and "Show completed". A deleted category's notes fall back to "All".

## Cleanup (2026-10-02)

The redesign replaced the old page: `/notes` is the new notes page, and the
old page, its components (masonry, drawer, dialogs, category form), the
module stores, `$lib/utils/socket.js`, `/new/notes`, `/design` and the
`new-theme` scoping are gone. The theme lives in `app.css`, fonts and shared
styles load from `main.js`, and the components sit in `src/lib/components`
with their CSS in `components/styles/`. The unused `accordion`, `drawer` and
`tabs` UI components and the `svelte-bricks` / `vaul-svelte` dependencies were
removed. The API URL comes from `VITE_API_URL` (`apps/web/.env`, see
`.env.example`).

## Ideas

- **Buttonless notes**: a setting that drops the note's toolbar and footer
  buttons (done, edit, delete, details), leaving the right-click menu and
  keybinds as the only way to act on a note. A toggle at the top right, next
  to the light/dark switch. Worth it beyond looks: a Firefox profile
  (2026-10-02) put the 4 shadcn `Button`s per note at about half the cost of
  building a note. Depends on the keybinds (Gmail-style, already decided) and
  on a way to pick a note from the keyboard.

## Passphrase gate (after the notes page is complete)

- Upgrade it to the new design.

## Pages to build

- **404 page**: `[...fallback].svelte` catches unknown routes; give it a real
  page in the new design.
- **Network error page**: for when the server can't be reached. Timed-out
  socket messages aren't toasted (only the server's `exception` events are),
  so a dropped connection currently fails silently.

## Technological Advancements

Where the new notes page improves on the existing one.

- **Categories scale**: the old tabs overflowed and broke with many
  categories. The new folder tabs fit the space they have and the rest go
  under a More ▾ dropdown.
- **One "All" folder**: the old "to-dos" and "completed" pseudo-categories are
  replaced by an "All" folder and a single "Show completed" switch.
- **Markdown notes**: notes render markdown (headings, lists, quotes, code)
  through `marked`, sanitised by DOMPurify since notes are shared with the
  whole workspace. The old notes were plain text.
- **In-place editing**: notes and the workspace description are edited where
  they stand instead of being swapped for a text box. Only Enter saves, Esc or
  clicking away cancel, and the "Enter to save / Esc to cancel" hints are
  clickable.
- **Expanding notes**: a note too long for its square shows an arrow, and
  clicking the note (or the arrow) expands it. It floats over the notes below
  instead of stretching its row, so one long note doesn't make a whole row
  tall, and any number can be open at once. Collapsed, a long note ends on
  its last whole line with an ellipsis instead of fading out.
- **Moving notes**: a note can be moved to another category (context menu →
  Move to). The old app had no way to change a note's category after creating
  it.
- **Recolouring notes**: a note's colour can be changed (context menu →
  Colour). It used to be random and fixed forever.
- **Keyboard-first dialogs**: confirm dialogs open on their action, which gets
  a visible ring, so Enter confirms and Esc backs out, with "Enter to delete ·
  Esc to cancel" hints in every dialog footer. The old dialogs ran their
  action on any Enter, even with Cancel focused.
- **Honest confirmations**: the "Saved note" style toasts only show once the
  server has acknowledged the change, and failures reach the error toast.
- **Context menus**: right-click menus on category tabs, the More list and
  notes.
- **Renaming categories**: labels can be edited, not only descriptions, and
  the category dialog checks for empty or duplicate labels as you type. The
  server's duplicate error never reached the old UI.
- **One design system**: a single theme (Marine on slate, porcelain/graphite
  backgrounds), fonts (Noto Sans, Comic Neue for notes), one red, one radius,
  and shadcn components throughout, where the old app mixed reds, radii and
  hand-made buttons.
- **Tidier code**: the new components keep their styling in per-component CSS
  files instead of long utility strings in the markup.
