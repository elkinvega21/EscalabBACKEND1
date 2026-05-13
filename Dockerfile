# Imagen base
FROM node:20-alpine

WORKDIR /app

# Instalar dependencias
COPY package*.json ./
RUN npm install --production

# Copiar el resto del código
COPY . .

# Exponer el puerto que Render usará automáticamente
EXPOSE 3001

# Comando para iniciar el servidor
CMD ["npm", "start"]
