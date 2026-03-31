# syntax=docker/dockerfile:1
FROM node:20-bookworm-slim AS builder
WORKDIR /app

ENV NPM_CONFIG_FETCH_RETRIES=5 \
    NPM_CONFIG_FETCH_RETRY_MINTIMEOUT=20000 \
    NPM_CONFIG_FETCH_RETRY_MAXTIMEOUT=120000 \
    NPM_CONFIG_FETCH_TIMEOUT=120000

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
RUN set -eux; \
    mkdir -p /app/runtime/building-blocks; \
    cp /app/src/building-blocks/package.json /app/runtime/building-blocks/package.json; \
    cd /app/src/building-blocks; \
    find . -path './node_modules' -prune -o -path './test' -prune -o -path './scripts' -prune -o -type f -name '*.js' -exec cp --parents '{}' /app/runtime/building-blocks/ \;

COPY src/passenger/package*.json /app/src/passenger/
WORKDIR /app/src/passenger
RUN set -eux; \
    for i in 1 2 3; do \
      npm ci --no-audit --no-fund && break; \
      if [ "$i" -eq 3 ]; then exit 1; fi; \
      sleep "$((i * 10))"; \
    done; \
    npm cache clean --force

COPY src/passenger /app/src/passenger
RUN npm run build

FROM node:20-bookworm-slim AS shared-prod-deps
WORKDIR /app/src/building-blocks

ENV NPM_CONFIG_FETCH_RETRIES=5 \
    NPM_CONFIG_FETCH_RETRY_MINTIMEOUT=20000 \
    NPM_CONFIG_FETCH_RETRY_MAXTIMEOUT=120000 \
    NPM_CONFIG_FETCH_TIMEOUT=120000

COPY src/building-blocks/package*.json ./
RUN set -eux; \
    for i in 1 2 3; do \
      npm ci --omit=dev --no-audit --no-fund && break; \
      if [ "$i" -eq 3 ]; then exit 1; fi; \
      sleep "$((i * 10))"; \
    done; \
    npm cache clean --force

FROM node:20-bookworm-slim AS service-prod-deps
WORKDIR /app/src/passenger

ENV NPM_CONFIG_FETCH_RETRIES=5 \
    NPM_CONFIG_FETCH_RETRY_MINTIMEOUT=20000 \
    NPM_CONFIG_FETCH_RETRY_MAXTIMEOUT=120000 \
    NPM_CONFIG_FETCH_TIMEOUT=120000

COPY src/building-blocks/package*.json /app/src/building-blocks/
COPY src/passenger/package*.json ./
RUN set -eux; \
    for i in 1 2 3; do \
      npm ci --omit=dev --no-audit --no-fund && break; \
      if [ "$i" -eq 3 ]; then exit 1; fi; \
      sleep "$((i * 10))"; \
    done; \
    npm cache clean --force
COPY --from=shared-prod-deps /app/src/building-blocks/node_modules/ /app/shared-node_modules/
RUN set -eux; \
    service_node_modules=/app/src/passenger/node_modules; \
    shared_node_modules=/app/shared-node_modules; \
    for entry in "$shared_node_modules"/*; do \
      [ -e "$entry" ] || continue; \
      name="$(basename "$entry")"; \
      case "$name" in \
        .bin|.*) continue ;; \
      esac; \
      if [ -d "$entry" ] && [ "${name#@}" != "$name" ]; then \
        mkdir -p "$service_node_modules/$name"; \
        for scoped_pkg in "$entry"/*; do \
          [ -e "$scoped_pkg" ] || continue; \
          pkg_name="$(basename "$scoped_pkg")"; \
          if [ ! -e "$service_node_modules/$name/$pkg_name" ]; then \
            cp -a "$scoped_pkg" "$service_node_modules/$name/"; \
          fi; \
        done; \
      elif [ ! -e "$service_node_modules/$name" ]; then \
        cp -a "$entry" "$service_node_modules/"; \
      fi; \
    done
RUN npm prune --omit=dev --no-audit --no-fund
RUN set -eux; \
    service_node_modules=/app/src/passenger/node_modules; \
    shared_node_modules=/app/shared-node_modules; \
    for entry in "$shared_node_modules"/*; do \
      [ -e "$entry" ] || continue; \
      name="$(basename "$entry")"; \
      case "$name" in \
        .bin|.*) continue ;; \
      esac; \
      if [ -d "$entry" ] && [ "${name#@}" != "$name" ]; then \
        mkdir -p "$service_node_modules/$name"; \
        for scoped_pkg in "$entry"/*; do \
          [ -e "$scoped_pkg" ] || continue; \
          pkg_name="$(basename "$scoped_pkg")"; \
          if [ ! -e "$service_node_modules/$name/$pkg_name" ]; then \
            cp -a "$scoped_pkg" "$service_node_modules/$name/"; \
          fi; \
        done; \
      elif [ ! -e "$service_node_modules/$name" ]; then \
        cp -a "$entry" "$service_node_modules/"; \
      fi; \
    done
RUN set -eux; \
    service_node_modules=/app/src/passenger/node_modules; \
    rm -rf "$service_node_modules/building-blocks"; \
    mkdir -p "$service_node_modules/building-blocks"
COPY --from=builder /app/runtime/building-blocks/ /app/src/passenger/node_modules/building-blocks/
RUN set -eux; \
    bb_dir=/app/src/passenger/node_modules/building-blocks; \
    [ -d "$bb_dir" ]; \
    [ ! -L "$bb_dir" ]; \
    [ -f "$bb_dir/configs/configs.js" ]; \
    [ -f "$bb_dir/passport/jwt.guard.js" ]

FROM gcr.io/distroless/nodejs20-debian12:nonroot AS runner
WORKDIR /app/src/passenger

ENV NODE_ENV=docker

COPY --from=service-prod-deps /app/src/passenger/node_modules ./node_modules
COPY --from=builder /app/src/passenger/dist ./dist

EXPOSE 3355
CMD ["dist/main.js"]
