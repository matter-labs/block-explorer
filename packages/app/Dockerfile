FROM node:22.22.3-alpine AS base-stage
ENV NODE_ENV=production

WORKDIR /usr/src/app
RUN apk add --update python3 make g++ && rm -rf /var/cache/apk/*

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

FROM nginx:1.30.2-alpine AS production-stage
ENV PORT=3010
ENV APP_BASE=/
ENV STATIC_ASSETS_URL=
ENV STATIC_ASSETS_VERSIONED=true
ARG VITE_VERSION=
ENV VITE_VERSION=$VITE_VERSION
ENV CSP_REPORT_ONLY="default-src 'self'; child-src 'self' blob:; script-src 'self' 'unsafe-eval' blob:; connect-src https://*.ingest.sentry.io https://*.zkscan.io https://*.zksync.io https://*.zksync.dev https://storage.googleapis.com; style-src 'self' fonts.googleapis.com; font-src 'self' fonts.gstatic.com; img-src 'self' https://assets.coingecko.com blob: data: https://firebasestorage.googleapis.com/v0/b/token-library.appspot.com/o/;"

RUN apk add --no-cache gomplate

COPY --from=build-stage /usr/src/app/packages/app/nginx.conf.template /etc/nginx/conf.d/default.conf.template
COPY --from=build-stage /usr/src/app/packages/app/dist /usr/share/nginx/html

RUN cp /usr/share/nginx/html/index.html /usr/share/nginx/html/index.html.tpl

# Pick where the asset sentinel resolves (STATIC_ASSETS_URL if set, else APP_BASE),
# allow that origin in the CSP, and render index.html. Only index.html carries the sentinel
# (in its entry/preload/stylesheet URLs); the JS reads window.__ASSETS_BASE__ at runtime
# (set in index.html by gomplate), so the bundle itself is never edited -> sourcemaps stay valid.
CMD set -e; \
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
  envsubst '$PORT $CSP_REPORT_ONLY' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf; \
  gomplate -f /usr/share/nginx/html/index.html.tpl -o /usr/share/nginx/html/index.html; \
  sed -i "s#/__ASSET_BASE__/#$ASSET_TARGET#g" /usr/share/nginx/html/index.html; \
  exec nginx -g 'daemon off;'
