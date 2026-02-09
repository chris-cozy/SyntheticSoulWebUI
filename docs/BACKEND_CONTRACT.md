# Backend Contract (UI Compatibility)

This document lists what the current UI expects from the backend.

## Base URL Expectations

- `VITE_SYNTHETIC_SOUL_BASE_URL` points to the versioned API base (example: `/v1`).
- `VITE_SYNTHETIC_SOUL_BASE_URL_NO_VERSION` points to unversioned base (for expression images).

## Authentication Endpoints

- `POST /auth/guest`
- `POST /auth/login`
- `POST /auth/claim`
- `POST /auth/refresh`
- `POST /auth/logout`
- `GET /auth/me`

## Notes

- Refresh flow uses cookie + CSRF header (`refresh_csrf` cookie -> `X-CSRF-Token` header).
- UI keeps access token in localStorage key `ss_token`.
- Most requests are made through `authFetch` and include credentials.

## Startup Reachability Check

Endpoint used:

- `GET /meta/version`

Behavior expected:

- `<500` status is treated as reachable (online).
- Network errors/timeouts and `>=500` are treated as offline.

## Chat Submission Contract

Endpoint:

- `POST /messages/submit`

Request body:

```json
{
  "message": "<user input>",
  "type": "dm"
}
```

Response modes:

1. **Immediate** (`200` or other non-`202` success)
   - Returns payload with response text.
2. **Async** (`202`)
   - Returns `job_id`
   - Optionally provides `Location` header for job status URL.

## Job Resolution Contract

### Polling

- `GET /jobs/:id`
- Expected shape:

```json
{
  "job_id": "...",
  "status": "pending|running|succeeded|finished|failed",
  "result": { "response": "...", "time": 0.42, "expression": "happy" },
  "error": "..."
}
```

### SSE (preferred)

- `GET /jobs/:id/events?access_token=<token>`
- UI listens for:
  - `status`
  - `done`
  - default `message`

Terminal statuses for completion:

- success: `succeeded`, `finished`
- failure: `failed`

If SSE fails/disconnects, UI falls back to polling.

## Conversation and Agent Context

### Conversation history

- `GET /messages/conversation`
- Expected nested shape:

```json
{
  "conversation": {
    "messages": [
      {
        "id": "optional",
        "timestamp": "2026-02-09T12:00:00Z",
        "from_agent": true,
        "message": "..."
      }
    ]
  }
}
```

### Active agent

- `GET /agents/active`
- Expected fields used by UI:
  - `agent.name`
  - `agent.identity`
  - `agent.global_expression`
  - `agent.personality.mbti` variants:
    - `myers-briggs`
    - `myersBriggs`
    - `mbti`
  - `agent.personality.personality_matrix`
  - `agent.emotional_status.emotions`

### Latest thought

- `GET /thoughts/latest`
- Expected field:
  - `latest_thought.thought`

## Static Expression Images

Rendered path pattern:

- `/static/expressions/{agentNameLower}/{expression}.{ext}`

Extensions tried in order:

1. `jpeg`
2. `jpg`
3. `png`
4. `webp`

If chosen expression is missing, UI attempts fallback to `neutral`.
