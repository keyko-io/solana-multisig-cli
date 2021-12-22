import {MultisigInstance} from '../multisigInstance'
import {BaseCommand} from '../common/baseCommand'

export default class Approve extends BaseCommand {
  static description = 'Approve (sign) an existing transaction.'

  static examples = [
    `$ sol-multisig approve CqJTr3je2ENaenVtZDboVDTVPioFUmMuQNu4N5XeFWmh -m DbnEfsCR6gSk2Doqr8chiS8Uus2sizUn4H8zg6iU7Lkr
`,
  ]

  static flags = {
    ...BaseCommand.allFlags,
  }

  static args = [{name: 'transaction', description: 'the transaction`s publickey'}]

  async run() {
    const {args, flags} = this.parse(Approve)

    const multisigInst: MultisigInstance = await this.getMultisigInstance(flags, args)
    const approveTx = await multisigInst.approveTransaction(args.transaction)
    this.log(`approved transaction: ${approveTx.toString()}`)
  }
}
