# 🚀 Backend Deployment Guide - The Explorerz

Complete step-by-step guide to deploy The Explorerz backend to production.

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Deployment Options](#deployment-options)
3. [Option 1: Deploy to Railway](#option-1-deploy-to-railway-recommended)
4. [Option 2: Deploy to Render](#option-2-deploy-to-render)
5. [Option 3: Deploy to DigitalOcean](#option-3-deploy-to-digitalocean)
6. [Option 4: Deploy to AWS EC2](#option-4-deploy-to-aws-ec2)
7. [Option 5: Deploy with Docker](#option-5-deploy-with-docker)
8. [Post-Deployment Steps](#post-deployment-steps)
9. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before deploying, ensure you have:

### ✅ Required Services Setup

1. **Database**: PostgreSQL database (Neon, Supabase, or Railway)
2. **Redis**: Redis instance (Upstash, Railway, or Redis Cloud)
3. **Cloudinary**: Account for image uploads
4. **Email Service**: Gmail SMTP or SendGrid account
5. **Git Repository**: Code pushed to GitHub/GitLab

### ✅ Environment Variables Ready

Prepare these values from your `.env` file:

```env
# Database
DATABASE_URL=postgresql://user:password@host:5432/database?sslmode=require

# Redis
REDIS_URL=redis://default:password@host:port
# OR for Upstash
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token

# JWT Secrets (generate strong secrets)
JWT_ACCESS_SECRET=your-32-char-secret-here
JWT_REFRESH_SECRET=your-32-char-secret-here

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=your-email@gmail.com
ADMIN_EMAIL=admin@yourdomain.com

# CORS (add your frontend URL)
CORS_ORIGINS=https://your-frontend.com
```

---

## Deployment Options

Choose the platform that best fits your needs:

| Platform | Difficulty | Cost | Best For |
|----------|-----------|------|----------|
| **Railway** | ⭐ Easy | $5-20/mo | Quick deployment, auto-scaling |
| **Render** | ⭐ Easy | Free-$7/mo | Free tier available |
| **DigitalOcean** | ⭐⭐ Medium | $12-24/mo | Full control, droplets |
| **AWS EC2** | ⭐⭐⭐ Advanced | $10-50/mo | Enterprise, scalability |
| **Docker** | ⭐⭐ Medium | Varies | Any VPS/cloud |

---

## Option 1: Deploy to Railway (Recommended)

Railway offers the easiest deployment with automatic builds and scaling.

### Step 1: Setup Railway Account

1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub
3. Click **"New Project"**

### Step 2: Deploy Backend

1. **Create New Project**
   - Click **"Deploy from GitHub repo"**
   - Select your repository
   - Choose the `server` folder as root directory

2. **Add PostgreSQL Database**
   - Click **"+ New"** → **"Database"** → **"PostgreSQL"**
   - Railway will create a database and provide `DATABASE_URL`

3. **Add Redis**
   - Click **"+ New"** → **"Database"** → **"Redis"**
   - Railway will provide `REDIS_URL`

### Step 3: Configure Environment Variables

1. Click on your backend service
2. Go to **"Variables"** tab
3. Add all environment variables:

```env
NODE_ENV=production
PORT=3001
DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}
JWT_ACCESS_SECRET=your-secret-here
JWT_REFRESH_SECRET=your-secret-here
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=your-email@gmail.com
ADMIN_EMAIL=admin@yourdomain.com
CORS_ORIGINS=https://your-frontend.com
LOG_LEVEL=info
```

### Step 4: Configure Build Settings

1. Go to **"Settings"** tab
2. Set **Root Directory**: `server`
3. Set **Build Command**: `npm run build && npx prisma generate && npx prisma migrate deploy`
4. Set **Start Command**: `npm start`
5. Click **"Deploy"**

### Step 5: Setup Custom Domain (Optional)

1. Go to **"Settings"** → **"Domains"**
2. Click **"Generate Domain"** or add custom domain
3. Update `CORS_ORIGINS` with your domain

### ✅ Railway Deployment Complete!

Your backend will be live at: `https://your-app.railway.app`

---

## Option 2: Deploy to Render

Render offers a free tier perfect for testing.

### Step 1: Setup Render Account

1. Go to [render.com](https://render.com)
2. Sign up with GitHub
3. Click **"New +"** → **"Web Service"**

### Step 2: Connect Repository

1. Select your GitHub repository
2. Configure service:
   - **Name**: `explorerz-backend`
   - **Region**: Choose closest to your users
   - **Branch**: `main`
   - **Root Directory**: `server`
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build && npx prisma generate && npx prisma migrate deploy`
   - **Start Command**: `npm start`

### Step 3: Setup Database

1. Click **"New +"** → **"PostgreSQL"**
2. Name it `explorerz-db`
3. Choose plan (Free tier available)
4. Copy the **Internal Database URL**

### Step 4: Setup Redis

**Option A: Use Upstash (Recommended)**
1. Go to [upstash.com](https://upstash.com)
2. Create Redis database
3. Copy REST URL and Token

**Option B: Use Redis Cloud**
1. Go to [redis.com/cloud](https://redis.com/try-free/)
2. Create free database
3. Copy connection URL

### Step 5: Add Environment Variables

In Render dashboard, go to **"Environment"** tab:

```env
NODE_ENV=production
PORT=3001
DATABASE_URL=[paste-internal-database-url]
REDIS_URL=[paste-redis-url]
# OR for Upstash
UPSTASH_REDIS_REST_URL=[paste-upstash-url]
UPSTASH_REDIS_REST_TOKEN=[paste-upstash-token]
JWT_ACCESS_SECRET=your-secret-here
JWT_REFRESH_SECRET=your-secret-here
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=your-email@gmail.com
ADMIN_EMAIL=admin@yourdomain.com
CORS_ORIGINS=https://your-frontend.com
LOG_LEVEL=info
```

### Step 6: Deploy

1. Click **"Create Web Service"**
2. Wait for build to complete (5-10 minutes)
3. Your API will be live at: `https://your-app.onrender.com`

### ⚠️ Render Free Tier Notes

- Service spins down after 15 minutes of inactivity
- First request after spin-down takes 30-60 seconds
- Upgrade to paid plan ($7/mo) for always-on service

---

## Option 3: Deploy to DigitalOcean

DigitalOcean provides full control with droplets (VPS).

### Step 1: Create Droplet

1. Go to [digitalocean.com](https://digitalocean.com)
2. Click **"Create"** → **"Droplets"**
3. Choose:
   - **Image**: Ubuntu 22.04 LTS
   - **Plan**: Basic ($12/mo - 2GB RAM recommended)
   - **Region**: Closest to your users
   - **Authentication**: SSH Key (recommended)
4. Click **"Create Droplet"**

### Step 2: Connect to Droplet

```bash
ssh root@your-droplet-ip
```

### Step 3: Install Dependencies

```bash
# Update system
apt update && apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Install PostgreSQL
apt install -y postgresql postgresql-contrib

# Install Redis
apt install -y redis-server

# Install Nginx
apt install -y nginx

# Install PM2 (process manager)
npm install -g pm2
```

### Step 4: Setup PostgreSQL

```bash
# Switch to postgres user
sudo -u postgres psql

# Create database and user
CREATE DATABASE explorerz_db;
CREATE USER explorerz_user WITH PASSWORD 'your-secure-password';
GRANT ALL PRIVILEGES ON DATABASE explorerz_db TO explorerz_user;
\q
```

### Step 5: Setup Application

```bash
# Create app directory
mkdir -p /var/www/explorerz-backend
cd /var/www/explorerz-backend

# Clone repository
git clone https://github.com/your-username/your-repo.git .
cd server

# Install dependencies
npm install

# Create .env file
nano .env
```

Paste your environment variables:

```env
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://explorerz_user:your-secure-password@localhost:5432/explorerz_db
REDIS_URL=redis://localhost:6379
JWT_ACCESS_SECRET=your-secret-here
JWT_REFRESH_SECRET=your-secret-here
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=your-email@gmail.com
ADMIN_EMAIL=admin@yourdomain.com
CORS_ORIGINS=https://your-frontend.com
LOG_LEVEL=info
```

Save with `Ctrl+X`, then `Y`, then `Enter`.

### Step 6: Build and Run Database Migrations

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Build TypeScript
npm run build
```

### Step 7: Start with PM2

```bash
# Start application
pm2 start dist/index.js --name explorerz-api

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
```

### Step 8: Configure Nginx

```bash
# Create Nginx configuration
nano /etc/nginx/sites-available/explorerz-api
```

Paste this configuration:

```nginx
server {
    listen 80;
    server_name your-domain.com;  # Replace with your domain or IP

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site:

```bash
# Create symbolic link
ln -s /etc/nginx/sites-available/explorerz-api /etc/nginx/sites-enabled/

# Test Nginx configuration
nginx -t

# Restart Nginx
systemctl restart nginx
```

### Step 9: Setup SSL with Let's Encrypt (Optional but Recommended)

```bash
# Install Certbot
apt install -y certbot python3-certbot-nginx

# Get SSL certificate
certbot --nginx -d your-domain.com

# Auto-renewal is setup automatically
```

### Step 10: Setup Firewall

```bash
# Allow SSH, HTTP, HTTPS
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw enable
```

### ✅ DigitalOcean Deployment Complete!

Your backend is now live at: `http://your-droplet-ip` or `https://your-domain.com`

---

## Option 4: Deploy to AWS EC2

AWS provides enterprise-grade infrastructure with high scalability.

### Step 1: Launch EC2 Instance

1. Go to [AWS Console](https://console.aws.amazon.com)
2. Navigate to **EC2** → **Launch Instance**
3. Configure:
   - **Name**: `explorerz-backend`
   - **AMI**: Ubuntu Server 22.04 LTS
   - **Instance Type**: `t3.small` (2GB RAM minimum)
   - **Key Pair**: Create or select existing
   - **Security Group**: Allow SSH (22), HTTP (80), HTTPS (443)
4. Click **"Launch Instance"**

### Step 2: Connect to Instance

```bash
# Download your key pair (.pem file)
chmod 400 your-key.pem
ssh -i your-key.pem ubuntu@your-ec2-public-ip
```

### Step 3: Follow DigitalOcean Steps 3-10

The setup process is identical to DigitalOcean (Steps 3-10 above).

### Step 4: Setup RDS for PostgreSQL (Optional - Recommended for Production)

1. Go to **RDS** → **Create Database**
2. Choose:
   - **Engine**: PostgreSQL
   - **Template**: Free tier or Production
   - **DB Instance**: `db.t3.micro` (free tier)
   - **Storage**: 20GB
3. Set master username and password
4. Note the endpoint URL
5. Update `DATABASE_URL` in your `.env`:

```env
DATABASE_URL=postgresql://username:password@your-rds-endpoint:5432/explorerz_db
```

### Step 5: Setup ElastiCache for Redis (Optional)

1. Go to **ElastiCache** → **Create**
2. Choose **Redis**
3. Select cluster mode and instance type
4. Note the endpoint
5. Update `REDIS_URL` in your `.env`

### ✅ AWS Deployment Complete!

---

## Option 5: Deploy with Docker

Deploy to any VPS or cloud platform using Docker.

### Step 1: Prepare Server

Ensure Docker and Docker Compose are installed:

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
apt install -y docker-compose
```

### Step 2: Clone Repository

```bash
mkdir -p /var/www/explorerz
cd /var/www/explorerz
git clone https://github.com/your-username/your-repo.git .
```

### Step 3: Create Production Environment File

```bash
nano .env
```

Add all environment variables (see Prerequisites section).

### Step 4: Update Docker Compose for Production

The existing `docker-compose.yml` is ready for production. Just ensure:

1. Strong database password
2. Correct environment variables
3. Proper CORS origins

### Step 5: Deploy

```bash
# Build and start services
docker-compose up -d --build

# Check logs
docker-compose logs -f api

# Run database migrations
docker-compose exec api npx prisma migrate deploy
```

### Step 6: Setup Nginx Reverse Proxy (Recommended)

```bash
# Install Nginx on host
apt install -y nginx

# Create configuration
nano /etc/nginx/sites-available/explorerz
```

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable site
ln -s /etc/nginx/sites-available/explorerz /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

### Step 7: Setup SSL

```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d your-domain.com
```

### ✅ Docker Deployment Complete!

---

## Post-Deployment Steps

After deploying to any platform, complete these steps:

### 1. Verify Deployment

Test your API endpoints:

```bash
# Health check
curl https://your-api-url/api/health

# Should return: {"status":"ok","timestamp":"..."}
```

### 2. Run Database Migrations

Ensure all migrations are applied:

```bash
# Railway/Render: Use their CLI or dashboard
# VPS/EC2:
cd /var/www/explorerz-backend/server
npx prisma migrate deploy
```

### 3. Seed Database (Optional)

If you have seed data:

```bash
npm run db:seed
```

### 4. Test Email Functionality

```bash
# Create test script
node server/src/scripts/test-email.ts
```

### 5. Update Frontend CORS

Update your frontend `.env` with the backend URL:

```env
VITE_API_URL=https://your-backend-url.com
```

### 6. Setup Monitoring

**Option A: Use Platform Monitoring**
- Railway/Render have built-in monitoring
- Check logs and metrics in dashboard

**Option B: Setup External Monitoring**
- [UptimeRobot](https://uptimerobot.com) - Free uptime monitoring
- [Sentry](https://sentry.io) - Error tracking
- [LogTail](https://logtail.com) - Log management

### 7. Setup Backups

**Database Backups:**

```bash
# Create backup script
nano /root/backup-db.sh
```

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump -U explorerz_user explorerz_db > /backups/db_$DATE.sql
# Keep only last 7 days
find /backups -name "db_*.sql" -mtime +7 -delete
```

```bash
chmod +x /root/backup-db.sh

# Add to crontab (daily at 2 AM)
crontab -e
# Add: 0 2 * * * /root/backup-db.sh
```

### 8. Setup CI/CD (Optional)

**GitHub Actions Example:**

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to Railway
        run: |
          npm install -g @railway/cli
          railway up --service backend
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
```

---

## Troubleshooting

### Issue: Database Connection Failed

**Solution:**
```bash
# Check DATABASE_URL format
# Should be: postgresql://user:password@host:5432/database?sslmode=require

# Test connection
psql $DATABASE_URL
```

### Issue: Redis Connection Failed

**Solution:**
```bash
# Check Redis is running
redis-cli ping
# Should return: PONG

# Check REDIS_URL format
# Should be: redis://default:password@host:port
```

### Issue: Email Not Sending

**Solution:**
```bash
# For Gmail, ensure:
# 1. 2FA is enabled
# 2. App Password is generated (not regular password)
# 3. SMTP_PORT is 587 (not 465)

# Test email
node server/src/scripts/test-email.ts
```

### Issue: CORS Errors

**Solution:**
```env
# Ensure CORS_ORIGINS includes your frontend URL
CORS_ORIGINS=https://your-frontend.com,https://www.your-frontend.com

# No trailing slashes!
```

### Issue: Build Fails

**Solution:**
```bash
# Clear cache and rebuild
rm -rf node_modules dist
npm install
npm run build
```

### Issue: Port Already in Use

**Solution:**
```bash
# Find process using port 3001
lsof -i :3001

# Kill process
kill -9 <PID>

# Or change PORT in .env
PORT=3002
```

### Issue: Out of Memory

**Solution:**
```bash
# Increase Node.js memory limit
NODE_OPTIONS=--max-old-space-size=2048 npm start

# Or upgrade server RAM
```

---

## 🎉 Deployment Complete!

Your backend is now live and ready to serve requests!

### Next Steps:

1. ✅ Deploy frontend (see `FRONTEND_DEPLOYMENT_GUIDE.md`)
2. ✅ Setup custom domain
3. ✅ Configure monitoring and alerts
4. ✅ Setup automated backups
5. ✅ Test all API endpoints
6. ✅ Load test your application

### Useful Commands:

```bash
# View logs (PM2)
pm2 logs explorerz-api

# View logs (Docker)
docker-compose logs -f api

# Restart service (PM2)
pm2 restart explorerz-api

# Restart service (Docker)
docker-compose restart api

# Update code and redeploy
git pull
npm install
npm run build
pm2 restart explorerz-api
```

---

## 📚 Additional Resources

- [Railway Documentation](https://docs.railway.app)
- [Render Documentation](https://render.com/docs)
- [DigitalOcean Tutorials](https://www.digitalocean.com/community/tutorials)
- [AWS EC2 Guide](https://docs.aws.amazon.com/ec2/)
- [Docker Documentation](https://docs.docker.com)
- [Nginx Configuration](https://nginx.org/en/docs/)
- [PM2 Documentation](https://pm2.keymetrics.io/docs/)

---

**Need Help?** Check the troubleshooting section or open an issue on GitHub.

**Happy Deploying! 🚀**
