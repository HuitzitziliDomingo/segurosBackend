FROM node:24.14.0-alpine

WORKDIR /app

COPY package.json .

RUN pnpm run build

RUN pnpm install

COPY . .



EXPOSE 4000

CMD [ "pnpm" "start" ]