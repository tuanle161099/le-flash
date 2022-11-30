"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
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
const anchor_1 = require("@project-serum/anchor");
const web3_js_1 = require("@solana/web3.js");
const token_1 = require("@project-serum/anchor/dist/cjs/utils/token");
const constant_1 = require("./constant");
const utils_1 = require("./utils");
const PROGRAMS = {
    rent: anchor_1.web3.SYSVAR_RENT_PUBKEY,
    systemProgram: anchor_1.web3.SystemProgram.programId,
    associatedTokenProgram: anchor_1.utils.token.ASSOCIATED_PROGRAM_ID,
    tokenProgram: token_1.TOKEN_PROGRAM_ID,
};
class LeFlashProgram {
    constructor(provider, programId) {
        this.deriveTreasurerAddress = (poolAddress) => __awaiter(this, void 0, void 0, function* () {
            if (typeof poolAddress !== 'string')
                poolAddress = poolAddress.toBase58();
            if (!(0, utils_1.isAddress)(poolAddress))
                throw new Error('Invalid pool address');
            const poolPublicKey = new anchor_1.web3.PublicKey(poolAddress);
            const [treasurerPublicKey] = yield anchor_1.web3.PublicKey.findProgramAddress([Buffer.from('treasurer'), poolPublicKey.toBuffer()], this.program.programId);
            return treasurerPublicKey.toBase58();
        });
        /**
         * Get pool data.
         * @param poolAddress Pool address.
         * @returns Pool readable data.
         */
        this.getPoolData = (poolAddress) => __awaiter(this, void 0, void 0, function* () {
            return this.program.account.pool.fetch(poolAddress);
        });
        this.requestUnits = (tx, addCompute) => {
            return tx.add(web3_js_1.ComputeBudgetProgram.requestUnits({
                units: addCompute,
                additionalFee: 0,
            }));
        };
        this.initializePool = ({ pool = anchor_1.web3.Keypair.generate(), mintLpt = anchor_1.web3.Keypair.generate(), sendAndConfirm = false, mint, }) => __awaiter(this, void 0, void 0, function* () {
            const newPool = pool;
            const poolAddress = newPool.publicKey.toBase58();
            const treasurer = yield this.deriveTreasurerAddress(poolAddress);
            const tokenAccountLpt = yield anchor_1.utils.token.associatedAddress({
                mint: new anchor_1.web3.PublicKey(mintLpt.publicKey),
                owner: new anchor_1.web3.PublicKey(this._provider.wallet.publicKey),
            });
            const treasury = yield anchor_1.utils.token.associatedAddress({
                mint: new anchor_1.web3.PublicKey(mint),
                owner: new anchor_1.web3.PublicKey(treasurer),
            });
            const tx = yield this.program.methods
                .initializePool(mint, treasury)
                .accounts(Object.assign({ associatedTokenAccountLpt: tokenAccountLpt, authority: this._provider.wallet.publicKey, mintLpt: mintLpt.publicKey, pool: poolAddress, treasurer }, PROGRAMS))
                .transaction();
            let txId = '';
            if (sendAndConfirm) {
                txId = yield this._provider.sendAndConfirm(tx, [newPool, mintLpt]);
            }
            return { txId, poolAddress: newPool.publicKey.toBase58(), tx };
        });
        this.deposit = ({ amount, poolAddress, sendAndConfirm = true, }) => __awaiter(this, void 0, void 0, function* () {
            const { mint, mintLpt } = yield this.getPoolData(poolAddress);
            const treasurer = yield this.deriveTreasurerAddress(poolAddress);
            const metadataAddress = yield (0, utils_1.findNftMetadataAddress)(new anchor_1.web3.PublicKey(mint));
            const metadataPublicKey = metadataAddress.toBase58();
            const tokenAccountLpt = yield anchor_1.utils.token.associatedAddress({
                mint: mintLpt,
                owner: new anchor_1.web3.PublicKey(this._provider.wallet.publicKey),
            });
            const srcAssociatedTokenAccount = yield anchor_1.utils.token.associatedAddress({
                mint,
                owner: new anchor_1.web3.PublicKey(this._provider.wallet.publicKey),
            });
            const treasury = yield anchor_1.utils.token.associatedAddress({
                mint: new anchor_1.web3.PublicKey(mint),
                owner: new anchor_1.web3.PublicKey(treasurer),
            });
            let tx = yield this.program.methods
                .deposit(amount)
                .accounts(Object.assign({ authority: this._provider.wallet.publicKey, pool: poolAddress, associatedTokenAccountLpt: tokenAccountLpt, mint,
                mintLpt,
                srcAssociatedTokenAccount,
                treasurer,
                treasury, metadata: metadataPublicKey }, PROGRAMS))
                .transaction();
            let txId = '';
            if (sendAndConfirm) {
                txId = yield this._provider.sendAndConfirm(tx, []);
            }
            return { txId, tx };
        });
        this.withdraw = ({ amount, poolAddress, sendAndConfirm = true, }) => __awaiter(this, void 0, void 0, function* () {
            const { mint, mintLpt } = yield this.getPoolData(poolAddress);
            const treasurer = yield this.deriveTreasurerAddress(poolAddress);
            const metadataAddress = yield (0, utils_1.findNftMetadataAddress)(new anchor_1.web3.PublicKey(mint));
            const metadataPublicKey = metadataAddress.toBase58();
            const tokenAccountLpt = yield anchor_1.utils.token.associatedAddress({
                mint: mintLpt,
                owner: new anchor_1.web3.PublicKey(this._provider.wallet.publicKey),
            });
            const dstAssociatedTokenAccount = yield anchor_1.utils.token.associatedAddress({
                mint,
                owner: new anchor_1.web3.PublicKey(this._provider.wallet.publicKey),
            });
            const treasury = yield anchor_1.utils.token.associatedAddress({
                mint: new anchor_1.web3.PublicKey(mint),
                owner: new anchor_1.web3.PublicKey(treasurer),
            });
            let tx = yield this.program.methods
                .withdraw(amount)
                .accounts(Object.assign({ authority: this._provider.wallet.publicKey, pool: poolAddress, associatedTokenAccountLpt: tokenAccountLpt, mint,
                mintLpt,
                dstAssociatedTokenAccount,
                treasurer,
                treasury, metadata: metadataPublicKey }, PROGRAMS))
                .transaction();
            let txId = '';
            if (sendAndConfirm) {
                txId = yield this._provider.sendAndConfirm(tx, []);
            }
            return { txId, tx };
        });
        if (!(0, utils_1.isAddress)(programId))
            throw new Error('Invalid program id');
        // Private
        this._provider = provider;
        // Public
        this.program = new anchor_1.Program(constant_1.DEFAULT_LE_FLASH_IDL, programId, this._provider);
    }
}
__exportStar(require("../target/types/le_flash"), exports);
__exportStar(require("./constant"), exports);
__exportStar(require("./utils"), exports);
exports.default = LeFlashProgram;
