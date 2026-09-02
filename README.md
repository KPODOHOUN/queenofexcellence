# Queen of Excellence

Plateforme événementielle pour concours, votes et billetterie.

## Démarrage rapide (dev local)

### 1. Installer les dépendances

```bash
npm install
```

### 2. Base de données

**Avec Docker** (recommandé) :

```bash
docker compose up -d
npm run db:push
npm run db:seed
```

La config par défaut est dans `.env.development` (PostgreSQL sur le port `5433`).

**Sans Docker** : copiez `.env.example` vers `.env.local` et renseignez votre `DATABASE_URL` (Neon, Supabase, cPanel…).

```bash
cp .env.example .env.local
# éditez .env.local avec votre DATABASE_URL
npm run db:push
npm run db:seed
```

### 3. Lancer le serveur

```bash
npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000).

**Admin** (après seed) : `admin@queenofexcellence.com` / `admin123`

## Scripts utiles

| Commande | Description |
|---|---|
| `npm run dev` | Serveur de développement |
| `npm run build` | Build production |
| `npm run db:push` | Synchroniser le schéma Prisma |
| `npm run db:seed` | Données de démonstration |
| `npm run db:local` | Docker + push + seed en une commande |
