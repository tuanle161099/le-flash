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
exports.findReceipt = exports.isHash = exports.findNftMetadataAddress = exports.getAnchorProvider = exports.isAddress = void 0;
const anchor_1 = require("@project-serum/anchor");
const web3_js_1 = require("@solana/web3.js");
const js_1 = require("@metaplex/js");
/**
 * Validate an address
 * @param address Base58 string
 * @returns true/false
 */
const isAddress = (address) => {
    if (!address)
        return false;
    try {
        const publicKey = new anchor_1.web3.PublicKey(address);
        if (!publicKey)
            throw new Error('Invalid public key');
        return true;
    }
    catch (er) {
        return false;
    }
};
exports.isAddress = isAddress;
const getAnchorProvider = (node, walletAddress, wallet) => {
    const connection = new web3_js_1.Connection(node, 'confirmed');
    const signAllTransactions = (transactions) => __awaiter(void 0, void 0, void 0, function* () {
        const signedTransactions = [];
        for (const transaction of transactions) {
            const signedTransaction = yield wallet.signTransaction(transaction);
            signedTransactions.push(signedTransaction);
        }
        return signedTransactions;
    });
    const publicKey = new web3_js_1.PublicKey(walletAddress);
    return new anchor_1.AnchorProvider(connection, {
        publicKey: new web3_js_1.PublicKey(publicKey),
        signTransaction: wallet.signTransaction,
        signAllTransactions,
    }, {
        commitment: 'confirmed',
        skipPreflight: true,
    });
};
exports.getAnchorProvider = getAnchorProvider;
/**
 * Find the NFT metadata address
 * @param nftAddress public key
 * @returns NFT metadata public key
 */
const findNftMetadataAddress = (nftAddress) => __awaiter(void 0, void 0, void 0, function* () {
    const metadataPDA = yield js_1.programs.metadata.Metadata.getPDA(new anchor_1.web3.PublicKey(nftAddress));
    return metadataPDA;
});
exports.findNftMetadataAddress = findNftMetadataAddress;
/**
 * Validate an hash (must have length 32)
 * @param hash Hash buffer
 * @returns true/false
 */
const isHash = (hash) => {
    if (!hash || hash.length !== 32)
        return false;
    return true;
};
exports.isHash = isHash;
/**
 * Find the my receipt of an proposal based on canonical bump
 * @param index Receipt index
 * @param proposalPublicKey Proposal public key
 * @param authorityPublicKey Receipt authority public key
 * @param programId Sen Utility program public key
 * @returns Receipt public key
 */
const findReceipt = (salt, distributorPublicKey, authorityPublicKey, programId) => __awaiter(void 0, void 0, void 0, function* () {
    const [receiptPublicKey] = yield anchor_1.web3.PublicKey.findProgramAddress([
        Buffer.from('receipt'),
        salt,
        distributorPublicKey.toBuffer(),
        authorityPublicKey.toBuffer(),
    ], programId);
    return receiptPublicKey;
});
exports.findReceipt = findReceipt;
