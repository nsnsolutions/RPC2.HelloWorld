FROM node:carbon-alpine

ENV NODE_ENV=production
ENV NODE_MAX_MEM=200

WORKDIR /usr/app/
CMD [ "npm", "start" ]

ADD package.json /usr/app/package.json
ADD npm-shrinkwrap.json /usr/app/npm-shrinkwrap.json
RUN npm install --production

ADD environment /usr/app/environment
ADD src /usr/app/src
