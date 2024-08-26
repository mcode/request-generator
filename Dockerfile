FROM node:21-alpine

WORKDIR /home/node/app/request-generator
COPY --chown=node:node . .
RUN npm install
EXPOSE 3000
RUN apk update 
RUN apk upgrade
RUN apk search curl 
RUN apk add curl
HEALTHCHECK --interval=60s --timeout=10m --retries=10 CMD curl --fail http://localhost:3000 || exit 1
COPY --chown=node:node . .

CMD npm run start
