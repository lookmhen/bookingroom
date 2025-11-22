# Deployment Guide

## Overview

This guide covers deploying the Meeting Room Booking System to various hosting platforms.

---

## Prerequisites

Before deployment:
- ✅ Application working locally
- ✅ Azure AD app configured
- ✅ Environment variables documented
- ✅ Production build tested (`npm run build`)

---

## Vercel Deployment (Recommended)

Vercel is the recommended platform for Next.js applications.

### Step 1: Prepare Repository

```bash
# Initialize git if not already done
git init
git add .
git commit -m "Initial commit"

# Push to GitHub
git remote add origin <your-github-repo>
git push -u origin main
```

### Step 2: Import to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click **"New Project"**
3. Import your GitHub repository
4. Framework preset: **Next.js** (auto-detected)

### Step 3: Configure Environment Variables

Add these in Vercel dashboard:

```env
AZURE_AD_CLIENT_ID=your_client_id
AZURE_AD_CLIENT_SECRET=your_client_secret
AZURE_AD_TENANT_ID=your_tenant_id
NEXTAUTH_SECRET=your_production_secret
NEXTAUTH_URL=https://your-app.vercel.app
```

**Important:** Generate a new `NEXTAUTH_SECRET` for production:
```bash
openssl rand -base64 32
```

### Step 4: Update Azure AD

1. Go to Azure Portal → App registrations
2. Select your app
3. Go to **Authentication** → **Platform configurations** → **Web**
4. Add redirect URI: `https://your-app.vercel.app/api/auth/callback/azure-ad`
5. Save

### Step 5: Deploy

1. Click **Deploy**
2. Wait for build to complete (~2-3 minutes)
3. Visit your production URL

### Step 6: Verify

- ✅ Sign in works
- ✅ Rooms load correctly
- ✅ Bookings can be created
- ✅ Teams meetings generate links

---

## Azure App Service

### Step 1: Create App Service

```bash
# Login to Azure
az login

# Create resource group
az group create --name bookingroom-rg --location eastus

# Create App Service plan
az appservice plan create \
  --name bookingroom-plan \
  --resource-group bookingroom-rg \
  --sku B1 \
  --is-linux

# Create web app
az webapp create \
  --resource-group bookingroom-rg \
  --plan bookingroom-plan \
  --name bookingroom-app \
  --runtime "NODE|18-lts"
```

### Step 2: Configure Environment Variables

```bash
az webapp config appsettings set \
  --resource-group bookingroom-rg \
  --name bookingroom-app \
  --settings \
    AZURE_AD_CLIENT_ID="your_client_id" \
    AZURE_AD_CLIENT_SECRET="your_client_secret" \
    AZURE_AD_TENANT_ID="your_tenant_id" \
    NEXTAUTH_SECRET="your_secret" \
    NEXTAUTH_URL="https://bookingroom-app.azurewebsites.net"
```

### Step 3: Deploy

```bash
# Build locally
npm run build

# Deploy using zip
zip -r deploy.zip .next package.json package-lock.json

az webapp deployment source config-zip \
  --resource-group bookingroom-rg \
  --name bookingroom-app \
  --src deploy.zip
```

### Step 4: Update Azure AD Redirect URI

Add: `https://bookingroom-app.azurewebsites.net/api/auth/callback/azure-ad`

---

## AWS Amplify

### Step 1: Install Amplify CLI

```bash
npm install -g @aws-amplify/cli
amplify configure
```

### Step 2: Initialize Amplify

```bash
amplify init
# Follow prompts, select:
# - App name: bookingroom
# - Environment: production
# - Default editor: your choice
# - Type: Javascript
# - Framework: React
# - Source directory: src
# - Distribution directory: .next
# - Build command: npm run build
# - Start command: npm run start
```

### Step 3: Add Hosting

```bash
amplify add hosting
# Select: Hosting with Amplify Console
# Select: Manual deployment
```

### Step 4: Set Environment Variables

1. Go to Amplify Console
2. Select your app → **Environment variables**
3. Add all required variables
4. **Important:** Set `NEXTAUTH_URL` to your Amplify domain

### Step 5: Deploy

```bash
amplify publish
```

### Step 6: Custom Domain (Optional)

1. Amplify Console → **Domain management**
2. Add your custom domain
3. Update `NEXTAUTH_URL`
4. Update Azure AD redirect URI

---

## DigitalOcean App Platform

### Step 1: Create App

1. Go to [DigitalOcean App Platform](https://cloud.digitalocean.com/apps)
2. Click **Create App**
3. Connect your GitHub repository
4. Select **Next.js** as framework

### Step 2: Environment Variables

Add in App Platform dashboard:
- All environment variables from `.env.local`
- Update `NEXTAUTH_URL` to your app URL

### Step 3: Build Settings

- **Build Command**: `npm run build`
- **Run Command**: `npm start`
- **HTTP Port**: `3000`

### Step 4: Deploy

1. Review settings
2. Click **Create Resources**
3. Wait for deployment

### Step 5: Update Azure AD

Add DigitalOcean app URL to redirect URIs.

---

## Docker Deployment

### Dockerfile

```dockerfile
FROM node:18-alpine AS base

# Install dependencies
FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Build application
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
```

### docker-compose.yml

```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - AZURE_AD_CLIENT_ID=${AZURE_AD_CLIENT_ID}
      - AZURE_AD_CLIENT_SECRET=${AZURE_AD_CLIENT_SECRET}
      - AZURE_AD_TENANT_ID=${AZURE_AD_TENANT_ID}
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
      - NEXTAUTH_URL=${NEXTAUTH_URL}
    restart: unless-stopped
```

### Deploy

```bash
# Build
docker build -t bookingroom .

# Run
docker run -p 3000:3000 \
  -e AZURE_AD_CLIENT_ID=xxx \
  -e AZURE_AD_CLIENT_SECRET=xxx \
  -e AZURE_AD_TENANT_ID=xxx \
  -e NEXTAUTH_SECRET=xxx \
  -e NEXTAUTH_URL=http://localhost:3000 \
  bookingroom

# Or use Docker Compose
docker-compose up -d
```

---

## Environment Variables Checklist

Before deployment, ensure all these are set:

- [ ] `AZURE_AD_CLIENT_ID` - From Azure AD app
- [ ] `AZURE_AD_CLIENT_SECRET` - From Azure AD app
- [ ] `AZURE_AD_TENANT_ID` - Your Azure tenant ID
- [ ] `NEXTAUTH_SECRET` - Random secret (generate new for prod)
- [ ] `NEXTAUTH_URL` - Your production URL (must match redirect URI)

---

## Post-Deployment Checklist

- [ ] Application loads without errors
- [ ] Sign in redirects to Microsoft login
- [ ] After sign-in, redirects back to app
- [ ] Rooms list loads
- [ ] Can create bookings
- [ ] Teams meeting links generate
- [ ] Can edit/delete bookings
- [ ] Token expiration handled gracefully
- [ ] Mobile responsive works
- [ ] Dark mode works

---

## Common Issues

### "Redirect URI mismatch"

**Problem:** Azure AD shows redirect URI error

**Solution:**
1. Check `NEXTAUTH_URL` matches exactly
2. Ensure redirect URI in Azure AD includes `/api/auth/callback/azure-ad`
3. Don't forget the protocol (`https://`)

### "Invalid client secret"

**Problem:** Authentication fails silently

**Solution:**
1. Verify `AZURE_AD_CLIENT_SECRET` is correct
2. Secret may have expired - generate new one
3. Ensure no extra spaces in environment variable

### Build fails

**Problem:** `npm run build` fails

**Solution:**
1. Check Node.js version (18+)
2. Delete `.next` and `node_modules`
3. Run `npm install` again
4. Fix TypeScript errors if any

### 500 errors after deployment

**Problem:** All pages return 500

**Solution:**
1. Check serverless function logs
2. Verify all environment variables are set
3. Ensure Azure AD permissions are granted
4. Check Microsoft Graph API is accessible

---

## Performance Optimization

### Enable Caching

```javascript
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/api/rooms',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=3600, stale-while-revalidate=86400',
          },
        ],
      },
    ];
  },
};
```

### Image Optimization

If adding images:
```javascript
import Image from 'next/image';

<Image
  src="/meeting-room.jpg"
  alt="Meeting Room"
  width={800}
  height={600}
  priority
/>
```

### Database for Sessions (Optional)

For high traffic, use database adapter:

```bash
npm install @auth/prisma-adapter @prisma/client
```

---

## Monitoring

### Vercel Analytics

```bash
npm install @vercel/analytics
```

```javascript
// app/layout.tsx
import { Analytics } from '@vercel/analytics/react';

export default function Layout({ children }) {
  return (
    <>
      {children}
      <Analytics />
    </>
  );
}
```

### Error Tracking (Sentry)

```bash
npm install @sentry/nextjs
```

```javascript
// sentry.client.config.js
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
});
```

---

## Security Hardening

### Security Headers

```javascript
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
        ],
      },
    ];
  },
};
```

### HTTPS Only

Always use HTTPS in production. Most platforms handle this automatically.

---

## Backup Strategy

1. **Code**: Version control (Git)
2. **Configuration**: Document all environment variables
3. **Azure AD**: Export app registration settings
4. **Database**: If using database for sessions, set up automated backups

---

## Scaling Considerations

For high traffic:

1. **Serverless Functions**: Automatically scale on Vercel/Netlify
2. **Database Connection Pooling**: If using database
3. **CDN**: For static assets (automatic on Vercel)
4. **Rate Limiting**: Implement API rate limiting
5. **Caching**: Redis for session storage

---

## Support

For deployment issues:
- Check platform-specific documentation
- Review build logs
- Test locally first with `npm run build && npm start`
- Verify environment variables
- Check Azure AD configuration

---

**Production deployment requires careful attention to environment variables and Azure AD configuration. Always test thoroughly before going live!**
