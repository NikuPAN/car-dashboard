# syntax=docker/dockerfile:1
# Static site: Vite builds dist/, then a tiny unprivileged nginx serves it (no Node at runtime).
# Built by docker compose on Nick's personal VPS (see CLAUDE.md "Hosting & deploy").
FROM node:24-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginxinc/nginx-unprivileged:alpine-slim
COPY deploy/nginx.conf /etc/nginx/nginx.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 8080
