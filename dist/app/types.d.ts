import { IdlAccounts, Idl, BN } from '@project-serum/anchor';
import { IdlEvent } from '@project-serum/anchor/dist/cjs/idl';
import { TypeDef } from '@project-serum/anchor/dist/cjs/program/namespace/types';
import { Wallet } from '@project-serum/anchor/dist/cjs/provider';
import { LeFlash } from '../target/types/le_flash';
export type AnchorWallet = Wallet;
export type DistributorData = IdlAccounts<LeFlash>['distributor'];
export type ReceiptData = IdlAccounts<LeFlash>['receipt'];
export type PoolData = IdlAccounts<LeFlash>['pool'];
export type ChequeData = IdlAccounts<LeFlash>['cheque'];
type TypeDefDictionary<T extends IdlEvent[], Defined> = {
    [K in T[number]['name']]: TypeDef<{
        name: K;
        type: {
            kind: 'struct';
            fields: Extract<T[number], {
                name: K;
            }>['fields'];
        };
    }, Defined>;
};
export type IdlEvents<T extends Idl> = TypeDefDictionary<NonNullable<T['events']>, Record<string, never>>;
export type FeeOptions = {
    fee: BN;
    feeCollectorAddress: string;
};
export {};
