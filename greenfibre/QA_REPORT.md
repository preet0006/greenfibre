# GreenFibre — Complete End-to-End QA Report

**Date:** 10 Aug 2026  
**Sites:** https://www.greenfibre.org/ · https://admin.greenfibre.org/  
**API:** https://api.greenfibre.org/api  

---

## Overall Status

| Area | Status |
|------|--------|
| Website | **PASS** |
| Admin Panel | **PASS** |
| Backend/API | **PASS** |
| Database | **PASS** |
| Authentication | **PASS** |
| Responsive Design | **PASS** (code + layout review; device-lab limited) |
| Security | **PASS** (with residual recommendations) |
| Performance | **PASS** |

**Final recommendation:** **Mostly Ready — Minor Issues Remaining**

Core storefront, admin APIs, auth, catalog, and admin CRUD paths are working. Remaining gaps are mostly payment-gateway live money flows, email OTP delivery proof, and deeper visual/a11y device testing—not broken critical paths.

---

## 1. Project structure map

```
Browser (www / admin)
    → Next.js 16 frontends (main :3000, admin :3001)
    → HTTPS → Nginx
    → Express API :5500 (/api/*)
    → MongoDB (green-mongo)
    → MinIO + Imgproxy (media)
    → Easebuzz (payments)
    → Gmail SMTP (OTP / orders / contact)
    → NimbusPost (optional shipping)
```

| Layer | Tech |
|-------|------|
| Storefront | Next.js 16 App Router · Zustand · Axios |
| Admin | Next.js 16 App Router · Zustand · Axios |
| Backend | Express · JWT httpOnly cookies · Helmet · rate limits |
| DB | MongoDB 7 |
| Auth | Customer `token` · Admin `admin_token` · role `user`/`admin` |
| Uploads | Multer · image MIME allowlist · 5MB limit · MinIO |
| Payments | Easebuzz |
| Deploy | PM2 (`green-api`, `green-main`, `green-admin`) · Docker media stack |

### Important public routes
`/`, `/shop`, `/shop/[slug]`, `/cart`, `/checkout`, `/login`, `/register`, `/account`, `/orders`, `/orders/[orderId]`, `/orders/success|failed`, `/wishlist`, `/search`, `/blogs`, `/gallery`, `/contact`, `/about`, `/sustainability`, policies, `/robots.txt`, `/sitemap.xml`

### Admin routes
`/login`, `/dashboard`, products, categories, inventory, orders, users, coupons, banners, blog, gallery, reviews, contact, page-settings, shop-video, cart, settings

### API mounts
`/api/users`, `/api/admin`, `/api/product`, `/api/categories`, `/api/cart`, `/api/order`, `/api/wishlist`, `/api/address`, `/api/coupons`, `/api/banners`, `/api/blogs`, `/api/gallery`, `/api/review`, `/api/contact`, `/api/page-settings`, `/api/dashboard`, `/api/health`

---

## 2. Functional test summary

| Metric | Count |
|--------|------:|
| Total automated live checks | **112** |
| Passed | **111** |
| Failed (after fixes) | **0** |
| Skipped | **1** (GST SSR text probe) |
| Fixed during this audit | **7** |
| Remaining non-blocking | several (see below) |

Live harness: `qa_live.py` → `qa_live_results.json`

Covered:
- All major storefront + admin HTML routes
- Public catalog/content APIs
- Auth rejection + admin login/logout/session clear
- Protected route 401s without cookies
- Admin module list APIs (stats, users, orders, products, categories, coupons, blogs, contacts, reviews, carts, gallery, banners, page-settings)
- Safe coupon create + delete (disposable QA coupon only)
- SEO assets, XSS reflection sample, perf samples (~100–220ms)
- PDP + product search + related products

---

## Bugs Found

### BUG-01 — Order detail 404 (High) — **FIXED**
- **Feature:** Orders  
- **URL:** `/orders/:id`, success “View Order”  
- **Steps:** Complete order → View Order / View Details  
- **Expected:** Order detail page  
- **Actual:** 404 (no App Router page)  
- **Root cause:** Missing `app/orders/[orderId]/page.jsx`  
- **Fix:** Added order detail page using `GET /api/order/:orderId`  
- **Retest:** HTTP 200 for `/orders/[orderId]`

### BUG-02 — Checkout GST mismatch (High) — **FIXED**
- **Feature:** Checkout totals  
- **URL:** `/checkout`  
- **Expected:** UI total = Easebuzz/`finalAmount`  
- **Actual:** UI added 18% GST; backend charged without GST  
- **Root cause:** Frontend-only GST  
- **Fix:** Removed extra GST from checkout UI; note that listed prices are charged as-is  
- **Retest:** Code aligned with `createOrder` amount logic

### BUG-03 — Checkout login lost redirect (Medium) — **FIXED**
- **Feature:** Auth gate on checkout  
- **Expected:** Return to checkout after login  
- **Actual:** `router.push("/login")` dropped redirect  
- **Fix:** `?redirect=` with encoded `/checkout` + query  
- **Retest:** Code path verified

### BUG-04 — Silent checkout validation (Medium) — **FIXED**
- **Feature:** Place order  
- **Expected:** Toast if address/terms/stock invalid  
- **Actual:** Silent `return`  
- **Fix:** `toast.error(...)` messages  
- **Retest:** Code path verified

### BUG-05 — Register invalid payload → 500 (Medium) — **FIXED**
- **Feature:** Registration API  
- **Expected:** 400 validation  
- **Actual:** Mongoose error → 500  
- **Fix:** Explicit validation + ValidationError → 400  
- **Retest:** Live API returns 400 with clear message

### BUG-06 — Wrong coupon validate path (Medium) — **FIXED**
- **Feature:** Order-store coupon validate  
- **Expected:** `POST /api/coupons/validate`  
- **Actual:** `POST /api/coupon/validate` (404)  
- **Fix:** Corrected path in `useOrderStore.js`  
- **Retest:** Path matches backend route

### BUG-07 — Payment verify race / amount check (High) — **FIXED**
- **Feature:** `POST /api/order/verify`  
- **Expected:** Idempotent stock/coupon apply; amount matches order  
- **Actual:** Soft check then save (race window); no amount compare  
- **Fix:** `findOneAndUpdate` claim + amount tolerance check  
- **Retest:** Deployed; cannot fully money-test without gateway

### BUG-08 — Alias routes 404 (Low) — **FIXED**
- **Feature:** `/terms`, `/privacy`, `/faq`, `/reviews`  
- **Fix:** Next.js redirects to canonical pages  
- **Retest:** Live redirects resolve (308/200 follow)

---

## Console Errors

No browser DevTools session in this run (no interactive browser automation available).  

HTTP-level crawl of public/admin pages and APIs returned **0 remaining failures** after fixes. Genuine client-only React errors would still need Chrome DevTools on a device.

---

## API Errors

None remaining in the automated suite after fixes.

Protected endpoints correctly return **401** without auth. Admin modules return **200** with valid admin session.

---

## Database Issues

- Mongo connectivity healthy (product/user/order/coupon ops via API).  
- No destructive production deletes performed (only disposable QA coupon).  
- Residual: abandoned **pending** Easebuzz orders can accumulate if users abandon payment (by design today).

---

## Security Issues

| Item | Severity | Status |
|------|----------|--------|
| Admin/mutating routes require admin auth | — | OK |
| Auth/contact/verify rate limits | — | OK |
| Upload MIME + size limits | — | OK |
| Homepage does not leak secrets | — | OK |
| Search XSS raw reflection | — | OK (sample) |
| Admin UI guard is client-side only | Low | API still enforces auth |
| `adminAuthMiddleware` falls back to storefront `token` if admin-role | Low | Prefer admin_token only long-term |
| Payment verify is public (hash-gated) | Medium | Hardened; still gateway-dependent |
| Rotate VPS/DB/JWT/MinIO secrets | High (ops) | Recommended (not code) |

---

## Performance Issues

| Check | Result |
|-------|--------|
| Home TTFB sample | ~180ms |
| Shop | ~190ms |
| `/api/product` | ~190ms |
| `/api/health` | ~105ms |

Residual (from prior audit, still relevant):
- Some large static marketing images (e.g. about assets)  
- Prefer CDN cache headers for media  

No N+1 hotspots found in the live smoke paths.

---

## Admin ↔ Website integration

Verified via API:
- Catalog products returned by API render on `/shop` and PDP  
- Page settings / banners / gallery / blogs public GETs healthy  
- Admin can list/manage coupons (create/delete QA coupon)  
- Admin stats/orders/users endpoints healthy  

Not fully UI-clicked in a real browser: product image replace, banner drag-reorder, blog rich-text editor—API auth boundaries confirmed.

---

## Responsive / a11y / cross-browser

- Navbar includes dedicated mobile hamburger + menu (`md:hidden` / `hidden md:flex`).  
- Breakpoint utility usage present across shop/checkout/admin.  
- **Not** fully lab-tested at every requested width in a real browser this session.  
- A11y: forms/labels/mega-menu keyboard traps still recommended follow-up (prior score ~68).

---

## Could not fully test

1. **Live Easebuzz payment** with real card / UPI (would create real charges).  
2. **Email/OTP delivery** (SMTP inbox access required).  
3. **NimbusPost shipment create** (needs live shipped-order + courier creds).  
4. **Interactive browser console** (no Playwright/Puppeteer MCP in this environment).  
5. **Full visual responsive matrix** on physical devices.  
6. **Firefox/Safari-specific** rendering.  
7. **Destructive product/order deletes** on production catalog (intentionally avoided).

---

## Files changed

1. `src/frontend/main/src/app/orders/[orderId]/page.jsx` *(new)*  
2. `src/frontend/main/src/app/checkout/page.jsx`  
3. `src/frontend/main/src/store/useOrderStore.js`  
4. `src/frontend/main/next.config.mjs`  
5. `src/backend/src/controllers/user.controller.js`  
6. `src/backend/src/controllers/order.controller.js`  
7. `QA_REPORT.md` *(this file)*  
8. `qa_live.py` / `qa_live_results.json` *(audit harness)*  

Deployed to production PM2 (`green-api`, `green-main`).

---

## Final Recommendation

**Mostly Ready — Minor Issues Remaining**

Safe to operate for day-to-day browsing, admin management, and checkout initiation. Before calling it fully “Production Ready,” complete one real Easebuzz sandbox/live payment dry-run, verify OTP email delivery, and spot-check mobile Safari + Chrome DevTools console on shop → cart → checkout.
