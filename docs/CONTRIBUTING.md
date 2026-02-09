# Contributing

Thanks for contributing to Synthetic Soul Web UI.

This guide focuses on practical workflow for this repository.

## Prerequisites

- Node.js 20+
- npm 10+

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Configure local environment:

Create `.env.local`:

```env
VITE_SYNTHETIC_SOUL_BASE_URL=http://127.0.0.1:8000/v1
VITE_SYNTHETIC_SOUL_BASE_URL_NO_VERSION=http://127.0.0.1:8000
VITE_SYNTHETIC_SOUL_DM_TYPE=dm
```

3. Run app:

```bash
npm run dev
```

## Development Workflow

1. Create a focused branch from the latest mainline state.
2. Keep changes scoped (feature, fix, or docs).
3. Run checks before opening a PR:

```bash
npm run build
npm run lint
```

4. Update docs and changelog for user-visible behavior changes.

## Coding Guidelines

- Use TypeScript strict-safe patterns.
- Prefer small, composable React components.
- Keep styling consistent with the existing retro-terminal design system:
  - reuse `ss-*` classes and existing visual vocabulary
  - avoid introducing unrelated UI styles.
- Preserve accessibility basics:
  - semantic elements
  - clear labels
  - keyboard-friendly interactions.

## Documentation Policy

When behavior changes, update relevant docs in the same PR:

- `README.md` for setup/usage changes
- `docs/ARCHITECTURE.md` for structure and flow changes
- `docs/BACKEND_CONTRACT.md` for API expectation changes
- `CHANGELOG.md` for release-visible updates

## Changelog Policy

- Add user-visible changes to `## [Unreleased]` while work is in progress.
- Move finalized items into a version section when cutting a release.
- Use categories when possible:
  - `Added`
  - `Changed`
  - `Fixed`

## Pull Request Checklist

- [ ] Build passes (`npm run build`)
- [ ] Lint passes (`npm run lint`)
- [ ] Docs updated where applicable
- [ ] Changelog updated
- [ ] No unrelated file modifications
