import * as anchor from '@project-serum/anchor'
import { Program, Spl } from '@project-serum/anchor'

import LeFlashProgram, { LeFlash } from '../dist/app'
import { initializeMint, mintTo, initAccountToken } from './pretest/helper'

describe('le-flash', () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env()
  anchor.setProvider(provider)

  const program = anchor.workspace.LeFlash as Program<LeFlash>
  const leFlashProgram = new LeFlashProgram(
    provider,
    program.programId.toBase58(),
  )

  let POOL = anchor.web3.Keypair.generate()
  let MINT_LPT = anchor.web3.Keypair.generate()
  let MINT = anchor.web3.Keypair.generate()
  let AMOUNT = new anchor.BN(1_000_000_000)
  const spl = Spl.token()

  before('Is generate data!', async () => {
    await initializeMint(9, MINT, spl)
    await initAccountToken(MINT.publicKey, provider)
    await mintTo(AMOUNT, MINT.publicKey, provider, spl)
  })

  it('Is initialized!', async () => {
    // Add your test here.
    const tx = await leFlashProgram.initializePool({
      pool: POOL,
      mintLpt: MINT_LPT,
      sendAndConfirm: true,
      mint: MINT.publicKey,
    })

    console.log('Your transaction signature', tx)
  })

  it('Is fetched pool data!', async () => {
    const poolData = await leFlashProgram.getPoolData(POOL.publicKey)
    console.log('poolAddress', poolData)
  })

  it('Deposit', async () => {
    const { txId } = await leFlashProgram.deposit({
      amount: AMOUNT,
      poolAddress: POOL.publicKey,
      mintNFTAddress: MINT.publicKey.toBase58(),
    })
    console.log(txId)
  })

  it('Withdraw', async () => {
    const { txId } = await leFlashProgram.withdraw({
      amount: AMOUNT,
      poolAddress: POOL.publicKey,
    })
    console.log(txId)
  })
})
