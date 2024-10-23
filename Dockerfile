FROM node:21-alpine

ARG VITE_URL
ENV VITE_URL=$VITE_URL

WORKDIR /home/node/app/request-generator
COPY --chown=node:node . .
RUN npm install
EXPOSE 3000

HEALTHCHECK --interval=30s --start-period=15s --timeout=10m --retries=10 CMD wget --no-verbose --tries=1 --spider ${VITE_URL} || exit 1
COPY --chown=node:node . .

CMD npm run start
