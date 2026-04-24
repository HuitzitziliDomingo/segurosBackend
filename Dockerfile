FROM node:24-alpine

WORKDIR /app

# Solo package.json por ahora
COPY package.json ./

RUN npm install

COPY . .

RUN npm run build

EXPOSE 4000

CMD ["npm", "start"]