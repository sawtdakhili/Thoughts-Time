# Self-Hosting Thoughts & Time

Complete guide for self-hosting **Thoughts & Time** with Docker and Supabase.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Configuration](#configuration)
- [Deployment Options](#deployment-options)
- [Backup & Restore](#backup--restore)
- [Troubleshooting](#troubleshooting)
- [Security](#security)
- [Updating](#updating)

---

## Prerequisites

- **Docker** 20.10+ and **Docker Compose** 2.0+
- **2GB RAM** minimum (4GB recommended)
- **10GB disk space** minimum
- **Domain name** (optional, but recommended for SSL)

### Check Prerequisites

```bash
docker --version
docker-compose --version
```

---

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/thoughts-time.git
cd thoughts-time
```

### 2. Configure Environment

```bash
# Copy example environment file
cp .env.example .env

# Generate JWT secret (required)
openssl rand -base64 32

# Edit .env and set:
# - JWT_SECRET (from command above)
# - POSTGRES_PASSWORD (strong password)
# - SITE_URL (your domain or http://localhost:3000)
```

### 3. Generate Supabase Keys

The Supabase keys in `.env.example` are sample keys. For production, generate your own:

```bash
# Install jose-jwt if not already installed
npm install -g jose-jwt

# Generate ANON key (for client-side)
jose-jwt encode \
  --secret "YOUR_JWT_SECRET_HERE" \
  --alg HS256 \
  --payload '{"role":"anon","iat":1641769200,"exp":1799535600}'

# Generate SERVICE_ROLE key (for server-side)
jose-jwt encode \
  --secret "YOUR_JWT_SECRET_HERE" \
  --alg HS256 \
  --payload '{"role":"service_role","iat":1641769200,"exp":1799535600}'
```

Update these values in `.env`:
- `SUPABASE_ANON_KEY` and `VITE_SUPABASE_ANON_KEY` (use anon key)
- `SUPABASE_SERVICE_KEY` (use service_role key)

### 4. Start Services

```bash
# Start all services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f app
```

### 5. Access Your Instance

- **Application**: http://localhost:3000
- **Supabase Studio** (Admin UI): http://localhost:3001
- **API Gateway**: http://localhost:8000

---

## Configuration

### Environment Variables

Edit `.env` to customize your deployment. Key variables:

| Variable | Required | Description | Default |
|----------|----------|-------------|---------|
| `POSTGRES_PASSWORD` | ✅ | Database password | - |
| `JWT_SECRET` | ✅ | JWT signing secret (32+ chars) | - |
| `SITE_URL` | ✅ | Your app URL | `http://localhost:3000` |
| `APP_PORT` | ❌ | Application port | `3000` |
| `POSTGRES_PORT` | ❌ | Database port | `5432` |
| `STUDIO_PORT` | ❌ | Supabase Studio port | `3001` |
| `MAILER_AUTOCONFIRM` | ❌ | Skip email confirmation | `false` |

### Email Configuration (Optional)

For user email confirmations, configure SMTP:

```bash
SMTP_ADMIN_EMAIL=admin@example.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_SENDER_NAME=Thoughts & Time
```

**Gmail Setup**:
1. Enable 2FA on your Google account
2. Generate an [App Password](https://support.google.com/accounts/answer/185833)
3. Use the app password for `SMTP_PASS`

---

## Deployment Options

### Option 1: Local Development

```bash
# Use localhost URLs
SITE_URL=http://localhost:3000
VITE_SUPABASE_URL=http://localhost:8000
```

### Option 2: VPS with Domain

```bash
# Configure with your domain
SITE_URL=https://thoughts.example.com
VITE_SUPABASE_URL=https://api.thoughts.example.com

# Use reverse proxy (Nginx, Caddy, Traefik)
# See docs/reverse-proxy-examples.md
```

### Option 3: Behind Reverse Proxy

Example Nginx configuration:

```nginx
# /etc/nginx/sites-available/thoughts-time

server {
    listen 80;
    server_name thoughts.example.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

server {
    listen 80;
    server_name api.thoughts.example.com;

    location / {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable SSL with Let's Encrypt:

```bash
sudo certbot --nginx -d thoughts.example.com -d api.thoughts.example.com
```

---

## Backup & Restore

### Automated Backups

```bash
# Create backup
./scripts/backup.sh

# Backups are stored in ./backups/
# Retention: 30 days (configurable via BACKUP_RETENTION_DAYS)
```

### Schedule Daily Backups

Add to crontab:

```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * cd /path/to/thoughts-time && ./scripts/backup.sh >> /var/log/thoughts-time-backup.log 2>&1
```

### Restore from Backup

```bash
# List available backups
ls -lh ./backups/

# Restore specific backup
./scripts/restore.sh ./backups/thoughts-time-backup-20240115_020000.sql.gz

# Confirm when prompted
```

### Manual Database Access

```bash
# Enter PostgreSQL shell
docker exec -it thoughts-time-db psql -U postgres

# Export data manually
docker exec thoughts-time-db pg_dump -U postgres postgres > backup.sql

# Import data manually
cat backup.sql | docker exec -i thoughts-time-db psql -U postgres
```

---

## Troubleshooting

### Services Won't Start

```bash
# Check logs
docker-compose logs

# Restart services
docker-compose restart

# Rebuild if needed
docker-compose up -d --build
```

### Database Connection Issues

```bash
# Check if database is healthy
docker-compose ps

# Restart database
docker-compose restart supabase-db

# Check database logs
docker-compose logs supabase-db
```

### Authentication Not Working

1. Verify JWT_SECRET matches in all services
2. Check SUPABASE_ANON_KEY is correctly generated
3. Ensure SITE_URL matches your actual URL
4. Check browser console for CORS errors

### App Shows Blank Page

1. Check browser console for errors
2. Verify environment variables are set correctly
3. Rebuild application: `docker-compose up -d --build app`
4. Clear browser cache

### Storage Issues

```bash
# Check disk space
df -h

# Clean up old Docker images
docker system prune -a

# Clean up old backups
find ./backups -name "*.sql.gz" -mtime +30 -delete
```

---

## Security

### Production Checklist

- [ ] Change all default passwords
- [ ] Generate unique JWT_SECRET (32+ characters)
- [ ] Enable SSL/TLS with valid certificate
- [ ] Set `MAILER_AUTOCONFIRM=false` in production
- [ ] Configure firewall (allow only 80/443)
- [ ] Set up automated backups
- [ ] Enable Docker log rotation
- [ ] Review Supabase RLS policies
- [ ] Set strong POSTGRES_PASSWORD
- [ ] Restrict Supabase Studio access (use SSH tunnel)

### Firewall Configuration

```bash
# UFW example
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 22/tcp
sudo ufw enable
```

### SSH Tunnel for Studio

Instead of exposing Studio port, use SSH tunnel:

```bash
# From local machine
ssh -L 3001:localhost:3001 user@your-server

# Access Studio at http://localhost:3001
```

### Secrets Management

**Never commit `.env` to version control!**

```bash
# Verify .gitignore includes .env
cat .gitignore | grep "\.env"

# Check if .env is tracked
git status
```

---

## Updating

### Update Application

```bash
# Pull latest code
git pull origin main

# Rebuild and restart
docker-compose up -d --build app

# Check logs
docker-compose logs -f app
```

### Update Supabase Services

```bash
# Edit docker-compose.yml
# Update image versions for supabase-* services

# Pull new images
docker-compose pull

# Restart services
docker-compose up -d
```

### Database Migrations

```bash
# Automatic migrations run on startup via init-db.sql
# For manual migrations:
docker exec -i thoughts-time-db psql -U postgres < migrations/new-migration.sql
```

---

## Architecture

### Services Overview

| Service | Port | Description |
|---------|------|-------------|
| **app** | 3000 | React frontend (Nginx) |
| **supabase-db** | 5432 | PostgreSQL database |
| **supabase-studio** | 3001 | Admin UI |
| **supabase-auth** | 9999 | Authentication (GoTrue) |
| **supabase-rest** | 3000 | REST API (PostgREST) |
| **supabase-realtime** | 4000 | Realtime subscriptions |
| **supabase-storage** | 5000 | File storage |
| **supabase-kong** | 8000 | API Gateway |

### Data Persistence

Volumes:
- `supabase-db-data` - PostgreSQL data
- `supabase-storage-data` - User uploads
- `./backups` - Database backups

---

## Support

- **Documentation**: https://github.com/yourusername/thoughts-time
- **Issues**: https://github.com/yourusername/thoughts-time/issues
- **License**: AGPL-3.0

---

## License

This project is licensed under the **GNU Affero General Public License v3.0 (AGPL-3.0)**.

**Self-Hosting Requirements**:
- ✅ You can self-host for personal or commercial use
- ✅ No attribution required for private deployments
- ⚠️  If you modify and offer as a network service, you must share source code
- ⚠️  Modifications must be licensed under AGPL-3.0

See [LICENSE](LICENSE) and [NOTICE](NOTICE) for complete terms.

---

**Copyright 2025 Sawt Dakhili**
