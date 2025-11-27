# Use an LTS base image
FROM node:18

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

# No build step for plain Express
ENV NODE_ENV=production
# Render sets PORT; just expose for local use
EXPOSE 3000

CMD ["node", "server.js"]