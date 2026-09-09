# GreenFibre — Credential Rotation Checklist

**Date:** 17 Aug 2026  
**Important:** This file contains **no secret values**.  
Do **not** put real passwords, keys, or tokens in this document or in GitHub.

Credentials were present in the local project tree and/or hardcoded in source before cleanup. Rotate them as part of client handover.

| Credential | Reason for rotation | Where configured | Who should rotate | Status |
|------------|---------------------|------------------|-------------------|--------|
| MongoDB root / app user password | Appeared in local `.env`, Docker Compose (pre-cleanup), and env zip shared for access | Production Mongo / Docker env / backend `MONGO_URL` | Hosting owner + client | REQUIRED |
| MinIO root / access credentials | Hardcoded in Compose/scripts/config fallbacks before cleanup; present on server env | MinIO / `MINIO_ACCESS_KEY` / `MINIO_SECRET_KEY` / `MINIO_ROOT_*` | Hosting owner + client | REQUIRED |
| Imgproxy signing key & salt | Hardcoded in Compose + code fallbacks before cleanup | Imgproxy service + backend `IMGPROXY_KEY` / `IMGPROXY_SALT` | Hosting owner + client | REQUIRED |
| JWT signing secret | Production auth depends on it; was on server `.env` | Backend `JWT_SECRET` | Backend owner + client | REQUIRED |
| Gmail / SMTP app password (`USER_PASS`) | Mailbox access needed by client; must not live in Git | Backend `USER_EMAIL` / `USER_PASS` (Nodemailer/Gmail) | Mailbox owner + client | REQUIRED |
| Easebuzz key & salt | Payment credentials; must stay out of Git | Backend `EASEBUZZ_KEY` / `EASEBUZZ_SALT` / `EASEBUZZ_ENV` | Payment account owner + client | REQUIRED |
| NimbusPost login | Shipping API credentials on server env | `NIMBUSPOST_EMAIL` / `NIMBUSPOST_PASSWORD` | Shipping account owner + client | REQUIRED |
| Admin panel password(s) | Admin accounts exist in DB; handover requires controlled access | Admin users in MongoDB + optional `ADMIN_EMAIL` / `ADMIN_PASSWORD` seed vars | Project owner + client | REQUIRED |
| Cloudinary API credentials (if still used) | Present on server env; confirm active use | `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | Media account owner + client | REQUIRED (if account retained) |
| VPS / SSH root (or deploy user) password & keys | Server access must transfer securely; never via GitHub | Hosting provider / SSH | Infrastructure owner + client | REQUIRED |
| Cookie / domain session assumptions | After JWT rotation, existing sessions invalidate (expected) | `COOKIE_DOMAIN` + JWT | Backend owner | REQUIRED (re-login after JWT rotate) |

## Rotation guidance (no secrets)

1. Generate new strong unique values offline.
2. Update **production** environment only (server `.env` / Docker secrets).
3. Restart affected services (API, Docker media stack, admin/storefront if needed).
4. Verify login, media URLs, payments (sandbox first), and email OTP.
5. Revoke/retire old credentials at each provider.
6. Deliver new secrets to the client via a **password manager** or encrypted channel — never GitHub, README, chat logs, or tickets in plaintext long-term.

## Explicitly out of scope for this cleanup

- This cleanup **did not** rotate any live credentials.
- This cleanup **did not** change production server configuration.
