FROM node:latest
ADD . /code
WORKDIR .

RUN npm install

RUN cd client && npm i && npm run build

CMD ["node", "server/server.js"]
