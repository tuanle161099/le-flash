import { web3, Program, Address, AnchorProvider, BN } from '@project-serum/anchor';
import { Transaction } from '@solana/web3.js';
import { LeFlash } from '../target/types/le_flash';
import { ChequeData, PoolData } from './types';
declare class LeFlashProgram {
    readonly _provider: AnchorProvider;
    readonly program: Program<LeFlash>;
    constructor(provider: AnchorProvider, programId: string);
    deriveTreasurerAddress: (poolAddress: Address) => Promise<string>;
    /**
     * Derive my cheque address by proposal address and receipt's index.
     * @param proposalAddress Proposal address.
     * @param strict (Optional) if true, a validation process will activate to make sure the cheque is safe.
     * @returns cheque address.
     */
    deriveChequeAddress: (poolAddress: string, strict?: boolean) => Promise<string>;
    /**
     * Get pool data.
     * @param poolAddress Pool address.
     * @returns Pool readable data.
     */
    getPoolData: (poolAddress: Address) => Promise<PoolData>;
    /**
     * Get pool data.
     * @param chequeAddress Receipt address.
     * @returns Pool readable data.
     */
    getChequeData: (chequeAddress: Address) => Promise<ChequeData>;
    fetchCheques: () => Promise<any>;
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
    deposit: ({ recipient, poolAddress, sendAndConfirm, mintNFTAddress, chequeKeypair, }: {
        recipient?: string | undefined;
        poolAddress: string;
        sendAndConfirm?: boolean | undefined;
        mintNFTAddress: string;
        chequeKeypair?: web3.Keypair | undefined;
    }) => Promise<{
        txId: string;
        tx: web3.Transaction;
        chequeAddress: string;
    }>;
    withdraw: ({ amount, poolAddress, sendAndConfirm, }: {
        amount: BN;
        poolAddress: Address;
        sendAndConfirm?: boolean | undefined;
    }) => Promise<{
        txId: string;
        tx: web3.Transaction;
    }>;
    withdrawNFT: ({ chequeAddress, sendAndConfirm, }: {
        chequeAddress: Address;
        sendAndConfirm?: boolean | undefined;
    }) => Promise<{
        txId: string;
        tx: web3.Transaction;
    }>;
    closeCheque: ({ chequeAddress, sendAndConfirm, }: {
        chequeAddress: string;
        sendAndConfirm?: boolean | undefined;
    }) => Promise<{
        txId: string;
        tx: web3.Transaction;
    }>;
}
export default LeFlashProgram;
