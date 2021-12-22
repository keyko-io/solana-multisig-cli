import {flags} from '@oclif/command'
import {MultisigInstance} from '../multisig-instance'
import {getNetwork} from '../common/util'
import {BaseCommand} from '../common/base-command'

export default class Create extends BaseCommand {
  static description = 'Create a new multisig account.'

  static examples = [
    `$ sol-multisig create "SIGNER_ACC1,SIGNER_ACC2,SIGNER_ACC3" -t 2 -x 9
`,
  ]

  static flags = {
    ...BaseCommand.baseFlags,
    threshold: flags.integer({
      char: 't',
      default: 2,
      description: 'multisig threshold, minimum number of signers ' +
        'required to execute a transaction (DEFAULT=2).'}),
    maxNumSigners: flags.integer({
      char: 'x',
      default: 10,
      description: 'max number of signers in the multisig (DEFAULT=10).'}),
  }

  static args = [{name: 'participants'}]

  async run() {
    const {args, flags} = this.parse(Create)
    this.log(`network is ${getNetwork().url}`)

    if (!args.participants) {
      this.log('"participants" must be provided as an argument or in the -p (--participants) flag.')
      this.exit(1)
    }

    const participants = args.participants.split(',')
    this.log(`got participants: ${participants.length}, ${participants}`)
    const maxSigners = flags.maxNumSigners >= 5 ? flags.maxNumSigners : 5
    const threshold = flags.threshold > 2 ? flags.threshold : 2
    if (maxSigners > 20) {
      this.error('maxNumSigners cannot exceed 20.')
      this.exit(1)
    }

    if (participants.length < 2) {
      this.error('must provide at least 2 participants.')
      this.exit(1)
    }

    if (participants.length > maxSigners) {
      this.error('number of participants exceeds maxNumSigners.')
      this.exit(1)
    }

    if (threshold > participants.length) {
      this.error('invalid threshold, cannot exceed number of participants.')
      this.exit(1)
    }

    const multisigInst = new MultisigInstance(null)
    const newMultisig = await multisigInst.createMultisig(participants, maxSigners, threshold)
    this.log(`created new multisig: pubkey ${newMultisig} at programId ${multisigInst.multisigClient.programId}`)
  }
}
