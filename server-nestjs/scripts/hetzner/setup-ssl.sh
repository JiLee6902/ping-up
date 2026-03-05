#!/bin/bash
set -euo pipefail

# =============================================================
# SSL Certificate Setup (Let's Encrypt)
# Usage: chmod +x setup-ssl.sh && sudo ./setup-ssl.sh your-domain.com [email]
# =============================================================

DOMAIN="${1:-}"
EMAIL="${2:-admin@${DOMAIN}}"

if [ -z "$DOMAIN" ]; then
    echo "Usage: $0 <domain> [email]"
    echo "Example: $0 api.pingup.com admin@pingup.com"
    exit 1
fi

echo "=== Setting up SSL for: $DOMAIN ==="

# Stop nginx if running (port 80 needed for standalone verification)
docker stop pingup-nginx 2>/dev/null || true

# Request certificate
echo "[1/3] Requesting certificate from Let's Encrypt..."
certbot certonly \
    --standalone \
    --preferred-challenges http \
    --agree-tos \
    --non-interactive \
    --email "$EMAIL" \
    -d "$DOMAIN"

# Copy certs to nginx mount directory
echo "[2/3] Copying certificates..."
mkdir -p /opt/pingup/ssl
cp /etc/letsencrypt/live/"$DOMAIN"/fullchain.pem /opt/pingup/ssl/fullchain.pem
cp /etc/letsencrypt/live/"$DOMAIN"/privkey.pem /opt/pingup/ssl/privkey.pem
chmod 644 /opt/pingup/ssl/fullchain.pem
chmod 600 /opt/pingup/ssl/privkey.pem

# Setup auto-renewal cron
echo "[3/3] Setting up auto-renewal..."
RENEW_SCRIPT="/opt/pingup/renew-ssl.sh"
cat > "$RENEW_SCRIPT" <<RENEW_EOF
#!/bin/bash
set -e
# Stop nginx to free port 80
docker stop pingup-nginx 2>/dev/null || true
# Renew certificate
certbot renew --quiet
# Copy renewed certs
cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem /opt/pingup/ssl/fullchain.pem
cp /etc/letsencrypt/live/$DOMAIN/privkey.pem /opt/pingup/ssl/privkey.pem
# Restart nginx
docker start pingup-nginx 2>/dev/null || true
RENEW_EOF
chmod +x "$RENEW_SCRIPT"

# Add cron job (runs at 3AM on 1st and 15th of each month)
CRON_LINE="0 3 1,15 * * $RENEW_SCRIPT >> /var/log/ssl-renew.log 2>&1"
(crontab -l 2>/dev/null | grep -v "renew-ssl" || true; echo "$CRON_LINE") | crontab -

echo ""
echo "=== SSL Setup Complete! ==="
echo ""
echo "Certificate: /opt/pingup/ssl/fullchain.pem"
echo "Private key: /opt/pingup/ssl/privkey.pem"
echo "Auto-renewal: cron every 1st and 15th at 3AM"
echo ""
echo "IMPORTANT: Update server_name in nginx.conf to: $DOMAIN"
