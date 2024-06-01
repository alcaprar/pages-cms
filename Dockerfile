FROM node:20

WORKDIR /app

COPY package.json package-lock.json postcss.config.js tailwind.config.js vite.config.js /app/
RUN npm install

COPY src /app/src
COPY server/index.js /app/server/index.js
COPY public /app/public
COPY index.html /app/
COPY entrypoint.sh /app/

RUN npm run build

ENTRYPOINT /app/entrypoint.sh