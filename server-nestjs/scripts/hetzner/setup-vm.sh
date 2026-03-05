#!/bin/bash
set -euo pipefail

# =============================================================
# Hetzner Cloud VM Setup Script
# For: CAX21 ARM (4 vCPU, 8GB RAM, Ubuntu 22.04 aarch64)
# Usage: chmod +x setup-vm.sh && sudo ./setup-vm.sh
# =============================================================

echo "=== PingUp: Hetzner Cloud VM Setup ==="

# --- Update system ---
echo "[1/6] Updating system packages..."
apt-get update && apt-get upgrade -y

# --- Install Docker ---
echo "[2/6] Installing Docker..."
apt-get install -y ca-certificates curl gnupg lsb-release

install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg

echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

apt-get update
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Add current user to docker group
usermod -aG docker "${SUDO_USER:-root}"

# --- Install Certbot ---
echo "[3/6] Installing Certbot (Let's Encrypt)..."
apt-get install -y certbot

# --- Configure UFW firewall ---
echo "[4/6] Configuring firewall (ufw)..."
apt-get install -y ufw
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp   # SSH
ufw allow 80/tcp   # HTTP
ufw allow 443/tcp  # HTTPS
ufw --force enable

# --- Create app directory ---
echo "[5/6] Creating application directory..."
mkdir -p /opt/pingup/ssl
chown -R "${SUDO_USER:-root}":"${SUDO_USER:-root}" /opt/pingup

# --- Setup swap (2GB) ---
echo "[6/6] Setting up 2GB swap..."
if [ ! -f /swapfile ]; then
    fallocate -l 2G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
    # Only use swap when memory is low
    sysctl vm.swappiness=10
    echo 'vm.swappiness=10' >> /etc/sysctl.conf
    echo "Swap enabled (2GB)"
else
    echo "Swap already exists, skipping"
fi

# --- Docker log rotation ---
echo "Configuring Docker log rotation..."
cat > /etc/docker/daemon.json <<'EOF'
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "50m",
    "max-file": "3"
  }
}
EOF
systemctl restart docker

echo ""
echo "=== Setup Complete! ==="
echo ""
echo "Next steps:"
echo "  1. Log out and back in (for docker group)"
echo "  2. Point your domain DNS (A record) to this VM's public IP"
echo "  3. Run setup-ssl.sh to get SSL certificate"
echo "  4. Copy .env.hetzner.example to /opt/pingup/.env.production and fill in secrets"
echo "  5. Run deploy.sh to start the application"
