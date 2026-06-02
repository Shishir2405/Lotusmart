#!/usr/bin/env python3
"""
Seed 5 LotusMart blog posts into the `blogs` collection.

Content is HTML (the blog page renders it via a Tailwind `prose` wrapper),
each post has a verified cover image + one inline image. Idempotent: upserts
by slug, so re-running updates rather than duplicates.

Reads MONGODB_URI from .env.
"""

import os
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

from pymongo import MongoClient

ROOT = Path(__file__).resolve().parent.parent
ENV = ROOT / ".env"
AUTHOR = "LotusMart Team"


def load_mongo_uri() -> str:
    uri = os.environ.get("MONGODB_URI")
    if not uri and ENV.exists():
        for line in ENV.read_text().splitlines():
            m = re.match(r"\s*MONGODB_URI\s*=\s*(.*)\s*$", line)
            if m:
                uri = m.group(1).strip().strip('"').strip("'")
                break
    if not uri:
        sys.exit("MONGODB_URI not found")
    return uri


def slugify(title: str) -> str:
    s = title.lower().replace("&", " and ")
    s = re.sub(r"['’`]", "", s)
    s = re.sub(r"[^a-z0-9]+", "-", s)
    return re.sub(r"-+", "-", s).strip("-")


POSTS = [
    {
        "title": "Almonds vs Cashews vs Walnuts: Which Nut Should You Eat Every Day?",
        "excerpt": "Almonds, cashews and walnuts each bring a very different nutritional profile to the table. Here's a simple guide to what each one does best — and how to choose the right daily handful for your goals.",
        "coverImage": "/images/categories/nuts-seeds.jpg",
        "tags": ["nuts", "almonds", "cashews", "walnuts", "nutrition", "healthy snacks"],
        "publishedAt": datetime(2026, 5, 12, 9, 0, tzinfo=timezone.utc),
        "metaTitle": "Almonds vs Cashews vs Walnuts: Which Nut to Eat Daily",
        "metaDescription": "A simple, practical comparison of almonds, cashews and walnuts — their benefits, calories and the best nut to eat every day for your goals.",
        "content": """
<p>Almonds, cashews and walnuts are the three nuts that show up in almost every Indian kitchen — but they are not interchangeable. Each brings a very different nutritional profile to the table, and knowing the difference helps you snack with intent.</p>
<h2>Almonds — the everyday all-rounder</h2>
<p>Almonds are rich in vitamin E, magnesium and plant protein. A small handful (about 28g) delivers roughly 6g of protein and a generous dose of antioxidants that support skin and heart health.</p>
<ul>
<li><strong>Best for:</strong> daily snacking, skin and hair, steady energy</li>
<li><strong>Try them:</strong> soaked overnight and peeled in the morning</li>
</ul>
<h2>Cashews — the creamy energy booster</h2>
<p>Cashews are slightly higher in carbohydrates, which makes them a quick source of energy. They also deliver iron, zinc and magnesium in a satisfyingly creamy bite.</p>
<blockquote>Cashews are the easiest nut to over-eat — measure out a handful instead of snacking straight from the packet.</blockquote>
<img src="/images/hero/dryfruits-hero.jpg" alt="A spread of premium dry fruits and nuts" />
<h2>Walnuts — the brain and heart specialist</h2>
<p>Walnuts are the standout source of plant-based omega-3 fatty acids (ALA), linked to better heart and cognitive health. Their earthy, slightly bitter taste pairs beautifully with both sweet and savoury dishes.</p>
<h2>So which one should you eat?</h2>
<p>The honest answer is a mix. Rotate a small daily handful across all three to cover protein, healthy fats and micronutrients. If you must pick one for a specific goal:</p>
<ul>
<li><strong>Weight management:</strong> almonds — the most filling per calorie</li>
<li><strong>Pre-workout energy:</strong> cashews</li>
<li><strong>Heart &amp; brain:</strong> walnuts</li>
</ul>
<p>Whatever you choose, quality matters. Look for nuts that are fresh, naturally processed and free from added oil or salt — exactly how we pack ours at LotusMart.</p>
""",
    },
    {
        "title": "The Science of Soaking: Why Overnight-Soaked Almonds and Raisins Work Better",
        "excerpt": "Soaking nuts and dried fruits overnight isn't just an old habit — there's real science behind why soaked almonds, raisins and seeds are easier to digest and better absorbed. Here's what to soak, and for how long.",
        "coverImage": "/images/hero/dryfruits-hero.jpg",
        "tags": ["soaking", "almonds", "raisins", "seeds", "digestion", "wellness"],
        "publishedAt": datetime(2026, 5, 19, 9, 0, tzinfo=timezone.utc),
        "metaTitle": "Why You Should Soak Almonds & Raisins Overnight",
        "metaDescription": "The science of soaking nuts and dried fruits — how it reduces phytic acid, improves digestion, and a simple chart of what to soak and for how long.",
        "content": """
<p>Your grandmother was right. Soaking nuts and dried fruits overnight is more than an old habit — there is real science behind why soaked almonds, raisins and seeds are easier to digest and better absorbed.</p>
<h2>Why soaking works</h2>
<p>Raw nuts and seeds contain <strong>phytic acid</strong> and enzyme inhibitors — natural compounds that protect the seed but can block your body from absorbing minerals like iron, zinc and calcium. Soaking activates the seed, reduces these inhibitors and unlocks the nutrients inside.</p>
<ul>
<li>Easier digestion and less bloating</li>
<li>Better absorption of iron, zinc and magnesium</li>
<li>A softer texture that is gentler on the stomach</li>
</ul>
<img src="/images/categories/nuts-seeds.jpg" alt="Mixed nuts and seeds ready to soak" />
<h2>How long to soak what</h2>
<ul>
<li><strong>Almonds:</strong> 6–8 hours, then slip off the skins</li>
<li><strong>Raisins:</strong> 4–6 hours — drink the water too, it is iron-rich</li>
<li><strong>Walnuts &amp; pistachios:</strong> 3–4 hours</li>
<li><strong>Pumpkin &amp; sunflower seeds:</strong> 2–4 hours</li>
</ul>
<blockquote>Soaked-almond water and raisin water are traditional morning tonics — don't pour them down the drain.</blockquote>
<h2>The morning routine</h2>
<p>Soak a small portion before bed, drain in the morning, and eat on an empty stomach for the best results. It takes thirty seconds of prep and pays off all day in steady, even energy.</p>
""",
    },
    {
        "title": "A Beginner's Guide to Indian Whole Spices and How to Use Them",
        "excerpt": "If you've only ever cooked with spice powders, switching to whole spices is the single biggest upgrade you can make to your food. Here are the six to start with — and the one technique that ties them all together.",
        "coverImage": "/images/spices/whole-spices.jpg",
        "tags": ["spices", "whole spices", "cooking", "indian cooking", "tadka"],
        "publishedAt": datetime(2026, 5, 24, 9, 0, tzinfo=timezone.utc),
        "metaTitle": "Beginner's Guide to Indian Whole Spices",
        "metaDescription": "Why whole spices beat ground, the six essential spices to start with, and how to temper them (tadka) for deeper, more aromatic Indian cooking.",
        "content": """
<p>Walk into any Indian kitchen and you'll find a steel box — the <em>masala dabba</em> — filled with whole spices. If you've only ever cooked with powders, switching to whole spices is the single biggest upgrade you can make to your food.</p>
<h2>Why whole beats ground</h2>
<p>Whole spices keep their essential oils locked inside until you toast or crush them. That means more aroma, more flavour and a far longer shelf life than pre-ground powders, which start fading the moment they're milled.</p>
<img src="/images/spices/turmeric.jpg" alt="Fresh turmeric and whole spices" />
<h2>The starter six</h2>
<ul>
<li><strong>Cumin (jeera):</strong> warm and earthy — the backbone of most tempering</li>
<li><strong>Coriander seeds:</strong> citrusy and mild, best toasted and ground fresh</li>
<li><strong>Mustard seeds:</strong> the pop at the start of South Indian dishes</li>
<li><strong>Cardamom:</strong> sweet and floral, for both chai and biryani</li>
<li><strong>Cloves:</strong> intense and warming — use sparingly</li>
<li><strong>Black peppercorns:</strong> grind fresh for real heat and aroma</li>
</ul>
<h2>The one technique to learn: tempering</h2>
<p>Heat a little oil or ghee, add your whole spices, and wait for them to crackle and release their aroma — usually 20–30 seconds. This step, called <strong>tadka</strong>, is what gives Indian food its unmistakable depth.</p>
<blockquote>Toast whole spices in a dry pan before grinding and you'll never go back to packet masala.</blockquote>
<p>Buy whole spices in small batches, store them airtight and away from light, and grind only what you need.</p>
""",
    },
    {
        "title": "Festive Gifting Done Right: How to Build the Perfect Dry-Fruit Hamper",
        "excerpt": "A thoughtful dry-fruit hamper works for every occasion — Diwali, weddings, corporate thank-yous or a simple “thinking of you.” Here's how to build one that feels genuinely premium rather than generic.",
        "coverImage": "/images/gifts/gift-hamper.jpg",
        "tags": ["gifting", "hampers", "dry fruits", "festival", "diwali"],
        "publishedAt": datetime(2026, 5, 29, 9, 0, tzinfo=timezone.utc),
        "metaTitle": "How to Build the Perfect Dry-Fruit Gift Hamper",
        "metaDescription": "A practical guide to building a premium dry-fruit gift hamper — choosing a theme, balancing variety and quantity, and presentation that impresses.",
        "content": """
<p>A thoughtful dry-fruit hamper is the gift that works for every occasion — Diwali, weddings, corporate thank-yous or a simple "thinking of you." Here's how to build one that feels genuinely premium rather than generic.</p>
<h2>Start with a theme</h2>
<p>Great hampers tell a small story. Pick a direction before you start filling the box:</p>
<ul>
<li><strong>The classic:</strong> almonds, cashews, pistachios and raisins</li>
<li><strong>The healthy snacker:</strong> trail mix, roasted seeds and dried berries</li>
<li><strong>The festive box:</strong> dry fruits plus a jar of honey and a few whole spices</li>
</ul>
<img src="/images/gifts/premium-gift.jpg" alt="A premium dry-fruit gift hamper" />
<h2>Balance variety and quantity</h2>
<p>Four to six well-chosen items in generous portions always beats a dozen tiny sachets. Mix textures and colours — pale cashews, deep raisins, green pistachios — so the box looks abundant the moment it's opened.</p>
<h2>Presentation is half the gift</h2>
<ul>
<li>Use a sturdy box with compartments so nothing shifts in transit</li>
<li>Add a handwritten note — it instantly personalises the gift</li>
<li>Keep packaging tamper-proof and food-safe</li>
</ul>
<blockquote>A hamper should feel generous and effortless. When in doubt, fewer items in bigger portions always wins.</blockquote>
<p>Short on time? Our ready-to-gift hampers ship the same day, beautifully packed and ready to impress.</p>
""",
    },
    {
        "title": "5 High-Protein Snacks to Power Your Gym Routine (No Cooking Needed)",
        "excerpt": "You don't need protein powder or a kitchen to eat well around your workouts. These five high-protein snacks are simple, portable and need zero cooking — perfect for a gym bag or a busy desk.",
        "coverImage": "https://res.cloudinary.com/dqlmiarqk/image/upload/v1776839199/lotusmart/categories/2148540982.jpg",
        "tags": ["protein", "gym snacks", "fitness", "roasted chana", "makhana", "seeds"],
        "publishedAt": datetime(2026, 6, 1, 9, 0, tzinfo=timezone.utc),
        "metaTitle": "5 No-Cook High-Protein Snacks for the Gym",
        "metaDescription": "Five simple, portable high-protein snacks that need no cooking — roasted chana, nuts, pumpkin seeds, trail mix and makhana — plus a DIY gym mix.",
        "content": """
<p>You don't need protein powder or a kitchen to eat well around your workouts. Some of the best high-protein snacks are simple, portable and need zero cooking — perfect for a gym bag or a busy desk.</p>
<h2>Why protein timing matters</h2>
<p>Spreading protein across the day — including before and after training — supports muscle repair and keeps you fuller for longer. The trick is having good options ready before hunger makes the decision for you.</p>
<h2>5 no-cook, high-protein snacks</h2>
<ul>
<li><strong>Roasted chana:</strong> crunchy, high in fibre, and around 15g of protein per 50g</li>
<li><strong>Almonds &amp; pistachios:</strong> protein plus healthy fats for lasting energy</li>
<li><strong>Pumpkin seeds:</strong> tiny but mighty, with iron and magnesium too</li>
<li><strong>Trail mix:</strong> nuts and seeds with a little dried fruit for quick carbs</li>
<li><strong>Roasted makhana:</strong> light, low-calorie and surprisingly protein-rich</li>
</ul>
<img src="https://res.cloudinary.com/dqlmiarqk/image/upload/v1776671481/lotusmart/categories/download-1.jpg" alt="High-protein nuts and seeds for gym snacking" />
<h2>Build your own gym mix</h2>
<p>Combine equal parts roasted chana, almonds and pumpkin seeds, with a small handful of raisins for a pre-workout carb hit. Portion it into small bags so a serving is always ready to grab.</p>
<blockquote>Pack two servings the night before — the snack you've already prepared is the one you'll actually eat.</blockquote>
<p>Every nut, seed and snack at LotusMart is 100% natural with no added oil — clean fuel for clean training.</p>
""",
    },
]


def main():
    dry = "--dry-run" in sys.argv
    now = datetime.now(timezone.utc)

    docs = []
    for p in POSTS:
        slug = slugify(p["title"])
        docs.append(
            {
                "slug": slug,
                "title": p["title"],
                "excerpt": p["excerpt"],
                "content": p["content"].strip(),
                "coverImage": p["coverImage"],
                "author": AUTHOR,
                "tags": p["tags"],
                "status": "published",
                "viewCount": 0,
                "isActive": True,
                "metaTitle": p["metaTitle"],
                "metaDescription": p["metaDescription"],
                "publishedAt": p["publishedAt"],
            }
        )

    print(f"Prepared {len(docs)} blog posts:\n")
    for d in docs:
        assert len(d["excerpt"]) <= 500, f"excerpt too long: {d['slug']}"
        assert len(d["metaTitle"]) <= 100, f"metaTitle too long: {d['slug']}"
        assert len(d["metaDescription"]) <= 300, f"metaDescription too long: {d['slug']}"
        print(f"  • {d['title']}")
        print(f"      slug: {d['slug']}  | cover: {d['coverImage']}")

    if dry:
        print("\n[dry-run] nothing written.")
        return

    col = MongoClient(load_mongo_uri(), serverSelectionTimeoutMS=8000)["test"]["blogs"]
    print("\nWriting to test.blogs ...")
    for d in docs:
        res = col.update_one(
            {"slug": d["slug"]},
            {"$set": {**d, "updatedAt": now}, "$setOnInsert": {"createdAt": d["publishedAt"]}},
            upsert=True,
        )
        action = "inserted" if res.upserted_id else ("updated" if res.modified_count else "unchanged")
        print(f"  {action:9s} {d['slug']}")

    total = col.count_documents({})
    published = col.count_documents({"status": "published", "isActive": True})
    print(f"\nDone. blogs collection now has {total} docs ({published} published & active).")


if __name__ == "__main__":
    main()
