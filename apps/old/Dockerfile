FROM node:22-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN mkdir -p data
RUN npm run build

FROM node:22-alpine AS runner

WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/build ./build
RUN mkdir -p data

EXPOSE 3000
ENV NODE_ENV=production

CMD ["node", "build"]