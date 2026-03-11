# syntax=docker/dockerfile:1
# -------- Builder --------
FROM node:20.19.2-alpine AS builder
WORKDIR /app

ENV NPM_CONFIG_FETCH_RETRIES=5 \
    NPM_CONFIG_FETCH_RETRY_MINTIMEOUT=20000 \
    NPM_CONFIG_FETCH_RETRY_MAXTIMEOUT=120000 \
    NPM_CONFIG_FETCH_TIMEOUT=120000

# Install building-blocks dependencies first so service build can resolve sibling package deps.
COPY src/building-blocks/package*.json /app/src/building-blocks/
WORKDIR /app/src/building-blocks
RUN set -eux; \
    for i in 1 2 3; do \
      npm ci --no-audit --no-fund && break; \
      if [ "$i" -eq 3 ]; then exit 1; fi; \
      sleep "$((i * 10))"; \
    done; \
    npm cache clean --force

COPY src/building-blocks /app/src/building-blocks

# Install service dependencies before copying source for better layer cache behavior.
COPY src/booking/package*.json /app/src/booking/
WORKDIR /app/src/booking
RUN set -eux; \
    for i in 1 2 3; do \
      npm ci --no-audit --no-fund && break; \
      if [ "$i" -eq 3 ]; then exit 1; fi; \
      sleep "$((i * 10))"; \
    done; \
    npm cache clean --force

COPY src/booking /app/src/booking
RUN npm run build

# -------- Runner --------
FROM node:20.19.2-alpine AS runner
WORKDIR /app/src/booking

ENV NODE_ENV=docker \
    NPM_CONFIG_FETCH_RETRIES=5 \
    NPM_CONFIG_FETCH_RETRY_MINTIMEOUT=20000 \
    NPM_CONFIG_FETCH_RETRY_MAXTIMEOUT=120000 \
    NPM_CONFIG_FETCH_TIMEOUT=120000

# Keep service install path under /app/src/<service> so file:../building-blocks symlink resolves to /app/src/building-blocks.
COPY src/booking/package*.json ./
RUN set -eux; \
    for i in 1 2 3; do \
      npm ci --omit=dev --no-audit --no-fund && break; \
      if [ "$i" -eq 3 ]; then exit 1; fi; \
      sleep "$((i * 10))"; \
    done; \
    npm cache clean --force

COPY --from=builder /app/src/booking/dist ./dist
COPY --from=builder /app/src/booking/.env.development ./dist
COPY --from=builder /app/src/building-blocks ../building-blocks

EXPOSE 3366
CMD ["node", "dist/main.js"]
