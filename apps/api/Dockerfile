# syntax=docker/dockerfile:1
# Build context is the repository root:  docker build -f apps/api/Dockerfile .

ARG NODE_VERSION=22

# ---- deps: full install (needed to compile TypeScript) ----
FROM node:${NODE_VERSION}-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
COPY packages/shared/package.json packages/shared/
COPY packages/config/package.json packages/config/
RUN npm ci --ignore-scripts

# ---- build: compile shared, then the api ----
FROM deps AS build
COPY packages packages
COPY apps/api apps/api
RUN npm run build -w @formula/shared && npm run build -w @formula/api

# ---- prod-deps: production dependencies only ----
FROM node:${NODE_VERSION}-alpine AS prod-deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
COPY packages/shared/package.json packages/shared/
COPY packages/config/package.json packages/config/
RUN npm ci --omit=dev --ignore-scripts -w @formula/api -w @formula/shared

# ---- runner ----
FROM node:${NODE_VERSION}-alpine AS runner
ENV NODE_ENV=production
WORKDIR /app

COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/packages/shared/package.json packages/shared/package.json
COPY --from=build /app/packages/shared/dist packages/shared/dist
COPY --from=build /app/apps/api/package.json apps/api/package.json
COPY --from=build /app/apps/api/dist apps/api/dist
COPY --from=build /app/apps/api/db apps/api/db
COPY --from=build /app/apps/api/scripts apps/api/scripts

# Upload storage. A named volume mounted here keeps the node user's ownership.
RUN mkdir -p /app/storage && chown node:node /app/storage

USER node
WORKDIR /app/apps/api
EXPOSE 4000
CMD ["node", "dist/main.js"]
