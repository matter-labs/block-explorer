FROM node:18.17.1-alpine AS base-stage
ENV NODE_ENV=production

WORKDIR /usr/src/app

RUN apk add --update python3 make g++ && rm -rf /var/cache/apk/*

COPY --chown=node:node .npmrc .npmrc
COPY --chown=node:node lerna.json ./
COPY --chown=node:node package*.json ./
COPY --chown=node:node ./packages/worker/package*.json ./packages/worker/
RUN npm ci --ignore-scripts --only=production && npm cache clean --force
COPY --chown=node:node ./packages/worker/. ./packages/worker
RUN rm -f .npmrc

FROM base-stage AS development-stage
ENV NODE_ENV=development
COPY --chown=node:node .npmrc .npmrc
RUN npm ci
RUN rm -f .npmrc

FROM development-stage AS build-stage
RUN npm run build

FROM base-stage AS production-stage

# HEALTHCHECK --interval=30s --timeout=3s --retries=5 \
#   CMD curl -f http://localhost:${PORT}/health || exit 1

COPY --chown=node:node --from=build-stage /usr/src/app/packages/worker/dist ./packages/worker/dist

ARG NODE_ENV=production
ENV NODE_ENV $NODE_ENV

ARG PORT=3001
ENV PORT $PORT

EXPOSE $PORT 9229 9230

USER node
WORKDIR /usr/src/app/packages/worker

CMD [ "node", "dist/main.js" ]
