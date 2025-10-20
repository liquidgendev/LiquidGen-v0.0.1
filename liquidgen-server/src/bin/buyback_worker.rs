use solana_client::rpc_client::RpcClient;
use solana_sdk::pubkey::Pubkey;
use serde::{Deserialize, Serialize};
use std::fs::File;
use std::io::Write;
use tracing::{info, warn, error};

#[derive(Serialize, Deserialize)]
struct SwapPlan {
    treasury_account: String,
    treasury_balance: String,
    threshold: u64,
    target_mint: String,
    note: String,
}

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt::init();

    let rpc_url = std::env::var("RPC_URL").unwrap_or_else(|_| "https://api.devnet.solana.com".to_string());
    let treasury_account = match std::env::var("TREASURY_TOKEN_ACCOUNT") {
        Ok(v) => v,
        Err(_) => {
            error!("TREASURY_TOKEN_ACCOUNT environment variable is required for the buyback worker (token account pubkey)");
            return;
        }
    };
    let threshold: u64 = std::env::var("SWAP_THRESHOLD_LAMPORTS").ok().and_then(|s| s.parse().ok()).unwrap_or(1_000_000);
    let target_mint = std::env::var("LQ_MINT_ADDRESS").unwrap_or_else(|_| "<LQ_MINT>".to_string());
    let plan_path = std::env::var("BUYBACK_PLAN_PATH").unwrap_or_else(|_| "./buyback-plan.json".to_string());

    info!(%rpc_url, %treasury_account, threshold, %target_mint, "starting buyback worker");

    let rpc = RpcClient::new(rpc_url);

    let treasury_pubkey = match treasury_account.parse::<Pubkey>() {
        Ok(p) => p,
        Err(e) => {
            error!(%e, "invalid TREASURY_TOKEN_ACCOUNT pubkey");
            return;
        }
    };

    // Fetch token account balance (UiTokenAmount -> amount as string)
    match rpc.get_token_account_balance(&treasury_pubkey) {
        Ok(balance) => {
            info!(amount = %balance.amount, decimals = balance.decimals, "treasury token balance fetched");
            // convert amount string to u64
            if let Ok(amount_u64) = balance.amount.parse::<u64>() {
                if amount_u64 >= threshold {
                    info!(amount = amount_u64, "threshold reached: preparing swap plan");
                    let plan = SwapPlan {
                        treasury_account: treasury_account.clone(),
                        treasury_balance: balance.amount.clone(),
                        threshold,
                        target_mint: target_mint.clone(),
                        note: "Swap execution is disabled by default in this prototype. Provide pool info and enable SWAP_ENABLED=true to perform on-chain swaps.".to_string(),
                    };

                    match File::create(&plan_path) {
                        Ok(mut f) => {
                            if let Ok(json) = serde_json::to_string_pretty(&plan) {
                                if let Err(e) = f.write_all(json.as_bytes()) {
                                    error!(%e, "failed to write swap plan file");
                                } else {
                                    info!(%path = %plan_path, "swap plan written");
                                }
                            } else {
                                error!("failed to serialize swap plan");
                            }
                        }
                        Err(e) => error!(%e, "failed to create plan file"),
                    }
                } else {
                    info!(amount = amount_u64, threshold, "balance below threshold; nothing to do");
                }
            } else {
                warn!(amount = %balance.amount, "could not parse token amount to integer");
            }
        }
        Err(e) => {
            error!(%e, "failed to fetch treasury token account balance");
        }
    }
}
