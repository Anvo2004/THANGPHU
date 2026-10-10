FROM node:20-alpine

WORKDIR /app

# Copy package.json first for caching
COPY package*.json ./

RUN npm install --production

# Copy source code
COPY . .

# Docker Compose sets PORT=4000 inside the container.
EXPOSE 4000

CMD ["node", "server.js"]
