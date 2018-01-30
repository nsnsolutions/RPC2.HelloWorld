# docker build -t token:unittest -f unittest.dockerfile .
FROM node:carbon-alpine

WORKDIR /usr/app/

CMD [ "npm", "test", "--", \
    "--reporter=mocha-simple-html-reporter", \
    "--reporter-options", "output=/opt/report.html", \
    "--no-warnings" ]

ADD package.json /usr/app/package.json
ADD npm-shrinkwrap.json /usr/app/npm-shrinkwrap.json
RUN npm install && npm install mocha-simple-html-reporter

ADD test /usr/app/test
ADD src /usr/app/src