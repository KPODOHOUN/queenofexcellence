# Intégration FeexPay — Queen of Excellence

## Configuration production

```env
FEEXPAY_API_URL="https://api.feexpay.me"
FEEXPAY_API_KEY="fp_votre_cle_api"
FEEXPAY_SHOP_ID="votre_shop_id"
FEEXPAY_WEBHOOK_SECRET="votre_secret_webhook"
FEEXPAY_MODE="LIVE"
NEXTAUTH_URL="https://votre-domaine.com"
```

Récupérez **API Key** et **Shop ID** dans le menu **Développeur** sur [app.feexpay.me](https://app.feexpay.me).

## Flux de paiement

1. **Initiation** — `POST /api/votes` ou `POST /api/tickets/purchase`
2. **Paiement** — Redirection vers la page sécurisée FeexPay (carte bancaire)
3. **Webhook** — `POST /api/payments/webhook` (optionnel, avec `FEEXPAY_WEBHOOK_SECRET`)
4. **Vérification** — `GET /api/transactions/public/single/status/{reference}` via `confirmPayment()`
5. **Finalisation** — Votes / billets confirmés uniquement si statut `SUCCESSFUL`

## Sandbox développement

```env
FEEXPAY_ENABLE_SANDBOX="true"
```

Désactivé automatiquement en production.

## Documentation officielle

https://docs.feexpay.me/api_rest.html
