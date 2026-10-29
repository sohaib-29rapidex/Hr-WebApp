#!/bin/bash
# Pull the latest version from GitHub and restart the portal if anything changed.
APP=/opt/rapidex-attendance
cd "$APP" || exit 1
OLD=$(sudo -u attendance git rev-parse HEAD)
sudo -u attendance git fetch -q origin || exit 0
sudo -u attendance git reset -q --hard "origin/$(sudo -u attendance git rev-parse --abbrev-ref HEAD)"
NEW=$(sudo -u attendance git rev-parse HEAD)
if [ "$OLD" != "$NEW" ]; then
  if ! git diff --quiet "$OLD" "$NEW" -- requirements.txt; then
    sudo -u attendance "$APP/venv/bin/pip" install -q -r requirements.txt
  fi
  systemctl restart rapidex-attendance
  echo "$(date '+%F %T') deployed $NEW" >> /var/lib/attendance/deploy.log
fi
