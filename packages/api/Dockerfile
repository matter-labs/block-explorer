FROM node:22-slim AS build
WORKDIR /app

# Copy config files to install dependencies
COPY .npmrc .npmrc
COPY lerna.json .
COPY package.json .
COPY packages/api/package.json ./packages/api/package.json
COPY yarn.lock .

# Install all dependencies and build
RUN yarn install --production=false
COPY packages/api/ ./packages/api/
RUN yarn build

FROM node:22-slim
WORKDIR /app

# Copy all files. Package is copied entire from build phase
COPY .npmrc .npmrc
COPY lerna.json .
COPY package.json .
COPY --from=build /app/packages/api ./packages/api
COPY yarn.lock .

# Install only prod dependencies
RUN yarn install --production=true

ARG NODE_ENV=production
ENV NODE_ENV=$NODE_ENV
ARG PORT=3000
ENV PORT=$PORT
ARG METRICS_PORT=3005
ENV METRICS_PORT=$METRICS_PORT

EXPOSE $PORT $METRICS_PORT 9229 9230

WORKDIR /app/packages/api

CMD [ "node", "dist/main.js" ]
