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
ARG VITE_APP_ENVIRONMENT=default
ENV VITE_APP_ENVIRONMENT=$VITE_APP_ENVIRONMENT
ARG PORT=3010
ENV PORT $PORT
RUN npm run build
RUN sed "s/\${PORT}/$PORT/g" /usr/src/app/packages/app/nginx.conf.template > /usr/src/app/packages/app/nginx.conf

FROM nginx:alpine AS production-stage
COPY --from=build-stage /usr/src/app/packages/app/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build-stage /usr/src/app/packages/app/dist /usr/share/nginx/html

CMD ["nginx", "-g", "daemon off;"]
