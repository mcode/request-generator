FROM node:21-alpine

WORKDIR /home/node/app/request-generator
COPY --chown=node:node . .
RUN npm install
EXPOSE 3000
COPY --chown=node:node . .

CMD npm run start
