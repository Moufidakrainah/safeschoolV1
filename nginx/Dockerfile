# ── Étape 1 : build du frontend React ──────────────────────────────
FROM node:20-alpine AS build
WORKDIR /app
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ .
# URL d'API vide => le frontend utilise des URLs relatives (même origine).
ARG VITE_API_URL=
ENV VITE_API_URL=$VITE_API_URL
# Build statique du frontend (Vite seul, sans la vérification de types tsc).
RUN npx vite build

# ── Étape 2 : nginx sert le build + proxy vers le backend ───────────
FROM nginx:alpine AS prod
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80 443
