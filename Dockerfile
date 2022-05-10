FROM node:16 as builder

RUN mkdir -p /home/node/app
RUN mkdir -p /home/node/app/prisma
WORKDIR /home/node/app
RUN chown -R node:node /home/node/
USER node

COPY --chown=node:node . /home/node/app
RUN ["chmod", "+x", "/home/node/app/entrypoint.sh"]
RUN npm install

RUN npm run build
ADD entrypoint.sh /home/node/app
ENTRYPOINT ["./entrypoint.sh"]
