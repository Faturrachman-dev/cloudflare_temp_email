# Developer Guide: Cloudflare Temp Email Personalization

This project is a serverless temporary email system built on Cloudflare infrastructure. As a developer, you will interact with four main components: **Backend (Worker)**, **Database (D1)**, **Frontend (Vite/Vue)**, and **Deployment (Pages)**.

## Project Architecture

- **Backend (`/worker`):** Uses **Hono.js** as the API framework. Handles email processing logic, JWT authentication, and database interactions.
- **Frontend (`/frontend`):** Single Page Application (SPA) built with **Vite** and **Vue 3**, using **Naive UI** as the component library. This is the primary target for UI/UX modifications.
- **Database (`/db`):** SQLite schema for Cloudflare D1 that stores email metadata and message content.
- **Deployment Configuration (`/pages`):** Handles *Service Binding* configuration between Pages (Frontend) and Worker (Backend).

---

## Key Folder Structure (Frontend)

For manual modifications and responsiveness improvements, focus on these directories inside `frontend/`:

- **`src/views/`**: Main pages (Home, Admin, Mail). Edit files here to change page layouts.
- **`src/components/`**: Modular UI components. Best place to fix responsiveness of specific elements (buttons, cards, modals).
- **`src/i18n/`**: Internationalization system using `vue-i18n`. Locale source files live in `src/i18n/locales/source/`. The message registry (`message-registry.ts`) defines all keys with `en`/`zh` source strings; additional locales provide flat key→value overrides.
- **`src/assets/`**: Global CSS files. The project uses **Naive UI** components — not Tailwind CSS — so responsive behavior is controlled via Naive UI props (`responsive`, `breakpoint`, `n-grid` cols) rather than utility classes.

---

## Backend Configuration (`wrangler.toml`)

The following key variables in `wrangler.toml` (see `wrangler.toml.template` for the full reference) affect frontend behavior:

- **`PREFIX`**: Prefix prepended to generated email addresses. Set to `""` (empty) to disable — new addresses will be `user@domain` instead of `tmpuser@domain`.
- **`DEFAULT_DOMAINS`**: Primary domains that appear in the frontend dropdown.
- **`DOMAINS`**: All domain names the system accepts (superset of `DEFAULT_DOMAINS`).
- **`FORWARD_ADDRESS_LIST`**: Email list for the dual-route (forwarding) feature.
- **`JWT_SECRET`**: Encryption key for user sessions on the frontend.
- **`ENABLE_USER_CREATE_EMAIL`**: Boolean to allow email address creation from the UI.
- **`ENABLE_AI_EMAIL_EXTRACT`**: Boolean to enable AI-powered extraction of verification codes and auth links from incoming emails.
- **`ADMIN_PASSWORDS`**: Passwords to secure the admin panel at `/admin`.
- **`FRONTEND_URL`**: The URL of the frontend (set to `http://localhost:5173` during development).
- **`RATE_LIMITER`**: Rate limit binding for `/api/new_address` to prevent mass email creation abuse.

---

## Personalization & Modification Guide

### 1. Internationalization (Adding a New Locale)

The project uses `vue-i18n` with a structured registry system. To add a new locale (e.g. Indonesian `id`):

1. **Create a source file** at `src/i18n/locales/source/id.ts` — export a flat object mapping `"namespace.key"` strings to translated values (mirroring the structure of `es.ts` or `ja.ts`).
2. **Register the locale** in `src/i18n/locale-registry.ts` — add an entry with `locale`, `label`, `browserMatches`, and `naive` config (use `enUS`/`dateEnUS` as fallback if naive-ui lacks a native locale for your language).
3. **Wire it into messages** in `src/i18n/messages.ts` — import the source, add to `additionalLocaleSources`, and add to `I18N_MESSAGES`.
4. **Set as default** (optional) — change `FALLBACK_LOCALE` in `src/i18n/utils.ts` to your locale code. Existing users with saved preferences keep their choice; only first-time visitors get the new default.

### 2. Mobile-First Responsiveness

The project uses **Naive UI** (not Tailwind). Use Naive UI's responsive features:

- Use `n-grid` with `responsive="screen"` and `cols` like `"1 s:2 m:2 l:3"` to stack on mobile and expand on larger screens.
- Wrap `n-data-table` in `n-scrollbar` with `x-scrollable` for horizontal overflow, or switch to a card-list layout on small screens using `useBreakpoint()`.
- Set modal widths with `:style="{ width: '90vw', maxWidth: '600px' }"` so they don't overflow on mobile.
- Use `size="large"` on primary action buttons for comfortable tap targets.
- Collapse navigation items into `n-dropdown` below the `s` breakpoint.

### 3. AI Email Extraction

Enable `ENABLE_AI_EMAIL_EXTRACT = true` in `wrangler.toml` to have the worker automatically extract verification codes, OTPs, and auth links from incoming emails. The extracted data appears at the top of the message in the frontend without the user needing to read the full email body.

Required Workers AI binding in `wrangler.toml`:
```toml
[ai]
binding = "AI"
```

Recommended model: `@cf/meta/llama-3.1-8b-instruct-fast`

---

## Build, Run & Deploy

### Prerequisites

- **Node.js** ≥ 20 (Node 24 recommended for Wrangler 4.90+)
- **pnpm** (the project uses `pnpm` exclusively — do not use `npm` or `yarn`)
- **Cloudflare account** with Workers Paid plan (for AI binding and D1)
- **Wrangler CLI** authenticated (`pnpm wrangler login` in any sub-package)

### Local Development (Hot Reload)

Run the backend and frontend in separate terminals:

**Terminal 1 — Worker API (port 8787):**
```bash
cd worker
pnpm dev
```

**Terminal 2 — Frontend HMR (port 5173):**
```bash
cd frontend
pnpm dev
```

> **Note:** The frontend dev server proxies API requests to the worker automatically via Vite config. If it doesn't, set `VITE_API_BASE=http://localhost:8787` in `frontend/.env`.

### Frontend-Only Preview (No Backend)

If you just want to verify UI changes without the backend:

```bash
cd frontend
pnpm build          # build production bundle
pnpm preview        # serve dist/ at http://localhost:4173
```

### Build for Production

The frontend has multiple build modes depending on deployment target:

| Command | Mode | Use Case |
|---|---|---|
| `pnpm build` | `prod` | Standalone Worker deployment (API served by same Worker) |
| `pnpm build:pages` | `pages` | Cloudflare Pages deployment (API proxied via Pages Functions) |
| `pnpm build:release` | `example` | Demo/release build |
| `pnpm build:telegram` | `prod` + Telegram | Telegram Mini App build |

### Deploy to Production

The project deploys as **two separate Cloudflare resources**: a Worker (API) and a Pages site (frontend).

**1. Deploy the Worker (Backend API):**
```bash
cd worker
pnpm deploy          # runs: wrangler deploy --minify
```

**2. Deploy the Frontend (Cloudflare Pages):**
```bash
# Build first
cd frontend
pnpm build:pages

# Deploy from the pages/ directory (this is the correct path for custom domain binding)
cd ../pages
npx wrangler pages deploy
```

> **Why `pages/` and not `frontend/`?** The `npx wrangler pages deploy` command run from `pages/` correctly binds to the Cloudflare Pages project and its custom domain. Running from `frontend/` with `--branch production` may upload files but not activate the custom-domain alias.

> **Important:** The `worker/wrangler.toml` and `pages/wrangler.toml` files are **gitignored** because they contain secrets (JWT_SECRET, ADMIN_PASSWORDS, etc.). Copy from `wrangler.toml.template` and fill in your values. Never commit these files.

### Deploy via GitHub Actions (CI/CD)

The repo includes GitHub Actions workflows. Push to `main` to trigger automatic deployment if workflows are configured. See `.github/workflows/` for details.

---

## Address Recovery (Lost JWT)

When a user loses their JWT credential, they cannot re-access their inbox via the "Masuk" (credential login) tab. Since this is a passwordless temp-email service, the only recovery path is for the **operator** to mint a new JWT locally.

### Step 1: Look up the address ID

```bash
cd worker
npx wrangler d1 execute temp-email-db --remote \
  --command "SELECT id, name FROM address WHERE name LIKE '%sankoi%'"
```

Example output:
```
id  name
1   tmpsankoi@faturismee.online
```

### Step 2: Generate the JWT

```bash
cd worker
node scripts/gen-jwt.mjs tmpsankoi@faturismee.online 1
```

This reads `JWT_SECRET` from `wrangler.toml` and prints a signed JWT.

### Step 3: Use the JWT

Copy the printed token and paste it into the **"Kredensial alamat surat"** field on the **Masuk** tab. The inbox will load.

> **Tip:** After logging in, use the "Copy" button to copy the address, and save the JWT somewhere safe (password manager, notes). The JWT is shown only once during address creation.

---

## Security & Admin

- Use **`ADMIN_PASSWORDS`** to secure the admin panel at `/admin`.
- Configure **`RATE_LIMITER`** (as an unsafe binding) to prevent mass email creation abuse via the UI.
- Set **`PASSWORDS`** to make the entire site private (not just admin).

---

## Quick Reference: All pnpm Commands

### Frontend (`cd frontend`)
| Command | Description |
|---|---|
| `pnpm dev` | Start Vite dev server with HMR (port 5173) |
| `pnpm build` | Production build (standalone mode) |
| `pnpm build:pages` | Production build (Pages mode) |
| `pnpm preview` | Serve last build at localhost:4173 |
| `pnpm deploy` | Build + deploy to Cloudflare Pages (production) |
| `pnpm test` | Run Vitest unit tests |

### Worker (`cd worker`)
| Command | Description |
|---|---|
| `pnpm dev` | Start Wrangler dev server (port 8787) |
| `pnpm deploy` | Deploy Worker to Cloudflare (production) |
| `pnpm build` | Dry-run build to `dist/` (no deploy) |
| `pnpm lint` | Run ESLint |

### Pages (`cd pages`)
| Command | Description |
|---|---|
| `pnpm dev` | Start Pages dev server locally |
| `pnpm deploy` | Deploy Pages Functions to Cloudflare (production) |

---

> **Production domain:** `faturismee.online` — deployed via Cloudflare Pages + Workers.