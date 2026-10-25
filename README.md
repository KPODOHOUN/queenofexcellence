# Queen of Excellence

Plateforme événementielle pour concours, votes et billetterie.

**Base de données : MySQL** (LWS/cPanel — sans Prisma)

## Déploiement LWS (méthode zip — recommandée)

### Sur ton PC

```bash
npm install
npm run deploy:pack
```

Envoie `queenofex-deploy.zip` sur le serveur.

### Sur LWS (cPanel)

1. **phpMyAdmin** → importer `database/schema.mysql.sql` puis `seed.mysql.sql`
2. **Gestionnaire de fichiers** → extraire le zip dans `~/queenofexcellence`
3. **Copier** `deploy/public_html.htaccess` → `~/public_html/.htaccess`
4. **Setup Node.js App** → variables (voir `deploy/LISEZMOI.txt`)
5. **Terminal** → `cd ~/queenofexcellence && bash install.sh`
6. **Arrêter** l'app 2 min → **Redémarrer**

Admin : `admin@queenofexcellence.com` / `admin123`

Le fichier `deploy/LISEZMOI.txt` (inclus dans le zip) contient la checklist complète.

---

## Dev local

**Une commande pour tout lancer :**

```bash
npm run dev:ready
```

Cela démarre MariaDB embarqué (port 3307), applique schéma + seed, puis lance Next.js.

**Étapes manuelles :**

```bash
npm run db:start    # MariaDB local dans .local/mysql
npm run db:setup    # schéma + données de démo
npm run dev         # http://localhost:3001
```

**Identifiants admin :** `admin@queenofexcellence.com` / `admin123`

`.env.local` doit contenir :
```
DATABASE_URL="mysql://root@127.0.0.1:3307/queenofexcellence"
AUTH_SECRET="dev-only-secret-change-in-production"
NEXTAUTH_URL="http://localhost:3001"
```
