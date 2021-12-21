import {PublicKey} from "@solana/web3.js";
import {MultisigInstance} from "../multisigInstance";
import {getConnection} from "../common/util";
import {Saber} from "../instructions/saber";
import {BaseCommand} from "../common/baseCommand";

export default class SaberDeposit extends BaseCommand {
  static description = 'Deposit tokens into a Saber pool.'

  static examples = [
    `$ sol-multisig saberDeposit VeNkoB1HvSP6bSeGybQDnx9wTWFsQb2NBCemeCDSuKL 10 10 1
`,
  ]

  static flags = {
    ...BaseCommand.allFlags
  }

  static args = [{name: 'swapAccount'}, {name: 'amountA'}, {name: 'amountB'}, {name: 'minPoolAmount'}]

  async run() {
    const {args, flags} = this.parse(SaberDeposit)
    if (!args.swapAccount) {
      this.error('`swapAccount` arg is missing.')
      this.exit(1)
    }
    if (!args.amountA) {
      this.error('amountA is missing.')
      this.exit(1)
    }
    if (!args.amountB) {
      this.error('amountB is missing.')
      this.exit(1)
    }
    if (!args.minPoolAmount) {
      this.error('minPoolAmount is missing.')
      this.exit(1)
    }
    const amountA = parseFloat(args.amountA)
    const amountB = parseFloat(args.amountB)
    const amountPoolMin = parseFloat(args.minPoolAmount)
    const multisigInst: MultisigInstance = await this.getMultisigInstance(flags, args)
    const saberInst = new Saber(multisigInst, multisigInst.signer(), getConnection())
    saberInst.depositTokens(
      new PublicKey(args.swapAccount),
      amountA,
      amountB,
      amountPoolMin
    )
  }
}
