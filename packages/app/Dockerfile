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
RUN npm run build

FROM base-stage AS production-stage
COPY --chown=node:node --from=build-stage /usr/src/app/packages/app/dist ./packages/app/dist
RUN npm i -g http-server

ARG NODE_ENV=production
ENV NODE_ENV $NODE_ENV

ARG PORT=3010
ENV PORT $PORT

USER node
WORKDIR /usr/src/app/packages/app/dist

CMD http-server -p $PORT -c-1 --proxy="http://127.0.0.1:$PORT/index.html?"