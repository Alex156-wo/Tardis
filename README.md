# TARDIS Talk

A browser-based TARDIS-style voice call roleplay prototype.

## Current build

This version is designed as a BYOK (Bring Your Own Key) front-end app:

- The site does **not** include the developer's Gemini API key.
- Each user enters their own Gemini API key in the Identity Matrix.
- The key is stored only in that user's browser `localStorage`.
- Vercel only hosts the static site.

## New in this version

- The bottom controls have been reorganized into a cleaner TARDIS Directory.
- Core contacts are grouped together: The Doctor, River Song, Missy.
- Users can create up to three ordinary personal contacts / anchors.
- Personal anchors are restricted to ordinary family/friend-style roles, not aliens, officials, secret agents, or Time Lords.
- Random incoming callers are logged.
- After a random caller has been answered three times, their contact route is unlocked in the directory.
- Existing TARDIS background, particle visualizer, ghost TARDIS, avatar editor, image sending, and mini-game remain.

## Local development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

The build output goes to `dist/`.
