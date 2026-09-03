# What To Do — Mobile

Mobile companion to [What To Do](../WhatToDo) (Next.js). Scoped per the web app's own PRD (v2 roadmap): **idea browsing/generation and favoriting only** — no PRD/stack/boilerplate/preview pipeline on mobile.

Built with Expo + Expo Router + TypeScript. Sign-in is required (GitHub OAuth) — there's no anonymous/guest mode on mobile.

## How it talks to the backend

This app has no backend of its own — it's a client for `WhatToDo`'s existing Next.js API, hitting a small new surface added under `/api/mobile/*`:

| Endpoint | Purpose |
|---|---|
| `GET /api/mobile/auth/github/start` | Kicks off backend-mediated GitHub OAuth (see below) |
| `GET /api/mobile/auth/github/callback` | GitHub redirects here; mints a bearer token, bounces back to the app |
| `GET /api/mobile/me` | Current user's profile |
| `GET /api/mobile/ideas/random` | Generate a random app idea (bearer-auth, rate-limited) |
| `GET /api/mobile/favorites` | List saved favorites |
| `POST /api/mobile/favorites` | Save an idea |
| `DELETE /api/mobile/favorites/:id` | Remove a saved favorite |

Auth model: NextAuth's own web session is cookie-based and doesn't work for a mobile client, so mobile uses a **separate bearer-token flow** — the app opens `/api/mobile/auth/github/start` in an in-app browser, the backend round-trips through GitHub using its own fixed callback URL, then redirects back into the app's custom URL scheme (`whattodo://auth-callback`) with a signed token. The token is stored in `expo-secure-store` and sent as `Authorization: Bearer <token>` on every API call.

## Setup

```bash
npm install
cp .env.example .env   # defaults to http://localhost:3000, edit as needed
npm start               # then press w for web, or scan the QR for a device
```

**Required backend-side setup (one-time, done in `WhatToDo/`, not here):**
1. Run the pending Drizzle migration (`drizzle/0003_fancy_scarecrow.sql`) against the database — adds the `favorite` table.
2. Register this app's OAuth callback in the GitHub OAuth App's settings (the same app already used for the web app's GitHub sign-in): add `{APP_URL}/api/mobile/auth/github/callback` as an authorized callback URL — e.g. `https://whattodoby.filheinzrelatorre.com/api/mobile/auth/github/callback` in production. For local dev, GitHub needs to redirect back to *something* it can reach — a tunnel (ngrok, Cloudflare Tunnel) pointed at your local `pnpm dev` server works if testing the full sign-in flow locally; without one, sign-in itself won't complete against a local backend, though the rest of the UI can still be developed and previewed.

## Notes on device testing

- `expo start --web` is the lightest way to preview UI/layout changes — no emulator/native build needed.
- For a real device via Expo Go: set `EXPO_PUBLIC_API_BASE_URL` in `.env` to your machine's LAN IP (not `localhost`), since the phone is a separate device on the network.
- The `redirect_uri` allowlist on the backend (`app/api/mobile/auth/github/start/route.ts`) permits Expo Go's `exp://` scheme outside production only — Expo Go has no custom scheme of its own, so `Linking.createURL()` resolves to an `exp://` URL during development. A standalone/dev-client build always produces `whattodo://`, and that's all `NODE_ENV=production` allows.
