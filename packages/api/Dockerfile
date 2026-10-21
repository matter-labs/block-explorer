FROM node:22.23.4-alpine3.24@sha256:ce8d97f7cfc7c5386421eb932df20a29df99b1a7f469f6157d5c9956702ffadc AS base-stage
ENV NODE_ENV=production

WORKDIR /usr/src/app

FROM base-stage AS dependencies-stage
COPY --chown=node:node .npmrc .npmrc
COPY --chown=node:node lerna.json ./
COPY --chown=node:node package*.json ./
COPY --chown=node:node ./packages/api/package*.json ./packages/api/
RUN npm ci --ignore-scripts --omit=dev && npm cache clean --force
RUN rm -f .npmrc

FROM dependencies-stage AS development-stage
ENV NODE_ENV=development
RUN apk add --no-cache python3 make g++
COPY --chown=node:node ./packages/api/. ./packages/api
COPY --chown=node:node .npmrc .npmrc
RUN npm ci
RUN rm -f .npmrc

FROM development-stage AS build-stage
RUN npm run build

FROM base-stage AS production-stage
RUN rm -rf /usr/local/lib/node_modules /opt/yarn-* \
    /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/corepack \
    /usr/local/bin/yarn /usr/local/bin/yarnpkg

COPY --chown=node:node --from=dependencies-stage /usr/src/app/node_modules ./node_modules
COPY --chown=node:node --from=dependencies-stage /usr/src/app/packages/api ./packages/api

COPY --chown=node:node --from=build-stage /usr/src/app/packages/api/dist ./packages/api/dist

ARG NODE_ENV=production
ENV NODE_ENV $NODE_ENV

ARG PORT=3000
ENV PORT $PORT

ARG METRICS_PORT=3005
ENV METRICS_PORT $METRICS_PORT

EXPOSE $PORT $METRICS_PORT 9229 9230

USER node
WORKDIR /usr/src/app/packages/api

CMD [ "node", "dist/main.js" ]
