FROM node:22-slim AS build

WORKDIR /app

# Copy config files to install dependencies
COPY .npmrc .npmrc
COPY lerna.json .
COPY package.json .
COPY packages/proxy/package.json ./packages/proxy/package.json
COPY yarn.lock .

# Install all dependencies and build
RUN yarn install --production=false
COPY packages/proxy/ ./packages/proxy/
RUN yarn build

FROM node:22-slim

WORKDIR /app

# Copy all files. Package is copied entire from build phase
COPY .npmrc .npmrc
COPY lerna.json .
COPY package.json .
COPY --from=build /app/packages/proxy ./packages/proxy
COPY yarn.lock .

# Install only prod dependencies
RUN yarn install --production=true

ENV SERVER_PORT="3020"

WORKDIR /app/packages/proxy

CMD [ "node", "dist/index.js" ]
