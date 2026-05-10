# Stage 1: Dependencies
FROM node:24-alpine AS deps
RUN apk add --no-cache libc6-compat
RUN corepack enable && corepack prepare pnpm@10.22.0 --activate
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --prod --frozen-lockfile


# Stage 2: Builder
FROM node:24-alpine AS builder
RUN corepack enable && corepack prepare pnpm@10.22.0 --activate
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN CI=true pnpm install --frozen-lockfile

# NEXT_PUBLIC_* vars must be available at build time — pass via --build-arg
ARG NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
ARG NEXT_PUBLIC_APP_NAME=StoryStack
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_APP_NAME=$NEXT_PUBLIC_APP_NAME

ENV NODE_ENV=production
RUN pnpm build

RUN apk add --no-cache curl && \
    curl -sf https://gobinaries.com/tj/node-prune | sh && \
    if [ -d .next/standalone/node_modules ]; then node-prune .next/standalone/node_modules; fi


# Stage 3: Runner
FROM gcr.io/distroless/nodejs22-debian12 AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

COPY --from=builder --chown=65532:65532 /app/.next/standalone ./
COPY --from=builder --chown=65532:65532 /app/.next/static ./.next/static
COPY --from=builder --chown=65532:65532 /app/public ./public
USER nonroot
EXPOSE 3000
CMD ["server.js"]
