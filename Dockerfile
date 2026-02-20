# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json* yarn.lock* pnpm-lock.yaml* ./

RUN \
  if [ -f yarn.lock ]; then yarn --frozen-lockfile; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm i --frozen-lockfile; \
  else npm ci; fi

COPY . .

RUN mkdir -p public
RUN npm run build:all

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

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

# socket.io não é traçado pelo standalone (usado apenas no custom server)
RUN npm install socket.io --omit=dev

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
