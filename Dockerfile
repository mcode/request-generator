FROM node:21-alpine

ARG VITE_URL
ENV VITE_URL=$VITE_URL

WORKDIR /home/node/app/request-generator
COPY --chown=node:node . .
RUN npm install
EXPOSE 3000
RUN apk update 
RUN apk upgrade
RUN apk search curl 
RUN apk add curl
HEALTHCHECK --interval=60s --timeout=10m --retries=10 CMD curl --fail $VITE_URL || exit 1
COPY --chown=node:node . .

CMD npm run start
