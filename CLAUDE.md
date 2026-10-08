# Project Context

When working on this turbo monorepo codebase prioritize readability and simplicity over cleverness and minifying,  
Prefer existing tools over creation of new things in-house tools

## About this project

Noted is an application for taking post-it notes and sharing with others easily without making accounts

## Key Directories

- `apps/server`: NestJS 12 Backend
- `apps/web`: Vite - Svelte 5 Front-end

## Standards
- Function splitting rule of 3, if a given piece of code appears more than twice, (3 and above) then split it into it's own function
- Avoid huge comment sections, code should be self explaining and have comments made on behavior on short order ("Code does A because B")
- Use relevant skills when available (Such as svelte-code-writer when writing `.svelte` files)

### Server Unique
- All database requests are made by drizzle at the repository level
- Entities are shared between the repos and services
- DTOs are zod schema inferred and run through the validation pipeline
- Custom decorators for bypassing the auth guard and obtaining the passphrase based on request 

### Web Unique
- Things that happen on events should use the `handle{Action}` format unless the event would "toggle" between states then it can be `toggle{Action}`
- All calls via websocket, avoid HTTP requests unless necessary (Authentication and initial entry to the workspace are permitted)
- Prefer in file `<style>...</style>` over separate stylesheet files unless it's a family of styles that are used by multiple components

### Git
- Do not add co-authored by Claude in the messages
- Use a simpler format for the messages; Single lines "Idk why this existed" are acceptable if context is insufficient. Bullet points are used for more "Feature complete" messages like "Added realtime communications: - Added service - Added event emitter to services - Added event listener" 

## Technologies
### Server
- Typescript
- NestJS 12
- Socket.io
- Zod 4
- PinoLogger
- SWC
- OpenAPI (Swagger)
- SQLite via Better-SQLite3
- Drizzle

### Web
- Javascript
- Vite
- Svelte 5
- TailwindCSS
  - Typography
  - Forms
- Routify 3
- shadcn-svelte
- Lucide
- Socket.io
- Axios
- Marked
- DOMPurify

## Architectural Design
### Server
**Levels**: 
- Endpoints. Controllers and gateways  
- Listeners. Listeners and gateway emitter instigators
- Logic. Services
- Data. Repositories
- Core. The `main.ts` and `constants.ts`

**Configuration**: entry point is controlled by `apps/server/src/constants.ts` for both statics and environment based (An exception is the `drizzle.config.ts` as it operates independently of the server app)  
**Realtime**: Uses websockets via the Socket.io tool to emit and listen to events to and from clients. Can emit events based on what has happened on the logic level  
**Database**: Managed by drizzle in the data level  
**Authentication**: Global guard that controls who can access a resource if it's not marked as public regardless of the request type. HTTP & Websocket are supported. This component controls the workspace scope of a given request  
**Validation**: Zod parsed oncoming DTOs with specific shapes, sizes & formats

Server notes:  
All routes use `/api` prefix  
By default JWT tokens live for 12 hours  
Event types reside within their module instead of living in the common `@noted/types` module

### Web
**Routified**: Uses routify 3 for making a multi-page app  
**Utils**: When multiple components use the same code it's better for it to become a util. Most utils can live under utils.js  
**Providers**: Components that have internal states that they provide to child components. These exist for better hierarchy and lifecycle logic  
**Components**: Items that act as building blocks for pages  

Web notes:  
When using shadcn, use the shadcn-svelte skill & CLI (Components living under apps/web/src/lib/components/ui/*)

## Common Commands
```sh
pnpm run build  # Runs the build for both server & web
pnpm run dev    # Runs dev server for both server & web
pnpm run format # Runs biome format (with auto fixes) on both server & web
pnpm run lint   # Runs biome lint (with auto fixes) on both server & web
```

### Server Commands
These run in the `apps/server` directory
```sh
# Database Commands
pnpm run db:push        # Pushes changes to the database without a migration script
pnpm run db:pull        # Pulls the current database schema as a typescript for drizzle
pnpm run db:generate    # Reads the schema and creates a migration SQL script in `apps/server/drizzle/`
pnpm run db:migrate     # Applies migration scripts to the provided database 
pnpm run db:studio      # Do not use, its a web app for better DX
```

The database commands require for you to pass the `DB_FILE_NAME` environment variable for them to work (Default for dev is `DB_FILE_NAME=notes-dev.db`)
Use the following steps for migrations: run `db:generate` -> read the generated migration sql file and make sure it does not drop data, if it does correct it by adding a migratory transaction step -> then run `db:migrate`

## Path aliases
The codebase enjoys the usage of aliases
### Server
`./src/*` -> `@noted/*`  
`./src/constants.ts` -> `@constants`  
`./src/drizzle/index.ts` -> `@schema`
`./src/drizzle/*` -> `@drizzle/*`
`./src/types/index.d.ts` -> `@noted/types`

Notes:  
Aliases may omit `@noted` due to user preference
Prefer `@schema` for repos, relative paths inside the drizzle module
Use shorter aliases (`@constants`, `@schema`) over `@noted/*` if both work

### Web
`./src/lib/*` -> `$lib/*`  

## Environment Variables
Look at the specified paths.
### Server
apps/server/.env.example

### Web
apps/web/.env.example

## Docs
**CLAUDE.md**: This document, extends claude context and ability to interact with the codebase  
**TODO.md**: A "living" document that describes things that had to be done and are done, as well as some architectural decisions  
**README.md**: Living in the project root and the server root, generated by the initial repo build, need to be rewritten  
**ERRORS-CORRECTION-API.md**: A "living" document that describes error procedures relating to the server app

## Testing
Ignore for now till further notice

Do not try out the code via browser, ask the user to try it out and get back to you!

## Notes

Biome has weird interactions with svelte, especially regarding imports and may flag them as unneeded even though they are used in the file  
notes-dev.db is a copy of a production database with actual data   
If a migration involves table modification you'll need to write bridging (data transfer) sql to stop the data-loss from occurring.
Check-types doesn't do anything
