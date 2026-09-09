# Green Fibre — Complete End-to-End Audit Report

**Site:** https://www.greenfibre.org/  
**Date:** 28 Jul 2026  
**Stack:** Next.js 16 (storefront + admin) · Express/Mongo API · Nginx · MinIO · Imgproxy · PM2  

---

## 1. Total pages scanned

**45+** seeded URLs + all internal homepage links + product/category API probes.

| Status | Count | Notes |
|--------|-------|-------|
| 200 OK | 22+ core routes | Home, Shop, PDP, Auth, Cart, Checkout, Policies, etc. |
| 404 | Aliases only | `/faq`, `/terms`, `/privacy`, `/reviews` (canonical paths exist) |
| SEO assets | Fixed | `/robots.txt`, `/sitemap.xml` now **200** |

---

## 2. Total issues found

**28** issues identified across crawl, functional, API, security, SEO, a11y, and UX.

## 3. Critical issues (fixed)

1. **Public exposure of MongoDB (27017), MinIO (9000), Imgproxy (8080), Node (3000/3001/5500)** — bound to `127.0.0.1`
2. **Checkout coupon logic used wrong fields** (`validUntil`/`maxUses` vs `expiryDate`/`usageLimit`) — discounts/limits broken
3. **Payment verify replay** could decrement stock / increment coupon usage repeatedly
4. **Shop `fetchProducts(params.toString())`** — query string spread broke product listing/filters

## 4. Medium issues (mostly fixed)

- Missing rate limits on auth/OTP/contact/payment verify → **added**
- Unrestricted file uploads → **image MIME + 5MB limit**
- User could not fetch own order by ID (admin-only route) → **ownership allowed**
- Missing robots/sitemap → **added**
- Broken register links `/terms`, `/privacy`; reviews CTA `/reviews` → **fixed**
- Navbar cart badge never hydrated → **fixed**
- Logout wiped server cart + cookie clear mismatch → **fixed**
- Category slug filters ignored → **backend resolves slug or ObjectId**
- Contact form skipped phone/email validation → **fixed**
- Public reviews endpoint exposed unapproved reviews → **approved-only**
- Contact email HTML injection → **escaped**
- ESM `require("fs")` invoice crash path → **fixed**
- Header/content overlap (`pt-20` vs marquee+nav) → **increased padding**

## 5. Minor issues

- Login/reset metadata said “Pzone” → **fixed to Green Fibre**
- Wishlist ObjectId `.includes` duplicate check → **fixed**
- Checkout key crash risk on missing `product` → **optional chaining**
- PDP infinite spinner on 404 → **not-found UI**
- Custom `not-found` page → **added**

## 6–9. Scores (post-fix auditor estimates)

| Area | Score | Notes |
|------|-------|-------|
| **Performance** | **82** | Next Image used; large public assets remain (e.g. about-2.png &gt;5MB) |
| **SEO** | **78** | robots/sitemap/OG/Twitter improved; still need Product JSON-LD + PDP metadata |
| **Accessibility** | **68** | Landmark structure OK; auth forms/labels/keyboard mega-menu remain |
| **Security** | **74** | Ports locked + rate limits + upload filter; rotate secrets; nginx HSTS for www still recommended |

## 10. Pages fixed / improved

Shop, PDP, Contact, Register, Login metadata, Reset metadata, Reviews CTA, Layout, Cart/Navbar, Checkout key safety, robots, sitemap, not-found

## 11. APIs fixed

- `POST /api/order/create` coupon validation  
- `POST /api/order/verify` idempotency + `applyCouponUsage`  
- `GET /api/order/:orderId` owner access  
- `GET /api/product` category/subCategory slug support  
- `GET /api/review` approved-only public list  
- `POST /api/contact/contact` HTML escape  
- Coupon create/validate null-safety + fixed discount cap  
- `GET /api/health` added  
- Auth/contact/verify rate limiting  

## 12. Components / stores fixed

Navbar, Footer-linked CTAs, ReviewsSection, RegisterClient, Contact page, useUserStore, useCartStore, shop page, PDP page, checkout page, layout metadata

## 13. Files modified (deployed)

**Backend:** `index.js`, `order.controller.js`, `product.controller.js`, `wishlist.controller.js`, `user.controller.js`, `contact.controller.js`, `coupon.controller.js`, `review.controller.js`, `order.route.js`, `review.route.js`, `multer.middleware.js`, `package.json`  

**Infra:** `docker/docker-compose.yml`  

**Frontend:** `layout.js`, `robots.js`, `sitemap.js`, `not-found.js`, shop/PDP/contact/register/login/reset, Navbar, ReviewsSection, stores, `next.config.mjs`

## 14. Before vs after

| Area | Before | After |
|------|--------|-------|
| DB/Media ports | World-open | Localhost-only |
| Shop filters | Broken | Working object params + slug support |
| Coupons at checkout | Largely unenforced | Aligned with model |
| Payment verify | Non-idempotent | Paid early-return |
| SEO files | 404 | 200 |
| Cart badge | Stale/zero | Fetched after auth |
| Upload abuse | Any file | Images ≤5MB |

## 15. Remaining recommendations

1. **Rotate VPS root password** (shared in chat) and all DB/MinIO/JWT/payment secrets  
2. Add **Product / Organization JSON-LD** and `generateMetadata` for PDP + blog posts  
3. Accessibility pass: `htmlFor`/`id`, focus traps, mega-menu keyboard nav, reduced-motion for marquee  
4. Add **HSTS + security headers** on nginx for `www.greenfibre.org` (API already has Helmet)  
5. Compress oversized static images; enable CDN caching headers  
6. Safari/iOS visual QA for sticky header stack  
7. Optional redirects: `/terms`→`/terms-and-conditions`, `/privacy`→`/privacy-policy`, `/faq` page if desired  
8. Harden Mongo auth (do not rely on network bind alone)

---

### Live verification snapshot (post-deploy)

- Site `/` → 200  
- `/robots.txt`, `/sitemap.xml` → 200  
- `/api/health` → `{"success":true}`  
- Services listen on `127.0.0.1` only for app/DB/media ports  
- PM2: `green-api`, `green-main`, `green-admin` online  

**Interactive report canvas:** `greenfibre-audit-report.canvas.tsx`
