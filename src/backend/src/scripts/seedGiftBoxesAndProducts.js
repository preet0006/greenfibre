import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { v2 as cloudinary } from "cloudinary";
import { Category } from "../models/category.model.js";
import { Product } from "../models/product.model.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadImageSafely = async (localPath, folder = "products") => {
    try {
        if (!fs.existsSync(localPath)) {
            console.log(`⚠️ Local file not found: ${localPath}`);
            return null;
        }
        const result = await cloudinary.uploader.upload(localPath, {
            folder,
            resource_type: "image",
        });
        console.log(`☁️ Uploaded to Cloudinary (${folder}): ${result.secure_url}`);
        return result.secure_url;
    } catch (err) {
        console.error(`❌ Cloudinary upload failed for ${localPath}:`, err.message);
        return null;
    }
};

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URL, {
            dbName: process.env.MONGO_DB_NAME || "greenfibre",
        });
        console.log(`✅ Connected to MongoDB Atlas (${mongoose.connection.name})`);
    } catch (error) {
        console.error("❌ MongoDB connection error:", error.message);
        process.exit(1);
    }
};

const CATEGORIES = [
    {
        name: "Gift Boxes & Hampers",
        slug: "gift-boxes",
        description: "Curated sustainable luxury gift sets, corporate hampers, and festive boxes crafted with eco-friendly rice husk composites and zero-waste packaging.",
        localImage: path.resolve(__dirname, "../../../frontend/main/public/products/gift-boxes-category.jpg"),
        fallbackImage: "/products/gift-boxes-category.jpg",
        displayOrder: 1,
        isFeatured: true,
        isActive: true,
        metaTitle: "Sustainable Gift Boxes & Hampers | Green Fibre",
        metaDescription: "Explore luxury eco-friendly gift boxes, corporate kits, and festive hampers made from recycled rice husk.",
        metaKeywords: ["gift box", "eco gift hamper", "corporate gifts", "green fibre gifts", "sustainable gifts"],
    },
    {
        name: "Kitchen & Dining",
        slug: "kitchen-and-dining",
        description: "Tableware, soup bowls, canisters, and dining accessories engineered from upcycled rice husk and polymer bio-composites.",
        localImage: path.resolve(__dirname, "../../../frontend/main/public/products/soup-bowl-250-ml.jpg"),
        fallbackImage: "/products/soup-bowl-250-ml.jpg",
        displayOrder: 2,
        isFeatured: true,
        isActive: true,
        metaTitle: "Eco Kitchen & Dining Tableware | Green Fibre",
        metaDescription: "Sustainable tableware, soup bowls, canisters and cutlery made from upcycled rice husk.",
        metaKeywords: ["kitchen", "dining", "tableware", "rice husk bowls", "eco canisters"],
    },
    {
        name: "Drinkware",
        slug: "drinkware",
        description: "Double-walled insulated bottles, travel mugs, and textured everyday drinkware crafted with rice husk composites.",
        localImage: path.resolve(__dirname, "../../../frontend/main/public/products/eco-spring-insulated-bottle.jpg"),
        fallbackImage: "/products/eco-spring-insulated-bottle.jpg",
        displayOrder: 3,
        isFeatured: true,
        isActive: true,
        metaTitle: "Sustainable Drinkware & Bottles | Green Fibre",
        metaDescription: "Insulated eco bottles, coffee mugs, and tumblers crafted from sustainable rice husk.",
        metaKeywords: ["drinkware", "eco bottles", "coffee mugs", "insulated flask", "tumbler"],
    },
    {
        name: "Home & Living",
        slug: "home-and-living",
        description: "Modern tabletop planters, tissue dispenser boxes, coaster sets, and eco-decor crafted for conscious living.",
        localImage: path.resolve(__dirname, "../../../frontend/main/public/products/romano-planter.jpg"),
        fallbackImage: "/products/romano-planter.jpg",
        displayOrder: 4,
        isFeatured: true,
        isActive: true,
        metaTitle: "Eco Home & Living Decor | Green Fibre",
        metaDescription: "Planters, coasters, and sustainable home decor crafted with natural bio-composites.",
        metaKeywords: ["home decor", "planters", "coasters", "sustainable living", "green home"],
    },
    {
        name: "Storage & Baskets",
        slug: "storage-and-baskets",
        description: "Stackable eco baskets and multi-size storage bowls with airtight freshness lids, made with rice husk polymer blend.",
        localImage: path.resolve(__dirname, "../../../frontend/main/public/products/greenhive-storage-basket.jpg"),
        fallbackImage: "/products/greenhive-storage-basket.jpg",
        displayOrder: 5,
        isFeatured: true,
        isActive: true,
        metaTitle: "Eco Storage Baskets & Organizers | Green Fibre",
        metaDescription: "Stackable sustainable baskets and airtight food storage containers.",
        metaKeywords: ["storage", "baskets", "organizers", "rice husk containers"],
    },
    {
        name: "Pet Care",
        slug: "pet-care",
        description: "Non-toxic, safe, durable, and hygienic rice husk composite food and water bowls for your pets.",
        localImage: path.resolve(__dirname, "../../../frontend/main/public/products/ecocog-pet-bowl.jpg"),
        fallbackImage: "/products/ecocog-pet-bowl.jpg",
        displayOrder: 6,
        isFeatured: true,
        isActive: true,
        metaTitle: "Sustainable Pet Care Bowls | Green Fibre",
        metaDescription: "Non-toxic, durable pet food and water bowls made from rice husk.",
        metaKeywords: ["pet care", "pet bowl", "dog bowl", "cat bowl", "non toxic pet bowl"],
    },
];

const GIFT_BOX_PRODUCTS = [
    {
        name: "Eco Luxe Executive Corporate Gift Box",
        slug: "eco-luxe-executive-corporate-gift-box",
        originalPrice: 2499,
        discountedPrice: 1799,
        categorySlug: "gift-boxes",
        description: "A sophisticated sustainable gift set curated for corporate gifting, executives, and VIP celebrations. Encased in a handcrafted matte kraft magnetic-closure gift box with personalized ribbon and embossing. Contains a thermal insulated eco bottle, speckled rice husk coffee mug, organic bamboo pen, recycled notebook, and a fragrant soy wax candle.",
        localImage: path.resolve(__dirname, "../../../frontend/main/public/products/eco-luxe-corporate-gift-box.jpg"),
        fallbackImage: "/products/eco-luxe-corporate-gift-box.jpg",
        colors: [
            {
                name: "Natural Kraft & Sage",
                hex: "#a3b18a",
                stock: 45,
            },
            {
                name: "Slate & Terracotta",
                hex: "#c87d55",
                stock: 30,
            },
            {
                name: "Blush Cream",
                hex: "#e8d5c4",
                stock: 25,
            },
        ],
        features: {
            "Box Type": "Rigid Magnetic Closure Kraft Box",
            "Set Contents": "1x Insulated Bottle (500ml), 1x Bean Green Mug (300ml), 1x Bamboo Pen, 1x Recycled Diary, 1x Organic Soy Candle",
            "Packaging": "Zero-waste honeycomb wrap with custom gift card",
            "Custom Branding": "Logo laser engraving available for corporate orders (MOQ: 25)",
            "Eco-Certification": "100% Plastic-Free & Biodegradable Outer Packaging",
            "Dishwasher Safe": "Mug and bottle body are dishwasher safe",
        },
        materialInfo: {
            "Drinkware": "Upcycled Rice Husk Bio-Composite & Stainless Steel Core",
            "Box Material": "Heavyweight Recycled Kraft Board (1200 GSM)",
            "Stationery": "FSC-certified Bamboo & Recycled Seed Paper",
        },
        isFeatured: true,
        isActive: true,
        averageRating: 4.9,
        reviewCount: 34,
        metaTitle: "Eco Luxe Executive Corporate Gift Box | Green Fibre",
        metaDescription: "Premium sustainable corporate gift hamper featuring insulated flask, coffee mug, bamboo pen, and natural candle.",
        metaKeywords: ["corporate gift box", "luxury eco hamper", "sustainable gift set", "green fibre gift box", "executive gift"],
    },
    {
        name: "Green Living Festive Hampers Box",
        slug: "green-living-festive-hampers-box",
        originalPrice: 1999,
        discountedPrice: 1449,
        categorySlug: "gift-boxes",
        description: "Celebrate festive occasions sustainably with our zero-waste festive hamper. Beautifully presented in a natural reusable rigid gift box with botanical gold-foil artwork. Features dual rice husk dining bowls, handcrafted wooden spoons, geometric coasters, and organic winter harvest teas.",
        localImage: path.resolve(__dirname, "../../../frontend/main/public/products/green-living-festive-hamper.jpg"),
        fallbackImage: "/products/green-living-festive-hamper.jpg",
        colors: [
            {
                name: "Festive Forest Green",
                hex: "#2d5a27",
                stock: 50,
            },
            {
                name: "Warm Ochre & Gold",
                hex: "#d4a373",
                stock: 35,
            },
        ],
        features: {
            "Box Type": "Luxury Reusable Book-fold Rigid Hamper Box",
            "Set Contents": "2x Eco-Serve Bowls (350ml), 2x Rice Husk Serving Spoons, 4x Drip-Guard Coasters, 1x Organic Honey Jar, 1x Herbal Tea Blend",
            "Presentation": "Natural wood wool filling with gold-embossed ribbon",
            "Occasions": "Diwali, Christmas, New Year, Weddings, Anniversaries",
            "Food Safety": "US-FDA Approved Food-Safe & BPA Free",
        },
        materialInfo: {
            "Bowls & Spoons": "Agricultural Rice Husk Composite",
            "Coasters": "Natural Cork & Husk Blend",
            "Gift Packaging": "Recycled Paperboard with Soy-based Inks",
        },
        isFeatured: true,
        isActive: true,
        averageRating: 4.8,
        reviewCount: 28,
        metaTitle: "Green Living Festive Hampers Box | Green Fibre",
        metaDescription: "Eco-friendly festive luxury hamper with tableware, coasters, organic tea, and premium gift packaging.",
        metaKeywords: ["festive hamper", "eco diwali gift", "sustainable gift hamper", "green fibre festive box"],
    },
    {
        name: "Zen Workspace Eco Desk Gift Box",
        slug: "zen-workspace-eco-desk-gift-box",
        originalPrice: 1899,
        discountedPrice: 1299,
        categorySlug: "gift-boxes",
        description: "Transform any work desk into a serene, eco-conscious sanctuary. A perfect welcome kit, employee appreciation gift, or work-from-home upgrade. Packed with a fluted Romano tabletop succulent planter, matching desk organizer cup, thermal travel tumbler, and plantable seed paper notes.",
        localImage: path.resolve(__dirname, "../../../frontend/main/public/products/zen-workspace-desk-gift-box.jpg"),
        fallbackImage: "/products/zen-workspace-desk-gift-box.jpg",
        colors: [
            {
                name: "Scandinavian Oat & Sage",
                hex: "#84a98c",
                stock: 40,
            },
            {
                name: "Dusty Sand & Rose",
                hex: "#d5bdaf",
                stock: 30,
            },
        ],
        features: {
            "Box Type": "Eco Foldable Kraft Mailing & Gift Box",
            "Set Contents": "1x Romano Fluted Planter (Succulent friendly), 1x Pen Holder Organizer, 1x Eco-sip Tumbler (350ml), 1x Plantable Seed Paper Memo Set",
            "Drainage": "Planter includes built-in drainage plug",
            "Care": "Wipe clean with a damp cloth; tumbler is dishwasher safe",
        },
        materialInfo: {
            "Desk Set": "Fluted Rice Husk Bio-Polymer Composite",
            "Drinkware": "Double-walled rice husk exterior with 304 food-grade core",
            "Stationery": "100% Recycled Cotton Rag & Embedded Basil Seeds",
        },
        isFeatured: true,
        isActive: true,
        averageRating: 4.9,
        reviewCount: 42,
        metaTitle: "Zen Workspace Eco Desk Gift Box | Green Fibre",
        metaDescription: "Eco-friendly desk setup gift box with tabletop planter, organizer cup, coffee tumbler, and seed notes.",
        metaKeywords: ["desk gift box", "employee welcome kit", "office gift hamper", "planter gift box"],
    },
    {
        name: "Artisan Coffee & Tea Connoisseur Gift Box",
        slug: "artisan-coffee-tea-connoisseur-gift-box",
        originalPrice: 2299,
        discountedPrice: 1599,
        categorySlug: "gift-boxes",
        description: "The ultimate gifting choice for tea and coffee connoisseurs. Features two speckled matte Bean Green mugs, a sleek vacuum insulated travel tumbler with tea infuser, two handcrafted drink coasters, and an airtight roast coffee bean canister.",
        localImage: path.resolve(__dirname, "../../../frontend/main/public/products/coffee-tea-connoisseur-gift-box.jpg"),
        fallbackImage: "/products/coffee-tea-connoisseur-gift-box.jpg",
        colors: [
            {
                name: "Warm Mocha & Oat",
                hex: "#6f4e37",
                stock: 35,
            },
            {
                name: "Nordic Charcoal & Ivory",
                hex: "#3d3a45",
                stock: 30,
            },
        ],
        features: {
            "Box Type": "Artisan Geometric Embossed Kraft Rigid Box",
            "Set Contents": "2x Bean Green Mugs (300ml), 1x Insulated Coffee/Tea Flask (450ml with infuser), 2x Wooden Coasters, 1x Coffee Jar",
            "Thermal Rating": "Keeps beverages hot for 12 hours / cold for 24 hours",
            "Microwave Safe": "Mugs are 100% microwave and dishwasher friendly",
        },
        materialInfo: {
            "Mugs & Canister": "Rice Husk Fibre Composite",
            "Flask": "Vacuum Insulated Stainless Steel with Rice Husk Touch Finish",
            "Coasters": "Reclaimed Acacia Wood with Natural Oil Finish",
        },
        isFeatured: true,
        isActive: true,
        averageRating: 5.0,
        reviewCount: 51,
        metaTitle: "Artisan Coffee & Tea Gift Box Hamper | Green Fibre",
        metaDescription: "Artisan coffee and tea lover's gift box featuring dual eco mugs, insulated flask, and coasters.",
        metaKeywords: ["coffee gift box", "tea gift hamper", "mug gift set", "insulated flask gift"],
    },
    {
        name: "Sustainable Housewarming Dining Gift Box",
        slug: "sustainable-housewarming-dining-gift-box",
        originalPrice: 3199,
        discountedPrice: 2299,
        categorySlug: "gift-boxes",
        description: "A heartfelt, long-lasting gift box designed for housewarmings, bridal showers, and family milestones. Completely food-safe, break-resistant, and created to replace everyday plastics with natural aesthetic tableware. Includes 4 soup/salad bowls, 4 side plates, an airtight canister, and pure linen napkins.",
        localImage: path.resolve(__dirname, "../../../frontend/main/public/products/sustainable-housewarming-gift-box.jpg"),
        fallbackImage: "/products/sustainable-housewarming-gift-box.jpg",
        colors: [
            {
                name: "Natural Oatmeal Speckled",
                hex: "#e6ccb2",
                stock: 25,
            },
            {
                name: "Pastel Mint Grey",
                hex: "#c7d9c8",
                stock: 20,
            },
        ],
        features: {
            "Box Type": "Heavy Duty Luxury Hamper Box with Jute Bow",
            "Set Contents": "4x Dining Bowls (350ml), 4x Side Plates (8-inch), 1x Airtight Kitchen Canister (700ml), 4x 100% Organic Linen Napkins",
            "Durability": "Chip resistant, shatter-proof, kid & family safe",
            "Microwave & Dishwasher": "Safe up to 120°C",
        },
        materialInfo: {
            "Dinnerware": "Natural Agricultural Rice Husk Bio-Composite",
            "Canister Lid": "Sustainable Natural Bamboo with Food-grade Silicone Ring",
            "Linens": "100% Unbleached Organic Flax Linen",
        },
        isFeatured: true,
        isActive: true,
        averageRating: 4.9,
        reviewCount: 19,
        metaTitle: "Sustainable Housewarming Dining Gift Box | Green Fibre",
        metaDescription: "Eco-friendly dining tableware gift set with 4 bowls, 4 plates, bamboo canister, and linen napkins.",
        metaKeywords: ["housewarming gift", "dining gift set", "eco dinnerware box", "wedding gift hamper"],
    },
    {
        name: "Signature Couple's Wellness Gift Box",
        slug: "signature-couples-wellness-gift-box",
        originalPrice: 2799,
        discountedPrice: 1999,
        categorySlug: "gift-boxes",
        description: "A harmoniously curated eco-wellness gift hamper designed for couples, anniversaries, and luxury gifting. Comes in a blush pink and sage green slide-drawer gift box. Includes two color-coordinated thermal travel bottles with carry loops, 3 handcrafted artisan botanical soap bars, and two ceramic-look speckled soap/drink dishes.",
        localImage: path.resolve(__dirname, "../../../frontend/main/public/products/couples-wellness-gift-box.jpg"),
        fallbackImage: "/products/couples-wellness-gift-box.jpg",
        colors: [
            {
                name: "Blush Pink & Sage Green Pair",
                hex: "#e29578",
                stock: 30,
            },
            {
                name: "Charcoal & Ivory Pair",
                hex: "#4a4e69",
                stock: 20,
            },
        ],
        features: {
            "Box Type": "Luxury Pull-Drawer Rigid Gift Hamper",
            "Set Contents": "2x Insulated Eco-Sip Bottles (500ml), 3x Cold-pressed Organic Soap Bars (Lavender, Rose, Oat), 2x Speckled Dish Coasters",
            "Bottle Insulation": "Double-walled copper-lined vacuum shield with ergonomic carry cord",
            "Skin Safety": "100% Chemical-free, Paraben-free botanical soaps",
        },
        materialInfo: {
            "Bottles": "Rice Husk Fibre Exterior with Stainless 304 Interior",
            "Dishes": "Bio-composite speckled finish",
            "Packaging": "FSC-certified rigid gift box with satin pull ribbon",
        },
        isFeatured: true,
        isActive: true,
        averageRating: 5.0,
        reviewCount: 37,
        metaTitle: "Signature Couple's Wellness Gift Box | Green Fibre",
        metaDescription: "Luxury eco wellness gift set with matching thermal flasks, artisan soaps, and decorative dishes.",
        metaKeywords: ["couples gift box", "wellness hamper", "anniversary eco gift", "sustainable couple gifts"],
    },
];

const OTHER_PRODUCTS = [
    // --- DRINKWARE ---
    {
        name: "Bean Green 300ml Eco Mug",
        slug: "bean-green-300-ml",
        originalPrice: 499,
        discountedPrice: 349,
        categorySlug: "drinkware",
        description: "A softly speckled, matte-finish mug made from upcycled rice husk fibre composite, designed for everyday coffee, tea, and warm beverages. Comfortable ergonomic grip with chip-resistant rim.",
        localImage: path.resolve(__dirname, "../../../frontend/main/public/products/classic-mug-300-ml.jpg"),
        fallbackImage: "/products/classic-mug-300-ml.jpg",
        colors: [
            {
                name: "Blush Cream",
                hex: "#e8d5c4",
                stock: 60,
                images: ["https://res.cloudinary.com/dsebrpcyz/image/upload/v1789454444/ChatGPT_Image_Sep_15_2026_12_09_21_PM_vtn9ht.png"],
            },
            {
                name: "Earthy Sage",
                hex: "#93a8ac",
                stock: 45,
                images: ["/products/classic-mug-300-ml.jpg"],
            },
        ],
        features: {
            "Capacity": "300 ml",
            "Dimensions": "W 8.5 cm × H 9.5 cm",
            "Weight": "Approx. 141 g",
            "Microwave Friendly": "Yes",
            "Dishwasher Friendly": "Yes",
            "Stackable": "Yes",
        },
        materialInfo: {
            "Material": "Rice husk fibre composite",
            "Finish": "Food-safe matte speckle",
        },
        isFeatured: true,
        isActive: true,
        averageRating: 4.8,
        reviewCount: 47,
        metaTitle: "Bean Green 300ml Eco Mug | Green Fibre",
        metaDescription: "Premium 300ml rice husk fibre composite mug for coffee and tea.",
        metaKeywords: ["mug", "bean green", "coffee mug", "rice husk mug", "eco mug"],
    },
    {
        name: "Eco Spring Insulated Bottle 650ml",
        slug: "eco-spring-insulated-bottle",
        originalPrice: 1299,
        discountedPrice: 899,
        categorySlug: "drinkware",
        description: "Double-walled thermal insulated eco bottle with an outer shell made of rice husk composite and stainless steel interior. Keeps beverages icy cold for 24 hours and piping hot for 12 hours.",
        localImage: path.resolve(__dirname, "../../../frontend/main/public/products/eco-spring-insulated-bottle.jpg"),
        fallbackImage: "/products/eco-spring-insulated-bottle.jpg",
        colors: [
            {
                name: "Blush Speckled",
                hex: "#fbcfe8",
                stock: 35,
                images: ["/products/eco-spring-insulated-bottle.jpg"],
            },
            {
                name: "Forest Mist",
                hex: "#2d6a4f",
                stock: 25,
                images: ["/products/motiva-insulated-bottle.jpg"],
            },
        ],
        features: {
            "Capacity": "650 ml",
            "Insulation": "Double-walled vacuum thermal shield",
            "Cap": "Leakproof with Ergonomic Carry Loop",
            "BPA Free": "Yes",
        },
        materialInfo: {
            "Exterior": "Rice Husk Composite Grip",
            "Interior": "Food-grade 304 Stainless Steel",
        },
        isFeatured: true,
        isActive: true,
        averageRating: 4.9,
        reviewCount: 56,
        metaTitle: "Eco Spring Insulated Bottle | Green Fibre",
        metaDescription: "650ml double-walled thermal insulated bottle made with rice husk shell.",
        metaKeywords: ["insulated bottle", "thermal flask", "eco water bottle", "rice husk bottle"],
    },
    {
        name: "Green Eco-Sip Bottle 400ml",
        slug: "green-eco-sip-bottle-400-ml",
        originalPrice: 899,
        discountedPrice: 599,
        categorySlug: "drinkware",
        description: "A compact Green Eco-Sip bottle featuring a natural rice husk body, food-safe liner, contrasting silicone-sealed cap, and sturdy jute carry loop.",
        localImage: path.resolve(__dirname, "../../../frontend/main/public/products/eco-spring-insulated-bottle.jpg"),
        fallbackImage: "/products/eco-spring-insulated-bottle.jpg",
        colors: [
            {
                name: "Natural Oat & Terracotta",
                hex: "#d4a373",
                stock: 40,
                images: ["https://res.cloudinary.com/dsebrpcyz/image/upload/v1789452123/ChatGPT_Image_Sep_15_2026_11_14_58_AM_yzwgoe.png"],
            },
        ],
        features: {
            "Capacity": "400 ml",
            "Double Walled": "Yes",
            "Carry Loop": "Natural braided jute loop",
            "Leakproof": "Yes, silicone seal gasket",
        },
        materialInfo: {
            "Body": "Rice husk fibre composite",
            "Liner": "Food-safe thermal core",
        },
        isFeatured: false,
        isActive: true,
        averageRating: 4.7,
        reviewCount: 23,
        metaTitle: "Green Eco-Sip Bottle 400ml | Green Fibre",
        metaDescription: "400ml compact eco bottle with rice husk composite body and jute loop.",
        metaKeywords: ["eco sip bottle", "400ml bottle", "green fibre bottle"],
    },
    {
        name: "Statement Mug 350ml",
        slug: "statement-mug-350-ml",
        originalPrice: 549,
        discountedPrice: 399,
        categorySlug: "drinkware",
        description: "A bold modern silhouette mug with an architectural wide handle, crafted from speckle-textured rice husk bio-composite.",
        localImage: path.resolve(__dirname, "../../../frontend/main/public/products/statement-mug-350-ml.jpg"),
        fallbackImage: "/products/statement-mug-350-ml.jpg",
        colors: [
            {
                name: "Nordic Oatmeal",
                hex: "#e2d7c5",
                stock: 50,
                images: ["/products/statement-mug-350-ml.jpg"],
            },
        ],
        features: {
            "Capacity": "350 ml",
            "Handle": "Architectural easy-grip handle",
            "Microwave Safe": "Yes",
            "Dishwasher Safe": "Yes",
        },
        materialInfo: {
            "Material": "Rice husk composite",
            "Finish": "Textured matte",
        },
        isFeatured: false,
        isActive: true,
        averageRating: 4.8,
        reviewCount: 15,
        metaTitle: "Statement Mug 350ml | Green Fibre",
        metaDescription: "Modern architectural 350ml rice husk mug for conscious living.",
        metaKeywords: ["statement mug", "large coffee mug", "eco mug"],
    },

    // --- HOME & LIVING ---
    {
        name: "Romano Planter Pot",
        slug: "romano-planter",
        originalPrice: 799,
        discountedPrice: 549,
        categorySlug: "home-and-living",
        description: "Fluted tabletop planter pot crafted by blending agricultural rice husk with durable polymer. Features an organic speckled texture, natural root breathability, and integrated drainage.",
        localImage: path.resolve(__dirname, "../../../frontend/main/public/products/romano-planter.jpg"),
        fallbackImage: "/products/romano-planter.jpg",
        colors: [
            {
                name: "Dusty Rose Pink",
                hex: "#f472b6",
                stock: 45,
                images: ["/products/romano-planter.jpg"],
            },
            {
                name: "Oat Speckle",
                hex: "#dfd5c6",
                stock: 35,
                images: ["/products/statement-table-top-planter.jpg"],
            },
        ],
        features: {
            "Dimensions": "W 14 cm × H 12 cm",
            "Finish": "Fluted matte speckle",
            "Drainage": "Removable silicone drainage plug",
            "Weatherproof": "UV-resistant and waterproof",
        },
        materialInfo: {
            "Material": "Upcycled Rice Husk & Polymer Composite",
        },
        isFeatured: true,
        isActive: true,
        averageRating: 4.9,
        reviewCount: 38,
        metaTitle: "Romano Fluted Planter | Green Fibre",
        metaDescription: "Fluted rice husk tabletop planter for indoor plants and succulents.",
        metaKeywords: ["planter", "romano planter", "succulent pot", "eco planter"],
    },
    {
        name: "Tulsi Sacred Eco Planter",
        slug: "tulsi-planter",
        originalPrice: 849,
        discountedPrice: 599,
        categorySlug: "home-and-living",
        description: "A sacred Tulsi planter designed for home, balcony, pooja room and auspicious gifting, crafted with Green Fibre's natural rice husk material.",
        localImage: path.resolve(__dirname, "../../../frontend/main/public/products/romano-planter.jpg"),
        fallbackImage: "/products/romano-planter.jpg",
        colors: [
            {
                name: "Natural Terracotta Oat",
                hex: "#c87d55",
                stock: 30,
                images: ["https://res.cloudinary.com/dsebrpcyz/image/upload/v1789452144/ChatGPT_Image_Sep_15_2026_11_24_53_AM_c4j4uj.png"],
            },
        ],
        features: {
            "Use": "Pooja, balcony, indoor Tulsi planting",
            "Lightweight & Non-Fragile": "Yes, shatterproof",
            "Drainage Tray": "Integrated base saucer",
        },
        materialInfo: {
            "Material": "Rice husk composite",
        },
        isFeatured: false,
        isActive: true,
        averageRating: 4.9,
        reviewCount: 22,
        metaTitle: "Tulsi Sacred Eco Planter | Green Fibre",
        metaDescription: "Sacred eco-friendly Tulsi pot crafted from rice husk composite.",
        metaKeywords: ["tulsi pot", "tulsi planter", "pooja planter", "eco pot"],
    },
    {
        name: "Drip-Guard Eco Coaster Set (6 Pcs)",
        slug: "drip-guard-coaster-set",
        originalPrice: 499,
        discountedPrice: 349,
        categorySlug: "home-and-living",
        description: "Heat-resistant round coasters with a matching holder stand for office desks and dining tables. Prevents water marks and protects delicate furniture.",
        localImage: path.resolve(__dirname, "../../../frontend/main/public/products/eco-coaster.jpg"),
        fallbackImage: "/products/eco-coaster.jpg",
        colors: [
            {
                name: "Off-White Speckled",
                hex: "#f5f5f0",
                stock: 75,
                images: ["/products/eco-coaster.jpg"],
            },
        ],
        features: {
            "Set Contents": "6 coasters + 1 holder dock",
            "Diameter": "9.5 cm",
            "Heat Resistant": "Up to 100°C",
            "Anti-Slip": "Grooved base",
        },
        materialInfo: {
            "Material": "Rice husk fibre composite",
        },
        isFeatured: false,
        isActive: true,
        averageRating: 4.6,
        reviewCount: 29,
        metaTitle: "Drip-Guard Eco Coaster Set | Green Fibre",
        metaDescription: "Set of 6 eco-friendly rice husk drink coasters with matching stand.",
        metaKeywords: ["coasters", "coaster set", "table coasters", "eco coasters"],
    },
    {
        name: "Velvata Tissue Dispenser Box",
        slug: "velvata-tissue-box",
        originalPrice: 899,
        discountedPrice: 649,
        categorySlug: "home-and-living",
        description: "A minimalist matte tissue dispenser box with smooth rounded edges, designed to elevate vanity tables, dining areas, and car interiors.",
        localImage: path.resolve(__dirname, "../../../frontend/main/public/products/velvata-tissue-box.jpg"),
        fallbackImage: "/products/velvata-tissue-box.jpg",
        colors: [
            {
                name: "Sand Beige",
                hex: "#d5bdaf",
                stock: 30,
                images: ["/products/velvata-tissue-box.jpg"],
            },
        ],
        features: {
            "Dimensions": "L 22 cm × W 12 cm × H 9 cm",
            "Refillable": "Bottom pop-out plate for easy refills",
            "Water Resistant": "Ideal for bathroom counters",
        },
        materialInfo: {
            "Material": "Rice husk polymer composite",
        },
        isFeatured: false,
        isActive: true,
        averageRating: 4.7,
        reviewCount: 14,
        metaTitle: "Velvata Tissue Dispenser Box | Green Fibre",
        metaDescription: "Minimalist sustainable tissue box holder for home and car.",
        metaKeywords: ["tissue box", "tissue dispenser", "eco home decor"],
    },

    // --- KITCHEN & DINING ---
    {
        name: "Eco-Serve Soup Bowl 350ml",
        slug: "eco-serve-soup-bowl-350-ml",
        originalPrice: 399,
        discountedPrice: 279,
        categorySlug: "kitchen-and-dining",
        description: "A lightweight yet sturdy rice husk soup and cereal bowl designed for everyday serving and conscious dining. Smooth lip and heat-insulating feel.",
        localImage: path.resolve(__dirname, "../../../frontend/main/public/products/soup-bowl-250-ml.jpg"),
        fallbackImage: "/products/soup-bowl-250-ml.jpg",
        colors: [
            {
                name: "Natural Oat & Sage",
                hex: "#9aa085",
                stock: 70,
                images: [
                    "https://res.cloudinary.com/dsebrpcyz/image/upload/v1789543178/1_hero_bowl_of_goodness_zjcypd.png",
                    "https://res.cloudinary.com/dsebrpcyz/image/upload/v1789543178/2_from_our_kitchen_pcvdqf.png",
                    "https://res.cloudinary.com/dsebrpcyz/image/upload/v1789543178/3_beautifully_useful_cvqwni.png",
                ],
            },
        ],
        features: {
            "Capacity": "350 ml",
            "Size": "W 13 cm × H 6 cm",
            "Weight": "125 g",
            "Microwave Safe": "Yes (up to 3 min)",
            "Dishwasher Safe": "Yes",
        },
        materialInfo: {
            "Material": "Rice husk bio-composite",
            "Finish": "Smooth food-safe matte",
        },
        isFeatured: true,
        isActive: true,
        averageRating: 4.8,
        reviewCount: 39,
        metaTitle: "Eco-Serve Soup Bowl 350ml | Green Fibre",
        metaDescription: "350ml eco-friendly soup and cereal bowl made from rice husk.",
        metaKeywords: ["soup bowl", "cereal bowl", "tableware", "rice husk bowl"],
    },
    {
        name: "Canister 700 ml Airtight Food Jar",
        slug: "canister-700-ml",
        originalPrice: 599,
        discountedPrice: 449,
        categorySlug: "kitchen-and-dining",
        description: "Airtight 700ml kitchen canister crafted from rice husk composite. Ideal for lentils, dry fruits, grains, tea leaves, and spices with a silicone freshness seal.",
        localImage: path.resolve(__dirname, "../../../frontend/main/public/products/canister-700-ml.jpg"),
        fallbackImage: "/products/canister-700-ml.jpg",
        colors: [
            {
                name: "Oat Natural",
                hex: "#e5dec9",
                stock: 55,
                images: ["/products/canister-700-ml.jpg"],
            },
        ],
        features: {
            "Capacity": "700 ml",
            "Seal": "Airtight Silicone Freshness Ring",
            "Stackable": "Modular nesting lid",
        },
        materialInfo: {
            "Material": "Rice Husk & Polymer Bio-Composite",
        },
        isFeatured: true,
        isActive: true,
        averageRating: 4.7,
        reviewCount: 26,
        metaTitle: "Canister 700ml Airtight Storage Jar | Green Fibre",
        metaDescription: "700ml airtight pantry storage canister made from sustainable rice husk.",
        metaKeywords: ["canister", "food jar", "kitchen storage", "airtight jar"],
    },
    {
        name: "Curve Steel & Rice Husk Dual Bowl",
        slug: "curve-steel-bowl",
        originalPrice: 699,
        discountedPrice: 499,
        categorySlug: "kitchen-and-dining",
        description: "A dual-material serving bowl with a polished stainless steel interior and a heat-insulating rice husk speckled outer shell.",
        localImage: path.resolve(__dirname, "../../../frontend/main/public/products/curve-steel-bowl.jpg"),
        fallbackImage: "/products/curve-steel-bowl.jpg",
        colors: [
            {
                name: "Speckled Grey & Steel",
                hex: "#adb5bd",
                stock: 35,
                images: ["/products/curve-steel-bowl.jpg"],
            },
        ],
        features: {
            "Capacity": "500 ml",
            "Insulation": "Exterior stays cool to the touch with hot soups",
            "Durability": "Heavy-duty unbreakable design",
        },
        materialInfo: {
            "Outer": "Rice husk composite",
            "Inner": "Food-grade stainless steel 304",
        },
        isFeatured: false,
        isActive: true,
        averageRating: 4.8,
        reviewCount: 16,
        metaTitle: "Curve Steel Dual Bowl | Green Fibre",
        metaDescription: "Insulated soup bowl with steel liner and rice husk exterior shell.",
        metaKeywords: ["steel bowl", "insulated bowl", "kitchen bowl"],
    },

    // --- STORAGE & BASKETS ---
    {
        name: "Greenhive Storage Basket with Lid",
        slug: "greenhive-storage-basket",
        originalPrice: 999,
        discountedPrice: 699,
        categorySlug: "storage-and-baskets",
        description: "Multi-purpose stackable storage basket with fitted lid. Features a woven ventilated lattice pattern crafted from durable rice husk polymer composite. Ideal for wardrobe, pantry, and desk organization.",
        localImage: path.resolve(__dirname, "../../../frontend/main/public/products/greenhive-storage-basket.jpg"),
        fallbackImage: "/products/greenhive-storage-basket.jpg",
        colors: [
            {
                name: "Pastel Mint & Blush",
                hex: "#a7f3d0",
                stock: 35,
                images: ["/products/greenhive-storage-basket.jpg"],
            },
        ],
        features: {
            "Design": "Ventilated lattice pattern with lid",
            "Stackable": "Interlocking modular structure",
            "Washable": "100% water washable and mould-resistant",
        },
        materialInfo: {
            "Material": "High-strength Rice Husk Bio-Composite",
        },
        isFeatured: true,
        isActive: true,
        averageRating: 4.6,
        reviewCount: 22,
        metaTitle: "Greenhive Storage Basket with Lid | Green Fibre",
        metaDescription: "Stackable lattice storage basket made from rice husk bio-composite.",
        metaKeywords: ["storage basket", "organizer basket", "pantry basket"],
    },
    {
        name: "Airtight Freshness Storage Bowl Set (3 Pcs)",
        slug: "airtight-freshness-storage-bowl-set",
        originalPrice: 1199,
        discountedPrice: 849,
        categorySlug: "storage-and-baskets",
        description: "Set of 3 nesting food storage bowls (300ml, 600ml, 900ml) with snap-fit silicone sealed lids for refrigerator and pantry storage.",
        localImage: path.resolve(__dirname, "../../../frontend/main/public/products/storage-bowl.jpg"),
        fallbackImage: "/products/storage-bowl.jpg",
        colors: [
            {
                name: "Natural Oat Trio",
                hex: "#d6c7b2",
                stock: 40,
                images: ["/products/storage-bowl.jpg"],
            },
        ],
        features: {
            "Set Sizes": "300 ml, 600 ml, 900 ml nesting bowls",
            "Lids": "Snap-lock airtight silicone seal",
            "Freezer Safe": "Yes, down to -20°C",
        },
        materialInfo: {
            "Material": "Rice husk composite & Food-grade silicone",
        },
        isFeatured: false,
        isActive: true,
        averageRating: 4.9,
        reviewCount: 31,
        metaTitle: "Airtight Storage Bowl Set | Green Fibre",
        metaDescription: "3-piece nesting airtight food storage bowl set made from rice husk.",
        metaKeywords: ["storage bowls", "food container set", "airtight bowls"],
    },

    // --- PET CARE ---
    {
        name: "Ecocog Pet Food & Water Bowl",
        slug: "ecocog-pet-bowl",
        originalPrice: 899,
        discountedPrice: 649,
        categorySlug: "pet-care",
        description: "Durable, non-toxic pet food and water bowl made by blending agricultural rice husk with safe polymer. Odor-resistant with a sturdy weighted non-slip base that prevents tipping.",
        localImage: path.resolve(__dirname, "../../../frontend/main/public/products/ecocog-pet-bowl.jpg"),
        fallbackImage: "/products/ecocog-pet-bowl.jpg",
        colors: [
            {
                name: "Natural Rice Husk Beige",
                hex: "#d6c7b2",
                stock: 50,
                images: ["/products/ecocog-pet-bowl.jpg"],
            },
        ],
        features: {
            "Base": "Non-slip weighted sturdy rim",
            "Safety": "BPA-Free, Phthalate-free, Non-Toxic & Pet Safe",
            "Cleaning": "Dishwasher safe and stain-resistant",
            "Capacity": "750 ml",
        },
        materialInfo: {
            "Material": "Rice Husk & Food-Grade Polymer Composite",
        },
        isFeatured: true,
        isActive: true,
        averageRating: 4.8,
        reviewCount: 29,
        metaTitle: "Ecocog Non-Toxic Pet Bowl | Green Fibre",
        metaDescription: "Safe, durable non-slip pet bowl made from rice husk bio-composite.",
        metaKeywords: ["pet bowl", "dog bowl", "cat food bowl", "non toxic pet bowl"],
    },
];

const seed = async () => {
    await connectDB();

    console.log("\n📦 1. Processing Categories...");
    const categoryMap = {};

    for (const cat of CATEGORIES) {
        let imageUrl = cat.fallbackImage;
        if (cat.localImage && fs.existsSync(cat.localImage)) {
            const uploaded = await uploadImageSafely(cat.localImage, "categories");
            if (uploaded) imageUrl = uploaded;
        }

        const categoryDoc = {
            name: cat.name,
            slug: cat.slug,
            description: cat.description,
            image: imageUrl,
            displayOrder: cat.displayOrder,
            isFeatured: cat.isFeatured,
            isActive: cat.isActive,
            metaTitle: cat.metaTitle,
            metaDescription: cat.metaDescription,
            metaKeywords: cat.metaKeywords,
        };

        const updated = await Category.findOneAndUpdate(
            { slug: cat.slug },
            { $set: categoryDoc },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        categoryMap[cat.slug] = updated._id;
        console.log(`   ✅ Category ready: ${cat.name} (${updated._id})`);
    }

    console.log("\n🎁 2. Uploading and Seeding Gift Box Products...");
    const allProducts = [...GIFT_BOX_PRODUCTS, ...OTHER_PRODUCTS];
    let createdCount = 0;
    let updatedCount = 0;

    for (const prod of allProducts) {
        const catId = categoryMap[prod.categorySlug];
        if (!catId) {
            console.error(`❌ Missing category for slug: ${prod.categorySlug}`);
            continue;
        }

        // Upload main image if available
        let mainImageUrl = prod.fallbackImage;
        if (prod.localImage && fs.existsSync(prod.localImage)) {
            const uploaded = await uploadImageSafely(prod.localImage, "products");
            if (uploaded) mainImageUrl = uploaded;
        }

        // Construct color variants with images
        const colors = (prod.colors || []).map((c, idx) => {
            let colorImages = c.images && c.images.length > 0 ? c.images : [mainImageUrl];
            return {
                name: c.name,
                hex: c.hex || "#e5dec9",
                stock: c.stock !== undefined ? c.stock : 25,
                images: colorImages,
            };
        });

        const productDoc = {
            name: prod.name,
            slug: prod.slug,
            originalPrice: prod.originalPrice,
            discountedPrice: prod.discountedPrice,
            description: prod.description,
            category: catId,
            subCategory: null,
            colors: colors,
            features: prod.features || {},
            materialInfo: prod.materialInfo || {},
            isActive: prod.isActive !== undefined ? prod.isActive : true,
            isFeatured: prod.isFeatured || false,
            averageRating: prod.averageRating || 4.8,
            reviewCount: prod.reviewCount || 20,
            metaTitle: prod.metaTitle,
            metaDescription: prod.metaDescription,
            metaKeywords: prod.metaKeywords,
        };

        const existing = await Product.findOne({ slug: prod.slug });
        if (existing) {
            await Product.findByIdAndUpdate(existing._id, { $set: productDoc }, { runValidators: true, new: true });
            console.log(`   🔄 Updated product: ${prod.name} (${prod.slug})`);
            updatedCount++;
        } else {
            await Product.create(productDoc);
            console.log(`   ✨ Created product: ${prod.name} (${prod.slug})`);
            createdCount++;
        }
    }

    const totalInDb = await Product.countDocuments();
    const categoriesInDb = await Category.countDocuments();

    console.log(`\n🎉 Seed Finished Successfully!`);
    console.log(`   - Total Categories in DB: ${categoriesInDb}`);
    console.log(`   - New Products Created: ${createdCount}`);
    console.log(`   - Existing Products Updated: ${updatedCount}`);
    console.log(`   - Total Products in MongoDB Atlas: ${totalInDb}`);

    process.exit(0);
};

seed().catch((err) => {
    console.error("❌ Seeding failed with error:", err);
    process.exit(1);
});
