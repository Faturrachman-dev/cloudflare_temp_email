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

- **`PREFIX`**: Default prefix for generated email addresses (e.g. `tmp`).
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

## Local Development Workflow

1. **Backend Dev:**
```bash
cd worker
pnpm wrangler dev
```

2. **Frontend Dev:**
```bash
cd frontend
pnpm dev
```

3. **Sync:** Make sure `FRONTEND_URL` in `wrangler.toml` points to `http://localhost:5173` during development.

---

## Security & Admin

- Use **`ADMIN_PASSWORDS`** to secure the admin panel at `/admin`.
- Configure **`RATE_LIMITER`** (as an unsafe binding) to prevent mass email creation abuse via the UI.
- Set **`PASSWORDS`** to make the entire site private (not just admin).

---

> **Developer Note:** Always run `pnpm build` in the `frontend` folder after UI modifications, then deploy from the `pages` folder to see changes on the production domain `faturismee.online`.