# LiquidGen Server (Faucet)

This is a small Rust-based faucet server that mints an SPL token on Devnet.

Setup

1. Ensure Rust is installed (rustup + toolchain).
2. Generate or place your mint authority keypair at `./mint-authority.json` (Solana CLI `solana-keygen new --outfile mint-authority.json`).
3. Set environment variables (optional):

- `RPC_URL` (default: https://api.devnet.solana.com)
- `LQ_MINT_ADDRESS` (the SPL token mint pubkey)
- `MINT_KEYPAIR` (path to the mint authority keypair file, default `./mint-authority.json`)

Run

Build and run:

```powershell
cd liquidgen-server
cargo run --release
```

The server will listen on http://127.0.0.1:4000 and expose POST /api/faucet with JSON `{ "address": "<recipient>", "amount": 100 }`.

Security

This server stores the mint authority in a local file. For production, keep the key in a secure KMS or hardware signer.
