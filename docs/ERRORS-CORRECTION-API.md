# API Error Handling & Data Validation Standards

Standards for how the server app validates input, shapes errors, and moves
data across its boundaries (HTTP → controller → service → repository → DB).
This is a living document — extend it as new endpoints and failure modes show up.

## 1. Validation at the boundary

- Every request body that reaches a controller **must** be typed with a Zod
  DTO class. `nestjs-zod`'s `ZodValidationPipe` is registered globally
  (`APP_PIPE` in `AppModule`) and validates any parameter whose type is a
  Zod DTO, so the handler only has to declare `@Body() dto: FooDto` — and must
  import `FooDto` as a value, not `import type`, or the metadata is lost.
  Never trust a `@Body()` value's TypeScript type alone — types disappear at
  runtime, and the wire payload does not respect them.
- The same pipe covers `@Param`/`@Query` when they're typed with a Zod DTO;
  none are yet, so controllers keep doing explicit `if (!x)` guards for
  required params (as `NotesController` already does for `passphrase`). For
  typed optional query params, prefer Nest's built-in parse pipes (e.g.
  `@Query('complete', new ParseBoolPipe({ optional: true }))`), which reject
  anything but `true`/`false` with a 400.
- A DTO file exports both the schema (`FooSchema`) and its DTO class
  (`class FooDto extends createZodDto(FooSchema) {}`). The class is derived
  from the schema, never hand-written separately — that's the whole point of
  using Zod here, and it's how validation, the TypeScript type and the OpenAPI
  schema stay in sync.
- A body wrapped in a property (e.g. notes' `{ note }`) gets its own wrapper
  schema and DTO (`CreateNoteReqDto`) rather than `@Body('note')`, which
  Swagger can't document.
- Schemas should only describe what the client is actually expected to send.
  Don't let a field exist in a schema "just in case" (see §4) — every field is
  something that will need to be trusted and moved further into the system.

## 2. Error response shape

Two shapes are in play. `nestjs-zod`'s `ZodValidationException` carries the
Zod issues in `errors`, and has no `error` key:

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [{ "code": "too_small", "path": ["label"], "message": "Too small: …" }]
}
```

Everything else is Nest's default for an exception constructed with a string:

```json
{ "statusCode": 404, "message": "Note not found", "error": "Not Found" }
```

`message` is a string in both, in every case this codebase can produce: Nest
only emits an array when an exception is constructed with one (e.g.
`new BadRequestException(['a', 'b'])`), and nothing here does that. Status
codes are consistent and can be relied on.

**Decision (2026-09-22):** keep this as is. The difference is narrow — whether
the envelope repeats the status and carries `errors` — and a client can read
`message` from either. If it becomes a real problem (a second consumer, or
clients branching on prose), revisit with a global filter (`APP_FILTER`)
emitting one envelope, e.g. `{ statusCode, code, message, details? }`, where
the filter maps `ZodValidationException` and alone decides the wire format.
Not planned now.

## 3. Domain types vs. DB row types

Domain types (`src/types/*.ts`, e.g. `Note`) describe what the service and
controller layers work with. DB row types (`typeof table.$inferSelect`) describe
what SQLite actually stores. **These are allowed to differ**, and the
repository is the only layer allowed to convert between them.

Current example: `Note.isCompleted` is `boolean` in the domain type; the
`notes.isCompleted` column is a SQLite integer (`0`/`1`), because SQLite has
no native boolean type. `NotesRepository` converts in both directions
(`toDomain` / `toRow`) so nothing above the repository ever sees a raw `0`/`1`.

**Rule:** if a column's storage representation ever has to diverge from its
natural domain type (integers-as-booleans, JSON-as-text, timestamps-as-strings,
etc.), the conversion lives in the repository, in one place, applied
consistently on every read and every write path (including the
`onConflictDoUpdate().set(...)` branch — historically this codebase had a
read/write conversion mismatch there; watch for that class of bug when adding
new mutable columns).

## 4. Don't let request bodies leak untransformed into writes

Avoid `{ ...dto, someOverride }` spreads when building a repository write.
A DTO can carry fields that don't map 1:1 onto a table row (or that map to a
*different* row than the caller can see), and a spread will silently forward
them into `.values()`/`.set()` even though Drizzle only picks up columns it
recognizes and drops the rest at the type level.

Concretely: `CreateNoteDto` used to include a `category` field that was never
actually used to resolve the note's category — at the time, the real
category came from a `:categoryLabel` route param resolved to a `categoryId`
before the write. (Today the body carries an explicit, optional `categoryId`,
checked against the caller's workspace.) The DTO field was dead weight that happened to get spread into the
insert call. Fixed by (a) removing the field from the schema entirely since
nothing consumed it, and (b) building the repository write with explicit
named fields instead of a spread.

**Rule:** when a service hands data to a repository, construct the write
object with explicit field names, not a spread of the inbound DTO. This
costs one extra line and makes the field-by-field mapping auditable at a
glance — worth it anywhere DTOs and table rows aren't required to be
identical shapes.

## 5. Don't paper over incomplete objects with `as Type`

`auth.service.ts` used to build workspace/token payload objects with
`as Workspace` casts to route around missing required fields (e.g.
constructing a workspace without `description`, or a fake `Workspace` whose
only real field was `passphrase`, just to satisfy `generateToken(workspace: Workspace)`).

A type assertion here doesn't validate anything — it just tells the compiler
to stop checking. If the object is genuinely incomplete, that's either a sign
the object needs the missing field filled in explicitly, or that the function
consuming it is asking for more than it actually needs.

**Fixed by:**
- Supplying the full `Workspace` shape explicitly (`description: null`)
  instead of casting around the gap.
- Narrowing `TokensService.generateToken` to take the `passphrase: string` it
  actually uses, instead of a full `Workspace` that then has to be
  half-fabricated at every call site.

**Rule:** `as SomeType` on an object literal you just built by hand is a sign
the literal or the function signature is wrong — fix one of those, don't
cast the mismatch away. (Casting an *external, already-validated* value, e.g.
narrowing `unknown` after a Zod `safeParse`, is a different and legitimate
use of `as`/generics.)

## 6. Optional-but-conditionally-required fields

`LoginReqDto.password` is `string | null` by design — a workspace is
unlocked by default, and a password is only meaningful when a caller
chooses to lock one down (see workspace/password model below). Any code path
that hashes or compares a password **must** branch on `null` explicitly;
never pass a nullable value straight into `bcrypt.hash`/`bcrypt.compare` and
assume it's a string. `auth.service.ts` previously did exactly that: it
unconditionally called `bcrypt.hash(req.password, 10)` when creating a new
workspace, which would have thrown for the "leave this workspace open"
case, and `bcrypt.compare(req.password, ...)` could receive `null` when
authenticating against a locked workspace. Both are now guarded: login only
creates (and hashes for) a workspace when a password *is* supplied — open
workspaces are persisted lazily when the first note or category enters them —
and `compare` only runs when both sides are non-null.

> Note: `bcrypt` currently ships without type declarations in this project
> (no `@types/bcrypt`), so calls like `bcrypt.hash(req.password, 10)` are
> silently typed `any` and TypeScript will not catch a `string | null`
> mismatch here. Until types are added, treat every `bcrypt.*` call site as a
> manual-review spot for null-safety, not something the compiler will flag.

**Workspace/password model, for reference:** workspaces are just named
containers for notes/categories; they carry no authentication meaning by
default. A password is an opt-in lock-down a workspace can acquire. Code
must never assume a workspace has a password, and must never assume a login
request carries one.

## 7. JWT payload trust

`TokensService.validateToken` re-validates the decoded JWT payload against
`PayloadSchema` after `verifyAsync`, not because the signature check is
insufficient, but as cheap defense-in-depth against payload shape drift
(e.g. a future token format change, or a token minted by older server code)
being misread as a valid `PayloadDTO` purely because a generic type
parameter said so. `verifyAsync<PayloadDTO>(...)` is a compile-time
assertion only — it doesn't check the decoded object's shape at runtime.

## 8. Known gaps / not yet addressed

- No global exception filter — see §2.
- No Zod DTOs for route params or queries — they're still validated ad hoc.
- No request body size limit or rate limiting configured in `main.ts`.
- No upper bound on `text`/`backgroundColor` string length in note schemas.
- No case/whitespace normalization on `passphrase` or category `label`
  before lookups or uniqueness checks — see the "normalisation" note in the
  accompanying review reply for the concrete risk this creates.

## 9. Token binding: the password fingerprint

A JWT is a bearer token — the server has no way to tell a cookie issued
before a password change (or before a workspace was deleted and re-created)
from one issued after, because the passphrase claim is identical in both.
Every token therefore carries a second claim:

```
passwordFingerprint = HMAC-SHA256(PASSWORD_FINGERPRINT_KEY,
                                  `${passphrase}:${workspace.password ?? ''}`)
```

`validateToken` recomputes it from the workspace it already loads and
requires equality (constant-time). The rule is a single comparison, with no
branch on whether the workspace is locked:

| Workspace now | Token issued while | Result |
| --- | --- | --- |
| open (or not persisted) | open | accepted |
| locked, same password | locked | accepted |
| locked, password changed | locked | **401** |
| locked | open | **401** |
| unlocked | locked | **401** |
| deleted, re-created with a password | either | **401** |
| deleted, re-created open | open | accepted (it is an open workspace) |

**Rules this encodes:**

- **The claim is required, never optional.** An open workspace fingerprints
  an empty password rather than omitting the claim. Absence-as-meaning is
  fragile: a missing claim must not be able to take a permissive path. A
  pre-fingerprint token now fails `PayloadSchema` and is rejected, which is
  the correct fail-closed direction (it costs one re-login).
- **Never put the hash (or anything derived from it keylessly) in a token.**
  A JWT payload is base64, not encryption; anyone holding the cookie can read
  it. A keyless digest would let an attacker test candidate hashes offline.
  HMAC under a server-held key is a PRF: without the key the tag can't be
  computed for any candidate, inverted, or linked across servers.
- **Separate keys per purpose.** The fingerprint key derives from its own
  `PWF_SECRET` (never `JWT_SECRET`) via a labelled HMAC
  (`noted:password-fingerprint:v1`). Bumping the label invalidates every
  fingerprint without rotating a secret.
- **Pin the algorithm.** `JwtModule` sets `algorithm`/`algorithms` to HS256
  so a token can't nominate its own (`alg: none` and friends).
- **Only re-hash a password when it actually changes.** bcrypt re-salts on
  every hash, so a gratuitous re-hash changes the fingerprint and logs every
  session out.

**What this does not do:** it can't revoke one device's token, and it doesn't
help against a stolen cookie until the password changes. Both need
server-side session state; see the Security gaps section in `TODO.md`.

## 10. Logging

`nestjs-pino` does all of it: `LoggerModule` in `AppModule` configures
pino-http, and `main.ts` hands Nest that logger (`bufferLogs` +
`app.useLogger`), so Nest's own lifecycle lines go through pino too. There are
no hand-written log lines in services, guards or modules.

- **Every request is logged once on completion** by pino-http: method, URL,
  status and response time, at `info` (`warn`/`error` for 4xx/5xx). That is
  the audit trail; a domain event (login, workspace deleted, …) shows up as
  its request.
- **`LOG_LEVEL` is optional and defaults to `info`.** It's pino's level:
  `silent | fatal | error | warn | info | debug | trace`. pino rejects an
  unrecognised value at startup. The test setup sets `silent`.
- **Output**: JSON lines when `NODE_ENV` is `production` (or `test`),
  `pino-pretty` otherwise.
- **Never log credentials.** The auth cookie is a JWT whose payload carries
  the passphrase, so `req.headers.cookie` and `res.headers["set-cookie"]` are
  redacted. Bodies are never logged. (The old SvelteKit `hooks.server.js`
  logged both the raw token and the decoded payload; that is deliberately not
  ported.) If you add logging, keep passphrases, passwords, hashes, tokens
  and note text out of it.
