# LiquidGen (Devnet prototype)

This repository contains a single-file React landing page and wallet-enabled prototype for a Solana dApp (devnet). It uses the Solana Wallet Adapter and a simple faucet flow for minting test $LQ on devnet (server-side faucet required).

What I added:
- `package.json` with recommended dependencies and Vite dev tooling
- Import of `@solana/wallet-adapter-react-ui/styles.css` in `index.jsx`
- `.gitignore` and Windows PowerShell install instructions

Quick start (Windows PowerShell):

1) Install Node.js (if not already installed)

- Download and install from https://nodejs.org/en/download/ (Recommended: LTS)
- Or use winget (Windows 10/11):

```powershell
winget install OpenJS.NodeJS.LTS -s msstore
```

2) Install dependencies

```powershell
cd "C:\Users\Caleb\Documents\LiquidGen v0.0.1"
npm install
```

3) Run dev server

```powershell
npm run dev
```

Notes:
- Replace `LQ_MINT_ADDRESS` in `index.jsx` with your SPL token mint address deployed to devnet.
- Implement a secure server-side faucet at `/api/faucet` to mint tokens (the frontend expects a JSON response with `tx` or `signature`).
- This project uses Vite and the React plugin; if you prefer Create React App or Next.js I can adapt the project structure.

Next steps I can take for you:
- Scaffold a minimal Vite app wrapper (index.html + main.jsx) and move `index.jsx` into `src/` if you want a proper React entrypoint.
- Create a tiny Express/Rust server example for `/api/faucet` (Rust example already included in comments).
- Add TypeScript support and ESLint/Prettier configuration.
