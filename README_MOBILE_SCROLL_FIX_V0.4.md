# Mobile Scroll Fix v0.4

This build fixes the iPhone Safari mobile experience where the page could feel locked and unable to scroll.

## Fixed

- Removed the mobile `overflow: hidden` lock from `html`, `body`, `#root`, and the app shell.
- Changed the mobile layout from a fixed-height inner scroller to a page-level scroll model.
- Kept the mobile status bar and bottom Dock fixed while allowing content to scroll underneath.
- Added safe bottom spacing for iPhone home indicator / Safari toolbar.
- Made incoming-call and active-call screens independently scrollable when content is taller than the viewport.
- Improved horizontal contact rail touch behavior.
- Long-press favorite no longer accidentally triggers calls while the user is scrolling.

## Run

```bash
npm install
npm run dev
```

Or on Windows, double click:

```text
start-dev-windows.bat
```
