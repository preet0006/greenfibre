import mongoose from "mongoose";
import dotenv from "dotenv";
import { Product } from "../models/product.model.js";
import { B2BProductConfig } from "../models/b2bProductConfig.model.js";

dotenv.config({ path: "./.env" });

const linkAllAddons = async () => {
    try {
        console.log("Connecting to MongoDB Atlas...");
        await mongoose.connect(process.env.MONGO_URL, {
            dbName: process.env.MONGO_DB_NAME || undefined,
        });
        console.log(`✅ Connected to MongoDB (${mongoose.connection.name})\n`);

        // Helper to find products
        const findBySlugs = async (slugs, regex = null) => {
            const query = {
                $or: [
                    { slug: { $in: slugs } },
                    ...(regex ? [{ name: { $regex: regex } }, { slug: { $regex: regex } }] : [])
                ]
            };
            return await Product.find(query);
        };

        // Fetch all target products
        const tableTopPlanters = await findBySlugs(["table-top-planter-4-inch", "table-top-planter"], /planter/i);
        const classicMugs2 = await findBySlugs(["classic-mug-set-of-2", "classic-mug-300-ml", "classic-mug"], /Classic Mug.*(2|Two|Set of 2)/i);
        const classicMugs4 = await findBySlugs(["classic-mug-set-of-4"], /Classic Mug.*(4|Four|Set of 4)/i);
        const statementMugs2 = await findBySlugs(["statement-mug-set-of-2", "statement-mug"], /Statement Mug.*(2|Two|Set of 2)/i);
        const statementMugs4 = await findBySlugs(["statement-mug-set-of-4", "four-ribbed-ceramic-mugs"], /Statement Mug.*(4|Four|Set of 4)/i);
        const canisters = await findBySlugs(["canister-700-ml", "canister"], /canister/i);
        const storageBowls = await findBySlugs(["storage-bowl-2-liter", "storage-bowl-2-9l-1-6l", "storage-bowl"], /storage.*bowl/i);
        const casseroles = await findBySlugs(["casserole-with-lid-2200-ml", "casserole-4-8-l", "casserole"], /casserole/i);
        const tissueBoxes = await findBySlugs(["tissue-box-pair-of-2", "tissue-box"], /tissue/i);
        const soupBowls = await findBySlugs(["soup-bowl-set-of-4-with-spoon", "soup-bowl-250-ml", "soup-bowl"], /^(?!.*flora).*soup.*bowl/i);
        const floraSoupBowls = await findBySlugs(["flora-soup-bowl-set-of-4", "flora-soup-bowl"], /flora.*soup/i);
        const bottles = await findBySlugs(["viora-water-bottle", "motiva-insulated-bottle", "eco-spring-insulated-bottle"], /bottle/i);

        console.log(`Products Found:`);
        console.log(`- Table Top Planter: ${tableTopPlanters.map(p => p.name).join(', ')}`);
        console.log(`- Classic Mug (Set of 2): ${classicMugs2.map(p => p.name).join(', ')}`);
        console.log(`- Classic Mug (Set of 4): ${classicMugs4.map(p => p.name).join(', ')}`);
        console.log(`- Statement Mug (Set of 2): ${statementMugs2.map(p => p.name).join(', ')}`);
        console.log(`- Statement Mug (Set of 4): ${statementMugs4.map(p => p.name).join(', ')}`);
        console.log(`- Canister: ${canisters.map(p => p.name).join(', ')}`);
        console.log(`- Storage Bowl: ${storageBowls.map(p => p.name).join(', ')}`);
        console.log(`- Casserole: ${casseroles.map(p => p.name).join(', ')}`);
        console.log(`- Tissue Box: ${tissueBoxes.map(p => p.name).join(', ')}`);
        console.log(`- Soup Bowl: ${soupBowls.map(p => p.name).join(', ')}`);
        console.log(`- Flora Soup Bowl: ${floraSoupBowls.map(p => p.name).join(', ')}`);
        console.log(`- Bottles: ${bottles.map(p => p.name).join(', ')}\n`);

        // Helper to ensure B2BConfig and attach add-on
        const addCompanion = async (parentProduct, companionProduct, label, note, sortOrder = 1) => {
            if (!parentProduct || !companionProduct) return;
            
            let b2bCfg = await B2BProductConfig.findOne({ product: parentProduct._id });
            if (!b2bCfg) {
                b2bCfg = new B2BProductConfig({
                    product: parentProduct._id,
                    isEnabled: true,
                    basePrice: parentProduct.discountedPrice || 999,
                });
            }

            // Remove existing entry for this companion if present
            b2bCfg.additionalProducts = (b2bCfg.additionalProducts || []).filter(
                (ap) => ap.product && ap.product.toString() !== companionProduct._id.toString()
            );

            // Add companion product
            b2bCfg.additionalProducts.push({
                product: companionProduct._id,
                label: label || companionProduct.name,
                note: note || "Complementary sustainable product pairing",
                displayTrigger: "always",
                isSelectable: true,
                sortOrder: sortOrder,
                isActive: true,
            });

            await b2bCfg.save();
            console.log(`✅ [${parentProduct.name}] ➔ Add-on added: "${label || companionProduct.name}"`);
        };

        const primaryPlanter = tableTopPlanters[0];
        const primaryClassic2 = classicMugs2[0];
        const primaryClassic4 = classicMugs4[0];
        const primaryStatement2 = statementMugs2[0];
        const primaryStatement4 = statementMugs4[0];
        const primaryCanister = canisters[0];
        const primaryStorageBowl = storageBowls[0];
        const primaryCasserole = casseroles[0];
        const primaryTissueBox = tissueBoxes[0];
        const primarySoupBowl = soupBowls[0];
        const primaryFloraSoupBowl = floraSoupBowls[0];
        const primaryBottle = bottles.find(b => b.slug === 'viora-water-bottle') || bottles[0];

        // 1. Classic Mug (Set of 2) -> Table Top Planter
        for (const mug of classicMugs2) {
            await addCompanion(mug, primaryPlanter, "Table Top Planter (4\")", "Sustainable bamboo biocomposite desk & living space companion", 1);
        }

        // 2. Classic Mug (Set of 4) -> Table Top Planter
        for (const mug of classicMugs4) {
            await addCompanion(mug, primaryPlanter, "Table Top Planter (4\")", "Sustainable bamboo biocomposite desk & living space companion", 1);
        }

        // 3. Table Top Planter -> Classic Mug (Set of 2 & Set of 4)
        for (const planter of tableTopPlanters) {
            if (primaryClassic2) {
                await addCompanion(planter, primaryClassic2, "Classic Mug (Set of 2)", "Matching eco-friendly biocomposite mugs for workspace hydration", 1);
            }
            if (primaryClassic4) {
                await addCompanion(planter, primaryClassic4, "Classic Mug (Set of 4)", "Set of 4 earth-friendly mugs crafted from agricultural waste", 2);
            }
        }

        // 4. Storage Bowl -> Canister
        for (const sb of storageBowls) {
            await addCompanion(sb, primaryCanister, "Airtight Eco Canister (700 ml)", "Matching airtight pantry & kitchen storage companion", 1);
        }

        // 5. Flora Soup Bowl -> Statement Mug (Set of 2 / 4)
        for (const flora of floraSoupBowls) {
            if (primaryStatement2) {
                await addCompanion(flora, primaryStatement2, "Statement Mug (Set of 2)", "Artisanal ribbed sustainable mugs to complete your dining experience", 1);
            }
            if (primaryStatement4) {
                await addCompanion(flora, primaryStatement4, "Statement Mug (Set of 4)", "Set of 4 ribbed ceramic-feel eco mugs", 2);
            }
        }

        // 6. Casserole <-> Tissue Box (Vice Versa)
        for (const cas of casseroles) {
            await addCompanion(cas, primaryTissueBox, "Tissue Box (Pair of 2)", "Matching sustainable dining table accessory pair", 1);
        }
        for (const tb of tissueBoxes) {
            await addCompanion(tb, primaryCasserole, "Insulated Casserole (2200 ml)", "Matching thermal dining casserole crafted from crop waste", 1);
        }

        // 7. Soup Bowl -> Classic Mug
        for (const sb of soupBowls) {
            if (primaryClassic2) {
                await addCompanion(sb, primaryClassic2, "Classic Mug (Set of 2)", "Matching earth-friendly drinkware to complete your table setting", 1);
            }
            if (primaryClassic4) {
                await addCompanion(sb, primaryClassic4, "Classic Mug (Set of 4)", "Set of 4 durable eco mugs", 2);
            }
        }

        // 8. Statement Mug -> Bottle
        for (const sm of statementMugs2) {
            await addCompanion(sm, primaryBottle, "Viora Eco Water Bottle (400 ml)", "Matching insulated everyday hydration bottle", 1);
        }
        for (const sm of statementMugs4) {
            await addCompanion(sm, primaryBottle, "Viora Eco Water Bottle (400 ml)", "Matching insulated everyday hydration bottle", 1);
        }

        console.log("\n=================================================");
        console.log("  ALL REQUESTED B2B ADD-ON PAIRINGS COMPLETED!");
        console.log("=================================================\n");

        await mongoose.disconnect();
        process.exit(0);
    } catch (err) {
        console.error("❌ Error linking addons:", err);
        process.exit(1);
    }
};

linkAllAddons();
