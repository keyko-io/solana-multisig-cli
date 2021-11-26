import {
  Account,
  SYSVAR_RENT_PUBKEY,
  SYSVAR_CLOCK_PUBKEY,
  Connection,
  Keypair,
  Signer,
  PublicKey,
  Transaction,
  TransactionSignature,
  TransactionInstruction,
  SystemProgram,
  ConfirmOptions,
  RpcResponseAndContext,
  SimulatedTransactionResponse,
  sendAndConfirmTransaction } from "@solana/web3.js";
import * as splToken from "@solana/spl-token";
// @ts-ignore
import * as BufferLayout from 'buffer-layout';
// @ts-ignore
import {Program} from "@project-serum/anchor";
// @ts-ignore
import {BN} from "bn.js";
import {getConnection, getMultisigClient, getNetwork, resolveHome} from "./util";
import {DEFAULT_PUB_KEY} from "./types";
import {Buffer} from "buffer";
// @ts-ignore
import { blob } from "buffer-layout";
import * as easyspl from 'easy-spl'

const uint64 = (property = 'uint64') => {
  return blob(8, property);
};

const FAILED_TO_FIND_ACCOUNT = 'Failed to find account';
const INVALID_ACCOUNT_OWNER = 'Invalid account owner';


export class MultisigInstance {
  multisigClient: Program = getMultisigClient(null);
  multisig: PublicKey = DEFAULT_PUB_KEY;
  multisigAccount: any = null;
  network = getNetwork();

  constructor(multisig: PublicKey | null, walletFile?: string) {
    if (this.network !== null && multisig === null) {
      multisig = this.network.multisigUpgradeAuthority ? this.network.multisigUpgradeAuthority : multisig;
    }
    if (multisig !== null) {
      this.multisig = multisig;
    }
    if (!walletFile) {
      walletFile = resolveHome('~/.config/solana/id.json')
      console.info(`walletFile: ${walletFile}`)
    }
    this.multisigClient = getMultisigClient(walletFile);
    this.multisigAccount = this.multisigClient.account
      .multisig.fetch(this.multisig)
      .then((account: any) => {
        return account;
      })
      .catch((err: any) => {
        console.error(err);
        return null;
      });
  }

  async getSigners() : Promise<string[]> {
    let multisigAccount: any = await this.multisigClient.account.multisig.fetch(this.multisig.toString())
    return multisigAccount.owners
      .map((ownerKey: PublicKey) => {
        return ownerKey.toString()
    })
  }

  async getPendingTransactions() : Promise<any[]> {
    let transactions = await this.multisigClient.account.transaction.all(this.multisig.toBuffer()).then((txs) => {
      return txs;
    });
    return transactions;
  }

  async approveTransaction(transaction: any) : Promise<any>{
    const tx = await this.multisigClient.rpc.approve({
      accounts: {
        multisig: this.multisig,
        transaction: transaction,
        owner: this.multisigClient.provider.wallet.publicKey,
      },
    });

    return tx
  }

  async createMultisig(
    participants: string[],
    maxParticipantLength: number=10,
    threshold: number=2
  ) : Promise<string> {

    const multisig = new Account();
    // Disc. + threshold + nonce.
    const baseSize = 8 + 8 + 1 + 4;
    // Add enough for 2 more participants, in case the user changes one's
    /// mind later.
    const fudge = 64;
    // Can only grow the participant set by 2x the initialized value.
    const ownerSize = maxParticipantLength * 32 + 8;
    const multisigSize = baseSize + ownerSize + fudge;
    const [, nonce] = await PublicKey.findProgramAddress(
      [multisig.publicKey.toBuffer()],
      this.multisigClient.programId
    );
    const owners = participants.map((p) => new PublicKey(p));
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
            multisigSize
          ),
        ],
      }
    );
    console.info(`createMultisig tx: ${tx.toString()}`)
    return multisig.publicKey.toString()
  };

  /**
   * Create Transfer instruction data
   *
   * @param amount Number of tokens to transfer
   */
  createTransferData = (
    amount: number,
  ) => {
    // const dataLayout = struct([u8('instruction'), uint64('amount')]);
    // const data = Buffer.alloc(dataLayout.span);
    // dataLayout.encode({
    //   instruction: 3,
    //   // Transfer instruction
    //   amount: new u64(amount).toBuffer()
    // }, data);

    // const uint64 = BufferLayout.blob(8, 'uint64')
    const dataLayout = BufferLayout.struct([
      BufferLayout.u8('instruction'),
      uint64('amount'),
    ]);

    const data = Buffer.alloc(dataLayout.span);
    // @ts-ignore
    let a = new splToken.u64(amount);
    dataLayout.encode(
      {
        instruction: 3, // Transfer instruction
        amount: a.toBuffer(),
      },
      data,
    );
    // splToken.Token.coder.instruction.encode("change_threshold", {
    // threshold: new BN(threshold),
    // });

    return data;
  };

  async executeTransaction(transaction: any) : Promise<any>{
    const [multisigSigner, nonce] = await PublicKey.findProgramAddress(
      [this.multisig.toBuffer()],
      this.multisigClient.programId
    );
    let transactionAccount: any = await this.multisigClient.account.transaction.fetch(transaction)
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
            return { ...t, isSigner: false };
          }
          return t;
        })
        .concat({
          pubkey: transactionAccount.programId,
          isWritable: false,
          isSigner: false,
        }),
    });

    return tx
  }

  async initializeTokenAccount(token: PublicKey) : Promise<string | null> {
    const connection = getConnection()
    easyspl.Wallet.fromKeypair(connection, Keypair.generate())

    // @ts-ignore
    const signer = this.multisigClient.provider.wallet.signer()
    const mintToken = new splToken.Token(connection, token, splToken.TOKEN_PROGRAM_ID, signer)
    const [multisigSigner, nonce] = await PublicKey.findProgramAddress(
      [this.multisig.toBuffer()],
        this.multisigClient.programId
    );
    const associatedAddress = await splToken.Token.getAssociatedTokenAddress(
      mintToken.associatedProgramId, mintToken.programId, mintToken.publicKey, multisigSigner, true
    )
    console.info(`about to do InitAccount: 
      token=${token.toString()}, 
      multisig=${this.multisig}, 
      splAccount=${associatedAddress},
      newOwner(multisigSigner)=${multisigSigner}`)

    try {
      // @ts-ignore
      return (await mintToken.getAccountInfo(associatedAddress)).address.toString();
    } catch (err) {
      if (err.message === FAILED_TO_FIND_ACCOUNT || err.message === INVALID_ACCOUNT_OWNER) {
        try {
          const transaction = new Transaction()
          transaction.add(
            splToken.Token.createAssociatedTokenAccountInstruction(
              mintToken.associatedProgramId, mintToken.programId, mintToken.publicKey, associatedAddress, multisigSigner, signer.publicKey
          ))
          await sendAndConfirmTransaction(connection, transaction, [signer])
        } catch (err) {// ignore all errors; for now there is no API compatible way to
          // selectively ignore the expected instruction error if the
          // associated account is existing already.
        } // Now this should always succeed

        return (await mintToken.getAccountInfo(associatedAddress)).address.toString();
      } else {
        throw err;
      }
    }

  }

  async sendTokenTransferTx(
    source: PublicKey | null,
    token: PublicKey,
    destination: PublicKey,
    tokenAmount: number,
  ) : Promise<string | null> {

    // if source is not null, we assume that the multisig Signer is already
    // set as delegate for the source token account
    if (source === null) {
      // source is the multisigSigner TokenAccount
      const associatedAddress = await this.initializeTokenAccount(token)
      // @ts-ignore
      source = new PublicKey(associatedAddress)
      console.info(`multisigSigner-associatedTokenAddress: ${source}`)
    }

    // the programId of the solana token program, this is always the same
    const programId = splToken.TOKEN_PROGRAM_ID
    const data = this.createTransferData(tokenAmount)
    const [multisigSigner, nonce] = await PublicKey.findProgramAddress(
      [this.multisig.toBuffer()],
        this.multisigClient.programId
    );

    console.info(`multisig: ${this.multisig}`)
    console.info(`multisigSigner: ${multisigSigner} , nonce: ${nonce}`)
    console.info(`multisigSigner-associatedTokenAddress: ${source}`)

    let keys = [{
        pubkey: source,
        isSigner: false,
        isWritable: true
      }, {
        pubkey: destination,
        isSigner: false,
        isWritable: true
      }, {
        pubkey: multisigSigner,
        isSigner: true,
        isWritable: false
    }];

    const transaction = new Account();
    const txSize = 1000; // 432 bytes should be sufficient, but will use 1000 for now
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
            // @ts-ignore
            txSize
          ),
        ],
      }
    );
    console.info(`(token transfer) tx created: ${tx}, transaction.pubkey= ${transaction.publicKey.toString()} `)
    return transaction.publicKey.toString();
  };

  async directTransferTokens(destination: PublicKey, tokenAddress: string, amount: number) : Promise<string> {
    const programId = splToken.TOKEN_PROGRAM_ID
    const data = this.createTransferData(amount)
    const tokenPubkey = new PublicKey(tokenAddress)
    // @ts-ignore
    const owner = this.multisigClient.provider.wallet.signer()
    const senderPubkey = this.multisigClient.provider.wallet.publicKey
    const mintToken = new splToken.Token(getConnection(), tokenPubkey, programId, owner)
    const source = await splToken.Token.getAssociatedTokenAddress(
      mintToken.associatedProgramId, mintToken.programId, mintToken.publicKey, senderPubkey
    )

    let keys = [{
        pubkey: source,
        isSigner: false,
        isWritable: true
      }, {
        pubkey: destination,
        isSigner: false,
        isWritable: true
      }, {
        pubkey: owner.publicKey,
        isSigner: true,
        isWritable: false
    }];
    const transaction = new Transaction().add(
      new TransactionInstruction({programId, keys, data})
    );
    const tx = await sendAndConfirmTransaction(getConnection(), transaction, [owner])
    console.info(`token transfer tx sent: ${tx}, ${owner.publicKey.toString()}, ${source.toString()}, ${destination.toString()} `)
    return tx.toString();
  }
}
