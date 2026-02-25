FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci

COPY . .

RUN mkdir -p public
RUN npm run build:all

FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV GOOGLE_APPLICATION_CREDENTIALS=/app/firebase-service-account.json

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copiar bundle standalone do Next.js
COPY --from=builder /app/.next/standalone ./
# Copiar assets estáticos (não incluídos no standalone)
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Substituir server.js do Next.js pelo nosso custom server (Socket.IO)
COPY --from=builder /app/dist/server.js ./server.js
COPY --from=builder /app/dist/src ./src

# Copiar credenciais do Firebase para o container final
COPY --from=builder /app/firebase-service-account.json ./firebase-service-account.json

# socket.io não é traçado pelo standalone (usado apenas no custom server)
RUN npm install socket.io --omit=dev

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
