import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function updateClassicMugs() {
    try {
        await mongoose.connect(process.env.MONGO_URL);
        console.log('Connected to MongoDB Atlas');

        const db = mongoose.connection.getClient().db('greenfibre');
        const productsCol = db.collection('products');

        const targetSlugs = ['classic-mug-set-of-2', 'classic-mug-set-of-4'];

        for (const slug of targetSlugs) {
            const product = await productsCol.findOne({ slug });
            if (!product) {
                console.warn(`Product with slug "${slug}" not found.`);
                continue;
            }

            console.log(`\n========================================`);
            console.log(`Processing "${product.name}" (${slug})`);
            console.log(`Current colors count:`, product.colors?.length);
            console.log(`Current colors:`, product.colors?.map(c => c.name));
            console.log(`Current color string:`, product.color);
            console.log(`Current stockQuantity:`, product.stockQuantity);

            // Filter out Brown / Coffee colors
            const updatedColors = (product.colors || []).filter(c => {
                const name = (c.name || '').toLowerCase();
                const hex = (c.hex || '').toLowerCase();
                const isBrownOrCoffee = name.includes('brown') || name.includes('coffee') || hex === '#6f4e37';
                return !isBrownOrCoffee;
            });

            // Calculate new total stock
            const newTotalStock = updatedColors.reduce((sum, c) => sum + (c.stock || 0), 0);

            // Build new color string
            const newColorString = updatedColors.map(c => c.name).join(', ') || 'Off White';

            console.log(`\nNew colors count:`, updatedColors.length);
            console.log(`New colors:`, updatedColors.map(c => c.name));
            console.log(`New color string:`, newColorString);
            console.log(`New stockQuantity:`, newTotalStock);

            const result = await productsCol.updateOne(
                { _id: product._id },
                {
                    $set: {
                        colors: updatedColors,
                        color: newColorString,
                        stockQuantity: newTotalStock,
                        updatedAt: new Date()
                    }
                }
            );

            console.log(`Updated product ${slug}. Modified count:`, result.modifiedCount);
        }

        console.log(`\n========================================`);
        console.log(`Verifying updated products in database:`);
        const verified = await productsCol.find({ slug: { $in: targetSlugs } }).toArray();
        for (const p of verified) {
            console.log(`\nProduct: "${p.name}" (${p.slug})`);
            console.log(`Color: "${p.color}"`);
            console.log(`StockQuantity: ${p.stockQuantity}`);
            console.log(`Colors Array:`, JSON.stringify(p.colors, null, 2));
        }

        process.exit(0);
    } catch (err) {
        console.error('Error updating classic mugs:', err);
        process.exit(1);
    }
}

updateClassicMugs();
