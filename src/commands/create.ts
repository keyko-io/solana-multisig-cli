import {Command, flags} from '@oclif/command'
import {PublicKey} from "@solana/web3.js";
import {initialState} from "../multisig/types";
import {MultisigInstance} from "../multisig/multisigInstance";
import {getNetwork} from "../multisig/util";

export default class Create extends Command {
  static description = 'Create a new multisig account.'

  static examples = [
    `$ sol-multisig create "ACC1,ACC2,ACC3"
tx: 0x....

`,
  ]

  static flags = {
    help: flags.help({char: 'h'}),
    participants: flags.string({char: 'p', description: 'public keys of this multisig signers'}),
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

    if (!args.participants && !flags.participants) {
      this.log('"participants" must be provided as an argument or in the -p (--participants) flag.')
      this.exit(1)
    }
    let participantsStr = args.participants ? args.participants : flags.participants
    const participants = participantsStr.split(',')
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
    this.log(`created new multisig: pubkey ${newMultisig}`)
  }
}
