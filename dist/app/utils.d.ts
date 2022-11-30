import { Address, AnchorProvider, web3 } from '@project-serum/anchor';
import { PublicKey } from '@solana/web3.js';
import { WalletInterface } from './rawWallet';
/**
 * Validate an address
 * @param address Base58 string
 * @returns true/false
 */
export declare const isAddress: (address?: Address) => address is Address;
export declare const getAnchorProvider: (node: string, walletAddress: string, wallet: WalletInterface) => AnchorProvider;
/**
 * Find the NFT metadata address
 * @param nftAddress public key
 * @returns NFT metadata public key
 */
export declare const findNftMetadataAddress: (nftAddress: web3.PublicKey) => Promise<web3.PublicKey>;
