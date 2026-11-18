FROM node:24-alpine

ARG VITE_URL
ENV VITE_URL=$VITE_URL

WORKDIR /home/node/app/request-generator
COPY --chown=node:node . .
RUN apk upgrade --no-cache zlib \
    && npm install --global npm@11.21.2 \
    && npm install
EXPOSE 3000

HEALTHCHECK --interval=30s --start-period=15s --timeout=10m --retries=10 CMD wget --no-verbose --tries=1 --spider ${VITE_URL} || exit 1

CMD npm run start
