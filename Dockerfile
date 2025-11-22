# ขั้นตอนที่ 1: Dependencies
FROM node:18-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# คัดลอก package files
COPY package.json package-lock.json ./
RUN npm ci

# ขั้นตอนที่ 2: Builder
FROM node:18-alpine AS builder
WORKDIR /app

# คัดลอก dependencies จาก deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# ปิด telemetry ขณะ build
ENV NEXT_TELEMETRY_DISABLED 1

# Build application
RUN npm run build

# ขั้นตอนที่ 3: Runner
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# สร้าง user ที่ไม่ใช่ root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# คัดลอกไฟล์ที่จำเป็น
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# ตั้งค่า ownership
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
