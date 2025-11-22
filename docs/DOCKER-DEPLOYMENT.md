# Docker Deployment Guide

## 🐳 Using Docker

### Method 1: Docker Compose (Recommended)

#### 1. Prerequisites

Make sure you have `.env.local` configured with correct values:
```env
AZURE_AD_CLIENT_ID=your_actual_client_id
AZURE_AD_CLIENT_SECRET=your_actual_secret
AZURE_AD_TENANT_ID=your_actual_tenant_id
NEXTAUTH_SECRET=your_random_secret_32chars_minimum
NEXTAUTH_URL=http://localhost:3000

# Teams Bot (Optional)
TEAMS_BOT_APP_ID=your_bot_app_id
TEAMS_BOT_APP_PASSWORD=your_bot_password
```

> **Note:** Docker Compose uses the same `.env.local` file as development. No need for separate env files!

#### 2. Build and Run

```bash
# Build image
docker-compose build

# Start container
docker-compose up -d

# View logs
docker-compose logs -f

# Stop container
docker-compose down
```

#### 3. Access Application

Open browser: http://localhost:3000

---

### Method 2: Docker CLI

#### Build Image

```bash
docker build -t bookingroom-app .
```

#### Run Container

```bash
docker run -d \
  -p 3000:3000 \
  --name bookingroom \
  --env-file .env.local \
  bookingroom-app
```

#### Manage Container

```bash
# View logs
docker logs -f bookingroom

# Stop container
docker stop bookingroom

# Start container
docker start bookingroom

# Remove container
docker rm -f bookingroom
```

---

## 🚀 Production Deployment

### Using Docker Compose for Production

1. **Update `.env.local`:**
   ```env
   NEXTAUTH_URL=https://your-domain.com
   NODE_ENV=production
   ```

2. **Deploy:**
   ```bash
   docker-compose up -d
   ```

### With Nginx Reverse Proxy

Create `nginx.conf`:
```nginx
upstream bookingroom {
    server bookingroom-app:3000;
}

server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://bookingroom;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Update `docker-compose.yml` to add nginx:
```yaml
services:
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/conf.d/default.conf
    depends_on:
      - bookingroom-app
    networks:
      - bookingroom-network
```

---

## 🔍 Health Check

The application is monitored via health checks:
- Docker Compose checks health every 30 seconds
- Automatic container restart if unhealthy

---

## 📦 Multi-stage Build

The Dockerfile uses multi-stage build to:
- ✅ Reduce image size (only necessary files)
- ✅ Improve security (no source code in production)
- ✅ Optimize build time (cache dependencies)

**Approximate sizes:**
- Development: ~1.5 GB
- Production: ~200-300 MB

---

## 🔐 Best Practices

### 1. Use Secrets Securely

**Don't:**
```bash
# Don't hardcode in Dockerfile!
ENV AZURE_AD_CLIENT_SECRET=abc123
```

**Do:**
```bash
# Use environment variables from .env.local
env_file:
  - .env.local
```

### 2. Use .dockerignore

The `.dockerignore` file helps:
- Reduce build time
- Reduce image size
- Prevent unnecessary files in image

### 3. Update Images Regularly

```bash
# Pull latest base image
docker pull node:18-alpine

# Rebuild with no cache
docker-compose build --no-cache
```

---

## 🛠️ Troubleshooting

### Container Won't Start

**Check logs:**
```bash
docker-compose logs bookingroom-app
```

**Common issues:**
- Environment variables not set in `.env.local`
- Port 3000 already in use
- Next.js build failed

### Health Check Failed

```bash
# Enter container
docker exec -it bookingroom sh

# Check process
ps aux | grep node

# Test application
wget -O- http://localhost:3000/
```

### Memory Issues

Add memory limit in `docker-compose.yml`:
```yaml
services:
  bookingroom-app:
    mem_limit: 1g
    memswap_limit: 1g
```

---

## 📊 Monitoring

### Docker Stats

```bash
# View resource usage
docker stats bookingroom

# Or for compose services
docker-compose stats
```

### Logs

```bash
# Real-time logs
docker-compose logs -f

# Last 100 lines
docker-compose logs --tail=100

# Logs with timestamps
docker-compose logs -t
```

---

## 🔄 Updates

### Rolling Update (Zero Downtime)

```bash
# Build new image
docker-compose build

# Update without downtime
docker-compose up -d --no-deps --build bookingroom-app
```

### Backup Before Update

```bash
# Export container
docker export bookingroom > bookingroom-backup.tar

# Or save image
docker save bookingroom-app:latest > bookingroom-image.tar
```

---

## 📝 Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `AZURE_AD_CLIENT_ID` | ✅ | Azure AD Application ID |
| `AZURE_AD_CLIENT_SECRET` | ✅ | Azure AD Client Secret |
| `AZURE_AD_TENANT_ID` | ✅ | Azure AD Tenant ID |
| `NEXTAUTH_SECRET` | ✅ | NextAuth secret (min 32 chars) |
| `NEXTAUTH_URL` | ✅ | Application URL |
| `TEAMS_BOT_APP_ID` | ❌ | Teams Bot App ID (optional) |
| `TEAMS_BOT_APP_PASSWORD` | ❌ | Teams Bot Password (optional) |

**All variables are configured in `.env.local`** - same file used for development!

---

## 🌐 Deploy to Cloud

### Azure Container Instances

```bash
az container create \
  --resource-group bookingroom-rg \
  --name bookingroom \
  --image bookingroom-app:latest \
  --dns-name-label bookingroom \
  --ports 3000 \
  --environment-variables \
    AZURE_AD_CLIENT_ID=$CLIENT_ID \
    NEXTAUTH_URL=https://bookingroom.azurecontainer.io
```

### AWS ECS / Google Cloud Run

See platform-specific deployment documentation.

---

## ✅ Pre-deployment Checklist

- [ ] `.env.local` configured with all variables
- [ ] Test locally with `docker-compose up`
- [ ] Health check passes
- [ ] Update `NEXTAUTH_URL` to production URL
- [ ] Setup SSL/TLS certificate (for production)
- [ ] Configure resource limits
- [ ] Setup backup strategy
- [ ] Configure monitoring & logging

---

## 🎯 Quick Commands Reference

```bash
# Development
docker-compose up -d              # Start
docker-compose logs -f            # View logs
docker-compose down              # Stop

# Production
docker-compose -f docker-compose.yml up -d

# Maintenance
docker-compose build --no-cache  # Rebuild
docker-compose restart           # Restart
docker system prune -a           # Clean up
```

---

**Docker deployment ready! 🐳**
