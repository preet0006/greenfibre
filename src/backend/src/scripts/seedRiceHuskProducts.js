import mongoose from "mongoose";
import dotenv from "dotenv";
import { Category } from "../models/category.model.js";
import { Product } from "../models/product.model.js";
import { Banner } from "../models/banner.model.js";

dotenv.config();

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URL, {
            dbName: process.env.MONGO_DB_NAME || undefined,
        });
        console.log(`✅ Connected to MongoDB Atlas (${mongoose.connection.name})`);
    } catch (error) {
        console.error("❌ MongoDB connection error:", error.message);
        process.exit(1);
    }
};

const CATEGORIES_DATA = [
    {
        name: "Kitchen & Dining",
        slug: "kitchen-dining",
        description: "Tableware, soup bowls, canisters, and dining accessories engineered from upcycled rice husk and polymer bio-composites.",
        image: "/products/soup-bowl-250-ml.jpg",
        displayOrder: 1,
        isFeatured: true,
        isActive: true,
    },
    {
        name: "Drinkware",
        slug: "drinkware",
        description: "Double-walled insulated bottles, travel mugs, and textured everyday drinkware crafted with rice husk composites.",
        image: "/products/eco-spring-insulated-bottle.jpg",
        displayOrder: 2,
        isFeatured: true,
        isActive: true,
    },
    {
        name: "Home & Living",
        slug: "home-living",
        description: "Modern tabletop planters, tissue dispenser boxes, coaster sets, and eco-decor crafted for conscious living.",
        image: "/products/romano-planter.jpg",
        displayOrder: 3,
        isFeatured: true,
        isActive: true,
    },
    {
        name: "Storage & Baskets",
        slug: "storage-baskets",
        description: "Stackable eco baskets and multi-size storage bowls with airtight freshness lids, made with rice husk polymer blend.",
        image: "/products/greenhive-storage-basket.jpg",
        displayOrder: 4,
        isFeatured: true,
        isActive: true,
    },
    {
        name: "Pet Care",
        slug: "pet-care",
        description: "Non-toxic, safe, durable, and hygienic rice husk composite food and water bowls for your pets.",
        image: "/products/ecocog-pet-bowl.jpg",
        displayOrder: 5,
        isFeatured: true,
        isActive: true,
    },
];

const PRODUCTS_DATA = [
    {
        name: "Romano planter",
        slug: "romano-planter",
        originalPrice: 799,
        discountedPrice: 549,
        categorySlug: "home-living",
        colors: [
            {
                name: "Dusty Rose Pink",
                hex: "#f472b6",
                stock: 35,
                images: ["/products/romano-planter.jpg"],
            },
        ],
        description: "Fluted planter pot crafted by blending upcycled agricultural rice husk with durable polymer. Features an organic speckled texture, natural breathability for roots, high impact resistance, and an integrated drainage system.",
        features: {
            Material: "Upcycled Rice Husk & Polymer Composite",
            Finish: "Textured Fluted Matte Speckle",
            Benefits: "Eco-friendly, reduces virgin plastic, stronger than standard plastic",
            Drainage: "Integrated drainage plug",
        },
        isActive: true,
        isFeatured: true,
        averageRating: 4.9,
        reviewCount: 38,
    },
    {
        name: "Ecocog pet bowl",
        slug: "ecocog-pet-bowl",
        originalPrice: 899,
        discountedPrice: 649,
        categorySlug: "pet-care",
        colors: [
            {
                name: "Natural Rice Husk Beige",
                hex: "#d6c7b2",
                stock: 40,
                images: ["/products/ecocog-pet-bowl.jpg"],
            },
        ],
        description: "Durable, non-toxic pet food and water bowl made by blending agricultural rice husk with safe polymer. Odor-resistant, sturdy weighted base prevents tipping, and 100% pet-safe.",
        features: {
            Material: "Rice Husk & Food-Grade Polymer Composite",
            Base: "Non-slip weighted sturdy base",
            Safety: "BPA-Free, Non-Toxic & Pet Safe",
            Cleaning: "Dishwasher safe and stain-resistant",
        },
        isActive: true,
        isFeatured: true,
        averageRating: 4.8,
        reviewCount: 29,
    },
    {
        name: "Canister 700 ml",
        slug: "canister-700-ml",
        originalPrice: 599,
        discountedPrice: 449,
        categorySlug: "kitchen-dining",
        colors: [
            {
                name: "Oat Natural",
                hex: "#e5dec9",
                stock: 50,
                images: ["/products/canister-700-ml.jpg"],
            },
        ],
        description: "Airtight 700ml kitchen canister crafted from rice husk composite. Ideal for lentils, dry fruits, grains, coffee, and spices with a sleek earthy minimalist design and silicone freshness ring.",
        features: {
            Capacity: "700 ml",
            Material: "Rice Husk & Polymer Bio-Composite",
            Seal: "Airtight Silicone Freshness Ring",
            Stackable: "Modular nesting design",
        },
        isActive: true,
        isFeatured: true,
        averageRating: 4.7,
        reviewCount: 18,
    },
    {
        name: "Eco spring insulated bottle",
        slug: "eco-spring-insulated-bottle",
        originalPrice: 1299,
        discountedPrice: 899,
        categorySlug: "drinkware",
        colors: [
            {
                name: "Blush Speckled",
                hex: "#fbcfe8",
                stock: 30,
                images: ["/products/eco-spring-insulated-bottle.jpg"],
            },
        ],
        description: "Double-walled thermal insulated eco bottle with an outer shell made of rice husk composite and stainless steel interior. Features an ergonomic carry loop. Keeps beverages icy cold for 24 hours and piping hot for 12 hours.",
        features: {
            Insulation: "Double-walled vacuum thermal shield",
            Exterior: "Speckled Rice Husk Composite Grip",
            Cap: "Leakproof with Ergonomic Carry Loop",
            EcoImpact: "Eliminates single-use plastic bottles",
        },
        isActive: true,
        isFeatured: true,
        averageRating: 4.9,
        reviewCount: 45,
    },
    {
        name: "Greeenhive storage basket",
        slug: "greeenhive-storage-basket",
        originalPrice: 999,
        discountedPrice: 699,
        categorySlug: "storage-baskets",
        colors: [
            {
                name: "Pastel Mint & Blush",
                hex: "#a7f3d0",
                stock: 25,
                images: ["/products/greenhive-storage-basket.jpg"],
            },
        ],
        description: "Multi-purpose stackable storage basket with fitted lid. Woven ventilated lattice pattern crafted from durable rice husk polymer composite. Ideal for pantry organization, wardrobe, and desk storage.",
        features: {
            Material: "High-strength Rice Husk Bio-Composite",
            Design: "Ventilated lattice pattern with lid",
            Stackable: "Yes, interlocking modular structure",
            Durability: "Heavy-duty load bearing, crack resistant",
        },
        isActive: true,
        isFeatured: true,
        averageRating: 4.6,
        reviewCount: 22,
    },
    {
        name: "Storage bowl 2.9 L & 1.6 L",
        slug: "storage-bowl-2-9l-1-6l",
        originalPrice: 1199,
        discountedPrice: 849,
        categorySlug: "storage-baskets",
        colors: [
            {
                name: "Earthy Warm Grey",
                hex: "#a8a29e",
                stock: 35,
                images: ["/products/storage-bowl.jpg"],
            },
        ],
        description: "Set of 2 multi-capacity food storage and mixing bowls (2.9L & 1.6L) with airtight flexible lids. Crafted from food-grade rice husk polymer blend. Great for food prep, dough kneading, popcorn, and leftovers.",
        features: {
            Capacities: "2.9 Liters & 1.6 Liters",
            Material: "Food-Safe Rice Husk & Polymer",
            Lids: "Airtight seal transparent rim lids",
            Care: "Microwave reheat safe & Dishwasher safe",
        },
        isActive: true,
        isFeatured: true,
        averageRating: 4.8,
        reviewCount: 31,
    },
    {
        name: "Soup bowl 250 ml",
        slug: "soup-bowl-250-ml",
        originalPrice: 499,
        discountedPrice: 349,
        categorySlug: "kitchen-dining",
        colors: [
            {
                name: "Cream & Moss Green",
                hex: "#bbf7d0",
                stock: 60,
                images: ["/products/soup-bowl-250-ml.jpg"],
            },
        ],
        description: "Ergonomic 250ml soup and dessert bowl with matching spoon. Dual-tone design made from natural rice husk composite with smooth curved rim. Heat-resistant, shatter-proof, and comfortable to hold.",
        features: {
            Capacity: "250 ml with matching spoon",
            Material: "Rice Husk & Food-Grade Polymer",
            Finish: "Two-tone matte organic texture",
            Thermal: "Heat-insulated cool-touch exterior",
        },
        isActive: true,
        isFeatured: true,
        averageRating: 4.9,
        reviewCount: 52,
    },
    {
        name: "Curve steel bowl 500,700,1000ml",
        slug: "curve-steel-bowl",
        originalPrice: 1599,
        discountedPrice: 1199,
        categorySlug: "kitchen-dining",
        colors: [
            {
                name: "Dusty Peach Pink",
                hex: "#fed7aa",
                stock: 20,
                images: ["/products/curve-steel-bowl.jpg"],
            },
        ],
        description: "Premium insulated casserole serving bowl trio featuring food-grade 304 stainless steel interior encased in an outer rice husk composite heat-insulating shell with fitted lid and easy-grip handles.",
        features: {
            Sizes: "Available in 500ml, 700ml, 1000ml",
            Construction: "Inner 304 Stainless Steel + Outer Rice Husk Shell",
            ThermalRetention: "Keeps food warm for up to 4 hours",
            Lid: "Lock-in aroma freshness knob lid",
        },
        isActive: true,
        isFeatured: true,
        averageRating: 4.9,
        reviewCount: 40,
    },
    {
        name: "Statement table top planter",
        slug: "statement-table-top-planter",
        originalPrice: 599,
        discountedPrice: 399,
        categorySlug: "home-living",
        colors: [
            {
                name: "Pastel Sage Green & Blush",
                hex: "#86efac",
                stock: 45,
                images: ["/products/statement-table-top-planter.jpg"],
            },
        ],
        description: "Mini tabletop planter pot crafted for desktop succulents, cacti, and small indoor plants. Crafted from rice husk polymer blend with natural porous properties that prevent over-watering.",
        features: {
            Material: "Agricultural Rice Husk Composite",
            Usage: "Desk, windowsill, bookshelf greenery",
            Breathability: "Moisture balanced root aeration",
            Design: "Minimalist pastel cylindrical profile",
        },
        isActive: true,
        isFeatured: true,
        averageRating: 4.7,
        reviewCount: 26,
    },
    {
        name: "Classic mug 300 ml",
        slug: "classic-mug-300-ml",
        originalPrice: 399,
        discountedPrice: 249,
        categorySlug: "drinkware",
        colors: [
            {
                name: "Almond Beige",
                hex: "#f5ebe0",
                stock: 75,
                images: ["/products/classic-mug-300-ml.jpg"],
            },
        ],
        description: "Daily coffee and tea mug holding 300ml. Lightweight yet extraordinarily durable, made with natural rice husk blend with a smooth comfort handle and natural speckles that make every piece unique.",
        features: {
            Capacity: "300 ml",
            Material: "Rice Husk & Polymer Blend",
            Thermal: "Comfortable cool-touch outer wall",
            Safety: "BPA-Free, non-toxic, microwave safe",
        },
        isActive: true,
        isFeatured: true,
        averageRating: 4.8,
        reviewCount: 64,
    },
    {
        name: "Statement Mug 350 ml",
        slug: "statement-mug-350-ml",
        originalPrice: 449,
        discountedPrice: 299,
        categorySlug: "drinkware",
        colors: [
            {
                name: "Espresso Charcoal",
                hex: "#44403c",
                stock: 50,
                images: ["/products/statement-mug-350-ml.jpg"],
            },
        ],
        description: "Tactile ribbed coffee mug holding 350ml in rich espresso brown/charcoal. Engineered with rice husk bio-composite for extra strength, heat retention, and a modern architectural grip.",
        features: {
            Capacity: "350 ml",
            Texture: "Vertical tactile grip ridges",
            Material: "Reinforced Rice Husk Polymer Composite",
            Finish: "Matte stone-like speckled finish",
        },
        isActive: true,
        isFeatured: true,
        averageRating: 4.9,
        reviewCount: 37,
    },
    {
        name: "Motiva insulated bottle 400 ml,600ml",
        slug: "motiva-insulated-bottle",
        originalPrice: 1199,
        discountedPrice: 799,
        categorySlug: "drinkware",
        colors: [
            {
                name: "Sand Beige with Terra Accent",
                hex: "#d5bdaf",
                stock: 30,
                images: ["/products/motiva-insulated-bottle.jpg"],
            },
        ],
        description: "Sleek travel insulated bottle available in 400ml & 600ml with silicone grab strap. Natural rice husk exterior provides a non-slip, sweat-proof grip with double-wall thermal insulation.",
        features: {
            Capacities: "400 ml & 600 ml",
            Material: "Rice Husk Composite Exterior + Thermal Core",
            Strap: "Heavy-duty silicone carry lanyard",
            Leakproof: "360-degree leakproof twist cap",
        },
        isActive: true,
        isFeatured: true,
        averageRating: 4.8,
        reviewCount: 41,
    },
    {
        name: "Velvata tissue box",
        slug: "velvata-tissue-box",
        originalPrice: 699,
        discountedPrice: 499,
        categorySlug: "home-living",
        colors: [
            {
                name: "Dual Mocha & Sand",
                hex: "#78716c",
                stock: 40,
                images: ["/products/velvata-tissue-box.jpg"],
            },
        ],
        description: "Two-tone rectangular facial tissue dispenser box. Crafted from rice husk composite with a weighted base and magnetic lock. Upgrades any coffee table, dining counter, bathroom, or vanity.",
        features: {
            Material: "High-density Rice Husk Composite",
            Design: "Two-tone mocha and sand minimalist case",
            Dispensing: "Wide rounded opening for smooth tear-free pull",
            Weight: "Sturdy base prevents lifting when pulling tissue",
        },
        isActive: true,
        isFeatured: true,
        averageRating: 4.7,
        reviewCount: 19,
    },
    {
        name: "Coaster",
        slug: "coaster-set",
        originalPrice: 349,
        discountedPrice: 229,
        categorySlug: "home-living",
        colors: [
            {
                name: "Mint Sage Green",
                hex: "#a7f3d0",
                stock: 80,
                images: ["/products/eco-coaster.jpg"],
            },
        ],
        description: "Set of 6 absorbent, heat-resistant drink coasters with custom matching holder stand. Engineered from rice husk bio-composite to protect wooden and glass surfaces from heat, condensation, and stains.",
        features: {
            Quantity: "Set of 6 with matching holder cradle",
            Material: "Eco Rice Husk & Polymer Composite",
            Protection: "Heat resistant up to 120°C & condensation safe",
            Grip: "Non-marring surface contact",
        },
        isActive: true,
        isFeatured: true,
        averageRating: 4.9,
        reviewCount: 58,
    },
];

const seedDatabase = async () => {
    try {
        await connectDB();

        console.log("🌱 Cleaning existing categories, products, and old banners in MongoDB Atlas...");
        await Product.deleteMany({});
        await Category.deleteMany({});
        await Banner.deleteMany({});

        console.log("🌱 Seeding official Rice Husk categories...");
        const createdCategories = {};
        for (const cat of CATEGORIES_DATA) {
            const doc = await Category.create(cat);
            createdCategories[cat.slug] = doc._id;
            console.log(`  ✓ Category: ${doc.name}`);
        }

        console.log("🌱 Seeding 14 official Rice Husk composite products...");
        for (const prod of PRODUCTS_DATA) {
            const categoryId = createdCategories[prod.categorySlug];
            if (!categoryId) {
                console.warn(`  ⚠️ Category slug not found: ${prod.categorySlug}`);
                continue;
            }

            const totalStock = prod.colors.reduce((sum, c) => sum + (c.stock || 0), 0);

            await Product.create({
                name: prod.name,
                slug: prod.slug,
                originalPrice: prod.originalPrice,
                discountedPrice: prod.discountedPrice,
                category: categoryId,
                colors: prod.colors,
                description: prod.description,
                features: prod.features,
                materialInfo: {
                    baseMaterial: "Upcycled Agricultural Rice Husk",
                    matrix: "Durable Recyclable Polymer Composite",
                    process: "Bio-composite compression & precision molding",
                    benefits: "Saves 40%+ virgin plastic, prevents stubble burning, superior impact strength",
                },
                totalStock,
                isActive: prod.isActive,
                isFeatured: prod.isFeatured,
                averageRating: prod.averageRating,
                reviewCount: prod.reviewCount,
            });
            console.log(`  ✓ Product: ${prod.name}`);
        }

        console.log("🌱 Seeding authentic Rice Husk hero banners...");
        await Banner.create([
            {
                title: "Crafted From Rice Husk & Polymer",
                subtitle: "Transforming agricultural rice husk into high-strength, beautiful, and durable eco-essentials.",
                mediaType: "image",
                mediaUrl: "/home-about.jpg",
                category: createdCategories["kitchen-dining"],
                isActive: true,
                order: 1,
            },
            {
                title: "Sustainable Living, Redefined",
                subtitle: "Upcycled Agricultural Biomass Engineered For Premium Durability & High Strength.",
                mediaType: "image",
                mediaUrl: "/products/romano-planter.jpg",
                category: createdCategories["home-living"],
                isActive: true,
                order: 2,
            },
            {
                title: "Eco Drinkware & Modular Storage",
                subtitle: "Shatter-Resistant, Food-Safe & Thermal Insulated Bio-Composites.",
                mediaType: "image",
                mediaUrl: "/products/eco-spring-insulated-bottle.jpg",
                category: createdCategories["drinkware"],
                isActive: true,
                order: 3,
            },
        ]);
        console.log("  ✓ Seeded 3 authentic Rice Husk banners");

        console.log("\n🎉 Database seeding completed successfully!");
        console.log(`- 5 Categories seeded`);
        console.log(`- ${PRODUCTS_DATA.length} Rice Husk Products seeded into '${mongoose.connection.name}' DB`);
        process.exit(0);
    } catch (error) {
        console.error("❌ Seeding failed:", error);
        process.exit(1);
    }
};

seedDatabase();
