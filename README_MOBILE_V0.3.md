# TARDIS Talk mobile responsive update v0.3

This build keeps the desktop layout intact and adds a dedicated mobile experience for screens under 768px.

## Mobile changes

- Mobile status bar: current time, TARDIS state, active character status.
- Center TARDIS core remains the visual focus.
- Horizontal sliding contact rail for core contacts, ordinary anchors, and unlocked contacts.
- Bottom dock: 通讯录 / 事件 / 记忆 / 设置.
- Full-screen incoming call UI with avatar, caller identity, location, crisis text, answer/decline buttons, and swipe support.
- Full-screen in-call UI with large avatar, waveform animation, crisis panel, language label, subtitles panel, caption mode toggle, and fixed call controls.
- Contact page groups core contacts, ordinary anchors, and unlocked contacts, with search and long-press favorite support.
- Ordinary anchors remain limited to three ordinary-person slots.
- Mobile particle count is reduced by 50% to reduce GPU pressure.
- iPhone safe-area support via env(safe-area-inset-bottom/top).

## Run

```bash
npm install
npm run dev
```

Or on Windows, double-click `start-dev-windows.bat`.
