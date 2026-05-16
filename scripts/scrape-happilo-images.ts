/* eslint-disable no-console */
/**
 * One-off script: for each row in scripts/imports/happilo-products.csv, find the
 * matching Happilo product on happilo.com (Shopify storefront), pick the best
 * variant-specific image, upload to Cloudinary under `lotusmart/products/happilo/<sku>`,
 * and write the resulting URL(s) back into the CSV's `Image URLs` column.
 *
 * Run from project root: pnpm tsx scripts/scrape-happilo-images.ts
 *
 * Idempotent: rows with a non-empty Image URLs column are skipped unless --force is passed.
 */

import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import Papa from "papaparse";
import { v2 as cloudinary } from "cloudinary";

const CSV_PATH = path.resolve(
  process.cwd(),
  "scripts/imports/happilo-products.csv",
);

const UAS = [
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_2_1) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15",
];
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
function ua(): string {
  return UAS[Math.floor(Math.random() * UAS.length)];
}

const FORCE = process.argv.includes("--force");
const DRY = process.argv.includes("--dry");
const ONLY_SKU = process.argv.find((a) => a.startsWith("--sku="))?.split("=")[1];

interface CsvRow {
  "Product Name": string;
  SKU: string;
  "Weight (grams)": string;
  Unit: string;
  "Image URLs": string;
  "Happilo Handle": string;
  [k: string]: string;
}

interface ShopifyImage {
  id: number;
  src: string;
  width: number;
  height: number;
  variant_ids: number[];
  position: number;
}

interface ShopifyVariant {
  id: number;
  title: string;
  sku: string;
  image_id: number | null;
  option1: string | null;
  option2: string | null;
}

interface ShopifyProduct {
  id: number;
  title: string;
  handle: string;
  product_type: string;
  vendor: string;
  variants: ShopifyVariant[];
  images: ShopifyImage[];
}

function configureCloudinary(): void {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
  if (!cloudinary.config().cloud_name) {
    throw new Error("Cloudinary not configured. Check .env.");
  }
}

async function fetchText(url: string, attempt = 1): Promise<string> {
  const res = await fetch(url, {
    headers: {
      "User-Agent": ua(),
      Accept: "text/html,application/json;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
    },
  });
  if (res.status === 403 && attempt < 3) {
    await sleep(800 * attempt);
    return fetchText(url, attempt + 1);
  }
  if (!res.ok) throw new Error(`GET ${url} → HTTP ${res.status}`);
  return res.text();
}

async function searchHappilo(query: string): Promise<string[]> {
  // Use the public search page; extract product handles from /products/<handle> links.
  const url = `https://happilo.com/search?q=${encodeURIComponent(query)}`;
  const html = await fetchText(url);
  const handles = new Set<string>();
  const rx = /href="(?:https:\/\/happilo\.com)?\/products\/([a-z0-9-]+)(?:[?#"][^"]*)?"/gi;
  let m: RegExpExecArray | null;
  while ((m = rx.exec(html))) {
    handles.add(m[1]);
  }
  return Array.from(handles);
}

async function fetchProduct(handle: string): Promise<ShopifyProduct | null> {
  try {
    const json = JSON.parse(
      await fetchText(`https://happilo.com/products/${handle}.json`),
    ) as { product: ShopifyProduct };
    return json.product;
  } catch (e) {
    console.warn(`  ! fetch ${handle}.json failed:`, (e as Error).message);
    return null;
  }
}

/**
 * Pick the best variant out of a Shopify product matching the desired pack size.
 * weightG = 200 / 500 / 1000 etc. Returns the variant whose option1 contains "200g"
 * or "200" (or "1kg" for 1000), else null.
 */
function pickVariant(
  product: ShopifyProduct,
  weightG: number,
): ShopifyVariant | null {
  const want = weightG >= 1000 ? "1kg" : `${weightG}g`;
  const wantSpaced = weightG >= 1000 ? "1 kg" : `${weightG} g`;
  // Prefer exact 1-PK (single-pack) variants; skip "Pack of 2", "Pack of 5".
  const noPackOfRx = /pack\s*of/i;

  const candidates = product.variants.filter((v) => {
    const t = (v.option1 ?? v.title ?? "").toLowerCase();
    return (t.includes(want) || t.includes(wantSpaced)) && !noPackOfRx.test(t);
  });
  if (candidates.length === 0) {
    // Fallback: any variant matching the size, even Pack of N.
    return (
      product.variants.find((v) => {
        const t = (v.option1 ?? v.title ?? "").toLowerCase();
        return t.includes(want) || t.includes(wantSpaced);
      }) ?? null
    );
  }
  return candidates[0];
}

function imageForVariant(
  product: ShopifyProduct,
  variant: ShopifyVariant | null,
): string | null {
  if (variant && variant.image_id) {
    const img = product.images.find((i) => i.id === variant.image_id);
    if (img) return img.src;
  }
  const first = product.images[0];
  return first ? first.src : null;
}

async function uploadToCloudinary(
  sourceUrl: string,
  publicId: string,
): Promise<string> {
  const res = await cloudinary.uploader.upload(sourceUrl, {
    folder: "lotusmart/products/happilo",
    public_id: publicId,
    overwrite: true,
    resource_type: "image",
  });
  return res.secure_url;
}

// "premium" stays as a token — it's distinctive against "jumbo"/"popular".
const STOPWORDS = new Set([
  "happilo",
  "100",
  "all",
  "the",
  "and",
  "with",
  "for",
  "of",
  "value",
  "pack",
  "bulk",
  "g",
  "kg",
  "gm",
  "gr",
  "grams",
  "gram",
]);

// Normalize spelling variants so "californian" matches "california" etc.
function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/californian/g, "california")
    .replace(/iranian/g, "iran")
    .replace(/turkish/g, "turkey")
    .replace(/kashmiri/g, "kashmir")
    .replace(/afghani/g, "afghan")
    .replace(/anjeer/g, "anjeer fig")
    .replace(/makhana/g, "makhana fox nut")
    .replace(/kishmish/g, "kishmish raisin")
    .replace(/badam/g, "badam almond")
    .replace(/akhrot/g, "akhrot walnut")
    .replace(/kaju/g, "kaju cashew")
    .replace(/khurmani/g, "khurmani apricot")
    .replace(/khajoor/g, "khajoor date");
}

function tokenize(s: string): string[] {
  return normalize(s)
    .replace(/[^a-z0-9]+/g, " ")
    .split(/\s+/)
    .filter((t) => t && !STOPWORDS.has(t) && !/^\d+$/.test(t));
}

// Tokens that meaningfully distinguish one Happilo variant from another.
// If a handle contains one of these but the query doesn't, the product is wrong.
const DISTINCTIVE = [
  "jumbo",
  "popular",
  "roasted",
  "salted",
  "raw",
  "dried",
  "sliced",
  "mix",
  "combo",
  "gift",
  "tin",
  "celebration",
  "sweet",
  "tangy",
  "sour",
  "spicy",
  "tomato",
  "cocktail",
  "halves",
  "pieces",
  "kernels",
  "shelled",
  "inshell",
  "fitness",
  "champion",
  "party",
  "zesty",
  "orange",
  "cranberry",
  "blueberry",
  "strawberry",
  "kalmi",
  "medjoul",
  "medjool",
  "ajwa",
  "anjeer",
  "fig",
  "raisin",
  "prune",
  "apricot",
  "mango",
  "almond",
  "cashew",
  "pistachio",
  "walnut",
  "brazil",
  "fox",
  "makhana",
  "chia",
  "flax",
  "pumpkin",
  "sunflower",
];

function score(
  productTitle: string,
  productHandle: string,
  productType: string | undefined,
  query: string,
  expectedCategory: string | undefined,
): number {
  const wantTokens = tokenize(query);
  if (wantTokens.length === 0) return 0;
  const wantSet = new Set(wantTokens);
  const titleSet = new Set(tokenize(productTitle));
  const handleSet = new Set(tokenize(productHandle));

  // Hits weighted: handle match > title match.
  let hits = 0;
  for (const t of wantSet) {
    if (handleSet.has(t)) hits += 2;
    else if (titleSet.has(t)) hits += 1;
  }
  let s = (hits / (wantSet.size * 2)) * 100;

  // Penalty for distinctive tokens in the candidate that aren't in the query.
  for (const tok of DISTINCTIVE) {
    if (handleSet.has(tok) && !wantSet.has(tok)) s -= 25;
  }

  // Penalize obvious gift/combo/tin handles when target is a single SKU.
  const isGiftTarget =
    expectedCategory === "Combos" ||
    query.toLowerCase().includes("gift") ||
    query.toLowerCase().includes("combo");
  if (!isGiftTarget) {
    const handleLower = productHandle.toLowerCase();
    if (/(\bgift\b|\bcombo\b|celebration|tin|box-of|pack-of)/.test(handleLower)) {
      s -= 30;
    }
  }

  // Bonus if Shopify product_type roughly matches expected category.
  if (productType && expectedCategory) {
    const pt = productType.toLowerCase();
    const cat = expectedCategory.toLowerCase();
    if (pt && (pt.includes(cat.slice(0, 4)) || cat.includes(pt.slice(0, 4)))) {
      s += 5;
    }
  }
  return s;
}

async function main(): Promise<void> {
  configureCloudinary();

  const raw = await fs.readFile(CSV_PATH, "utf8");
  const parsed = Papa.parse<CsvRow>(raw, {
    header: true,
    skipEmptyLines: true,
  });
  const rows = parsed.data;
  const fields = parsed.meta.fields ?? [];

  console.log(`Loaded ${rows.length} rows from ${CSV_PATH}`);
  if (DRY) console.log("(dry run — no Cloudinary uploads, no CSV write)");

  let scraped = 0;
  let skipped = 0;
  let failed = 0;

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const sku = r.SKU?.trim();
    if (!sku) continue;
    if (ONLY_SKU && sku !== ONLY_SKU) continue;

    if (!FORCE && r["Image URLs"]?.trim()) {
      skipped++;
      continue;
    }

    const name = r["Product Name"]?.trim() ?? "";
    const weightG = Number(r["Weight (grams)"]) || 200;
    const query = name
      .replace(/happilo/gi, "")
      .replace(/\d+\s*(g|kg|gm|grams?)\b/gi, "")
      .replace(/\b(1\s*kg|bulk|value pack)\b/gi, "")
      .trim();

    console.log(`\n[${i + 1}/${rows.length}] ${sku} — "${name}" (${weightG}g)`);
    console.log(`  query: "${query}"`);

    try {
      const handles = await searchHappilo(query);
      if (handles.length === 0) {
        console.warn("  ! no search results");
        failed++;
        continue;
      }

      // Score each candidate handle by title-token overlap; fetch top N .json
      const expectedCategory = r.Category?.trim();
      const candidates: { handle: string; product: ShopifyProduct; score: number }[] = [];
      for (const handle of handles.slice(0, 8)) {
        const p = await fetchProduct(handle);
        if (!p) continue;
        const s = score(p.title, p.handle, p.product_type, name, expectedCategory);
        candidates.push({ handle, product: p, score: s });
      }
      candidates.sort((a, b) => b.score - a.score);
      const best = candidates[0];
      if (!best) {
        console.warn("  ! no candidates fetched");
        failed++;
        continue;
      }

      console.log(`  → ${best.handle} (score ${best.score}) — ${best.product.title}`);
      const variant = pickVariant(best.product, weightG);
      if (variant) {
        console.log(`  → variant ${variant.option1 ?? variant.title} (${variant.sku})`);
      } else {
        console.warn(`  ! no matching variant for ${weightG}g — using primary image`);
      }
      const imgSrc = imageForVariant(best.product, variant);
      if (!imgSrc) {
        console.warn("  ! no image on product");
        failed++;
        continue;
      }
      console.log(`  src: ${imgSrc}`);

      if (DRY) {
        scraped++;
        continue;
      }

      const publicId = sku.toLowerCase().replace(/[^a-z0-9-]/g, "-");
      const cloudUrl = await uploadToCloudinary(imgSrc, publicId);
      console.log(`  ✓ uploaded → ${cloudUrl}`);

      r["Image URLs"] = cloudUrl;
      r["Happilo Handle"] = best.handle;
      scraped++;
    } catch (err) {
      failed++;
      console.warn(`  ! error:`, (err as Error).message);
    }
    await sleep(400 + Math.random() * 400);
  }

  if (!DRY) {
    // Re-emit CSV with original column order
    const out = Papa.unparse(rows, { columns: fields });
    await fs.writeFile(CSV_PATH, out);
    console.log(`\nWrote updated CSV: ${CSV_PATH}`);
  }

  console.log(
    `\nDone. scraped=${scraped} skipped=${skipped} failed=${failed} total=${rows.length}`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
