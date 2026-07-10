# Gremlin 👹

A deliberately annoying desktop pet. A small green gremlin lives on top of
everything on your screen. It wanders around, chases your cursor and **sits on
it** (while decoy cursors drift away), screeches, blows raspberries, opens fake
error dialogs, and **multiplies if you ignore it**.

Clicking a gremlin is a catch attempt. It dodges. And here's the joke: every
catch **feeds the escalation** — more gremlins, faster gremlins, better
dodging, more frequent mischief. Level 5 is eight gremlins moving at
420 px/s. Winning is how you lose.

Everything else on your screen keeps working normally — clicks pass straight
through the overlay except on a gremlin (or one of its fake popups).

## The important part: how to make it stop

- **Panic key: `Cmd+Shift+X` (mac) / `Ctrl+Shift+X` (windows)** — instant hard exit.
- **Tray icon** (menu bar on mac, system tray on windows): Pause, Mute, Reset, Quit.
- The Windows version is portable — delete the exe and it never existed.

## Installing (for the friend who just received this)

This app is unsigned (it's a prank project, not a corporation), so your OS
will act suspicious. It's right to. Here's how to run it anyway:

### macOS (`Gremlin-x.y.z-universal-mac.zip`)
1. Unzip, drag `Gremlin.app` anywhere (Applications, Desktop, whatever).
2. Open it. macOS will refuse.
3. **macOS 15 (Sequoia) or newer:** System Settings → Privacy & Security →
   scroll down → **"Open Anyway"** next to the Gremlin message. Then open it again.
   **macOS 14 or older:** right-click the app → Open → Open.
4. Terminal alternative that skips all of that:
   ```sh
   xattr -dr com.apple.quarantine /path/to/Gremlin.app
   ```

### Windows (`Gremlin-x.y.z-portable.exe`)
1. Run the exe. SmartScreen: "Windows protected your PC".
2. Click **More info → Run anyway**.

No installer, no admin rights, nothing written outside the app itself.

## Dev

```sh
npm install
npm start          # run it
npm run dev        # run with detached devtools
npm test           # unit tests (pure game logic, node --test)
npm run test:e2e   # launches the real app, verifies overlay mechanics
npm run dist       # build mac universal zip + windows portable exe
```

Flags: `--no-gpu` if the overlay renders black on your machine (rare driver
issue), `--debug` for devtools.

Everything is procedural — the gremlin is inline SVG, every screech is
synthesized WebAudio (volume-capped and compressed; annoying, never harmful).
There are no image or audio assets, no runtime dependencies, and no network
access. The whole game state machine is unit-tested; the overlay window
mechanics (transparency, click-through, the never-block-the-screen safety net,
the panic exit) are covered by a Playwright e2e that drives the real app.

Both artifacts build from a Mac (`npm run dist`). If the Windows cross-build
ever breaks, a trivial GitHub Actions matrix (macos-latest + windows-latest,
`npm ci && npx electron-builder`) is the fallback.

## Architecture, briefly

- `src/main/` — Electron main process. The overlay window (transparent,
  frameless, always-on-top, click-through with `forward: true` mousemove
  delivery), and `clickthrough.js`: main owns the ignore-mouse state and runs a
  100 ms cursor poll as a safety net so a dodging gremlin can never leave the
  window click-blocking your screen.
- `src/renderer/` — the game. Pure-logic core (FSM, behaviors, director,
  spawner, sound recipes — all injected rng/clock, all unit-tested) with thin
  DOM/WebAudio adapters.
- `src/shared/` — the click-through decision function, shared by main and tests.

Made with Claude Code as a TDD exercise in professional-grade gremlin engineering.
