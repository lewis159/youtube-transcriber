#!/bin/bash

# Determine if this is master or backup from environment variable
HA_ROLE=${HA_ROLE:-BACKUP}
echo "HA_ROLE: $HA_ROLE"

if [ "$HA_ROLE" = "MASTER" ]; then
  echo "Configuring as MASTER"
  cp /etc/keepalived/keepalived-master.conf /etc/keepalived/keepalived.conf
else
  echo "Configuring as BACKUP"
  cp /etc/keepalived/keepalived-backup.conf /etc/keepalived/keepalived.conf
fi

# Verify config was copied
if [ ! -f /etc/keepalived/keepalived.conf ]; then
  echo "ERROR: Config file not found!"
  exit 1
fi

echo "Config file ready, first 5 lines:"
head -5 /etc/keepalived/keepalived.conf

# Start nginx in background
echo "Starting nginx..."
nginx -g "daemon off;" &
NGINX_PID=$!
echo "Nginx started with PID $NGINX_PID"

# Give nginx time to start
sleep 2

# Start keepalived in foreground
echo "Starting keepalived..."
exec keepalived -f /etc/keepalived/keepalived.conf -n -l
