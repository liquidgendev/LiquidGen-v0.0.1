# LiquidGen App

Minimal web application for LiquidGen.

## Requirements
- Node.js (>=16) and npm (or pnpm/yarn)

## Quick start
1. Install dependencies:

```powershell
npm ci
```

2. Run development server (if using CRA/Vite):

```powershell
npm run dev
# or
npm start
```

3. Build for production:

```powershell
npm run build
```

## Deploy
Build output usually lives in `build/` or `dist/`. Deploy that folder to any static host (Netlify, Vercel, GitHub Pages).

## Notes
- This project already contains `package.json`. Adjust scripts as needed.
- Add environment variables to `.env` (do not commit secrets).
