# Mint Controller Program (scaffold)

This is a minimal scaffold for a Solana program that can be the mint authority (PDA) for an SPL token and enforce simple rules (per-wallet cooldown, authorized server). It's intentionally minimal and must be expanded and audited before production use.

Quick steps (devnet):

1. Build and deploy the program to devnet (`solana program deploy --url https://api.devnet.solana.com target/deploy/mint_controller.so`).
2. Initialize the config account with `Initialize` (client needs to create and allocate config account).
3. Transfer mint authority of your token to the program PDA:

   spl-token authorize <MINT_PUBKEY> mint <PROGRAM_PDA> --owner owner.json --url https://api.devnet.solana.com

4. The faucet server will then call the program's `FaucetMint` instruction to request minting. The program must perform a CPI into the token program to mint using the PDA as signer.

This scaffold intentionally leaves out the CPI mint implementation and account sizing checks. Implementers should:
- Implement PDA derivation and mint_to_signed CPI
- Add account size checks and rent exemption logic
- Add admin multisig controls for config updates
- Add tests and an external audit

PDA derivation and accounts
---------------------------
This implementation expects the PDA to be derived with the seed `[b"mint-controller", mint_pubkey, &[bump]]`. When initializing the config, compute the PDA and store the bump value in the `Config` account. The FaucetMint instruction expects the following accounts (in order):

1. server_signer (must sign) — authorized server keypair
2. config_account
3. wallet_state_account (PDA per-user or seeded by recipient)
4. mint_account (SPL token mint)
5. token_program
6. recipient_token_account (the token account to mint to)
7. pda_signer_account (the PDA account that is set as mint authority)

The program will call `mint_to_signed` using the PDA seeds and bump to sign.

Please review the code carefully and add tests before deploying to any public network.

