# ── Dev : serveur Vite avec hot reload (HMR) ───────────────────────
# Le build de prod du frontend est réalisé dans nginx/Dockerfile :
# en prod, nginx sert directement les fichiers statiques.
FROM node:20-alpine AS dev
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host"]
