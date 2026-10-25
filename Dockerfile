# STATIC-ONLY DIAGNOSTIC. Not the production architecture: no Worker API or D1.
# Contact submission will fail here. Use the same-origin Worker local stack instead.
FROM node:24-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM busybox:1.37 AS static-diagnostic
COPY --from=builder /app/dist /www
EXPOSE 8080
CMD ["httpd", "-f", "-p", "8080", "-h", "/www"]
