use solana_program::pubkey::Pubkey;

fn main() {
    let mint_pubkey = std::env::args().nth(1).expect("mint pubkey");
    let mint = mint_pubkey.parse::<Pubkey>().expect("invalid pubkey");
    let (pda, bump) = Pubkey::find_program_address(&[b"mint-controller", mint.as_ref()], &"ReplaceWithProgramId".parse().unwrap());
    println!("PDA: {}\nBump: {}", pda, bump);
    println!("Then run: spl-token authorize {} mint {} --owner owner.json --url https://api.devnet.solana.com", mint, pda);
}
