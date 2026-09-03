#!/bin/bash
set -euo pipefail

DEPLOYPATH="/home/c2852916c/queenofexcellence"
LOG="$DEPLOYPATH/deploy.log"

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG"
}

log "=== Déploiement Queen of Excellence (SQLite) ==="
mkdir -p "$DEPLOYPATH"
tar --exclude=node_modules --exclude=.git --exclude=deploy.log --exclude='prisma/*.db' -cf - . | tar -C "$DEPLOYPATH" -xf -

cd "$DEPLOYPATH"
export NODE_ENV=production
export DATABASE_URL="${DATABASE_URL:-file:./data.db}"
export NODE_OPTIONS="${NODE_OPTIONS:---max-old-space-size=512}"

log "npm install..."
npm install --no-audit --no-fund 2>&1 | tee -a "$LOG"

log "Build Next.js..."
npm run build 2>&1 | tee -a "$LOG"

log "Prisma db push..."
npx prisma db push 2>&1 | tee -a "$LOG"

log "Seed..."
npx prisma db seed 2>&1 | tee -a "$LOG" || true

npm prune --omit=dev 2>&1 | tee -a "$LOG"
log "=== Terminé ==="
