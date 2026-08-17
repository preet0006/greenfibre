import { getImgproxyUrl } from "../utils/imgproxy.js";

// Basic (with default sharpening)
const url1 = getImgproxyUrl("http://localhost:9000/media/logo.png", 1024, 1024);

// High quality with more sharpening
const url2 = getImgproxyUrl(
    "http://localhost:9000/media/logo.png",
    1024,
    1024,
    { quality: 90, sharpen: true }
);

// Force WebP format
const url3 = getImgproxyUrl(
    "http://localhost:9000/media/logo.png",
    1024,
    1024,
    { format: "webp", quality: 90 }
);

// Use 'fill' instead of 'fit' (crops to exact dimensions)
const url4 = getImgproxyUrl(
    "http://localhost:9000/media/logo.png",
    1024,
    1024,
    { resize: "fill" }
);

console.log(url2);
