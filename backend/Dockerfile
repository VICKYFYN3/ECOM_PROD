FROM node:20-slim

WORKDIR /app

COPY package*.json ./
RUN npm ci && npm cache clean --force

COPY . .

RUN mkdir -p logs

RUN groupadd -r appgroup && useradd -r -g appgroup appuser
RUN chown -R appuser:appgroup /app
USER appuser

EXPOSE 4001

CMD ["node", "server.js"]
