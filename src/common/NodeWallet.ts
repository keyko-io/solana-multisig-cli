import {
  Keypair,
  Signer,
  PublicKey,
  Transaction} from '@solana/web3.js'
import {DEFAULT_PUB_KEY} from './types'

export class NodeWallet {
  private _keypair: Keypair = Keypair.generate();
  publicKey: PublicKey = DEFAULT_PUB_KEY;

  constructor(keypair: Keypair) {
    this._keypair = keypair
    this.publicKey =   keypair.publicKey
  }

  signer() : Signer {
    return {publicKey: this.publicKey, secretKey: this._keypair.secretKey}
  }

  async signTransaction(transaction: Transaction): Promise<Transaction> {
    const signer: Signer = {publicKey: this.publicKey, secretKey: this._keypair.secretKey}
    transaction.sign(signer)
    return transaction
  }

  async signAllTransactions(
    transactions: Transaction[],
  ): Promise<Transaction[]> {
    const signer: Signer = {publicKey: this.publicKey, secretKey: this._keypair.secretKey}
    transactions = transactions.map((tx, idx) => {
      tx.sign(signer)
      return tx
    })
    return transactions
  }
}
