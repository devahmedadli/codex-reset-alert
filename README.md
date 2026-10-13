# Codex Reset Alert

A lightweight Manifest V3 browser extension that checks the public [codex-resets.com](https://codex-resets.com/) API and notifies the user when a new Codex reset watch or reset event appears.

> `codex-resets.com` is a third-party community tracker. Its signals are not an OpenAI commitment.

## Features

- **Full Bilingual Support (EN / AR)** with automatic language detection, instant 1-click header switcher, and RTL layout.
- Notifications for new upcoming reset watches and scheduled resets.
- Notifications for newly observed reset events.
- **Interactive notification action buttons** to jump directly to the announcement post on X or open the tracker.
- **One-click share/copy button** in popup to copy formatted announcement summaries for team chats (Slack, Discord, X).
- **Optional audio chime alert** with in-popup sound preview.
- Deduplication, so the same event is not announced repeatedly.
- No notification for an old event on first install; the first fetch seeds local state.
- Configurable polling interval: 5, 15, 30, or 60 minutes.
- ETag support to avoid downloading unchanged responses.
- `Retry-After` backoff for HTTP 429/503 responses.
- Popup with active-watch state, latest reset, source link, refresh, and notification settings.
- Browser badge for active watches and very recent resets.
- Chrome/Chromium, Firefox, and Edge compatible Manifest V3 background configuration.
- No account login, cookies, prompts, browser history, or Codex credentials are read.

## Toolbar Icon Badges

| Badge | Color | Meaning |
| :--- | :--- | :--- |
| **`✓`** | 🟢 Green | **Recent Reset Completed** — A Codex reset occurred or was announced within the last 24 hours. |
| **`!`** | 🔵 Blue | **Reset Scheduled** — An upcoming reset has been scheduled with an announced target date/time. |
| **`!`** | 🟠 Amber | **Reset Watch Active** — A public reset signal or elevated chance window is currently active. |
| *(none)* | — | **Monitoring / Standby** — No active watch or recent reset; checking periodically in the background. |

Hovering over the extension icon in the browser toolbar also shows the current status as a native tooltip.

## Data source

The extension performs a read-only unauthenticated request to:

```text
https://codex-resets.com/api/v1/status
```

The current response is normalized from `data.latest_reset` and `data.active_watch`. Source links are only accepted when they use HTTP(S).

## Local installation

### Chrome / Edge / Chromium

1. Open `chrome://extensions` (or `edge://extensions`).
2. Enable **Developer mode**.
3. Click **Load unpacked**.
4. Select `dist/chrome` (or `dist/edge`, or the root folder).

### Firefox

1. Open `about:debugging#/runtime/this-firefox`.
2. Click **Load Temporary Add-on**.
3. Select `dist/firefox/manifest.json` (or `manifest.json`).

## Multi-Browser Builds

Build and package store-ready ZIP archives and unpacked directories for **Chrome**, **Firefox**, and **Edge**:

```bash
# Run unit tests
npm test

# Build all browser packages
npm run build
```

The build script (`build.sh`) outputs:
- `dist/codex-reset-alert-chrome-v0.1.0.zip` (& `dist/chrome/`)
- `dist/codex-reset-alert-firefox-v0.1.0.zip` (& `dist/firefox/`)
- `dist/codex-reset-alert-edge-v0.1.0.zip` (& `dist/edge/`)

## Privacy

The extension stores only local settings, the latest cached public status, event fingerprints, ETag/backoff metadata, and notification source links. It sends no user data to `codex-resets.com`; the only network request is the public status GET.

## Attribution

Reset data is provided by [codex-resets.com](https://codex-resets.com/), as requested by its public API documentation.

## Author

Developed with care by **Ahmed Adli** ([@devahmedadli](https://github.com/devahmedadli/)).

## License

MIT

