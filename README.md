<div align="center">

# What To Do - Mobile

**Roll an app idea worth building, write its spec, and hand it to the web to build.**
The phone companion to [What To Do](https://github.com/jabluetooth/what-to-do): the same full-screen idea roller, a PRD and stack on the go, and your shortlist synced with the web app.

![Expo](https://img.shields.io/badge/Expo-000020?style=for-the-badge&logo=expo&logoColor=white)
![React Native](https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-black?style=for-the-badge&logo=next.js&logoColor=white)
![Groq](https://img.shields.io/badge/Groq-F55036?style=for-the-badge&logo=groq&logoColor=white)

<br>

<!-- HERO: a 10-15s screen recording of one loop: tap ROLL -> the reel spins -> the lime
     flood lands an idea word by word -> Build this -> the spec writes itself. Save as
     docs/demo.gif and add here as: -->
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

Stuck on what to build? Roll. What To Do draws a fresh app idea, lands it full-screen, and takes you from "that one" to a written spec in two taps.

| Feature | Description |
|---|---|
| **The Draw** | Tap the lime Roll button: a reel of titles spins, a lime flood opens, and the idea lands word by word. Swipe right to save, left to roll again |
| **Write Your Own** | Describe an idea yourself, optionally steered by platform, scope (weekend / MVP / production) and the stacks you know |
| **Spec on the Phone** | "Build this" writes the PRD (problem, users, features, stories, scope, estimate), asks one question if the idea is vague, then recommends a stack with a reason for each pick |
| **Build on the Web** | Hand the idea or your prompt to the web app, which picks up where the phone left off and generates the code |
| **Saved Ideas** | A shortlist synced with your account: tags, notes, share, filter by tag |
| **Daily Idea** | An optional 9:00 nudge with something to build |

---

## Screens

| Roll | The Draw | Spec | Write | Saved |
|---|---|---|---|---|
| WHAT TO DO? hero, orbiting Roll button, drifting idea titles | Reel, lime flood, idea landing word by word | PRD sections, clarifying question, stack with rationale | Your own idea with platform, scope and stack hints | Hairline list, tags, notes, pull to refresh |

---

## Tech Highlights

- **One design language across web and phone** - the web app's palette (ink, cream, one acid-lime accent), faces (Anton, Geist, Geist Mono), film grain and easing curve, rebuilt natively
- **Motion that honours Reduce Motion** - the web's single `cubic-bezier(0.16, 1, 0.3, 1)` easing for everything, haptics on every tap, word-by-word reveals in padded masks so tall Anton capitals never crop
- **Offline-first saved ideas** - Zustand store over an AsyncStorage cache: instant load, optimistic save / edit / remove with rollback, cleared on sign-out
- **Stateless mobile API** - `/api/mobile/prd` and `/api/mobile/stack` fold the web's session-based PRD and stack steps into bearer-token calls with the same moderation, vagueness check, daily caps and refund-on-failure
- **Locked-down sign-in** - backend-mediated GitHub OAuth; the returned token only goes to this app's own scheme, a private-network dev server, or this project's pinned Expo update URL
- **Race-safe spec flow** - a slower, older request can never overwrite the spec you're looking at

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
