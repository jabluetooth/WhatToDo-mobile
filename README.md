<div align="center">

# What To Do - Mobile

**Roll an app idea, write its spec, generate the code and push it to GitHub - all from your phone.**
The phone companion to [What To Do](https://github.com/jabluetooth/what-to-do): the same full-screen idea roller, a PRD and stack on the go, a real starter project built for you, and one tap to publish it as a repo.

![Expo](https://img.shields.io/badge/Expo-000020?style=for-the-badge&logo=expo&logoColor=white)
![React Native](https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-black?style=for-the-badge&logo=next.js&logoColor=white)
![Groq](https://img.shields.io/badge/Groq-F55036?style=for-the-badge&logo=groq&logoColor=white)

<br>

<!-- HERO: a 10-15s screen recording of one loop: tap ROLL -> the reel spins -> the lime
     flood lands an idea word by word -> Build this -> Generate code -> Push to GitHub.
     Save as docs/demo.gif and add here as: -->
<!-- <p align="center"><img src="docs/demo.gif" alt="What To Do mobile demo" width="360"></p> -->

</div>

---

## Try It Live

> **Scan with your phone to open instantly in Expo Go.**
> *(Download [Expo Go](https://expo.dev/go) on iOS or Android - free. Sign in with GitHub inside the app.)*

<div align="center">

<img src="docs/qr-expo-go.png" alt="Scan to try What To Do in Expo Go" width="220"/>

**[See it on Expo →](https://expo.dev/accounts/bonsky/projects/WhatToDo-mobile)**
*(always opens the latest release; on desktop, scan the QR above with your phone)*

</div>

---

## What It Does

Stuck on what to build? Roll. What To Do draws a fresh app idea, lands it full-screen, and takes you from "that one" to a written spec, a generated starter project and a GitHub repo without leaving your phone. Only the live in-browser preview stays on the web.

| Feature | Description |
|---|---|
| **The Draw** | Tap the lime Roll button: a reel of titles spins, a lime flood opens, and the idea lands word by word. Swipe right to save, left to roll again |
| **Write Your Own** | Describe an idea yourself, optionally steered by platform, scope (weekend / MVP / production) and the stacks you know |
| **Spec on the Phone** | "Build this" writes the PRD (problem, users, features, stories, scope, estimate), asks one question if the idea is vague, then recommends a stack with a reason for each pick |
| **Build on the Phone** | Generate code turns the spec into a real starter project (template filled in by the model, syntax-checked before it reaches you), with live progress that keeps going if you leave the screen |
| **Read the Code** | Browse the generated file tree and open any file in a read-only code viewer: monospace, line numbers, scrolls both ways |
| **Push to GitHub** | One tap creates a repo (private by default, or public) and pushes the project. The first push asks GitHub once for repo access; sign-in itself stays read-only |
| **Keep It for Later** | Not ready to publish? Keep the spec or the built project in Saved → Projects and push whenever you want. Projects are shared with the web app's History |
| **Saved** | Two views: Ideas (tags, notes, share, filter) and Projects (Spec, Building 42%, Code ready, Pushed at a glance) |
| **Daily Idea** | An optional 9:00 nudge with something to build |

---

## Screens

| Roll | The Draw | Spec | Project | Saved |
|---|---|---|---|---|
| WHAT TO DO? hero, orbiting Roll button, drifting idea titles | Reel, lime flood, idea landing word by word | PRD sections, clarifying question, stack with rationale, Keep / Generate code | Build progress, file tree and code viewer, Public switch, Push to GitHub, repo link | Ideas and Projects with live status, pull to refresh |

---

## Tech Highlights

- **One design language across web and phone** - the web app's palette (ink, cream, one acid-lime accent), faces (Anton, Geist, Geist Mono), film grain and easing curve, rebuilt natively
- **Motion that honours Reduce Motion** - the web's single `cubic-bezier(0.16, 1, 0.3, 1)` easing for everything, haptics on every tap, word-by-word reveals in padded masks so tall Anton capitals never crop
- **Offline-first saved ideas** - Zustand store over an AsyncStorage cache: instant load, optimistic save / edit / remove with rollback, cleared on sign-out
- **Stateless mobile API** - `/api/mobile/prd` and `/api/mobile/stack` fold the web's session-based PRD and stack steps into bearer-token calls with the same moderation, vagueness check, daily caps and refund-on-failure
- **Locked-down sign-in** - backend-mediated GitHub OAuth; the returned token only goes to this app's own scheme, a private-network dev server, or this project's pinned Expo update URL
- **Race-safe spec flow** - a slower, older request can never overwrite the spec you're looking at
- **Server-side builds that outlive the screen** - code generation runs as a queued job on the backend (QStash worker, files in R2); the app polls it from a store, not a screen, and resumes a running build after a relaunch
- **One history across web and phone** - mobile projects are written to the same Postgres tables as the web's signed-in History, so a project started on either shows up on both
- **Least-privilege GitHub access** - repo scope is requested only on the first push, bound to the signed-in user server-side before the browser round trip, and stored encrypted (AES-256-GCM); pushing the same build twice returns the existing repo

---

## Stack

| Layer | Technology |
|---|---|
| Framework | React Native 0.86 · Expo 57 · Expo Router |
| Language | TypeScript (strict) |
| State | Zustand + AsyncStorage (offline-first) |
| Backend | [What To Do](https://github.com/jabluetooth/what-to-do) (Next.js on Vercel), `/api/mobile/*` |
| AI | Groq, via the backend |
| Auth | GitHub OAuth, bearer token in `expo-secure-store` |
| Animation | Reanimated 4 · react-native-gesture-handler · react-native-svg |
| Publishing | GitHub REST API (repo creation and file push, via the backend) |
| Build | EAS Build · EAS Update (OTA) · GitHub Actions typecheck |

---

## How it talks to the backend

The app has no backend of its own; it's a client for the web app's `/api/mobile/*` routes.

| Endpoint | Purpose |
|---|---|
| `GET /api/mobile/auth/github/start` · `/callback` | Backend-mediated GitHub OAuth, returns a bearer token to the app |
| `GET /api/mobile/me` | Your profile |
| `GET /api/mobile/ideas/random` | Roll an idea (rate-limited) |
| `POST /api/mobile/prd` | Write a PRD for a prompt, or ask one clarifying question |
| `POST /api/mobile/stack` | Recommend a stack for a PRD |
| `GET` · `POST` · `PATCH` · `DELETE /api/mobile/favorites` | Your saved ideas |
| `GET` · `POST /api/mobile/projects` | List your projects, or save a spec (+ stack) as one |
| `GET` · `DELETE /api/mobile/projects/:id` | One project with its generated file list, or delete it and its files |
| `PUT /api/mobile/projects/:id/stack` | Attach a newer stack |
| `POST /api/mobile/projects/:id/boilerplate` | Queue a build; poll `GET /api/mobile/jobs/:id` for progress |
| `GET /api/mobile/projects/:id/file?path=` | One generated file, for the code viewer |
| `POST /api/mobile/projects/:id/push` | Create a repo (private or public) and push the code |
| `POST /api/mobile/github/connect` · `GET` · `DELETE /api/mobile/github` | Grant repo access for pushing, check it, or revoke it |

---

## Getting Started (Local)

```bash
git clone https://github.com/jabluetooth/WhatToDo-mobile.git
cd WhatToDo-mobile
npm install
cp .env.example .env
```

Point `EXPO_PUBLIC_API_BASE_URL` in `.env` at the backend. The deployed one works for UI and sign-in:

```bash
EXPO_PUBLIC_API_BASE_URL=https://whattodoby.filheinzrelatorre.com
```

Then:

```bash
npx expo start    # scan the QR with Expo Go; phone and PC on the same Wi-Fi
```

- Sign-in works from a dev server on your local network (the backend accepts private-network `exp://` callbacks). Tunnel mode (`--tunnel`) can't sign in: its public `*.exp.direct` hosts are rejected on purpose.
- Use npm here, not pnpm: EAS builds pick the package manager from the lock file.
- Publishing: `npx eas-cli update --channel production --environment production --message "…"`. The README QR always opens the latest update on that channel.

---

## About the developer

**Fil Heinz O. Re La Torre** - Automation & AI Solutions Engineer, building integrations and AI-backed workflows that go from idea to production in days.

[![Portfolio](https://img.shields.io/badge/Portfolio-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://www.filheinzrelatorre.com)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://ph.linkedin.com/in/filheinzrelatorre)
[![GitHub](https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white)](https://github.com/jabluetooth)
[![Gmail](https://img.shields.io/badge/Gmail-D14836?style=for-the-badge&logo=gmail&logoColor=white)](mailto:filheinz27@gmail.com)

**Other projects:** [What To Do](https://github.com/jabluetooth/what-to-do) · [Se7en](https://github.com/jabluetooth/se7en) · [Mimo](https://github.com/jabluetooth/mimo) · [Relay](https://github.com/jabluetooth/relay) · [see all →](https://github.com/jabluetooth)
