import {
  web3,
  Program,
  utils,
  Address,
  AnchorProvider,
  BN,
  IdlAccounts,
} from '@project-serum/anchor'
import { ComputeBudgetProgram, Transaction } from '@solana/web3.js'

import { TOKEN_PROGRAM_ID } from '@project-serum/anchor/dist/cjs/utils/token'
import { LeFlash } from '../target/types/le_flash'
import { DEFAULT_LE_FLASH_IDL } from './constant'
import { findNftMetadataAddress, isAddress } from './utils'

export type PoolData = IdlAccounts<LeFlash>['pool']
export type ChequeData = IdlAccounts<LeFlash>['cheque']

const PROGRAMS = {
  rent: web3.SYSVAR_RENT_PUBKEY,
  systemProgram: web3.SystemProgram.programId,
  associatedTokenProgram: utils.token.ASSOCIATED_PROGRAM_ID,
  tokenProgram: TOKEN_PROGRAM_ID,
}

class LeFlashProgram {
  private _provider: AnchorProvider
  readonly program: Program<LeFlash>
  constructor(provider: AnchorProvider, programId: string) {
    if (!isAddress(programId)) throw new Error('Invalid program id')
    // Private
    this._provider = provider
    // Public
    this.program = new Program<LeFlash>(
      DEFAULT_LE_FLASH_IDL,
      programId,
      this._provider,
    )
  }
  deriveTreasurerAddress = async (poolAddress: Address) => {
    if (typeof poolAddress !== 'string') poolAddress = poolAddress.toBase58()
    if (!isAddress(poolAddress)) throw new Error('Invalid pool address')
    const poolPublicKey = new web3.PublicKey(poolAddress)
    const [treasurerPublicKey] = await web3.PublicKey.findProgramAddress(
      [Buffer.from('treasurer'), poolPublicKey.toBuffer()],
      this.program.programId,
    )
    return treasurerPublicKey.toBase58()
  }

  /**
   * Derive my cheque address by proposal address and receipt's index.
   * @param proposalAddress Proposal address.
   * @param strict (Optional) if true, a validation process will activate to make sure the cheque is safe.
   * @returns cheque address.
   */
  deriveChequeAddress = async (
    poolAddress: string,
    strict: boolean = false,
  ) => {
    if (!isAddress(poolAddress)) throw new Error('Invalid proposal address')
    const poolPublicKey = new web3.PublicKey(poolAddress)
    const authorityPublicKey = this._provider.wallet.publicKey
    const [chequePubkey] = await await web3.PublicKey.findProgramAddress(
      [
        Buffer.from('cheque'),
        poolPublicKey.toBuffer(),
        authorityPublicKey.toBuffer(),
      ],
      this.program.programId,
    )
    const chequeAddress = chequePubkey.toBase58()

    if (strict) {
      let onchainAuthorityAddress: string
      let onchainPoolAddress: string
      try {
        const { authority, pool } = await this.getChequeData(chequeAddress)
        onchainAuthorityAddress = authority.toBase58()
        onchainPoolAddress = pool.toBase58()
      } catch (er) {
        throw new Error(`This cheque ${chequeAddress} is not initialized yet`)
      }
      if (
        this._provider.wallet.publicKey.toBase58() !== onchainAuthorityAddress
      )
        throw new Error('Violated authority address')
      if (poolAddress !== onchainPoolAddress)
        throw new Error('Violated proposal address')
    }

    return chequeAddress
  }

  /**
   * Get pool data.
   * @param poolAddress Pool address.
   * @returns Pool readable data.
   */
  getPoolData = async (poolAddress: Address): Promise<PoolData> => {
    return this.program.account.pool.fetch(poolAddress) as any
  }
  /**
   * Get pool data.
   * @param chequeAddress Receipt address.
   * @returns Pool readable data.
   */
  getChequeData = async (chequeAddress: Address): Promise<ChequeData> => {
    return this.program.account.cheque.fetch(chequeAddress) as any
  }

  fetch = async (): Promise<any> => {
    return this.program.account.cheque.all() as any
  }

  requestUnits = (tx: web3.Transaction, addCompute: number): Transaction => {
    return tx.add(
      ComputeBudgetProgram.requestUnits({
        units: addCompute,
        additionalFee: 0,
      }),
    )
  }

  initializePool = async ({
    pool = web3.Keypair.generate(),
    mintLpt = web3.Keypair.generate(),
    sendAndConfirm = true,
    mint,
  }: {
    pool?: web3.Keypair
    mintLpt?: web3.Keypair
    sendAndConfirm?: boolean
    mint: web3.PublicKey
  }) => {
    const newPool = pool
    const poolAddress = newPool.publicKey.toBase58()
    const treasurer = await this.deriveTreasurerAddress(poolAddress)

    const tokenAccountLpt = await utils.token.associatedAddress({
      mint: new web3.PublicKey(mintLpt.publicKey),
      owner: new web3.PublicKey(this._provider.wallet.publicKey),
    })

    const treasury = await utils.token.associatedAddress({
      mint: new web3.PublicKey(mint),
      owner: new web3.PublicKey(treasurer),
    })

    const tx = await this.program.methods
      .initializePool(mint, treasury)
      .accounts({
        associatedTokenAccountLpt: tokenAccountLpt,
        authority: this._provider.wallet.publicKey,
        mintLpt: mintLpt.publicKey,
        pool: poolAddress,
        treasurer,
        ...PROGRAMS,
      })
      .transaction()

    let txId = ''
    if (sendAndConfirm) {
      this._provider.opts.skipPreflight = true
      txId = await this._provider.sendAndConfirm(tx, [newPool, mintLpt])
    }

    return { txId, poolAddress: newPool.publicKey.toBase58(), tx }
  }

  deposit = async ({
    recipient = this._provider.wallet.publicKey.toBase58(),
    poolAddress,
    sendAndConfirm = true,
    mintNFTAddress,
  }: {
    recipient?: string
    poolAddress: string
    sendAndConfirm?: boolean
    mintNFTAddress: string
  }) => {
    const chequePubkey = new web3.PublicKey(recipient)
    const chequeKeypair = web3.Keypair.generate()
    const { mintLpt } = await this.getPoolData(poolAddress)

    const treasurer = await this.deriveTreasurerAddress(poolAddress)
    const metadataAddress = await findNftMetadataAddress(
      new web3.PublicKey(mintNFTAddress),
    )
    const metadataPublicKey = metadataAddress.toBase58()
    const tokenAccountLpt = await utils.token.associatedAddress({
      mint: mintLpt,
      owner: new web3.PublicKey(this._provider.wallet.publicKey),
    })

    const srcAssociatedTokenAccount = await utils.token.associatedAddress({
      mint: new web3.PublicKey(mintNFTAddress),
      owner: new web3.PublicKey(this._provider.wallet.publicKey),
    })
    const treasury = await utils.token.associatedAddress({
      mint: new web3.PublicKey(mintNFTAddress),
      owner: new web3.PublicKey(treasurer),
    })
    const chequePublicKey = chequeKeypair.publicKey.toBase58()

    let tx = await this.program.methods
      .deposit(chequePubkey)
      .accounts({
        authority: this._provider.wallet.publicKey,
        pool: poolAddress,
        associatedTokenAccountLpt: tokenAccountLpt,
        mint: mintNFTAddress,
        mintLpt,
        srcAssociatedTokenAccount,
        treasurer,
        treasury,
        cheque: chequePublicKey,
        metadata: metadataPublicKey,
        ...PROGRAMS,
      })
      .transaction()

    let txId = ''
    if (sendAndConfirm) {
      this._provider.opts.skipPreflight = true
      txId = await this._provider.sendAndConfirm(tx, [chequeKeypair])
    }
    return { txId, tx, chequeAddress: chequeKeypair.publicKey.toBase58() }
  }

  withdraw = async ({
    amount,
    poolAddress,
    sendAndConfirm = true,
  }: {
    amount: BN
    poolAddress: Address
    sendAndConfirm?: boolean
  }) => {
    const { mint, mintLpt } = await this.getPoolData(poolAddress)
    const treasurer = await this.deriveTreasurerAddress(poolAddress)

    const metadataAddress = await findNftMetadataAddress(
      new web3.PublicKey(mint),
    )
    const metadataPublicKey = metadataAddress.toBase58()

    const tokenAccountLpt = await utils.token.associatedAddress({
      mint: mintLpt,
      owner: new web3.PublicKey(this._provider.wallet.publicKey),
    })

    const dstAssociatedTokenAccount = await utils.token.associatedAddress({
      mint,
      owner: new web3.PublicKey(this._provider.wallet.publicKey),
    })

    const treasury = await utils.token.associatedAddress({
      mint: new web3.PublicKey(mint),
      owner: new web3.PublicKey(treasurer),
    })

    let tx = await this.program.methods
      .withdraw(amount)
      .accounts({
        authority: this._provider.wallet.publicKey,
        pool: poolAddress,
        associatedTokenAccountLpt: tokenAccountLpt,
        mint,
        mintLpt,
        dstAssociatedTokenAccount,
        treasurer,
        treasury,
        metadata: metadataPublicKey,
        ...PROGRAMS,
      })
      .transaction()

    let txId = ''
    if (sendAndConfirm) {
      txId = await this._provider.sendAndConfirm(tx, [])
    }
    return { txId, tx }
  }

  withdrawNFT = async ({
    chequeAddress,
    sendAndConfirm = true,
  }: {
    chequeAddress: Address
    sendAndConfirm?: boolean
  }) => {
    const { pool, mint: mintNFT } = await this.getChequeData(chequeAddress)
    const { mintLpt } = await this.getPoolData(pool)
    const treasurer = await this.deriveTreasurerAddress(pool)

    const metadataAddress = await findNftMetadataAddress(
      new web3.PublicKey(mintNFT),
    )
    const metadataPublicKey = metadataAddress.toBase58()

    const tokenAccountLpt = await utils.token.associatedAddress({
      mint: mintLpt,
      owner: new web3.PublicKey(this._provider.wallet.publicKey),
    })

    const dstAssociatedTokenAccount = await utils.token.associatedAddress({
      mint: mintNFT,
      owner: new web3.PublicKey(this._provider.wallet.publicKey),
    })

    const treasury = await utils.token.associatedAddress({
      mint: new web3.PublicKey(mintNFT),
      owner: new web3.PublicKey(treasurer),
    })

    let tx = await this.program.methods
      .withdrawNft()
      .accounts({
        authority: this._provider.wallet.publicKey,
        pool,
        associatedTokenAccountLpt: tokenAccountLpt,
        mint: mintNFT,
        mintLpt,
        dstAssociatedTokenAccount,
        treasurer,
        treasury,
        metadata: metadataPublicKey,
        cheque: chequeAddress,
        ...PROGRAMS,
      })
      .transaction()

    let txId = ''
    if (sendAndConfirm) {
      txId = await this._provider.sendAndConfirm(tx, [])
    }
    return { txId, tx }
  }
}

export * from '../target/types/le_flash'
export * from './constant'
export * from './utils'

export default LeFlashProgram
