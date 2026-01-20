#!/bin/bash
# Cleanup script - chạy định kỳ để giải phóng disk space

set -e

echo "$(date '+%Y-%m-%d %H:%M:%S') - Starting cleanup..."

# 1. Xóa Docker logs cũ hơn 7 ngày
echo "Cleaning Docker container logs..."
find /var/lib/docker/containers/ -name "*.log" -mtime +7 -exec truncate -s 0 {} \; 2>/dev/null || true

# 2. Xóa dangling images và containers đã stop
echo "Cleaning unused Docker resources..."
docker system prune -f --filter "until=168h" 2>/dev/null || true

# 3. Xóa system journal logs cũ hơn 7 ngày
echo "Cleaning journal logs..."
journalctl --vacuum-time=7d 2>/dev/null || true

# 4. Xóa apt cache
echo "Cleaning apt cache..."
apt-get clean 2>/dev/null || true

# 5. Xóa tmp files cũ hơn 7 ngày
echo "Cleaning tmp files..."
find /tmp -type f -mtime +7 -delete 2>/dev/null || true

# 6. Hiển thị disk usage
echo "Current disk usage:"
df -h /

echo "$(date '+%Y-%m-%d %H:%M:%S') - Cleanup completed!"
