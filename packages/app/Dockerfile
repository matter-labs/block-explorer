FROM node:22-slim AS build
WORKDIR /app

# Copy config files to install dependencies
COPY .npmrc .npmrc
COPY lerna.json .
COPY package.json .
COPY packages/app/package.json ./packages/app/package.json
COPY yarn.lock .

# Install all dependencies and build
RUN yarn install --production=false
COPY packages/app/ ./packages/app/
RUN yarn build

FROM node:22-slim

WORKDIR /app

# Copy all files. Package is copied entire from build phase
COPY .npmrc .npmrc
COPY lerna.json .
COPY package.json .
COPY packages/app ./packages/app
COPY --from=build /app/packages/app/dist ./packages/app/dist
COPY yarn.lock .

# Install only prod dependencies
RUN yarn install --production=true

RUN yarn global add http-server

ARG NODE_ENV=production
ENV NODE_ENV=$NODE_ENV

ARG PORT=3010
ENV PORT=$PORT

WORKDIR /app/packages/app/dist

CMD http-server -p $PORT -c-1 --app="http://127.0.0.1:$PORT/index.html?"
