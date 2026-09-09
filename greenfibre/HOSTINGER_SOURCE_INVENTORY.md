# GREENFIBRE HOSTINGER SOURCE INVENTORY
# Date: 17 Aug 2026
# Scope: Local workspace used as GitHub handover candidate
# Rule: no secret values printed

## Important clarification

The open workspace `GreenFibre/` currently contains the **cleaned production application source** under `src/` (storefront + admin + API + docker).

Also found nearby (NOT safe as-is for GitHub):

- `Workspase/GreenFibre.zip` — archive dated today; contains **real `.env` / `.env.production` paths** and `exports/` dumps
- `Workspase/GreenFibre_SECURE_BACKUP_*` — secure local backup from prior cleanup (keep offline)
- `Downloads/greenfibre (1).sql` — SQL dump (PII risk; do not commit)

No separate fresh Hostinger extract directory was found beyond this workspace + zip.  
Treat **cleaned `GreenFibre/src`** as the handover source of truth.  
**Do not unpack `GreenFibre.zip` into GitHub without stripping secrets/dumps.**

No Hostinger server files were modified.

---

## 1. Total files found

Approximately **258 files** in the handover tree (excluding `node_modules` / `.next`; none present currently).

## 2. Main directories

```text
GreenFibre/
  src/backend/
  src/frontend/main/
  src/frontend/admin/
  src/docker/
  README + security/handover markdown notes
  local audit scripts (should stay out of Git)
```

## 3. Frontend

- Path: `src/frontend/main`
- Stack: **Next.js App Router** (React/JSX)
- Entry: `src/frontend/main/src/app/page.js`
- Public assets: `src/frontend/main/public`
- Package: `src/frontend/main/package.json`
- ~104 source files (excl. node_modules)

## 4. Backend / API

- Path: `src/backend`
- Stack: **Node.js + Express (ESM) + Mongoose**
- Entry: `src/backend/src/index.js`
- Routes/controllers/models/middlewares/utils/scripts present
- Package: `src/backend/package.json`
- ~70 source files

## 5. Admin

- Path: `src/frontend/admin`
- Stack: **Next.js App Router**
- Entry: `src/frontend/admin/src/app/page.js` + `/dashboard/*`
- ~70 source files

## 6. Database technology

- **MongoDB** via `MONGO_URL`
- Local/prod companion: Docker service in `src/docker/docker-compose.yml`
- **No PHP / MySQL app runtime** in this source tree (0 `.php` files)
- SQL dump exists only outside tree (`Downloads/greenfibre (1).sql`) — migration artifact, not app runtime

## 7. Email system

- **Nodemailer + Gmail** (`service: "gmail"`)
- Env: `USER_EMAIL`, `USER_PASS` (app password)
- File: `src/backend/src/utils/sendMail.js`
- No passwords in source (env only)

## 8. Required environment files

Present (placeholders only):

- `src/backend/.env.example`
- `src/docker/.env.example`
- `src/frontend/main/.env.example`
- `src/frontend/admin/.env.example`

Real `.env` files: **absent** from handover tree (moved to secure backup earlier).

## 9. Sensitive files found

| SECRET TYPE | FILE / LOCATION | STATUS | ACTION |
|-------------|-----------------|--------|--------|
| Real backend env | was `src/backend/.env` | ABSENT from tree (in secure backup) | MUST NOT COMMIT |
| Frontend production env | was `.env.production` | ABSENT from tree (in secure backup) | MUST NOT COMMIT |
| Real env inside zip | `GreenFibre.zip` → `src/backend/.env` etc. | PRESENT in zip | DO NOT USE ZIP AS REPO |
| PII/dumps in zip | `GreenFibre.zip` → `exports/` | PRESENT in zip | EXCLUDE |
| Hardcoded legacy secrets in cleaned source | scan | NONE FOUND | OK |
| SQL dump | `Downloads/greenfibre (1).sql` | OUTSIDE tree | MUST NOT COMMIT |

## 10. Production-only / server-only (conceptual)

- Live VPS `.env` with JWT/SMTP/payment keys
- PM2 / Nginx configs (not in this tree)
- Mongo data volumes / MinIO object store
- Runtime logs, sessions, caches
- Customer DB contents

## 11. Files that should be committed to GitHub

- `src/backend/**` source (no real `.env`)
- `src/frontend/main/**` source
- `src/frontend/admin/**` source
- `src/docker/docker-compose.yml` + `.env.example`
- `.env.example` files
- `README.md`, `.gitignore`
- Security handover notes without secrets (`SECURITY_CREDENTIAL_ROTATION.md`, `EMAIL_HANDOVER_NOTE.md`, etc.)

## 12. Files that should NOT be committed

- Any real `.env*`
- `exports/`, `*.sql`, `*.zip` dumps
- `node_modules/`, `.next/`
- `GreenFibre.zip` contents with secrets
- Secure backup folder
- Local audit scripts (`audit_*.py`, `qa_live.py`, `_mongo_to_mysql.mjs`) unless explicitly wanted

## 13. Missing files (relative to a full Hostinger VPS snapshot)

Not present in this local handover tree (often live only on server):

- Production Nginx site configs
- PM2 ecosystem file (if any)
- Live `.env` (intentionally excluded)
- Uploaded media binaries (served from MinIO, not necessarily in repo)
- `.htaccess` (N/A — Nginx/Node stack)

Application **source** for website + admin + API appears present.

## 14. Complete source-code copy?

**YES — for application source** (storefront + admin + API + docker compose definitions), based on entry points and package manifests.

**NO — as a full Hostinger server mirror** (no nginx/pm2/live env/media volumes), which is correct for GitHub.

## Classification summary

| Category | Contents |
|----------|----------|
| A. REQUIRED SOURCE CODE | `src/backend`, `src/frontend/*`, docker compose |
| B. REQUIRED PUBLIC ASSETS | `public/` folders under frontends |
| C. SERVER/PRODUCTION-ONLY | live env, nginx, pm2, DB volumes, media store |
| D. SENSITIVE | real env (backup/zip), dumps, SQL |
| E. TEMPORARY/UNNECESSARY | audit scripts, local reports optionally |

## Git / GitHub status (at inventory time)

- Git initialized in this folder: **NO** (before prep)
- Authenticated `gh` account: **ruhiruhi** (not client email)
- Client GitHub username for `malhotracharvik230511@gmail.com`: **UNKNOWN — required before push/transfer**
- Collaborator GitHub username for `ps743298@gmail.com`: **UNKNOWN — required to add collaborator**
