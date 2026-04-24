FROM node:24-alpine



WORKDIR /app


RUN npm install

# 3. Copiar el resto del código
COPY . .

# 4. Buildear la app
RUN npm run build

EXPOSE 4000

# 5. Sintaxis correcta del CMD (comas entre argumentos)
CMD ["npm", "start"]