FROM node:22-slim AS build

WORKDIR /app

# Copy config files to install dependencies
COPY .npmrc .npmrc
COPY lerna.json .
COPY package.json .
COPY packages/private-rpc/package.json ./packages/private-rpc/package.json
COPY yarn.lock .

# Install all dependencies and build
RUN yarn install --production=false
COPY packages/private-rpc/ ./packages/private-rpc/
RUN yarn build

FROM node:22-slim

WORKDIR /app

# Copy all files. Package is copied entire from build phase
COPY .npmrc .npmrc
COPY lerna.json .
COPY package.json .
COPY packages/private-rpc ./packages/private-rpc
COPY --from=build /app/packages/private-rpc/dist ./packages/private-rpc/dist
COPY yarn.lock .

# Install only prod dependencies
RUN yarn install --production=true

ENV PORT="4041"
EXPOSE $PORT
WORKDIR /app/packages/private-rpc
CMD [ "node", "dist/index.js" ]
