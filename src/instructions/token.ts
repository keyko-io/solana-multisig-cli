import {
  Account,
  AccountMeta,
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
import * as BufferLayout from "buffer-layout";
import {Buffer} from "buffer";
import {MultisigInstance} from "../multisigInstance";

const FAILED_TO_FIND_ACCOUNT = 'Failed to find account';
const INVALID_ACCOUNT_OWNER = 'Invalid account owner';

const uint64 = (property = 'uint64') => {
  return BufferLayout.blob(8, property);
};

export class Token {
  multisigInstance: MultisigInstance;
  signer: Signer;
  connection: Connection;

  constructor(multisigInstance: MultisigInstance, signer: Signer, connection: Connection) {
    this.multisigInstance = multisigInstance
    this.signer = signer
    this.connection = connection
  }

  /*
    Initialize a token account for the multisig signer PDA (Program Derived Address)
   */
  async initializeTokenAccount(token: PublicKey, account: PublicKey): Promise<string> {
    // easyspl.Wallet.fromKeypair(connection, Keypair.generate())
    // const signer = this.signer()
    const mintToken = new splToken.Token(this.connection, token, splToken.TOKEN_PROGRAM_ID, this.signer)
    // if (account === null || account === undefined) {
    //   const [multisigSigner, nonce] = await PublicKey.findProgramAddress(
    //     [this.multisig.toBuffer()],
    //     this.multisigClient.programId
    //   );
    //   account = multisigSigner
    // }

    const associatedAddress = await splToken.Token.getAssociatedTokenAddress(
      mintToken.associatedProgramId, mintToken.programId, mintToken.publicKey, account, true
    )
    console.info(`about to do InitAccount: 
      token=${token.toString()}, 
      splAccount=${associatedAddress},
      newOwner=${account}`)

    try {
      return (await mintToken.getAccountInfo(associatedAddress)).address.toString();
    } catch (err) {
      if (err.message === FAILED_TO_FIND_ACCOUNT || err.message === INVALID_ACCOUNT_OWNER) {
        try {
          const transaction = new Transaction()
          transaction.add(
            splToken.Token.createAssociatedTokenAccountInstruction(
              mintToken.associatedProgramId, mintToken.programId, mintToken.publicKey, associatedAddress, account, this.signer.publicKey
            ))
          await sendAndConfirmTransaction(this.connection, transaction, [this.signer])
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

  async getAssociatedTokenAccount(token: PublicKey, account: PublicKey): Promise<string> {
    const mintToken = new splToken.Token(this.connection, token, splToken.TOKEN_PROGRAM_ID, this.signer)
    const associatedAddress = await splToken.Token.getAssociatedTokenAddress(
      mintToken.associatedProgramId, mintToken.programId, mintToken.publicKey, account, true
    )
    return associatedAddress.toString()
  }

  async sendTokenTransferTx(
    source: PublicKey | null,
    token: PublicKey,
    destination: PublicKey,
    tokenAmount: number,
  ): Promise<string | null> {

    const [multisigSigner, nonce] = await PublicKey.findProgramAddress(
      [this.multisigInstance.multisig.toBuffer()],
      this.multisigInstance.multisigClient.programId
    );
    // if source is not null, we assume that the multisig Signer is already
    // set as delegate for the source token account
    if (source === null) {
      // source is the multisigSigner TokenAccount
      const associatedAddress = await this.initializeTokenAccount(token, multisigSigner)
      // @ts-ignore
      source = new PublicKey(associatedAddress)
      console.info(`multisigSigner - associatedTokenAddress: ${source}`)
    }
    const mintToken = new splToken.Token(this.connection, token, splToken.TOKEN_PROGRAM_ID, this.signer)
    const base_tokenAmount = Math.pow(10, (await mintToken.getMintInfo()).decimals) * tokenAmount
    // the programId of the solana token program, this is always the same
    const programId = splToken.TOKEN_PROGRAM_ID
    // TODO: convert amount by multiplying by the token decimals
    const data = this.createTransferData(base_tokenAmount)
    console.info(`multisig: ${this.multisigInstance.multisig}`)
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

    const txSize = 1000; // 432 bytes should be sufficient, but will use 1000 for now
    return await this.multisigInstance.sendTransaction(
      'Token transfer',
      programId,
      keys,
      data,
      txSize
    )
  };

  async directTransferTokens(senderPubkey: PublicKey, destination: PublicKey, tokenAddress: string, amount: number): Promise<string> {
    const programId = splToken.TOKEN_PROGRAM_ID
    const tokenPubkey = new PublicKey(tokenAddress)
    const owner = this.signer
    const mintToken = new splToken.Token(this.connection, tokenPubkey, programId, owner)
    // const senderPubkey = this.multisigClient.provider.wallet.publicKey
    const source = await splToken.Token.getAssociatedTokenAddress(
      mintToken.associatedProgramId, mintToken.programId, mintToken.publicKey, senderPubkey
    )
    const data = this.createTransferData(Math.pow(10, (await mintToken.getMintInfo()).decimals) * amount)

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
    const tx = await sendAndConfirmTransaction(this.connection, transaction, [owner])
    console.info(`token transfer tx sent: ${tx}, ${owner.publicKey.toString()}, ${source.toString()}, ${destination.toString()} `)
    return tx.toString();
  }

  /**
   * Create Transfer instruction data
   *
   * @param amount Number of tokens to transfer
   */
  createTransferData = (
    amount: number,
  ) => {
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

    return data;
  };
}
