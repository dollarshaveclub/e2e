FROM circleci/node:10-browsers

USER root

# Reduce excessive npm logs
ENV NPM_CONFIG_LOGLEVEL error
# https://gist.github.com/ralphtheninja/f7c45bdee00784b41fed
ENV JOBS max

RUN mkdir -p /app
WORKDIR /app
COPY . /app

RUN npm install --production

USER circleci

ENTRYPOINT [ "node", "./bin/run.js" ]
CMD [ "tests/**/*.js" ]
