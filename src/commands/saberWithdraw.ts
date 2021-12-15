import {Command, flags} from '@oclif/command'
import {PublicKey} from "@solana/web3.js";
import {initialState, poolTokens} from "../multisig/types";
import {MultisigInstance} from "../multisig/multisigInstance";
import {getConnection, getNetwork} from "../multisig/util";

export default class SaberWithdraw extends Command {
  static description = 'Withdraw tokens from a Saber pool.'

  static examples = [
    `$ sol-multisig saberWithdraw 1 2 2
`,
  ]

  static flags = {
    help: flags.help({char: 'h'}),
    destA: flags.string({char: 'a', description: 'destination account for token A'}),
    destB: flags.string({char: 'b', description: 'destination account for token B'}),
    multisig: flags.string({char: 'm', description: 'multisig account'}),
  }

  static args = [{name: 'poolAmount'}, {name: 'minAmountA'}, {name: 'minAmountB'}, ]

  async run() {
    const {args, flags} = this.parse(SaberWithdraw)
    let multisig = getNetwork().multisigUpgradeAuthority
    if (flags.multisig) {
      multisig = new PublicKey(flags.multisig)
    }
    if (!multisig) {
      this.error('multisig is not found in config and not supplied in flags.')
      this.exit(1)
    }
    if (!args.minAmountA) {
      this.error('minAmountA is required.')
      this.exit(1)
    }
    if (!args.minAmountB) {
      this.error('minAmountB is required.')
      this.exit(1)
    }
    if (!args.poolAmount) {
      this.error('poolAmount is required.')
      this.exit(1)
    }
    const minAmountA = parseFloat(args.minAmountA)
    const minAmountB = parseFloat(args.minAmountB)
    const amountPool = parseFloat(args.poolAmount)
    const multisigInst = new MultisigInstance(multisig)
    multisigInst.saberWithdrawTokens(
      new PublicKey(poolTokens.usdc_usdt.swapAccount),
      new PublicKey(poolTokens.usdc_usdt.authority),
      amountPool,
      minAmountA,
      minAmountB,
      !!flags.destA ? new PublicKey(flags.destA) : null,
      !!flags.destB ? new PublicKey(flags.destB) : null,
    )

  }
}
