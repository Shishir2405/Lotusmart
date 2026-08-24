

import { NextRequest } from "next/server";

import { ApiError } from "@/lib/api-error";
import {
  buildPagination,
  createdResponse,
  errorResponse,
  paginatedResponse,
} from "@/lib/api-response";
import { requireAdmin } from "@/lib/auth";
import { channelProductFilter } from "@/lib/channel";
import connectDB from "@/lib/db";
import Category from "@/modules/products/category.model";
import Product from "@/modules/products/product.model";


export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = request.nextUrl;

    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)),
    );
    const skip = (page - 1) * limit;

    const categorySlug = searchParams.get("category");
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const sortBy = searchParams.get("sortBy") ?? "newest";
    const search = searchParams.get("search");
    const featured = searchParams.get("featured");
    const statusParam = searchParams.get("status");
    const includeInactive = searchParams.get("includeInactive") === "true";
    const isActiveParam = searchParams.get("isActive");

    const query: Record<string, any> = {};

    if (statusParam === "all" || includeInactive || isActiveParam === "all") {
    } else if (statusParam === "inactive" || isActiveParam === "false") {
      query.isActive = false;
    } else if (statusParam === "active" || isActiveParam === "true") {
      query.isActive = true;
    } else {
      query.isActive = true;
    }

    
    if (categorySlug) {
      const category = await Category.findOne({
        slug: categorySlug,
        isActive: true,
      }).lean();
      if (!category) {
        throw ApiError.notFound(`Category "${categorySlug}" not found`);
      }

      // Expand the requested category to itself AND all of its descendants,
      // so filtering a top-level category (e.g. "dry-fruits") also returns
      // products stored under its child / grandchild categories. Mirrors the
      // BFS descendant walk in /categories/[slug]/page.tsx.
      const descendantIds = new Set<string>([category._id.toString()]);
      let frontier: typeof category._id[] = [category._id];
      while (frontier.length) {
        const kids = await Category.find({ parent: { $in: frontier }, isActive: true })
          .select("_id")
          .lean();
        const next: typeof frontier = [];
        for (const k of kids) {
          const s = k._id.toString();
          if (!descendantIds.has(s)) {
            descendantIds.add(s);
            next.push(k._id);
          }
        }
        frontier = next;
      }

      query.category = { $in: Array.from(descendantIds) };
    }

    
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }

    
    if (search) {
      query.$text = { $search: search };
    }


    if (featured === "true") {
      query.isFeatured = true;
    }

    // Grocery (app, Indore-only) vs premium dry-fruit (website, India-wide):
    // scope results to whatever channel this request came from. No-op for an
    // authenticated admin, who needs to see the full catalog either way.
    Object.assign(query, await channelProductFilter(request));


    let sort: Record<string, any> = { createdAt: -1 };
    if (search) {
      sort = { score: { $meta: "textScore" } };
    } else if (sortBy === "price_asc") {
      sort = { price: 1 };
    } else if (sortBy === "price_desc") {
      sort = { price: -1 };
    } else if (sortBy === "popular") {
      sort = { "ratings.count": -1, "ratings.average": -1 };
    }
    

    const [products, total] = await Promise.all([
      Product.find(query, search ? { score: { $meta: "textScore" } } : {})
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate("category", "name slug")
        .lean(),
      Product.countDocuments(query),
    ]);

    return paginatedResponse(products, buildPagination(page, limit, total));
  } catch (error) {
    const apiError = ApiError.from(error);
    return errorResponse(apiError.message, apiError.statusCode, apiError.errors);
  }
}


export async function POST(request: NextRequest) {
  try {
    await connectDB();
    await requireAdmin(request);

    const body = await request.json();

    const {
      name,
      description,
      shortDescription,
      price,
      compareAtPrice,
      costPrice,
      category,
      subcategory,
      images,
      videos,
      sku,
      barcode,
      weight,
      unit,
      stock,
      lowStockThreshold,
      isActive,
      isFeatured,
      showOnWebsite,
      showOnApp,
      tags,
      variants,

      brand,
      manufacturer,
      countryOfOrigin,
      hsn,
      gstRate,
      pricePerKg,
      pricePerGram,
      pricePerUnit,
      bulkPricing,
      shelfLife,
      bestBefore,
      nutritionInfo,
      ingredients,
      allergens,
      certifications,
      fssaiLicense,
      isOrganic,
      isVegan,
      isGlutenFree,
      productType,
      dimensions,
      shippingWeight,
      minOrderQuantity,
      maxOrderQuantity,
      returnPolicy,
      warranty,
      videoUrl,
      metaTitle,
      metaDescription,
    } = body;

    
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      throw ApiError.badRequest("Product name is required");
    }
    if (!description || typeof description !== "string") {
      throw ApiError.badRequest("Product description is required");
    }
    if (price === undefined || price === null || typeof price !== "number") {
      throw ApiError.badRequest("Product price is required and must be a number");
    }
    if (!category) {
      throw ApiError.badRequest("Product category is required");
    }
    if (!sku || typeof sku !== "string" || sku.trim().length === 0) {
      throw ApiError.badRequest("Product SKU is required");
    }

    
    const categoryDoc = await Category.findById(category).lean();
    if (!categoryDoc) {
      throw ApiError.badRequest("Category not found");
    }

    const product = await Product.create({
      name: name.trim(),
      description,
      shortDescription,
      price,
      compareAtPrice,
      costPrice,
      category,
      subcategory,
      images: images ?? [],
      videos: videos ?? [],
      sku: sku.trim(),
      barcode,
      weight,
      unit: unit ?? "pieces",
      stock: stock ?? 0,
      lowStockThreshold: lowStockThreshold ?? 5,
      isActive: isActive ?? true,
      isFeatured: isFeatured ?? false,
      showOnWebsite: showOnWebsite ?? true,
      showOnApp: showOnApp ?? true,
      tags: tags ?? [],
      variants: variants ?? [],

      brand,
      manufacturer,
      countryOfOrigin,
      hsn,
      gstRate,
      pricePerKg,
      pricePerGram,
      pricePerUnit,
      bulkPricing: bulkPricing ?? [],
      shelfLife,
      bestBefore,
      nutritionInfo,
      ingredients,
      allergens: allergens ?? [],
      certifications: certifications ?? [],
      fssaiLicense,
      isOrganic: isOrganic ?? false,
      isVegan: isVegan ?? false,
      isGlutenFree: isGlutenFree ?? false,
      productType,
      dimensions,
      shippingWeight,
      minOrderQuantity: minOrderQuantity ?? 1,
      maxOrderQuantity,
      returnPolicy,
      warranty,
      videoUrl,
      metaTitle,
      metaDescription,
      lastPriceUpdate: new Date(),
    });

    const populated = await product.populate("category", "name slug");

    return createdResponse(populated, "Product created successfully");
  } catch (error) {
    const apiError = ApiError.from(error);
    return errorResponse(apiError.message, apiError.statusCode, apiError.errors);
  }
}
