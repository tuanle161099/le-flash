/// <reference types="node" />
import { web3, BN } from '@project-serum/anchor';
export type Leaf = {
    authority: web3.PublicKey;
    chequeAddress: web3.PublicKey;
    startedAt: BN;
    salt: Buffer;
};
export declare const LEAF_LEN = 108;
export declare class MerkleDistributor {
    receipients: Leaf[];
    leafs: Buffer[];
    constructor(receipients?: Leaf[]);
    static sort: (...args: Buffer[]) => Buffer[];
    static serialize: ({ authority, chequeAddress, startedAt, salt, }: Leaf) => Buffer;
    static deserialize: (buf: Buffer) => Leaf;
    /**
     * Get total distributed tokens
     * @returns Total
     */
    getTotal: () => BN;
    static salt: (defaultSeed?: string) => Buffer;
    /**
     * Convert current merkle tree to buffer.
     * @returns Buffer.
     */
    toBuffer: () => Buffer;
    /**
     * Build a merkle distributor instance from merkle tree data buffer.
     * @param buf Merkle tree data buffer.
     * @returns Merkle distributor instance.
     */
    static fromBuffer: (buf: Buffer) => MerkleDistributor;
    private getLeaf;
    private getParent;
    private getSibling;
    private nextLayer;
    /**
     * Get the merkle root.
     * @returns Merkle root.
     */
    deriveMerkleRoot: () => Buffer;
    /**
     * Get merkle proof.
     * @param data Receiptent data.
     * @returns Merkle proof.
     */
    deriveProof: (data: Leaf) => Buffer[];
    /**
     * Verify a merkle proof.
     * @param proof Merkle proof.
     * @param data Receiptent data.
     * @returns Valid.
     */
    verifyProof: (proof: Buffer[], data: Leaf) => boolean;
}
