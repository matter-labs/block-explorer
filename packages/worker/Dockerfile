FROM node:22-slim AS build
WORKDIR /app

# Copy config files to install dependencies
COPY .npmrc .npmrc
COPY lerna.json .
COPY package.json .
COPY packages/worker/package.json ./packages/worker/package.json
COPY yarn.lock .

# Install all dependencies and build
RUN yarn install --production=false
COPY packages/worker/ ./packages/worker/
RUN yarn build

FROM node:22-slim
WORKDIR /app

# Copy all files. Package is copied entire from build phase
COPY .npmrc .npmrc
COPY lerna.json .
COPY package.json .
COPY --from=build /app/packages/worker ./packages/worker
COPY yarn.lock .

# Install only prod dependencies
RUN yarn install --production=true


ARG PORT=3001
ENV PORT=$PORT
EXPOSE $PORT 9229 9230
WORKDIR /app/packages/worker

CMD [ "node", "dist/main.js" ]
