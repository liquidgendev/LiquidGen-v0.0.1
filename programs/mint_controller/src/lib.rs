use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::{account_info::{next_account_info, AccountInfo}, entrypoint, entrypoint::ProgramResult, pubkey::Pubkey, msg, program_error::ProgramError, sysvar::{rent::Rent, Sysvar}, program_pack::Pack, program::invoke_signed};
use spl_token::state::Mint;
use spl_token::instruction::mint_to_signed;

#[derive(BorshSerialize, BorshDeserialize, Debug)]
pub struct Config {
    pub admin: Pubkey,
    pub authorized_server: Pubkey,
    pub mint: Pubkey,
    pub cooldown_seconds: u64,
    pub bump: u8,
}

#[derive(BorshSerialize, BorshDeserialize, Debug)]
pub struct WalletState {
    pub last_mint_timestamp: u64,
}

pub enum Instruction {
    Initialize { cooldown_seconds: u64 },
    FaucetMint { amount: u64 },
}

impl Instruction {
    pub fn unpack(input: &[u8]) -> Result<Self, ProgramError> {
        let tag = input.get(0).ok_or(ProgramError::InvalidInstructionData)?;
        match tag {
            0 => {
                let seconds = u64::from_le_bytes(input[1..9].try_into().map_err(|_| ProgramError::InvalidInstructionData)?);
                Ok(Instruction::Initialize { cooldown_seconds: seconds })
            }
            1 => {
                let amount = u64::from_le_bytes(input[1..9].try_into().map_err(|_| ProgramError::InvalidInstructionData)?);
                Ok(Instruction::FaucetMint { amount })
            }
            _ => Err(ProgramError::InvalidInstructionData),
        }
    }
}

entrypoint!(process_instruction);
fn process_instruction(_program_id: &Pubkey, accounts: &[AccountInfo], instruction_data: &[u8]) -> ProgramResult {
    msg!("mint_controller: process instruction");
    let instruction = Instruction::unpack(instruction_data)?;
    let account_info_iter = &mut accounts.iter();

    match instruction {
        Instruction::Initialize { cooldown_seconds } => {
            let admin_acc = next_account_info(account_info_iter)?;
            let config_acc = next_account_info(account_info_iter)?;
            let mint_acc = next_account_info(account_info_iter)?;

            if !admin_acc.is_signer {
                msg!("admin must sign");
                return Err(ProgramError::MissingRequiredSignature);
            }

            let config = Config {
                admin: *admin_acc.key,
                authorized_server: Pubkey::default(),
                mint: *mint_acc.key,
                cooldown_seconds,
            };

            config.serialize(&mut &mut config_acc.data.borrow_mut()[..])?;
            msg!("initialized");
        }

        Instruction::FaucetMint { amount } => {
            let server_acc = next_account_info(account_info_iter)?; // must be signer
            let config_acc = next_account_info(account_info_iter)?;
            let wallet_state_acc = next_account_info(account_info_iter)?;
            let mint_acc = next_account_info(account_info_iter)?;
            let token_program = next_account_info(account_info_iter)?;
            let recipient_token_acc = next_account_info(account_info_iter)?;
            let pda_signer_acc = next_account_info(account_info_iter)?; // PDA account (program-derived)

            if !server_acc.is_signer {
                msg!("server signature required");
                return Err(ProgramError::MissingRequiredSignature);
            }

            let config = Config::try_from_slice(&config_acc.data.borrow())?;

            if server_acc.key != &config.authorized_server {
                msg!("server not authorized");
                return Err(ProgramError::IllegalOwner);
            }

            // check cooldown
            let clock = solana_program::sysvar::clock::Clock::get()?;
            let mut wallet_state = if wallet_state_acc.data_len() == 0 {
                WalletState { last_mint_timestamp: 0 }
            } else {
                WalletState::try_from_slice(&wallet_state_acc.data.borrow())?
            };

            if clock.unix_timestamp as u64 - wallet_state.last_mint_timestamp < config.cooldown_seconds {
                msg!("cooldown not passed");
                return Err(ProgramError::Custom(0));
            }
            // perform CPI mint_to_signed using PDA as signer
            let seeds: &[&[u8]] = &[b"mint-controller", config.mint.as_ref(), &[config.bump]];
            let signer_seeds: &[&[&[u8]]] = &[seeds];

            let ix = mint_to_signed(
                token_program.key,
                &config.mint,
                recipient_token_acc.key,
                &pda_signer_acc.key,
                &[],
                amount,
                Mint::unpack(&mint_acc.data.borrow())?.decimals,
                &[&seeds],
            )?;

            invoke_signed(
                &ix,
                &[mint_acc.clone(), recipient_token_acc.clone(), pda_signer_acc.clone(), token_program.clone()],
                signer_seeds,
            )?;
            wallet_state.last_mint_timestamp = clock.unix_timestamp as u64;
            wallet_state.serialize(&mut &mut wallet_state_acc.data.borrow_mut()[..])?;
            msg!("mint allowed (scaffold)");
        }
    }

    Ok(())
}
