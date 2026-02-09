# Synthetic Soul Web UI

Retro terminal-style web client for interacting with Synthetic Soul API agents.

This project has recently undergone a major UI and startup-flow overhaul. This README reflects the current implementation.

## What This App Does

- Runs a CRT-style boot sequence, then presents a secure access portal.
- Lets users enter with an existing session, login, or continue as guest.
- Checks backend reachability in the access portal and disables auth actions when the API is unavailable.
- Displays a two-column terminal console UI:
  - left: agent profile + diagnostics tabs
  - right: terminal chat log + suggestions + input.
- Submits chat requests as async jobs and resolves them via SSE first, polling fallback second.

## Current UX Flow

1. **Boot sequence** (`boot` phase).
2. **Access portal** (`access` phase), unless a valid active session already exists.
3. **Main console** (`ready` phase).

Access portal behavior:

- Backend link status is shown as `checking`, `online`, or `offline`.
- `LOGIN TO ACCOUNT` and `CONTINUE AS GUEST` are disabled unless status is `online`.
- Manual retry button and 10-second auto-retry are available while offline.

## Tech Stack

- React 19
- TypeScript
- Vite 7
- Tailwind CSS 4 (plus custom CSS)
- Chart.js + react-chartjs-2 (legacy visualization modules still present)

## Requirements

- Node.js 20+
- npm 10+ (recommended)

## Quick Start

1. Install dependencies:

```bash
npm install
```

2. Configure environment:

Create `.env.local`:

```env
VITE_SYNTHETIC_SOUL_BASE_URL=http://127.0.0.1:8000/v1
VITE_SYNTHETIC_SOUL_BASE_URL_NO_VERSION=http://127.0.0.1:8000
VITE_SYNTHETIC_SOUL_DM_TYPE=dm
```

3. Run development server:

```bash
npm run dev
```

4. Build production bundle:

```bash
npm run build
```

5. Preview production bundle:

```bash
npm run preview
```

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `VITE_SYNTHETIC_SOUL_BASE_URL` | Yes | API base URL with version segment (example: `http://127.0.0.1:8000/v1`). |
| `VITE_SYNTHETIC_SOUL_BASE_URL_NO_VERSION` | Yes | API base URL without `/v1`, used for static expression images. |
| `VITE_SYNTHETIC_SOUL_DM_TYPE` | Optional | Message type sent to `/messages/submit`; `dm` (default) or `group`. |

## Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Start local Vite dev server. |
| `npm run build` | Typecheck + production build. |
| `npm run preview` | Preview production build locally. |
| `npm run lint` | Run ESLint. |
| `npm run release:patch` | Bump patch version (no git tag). |
| `npm run release:minor` | Bump minor version (no git tag). |
| `npm run release:major` | Bump major version (no git tag). |

## API Contract Summary

The UI expects these backend capabilities:

- Auth endpoints:
  - `POST /auth/guest`
  - `POST /auth/login`
  - `POST /auth/claim`
  - `POST /auth/refresh`
  - `POST /auth/logout`
  - `GET /auth/me`
- Metadata and status:
  - `GET /meta/version`
- Chat flow:
  - `POST /messages/submit` (sync or `202` async job)
  - `GET /jobs/:id`
  - `GET /jobs/:id/events` (SSE)
  - `GET /messages/conversation`
- Agent context:
  - `GET /agents/active`
  - `GET /thoughts/latest`

Detailed request/response expectations are documented in `docs/BACKEND_CONTRACT.md`.

## Project Structure

```text
src/
  App.tsx                    # API submission + async job orchestration
  SyntheticSoul.tsx          # Startup phases + main console UI state
  auth.tsx                   # Auth provider, token/refresh, authFetch
  AuthMenu.tsx               # In-app account menu
  components/
    HeaderBanner.tsx
    AgentConsolePanel.tsx
    LatestThoughtTicker.tsx
    TerminalChatLog.tsx
    SuggestedPromptChips.tsx
    TerminalInputBar.tsx
  index.css                  # Global CRT/terminal styling
  main.tsx                   # App bootstrap
```

Legacy modules still present in `src/` (not part of current primary UI path):

- `AgentPanel.tsx`
- `InsightsPanel.tsx`
- `NeonRadar.tsx`
- `NeonEmotionRadar.tsx`

## Documentation Index

- `README.md`: setup and operational overview.
- `CHANGELOG.md`: versioned change history.
- `docs/ARCHITECTURE.md`: frontend architecture and data flow.
- `docs/BACKEND_CONTRACT.md`: backend expectations for UI compatibility.
- `docs/CONTRIBUTING.md`: contributor workflow and release/doc policy.

## Troubleshooting

- **Stuck at access portal with auth actions disabled**
  - Backend link check is failing; verify API availability and `VITE_SYNTHETIC_SOUL_BASE_URL`.
- **Expressions not loading**
  - Confirm `VITE_SYNTHETIC_SOUL_BASE_URL_NO_VERSION` and static asset paths on backend.
- **No chat response after submit**
  - Inspect `/messages/submit`, `/jobs/:id`, and `/jobs/:id/events` behavior.

## License

MIT.
