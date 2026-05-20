FROM node:22-alpine

RUN apk add --no-cache nginx supervisor

WORKDIR /app

COPY package.json package-lock.json* ./
COPY backend ./backend
COPY frontend ./frontend
COPY docker/nginx.all-in-one.conf /etc/nginx/http.d/default.conf
COPY docker/supervisord.conf /etc/supervisord.conf
RUN nginx -t

# Production deps for each service
RUN set -e; \
  for svc in auth-service user-service notification-service api-gateway performance-review-service feedback-service analytics-service ai-insights-service; do \
    cd /app/backend/services/$svc && npm ci --omit=dev; \
  done

# Frontend: same-origin API via nginx proxy
RUN cd /app/frontend && npm ci && VITE_API_BASE_URL=/api npm run build

RUN mkdir -p /data

VOLUME ["/data"]

EXPOSE 80 8080 3001 3002 3003 8001 8002 8004 8005

CMD ["supervisord", "-c", "/etc/supervisord.conf"]
