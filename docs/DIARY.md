# Diary

What was done on each day, newest day first. Built from the commit history;
`TODO.md` holds the reasoning and what is still open.

## 2026

### 2026-10-10

- Docker: one Dockerfile per app (`apps/server`, `apps/web`) using
  `turbo prune`; the web image is nginx serving the page and forwarding `/api`
  and `/socket.io` to the server.
- The web app calls a relative `/api` instead of a baked `VITE_API_URL`; Vite
  proxies the same paths in dev.
- Publishing workflow for Docker Hub (`noted-server`, `noted-web`).
- Fixes found while testing the images: `socket.io` and `pino-pretty` moved to
  runtime dependencies, the server now shuts down on SIGTERM.
- README: two-service compose example, "not available" note removed, section
  on using an existing database (with the Podman `:Z,U` note).
- Network page that shows the server's health, and a real 404 page.
- New favicon and the crying toast asset; shadcn `progress` installed.
- API errors keep their code when they get a readable message.
- `JWT_EXPIRY` defaults to 12 hours and `DB_FILE_NAME` to `noted.db`.
- Silenced pino-http's "request completed" logs.
- Added LICENSE, rewrote the README for end users, removed the NestJS starter
  README.
- Editing a note or the workspace description survives switching to another
  window; it used to be thrown away.
- Moved `TODO.md` and `ERRORS-CORRECTION-API.md` into `docs/`, started this
  diary and moved the dated log entries out of the TODO into it.

### 2026-10-09

- Passphrase gate became the workspace gate: title, tagline, "enter" hint,
  server errors as toasts, clearer button texts.
- Readable API errors on the gate and on logout (unreachable server, timeouts).
- Spread `TODO.md` items into `// TODO` comments next to their code.
- Bumped turbo to 2.11.7 and pnpm to 12.10.1, added turbo's `AGENTS.md`.
- Removed the unused `appLogger`, ignored the local `.mcp.json`.
- CLAUDE.md: better instructions on writing comments.

### 2026-10-08

- Web event handlers follow `handle{Action}` / `toggle{Action}`.
- `constants.ts` loads `.env` through dotenv; prettier dropped for Biome.
- Removed redundant passphrase checks from the controllers, documented
  `PUT /api/workspaces` in Swagger.
- Event files renamed to `*.event.ts`; `TokenResDto` moved to the tokens
  module.
- Docs: cleanup log, found bugs and tidy-ups written into `TODO.md`.

### 2026-10-07

- Toggle for showing or hiding the note buttons (on by default).
- Component styles moved into in-file `<style>` blocks.
- Fixed the Svelte autofixer findings.
- Added CLAUDE.md, trimmed comments, Biome formatting.

### 2026-10-05

- Removed `apps/old` now that the new app covers its features.
- Removed the old turborepo scaffolding packages.

### 2026-10-02

- Redesigned the notes page.
- Added the socket, workspace, categories and notes providers.
- Long notes expand and end on an ellipsis.
- Socket answers carry the result itself (no `{ ok }` envelope); unanswered
  messages time out and refusals are toasted.
- A signed-in visitor is redirected away from the passphrase gate.
- The API URL is read from `VITE_API_URL`.
- Server: a missing session cookie answers 401, jest runs on Node 24.9+,
  dropped the deprecated `baseUrl`.
- Removed the old notes page's leftovers: its components (masonry, drawer,
  dialogs, category form), the module stores, `/new/notes`, `/design`, the
  unused `accordion`, `drawer` and `tabs` UI components and the
  `svelte-bricks` / `vaul-svelte` dependencies.

### 2026-09-29

- Server realtime: domain events emitted from the services, listeners, a
  larger gateway, websocket support in auth.
- Workspace update endpoint.
- Web: shared socket.io client, `createCollection` store helper, notes and
  categories stores moved onto the socket, workspace store wired to the notes
  page.
- Fixed Routify's `goto` during init and added a 404 route.
- Biome formatting on both apps, housekeeping.

### 2026-09-24

- Websocket guard for the gateways, socket.io added to the server.

### 2026-09-23

- Fleshed out the NestJS backend; the frontend split into `apps/old` and a new
  `apps/web` SPA.
- nestjs-pino and nestjs-zod replaced the hand-made logging and validation.
- Routing with Routify 3, Tailwind typography.
- Fixed `/api/workspaces/me` leaking the password hash.

### 2026-09-13

- "Noted Anew": the repository became a turbo monorepo with a server app, the
  SvelteKit app moved under the web app.

### 2026-02-13

- Realtime updates over SSE for notes and categories on every connected
  client.
- The current category is remembered by id.

### 2026-01-26

- Switch for showing completed notes, remembered in local storage.

### 2026-01-24

- New app icon and favicon.
- Error messages show the API's own message.
- Server port environment variable in the vite config, logger at info level.

### 2026-01-17

- Fixed the category endpoint checking labels instead of ids (error 400), and
  descriptions not updating.

### 2026-01-15

- Version 1.1.1.
- Opening a workspace straight from the URL (`/notes/[passphrase]`).

### 2026-01-12

- API requests answer 403 instead of redirecting; fixed the authenticated
  check.
- Fixed deleting a category that still holds notes (error 500).
- The notes GET returns everything when no search parameters are given.
- Cookie renamed to `noted-authentication`.

### 2026-01-11

- Categories got ids, replacing labels as the reference.
- Note ids are generated on the server.
- Merged categories and passworded workspaces.

### 2026-01-10

- Category descriptions, editing categories, the `/[label]` API endpoints.
- Workspace passwords are hashed.
- Accordion, dialog, label and tab components from shadcn-svelte.

### 2026-01-01

- Services and repositories moved into a dedicated server folder; layout SSR
  removed in favour of the central filter in the server hooks.

## 2025

### 2025-12-28

- JWT service and an authentication filter in the server hook.

### 2025-12-27

- Workspaces and categories tables with their repositories, and the note
  migrations for them.

### 2025-12-18

- Fixed the splitting off of completed notes.

### 2025-12-17

- Version 1.1.0: finished notes retrieval and a drawer for archived notes.
- New masonry layout through svelte-bricks.
- Fixed the delete button's text colour in the confirmation dialog.

### 2025-12-15

- User feedback on the passphrase gate; tooltips swapped for popovers.

### 2025-12-09

- UI facelift and better user feedback.

### 2025-12-08

- Database migrations with a migrations table; SQL moved into a repository
  file.
- Pull requests added to the Docker deployment workflow.
- Softer backgrounds.

### 2025-12-07

- Noted published.
- Dark mode, following the system by default.
- Secure cookie.
- GPL v3 license, README updated, compose example moved into the README.
