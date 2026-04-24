FROM node:24-alpine

WORKDIR /app

# 👇 Esto faltaba — copiar package.json primero
COPY package.json package-lock.json ./

RUN npm install

COPY . .

RUN npm run build

EXPOSE 4000

CMD ["npm", "start"]