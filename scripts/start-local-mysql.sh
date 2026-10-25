#!/usr/bin/env bash
# Démarre MariaDB embarqué pour le dev local (sans sudo)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DATADIR="$ROOT/.local/mysql"
SOCKET="$ROOT/.local/mysql.sock"
PIDFILE="$ROOT/.local/mysql.pid"
PORT=3307
LOG="$ROOT/.local/mysql.log"

mkdir -p "$ROOT/.local"

if [ ! -f "$DATADIR/ibdata1" ]; then
  echo "→ Initialisation MariaDB dans .local/mysql ..."
  mariadb-install-db --datadir="$DATADIR" --auth-root-authentication-method=normal --skip-test-db
fi

if [ -f "$PIDFILE" ] && kill -0 "$(cat "$PIDFILE")" 2>/dev/null; then
  echo "MariaDB local déjà actif (PID $(cat "$PIDFILE"), port $PORT)"
  exit 0
fi

echo "→ Démarrage MariaDB local (port $PORT) ..."
nohup /usr/sbin/mariadbd \
  --datadir="$DATADIR" \
  --port="$PORT" \
  --socket="$SOCKET" \
  --pid-file="$PIDFILE" \
  --bind-address=127.0.0.1 \
  >>"$LOG" 2>&1 &

for _ in $(seq 1 20); do
  if mariadb --socket="$SOCKET" -u root -e "SELECT 1" >/dev/null 2>&1; then
    echo "MariaDB prêt sur mysql://root@127.0.0.1:$PORT/queenofexcellence"
    exit 0
  fi
  sleep 0.5
done

echo "Échec démarrage MariaDB — voir $LOG"
exit 1
