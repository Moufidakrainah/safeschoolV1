# ── Base commune (deps + sources) ──────────────────────────────────
FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

# ── Dev : NestJS en watch / hot reload ─────────────────────────────
FROM base AS dev
EXPOSE 3000
CMD ["npm", "run", "start:dev"]

# ── Build : compilation TypeScript -> dist/ ────────────────────────
FROM base AS build
RUN npm run build

# ── Prod : runtime minimal, deps de prod seulement ─────────────────
FROM node:20-alpine AS prod
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm install --omit=dev
COPY --from=build /app/dist ./dist
EXPOSE 3000
CMD ["node", "dist/main"]
