import {
  AccountMeta,
  SYSVAR_RENT_PUBKEY,
  Signer,
  PublicKey, Keypair
} from '@solana/web3.js'
// @ts-ignore
import {Program} from '@project-serum/anchor'
// @ts-ignore
import {BN} from 'bn.js'
import {getMultisigClient, getNetwork, resolveHome} from './common/util'
import {DEFAULT_PUB_KEY} from './common/types'

export class MultisigInstance {
  multisigClient: Program = getMultisigClient(null);
  multisig: PublicKey = DEFAULT_PUB_KEY;
  multisigAccount: any = null;
  network = getNetwork();

  constructor(multisig: PublicKey | null, walletFile?: string) {
    if (this.network !== null && multisig === null) {
      multisig = this.network.multisigUpgradeAuthority ? this.network.multisigUpgradeAuthority : multisig
    }

    if (multisig !== null) {
      this.multisig = multisig
    }

    if (!walletFile) {
      walletFile = resolveHome('~/.config/solana/id.json')
      console.info(`walletFile: ${walletFile}`)
    }

    this.multisigClient = getMultisigClient(walletFile)
    this.multisigAccount = this.multisigClient.account
    .multisig.fetch(this.multisig)
    .then((account: any) => {
      return account
    })
    .catch((error: any) => {
      console.error(error)
      return null
    })
  }

  signer(): Signer {
    // @ts-ignore
    return this.multisigClient.provider.wallet.signer()
  }

  async getMultisigPDA() : Promise<string> {
    const [multisigSigner, nonce] = await PublicKey.findProgramAddress(
      [this.multisig.toBuffer()],
      this.multisigClient.programId,
    )
    return multisigSigner.toString()
  }

  async getSigners() : Promise<string[]> {
    console.info(`getSigners: multisig=${this.multisig.toString()}`)
    const multisigAccount: any = await this.multisigClient.account.multisig.fetch(this.multisig.toString())
    return multisigAccount.owners
    .map((ownerKey: PublicKey) => {
      return ownerKey.toString()
    })
  }

  async getPendingTransactions() : Promise<any[]> {
    const transactions = await this.multisigClient.account.transaction.all(this.multisig.toBuffer()).then(txs => {
      return txs
    })
    return transactions
  }

  async approveTransaction(transaction: any) : Promise<any> {
    const tx = await this.multisigClient.rpc.approve({
      accounts: {
        multisig: this.multisig,
        transaction: transaction,
        owner: this.multisigClient.provider.wallet.publicKey,
      },
    })

    return tx
  }

  async createMultisig(
    participants: string[],
    maxParticipantLength = 10,
    threshold = 2,
  ) : Promise<string> {
    const multisig = Keypair.generate()
    // Disc. + threshold + nonce.
    const baseSize = 8 + 8 + 1 + 4
    // Add enough for 2 more participants, in case the user changes one's
    /// mind later.
    const fudge = 64
    // Can only grow the participant set by 2x the initialized value.
    const ownerSize = maxParticipantLength * 32 + 8
    const multisigSize = baseSize + ownerSize + fudge
    const [, nonce] = await PublicKey.findProgramAddress(
      [multisig.publicKey.toBuffer()],
      this.multisigClient.programId,
    )
    const owners = participants.map(p => new PublicKey(p))
    const tx = await this.multisigClient.rpc.createMultisig(
      owners,
      new BN(threshold),
      nonce,
      {
        accounts: {
          multisig: multisig.publicKey,
          rent: SYSVAR_RENT_PUBKEY,
        },
        signers: [multisig],
        instructions: [
          await this.multisigClient.account.multisig.createInstruction(
            multisig,
            // @ts-ignore
            multisigSize,
          ),
        ],
      },
    )
    console.info(`createMultisig tx: ${tx.toString()}`)
    return multisig.publicKey.toString()
  }

  async sendTransaction(
    txName: string,
    programId: PublicKey,
    keys: Array<AccountMeta>,
    data: Buffer,
    txSize: number,
  ): Promise<string> {
    console.log(`sending tx in multisig: ${txName}, ${programId}`)

    const transaction = Keypair.generate()
    const tx = await this.multisigClient.rpc.createTransaction(
      programId,
      keys,
      data,
      {
        accounts: {
          multisig: this.multisig,
          transaction: transaction.publicKey,
          proposer: this.multisigClient.provider.wallet.publicKey,
          rent: SYSVAR_RENT_PUBKEY,
        },
        signers: [transaction],
        instructions: [
          await this.multisigClient.account.transaction.createInstruction(
            transaction,
            txSize,
          ),
        ],
      },
    )
    console.info(`(${txName}) tx created: ${tx}, transaction.pubkey= ${transaction.publicKey.toString()} `)
    return transaction.publicKey.toString()
  }

  async executeTransaction(transaction: any) : Promise<any> {
    const [multisigSigner, nonce] = await PublicKey.findProgramAddress(
      [this.multisig.toBuffer()],
      this.multisigClient.programId,
    )
    const transactionAccount: any = await this.multisigClient.account.transaction.fetch(transaction)
    console.info(`multisig: ${this.multisig}`)
    console.info(`multisigSigner: ${multisigSigner} , nonce: ${nonce}`)
    const tx = await this.multisigClient.rpc.executeTransaction({
      accounts: {
        multisig: this.multisig,
        multisigSigner: multisigSigner,
        transaction: transaction,
      },
      remainingAccounts: transactionAccount.accounts
      .map((t: any) => {
        if (t.pubkey.equals(multisigSigner)) {
          return {...t, isSigner: false}
        }

        return t
      })
      .concat({
        pubkey: transactionAccount.programId,
        isWritable: false,
        isSigner: false,
      }),
    })

    return tx
  }
}
