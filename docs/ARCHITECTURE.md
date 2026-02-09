# Frontend Architecture

This document describes the current architecture of the Synthetic Soul Web UI.

## Runtime Layers

1. `AuthProvider` (`src/auth.tsx`)
2. `App` (`src/App.tsx`)
3. `SyntheticSoul` (`src/SyntheticSoul.tsx`)
4. Presentational components in `src/components/`

## 1) Auth Layer (`src/auth.tsx`)

Responsibilities:

- Hold auth state (`token`, `user`, `loading`).
- Expose auth actions: `startGuest`, `login`, `claim`, `refresh`, `logout`.
- Provide `authFetch` wrapper that:
  - adds bearer token headers
  - sends cookie credentials
  - retries once after `401` using `refresh()`.

Key behavior:

- On provider boot:
  - if token exists: validate via `/auth/me`, fallback refresh
  - if validation/refresh fails: clear token and user.
- No implicit auto-guest creation at provider boot.

## 2) API Orchestration (`src/App.tsx`)

Responsibilities:

- Convert user input into backend ask flow.
- Normalize different backend response payload shapes into `AskResult`.

Ask flow:

1. `POST /messages/submit`
2. If non-`202`: treat as immediate response.
3. If `202`: extract `job_id` and resolve result using:
   - SSE (`/jobs/:id/events`) first
   - polling (`/jobs/:id`) fallback.

## 3) Startup + Main Screen State (`src/SyntheticSoul.tsx`)

Core startup phases:

- `boot`
- `access`
- `ready`

### Boot phase

- Renders terminal boot lines with progress bar.
- Transitions to:
  - `ready` if active session exists
  - else `access`.

### Access phase

- Shows login/guest entry UI.
- Performs backend link checks using `/meta/version`.
- Maintains status: `checking | online | offline`.
- Disables login/guest actions unless `online`.
- Supports manual retry + 10s auto-retry while offline.

### Ready phase

- Loads and refreshes:
  - API version (`/meta/version`)
  - conversation history (`/messages/conversation`)
  - active agent (`/agents/active`)
  - latest thought (`/thoughts/latest`).

- Handles chat send pipeline by appending user line, awaiting `onAsk`, and appending agent/system line.

## 4) Presentational Components

### `HeaderBanner`

- Top terminal banner with status, version, branding, and auth menu.

### `AgentConsolePanel`

- Left console panel with:
  - profile image and metadata
  - diagnostics tabs (`SELF - PERCEPTION`, `MATRIX`, `STATUS`).

### `LatestThoughtTicker`

- Scrolling marquee of latest thought text.

### `TerminalChatLog`

- Terminal line rendering and typing effects.
- Supports explicit `animateOnMount` for deterministic intro-message typing.

### `SuggestedPromptChips`

- Click-to-populate suggestion chips.

### `TerminalInputBar`

- Dynamic placeholder with active agent name.

## Data Shapes

### `AskResult` (from `App.tsx`)

- `text: string`
- `time?: number`
- `expression?: string`

### `ChatMessage` (from `TerminalChatLog.tsx`)

- `id: number | string`
- `role: "user" | "assistant" | "system"`
- `text: string`
- `createdAt?: number`
- `animateOnMount?: boolean`

## Styling Model

- Global style system in `src/index.css`.
- Tailwind is available, but major UI look is controlled by custom CSS classes (`ss-*`).

## Legacy Modules

The following files exist but are not part of the current main render path:

- `src/AgentPanel.tsx`
- `src/InsightsPanel.tsx`
- `src/NeonRadar.tsx`
- `src/NeonEmotionRadar.tsx`

They may be reused later, but current UI architecture uses the `src/components/*` console set.
