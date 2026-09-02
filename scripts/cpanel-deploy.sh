#!/bin/bash
# Script de déploiement cPanel LWS — une seule session bash pour éviter les timeouts silencieux.
set -euo pipefail

DEPLOYPATH="/home/c2852916c/public_html"
REPO_DIR="$(pwd)"
LOG="$DEPLOYPATH/deploy.log"

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG"
}

log "=== Déploiement Queen of Excellence ==="
log "Repo: $REPO_DIR"
log "Cible: $DEPLOYPATH"

# Copie des fichiers (sans node_modules ni .next)
log "Copie des fichiers..."
mkdir -p "$DEPLOYPATH"
tar --exclude=node_modules --exclude=.next --exclude=.git --exclude=deploy.log -cf - . | tar -C "$DEPLOYPATH" -xf -

cd "$DEPLOYPATH"

# Vérifier Node.js
log "Node: $(node -v 2>/dev/null || echo 'NON TROUVÉ')"
log "NPM: $(npm -v 2>/dev/null || echo 'NON TROUVÉ')"

# Variables obligatoires
if [ -z "${DATABASE_URL:-}" ]; then
  log "ERREUR: DATABASE_URL non définie dans cPanel (Variables d'environnement)."
  exit 1
fi

if [ -z "${AUTH_SECRET:-}" ]; then
  log "ERREUR: AUTH_SECRET non définie dans cPanel."
  exit 1
fi

export NODE_ENV=production
# Limite mémoire pour hébergement mutualisé
export NODE_OPTIONS="${NODE_OPTIONS:---max-old-space-size=512}"

log "Installation des dépendances (avec devDeps pour le build)..."
npm install --no-audit --no-fund 2>&1 | tee -a "$LOG"

log "Prisma generate..."
npx prisma generate 2>&1 | tee -a "$LOG"

log "Prisma migrate deploy..."
npx prisma migrate deploy 2>&1 | tee -a "$LOG"

log "Build Next.js (peut prendre 5–15 min sur LWS)..."
npm run build 2>&1 | tee -a "$LOG"

log "Nettoyage des devDependencies..."
npm prune --omit=dev 2>&1 | tee -a "$LOG"

log "=== Déploiement terminé avec succès ==="
