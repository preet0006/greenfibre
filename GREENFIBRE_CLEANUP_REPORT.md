# GREENFIBRE CLEANUP REPORT

**Date:** 17 Aug 2026  
**Mode:** Local cleanup only — no Git init, no GitHub push, no production server changes, no live credential rotation  
**Secret values:** never printed in this report

Secure backup (outside handover tree):  
`C:\Users\Asus\OneDrive\Desktop\Workspase\GreenFibre_SECURE_BACKUP_20260817_135204`  
(Do not commit / upload this backup.)

---

## A. Files moved outside handover tree

| Item | Destination (under secure backup) |
|------|-----------------------------------|
| `src/backend/.env` | `env/` |
| `src/frontend/main/.env.production` | `env/` |
| `src/frontend/admin/.env.production` | `env/` |
| `exports/` (incl. Mongo/SQL/PII dumps) | `dumps/` |
| `exports.zip` | `dumps/` |
| `greenfibre-database-env.zip` | `dumps/` |
| `db_export/` | `dumps/` |
| Selected audit/deploy output logs | `audit_artifacts/` |

## B. Files excluded from GitHub (protected by `.gitignore` + moved)

- Real `.env` / `.env.*` (except `.env.example`)
- `exports/`, SQL/Mongo dumps, zips
- `*.pem` / `*.key` / credential JSON patterns
- `node_modules/`, `.next/`, logs, OS/IDE junk

## C. Hardcoded secrets removed

| Location | Action |
|----------|--------|
| `src/docker/docker-compose.yml` | Replaced literal Mongo/MinIO/Imgproxy secrets with `${ENV}` substitution |
| `src/backend/src/config/minio.js` | Removed default secret fallbacks; requires `MINIO_ACCESS_KEY` / `MINIO_SECRET_KEY` |
| `src/backend/src/utils/imgproxy.js` | Removed default key/salt fallbacks; requires `IMGPROXY_KEY` / `IMGPROXY_SALT` |
| `src/backend/src/scripts/setup-minio.js` | Loads credentials from env only |
| `src/backend/src/scripts/set-minio-public.js` | Loads credentials from env only |

## D. Environment variables externalized

Uses existing project names:

- `MONGO_INITDB_ROOT_USERNAME` / `MONGO_INITDB_ROOT_PASSWORD`
- `MINIO_ROOT_USER` / `MINIO_ROOT_PASSWORD`
- `MINIO_ACCESS_KEY` / `MINIO_SECRET_KEY` / `MINIO_BASE_URL` / `MINIO_PUBLIC_URL` / `MINIO_BUCKET`
- `IMGPROXY_KEY` / `IMGPROXY_SALT` / `IMGPROXY_URL`
- Plus existing backend vars documented in `.env.example` (`JWT_SECRET`, `USER_EMAIL`, `USER_PASS`, Easebuzz, NimbusPost, etc.)

Docker local stack: copy `src/docker/.env.example` → `src/docker/.env` (private) before `docker compose up`.

## E. `.gitignore` status

- **Root** `.gitignore` — CREATED  
- **Docker** `src/docker/.gitignore` — CREATED  
- **Backend / frontends** — updated to ignore `.env.*` while allowing `!.env.example`

## F. `.env.example` status

Placeholders only (no real production values):

- `src/backend/.env.example`
- `src/frontend/main/.env.example`
- `src/frontend/admin/.env.example`
- `src/docker/.env.example`

## G. Database / PII files excluded

- No `exports/` in handover tree  
- No `exports.zip` / env zip  
- No `.sql` dumps in tree  
- No Mongo JSON user/OTP/order dumps in tree  

## H. Credentials requiring rotation

See `SECURITY_CREDENTIAL_ROTATION.md`.

Email transfer checklist (no passwords): `EMAIL_HANDOVER_NOTE.md`.

## I. Remaining security issues / notes

1. **Production server** still uses its existing secrets until humans rotate them (intentional — not auto-rotated).  
2. Local/dev will need private `.env` files restored from the secure backup (or recreated from examples) — they are no longer inside the handover tree.  
3. After Imgproxy/MinIO/JWT rotation on production, update server env and restart services.  
4. Do not initialize Git until this cleanup is accepted.  
5. Application behavior preserved conceptually: same env var names and ports; secrets must be supplied via env.

## J. Final validation (post-cleanup scan)

| Check | Result |
|-------|--------|
| No real `.env` in handover tree | PASS |
| No credential/PII dumps/zips in tree | PASS |
| No legacy hardcoded secret patterns in source | PASS |
| No private keys found | PASS |
| `.env.example` placeholders only | PASS |
| Root `.gitignore` present | PASS |

## Final status

**SAFE FOR GIT INITIALIZATION**

(Still: do **not** push until the client GitHub remote is ready and rotation plan is acknowledged. Do **not** commit the secure backup folder.)
