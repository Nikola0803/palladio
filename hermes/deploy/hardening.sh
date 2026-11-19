#!/usr/bin/env bash
# Run once as root on the VPS.
# BEFORE running: set YOUR_PUBLIC_KEY below.
set -euo pipefail

YOUR_PUBLIC_KEY="ssh-ed25519 AAAA... your-key-here"   # EDIT THIS

echo "[1/6] Adding your SSH public key"
mkdir -p /root/.ssh
echo "$YOUR_PUBLIC_KEY" >> /root/.ssh/authorized_keys
chmod 700 /root/.ssh && chmod 600 /root/.ssh/authorized_keys

echo "[2/6] Disabling SSH password login"
sed -i 's/^#*PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config
sed -i 's/^#*ChallengeResponseAuthentication.*/ChallengeResponseAuthentication no/' /etc/ssh/sshd_config
systemctl reload sshd

echo "[3/6] Installing and configuring ufw"
apt-get install -y ufw >/dev/null
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp comment 'SSH'
ufw --force enable

echo "[4/6] Setting up unattended-upgrades"
apt-get install -y unattended-upgrades >/dev/null
dpkg-reconfigure -f noninteractive unattended-upgrades

echo "[5/6] Removing old codex-peptidebot-temporary key"
# Remove the line containing 'codex-peptidebot-temporary' from authorized_keys
sed -i '/codex-peptidebot-temporary/d' /root/.ssh/authorized_keys

echo "[6/6] Creating hermes system user"
id hermes &>/dev/null || useradd --system --no-create-home --shell /usr/sbin/nologin hermes
mkdir -p /home/hermes/.hermes
chown -R hermes:hermes /home/hermes/.hermes

echo ""
echo "Hardening complete."
echo "IMPORTANT: open a NEW SSH session to verify key login works before closing this one."
echo "ufw status:"
ufw status
