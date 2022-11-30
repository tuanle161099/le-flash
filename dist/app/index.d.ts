import { web3, Program, Address, AnchorProvider, BN, IdlAccounts } from '@project-serum/anchor';
import { Transaction } from '@solana/web3.js';
import { LeFlash } from '../target/types/le_flash';
export type PoolData = IdlAccounts<LeFlash>['pool'];
declare class LeFlashProgram {
    private _provider;
    readonly program: Program<LeFlash>;
    constructor(provider: AnchorProvider, programId: string);
    deriveTreasurerAddress: (poolAddress: Address) => Promise<string>;
    /**
     * Get pool data.
     * @param poolAddress Pool address.
     * @returns Pool readable data.
     */
    getPoolData: (poolAddress: Address) => Promise<PoolData>;
    requestUnits: (tx: web3.Transaction, addCompute: number) => Transaction;
    initializePool: ({ pool, mintLpt, sendAndConfirm, mint, }: {
        pool?: web3.Keypair | undefined;
        mintLpt?: web3.Keypair | undefined;
        sendAndConfirm?: boolean | undefined;
        mint: web3.PublicKey;
    }) => Promise<{
        txId: string;
        poolAddress: string;
        tx: web3.Transaction;
    }>;
    deposit: ({ amount, poolAddress, sendAndConfirm, mintNFTAddress, }: {
        amount: BN;
        poolAddress: Address;
        sendAndConfirm?: boolean | undefined;
        mintNFTAddress: string;
    }) => Promise<{
        txId: string;
        tx: web3.Transaction;
    }>;
    withdraw: ({ amount, poolAddress, sendAndConfirm, }: {
        amount: BN;
        poolAddress: Address;
        sendAndConfirm?: boolean | undefined;
    }) => Promise<{
        txId: string;
        tx: web3.Transaction;
    }>;
}
export * from '../target/types/le_flash';
export * from './constant';
export * from './utils';
export default LeFlashProgram;
