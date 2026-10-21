FROM node:22.23.4-alpine3.24@sha256:ce8d97f7cfc7c5386421eb932df20a29df99b1a7f469f6157d5c9956702ffadc AS base-stage
ENV NODE_ENV=production

WORKDIR /usr/src/app
RUN apk add --update python3 py3-setuptools make g++ && rm -rf /var/cache/apk/*

COPY --chown=node:node .npmrc .npmrc
COPY --chown=node:node lerna.json ./
COPY --chown=node:node package*.json ./
COPY --chown=node:node ./packages/app/package*.json ./packages/app/
RUN npm ci --ignore-scripts && npm cache clean --force
COPY --chown=node:node ./packages/app/. ./packages/app
RUN rm -f .npmrc

FROM base-stage AS development-stage
ENV NODE_ENV=development
COPY --chown=node:node .npmrc .npmrc
RUN npm ci
RUN rm -f .npmrc

FROM development-stage AS build-stage
ARG VITE_VERSION=
ENV VITE_VERSION=$VITE_VERSION
ARG VITE_APP_ENVIRONMENT=default
ENV VITE_APP_ENVIRONMENT=$VITE_APP_ENVIRONMENT
ENV DOCKER_BUILD=true
RUN npm run build

FROM nginx:1.30.2-alpine@sha256:5f979dcfed4ce6461873f087e8c980d6e29b084b9e8776d9704a7e989b5f4898 AS production-stage
ENV PORT=3010
ENV APP_BASE=/
ENV STATIC_ASSETS_URL=
ENV STATIC_ASSETS_VERSIONED=true
ARG VITE_VERSION=
ENV VITE_VERSION=$VITE_VERSION
ENV CSP_ENFORCE=false
# Keep the legacy policy env var name for existing deployment overrides.
ENV CSP_REPORT_ONLY="default-src 'self'; child-src 'self' blob:; script-src 'self' 'unsafe-eval' blob:; connect-src https://api.4byte.sourcify.dev https://binaries.soliditylang.org https://vyper-releases-mirror.hardhat.org https://*.ingest.sentry.io https://*.zkscan.io https://*.zksync.io https://*.zksync.dev https://storage.googleapis.com; style-src 'self' fonts.googleapis.com; font-src 'self' fonts.gstatic.com; img-src 'self' https://assets.coingecko.com blob: data: https://firebasestorage.googleapis.com/v0/b/token-library.appspot.com/o/;"

COPY --from=build-stage /usr/src/app/packages/app/nginx.conf.template /etc/nginx/conf.d/default.conf.template
COPY --from=build-stage /usr/src/app/packages/app/dist /usr/share/nginx/html

RUN cp /usr/share/nginx/html/index.html /usr/share/nginx/html/index.html.tpl

# Pick where the asset sentinel resolves (STATIC_ASSETS_URL if set, else APP_BASE),
# allow that origin in the CSP, and render index.html. Only index.html carries the sentinel
# (in its entry/preload/stylesheet URLs); the JS reads window.__ASSETS_BASE__ at runtime
# (set by runtime-base.js), so the bundle itself is never edited -> sourcemaps stay valid.
CMD set -e; \
  export APP_BASE="${APP_BASE:-/}"; \
  export STATIC_ASSETS_VERSIONED="${STATIC_ASSETS_VERSIONED:-true}"; \
  export VITE_BRAND_NAME="${VITE_BRAND_NAME:-ZKsync}"; \
  export VITE_OG_IMAGE_URL="${VITE_OG_IMAGE_URL:-https://explorer.zksync.io/preview.png}"; \
  export VITE_ALT_FAVICON_IMAGE_TYPE="${VITE_ALT_FAVICON_IMAGE_TYPE:-image/x-icon}"; \
  export VITE_FAVICON_IMAGE_TYPE="${VITE_FAVICON_IMAGE_TYPE:-image/svg+xml}"; \
  export VITE_ALT_FAVICON_IMAGE_URL="${VITE_ALT_FAVICON_IMAGE_URL:-${APP_BASE}favicon.ico}"; \
  export VITE_FAVICON_IMAGE_URL="${VITE_FAVICON_IMAGE_URL:-${APP_BASE}favicon.svg}"; \
  case "$CSP_ENFORCE" in \
    true) export CSP_HEADER=Content-Security-Policy ;; \
    false|'') export CSP_HEADER=Content-Security-Policy-Report-Only ;; \
    *) echo 'Unrecognized CSP_ENFORCE; using report-only mode' >&2; export CSP_HEADER=Content-Security-Policy-Report-Only ;; \
  esac; \
  if [ -n "$STATIC_ASSETS_URL" ]; then \
    ASSET_TARGET="${STATIC_ASSETS_URL%/}/"; \
    if [ "$STATIC_ASSETS_VERSIONED" != "false" ] && [ -n "$VITE_VERSION" ]; then \
      ASSET_TARGET="${ASSET_TARGET}${VITE_VERSION}/"; \
    fi; \
    case "$STATIC_ASSETS_URL" in http://*|https://*) \
      ORIGIN=$(printf '%s' "$STATIC_ASSETS_URL" | sed -E 's#^(https?://[^/]+).*#\1#'); \
      for d in script-src style-src font-src img-src connect-src; do \
        CSP_REPORT_ONLY=$(printf '%s' "$CSP_REPORT_ONLY" | sed "s#$d #$d $ORIGIN #"); \
      done ;; \
    esac; \
  else \
    ASSET_TARGET="${APP_BASE%/}/"; \
  fi; \
  envsubst '$PORT $CSP_HEADER $CSP_REPORT_ONLY' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf; \
  envsubst '$APP_BASE $STATIC_ASSETS_URL $STATIC_ASSETS_VERSIONED $VITE_VERSION $VITE_BRAND_NAME $VITE_OG_IMAGE_URL $VITE_ALT_FAVICON_IMAGE_TYPE $VITE_ALT_FAVICON_IMAGE_URL $VITE_FAVICON_IMAGE_TYPE $VITE_FAVICON_IMAGE_URL' < /usr/share/nginx/html/index.html.tpl > /usr/share/nginx/html/index.html; \
  sed -i "s#/__ASSET_BASE__/#$ASSET_TARGET#g" /usr/share/nginx/html/index.html; \
  exec nginx -g 'daemon off;'
