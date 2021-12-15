import {Command, flags} from '@oclif/command'
import {PublicKey} from "@solana/web3.js";
import {initialState} from "../multisig/types";
import {MultisigInstance} from "../multisig/multisigInstance";
import {getNetwork} from "../multisig/util";

export default class TransferTokens extends Command {
  static description = 'Submit a transaction to transfer tokens via the multisig wallet.'

  static examples = [
    `$ sol-multisig transferTokens DbnEfsCR6gSk2Doqr8chiS8Uus2sizUn4H8zg6iU7Lkr 5 -d BdKK9PrvtUTZV4apffYYy9q4Ys4ZxVZnZZESQYmw8B3b

`,
  ]

  static flags = {
    help: flags.help({char: 'h'}),
    from: flags.string({
        char: 'f',
        description: 'source pubkey'
    }),
    amount: flags.string({
      char: 'a',
      description: 'amount of tokens to transfer'
    }),
    destination: flags.string({char: 'd', description: 'token account of recipient or recipient pubkey'}),
    multisig: flags.string({char: 'm', description: 'multisig account'}),
  }

  static args = [{name: 'token'}, {name: 'amount'}]

  async run() {
    const {args, flags} = this.parse(TransferTokens)
    let multisig = getNetwork().multisigUpgradeAuthority
    if (flags.multisig) {
      multisig = new PublicKey(flags.multisig)
    }
    if (!multisig) {
      this.error('multisig is not found in config and not supplied in flags.')
      this.exit(1)
    }
    if (!args.token) {
      this.error('must specify the token address.')
      this.exit(1)
    }
    if (!flags.destination) {
      this.error('destination flag is required.')
      this.exit(1)
    }
    if (!flags.amount) {
      this.error('amount is required.')
      this.exit(1)
    }
    const source = flags.from ? new PublicKey(flags.from) : null
    const amount = parseFloat(flags.amount)
    const multisigInst = new MultisigInstance(multisig)
    this.log(`using multisigInstnace with multisig account: ${multisigInst.multisig.toString()}`)
    multisigInst.sendTokenTransferTx(source, new PublicKey(args.token), new PublicKey(flags.destination), amount)

  }
}
