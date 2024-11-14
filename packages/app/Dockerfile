FROM node:22-slim AS build
RUN apt-get update && apt-get install -y python3 make g++
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

FROM nginx

COPY packages/app/default.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/packages/app/dist /usr/share/nginx/html

EXPOSE 80

STOPSIGNAL SIGTERM

CMD ["nginx", "-g", "daemon off;"]