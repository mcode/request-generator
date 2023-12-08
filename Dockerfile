FROM node:14-alpine
WORKDIR /home/node/app/request-generator
COPY --chown=node:node . .
RUN npm install
COPY --chown=node:node . .
EXPOSE 3000
RUN apk add --no-cache curl
HEALTHCHECK --interval=60s --timeout=10m --retries=10 CMD curl --fail http://localhost:3000 || exit 1
CMD npm run start
