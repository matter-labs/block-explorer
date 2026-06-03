FROM node:18.17.1-alpine AS base-stage
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
# Optional explicit base path baked in at build time. When empty (default),
# the build uses a relative base so the image can be served from any subpath
# configured at container start via the BASE_PATH env var. See vite.config.ts.
ARG VITE_BASE_PATH=
ENV VITE_BASE_PATH=$VITE_BASE_PATH
ENV DOCKER_BUILD=true
RUN npm run build

FROM nginx:alpine AS production-stage
ENV PORT=3010
ENV CSP_REPORT_ONLY="default-src 'self'; child-src 'self' blob:; script-src 'self' 'unsafe-eval' blob:; connect-src https://*.ingest.sentry.io https://*.zkscan.io https://*.zksync.io https://*.zksync.dev https://storage.googleapis.com; style-src 'self' fonts.googleapis.com; font-src 'self' fonts.gstatic.com; img-src 'self' https://assets.coingecko.com blob: data: https://firebasestorage.googleapis.com/v0/b/token-library.appspot.com/o/;"

RUN apk add --no-cache gomplate

COPY --from=build-stage /usr/src/app/packages/app/nginx.conf.template /etc/nginx/conf.d/default.conf.template
COPY --from=build-stage /usr/src/app/packages/app/nginx.conf.subpath.template /etc/nginx/conf.d/subpath.conf.template
COPY --from=build-stage /usr/src/app/packages/app/dist /usr/share/nginx/html

RUN cp /usr/share/nginx/html/index.html /usr/share/nginx/html/index.html.tpl

# BASE_PATH (e.g. "/explorer") serves the app under a subpath for
# prefix-preserving reverse proxies. When unset, behavior is unchanged.
# nginx needs the prefix without a trailing slash, the <base> tag (filled
# by gomplate from BASE_PATH) needs it with one. The charset check fails
# fast on values that would be unsafe to interpolate into the nginx
# location/rewrite rules (see nginx.conf.subpath.template).
CMD BP="${BASE_PATH#/}" && BP="${BP%/}" \
  && case "$BP" in *[!a-zA-Z0-9_/-]*) echo "Invalid BASE_PATH: only letters, digits, '-', '_' and '/' are allowed" >&2 && exit 1;; esac \
  && if [ -n "$BP" ]; then \
       export BASE_PATH="/$BP" \
       && envsubst '$PORT $CSP_REPORT_ONLY $BASE_PATH' < /etc/nginx/conf.d/subpath.conf.template > /etc/nginx/conf.d/default.conf \
       && export BASE_PATH="/$BP/"; \
     else \
       export BASE_PATH="/" \
       && envsubst '$PORT $CSP_REPORT_ONLY' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf; \
     fi \
  && gomplate -f /usr/share/nginx/html/index.html.tpl -o /usr/share/nginx/html/index.html \
  && exec nginx -g 'daemon off;'
