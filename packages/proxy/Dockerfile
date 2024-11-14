FROM node:22-slim AS build
RUN apt-get update && apt-get install -y python3 make g++
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
WORKDIR /app/packages/proxy/
RUN yarn build

FROM node:22-slim

WORKDIR /app

COPY .npmrc .npmrc
COPY lerna.json .
COPY package.json .
COPY packages/proxy ./packages/proxy
COPY --from=build /app/packages/proxy/dist ./packages/proxy/dist
COPY yarn.lock .

# Install only prod dependencies
RUN yarn install --production=true

ENV SERVER_PORT="4040"
EXPOSE $SERVER_PORT
WORKDIR /app/packages/proxy

CMD [ "node", "dist/index.js" ]
