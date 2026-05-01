# React
FROM node:24-alpine AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm install

COPY ./frontend ./

RUN npm run build

# Express
FROM node:24-alpine AS backend-builder
WORKDIR /app/backend

COPY backend/package*.json ./
RUN npm install

COPY ./backend ./ 

COPY --from=frontend-builder /app/frontend/dist ./public

CMD ["node", "server.js"]