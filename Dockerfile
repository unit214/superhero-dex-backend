FROM node:16 as builder

RUN mkdir -p /home/node/app
RUN mkdir -p /home/node/app/prisma
WORKDIR /home/node/app
RUN chown -R node:node /home/node/
USER node

COPY --chown=node:node . /home/node/app
RUN npm install
RUN npm run build
RUN cat package.json | grep version | awk {'print $2'} | tr -d '",' > npm_version.txt
RUN find . -maxdepth 1 ! -iname npm_version.txt -type f -delete && find .  -maxdepth 1 -type d ! -iname prisma ! -iname dist ! -iname node_modules -exec rm -rvf {} \;
COPY --chown=node:node entrypoint.sh /home/node/app
RUN ["chmod", "+x", "/home/node/app/entrypoint.sh"]
ENTRYPOINT ["./entrypoint.sh"]
