import {
  Connection,
  Signer,
  PublicKey,
  Transaction,
  sendAndConfirmTransaction} from '@solana/web3.js'
import * as splToken from '@solana/spl-token'
import * as saber from '@saberhq/stableswap-sdk'
import {stableSwapConfig} from '../common/types'
import {MultisigInstance} from '../multisigInstance'
import {Token} from './token'

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
    const mintTokenA = new splToken.Token(this.connection, tokenAMint, splToken.TOKEN_PROGRAM_ID, this.signer)
    const mintTokenB = new splToken.Token(this.connection, tokenBMint, splToken.TOKEN_PROGRAM_ID, this.signer)
    const base_tokenAmountA = 10 ** (await mintTokenA.getMintInfo()).decimals * tokenAmountA
    const base_tokenAmountB = 10 ** (await mintTokenB.getMintInfo()).decimals * tokenAmountB

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
    const mintPoolToken = new splToken.Token(this.connection, poolTokenMint, splToken.TOKEN_PROGRAM_ID, this.signer)
    const base_minimumPoolTokenAmount = 10 ** (await mintPoolToken.getMintInfo()).decimals * minimumPoolTokenAmount
    const poolTokenAccount = new PublicKey(await tokenInstance.initializeTokenAccount(poolTokenMint, multisigSigner))
    const saberProgramId = saber.SWAP_PROGRAM_ID

    const config = {
      swapProgramID: saberProgramId,
      swapAccount,
      authority: swapAuthority,
      tokenProgramID: stableSwapConfig.tokenProgramID,
    }
    const tx_depositInstruction = saber.depositInstruction(
      {
        config,
        userAuthority: multisigSigner,
        sourceA,
        sourceB,
        tokenAccountA: tokenAReserve,
        tokenAccountB: tokenBReserve,
        poolTokenMint,
        poolTokenAccount,
        // @ts-ignore
        tokenAmountA: new splToken.u64(base_tokenAmountA),
        // @ts-ignore
        tokenAmountB: new splToken.u64(base_tokenAmountB),
        // @ts-ignore
        minimumPoolTokenAmount: new splToken.u64(base_minimumPoolTokenAmount),
      },
    )

    console.info(`multisig: ${this.multisigInstance.multisig}`)
    console.info(`multisigSigner: ${multisigSigner} , nonce: ${nonce}`)
    console.info(`tokens: ${sourceA.toString()}, ${sourceB.toString()}, ${poolTokenAccount.toString()}`)

    const txSize = 3000 // TODO: calculate the required size without making it too large
    return await this.multisigInstance.sendTransaction(
      'Saber deposit tokens',
      tx_depositInstruction.programId,
      tx_depositInstruction.keys,
      tx_depositInstruction.data,
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

    const tokenAInstance = new splToken.Token(this.connection, tokenAMint, splToken.TOKEN_PROGRAM_ID, this.signer)
    const tokenBInstance = new splToken.Token(this.connection, tokenBMint, splToken.TOKEN_PROGRAM_ID, this.signer)
    const base_minimumTokenAmountA = 10 ** (await tokenAInstance.getMintInfo()).decimals * minimumTokenAmountA
    const base_minimumTokenAmountB = 10 ** (await tokenBInstance.getMintInfo()).decimals * minimumTokenAmountB

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
    const mintPoolToken = new splToken.Token(this.connection, poolTokenMint, splToken.TOKEN_PROGRAM_ID, this.signer)
    const base_poolTokenAmount = 10 ** (await mintPoolToken.getMintInfo()).decimals * poolTokenAmount
    const poolTokenAccount = new PublicKey(await tokenInstance.initializeTokenAccount(poolTokenMint, multisigSigner))
    const saberProgramId = saber.SWAP_PROGRAM_ID

    const config = {
      swapProgramID: saberProgramId,
      swapAccount,
      authority: swapAuthority,
      tokenProgramID: stableSwapConfig.tokenProgramID,
    }
    const tx_withdrawInstruction = saber.withdrawInstruction(
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
        // @ts-ignore
        poolTokenAmount: new splToken.u64(base_poolTokenAmount),
        // @ts-ignore
        minimumTokenA: new splToken.u64(base_minimumTokenAmountA),
        // @ts-ignore
        minimumTokenB: new splToken.u64(base_minimumTokenAmountB),
      },
    )

    console.info(`multisig: ${this.multisigInstance.multisig}`)
    console.info(`multisigSigner: ${multisigSigner} , nonce: ${nonce}`)
    console.info(`tokens: ${userAccountA.toString()}, ${userAccountB.toString()}, ${poolTokenAccount.toString()}`)

    const txSize = 3000 // TODO: calculate the required size without making it too large
    return await this.multisigInstance.sendTransaction(
      'Saber withdraw tokens',
      tx_withdrawInstruction.programId,
      tx_withdrawInstruction.keys,
      tx_withdrawInstruction.data,
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

    const mintTokenA = new splToken.Token(this.connection, tokenAMint, splToken.TOKEN_PROGRAM_ID, this.signer)
    const mintTokenB = new splToken.Token(this.connection, tokenBMint, splToken.TOKEN_PROGRAM_ID, this.signer)
    const base_tokenAmountA = 10 ** (await mintTokenA.getMintInfo()).decimals * tokenAmountA
    const base_tokenAmountB = 10 ** (await mintTokenB.getMintInfo()).decimals * tokenAmountB

    const tokenInstance = new Token(this.multisigInstance, this.signer, this.connection)
    const sourceA = new PublicKey(await tokenInstance.initializeTokenAccount(tokenAMint, this.signer.publicKey))
    const sourceB = new PublicKey(await tokenInstance.initializeTokenAccount(tokenBMint, this.signer.publicKey))

    const tokenAccountA = swap.state.tokenA.reserve
    const tokenAccountB = swap.state.tokenB.reserve

    const poolTokenMint = swap.state.poolTokenMint
    const mintPoolToken = new splToken.Token(this.connection, poolTokenMint, splToken.TOKEN_PROGRAM_ID, this.signer)
    const base_minimumPoolTokenAmount = 10 ** (await mintPoolToken.getMintInfo()).decimals * minimumPoolTokenAmount
    const poolTokenAccount = new PublicKey(await tokenInstance.initializeTokenAccount(poolTokenMint, this.signer.publicKey))
    const saberProgramId = saber.SWAP_PROGRAM_ID

    const config = {
      swapProgramID: saberProgramId,
      swapAccount,
      authority: swapAuthority,
      tokenProgramID: stableSwapConfig.tokenProgramID,
    }
    const tx_depositInstruction = saber.depositInstruction(
      {
        config,
        userAuthority: this.signer.publicKey,
        sourceA,
        sourceB,
        tokenAccountA,
        tokenAccountB,
        poolTokenMint,
        poolTokenAccount,
        // @ts-ignore
        tokenAmountA: new splToken.u64(base_tokenAmountA),
        // @ts-ignore
        tokenAmountB: new splToken.u64(base_tokenAmountB),
        // @ts-ignore
        minimumPoolTokenAmount: new splToken.u64(base_minimumPoolTokenAmount),
      },
    )

    console.info(`tokens: ${sourceA.toString()}, ${sourceB.toString()}, ${poolTokenAccount.toString()}`)

    const transaction = new Transaction().add(tx_depositInstruction)
    const tx = await sendAndConfirmTransaction(this.connection, transaction, [this.signer])
    console.info(`(saber pool deposit) tx created: ${tx}`)
    return tx
  }
}
