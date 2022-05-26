FROM node:16 as builder

RUN mkdir -p /home/node/app
RUN mkdir -p /home/node/app/prisma
WORKDIR /home/node/app
RUN chown -R node:node /home/node/
USER node

ADD entrypoint.sh /home/node/app
COPY --chown=node:node . /home/node/app
RUN ["chmod", "+x", "/home/node/app/entrypoint.sh"]
RUN npm install

RUN npm run build
ENTRYPOINT ["./entrypoint.sh"]
