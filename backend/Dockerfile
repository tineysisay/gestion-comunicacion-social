# Imagen del backend Express + frontend Angular ya compilado.
# Contexto de build: raíz del repo (ver docker-compose.yml).
# NOTA: el build de Angular NO se hace aquí (la VM tiene 1 GB RAM);
# el dist se genera en local con `npm run build` en frontend/.
FROM node:20-slim

WORKDIR /app

# Instalar dependencias primero (mejor caché de capas)
COPY backend/package.json backend/package-lock.json ./backend/
RUN cd backend && npm ci --omit=dev

# Código del backend + build del frontend (server.js lo sirve con fallback SPA)
COPY backend/ ./backend/
COPY frontend/dist/proyectotkv1/browser/ ./frontend/dist/proyectotkv1/browser/

WORKDIR /app/backend

EXPOSE 3000

CMD ["node", "server.js"]
