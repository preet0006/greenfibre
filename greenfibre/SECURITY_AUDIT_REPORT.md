# GREENFIBRE SECURITY AUDIT
# Date: 17 Aug 2026
# Scope: Local workspace + known production architecture
# Mode: Audit only — no GitHub push, no production changes, no secret values printed

---

## 1. Overall security status

**HIGH RISK** (for GitHub handover in current folder state)

The application architecture is reasonable (env-based secrets on the live API path), but this workspace currently contains real credentials, dumps, and hardcoded fallbacks that must be excluded or sanitized before any client GitHub upload.

---

## 2. Project structure

| Area | Details |
|------|---------|
| Storefront | `src/frontend/main` — Next.js 16 |
| Admin | `src/frontend/admin` — Next.js 16 |
| Backend | `src/backend` — Express (ESM) + MongoDB/Mongoose |
| Infra | `src/docker/docker-compose.yml` — MongoDB, MinIO, Imgproxy |
| Exports / dumps | `exports/`, `exports.zip`, `greenfibre-database-env.zip` |
| Package manifests | `src/backend/package.json`, `src/frontend/main/package.json`, `src/frontend/admin/package.json` |
| Root Git | **Not a Git repository** (`fatal: not a git repository`) |
| Nested Git | No `.git` under `src/backend` or frontends |
| Root `.gitignore` | **Missing** |
| Package `.gitignore` | Present under backend / main / admin |

**Data flow:** Browser → Next.js → `api.greenfibre.org` → Express → MongoDB / MinIO / Imgproxy / Easebuzz / Gmail / NimbusPost

---

## 3. Environment files found

| File | Real values? | Secrets? | Git-tracked? |
|------|--------------|----------|--------------|
| `src/backend/.env` | YES | YES (DB) | N/A (no root git); backend `.gitignore` ignores `.env` |
| `src/frontend/main/.env.production` | YES | LOW (public API URL) | ignored by `main/.gitignore` (`.env*`) |
| `src/frontend/admin/.env.production` | YES | LOW (public API URL) | ignored by `admin/.gitignore` (`.env*`) |
| Production VPS backend `.env` | YES (server-only) | YES (full stack) | Not in this workspace |

### `src/backend/.env` keys (values masked)

- `MONGO_INITDB_ROOT_USERNAME` = PRESENT  
- `MONGO_INITDB_ROOT_PASSWORD` = PRESENT  
- `MONGO_HOST` = PRESENT  
- `MONGO_PORT` = PRESENT  
- `MONGO_DB_NAME` = PRESENT  
- `MONGO_URL` = PRESENT  

### Frontend `.env.production` keys (values masked)

- `NEXT_PUBLIC_API_URL` = PRESENT  
- `NODE_ENV` = PRESENT  

### Production VPS backend `.env` key inventory (from prior ops knowledge; values not printed)

Present on server (not safely commit-able):  
`MONGO_URL`, `JWT_SECRET`, `USER_EMAIL`, `USER_PASS`, `CLOUDINARY_*`, `MINIO_*`, `IMGPROXY_*`, `CLIENT_ORIGIN`, `ADMIN_ORIGIN`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `COMPANY_*`, `EASEBUZZ_*`, `NIMBUSPOST_*`, `WAREHOUSE_*`, `FRONTEND_URL`, `COOKIE_DOMAIN`, `NODE_ENV`

---

## 4. Hardcoded secrets in source (values not printed)

| File | Line | Type | Severity | Remove / remediate before GitHub? |
|------|------|------|----------|-----------------------------------|
| `src/docker/docker-compose.yml` | 14 | Mongo root password hardcoded | CRITICAL | YES — move to env / `.env` compose |
| `src/docker/docker-compose.yml` | 33 | MinIO root password hardcoded | CRITICAL | YES |
| `src/docker/docker-compose.yml` | 52–53 | Imgproxy key/salt hardcoded | CRITICAL | YES |
| `src/backend/src/config/minio.js` | 7–8 | Default MinIO access/secret fallbacks | CRITICAL | YES — fail if env missing |
| `src/backend/src/utils/imgproxy.js` | 15–19 | Default Imgproxy key/salt fallbacks | CRITICAL | YES |
| `src/backend/src/scripts/setup-minio.js` | ~13 | Hardcoded MinIO secret | CRITICAL | YES |
| `src/backend/src/scripts/set-minio-public.js` | ~8 | Hardcoded MinIO secret | CRITICAL | YES |
| `exports/backend-source/...` (mirrors above) | various | Same hardcoded secrets | CRITICAL | YES — exclude exports from repo |
| `exports/GREENFIBRE_BACKEND_FULL.js` | various | Bundled source + hardcoded MinIO secret fallbacks | CRITICAL | YES — do not commit |

### False positives (not secrets)

| File | Lines | Note |
|------|-------|------|
| `LoginClient.jsx` / `RegisterClient.jsx` / `ResetPasswordClient.jsx` | validation lines | UI strings like “Password is required” — **not credentials** |

---

## 5. Git security audit

```
git status / remote / branch / log
→ fatal: not a git repository
```

| Question | Result |
|----------|--------|
| Is this folder a Git repo? | **NO** |
| Secrets in Git history? | **NO local history to inspect** |
| Risk when initializing Git? | **HIGH** if sensitive files are added in the first commit |

**Action:** Initialize Git only after ignoring/removing sensitive artifacts. Do not rewrite history later if secrets are committed — prevent the commit.

---

## 6. `.gitignore` audit

### Current

- **Root:** no `.gitignore`
- **Backend:** ignores `.env`, `.env.test`, `.env.production` — missing broader `.env.*` / `!.env.example`
- **Frontends:** ignore `.env*` (also blocks committing `.env.example` unless exception added)

### Recommended root `.gitignore` (DO NOT APPLY until you approve)

```gitignore
# dependencies / builds
node_modules/
.next/
dist/
build/
coverage/
out/

# env & secrets
.env
.env.*
!.env.example
*.pem
*.key
id_rsa
credentials.json
**/service-account*.json

# dumps / archives / local ops
exports/
exports.zip
greenfibre-database-env.zip
db_export/
*.sql
SECURITY_AUDIT_RAW.json
qa_live_results.json
.qa_secrets.json
audit_*.txt
deploy_*.txt
*.log

# OS / IDE
.DS_Store
Thumbs.db
.vscode/
.idea/
```

### Recommended package tweaks

**Backend** — extend to:

```gitignore
.env
.env.*
!.env.example
```

**Frontends** — change `.env*` to:

```gitignore
.env
.env.*
!.env.example
```

---

## 7. `.env.example`

**Status:** CREATED (placeholders only)

- `src/backend/.env.example`
- `src/frontend/main/.env.example`
- `src/frontend/admin/.env.example`

No real production credentials included.

---

## 8. Email security

| Item | Status |
|------|--------|
| Mailer | Nodemailer + Gmail (`src/backend/src/utils/sendMail.js`) |
| Username env | `USER_EMAIL` = PRESENT on **production server** `.env` |
| Password env | `USER_PASS` = PRESENT on **production server** `.env` |
| Hardcoded SMTP password in repo source | Not found as literal in app mailer (uses `process.env`) |
| Safe for GitHub? | Env vars yes (names only); real mailbox passwords **NO** |

**Client handover:** Transfer mailbox ownership / app-password out-of-band (password manager / secure channel). Rotate Gmail app password after transfer. Do not put real passwords in README or GitHub.

---

## 9. Database security

| Item | Status |
|------|--------|
| Type | MongoDB 7 |
| Host configured | YES (env / compose) |
| DB name | YES (app uses `test` in production runtime) |
| Username configured | YES |
| Password configured | YES |
| In `.env` | YES (`src/backend/.env`, VPS `.env`) |
| Hardcoded in compose | YES — CRITICAL |
| In Git history | N/A (no repo yet) |
| Dump with user password hashes | YES — `exports/mongodb/users.json` |

---

## 10. Third-party services

| Service | Credential present? | Location | Severity | Action |
|---------|---------------------|----------|----------|--------|
| MongoDB | YES | `.env`, `docker-compose.yml` | CRITICAL | Env-only; rotate; remove hardcoded compose values before public repo |
| MinIO | YES | `.env` (server), compose, code fallbacks, scripts | CRITICAL | Remove hardcoded defaults; rotate |
| Imgproxy | YES | compose + code fallbacks | CRITICAL | Remove hardcoded defaults; rotate |
| Gmail SMTP | YES (server env) | `USER_EMAIL` / `USER_PASS` | HIGH | Transfer + rotate out-of-band |
| Easebuzz | YES (server env) | `EASEBUZZ_KEY` / `EASEBUZZ_SALT` | HIGH | Transfer + rotate with payment vendor |
| NimbusPost | YES (server env) | email/password env | HIGH | Transfer + rotate |
| Cloudinary | YES (server env) | `CLOUDINARY_*` | MEDIUM | Confirm if still used; rotate if shared |
| JWT | YES (server env) | `JWT_SECRET` | HIGH | Rotate on handover |
| Admin seed | YES (server env) | `ADMIN_EMAIL` / `ADMIN_PASSWORD` | HIGH | Rotate admin password |

---

## 11. Public / suspicious files

| Path | Risk |
|------|------|
| `greenfibre-database-env.zip` | CRITICAL — contains real `.env` |
| `exports.zip` | CRITICAL — code + SQL + Mongo dumps |
| `exports/mongodb/users.json` | CRITICAL — emails + password hashes + phones |
| `exports/mongodb/otps.json` | CRITICAL — OTP codes |
| `exports/mongodb/orders.json` | HIGH — PII / addresses / payment ids |
| `exports/greenfibre_mysql.sql` | HIGH — DB dump with password columns / inserts |
| `exports/GREENFIBRE_BACKEND_FULL.js` | HIGH — full backend dump + secret fallbacks |
| `exports/backend-source/` | HIGH — source mirror with hardcoded secrets |
| `SECURITY_AUDIT_RAW.json` | LOW — presence metadata (delete after audit) |
| Private key files (`*.pem` / `id_rsa`) | NONE found |

---

## 12. Source-code security notes

| Finding | Severity |
|---------|----------|
| Hardcoded infra secrets in compose + fallbacks | CRITICAL |
| Admin UI auth is client-side gate; API enforces admin auth | INFO / acceptable if API stays locked |
| CORS allowlist of known origins + credentials | INFO (good) |
| Helmet + rate limits on auth/contact/verify | INFO (good) |
| Payment verify is public but hash-gated | MEDIUM (by design; monitor) |
| Uploads restricted to images + size limit | INFO (good) |
| `NEXT_PUBLIC_*` only exposes API base URL | INFO |
| Production data dumps in workspace | CRITICAL for handover |

---

## 13. Client handover lists

### SAFE TO COMMIT (after cleanup)

- Application source under `src/backend/src`, `src/frontend/**` (with secret fallbacks removed)
- `package.json` / lockfiles
- README (no secrets)
- `.env.example` files
- Public static assets
- Docker compose **only if** secrets are env-substituted (no real passwords)

### MUST NOT BE COMMITTED

- Any real `.env` / `.env.production` with secrets
- `greenfibre-database-env.zip`
- `exports/`, `exports.zip`, `db_export/`
- `*.sql` dumps
- Mongo JSON dumps (`users`, `otps`, `orders`, etc.)
- SSH keys / PEM / service accounts
- Real SMTP / Easebuzz / MinIO / JWT / admin passwords
- Audit/deploy transcripts that may contain credentials

---

## 14. Final checklist answers

1. **Overall security status:** HIGH RISK  
2. **Real `.env` files found:** YES  
3. **Secrets hardcoded in source:** YES  
4. **Secrets found in Git history:** NO (no Git repo yet)  
5. **Database credentials exposed:** YES (local `.env`, compose, zip)  
6. **SMTP/email credentials exposed:** YES on production server env (not in local app `.env`); not hardcoded in mailer source  
7. **API keys exposed:** YES (server env + hardcoded MinIO/Imgproxy fallbacks/compose)  
8. **Private keys found:** NO  
9. **Suspicious backup files:** YES  
10. **Gitignore status:** NEEDS UPDATE (root missing; package rules incomplete for handover)  
11. **`.env.example`:** EXISTS (created with placeholders)  
12. **Critical findings (names/paths only):**  
    - Hardcoded DB/MinIO/Imgproxy secrets — `src/docker/docker-compose.yml`  
    - Hardcoded MinIO fallback — `src/backend/src/config/minio.js`  
    - Hardcoded Imgproxy fallback — `src/backend/src/utils/imgproxy.js`  
    - Hardcoded MinIO in scripts — `setup-minio.js`, `set-minio-public.js`  
    - Real DB `.env` — `src/backend/.env`  
    - Env zip — `greenfibre-database-env.zip`  
    - Data/code dumps — `exports/**`, `exports.zip`  
13. **Recommended actions before GitHub handover:**  
    1. Do **not** `git init` / push until cleanup is done  
    2. Approve and add root + package `.gitignore` updates above  
    3. Exclude/delete from the handover tree: `exports/`, zips, SQL dumps, real `.env` files  
    4. Replace hardcoded compose/script/fallback secrets with env-only values  
    5. Keep only `.env.example` in Git  
    6. Transfer production secrets to client via secure channel (not GitHub)  
    7. Rotate: Mongo, MinIO, Imgproxy, JWT, Gmail app password, Easebuzz, NimbusPost, admin password  
    8. Confirm Cloudinary still needed; rotate or remove  
    9. Re-scan with a secret scanner after cleanup  
    10. Then create the client GitHub repo and push a clean tree  
14. **Final recommendation:** **DO NOT PUSH UNTIL THE ABOVE ISSUES ARE RESOLVED**

---

## Note

This audit did **not** push to GitHub, did **not** modify production servers, did **not** rotate credentials, and does **not** print secret values.
