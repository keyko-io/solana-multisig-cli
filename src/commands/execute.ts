import {MultisigInstance} from '../multisig-instance'
import {BaseCommand} from '../common/base-command'

export default class Execute extends BaseCommand {
  static description = 'Execute an existing transaction that is already signed by the minimum number of owners.'

  static examples = [
    `$ sol-multisig execute CqJTr3je2ENaenVtZDboVDTVPioFUmMuQNu4N5XeFWmh --signer=~/.config/solana/id.json
`,
  ]

  static flags = {
    ...BaseCommand.allFlags,
  }

  static args = [{name: 'transaction'}]

  async run() {
    const {args, flags} = this.parse(Execute)

    const multisigInst: MultisigInstance = await this.getMultisigInstance(flags, args)
    const executeTx = await multisigInst.executeTransaction(args.transaction)
    this.log(`executed transaction: ${executeTx.toString()}`)
  }
}
