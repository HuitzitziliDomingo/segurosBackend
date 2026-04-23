FROM node:24-alpine

# 1. Instalar pnpm
RUN npm install -g pnpm

WORKDIR /app

# 2. Copiar dependencias e instalar (esto se cachea si package.json no cambia)
COPY package.json pnpm-lock.yaml ./
RUN pnpm install

# 3. Copiar el resto del código
COPY . .

# 4. Buildear la app
RUN pnpm run build

EXPOSE 4000

# 5. Sintaxis correcta del CMD (comas entre argumentos)
CMD ["pnpm", "start"]