#!/bin/bash
set -euo pipefail

DEPLOYPATH="${DEPLOYPATH:-/home/c2852916c/queenofexcellence}"
LOG="$DEPLOYPATH/deploy.log"

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG"
}

log "=== Déploiement Queen of Excellence (MySQL) ==="
mkdir -p "$DEPLOYPATH"
tar --exclude=node_modules --exclude=.git --exclude=deploy.log -cf - . | tar -C "$DEPLOYPATH" -xf -

cd "$DEPLOYPATH"
export NODE_ENV=production
export NODE_OPTIONS="${NODE_OPTIONS:---max-old-space-size=512}"

log "npm install..."
npm install --omit=dev --no-audit --no-fund 2>&1 | tee -a "$LOG"

log "=== Terminé (base MySQL : importer database/*.sql via phpMyAdmin) ==="
