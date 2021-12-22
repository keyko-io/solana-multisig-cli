import {flags} from '@oclif/command'
import {PublicKey} from '@solana/web3.js'
import {getConnection} from '../common/util'
import {Saber} from '../instructions/saber'
import {BaseCommand} from '../common/baseCommand'
import {MultisigInstance} from '../multisigInstance'

export default class SaberWithdraw extends BaseCommand {
  static description = 'Withdraw tokens from a Saber pool.'

  static examples = [
    `$ sol-multisig saberWithdraw VeNkoB1HvSP6bSeGybQDnx9wTWFsQb2NBCemeCDSuKL 1 2 2
`,
  ]

  static flags = {
    ...BaseCommand.allFlags,
    destA: flags.string({char: 'a', description: 'destination account for token A'}),
    destB: flags.string({char: 'b', description: 'destination account for token B'}),
  }

  static args = [{name: 'swapAccount'}, {name: 'poolAmount'}, {name: 'minAmountA'}, {name: 'minAmountB'}]

  async run() {
    const {args, flags} = this.parse(SaberWithdraw)
    if (!args.swapAccount) {
      this.error('`swapAccount` arg is missing.')
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

    const minAmountA = Number.parseFloat(args.minAmountA)
    const minAmountB = Number.parseFloat(args.minAmountB)
    const amountPool = Number.parseFloat(args.poolAmount)
    const multisigInst: MultisigInstance = await this.getMultisigInstance(flags, args)
    const saberInst = new Saber(multisigInst, multisigInst.signer(), getConnection())
    saberInst.withdrawTokens(
      new PublicKey(args.swapAccount),
      amountPool,
      minAmountA,
      minAmountB,
      flags.destA ? new PublicKey(flags.destA) : null,
      flags.destB ? new PublicKey(flags.destB) : null,
    )
  }
}
