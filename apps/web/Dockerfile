# Built from the repository root:
#   docker build -f apps/web/Dockerfile -t noted-web .

FROM node:24-alpine AS base
RUN corepack enable
RUN corepack use pnpm@latest

# Cuts the monorepo down to what the web app needs
FROM base AS prune
WORKDIR /repo
COPY . .
RUN pnpm dlx turbo@^2 prune web --docker


FROM base AS build
WORKDIR /repo

# Manifests and lockfile first, so the install layer is reused until a dependency changes
COPY --from=prune /repo/out/json/ .
RUN pnpm install --frozen-lockfile

COPY --from=prune /repo/out/full/ .
RUN pnpm turbo run build --filter=web


FROM nginx:alpine AS runner
# Where /api and /socket.io are forwarded to, filled into the template on startup
ENV API_UPSTREAM=http://server:3000

COPY apps/web/nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /repo/apps/web/dist/client /usr/share/nginx/html
EXPOSE 80
