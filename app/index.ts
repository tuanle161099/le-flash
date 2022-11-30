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
   * Get pool data.
   * @param poolAddress Pool address.
   * @returns Pool readable data.
   */
  getPoolData = async (poolAddress: Address): Promise<PoolData> => {
    return this.program.account.pool.fetch(poolAddress) as any
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
    sendAndConfirm = false,
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
      txId = await this._provider.sendAndConfirm(tx, [newPool, mintLpt])
    }

    return { txId, poolAddress: newPool.publicKey.toBase58(), tx }
  }

  deposit = async ({
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

    const srcAssociatedTokenAccount = await utils.token.associatedAddress({
      mint,
      owner: new web3.PublicKey(this._provider.wallet.publicKey),
    })

    const treasury = await utils.token.associatedAddress({
      mint: new web3.PublicKey(mint),
      owner: new web3.PublicKey(treasurer),
    })

    let tx = await this.program.methods
      .deposit(amount)
      .accounts({
        authority: this._provider.wallet.publicKey,
        pool: poolAddress,
        associatedTokenAccountLpt: tokenAccountLpt,
        mint,
        mintLpt,
        srcAssociatedTokenAccount,
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
}

export * from './constant'
export * from './utils'

export default LeFlashProgram
