#!/usr/bin/env bash
# Run as root after hardening.sh. Installs Hermes on the VPS.
set -euo pipefail

INSTALL_DIR="/opt/hermes"
REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"   # assumes this script is in deploy/

echo "[1/7] Installing Python 3.11 and system deps"
apt-get update -qq
apt-get install -y python3.11 python3.11-venv python3-pip git curl >/dev/null

echo "[2/7] Creating install directory"
mkdir -p "$INSTALL_DIR"
chown hermes:hermes "$INSTALL_DIR"

echo "[3/7] Syncing code"
rsync -a --delete "$REPO_DIR/src/" "$INSTALL_DIR/src/"
rsync -a "$REPO_DIR/requirements.txt" "$INSTALL_DIR/"

echo "[4/7] Creating virtualenv and installing deps"
sudo -u hermes python3.11 -m venv "$INSTALL_DIR/venv"
sudo -u hermes "$INSTALL_DIR/venv/bin/pip" install -q -r "$INSTALL_DIR/requirements.txt"

echo "[5/7] Creating config dir"
mkdir -p /etc/hermes
if [ ! -f /etc/hermes/config.yaml ]; then
    cp "$REPO_DIR/config.example.yaml" /etc/hermes/config.yaml
    echo ""
    echo "  ** Edit /etc/hermes/config.yaml and fill in your secrets, then re-run. **"
    echo ""
    exit 0
fi

echo "[6/7] Installing systemd service"
cp "$REPO_DIR/deploy/hermes.service" /etc/systemd/system/
systemctl daemon-reload
systemctl enable hermes

echo "[7/7] Starting Hermes"
systemctl restart hermes
sleep 2
systemctl status hermes --no-pager

echo ""
echo "Done. Check logs with: journalctl -u hermes -f"
echo "Dashboard (via SSH tunnel): ssh -L 8080:127.0.0.1:8080 root@$(hostname -I | awk '{print $1}')"
