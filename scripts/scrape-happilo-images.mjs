#!/usr/bin/env node
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import Papa from "papaparse";
import { v2 as cloudinary } from "cloudinary";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const CSV_PATH = resolve(ROOT, "scripts/imports/happilo-products.csv");
const ENV_PATH = resolve(ROOT, ".env");

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

function loadEnv() {
  if (!existsSync(ENV_PATH)) return;
  const lines = readFileSync(ENV_PATH, "utf8").split("\n");
  for (const line of lines) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    let val = m[2];
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!process.env[m[1]]) process.env[m[1]] = val;
  }
}

function configureCloudinary() {
  const required = [
    "CLOUDINARY_CLOUD_NAME",
    "CLOUDINARY_API_KEY",
    "CLOUDINARY_API_SECRET",
  ];
  const missing = required.filter((k) => !process.env[k]);
  if (missing.length) {
    throw new Error(`Missing env vars: ${missing.join(", ")} (looked in ${ENV_PATH})`);
  }
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

async function fetchText(url) {
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`HTTP ${res.status} on ${url}`);
  return await res.text();
}

async function fetchJson(url) {
  const text = await fetchText(url);
  return JSON.parse(text);
}

function normaliseForSearch(name) {
  return name
    .replace(/^Happilo\s+/i, "")
    .replace(/\b100%\b/g, "")
    .replace(/\(.*?\)/g, " ")
    .replace(/\b\d+\s*(kg|g|gm|grams?|ml)\b/gi, " ") // strip size tokens
    .replace(/\bvalue\s+pack\b/gi, " ")
    .replace(/\bbulk\s+pack\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Words that *strongly* distinguish a Happilo SKU. If the source name says
// "Roasted" but the candidate handle doesn't (or vice-versa), penalise.
const DISTINGUISHING = [
  "roasted",
  "salted",
  "jumbo",
  "raw",
  "natural",
  "premium",
  "deluxe",
  "kashmiri",
  "californian",
  "iranian",
  "afghani",
  "turkish",
  "medjoul",
  "medjool",
  "ajwa",
  "kalmi",
  "queen",
  "king",
  "tin",
  "orange",
  "cranberry",
  "fitness",
  "champion",
  "party",
  "combo",
  "gift",
  "celebration",
  "berries",
  "seeds",
  "nuts",
  "trail",
];

function extractSizeToken(name) {
  // Match 1kg, 1 kg, 200g, 200 g, 250g, etc. Return canonical "200g" / "1kg".
  const m = name.match(/(\d+)\s*(kg|g)\b/i);
  if (!m) return null;
  const num = m[1];
  const unit = m[2].toLowerCase();
  return `${num}${unit}`;
}

function tokens(s) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2);
}

function similarity(a, b) {
  const A = new Set(tokens(a));
  const B = new Set(tokens(b));
  if (!A.size || !B.size) return 0;
  let inter = 0;
  for (const t of A) if (B.has(t)) inter++;
  // Jaccard-ish base score
  let score = inter / Math.max(A.size, B.size);
  // Reward matching distinguishing words; punish mismatches in either direction.
  for (const w of DISTINGUISHING) {
    const inA = A.has(w);
    const inB = B.has(w);
    if (inA && inB) score += 0.15;
    else if (inA !== inB) score -= 0.20;
  }
  return score;
}

async function findHandle(productName) {
  const query = normaliseForSearch(productName);
  const url = `https://happilo.com/search?q=${encodeURIComponent(query)}&type=product`;
  const html = await fetchText(url);

  const handleRegex = /href="(?:https?:\/\/happilo\.com)?\/products\/([a-z0-9-]+)(?:\?[^"]*)?"/gi;
  const seen = new Set();
  const candidates = [];
  let m;
  while ((m = handleRegex.exec(html))) {
    const h = m[1];
    if (seen.has(h)) continue;
    seen.add(h);
    candidates.push(h);
    if (candidates.length >= 8) break;
  }
  if (!candidates.length) return null;

  // Rank candidates by token overlap with the query
  let best = candidates[0];
  let bestScore = -1;
  for (const h of candidates) {
    const handleText = h.replace(/-/g, " ");
    const score = similarity(query, handleText);
    if (score > bestScore) {
      bestScore = score;
      best = h;
    }
  }
  return best;
}

function pickVariantImage(product, sizeToken) {
  // product.variants[i].option1 is the size string like "200g", "500g", "1Kg", "1kg"
  if (sizeToken) {
    const target = sizeToken.toLowerCase();
    const variant = product.variants.find((v) => {
      const opt = String(v.option1 ?? "").toLowerCase().replace(/\s+/g, "");
      return opt === target || opt.startsWith(target + "(") || opt === target;
    });
    if (variant && variant.image_id) {
      const img = product.images.find((i) => i.id === variant.image_id);
      if (img) return img.src;
    }
  }
  return product.images[0]?.src ?? product.image?.src ?? null;
}

async function uploadToCloudinary(imageUrl, publicId) {
  const res = await fetch(imageUrl, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`Image fetch HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());

  return await new Promise((resolveUpload, rejectUpload) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "lotusmart/products",
        public_id: publicId,
        resource_type: "image",
        overwrite: true,
        unique_filename: false,
        use_filename: false,
      },
      (err, result) => {
        if (err) return rejectUpload(err);
        if (!result) return rejectUpload(new Error("No result from Cloudinary"));
        resolveUpload(result.secure_url);
      },
    );
    stream.end(buf);
  });
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  loadEnv();
  configureCloudinary();

  const csv = readFileSync(CSV_PATH, "utf8");
  const parsed = Papa.parse(csv, { header: true, skipEmptyLines: true });
  if (parsed.errors?.length) {
    console.error("CSV parse errors:", parsed.errors);
    process.exit(1);
  }
  const rows = parsed.data;
  console.log(`Loaded ${rows.length} rows from ${CSV_PATH}`);

  const onlySku = process.argv.find((a) => a.startsWith("--sku="))?.split("=")[1];
  const limit = Number(process.argv.find((a) => a.startsWith("--limit="))?.split("=")[1] ?? rows.length);
  const force = process.argv.includes("--force");

  let processed = 0;
  let succeeded = 0;
  let failed = 0;
  let skipped = 0;

  for (let i = 0; i < rows.length && processed < limit; i++) {
    const row = rows[i];
    const sku = (row.SKU ?? "").trim();
    const name = (row["Product Name"] ?? "").trim();
    if (!sku || !name) continue;
    if (onlySku && sku !== onlySku) continue;
    if (row["Image URLs"] && !force) {
      skipped++;
      console.log(`[${i + 1}] ${sku} — already has image, skipping`);
      continue;
    }

    processed++;
    console.log(`[${i + 1}] ${sku} — ${name}`);
    try {
      let handle = (row["Happilo Handle"] ?? "").trim();
      if (!handle || force) {
        const found = await findHandle(name);
        if (!found) throw new Error("no matching Happilo handle");
        if (handle && handle !== found) console.log(`    handle: ${handle} -> ${found} (forced)`);
        else console.log(`    handle: ${found}`);
        handle = found;
        row["Happilo Handle"] = handle;
        await sleep(250);
      }

      const product = (await fetchJson(`https://happilo.com/products/${handle}.json`))
        .product;
      const sizeToken = extractSizeToken(name);
      const imageUrl = pickVariantImage(product, sizeToken);
      if (!imageUrl) throw new Error("no image found in product JSON");
      console.log(`    image: ${imageUrl}`);

      const uploaded = await uploadToCloudinary(
        imageUrl,
        sku.replace(/[^A-Za-z0-9_-]/g, "_"),
      );
      console.log(`    cloudinary: ${uploaded}`);
      row["Image URLs"] = uploaded;
      succeeded++;

      // Persist after every successful row so a crash doesn't lose progress
      writeFileSync(CSV_PATH, Papa.unparse(rows, { newline: "\n" }), "utf8");
      await sleep(400);
    } catch (err) {
      failed++;
      console.warn(`    FAILED: ${err.message}`);
    }
  }

  console.log("\nDone.");
  console.log(`  processed: ${processed}`);
  console.log(`  succeeded: ${succeeded}`);
  console.log(`  failed:    ${failed}`);
  console.log(`  skipped:   ${skipped}`);
  console.log(`CSV updated at ${CSV_PATH}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
