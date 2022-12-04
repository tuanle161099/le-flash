import { web3, Program, utils, BN, AnchorProvider } from '@project-serum/anchor'
import { LeFlash } from '../target/types/le_flash'

import { FEE_OPTIONS, DEFAULT_LE_FLASH_IDL } from './constant'
import { Leaf } from './merkleDistributor'
import { DistributorData, ReceiptData, FeeOptions } from './types'
import { findReceipt, isAddress, isHash } from './utils'

export class Utility {
  readonly _provider: AnchorProvider
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
  /**
   * Get list of event names
   */
  get events() {
    return this.program.idl.events.map(({ name }) => name)
  }

  /**
   * Remove listener by its id
   * @param listenerId Listener id
   * @returns
   */
  removeListener = async (listenerId: number) => {
    try {
      await this.program.removeEventListener(listenerId)
    } catch (er: any) {
      console.warn(er)
    }
  }

  /**
   * Get current Unix Timestamp of Solana Cluster
   * @param getCurrentUnixTimestamp
   * @returns Number (in seconds)
   */
  getCurrentUnixTimestamp = async (): Promise<number> => {
    const { data: buf } =
      (await this.program.provider.connection.getAccountInfo(
        web3.SYSVAR_CLOCK_PUBKEY,
      )) || {}
    if (!buf) throw new Error('Cannot fetch clock data')
    const unixTimestamp = new BN(buf.subarray(32, 40), 'le')
    return unixTimestamp.toNumber()
  }

  /**
   * Parse distributor buffer data.
   * @param data Distributor buffer data.
   * @returns Distributor readable data.
   */
  parseDistributorData = (data: Buffer): DistributorData => {
    return this.program.coder.accounts.decode('distributor', data)
  }

  /**
   * Get distributor data.
   * @param distributorAddress Distributor address.
   * @returns Distributor readable data.
   */
  getDistributorData = async (
    distributorAddress: string,
  ): Promise<DistributorData> => {
    return this.program.account.distributor.fetch(distributorAddress) as any
  }

  /**
   * Parse receipt buffer data.
   * @param data Receipt buffer data.
   * @returns Receipt readable data.
   */
  parseReceiptData = (data: Buffer): ReceiptData => {
    return this.program.coder.accounts.decode('receipt', data)
  }

  /**
   * Get receipt data.
   * @param receiptAddress Receipt address.
   * @returns Receipt readable data.
   */
  getReceiptData = async (receiptAddress: string): Promise<ReceiptData> => {
    return this.program.account.receipt.fetch(receiptAddress) as any
  }

  /**
   * Derive my receipt address by distributor address, and salt.
   * @param salt Buffer.
   * @param distributorAddress Distributor address.
   * @param strict (Optional) if true, a validation process will activate to make sure the receipt is safe.
   * @returns Receipt address.
   */
  deriveReceiptAddress = async (
    salt: Buffer,
    distributorAddress: string,
    strict: boolean = false,
  ) => {
    if (salt.length !== 32) throw new Error('The salt must has length 32')
    if (!isAddress(distributorAddress))
      throw new Error('Invalid distributor address')

    const receiptPublicKey = await findReceipt(
      salt,
      new web3.PublicKey(distributorAddress),
      this._provider.wallet.publicKey,
      this.program.programId,
    )
    const receiptAddress = receiptPublicKey.toBase58()

    if (strict) {
      let onchainAuthorityAddress: string
      let onchainDistributorAddress: string
      let onchainSalt: Buffer
      try {
        const { authority, distributor, salt } = await this.getReceiptData(
          receiptAddress,
        )
        onchainAuthorityAddress = authority.toBase58()
        onchainDistributorAddress = distributor.toBase58()
        onchainSalt = Buffer.from(salt)
      } catch (er) {
        throw new Error(`This receipt ${receiptAddress} is not initialized yet`)
      }
      if (
        this._provider.wallet.publicKey.toBase58() !== onchainAuthorityAddress
      )
        throw new Error('Violated authority address')
      if (distributorAddress !== onchainDistributorAddress)
        throw new Error('Violated proposal address')
      if (salt.compare(onchainSalt) !== 0) throw new Error('Violated salt')
    }

    return receiptAddress
  }

  /**
   * Derive treasurer address of a distributor.
   * @param distributorAddress Distributor address.
   * @returns Treasurer address that holds the secure token treasuries of the distributor.
   */
  deriveTreasurerAddress = async (distributorAddress: string) => {
    if (!isAddress(distributorAddress))
      throw new Error('Invalid distributor address')
    const distributorPublicKey = new web3.PublicKey(distributorAddress)
    const [treasurerPublicKey] = await web3.PublicKey.findProgramAddress(
      [Buffer.from('treasurer'), distributorPublicKey.toBuffer()],
      this.program.programId,
    )
    return treasurerPublicKey.toBase58()
  }

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
  initializeDistributor = async ({
    tokenAddress,
    total,
    merkleRoot,
    metadata,
    startedAt = 0,
    endedAt = 0,
    distributor = web3.Keypair.generate(),
    feeOptions = FEE_OPTIONS(this._provider.wallet.publicKey.toBase58()),
    sendAndConfirm = true,
  }: {
    tokenAddress: string
    total: BN
    merkleRoot: Buffer | Uint8Array
    metadata: Buffer | Uint8Array
    startedAt?: number
    endedAt?: number
    distributor?: web3.Keypair
    feeOptions?: FeeOptions
    sendAndConfirm?: boolean
  }) => {
    const { fee, feeCollectorAddress } = feeOptions
    if (!isAddress(feeCollectorAddress))
      throw new Error('Invalid fee collector address')
    if (!isAddress(tokenAddress)) throw new Error('Invalid token address')
    if (!isHash(merkleRoot)) throw new Error('Invalid merkle root')
    if (total.isNeg()) throw new Error('The total must not be negative')
    if (metadata.length !== 32) throw new Error('Invalid metadata path')

    const distributorAddress = distributor.publicKey.toBase58()
    const tokenPublicKey = new web3.PublicKey(tokenAddress)
    const srcPublicKey = await utils.token.associatedAddress({
      mint: tokenPublicKey,
      owner: this._provider.wallet.publicKey,
    })
    const treasurerAddress = await this.deriveTreasurerAddress(
      distributorAddress,
    )
    const treasurerPublicKey = new web3.PublicKey(treasurerAddress)
    const treasuryPublicKey = await utils.token.associatedAddress({
      mint: tokenPublicKey,
      owner: treasurerPublicKey,
    })

    const builder = await this.program.methods
      .initializeDistributor(
        [...merkleRoot],
        total,
        new BN(endedAt),
        new BN(startedAt),
        [...metadata],
        fee,
      )
      .accounts({
        authority: this._provider.wallet.publicKey,
        distributor: distributor.publicKey,
        src: srcPublicKey,
        treasurer: treasurerPublicKey,
        treasury: treasuryPublicKey,
        feeCollector: new web3.PublicKey(feeCollectorAddress),
        mint: tokenPublicKey,
        tokenProgram: utils.token.TOKEN_PROGRAM_ID,
        associatedTokenProgram: utils.token.ASSOCIATED_PROGRAM_ID,
        systemProgram: web3.SystemProgram.programId,
        rent: web3.SYSVAR_RENT_PUBKEY,
      })
      .signers([distributor])
    const tx = await builder.transaction()
    const txId = sendAndConfirm
      ? await builder.rpc({ commitment: 'confirmed' })
      : ''

    return { tx, txId, distributorAddress }
  }

  /**
   * Claim a distribution.
   * @param distributorAddress The distributor address.
   * @param proof Merkle proof.
   * @param data Receipient data.
   * @param feeOptions (Optional) Protocol fee.
   * @param sendAndConfirm (Optional) Send and confirm the transaction immediately.
   * @returns { tx, txId, dstAddress }
   */
  claim = async ({
    distributorAddress,
    proof,
    data,
    feeOptions = FEE_OPTIONS(this._provider.wallet.publicKey.toBase58()),
    sendAndConfirm = true,
  }: {
    distributorAddress: string
    proof: Array<Buffer>
    data: Leaf
    feeOptions?: FeeOptions
    sendAndConfirm?: boolean
  }) => {
    const { fee, feeCollectorAddress } = feeOptions
    if (!isAddress(feeCollectorAddress))
      throw new Error('Invalid fee collector address')
    if (!isAddress(distributorAddress))
      throw new Error('Invalid distributor address')
    if (!this._provider.wallet.publicKey.equals(data.authority))
      throw new Error('Invalid athority address')

    const { mint: tokenPublicKey } = await this.getDistributorData(
      distributorAddress,
    )
    const receiptAddress = await this.deriveReceiptAddress(
      data.salt,
      distributorAddress,
    )
    const dstPublicKey = await utils.token.associatedAddress({
      mint: tokenPublicKey,
      owner: this._provider.wallet.publicKey,
    })
    const treasurerAddress = await this.deriveTreasurerAddress(
      distributorAddress,
    )
    const treasurerPublicKey = new web3.PublicKey(treasurerAddress)
    const treasuryPublicKey = await utils.token.associatedAddress({
      mint: tokenPublicKey,
      owner: treasurerPublicKey,
    })

    const builder = await this.program.methods
      .claim(
        proof.map((e) => e.toJSON().data),
        new BN(1),
        data.startedAt,
        data.salt.toJSON().data,
        fee,
        data.chequeAddress,
      )
      .accounts({
        authority: this._provider.wallet.publicKey,
        distributor: new web3.PublicKey(distributorAddress),
        receipt: new web3.PublicKey(receiptAddress),
        dst: dstPublicKey,
        treasurer: treasurerPublicKey,
        treasury: treasuryPublicKey,
        feeCollector: new web3.PublicKey(feeCollectorAddress),
        mint: tokenPublicKey,
        tokenProgram: utils.token.TOKEN_PROGRAM_ID,
        associatedTokenProgram: utils.token.ASSOCIATED_PROGRAM_ID,
        systemProgram: web3.SystemProgram.programId,
        rent: web3.SYSVAR_RENT_PUBKEY,
      })
    const tx = await builder.transaction()
    const txId = sendAndConfirm
      ? await builder.rpc({ commitment: 'confirmed' })
      : ''

    return { tx, txId, dstAddress: dstPublicKey.toBase58() }
  }
}
