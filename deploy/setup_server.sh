#!/bin/bash
# RapidEx Attendance Portal - one-time server setup (Ubuntu / Debian)
# Run as root:  sudo bash setup_server.sh
# - installs Python, creates /opt/rapidex-attendance from GitHub
# - runs the portal as a service on port 8080 (starts on boot)
# - checks GitHub every 5 minutes and deploys new changes automatically
set -e
REPO="${REPO:-git@github.com:sohaib-29rapidex/Hr-WebApp.git}"
BRANCH="${BRANCH:-main}"
APP=/opt/rapidex-attendance
PORT="${PORTAL_PORT:-8080}"
[ "$EUID" -eq 0 ] || { echo "Run with sudo"; exit 1; }

echo "==> Installing packages"
apt-get update -qq && apt-get install -y -qq git python3 python3-venv python3-pip >/dev/null

id -u attendance >/dev/null 2>&1 || useradd --system --create-home --home-dir /var/lib/attendance --shell /usr/sbin/nologin attendance
KEY=/var/lib/attendance/.ssh/id_ed25519
if [ ! -f "$KEY" ]; then
  echo "==> Creating a deploy key so this server can read the private GitHub repository"
  sudo -u attendance mkdir -p /var/lib/attendance/.ssh
  sudo -u attendance ssh-keygen -q -t ed25519 -N "" -C "rapidex-attendance-server" -f "$KEY"
  sudo -u attendance sh -c 'ssh-keyscan -t ed25519 github.com >> /var/lib/attendance/.ssh/known_hosts 2>/dev/null'
fi
echo
echo "------------------------------------------------------------------"
echo " Add this key in GitHub:  repository -> Settings -> Deploy keys -> Add deploy key"
echo " Title: RapidEx server   (leave 'Allow write access' OFF)"
echo
cat "$KEY.pub"
echo "------------------------------------------------------------------"
read -r -p "Press Enter after you have added the key in GitHub... "

echo "==> Downloading the portal"
if [ ! -d "$APP/.git" ]; then
  mkdir -p "$APP" && chown attendance:attendance "$APP"
  sudo -u attendance git clone -q -b "$BRANCH" "$REPO" "$APP"
fi
sudo -u attendance python3 -m venv "$APP/venv"
sudo -u attendance "$APP/venv/bin/pip" install -q --upgrade pip
sudo -u attendance "$APP/venv/bin/pip" install -q -r "$APP/requirements.txt"
mkdir -p /var/lib/attendance/data && chown attendance:attendance /var/lib/attendance/data

echo "==> Creating services"
cat > /etc/systemd/system/rapidex-attendance.service <<SVC
[Unit]
Description=RapidEx Attendance Portal
After=network-online.target
Wants=network-online.target
[Service]
User=attendance
WorkingDirectory=$APP
Environment=PORTAL_PORT=$PORT
Environment=PORTAL_DATA=/var/lib/attendance/data
ExecStart=$APP/venv/bin/python $APP/app.py
Restart=always
RestartSec=5
[Install]
WantedBy=multi-user.target
SVC

cat > /etc/systemd/system/rapidex-attendance-update.service <<SVC
[Unit]
Description=Deploy new RapidEx Attendance changes from GitHub
[Service]
Type=oneshot
ExecStart=/bin/bash $APP/deploy/update.sh
SVC

cat > /etc/systemd/system/rapidex-attendance-update.timer <<SVC
[Unit]
Description=Check GitHub for RapidEx Attendance updates every 5 minutes
[Timer]
OnBootSec=2min
OnUnitActiveSec=5min
[Install]
WantedBy=timers.target
SVC

systemctl daemon-reload
systemctl enable --now rapidex-attendance rapidex-attendance-update.timer
if command -v ufw >/dev/null && ufw status | grep -q active; then ufw allow "$PORT"/tcp >/dev/null; fi

IP=$(curl -s --max-time 5 ifconfig.me || hostname -I | awk '{print $1}')
echo
echo "=================================================================="
echo " Portal running:  http://$IP:$PORT   (create the admin login)"
echo " Updates from GitHub are applied automatically every 5 minutes."
echo " Logs:     journalctl -u rapidex-attendance -f"
echo " Data:     /var/lib/attendance/data   (back this folder up)"
echo "=================================================================="
