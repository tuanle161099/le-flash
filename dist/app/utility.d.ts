/// <reference types="node" />
import { web3, Program, BN } from '@project-serum/anchor';
import { LeFlash } from '../target/types/le_flash';
import { Leaf } from './merkleDistributor';
import { AnchorWallet, DistributorData, ReceiptData, FeeOptions } from './types';
export declare class Utility {
    private _connection;
    private _provider;
    readonly program: Program<LeFlash>;
    constructor(wallet: AnchorWallet, rpcEndpoint?: string, programId?: string);
    /**
     * Get list of event names
     */
    get events(): ("CloseChequeEvent" | "DepositEvent" | "InitializePoolEvent" | "ClaimEvent" | "InitializeDistributorEvent" | "RevokeEvent" | "WithdrawNFTEvent" | "WithdrawEvent")[];
    /**
     * Remove listener by its id
     * @param listenerId Listener id
     * @returns
     */
    removeListener: (listenerId: number) => Promise<void>;
    /**
     * Get current Unix Timestamp of Solana Cluster
     * @param getCurrentUnixTimestamp
     * @returns Number (in seconds)
     */
    getCurrentUnixTimestamp: () => Promise<number>;
    /**
     * Parse distributor buffer data.
     * @param data Distributor buffer data.
     * @returns Distributor readable data.
     */
    parseDistributorData: (data: Buffer) => DistributorData;
    /**
     * Get distributor data.
     * @param distributorAddress Distributor address.
     * @returns Distributor readable data.
     */
    getDistributorData: (distributorAddress: string) => Promise<DistributorData>;
    /**
     * Parse receipt buffer data.
     * @param data Receipt buffer data.
     * @returns Receipt readable data.
     */
    parseReceiptData: (data: Buffer) => ReceiptData;
    /**
     * Get receipt data.
     * @param receiptAddress Receipt address.
     * @returns Receipt readable data.
     */
    getReceiptData: (receiptAddress: string) => Promise<ReceiptData>;
    /**
     * Derive my receipt address by distributor address, and salt.
     * @param salt Buffer.
     * @param distributorAddress Distributor address.
     * @param strict (Optional) if true, a validation process will activate to make sure the receipt is safe.
     * @returns Receipt address.
     */
    deriveReceiptAddress: (salt: Buffer, distributorAddress: string, strict?: boolean) => Promise<string>;
    /**
     * Derive treasurer address of a distributor.
     * @param distributorAddress Distributor address.
     * @returns Treasurer address that holds the secure token treasuries of the distributor.
     */
    deriveTreasurerAddress: (distributorAddress: string) => Promise<string>;
    /**
     * Initialize a merkle distributor.
     * @param tokenAddress Distributed token address.
     * @param total The total number of tokens that will be distributed out to the community.
     * @param merkleRoot Root of the merkle tree.
     * @param metadata The representation that link to the recipient data. For example: CID on IPFS.
     * @param endedAt (Optional) (In seconds) Due date for the distributor, after that the distributor owner can revoke the remaining tokens. Default: 0 - no due date.
     * @param distributor (Optional) The distributor keypair. If it's not provided, a new one will be auto generated.
     * @param feeOptions (Optional) Protocol fee.
     * @param sendAndConfirm (Optional) Send and confirm the transaction immediately.
     * @returns { tx, txId, distributorAddress }
     */
    initializeDistributor: ({ tokenAddress, total, merkleRoot, metadata, startedAt, endedAt, distributor, feeOptions, sendAndConfirm, }: {
        tokenAddress: string;
        total: BN;
        merkleRoot: Buffer | Uint8Array;
        metadata: Buffer | Uint8Array;
        startedAt?: number | undefined;
        endedAt?: number | undefined;
        distributor?: web3.Keypair | undefined;
        feeOptions?: FeeOptions | undefined;
        sendAndConfirm?: boolean | undefined;
    }) => Promise<{
        tx: web3.Transaction;
        txId: string;
        distributorAddress: string;
    }>;
    /**
     * Claim a distribution.
     * @param distributorAddress The distributor address.
     * @param proof Merkle proof.
     * @param data Receipient data.
     * @param feeOptions (Optional) Protocol fee.
     * @param sendAndConfirm (Optional) Send and confirm the transaction immediately.
     * @returns { tx, txId, dstAddress }
     */
    claim: ({ distributorAddress, proof, data, feeOptions, sendAndConfirm, }: {
        distributorAddress: string;
        proof: Array<Buffer>;
        data: Leaf;
        feeOptions?: FeeOptions | undefined;
        sendAndConfirm?: boolean | undefined;
    }) => Promise<{
        tx: web3.Transaction;
        txId: string;
        dstAddress: string;
    }>;
}
