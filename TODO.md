# SvelteKit → NestJS backend migration

Tracks porting the old SvelteKit server code to the new NestJS app in
`apps/server`.

- `apps/old` — the original SvelteKit app, kept **only as a reference** for
  the conversion. Nothing new gets built there.
- `apps/web` — will be a clean Svelte (not SvelteKit) copy of just the
  frontend, talking to `apps/server` purely over its API.
- `apps/server` — the NestJS backend.

Last verified against a live server + scratch DB on 2026-09-22.

## Done

- **DB schema**: `apps/server/src/drizzle/schema.ts` (+ `relations.ts`) reproduces
  the final `workspaces` / `categories` / `notes` tables from `database.js`
  (the v4 shape after `database_migration.js` ran), managed by drizzle-kit
  migrations.
- **Dependency majors aligned**: `@nestjs/swagger` and `@nestjs/jwt` were
  installed/pinned at `^11` to match `@nestjs/common` `^11`. The `^12` builds
  of both are ESM-only and expect Nest 12: swagger crashed at boot
  (`loadPackageSync` is not exported by Nest 11), and jwt could not be
  `require`d by jest's CommonJS runtime.
- **Configuration — one entry point**: `constants.ts` is the only thing that
  reads `process.env`. It loads `.env` itself (`process.loadEnvFile`, without
  overriding variables already set) and validates required variables.
  `@nestjs/config` has been removed. `JWT_EXPIRY` is in milliseconds, and
  `JWT_CONSTANTS.EXPIRY_SECONDS` is what `@nestjs/jwt` gets, so the cookie and
  the token now both last the same 12h.
- **App wiring**: `AppModule` imports `DrizzleModule`, `WorkspacesModule`,
  `CategoriesModule`, `NotesModule` and `AuthModule` (`TokensModule` via
  `AuthModule`). `AuthController` is registered.
- **Auth**: `POST /api` (login), `DELETE /api` (logout),
  `GET /api/authenticated`. Login rules:
  - workspace exists with a password → the password must match
  - workspace doesn't exist and a password is supplied → the workspace is
    created locked with that (hashed) password, then the user is logged in
  - workspace exists and is open → a supplied password is ignored (locking an
    existing workspace is the job of the future workspace lock-down feature)
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
- **Zod validation**: `ZodValidationPipe` + Zod DTOs for login, notes and
  categories; `PayloadSchema` re-validates decoded JWTs. `UpdateNoteSchema` no
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
- **Logout actually clears the cookie**: it used `res.cookie(…, { expires })`
  on top of the default `maxAge`, which Express lets win, so the "expired"
  cookie lived another 12h. Logout and workspace deletion now use
  `res.clearCookie`.


- **Health check**: `GET /api/health` is public, runs `SELECT 1` through
  `HealthRepository`, and returns `{ status, name, version }` or a 503 when
  the database is unreachable. The `Hello World!` scaffold
  (`AppController`/`AppService`/its spec) is deleted, so `GET /api` is now
  404 — `POST`/`DELETE /api` (login/logout) are unaffected.
- **CORS**: `main.ts` calls `enableCors({ origin: CORS_ORIGINS, credentials: true })`
  when `CORS_ORIGINS` (comma separated, from `constants.ts`) is non-empty, and
  leaves CORS off otherwise, which is what a same-origin or reverse-proxied
  deployment wants. `PORT` moved into `constants.ts` as `APP_PORT` too, so
  `main.ts` no longer reads `process.env` directly.
- **Logging**: Nest's `ConsoleLogger`, with levels chosen by an optional
  `LOG_LEVEL` (`silent | fatal | error | warn | info | debug | verbose`,
  default `info`; an unrecognised value throws at startup). One logger per
  class covering startup/database bring-up, login and rejected logins,
  workspace creation/deletion, note and category writes, and guard rejections.
  No passphrase, password, hash or token is ever logged — a workspace appears
  as `workspaceRef(passphrase)`, a short HMAC under its own subkey. Rules in
  `ERRORS-CORRECTION-API.md` §10; pino is not ported.
- **OpenAPI docs**: `@nestjs/swagger` serves Swagger UI at `/api/docs`
  (JSON at `/api/docs-json`), with `useGlobalPrefix` so it sits under the same
  prefix as the routes. Request bodies are generated from the Zod schemas via
  `ApiZodBody` (`src/openapi/zod-body.decorator.ts`, `z.toJSONSchema` with
  `io: 'input'`), so there are no parallel class DTOs to drift — the schema
  stays the single source of truth.
- **Test suite**: 27 e2e specs (`test/*.e2e-spec.ts`, `pnpm test:e2e`) covering
  health, auth, categories, notes and workspaces against a real app on a
  temporary database — happy paths plus the workspace-isolation and validation
  cases. Plus 4 unit tests (`pnpm test`). jest is wired for the path aliases
  and `constants.ts`'s environment in both configs; each e2e spec file gets its
  own database, and the run's temp directory is removed in `globalTeardown`.
- **`GET /api/authenticated` always answers**: any failure to validate the
  cookie now reports `{ authenticated: false }` instead of falling through to
  an empty 200 for exceptions other than `UnauthorizedException`.

## Missing (not started)

- **Workspace update / lock-down**: the "update description/password"
  endpoint from `routes/api/workspaces/+server.js`, on the existing
  `WorkspacesController`. The only way to add or change a password on a
  workspace that already exists (login only sets one when it creates the
  workspace). Hash it and never echo it back, and **only re-hash when the
  password actually changes** — re-hashing an unchanged password mints a new
  salt, which changes the fingerprint and logs every session out for nothing.
- **Realtime push — Socket.IO gateway** (not to be started yet): replaces the
  deprecated SSE layer (below). Decided:
  - transport is Socket.IO (`@nestjs/platform-socket.io`)
  - every connection is authenticated through the JWT, read from the same
    auth cookie the REST API uses (not a separate token or query param)
  - **kick on password change**: when a workspace's password changes, every
    socket in that workspace's room is disconnected and must reconnect (and
    so re-authenticate)
  - **heartbeat**: a periodic ping that keeps the socket alive behind proxies
    *and* re-validates the connection's token/workspace on each beat. A socket
    whose cookie no longer validates is dropped, so a stale client can't keep
    changing the workspace.

  The heartbeat re-runs `validateToken`, so it inherits the password
  fingerprint check for free. Still to do: join a per-passphrase room, and
  emit `newNote`, `updateNote`, `deleteNote`, `clearAllNotes`, `newCategory`,
  `updateCategory`, `deleteCategory`, `updateWorkspace`. `@nestjs/websockets` /
  `@nestjs/websockets` / `@nestjs/platform-socket.io` are still `^12` while
  the rest of `@nestjs/*` is `^11`; align them before building on them, as was
  needed for `@nestjs/swagger` and `@nestjs/jwt` (see Done).
- **Deeper test coverage**: the suite covers the simple cases. Not covered:
  concurrent writes, the `setWhere` guard at the repository level (only
  reachable by bypassing the controllers), cookie/JWT expiry behaviour, and
  malformed-payload edge cases.

## Security gaps

- **Logout doesn't revoke.** Logging out clears the cookie in that browser
  only; a token copied beforehand keeps working until `JWT_EXPIRY`. Same for
  a stolen cookie — changing the workspace password is the only kill switch
  (it invalidates every older token, see the fingerprint below). Per-device
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

- **Global exception filter**: the two error shapes (`ZodValidationPipe`'s
  `{ message, errors }` and Nest's `{ statusCode, message, error }`) are close
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
