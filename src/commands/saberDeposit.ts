import {Command, flags} from '@oclif/command'
import {PublicKey} from "@solana/web3.js";
import {initialState, poolTokens} from "../multisig/types";
import {MultisigInstance} from "../multisig/multisigInstance";

export default class SaberDeposit extends Command {
  static description = 'Deposit tokens into a Saber pool.'

  static examples = [
    `$ sol-multisig saberDeposit 10 10 1

`,
  ]

  static flags = {
    help: flags.help({char: 'h'}),
    multisig: flags.string({char: 'm', description: 'multisig account'}),
  }

  static args = [{name: 'amountA'}, {name: 'amountB'}, {name: 'minPoolAmount'}]

  async run() {
    const {args, flags} = this.parse(SaberDeposit)
    let multisig = initialState.common.network.multisigUpgradeAuthority
    if (flags.multisig) {
      multisig = new PublicKey(flags.multisig)
    }
    if (!multisig) {
      this.error('multisig is not found in config and not supplied in flags.')
      this.exit(1)
    }
    if (!args.amountA) {
      this.error('amountA is required.')
      this.exit(1)
    }
    if (!args.amountB) {
      this.error('amountB is required.')
      this.exit(1)
    }
    if (!args.minPoolAmount) {
      this.error('minPoolAmount is required.')
      this.exit(1)
    }
    const amountA = parseFloat(args.amountA)
    const amountB = parseFloat(args.amountB)
    const amountPoolMin = parseFloat(args.minPoolAmount)
    const multisigInst = new MultisigInstance(multisig)

    multisigInst.saberDepositTokens(
      new PublicKey(poolTokens.usdc_usdt.swapAccount),
      new PublicKey(poolTokens.usdc_usdt.authority),
      poolTokens.usdc_usdt.poolToken,
      poolTokens.usdc_usdt.tokenA,
      poolTokens.usdc_usdt.tokenB,
      amountA,
      amountB,
      amountPoolMin
    )
  }
}
