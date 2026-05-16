# Lotusmart import scripts

Tools for seeding the Lotusmart catalogue from external supplier data.

## Happilo catalogue import

End-to-end flow to seed 56 Happilo SKUs into the Lotusmart DB with real
product images on Cloudinary.

### Files

- `imports/happilo-products.csv` — the source-of-truth CSV (56 rows). Edit
  this file directly if you need to add/remove products.
- `scrape-happilo-images.mjs` — fetches the official product image from
  happilo.com (Shopify JSON), uploads to Cloudinary, and writes the URL back
  into the CSV's `Image URLs` column.

### Workflow

1. **Scrape product images from Happilo → Cloudinary**

   ```bash
   cd /Users/shishirshrivastava/Documents/lotus/Lotusmart
   node scripts/scrape-happilo-images.mjs
   ```

   Reads `.env` for Cloudinary creds. Saves after every successful row so you
   can Ctrl-C and resume — already-filled rows are skipped on re-runs.

   Useful flags:
   - `--sku=HAP-ALM-200` — only process that one SKU
   - `--limit=5` — process the first 5 unfilled rows (quick test)
   - `--force` — re-upload even if `Image URLs` is already populated

2. **Upload the CSV through the admin UI**

   - Start `pnpm dev`, log in as admin
   - Go to `/admin/products/import`
   - Pick `scripts/imports/happilo-products.csv`
   - Enter your FSSAI License (applied to every row)
   - Click **Validate Only (Dry Run)** to preview, then **Run Import**

### How it works

- Categories: matched by slug — `slugify("Nuts") === "nuts"`. Reused if
  already present, created otherwise. Subcategory is stored as a plain
  string on the product (not a nested Category doc).
- Products: upserted by `SKU`. Existing SKUs get their fields updated,
  new SKUs are inserted.
- `productType` must be one of: `spice | dry_fruit | gifting | herb | honey |
  superfood | nuts | seeds | dates | dried_fruit | mix | combo`.
