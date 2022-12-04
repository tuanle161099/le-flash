/// <reference types="node" />
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
/**
 * Validate an hash (must have length 32)
 * @param hash Hash buffer
 * @returns true/false
 */
export declare const isHash: (hash: Buffer | Uint8Array) => boolean;
/**
 * Find the my receipt of an proposal based on canonical bump
 * @param index Receipt index
 * @param proposalPublicKey Proposal public key
 * @param authorityPublicKey Receipt authority public key
 * @param programId Sen Utility program public key
 * @returns Receipt public key
 */
export declare const findReceipt: (salt: Buffer, distributorPublicKey: web3.PublicKey, authorityPublicKey: web3.PublicKey, programId: web3.PublicKey) => Promise<web3.PublicKey>;
