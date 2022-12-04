import { Address, AnchorProvider, web3 } from '@project-serum/anchor'
import { Connection, PublicKey, Transaction } from '@solana/web3.js'
import { WalletInterface } from './rawWallet'
import { programs } from '@metaplex/js'

/**
 * Validate an address
 * @param address Base58 string
 * @returns true/false
 */
export const isAddress = (address?: Address): address is Address => {
  if (!address) return false
  try {
    const publicKey = new web3.PublicKey(address)
    if (!publicKey) throw new Error('Invalid public key')
    return true
  } catch (er) {
    return false
  }
}

export const getAnchorProvider = (
  node: string,
  walletAddress: string,
  wallet: WalletInterface,
): AnchorProvider => {
  const connection = new Connection(node, 'confirmed')

  const signAllTransactions = async (transactions: Transaction[]) => {
    const signedTransactions = []
    for (const transaction of transactions) {
      const signedTransaction = await wallet.signTransaction(transaction)
      signedTransactions.push(signedTransaction)
    }
    return signedTransactions
  }

  const publicKey = new PublicKey(walletAddress)
  return new AnchorProvider(
    connection,
    {
      publicKey: new PublicKey(publicKey),
      signTransaction: wallet.signTransaction,
      signAllTransactions,
    },
    {
      commitment: 'confirmed',
      skipPreflight: true,
    },
  )
}

/**
 * Find the NFT metadata address
 * @param nftAddress public key
 * @returns NFT metadata public key
 */
export const findNftMetadataAddress = async (nftAddress: web3.PublicKey) => {
  const metadataPDA = await programs.metadata.Metadata.getPDA(
    new web3.PublicKey(nftAddress),
  )
  return metadataPDA
}

/**
 * Validate an hash (must have length 32)
 * @param hash Hash buffer
 * @returns true/false
 */
export const isHash = (hash: Buffer | Uint8Array): boolean => {
  if (!hash || hash.length !== 32) return false
  return true
}

/**
 * Find the my receipt of an proposal based on canonical bump
 * @param index Receipt index
 * @param proposalPublicKey Proposal public key
 * @param authorityPublicKey Receipt authority public key
 * @param programId Sen Utility program public key
 * @returns Receipt public key
 */
export const findReceipt = async (
  salt: Buffer,
  distributorPublicKey: web3.PublicKey,
  authorityPublicKey: web3.PublicKey,
  programId: web3.PublicKey,
) => {
  const [receiptPublicKey] = await web3.PublicKey.findProgramAddress(
    [
      Buffer.from('receipt'),
      salt,
      distributorPublicKey.toBuffer(),
      authorityPublicKey.toBuffer(),
    ],
    programId,
  )
  return receiptPublicKey
}
