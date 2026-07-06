# Stripe Catalog Sync

Syncs the LawStruct pricing catalog to Stripe test mode.

The CLI reads `STRIPE_SECRET_KEY` from `../cdk-app/.env`. It refuses to write
unless `--apply` is passed and refuses to use non-test Stripe keys.

```bash
npm run dry-run --workspace stripe-catalog-sync
npm run apply --workspace stripe-catalog-sync
```

Products are matched by `metadata.tier`. Prices use stable `lookup_key` values.
If a price amount changes, the CLI creates a new Price and deactivates the old
one because Stripe Price amounts are immutable.
