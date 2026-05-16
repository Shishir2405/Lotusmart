import { NextRequest } from "next/server";
import Papa from "papaparse";
import slugify from "slugify";

import { ApiError } from "@/lib/api-error";
import { successResponse, errorResponse } from "@/lib/api-response";
import { requireAdmin } from "@/lib/auth";
import connectDB from "@/lib/db";
import Category from "@/modules/products/category.model";
import Product from "@/modules/products/product.model";
import type { ProductType, ProductUnit } from "@/types";

export const runtime = "nodejs";
export const maxDuration = 120;

const VALID_PRODUCT_TYPES: ProductType[] = [
  "spice",
  "dry_fruit",
  "gifting",
  "herb",
  "honey",
  "superfood",
  "nuts",
  "seeds",
  "dates",
  "dried_fruit",
  "mix",
  "combo",
];

const VALID_UNITS: ProductUnit[] = ["kg", "g", "pieces", "pack", "ml", "L", "box"];
const VALID_GST_RATES = [0, 5, 12, 18, 28];

interface CsvRow {
  "Product Name"?: string;
  "Short Description"?: string;
  Description?: string;
  Category?: string;
  Subcategory?: string;
  Brand?: string;
  SKU?: string;
  Barcode?: string;
  "Price (INR)"?: string;
  "Compare At Price (MRP)"?: string;
  "Cost Price"?: string;
  "GST Rate (%)"?: string;
  "HSN Code"?: string;
  Stock?: string;
  "Weight (grams)"?: string;
  Unit?: string;
  "Shipping Weight (g)"?: string;
  "Min Order Qty"?: string;
  "Max Order Qty"?: string;
  "Country of Origin"?: string;
  "Shelf Life"?: string;
  "Best Before"?: string;
  Ingredients?: string;
  Allergens?: string;
  Certifications?: string;
  "Is Organic"?: string;
  "Is Vegan"?: string;
  "Is Gluten Free"?: string;
  Manufacturer?: string;
  Tags?: string;
  "Product Type"?: string;
  "Meta Title"?: string;
  "Meta Description"?: string;
  "Video URL"?: string;
  Visibility?: string;
  "Image URLs"?: string;
}

interface RowResult {
  row: number;
  sku: string;
  name: string;
  action: "created" | "updated" | "skipped" | "errored";
  productId?: string;
  message?: string;
}

function toNumber(v: unknown): number | undefined {
  if (v === undefined || v === null) return undefined;
  const s = String(v).trim();
  if (!s) return undefined;
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
}

function toBool(v: unknown): boolean {
  if (v === undefined || v === null) return false;
  const s = String(v).trim().toLowerCase();
  return s === "yes" || s === "true" || s === "1" || s === "y";
}

function splitList(v: unknown): string[] {
  if (v === undefined || v === null) return [];
  const s = String(v).trim();
  if (!s) return [];
  return s
    .split(/[,|]/)
    .map((x) => x.trim())
    .filter(Boolean);
}

function categorySlug(name: string): string {
  return slugify(name, { lower: true, strict: true });
}

async function findOrCreateCategory(name: string): Promise<string> {
  const trimmed = name.trim();
  const slug = categorySlug(trimmed);
  const existing = await Category.findOne({ slug }).lean();
  if (existing) return String(existing._id);
  const created = await Category.create({
    name: trimmed,
    isActive: true,
  });
  return String(created._id);
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    await requireAdmin(request);

    const formData = await request.formData();
    const file = formData.get("file");
    const fssaiLicense = String(formData.get("fssaiLicense") ?? "").trim();
    const dryRunRaw = String(formData.get("dryRun") ?? "").trim().toLowerCase();
    const dryRun = dryRunRaw === "true" || dryRunRaw === "1";

    if (!file || !(file instanceof Blob)) {
      throw ApiError.badRequest("CSV file is required (field name: 'file')");
    }

    if (!fssaiLicense) {
      throw ApiError.badRequest("FSSAI License is required");
    }

    const text = await file.text();
    const parsed = Papa.parse<CsvRow>(text, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim(),
    });

    if (parsed.errors && parsed.errors.length) {
      const first = parsed.errors[0];
      throw ApiError.badRequest(
        `CSV parse error at row ${first.row}: ${first.message}`,
      );
    }

    const rows = parsed.data.filter((r) => r["Product Name"] && r.SKU);
    if (rows.length === 0) {
      throw ApiError.badRequest("CSV has no valid rows (need at least Product Name + SKU)");
    }

    if (rows.length > 500) {
      throw ApiError.badRequest("Maximum 500 rows per import");
    }

    const categoryCache = new Map<string, string>();
    const results: RowResult[] = [];
    let created = 0;
    let updated = 0;
    let errored = 0;

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const csvLine = i + 2;
      const sku = String(r.SKU ?? "").trim();
      const name = String(r["Product Name"] ?? "").trim();

      try {
        if (!sku) throw new Error("SKU is empty");
        if (!name) throw new Error("Product Name is empty");

        const categoryName = String(r.Category ?? "").trim();
        if (!categoryName) throw new Error("Category is empty");

        const description = String(r.Description ?? "").trim();
        if (!description) throw new Error("Description is empty");

        const price = toNumber(r["Price (INR)"]);
        if (price === undefined || price < 0) {
          throw new Error("Price (INR) must be a non-negative number");
        }

        const productType = String(r["Product Type"] ?? "").trim();
        if (productType && !VALID_PRODUCT_TYPES.includes(productType as ProductType)) {
          throw new Error(
            `Product Type "${productType}" not in allowed list: ${VALID_PRODUCT_TYPES.join(", ")}`,
          );
        }

        const unit = String(r.Unit ?? "pieces").trim();
        if (!VALID_UNITS.includes(unit as ProductUnit)) {
          throw new Error(`Unit "${unit}" not in allowed list: ${VALID_UNITS.join(", ")}`);
        }

        const gstRate = toNumber(r["GST Rate (%)"]);
        if (gstRate !== undefined && !VALID_GST_RATES.includes(gstRate)) {
          throw new Error(`GST Rate ${gstRate} not in allowed list: ${VALID_GST_RATES.join(", ")}`);
        }

        let categoryId = categoryCache.get(categoryName.toLowerCase());
        if (!categoryId) {
          if (dryRun) {
            categoryId = "dry-run-category-id";
          } else {
            categoryId = await findOrCreateCategory(categoryName);
          }
          categoryCache.set(categoryName.toLowerCase(), categoryId);
        }

        const payload = {
          name,
          description,
          shortDescription: String(r["Short Description"] ?? "").trim() || undefined,
          price,
          compareAtPrice: toNumber(r["Compare At Price (MRP)"]),
          costPrice: toNumber(r["Cost Price"]),
          category: categoryId,
          subcategory: String(r.Subcategory ?? "").trim() || undefined,
          images: splitList(r["Image URLs"]),
          sku,
          barcode: String(r.Barcode ?? "").trim() || undefined,
          weight: toNumber(r["Weight (grams)"]),
          unit,
          stock: toNumber(r.Stock) ?? 0,
          isActive: String(r.Visibility ?? "Active").trim().toLowerCase() !== "inactive",
          tags: splitList(r.Tags),
          brand: String(r.Brand ?? "").trim() || undefined,
          manufacturer: String(r.Manufacturer ?? "").trim() || undefined,
          countryOfOrigin: String(r["Country of Origin"] ?? "India").trim(),
          hsn: String(r["HSN Code"] ?? "").trim() || undefined,
          gstRate,
          shelfLife: String(r["Shelf Life"] ?? "").trim() || undefined,
          ingredients: String(r.Ingredients ?? "").trim() || undefined,
          allergens: splitList(r.Allergens),
          certifications: splitList(r.Certifications),
          fssaiLicense,
          isOrganic: toBool(r["Is Organic"]),
          isVegan: toBool(r["Is Vegan"]),
          isGlutenFree: toBool(r["Is Gluten Free"]),
          productType: productType || undefined,
          shippingWeight: toNumber(r["Shipping Weight (g)"]),
          minOrderQuantity: toNumber(r["Min Order Qty"]) ?? 1,
          maxOrderQuantity: toNumber(r["Max Order Qty"]),
          videoUrl: String(r["Video URL"] ?? "").trim() || undefined,
          metaTitle: String(r["Meta Title"] ?? "").trim() || undefined,
          metaDescription: String(r["Meta Description"] ?? "").trim() || undefined,
          lastPriceUpdate: new Date(),
        };

        if (dryRun) {
          results.push({ row: csvLine, sku, name, action: "skipped", message: "dry run" });
          continue;
        }

        const existing = await Product.findOne({ sku });
        if (existing) {
          Object.assign(existing, payload);
          await existing.save();
          updated++;
          results.push({
            row: csvLine,
            sku,
            name,
            action: "updated",
            productId: String(existing._id),
          });
        } else {
          const doc = await Product.create(payload);
          created++;
          results.push({
            row: csvLine,
            sku,
            name,
            action: "created",
            productId: String(doc._id),
          });
        }
      } catch (err) {
        errored++;
        results.push({
          row: csvLine,
          sku,
          name,
          action: "errored",
          message: err instanceof Error ? err.message : String(err),
        });
      }
    }

    return successResponse(
      {
        summary: {
          total: rows.length,
          created,
          updated,
          errored,
          categoriesTouched: categoryCache.size,
          dryRun,
        },
        results,
      },
      dryRun
        ? `Dry run: ${rows.length} rows validated`
        : `Imported: ${created} created, ${updated} updated, ${errored} errored`,
    );
  } catch (error) {
    const e = ApiError.from(error);
    return errorResponse(e.message, e.statusCode, e.errors);
  }
}
