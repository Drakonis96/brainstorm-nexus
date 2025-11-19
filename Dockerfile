# Unified Dockerfile - Frontend + Backend in one container
FROM node:20-alpine

WORKDIR /app

# Install supervisor to manage multiple processes
RUN apk add --no-cache supervisor nginx

# ===== BACKEND SETUP =====
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm install --production
COPY backend/ ./

# ===== FRONTEND SETUP =====
WORKDIR /app/frontend
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# ===== NGINX CONFIGURATION =====
COPY nginx.conf /etc/nginx/http.d/default.conf

# ===== SUPERVISOR CONFIGURATION =====
RUN mkdir -p /etc/supervisor/conf.d /var/log/supervisor
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Clean up
RUN rm -rf /app/frontend/node_modules

WORKDIR /app

# Expose port
EXPOSE 5016

# Start supervisor (manages nginx + backend)
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
