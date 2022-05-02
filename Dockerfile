FROM node:16 as builder

RUN mkdir -p /home/node/app
RUN mkdir -p /home/node/app/prisma
WORKDIR /home/node/app
RUN chown -R node:node /home/node/
USER node

COPY --chown=node:node . /home/node/app
RUN npm install

RUN npm run build
CMD ["npm","run", "serve:prod"]
