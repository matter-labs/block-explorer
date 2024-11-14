FROM node:22-slim AS build
RUN apt-get update && apt-get install -y python3 make g++
WORKDIR /app

# Copy config files to install dependencies
COPY .npmrc .npmrc
COPY lerna.json .
COPY package.json .
COPY packages/data-fetcher/package.json ./packages/data-fetcher/package.json
COPY yarn.lock .

# Install all dependencies and build
RUN yarn install --production=false
COPY packages/data-fetcher/ ./packages/data-fetcher/
RUN yarn build

FROM node:22-slim
WORKDIR /app

# Copy all files. Package is copied entire from build phase
COPY .npmrc .npmrc
COPY lerna.json .
COPY package.json .
COPY packages/data-fetcher ./packages/data-fetcher
COPY --from=build /app/packages/data-fetcher/dist ./packages/data-fetcher/dist
COPY yarn.lock .

# Install only prod dependencies
RUN yarn install --production=true

ARG NODE_ENV=production
ENV NODE_ENV=$NODE_ENV
ARG PORT=3040
ENV PORT=$PORT

EXPOSE $PORT 9229 9230

USER node
WORKDIR /app/packages/data-fetcher

CMD [ "node", "dist/main.js" ]