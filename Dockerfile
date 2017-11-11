FROM node:8-alpine

# Reduce excessive npm logs
ENV NPM_CONFIG_LOGLEVEL error
# https://gist.github.com/ralphtheninja/f7c45bdee00784b41fed
ENV JOBS max

RUN mkdir -p /app
WORKDIR /app
COPY . /app

RUN npm install

CMD [ "monitors/**/*.js" ]
ENTRYPOINT [ "node", "./bin/run.js" ]
