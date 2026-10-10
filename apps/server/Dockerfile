# Built from the repository root:
#   docker build -f apps/server/Dockerfile -t noted-server .

FROM node:24-alpine AS base
RUN corepack enable

# Cuts the monorepo down to what the server needs
FROM base AS prune
WORKDIR /repo
COPY . .
RUN pnpm dlx turbo@^2 prune server --docker


FROM base AS build
WORKDIR /repo

# Manifests and lockfile first, so the install layer is reused until a dependency changes
COPY --from=prune /repo/out/json/ .
RUN pnpm install --frozen-lockfile

COPY --from=prune /repo/out/full/ .
RUN pnpm turbo run build --filter=server

# Production dependencies only, in a folder that stands on its own
RUN pnpm --filter server deploy --prod /deploy/server


FROM node:24-alpine AS runner
ENV NODE_ENV=production
# Relative to /app, kept under data/ so the database lands in the volume
ENV DB_FILE_NAME=data/noted.db
WORKDIR /app

COPY --from=build /deploy/server/node_modules node_modules
COPY --from=build /deploy/server/package.json ./
COPY --from=build /repo/apps/server/dist dist
# Migrations are applied on startup from ./drizzle
COPY --from=build /repo/apps/server/drizzle drizzle

# A new volume takes its ownership from this folder
RUN mkdir data && chown node:node data
USER node
VOLUME /app/data
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
	CMD wget -qO /dev/null http://localhost:${PORT:-3000}/api/health || exit 1

CMD ["node", "dist/main.js"]
