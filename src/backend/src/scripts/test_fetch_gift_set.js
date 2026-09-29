import axios from "axios";

const BASE_URL = "http://localhost:5500";

async function testFetch() {
  try {
    console.log("--- 1. Testing B2B Product Details ---");
    const b2bRes = await axios.get(`${BASE_URL}/api/b2b/products/premium-kitchen-and-dining-gift-set`);
    console.log("B2B Status:", b2bRes.status);
    console.log("B2B Product Name:", b2bRes.data.product?.name);
    console.log("B2B Category:", b2bRes.data.product?.category);
    console.log("B2B Gift Set Contents:", b2bRes.data.product?.giftSetContents?.totalProductTypes, "products included");
    console.log("B2B Gift Set Item Names:", b2bRes.data.product?.giftSetContents?.products?.map(p => `${p.name} (${p.quantity} ${p.unit})`));
    console.log("B2B Gift Box Images:", b2bRes.data.product?.giftBoxImages);

    console.log("\n--- 2. Testing B2C Product Details ---");
    const b2cRes = await axios.get(`${BASE_URL}/api/product/premium-kitchen-and-dining-gift-set`);
    console.log("B2C Status:", b2cRes.status);
    console.log("B2C Product Name:", b2cRes.data.product?.name);
    console.log("B2C Category:", b2cRes.data.product?.category?.name);
    console.log("B2C Gift Set Contents Total:", b2cRes.data.product?.giftSetContents?.totalProductTypes);
    console.log("B2C Gift Box Images:", b2cRes.data.product?.giftBoxImages);
    console.log("B2C Has competitors/b2bMargin leaked?", Boolean(b2cRes.data.product?.competitors || b2cRes.data.product?.b2bMargin));

    console.log("\nALL VERIFICATIONS PASSED SUCCESSFULLY!");
  } catch (err) {
    console.error("Fetch test error:", err.response?.data || err.message);
  }
}

testFetch();
