import {flags} from '@oclif/command'
import {PublicKey} from "@solana/web3.js";
import {MultisigInstance} from "../multisigInstance";
import {getConnection} from "../common/util";
import {Token} from "../instructions/token";
import {BaseCommand} from "../common/baseCommand";

export default class TransferTokens extends BaseCommand {
  static description = 'Submit a transaction to transfer tokens via the multisig wallet.'

  static examples = [
    `$ sol-multisig transferTokens <token-mint> <amount-float> <destination-token-account>
`,
  ]

  static flags = {
    ...BaseCommand.allFlags,
    from: flags.string({
      char: 'f',
      description: 'source pubkey'
    }),
  }

  static args = [{name: 'token'}, {name: 'amount'}, {name: 'destination'}]

  async run() {
    const {args, flags} = this.parse(TransferTokens)
    if (!args.token) {
      this.error('The token address arg is missing.')
      this.exit(1)
    }
    if (!args.amount) {
      this.error('The amount arg is missing.')
      this.exit(1)
    }
    if (!args.destination) {
      this.error('The destination arg is missing.')
      this.exit(1)
    }
    const source = flags.from ? new PublicKey(flags.from) : null
    const amount = parseFloat(args.amount)
    const multisigInst: MultisigInstance = await this.getMultisigInstance(flags, args)
    const tokenInst = new Token(multisigInst, multisigInst.signer(), getConnection())
    this.log(`using multisigInstnace with multisig account: ${multisigInst.multisig.toString()}`)
    tokenInst.sendTokenTransferTx(source, new PublicKey(args.token), new PublicKey(args.destination), amount)

  }
}
