# Queen of Excellence

Plateforme événementielle pour concours, votes et billetterie.

**Base de données : SQLite** (fichier `prisma/data.db` — pas de PostgreSQL externe)

## Déploiement LWS (simple)

### Sur ton PC

```bash
npm install
npm run db:push
npm run db:seed
npm run deploy:pack
```

Upload **`queenofex-deploy.zip`** dans `~/queenofexcellence` sur cPanel.

### Sur cPanel LWS

**Variables Node.js App :**

| Variable | Valeur |
|---|---|
| `DATABASE_URL` | `file:./prisma/data.db` |
| `AUTH_SECRET` | clé secrète |
| `NEXTAUTH_URL` | `https://queenofexcellence.com` |
| `NODE_ENV` | `production` |

**Terminal :**
```bash
source /home/c2852916c/nodevenv/queenofexcellence/18/bin/activate
cd ~/queenofexcellence
bash install.sh
```

**Node.js App** → `node server.js` → **Restart**

Admin (après seed) : `admin@queenofexcellence.com` / `admin123`

---

## Dev local

```bash
npm install
npm run db:push
npm run db:seed
npm run dev
```

Fichier `.env.development` : `DATABASE_URL="file:./prisma/data.db"`
