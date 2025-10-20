import { Connection, PublicKey } from '@solana/web3.js';
import { getAssociatedTokenAddress } from '@solana/spl-token';
import { validateSolanaAddress, isValidAmount } from '../utils/validation';

export interface FaucetResponse {
  tx?: string;
  signature?: string;
  error?: string;
}

export class FaucetService {
  private static instance: FaucetService;
  private readonly endpoint: string;

  private constructor(endpoint: string) {
    this.endpoint = endpoint;
  }

  public static getInstance(endpoint: string): FaucetService {
    if (!FaucetService.instance) {
      FaucetService.instance = new FaucetService(endpoint);
    }
    return FaucetService.instance;
  }

  public async requestAirdrop(
    wallet: string,
    amount: number,
    abortSignal?: AbortSignal
  ): Promise<FaucetResponse> {
    try {
      // Validate inputs
      validateSolanaAddress(wallet);
      if (!isValidAmount(amount)) {
        throw new Error('Invalid amount requested');
      }

      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ wallet, amount }),
        signal: abortSignal,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Faucet request failed');
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Unknown error occurred');
    }
  }

  public async getTokenBalance(
    connection: Connection,
    walletPublicKey: PublicKey,
    mintAddress: string
  ): Promise<number> {
    try {
      const mint = validateSolanaAddress(mintAddress);
      const ata = await getAssociatedTokenAddress(mint, walletPublicKey);
      
      const account = await connection.getAccountInfo(ata);
      if (!account) {
        return 0;
      }

      const resp = await connection.getTokenAccountsByOwner(walletPublicKey, { mint });
      if (resp.value.length === 0) {
        return 0;
      }

      const accPub = resp.value[0].pubkey;
      const balResp = await connection.getTokenAccountBalance(accPub);
      return Number(balResp.value.uiAmount || 0);
    } catch (error) {
      console.error('Error fetching balance:', error);
      throw error;
    }
  }
}