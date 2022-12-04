"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FEE_OPTIONS = exports.RECEIPT_DISCRIMINATOR = exports.DISTRIBUTOR_DISCRIMINATOR = exports.DEFAULT_SEN_UTILITY_IDL = exports.DEFAULT_SEN_UTILITY_PROGRAM_ID = exports.DEFAULT_RPC_ENDPOINT = exports.DEFAULT_LE_FLASH_IDL = void 0;
const le_flash_1 = require("../target/types/le_flash");
exports.DEFAULT_LE_FLASH_IDL = le_flash_1.IDL;
const bs58_1 = __importDefault(require("bs58"));
const anchor_1 = require("@project-serum/anchor");
exports.DEFAULT_RPC_ENDPOINT = 'https://api.devnet.solana.com';
exports.DEFAULT_SEN_UTILITY_PROGRAM_ID = '7oyG4wSf2kz2CxTqKTf1uhpPqrw9a8Av1w5t8Uj5PfXb';
exports.DEFAULT_SEN_UTILITY_IDL = le_flash_1.IDL;
exports.DISTRIBUTOR_DISCRIMINATOR = bs58_1.default.encode(anchor_1.BorshAccountsCoder.accountDiscriminator('distributor'));
exports.RECEIPT_DISCRIMINATOR = bs58_1.default.encode(anchor_1.BorshAccountsCoder.accountDiscriminator('receipt'));
const FEE_OPTIONS = (walletAddress = new anchor_1.web3.Keypair().publicKey.toBase58()) => ({
    fee: new anchor_1.BN(0),
    feeCollectorAddress: walletAddress,
});
exports.FEE_OPTIONS = FEE_OPTIONS;
