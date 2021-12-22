import {
  Connection,
  Signer,
  PublicKey,
  Transaction,
  sendAndConfirmTransaction} from '@solana/web3.js'
import * as SplToken from '@solana/spl-token'
import * as saber from '@saberhq/stableswap-sdk'
import {stableSwapConfig} from '../common/types'
import {MultisigInstance} from '../multisig-instance'
import {Token} from './token'

const U64 = SplToken.u64

export class Saber {
  multisigInstance: MultisigInstance;
  signer: Signer;
  connection: Connection;

  constructor(multisigInstance: MultisigInstance, signer: Signer, connection: Connection) {
    this.multisigInstance = multisigInstance
    this.signer = signer
    this.connection = connection
  }

  async depositTokens(
    swapAccount: PublicKey,
    tokenAmountA: number,
    tokenAmountB: number,
    minimumPoolTokenAmount: number,
  ): Promise<string> {
    const swap = await saber.StableSwap.load(this.connection, swapAccount, saber.SWAP_PROGRAM_ID)
    const [swapAuthority, _] = await saber.findSwapAuthorityKey(swapAccount)
    console.log(`swap auth: ${swapAuthority}\n  swap acc: ${swapAccount}`)
    const tokenAMint = swap.state.tokenA.mint
    const tokenBMint = swap.state.tokenB.mint
    const mintTokenA = new SplToken.Token(this.connection, tokenAMint, SplToken.TOKEN_PROGRAM_ID, this.signer)
    const mintTokenB = new SplToken.Token(this.connection, tokenBMint, SplToken.TOKEN_PROGRAM_ID, this.signer)
    const baseTokenAmountA = (10 ** (await mintTokenA.getMintInfo()).decimals) * tokenAmountA
    const baseTokenAmountB = (10 ** (await mintTokenB.getMintInfo()).decimals) * tokenAmountB

    const [multisigSigner, nonce] = await PublicKey.findProgramAddress(
      [this.multisigInstance.multisig.toBuffer()],
      this.multisigInstance.multisigClient.programId,
    )
    const tokenInstance = new Token(this.multisigInstance, this.signer, this.connection)
    const sourceA = new PublicKey(await tokenInstance.initializeTokenAccount(tokenAMint, multisigSigner))
    const sourceB = new PublicKey(await tokenInstance.initializeTokenAccount(tokenBMint, multisigSigner))

    const tokenAReserve = swap.state.tokenA.reserve
    const tokenBReserve = swap.state.tokenB.reserve
    console.info(
      `accounts: ${sourceA.toString()}, ${sourceB.toString()}, ${tokenAReserve.toString()}, ${tokenBReserve.toString()}, `,
    )

    const poolTokenMint = swap.state.poolTokenMint
    const mintPoolToken = new SplToken.Token(this.connection, poolTokenMint, SplToken.TOKEN_PROGRAM_ID, this.signer)
    const baseMinimumPoolTokenAmount = (10 ** (await mintPoolToken.getMintInfo()).decimals) * minimumPoolTokenAmount
    const poolTokenAccount = new PublicKey(await tokenInstance.initializeTokenAccount(poolTokenMint, multisigSigner))
    const saberProgramId = saber.SWAP_PROGRAM_ID

    const config = {
      swapProgramID: saberProgramId,
      swapAccount,
      authority: swapAuthority,
      tokenProgramID: stableSwapConfig.tokenProgramID,
    }
    const txDepositInstruction = saber.depositInstruction(
      {
        config,
        userAuthority: multisigSigner,
        sourceA,
        sourceB,
        tokenAccountA: tokenAReserve,
        tokenAccountB: tokenBReserve,
        poolTokenMint,
        poolTokenAccount,
        tokenAmountA: new U64(baseTokenAmountA),
        tokenAmountB: new U64(baseTokenAmountB),
        minimumPoolTokenAmount: new U64(baseMinimumPoolTokenAmount),
      },
    )

    console.info(`multisig: ${this.multisigInstance.multisig}`)
    console.info(`multisigSigner: ${multisigSigner} , nonce: ${nonce}`)
    console.info(`tokens: ${sourceA.toString()}, ${sourceB.toString()}, ${poolTokenAccount.toString()}`)

    const txSize = 3000 // TODO: calculate the required size without making it too large
    return this.multisigInstance.sendTransaction(
      'Saber deposit tokens',
      txDepositInstruction.programId,
      txDepositInstruction.keys,
      txDepositInstruction.data,
      txSize,
    )
  }

  async withdrawTokens(
    swapAccount: PublicKey,
    poolTokenAmount: number,
    minimumTokenAmountA: number,
    minimumTokenAmountB: number,
    userAccountA?: PublicKey | null,
    userAccountB?: PublicKey | null,
  ): Promise<string> {
    const swap = await saber.StableSwap.load(this.connection, swapAccount, saber.SWAP_PROGRAM_ID)
    const [swapAuthority, _] = await saber.findSwapAuthorityKey(swapAccount)
    console.log(`swap auth: ${swapAuthority}\n  swap acc: ${swapAccount}`)
    const tokenAMint = swap.state.tokenA.mint
    const tokenBMint = swap.state.tokenB.mint

    const tokenAInstance = new SplToken.Token(this.connection, tokenAMint, SplToken.TOKEN_PROGRAM_ID, this.signer)
    const tokenBInstance = new SplToken.Token(this.connection, tokenBMint, SplToken.TOKEN_PROGRAM_ID, this.signer)
    const baseMinimumTokenAmountA = (10 ** (await tokenAInstance.getMintInfo()).decimals) * minimumTokenAmountA
    const baseMinimumTokenAmountB = (10 ** (await tokenBInstance.getMintInfo()).decimals) * minimumTokenAmountB

    const tokenInstance = new Token(this.multisigInstance, this.signer, this.connection)
    const [multisigSigner, nonce] = await PublicKey.findProgramAddress(
      [this.multisigInstance.multisig.toBuffer()],
      this.multisigInstance.multisigClient.programId,
    )

    if (!userAccountA) {
      userAccountA = new PublicKey(await tokenInstance.initializeTokenAccount(tokenAMint, multisigSigner))
    }

    if (!userAccountB) {
      userAccountB = new PublicKey(await tokenInstance.initializeTokenAccount(tokenBMint, multisigSigner))
    }

    const tokenAReserve = swap.state.tokenA.reserve
    const tokenBReserve = swap.state.tokenB.reserve
    console.info(
      `accounts: ${userAccountA.toString()}, ${userAccountB.toString()}, ${tokenAReserve.toString()}, ${tokenBReserve.toString()}, `,
    )

    const poolTokenMint = swap.state.poolTokenMint
    const mintPoolToken = new SplToken.Token(this.connection, poolTokenMint, SplToken.TOKEN_PROGRAM_ID, this.signer)
    const basePoolTokenAmount = (10 ** (await mintPoolToken.getMintInfo()).decimals) * poolTokenAmount
    const poolTokenAccount = new PublicKey(await tokenInstance.initializeTokenAccount(poolTokenMint, multisigSigner))
    const saberProgramId = saber.SWAP_PROGRAM_ID

    const config = {
      swapProgramID: saberProgramId,
      swapAccount,
      authority: swapAuthority,
      tokenProgramID: stableSwapConfig.tokenProgramID,
    }
    const txWithdrawInstruction = saber.withdrawInstruction(
      {
        config: config,
        userAuthority: multisigSigner,
        poolMint: poolTokenMint,
        sourceAccount: poolTokenAccount,
        tokenAccountA: tokenAReserve,
        tokenAccountB: tokenBReserve,
        userAccountA: userAccountA,
        userAccountB: userAccountB,
        adminFeeAccountA: swap.state.tokenA.adminFeeAccount,
        adminFeeAccountB: swap.state.tokenB.adminFeeAccount,
        poolTokenAmount: new U64(basePoolTokenAmount),
        minimumTokenA: new U64(baseMinimumTokenAmountA),
        minimumTokenB: new U64(baseMinimumTokenAmountB),
      },
    )

    console.info(`multisig: ${this.multisigInstance.multisig}`)
    console.info(`multisigSigner: ${multisigSigner} , nonce: ${nonce}`)
    console.info(`tokens: ${userAccountA.toString()}, ${userAccountB.toString()}, ${poolTokenAccount.toString()}`)

    const txSize = 3000 // TODO: calculate the required size without making it too large
    return this.multisigInstance.sendTransaction(
      'Saber withdraw tokens',
      txWithdrawInstruction.programId,
      txWithdrawInstruction.keys,
      txWithdrawInstruction.data,
      txSize,
    )
  }

  async directDepositTokens(
    swapAccount: PublicKey,
    tokenAmountA: number,
    tokenAmountB: number,
    minimumPoolTokenAmount: number,
  ): Promise<string> {
    const swap = await saber.StableSwap.load(this.connection, swapAccount, saber.SWAP_PROGRAM_ID)
    const [swapAuthority, _] = await saber.findSwapAuthorityKey(swapAccount)
    console.log(`swap auth: ${swapAuthority}\n  swap acc: ${swapAccount}`)
    const tokenAMint = swap.state.tokenA.mint
    const tokenBMint = swap.state.tokenB.mint

    const mintTokenA = new SplToken.Token(this.connection, tokenAMint, SplToken.TOKEN_PROGRAM_ID, this.signer)
    const mintTokenB = new SplToken.Token(this.connection, tokenBMint, SplToken.TOKEN_PROGRAM_ID, this.signer)
    const baseTokenAmountA = (10 ** (await mintTokenA.getMintInfo()).decimals) * tokenAmountA
    const baseTokenAmountB = (10 ** (await mintTokenB.getMintInfo()).decimals) * tokenAmountB

    const tokenInstance = new Token(this.multisigInstance, this.signer, this.connection)
    const sourceA = new PublicKey(await tokenInstance.initializeTokenAccount(tokenAMint, this.signer.publicKey))
    const sourceB = new PublicKey(await tokenInstance.initializeTokenAccount(tokenBMint, this.signer.publicKey))

    const tokenAccountA = swap.state.tokenA.reserve
    const tokenAccountB = swap.state.tokenB.reserve

    const poolTokenMint = swap.state.poolTokenMint
    const mintPoolToken = new SplToken.Token(this.connection, poolTokenMint, SplToken.TOKEN_PROGRAM_ID, this.signer)
    const baseMinimumPoolTokenAmount = (10 ** (await mintPoolToken.getMintInfo()).decimals) * minimumPoolTokenAmount
    const poolTokenAccount = new PublicKey(await tokenInstance.initializeTokenAccount(poolTokenMint, this.signer.publicKey))
    const saberProgramId = saber.SWAP_PROGRAM_ID

    const config = {
      swapProgramID: saberProgramId,
      swapAccount,
      authority: swapAuthority,
      tokenProgramID: stableSwapConfig.tokenProgramID,
    }
    const txDepositInstruction = saber.depositInstruction(
      {
        config,
        userAuthority: this.signer.publicKey,
        sourceA,
        sourceB,
        tokenAccountA,
        tokenAccountB,
        poolTokenMint,
        poolTokenAccount,
        tokenAmountA: new U64(baseTokenAmountA),
        tokenAmountB: new U64(baseTokenAmountB),
        minimumPoolTokenAmount: new U64(baseMinimumPoolTokenAmount),
      },
    )

    console.info(`tokens: ${sourceA.toString()}, ${sourceB.toString()}, ${poolTokenAccount.toString()}`)

    const transaction = new Transaction().add(txDepositInstruction)
    const tx = await sendAndConfirmTransaction(this.connection, transaction, [this.signer])
    console.info(`(saber pool deposit) tx created: ${tx}`)
    return tx
  }
}
