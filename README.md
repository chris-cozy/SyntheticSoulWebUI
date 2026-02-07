# 🌌 Synthetic Soul UI

A neon-styled, cyber-aesthetic web interface for interacting with the **Synthetic Soul API agents**.
It provides authentication, live chat, personality/emotion visualizations, and agent status dashboards.

---

## ✨ Features

* **Authentication**

  * Guest sessions, login, signup (claim), refresh, and logout
  * Token persistence with auto-refresh
  * `AuthProvider` + `useAuth()` hook for React integration

* **Agent Chat**

  * Secure chat interface with conversation persistence
  * Polling system for async job responses
  * Neon-themed UI with glitch and CRT effects

* **Agent Panel**

  * Displays agent **expression**, **MBTI type**, **identity text**
  * Personality matrix (bars or radar chart)
  * Emotional status (heat-mapped bars or radar chart)
  * Latency indicator + online/offline state

* **Visualizations**

  * `NeonRadar`: general radar chart (e.g. personality)
  * `NeonEmotionRadar`: emotion-mapped radar chart with color semantics
  * Smooth neon gradients, animated bars, pulsing dots

* **Persistence**

  * Session IDs + client IDs (`ids.ts`) stored in browser storage
  * Agent view preferences (`bars` vs `radar`) saved locally

---

## 🛠️ Tech Stack

* **React 18 + Vite**
* **TypeScript**
* **Tailwind CSS** for neon cyber-aesthetic styling
* **Chart.js + react-chartjs-2** for radar charts
* **Custom Auth Layer** wrapping `/v1/auth/*` endpoints

---

## 📂 Project Structure

```
src/
 ├── App.tsx               # Root app, wires auth + SyntheticSoul
 ├── SyntheticSoul.tsx     # Main chat + layout
 ├── AgentPanel.tsx        # Side panel for agent info
 ├── NeonRadar.tsx         # Personality radar visualization
 ├── NeonEmotionRadar.tsx  # Emotion radar visualization
 ├── AuthMenu.tsx          # Header auth menu component
 ├── auth.tsx              # Auth provider + hooks
 ├── ids.ts                # Client/session ID helpers
 ├── main.tsx              # Entry point
 └── index.css             # Tailwind + global CSS
```

---

## 🚀 Getting Started

### 1. Prerequisites

* **Node.js** ≥ 18
* **pnpm**, **yarn**, or **npm**

### 2. Install Dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
```

### 3. Environment Variables

Create a `.env` file with:

```env
VITE_SYNTHETIC_SOUL_BASE_URL=https://your-api-base-url/v1
VITE_SYNTHETIC_SOUL_DM_TYPE=dm   # "dm" or "group"
```

### 4. Run Dev Server

```bash
npm run dev
```

Then visit: `http://localhost:5173`

### 5. Build for Production

```bash
npm run build
```

---

## 🔐 Authentication Flow

* On load:

  * If a valid token exists → refresh it
  * Else → create a **guest session**
* Actions available:

  * `startGuest()` → POST `/auth/guest`
  * `login(email, password)`
  * `claim(email, username, password)`
  * `refresh()` → POST `/auth/refresh` with `X-CSRF-Token` from `refresh_csrf` cookie
  * `logout()` → clears token and starts a new guest

The `authFetch` helper automatically:

* Attaches the Bearer token
* Sends credentials (`credentials: include`) for cookie-based refresh support
* Retries once if a request fails with 401 (after refresh)

---

## 🖼️ UI Overview

* **Top bar**: branding, auth menu
* **Left panel**: AgentPanel (expression image, MBTI, personality, emotions)
* **Right panel**: Chat interface, conversation log, input box
* **Status bars**: latency, version info, agent’s latest thought

---

## 📊 Visualizations

* **Radar charts**

  * `NeonRadar` for personality dimensions
  * `NeonEmotionRadar` with emotion heat colors (`joy`, `anger`, `fear`, etc.)
* **Bar charts**

  * Personality grouped by themes (Relational Traits, Drive, Stability…)
  * Emotion bars with gradient fills + glowing indicators

---

## ⚙️ Customization

* Expressions loaded from `/public/expressions/*.jpg`
* Neon colors adjustable in `NeonRadar.tsx` / `NeonEmotionRadar.tsx`
* Tailwind classes for cyberpunk style (`bg-black/70`, emerald/cyan gradients)

---

## 📡 API Endpoints Used

* `/v1/auth/*` → guest, login, claim, refresh, logout, me
* `/v1/messages/submit` → submit user input
* `/v1/jobs/:id` → poll job results
* `/v1/messages/conversation` → load conversation history
* `/v1/agents/active` → active agent info (MBTI, personality, emotions)
* `/v1/thoughts/latest` → agent’s latest thought
* `/v1/meta/version` → API version info

---

## 🧩 Future Enhancements

* Multiple agent selection
* Realtime streaming responses
* Dark/light mode toggle
* Advanced emotion mapping (beyond Plutchik’s wheel)

---

## 📜 License

MIT — free to modify, adapt, and use.
