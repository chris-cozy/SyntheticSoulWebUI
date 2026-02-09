# Changelog

All notable changes to this project are documented in this file.

## [Unreleased]

## [1.1.0] - 2026-02-08

### Added

- Semantic versioning baseline for the UI package.
- Release scripts in `package.json` for patch, minor, and major version bumps.
- Project changelog file to track user-facing changes by version.
- Full retro sci-fi terminal startup flow with a boot sequence screen before app entry.
- New secure access portal screen with:
  - login form mode (email/password)
  - continue-as-guest option
  - continue-as-current-session option when a valid authenticated session already exists.
- Reusable UI component architecture for the redesigned interface:
  - `HeaderBanner`
  - `AgentConsolePanel`
  - `LatestThoughtTicker`
  - `TerminalChatLog`
  - `SuggestedPromptChips`
  - `TerminalInputBar`
- Continuous latest-thought marquee/ticker above the chat log.
- Suggested prompt chips that populate the input field without auto-sending.
- Per-message terminal typing/typewriter animation for newly appended chat messages.
- Agent profile diagnostics tab system with `SELF - PERCEPTION`, `MATRIX`, and `STATUS` tabs.
- Additional profile metadata field for current agent expression under latency.
- Startup access portal backend-link monitoring with an inline terminal-style status panel (`checking`, `online`, `offline`).
- Manual `RETRY LINK CHECK` action when backend is unavailable.
- Auto-retry countdown display that shows live seconds remaining until the next backend reachability probe.
- Typewriter animation for startup access status messaging.
- Typewriter animation for `SELF - PERCEPTION` agent text content.
- Explicit `animateOnMount` support for chat messages to target startup intro lines for deterministic typing behavior.

### Changed

- Complete visual overhaul to a cohesive CRT/retro terminal aesthetic (scanlines, noise, restrained glow, console panel treatment, and terminal typography).
- Main layout reworked to a two-column console on desktop with stacked/collapsible behavior on mobile.
- Header branding updated to `Synthetic Soul` with distinct styling:
  - gradient treatment for `Synthetic`
  - solid accent color for `Soul`.
- Chat presentation changed to terminal-style plain lines:
  - removed message card boxes
  - removed sender metadata headers above messages
  - user messages now prefixed with `>>`
  - agent/system messages render without that prefix.
- Chat readability tuned with increased inter-message spacing and role-specific color contrast.
- Agent response color aligned to the same accent token used by `Soul` branding.
- Input placeholder text made dynamic: `TYPE MESSAGE TO <Agent Name>`.
- Left profile panel behavior refined to minimize whole-panel scrolling by moving profile text and diagnostics into tabbed content.
- `SELF - PERCEPTION` text now uses the diagnostics panel boundary without an extra inner outline.
- Auth bootstrap/logout behavior updated to avoid implicit guest creation and defer access mode selection to the startup portal.
- Disabled `LOGIN TO ACCOUNT` and `CONTINUE AS GUEST` while the backend is unavailable or link status is still checking.
- Access portal now performs recurring backend reachability checks while offline and re-enables auth actions automatically when connectivity returns.
- Startup intro chat lines (`VERSION ...` and welcome line) now load with typing effect only (without entry-motion animation).
- Overhauled project documentation to match the current implementation:
  - rewrote `README.md` with accurate setup, startup/access flow, environment variables, scripts, and troubleshooting
  - added `docs/ARCHITECTURE.md` for frontend structure and runtime behavior
  - added `docs/BACKEND_CONTRACT.md` for API compatibility expectations
  - added `docs/CONTRIBUTING.md` with contributor workflow, checks, and documentation/changelog policy.

### Fixed

- Fixed role color styling not applying due text color override on the chat message element.
- Fixed startup boot sequence hang introduced during auto-skip work:
  - corrected boot effect lifecycle so interval/timers are not canceled after the first tick in dev/Strict Mode
  - ensured post-boot transition consistently advances to `ready` (active session) or `access` (no session).
- Fixed startup intro message typing not triggering when messages were inserted in batch updates.
- Fixed startup intro lines still showing entry animation by removing that motion for `animateOnMount` lines.
