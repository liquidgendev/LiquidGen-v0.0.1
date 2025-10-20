import { PublicKey } from '@solana/web3.js';

export interface WalletError extends Error {
  code?: number;
  data?: unknown;
}

export class InvalidAddressError extends Error implements WalletError {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidAddressError';
  }
}

export class WalletConnectionError extends Error implements WalletError {
  constructor(message: string, public code?: number) {
    super(message);
    this.name = 'WalletConnectionError';
  }
}

export const validateSolanaAddress = (address: string): PublicKey => {
  try {
    return new PublicKey(address);
  } catch (error) {
    throw new InvalidAddressError('Invalid Solana address provided');
  }
};

export const isValidAmount = (amount: number): boolean => {
  return amount > 0 && amount <= 1000 && Number.isFinite(amount);
};

export const sanitizeAmount = (amount: number): number => {
  return Math.min(Math.max(0, amount), 1000);
};