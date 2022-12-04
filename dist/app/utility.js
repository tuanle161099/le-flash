"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Utility = void 0;
const anchor_1 = require("@project-serum/anchor");
const constant_1 = require("./constant");
const utils_1 = require("./utils");
class Utility {
    constructor(wallet, rpcEndpoint = constant_1.DEFAULT_RPC_ENDPOINT, programId = constant_1.DEFAULT_SEN_UTILITY_PROGRAM_ID) {
        /**
         * Remove listener by its id
         * @param listenerId Listener id
         * @returns
         */
        this.removeListener = (listenerId) => __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.program.removeEventListener(listenerId);
            }
            catch (er) {
                console.warn(er);
            }
        });
        /**
         * Get current Unix Timestamp of Solana Cluster
         * @param getCurrentUnixTimestamp
         * @returns Number (in seconds)
         */
        this.getCurrentUnixTimestamp = () => __awaiter(this, void 0, void 0, function* () {
            const { data: buf } = (yield this.program.provider.connection.getAccountInfo(anchor_1.web3.SYSVAR_CLOCK_PUBKEY)) || {};
            if (!buf)
                throw new Error('Cannot fetch clock data');
            const unixTimestamp = new anchor_1.BN(buf.subarray(32, 40), 'le');
            return unixTimestamp.toNumber();
        });
        /**
         * Parse distributor buffer data.
         * @param data Distributor buffer data.
         * @returns Distributor readable data.
         */
        this.parseDistributorData = (data) => {
            return this.program.coder.accounts.decode('distributor', data);
        };
        /**
         * Get distributor data.
         * @param distributorAddress Distributor address.
         * @returns Distributor readable data.
         */
        this.getDistributorData = (distributorAddress) => __awaiter(this, void 0, void 0, function* () {
            return this.program.account.distributor.fetch(distributorAddress);
        });
        /**
         * Parse receipt buffer data.
         * @param data Receipt buffer data.
         * @returns Receipt readable data.
         */
        this.parseReceiptData = (data) => {
            return this.program.coder.accounts.decode('receipt', data);
        };
        /**
         * Get receipt data.
         * @param receiptAddress Receipt address.
         * @returns Receipt readable data.
         */
        this.getReceiptData = (receiptAddress) => __awaiter(this, void 0, void 0, function* () {
            return this.program.account.receipt.fetch(receiptAddress);
        });
        /**
         * Derive my receipt address by distributor address, and salt.
         * @param salt Buffer.
         * @param distributorAddress Distributor address.
         * @param strict (Optional) if true, a validation process will activate to make sure the receipt is safe.
         * @returns Receipt address.
         */
        this.deriveReceiptAddress = (salt, distributorAddress, strict = false) => __awaiter(this, void 0, void 0, function* () {
            if (salt.length !== 32)
                throw new Error('The salt must has length 32');
            if (!(0, utils_1.isAddress)(distributorAddress))
                throw new Error('Invalid distributor address');
            const receiptPublicKey = yield (0, utils_1.findReceipt)(salt, new anchor_1.web3.PublicKey(distributorAddress), this._provider.wallet.publicKey, this.program.programId);
            const receiptAddress = receiptPublicKey.toBase58();
            if (strict) {
                let onchainAuthorityAddress;
                let onchainDistributorAddress;
                let onchainSalt;
                try {
                    const { authority, distributor, salt } = yield this.getReceiptData(receiptAddress);
                    onchainAuthorityAddress = authority.toBase58();
                    onchainDistributorAddress = distributor.toBase58();
                    onchainSalt = Buffer.from(salt);
                }
                catch (er) {
                    throw new Error(`This receipt ${receiptAddress} is not initialized yet`);
                }
                if (this._provider.wallet.publicKey.toBase58() !== onchainAuthorityAddress)
                    throw new Error('Violated authority address');
                if (distributorAddress !== onchainDistributorAddress)
                    throw new Error('Violated proposal address');
                if (salt.compare(onchainSalt) !== 0)
                    throw new Error('Violated salt');
            }
            return receiptAddress;
        });
        /**
         * Derive treasurer address of a distributor.
         * @param distributorAddress Distributor address.
         * @returns Treasurer address that holds the secure token treasuries of the distributor.
         */
        this.deriveTreasurerAddress = (distributorAddress) => __awaiter(this, void 0, void 0, function* () {
            if (!(0, utils_1.isAddress)(distributorAddress))
                throw new Error('Invalid distributor address');
            const distributorPublicKey = new anchor_1.web3.PublicKey(distributorAddress);
            const [treasurerPublicKey] = yield anchor_1.web3.PublicKey.findProgramAddress([Buffer.from('treasurer'), distributorPublicKey.toBuffer()], this.program.programId);
            return treasurerPublicKey.toBase58();
        });
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
        this.initializeDistributor = ({ tokenAddress, total, merkleRoot, metadata, startedAt = 0, endedAt = 0, distributor = anchor_1.web3.Keypair.generate(), feeOptions = (0, constant_1.FEE_OPTIONS)(this._provider.wallet.publicKey.toBase58()), sendAndConfirm = true, }) => __awaiter(this, void 0, void 0, function* () {
            const { fee, feeCollectorAddress } = feeOptions;
            if (!(0, utils_1.isAddress)(feeCollectorAddress))
                throw new Error('Invalid fee collector address');
            if (!(0, utils_1.isAddress)(tokenAddress))
                throw new Error('Invalid token address');
            if (!(0, utils_1.isHash)(merkleRoot))
                throw new Error('Invalid merkle root');
            if (total.isNeg())
                throw new Error('The total must not be negative');
            if (metadata.length !== 32)
                throw new Error('Invalid metadata path');
            const distributorAddress = distributor.publicKey.toBase58();
            const tokenPublicKey = new anchor_1.web3.PublicKey(tokenAddress);
            const srcPublicKey = yield anchor_1.utils.token.associatedAddress({
                mint: tokenPublicKey,
                owner: this._provider.wallet.publicKey,
            });
            const treasurerAddress = yield this.deriveTreasurerAddress(distributorAddress);
            const treasurerPublicKey = new anchor_1.web3.PublicKey(treasurerAddress);
            const treasuryPublicKey = yield anchor_1.utils.token.associatedAddress({
                mint: tokenPublicKey,
                owner: treasurerPublicKey,
            });
            const builder = yield this.program.methods
                .initializeDistributor([...merkleRoot], total, new anchor_1.BN(endedAt), new anchor_1.BN(startedAt), [...metadata], fee)
                .accounts({
                authority: this._provider.wallet.publicKey,
                distributor: distributor.publicKey,
                src: srcPublicKey,
                treasurer: treasurerPublicKey,
                treasury: treasuryPublicKey,
                feeCollector: new anchor_1.web3.PublicKey(feeCollectorAddress),
                mint: tokenPublicKey,
                tokenProgram: anchor_1.utils.token.TOKEN_PROGRAM_ID,
                associatedTokenProgram: anchor_1.utils.token.ASSOCIATED_PROGRAM_ID,
                systemProgram: anchor_1.web3.SystemProgram.programId,
                rent: anchor_1.web3.SYSVAR_RENT_PUBKEY,
            })
                .signers([distributor]);
            const tx = yield builder.transaction();
            const txId = sendAndConfirm
                ? yield builder.rpc({ commitment: 'confirmed' })
                : '';
            return { tx, txId, distributorAddress };
        });
        /**
         * Claim a distribution.
         * @param distributorAddress The distributor address.
         * @param proof Merkle proof.
         * @param data Receipient data.
         * @param feeOptions (Optional) Protocol fee.
         * @param sendAndConfirm (Optional) Send and confirm the transaction immediately.
         * @returns { tx, txId, dstAddress }
         */
        this.claim = ({ distributorAddress, proof, data, feeOptions = (0, constant_1.FEE_OPTIONS)(this._provider.wallet.publicKey.toBase58()), sendAndConfirm = true, }) => __awaiter(this, void 0, void 0, function* () {
            const { fee, feeCollectorAddress } = feeOptions;
            if (!(0, utils_1.isAddress)(feeCollectorAddress))
                throw new Error('Invalid fee collector address');
            if (!(0, utils_1.isAddress)(distributorAddress))
                throw new Error('Invalid distributor address');
            if (!this._provider.wallet.publicKey.equals(data.authority))
                throw new Error('Invalid athority address');
            const { mint: tokenPublicKey } = yield this.getDistributorData(distributorAddress);
            const receiptAddress = yield this.deriveReceiptAddress(data.salt, distributorAddress);
            const dstPublicKey = yield anchor_1.utils.token.associatedAddress({
                mint: tokenPublicKey,
                owner: this._provider.wallet.publicKey,
            });
            const treasurerAddress = yield this.deriveTreasurerAddress(distributorAddress);
            const treasurerPublicKey = new anchor_1.web3.PublicKey(treasurerAddress);
            const treasuryPublicKey = yield anchor_1.utils.token.associatedAddress({
                mint: tokenPublicKey,
                owner: treasurerPublicKey,
            });
            const builder = yield this.program.methods
                .claim(proof.map((e) => e.toJSON().data), new anchor_1.BN(1), data.startedAt, data.salt.toJSON().data, fee, data.chequeAddress)
                .accounts({
                authority: this._provider.wallet.publicKey,
                distributor: new anchor_1.web3.PublicKey(distributorAddress),
                receipt: new anchor_1.web3.PublicKey(receiptAddress),
                dst: dstPublicKey,
                treasurer: treasurerPublicKey,
                treasury: treasuryPublicKey,
                feeCollector: new anchor_1.web3.PublicKey(feeCollectorAddress),
                mint: tokenPublicKey,
                tokenProgram: anchor_1.utils.token.TOKEN_PROGRAM_ID,
                associatedTokenProgram: anchor_1.utils.token.ASSOCIATED_PROGRAM_ID,
                systemProgram: anchor_1.web3.SystemProgram.programId,
                rent: anchor_1.web3.SYSVAR_RENT_PUBKEY,
            });
            const tx = yield builder.transaction();
            const txId = sendAndConfirm
                ? yield builder.rpc({ commitment: 'confirmed' })
                : '';
            return { tx, txId, dstAddress: dstPublicKey.toBase58() };
        });
        if (!(0, utils_1.isAddress)(programId))
            throw new Error('Invalid program id');
        // Private
        this._connection = new anchor_1.web3.Connection(rpcEndpoint, 'confirmed');
        this._provider = new anchor_1.AnchorProvider(this._connection, wallet, {
            skipPreflight: true,
            commitment: 'confirmed',
        });
        // Public
        this.program = new anchor_1.Program(constant_1.DEFAULT_SEN_UTILITY_IDL, programId, this._provider);
    }
    /**
     * Get list of event names
     */
    get events() {
        return this.program.idl.events.map(({ name }) => name);
    }
}
exports.Utility = Utility;
