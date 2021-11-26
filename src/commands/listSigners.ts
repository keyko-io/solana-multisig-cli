import {Command, flags} from '@oclif/command'
import {initialState} from "../multisig/types";
import {PublicKey} from "@solana/web3.js";
import {MultisigInstance} from "../multisig/multisigInstance";

export default class ListSigners extends Command {
  static description = 'List the signers of the specified multisig wallet.'

  static examples = [
    `$ sol-multisig listSigners DbnEfsCR6gSk2Doqr8chiS8Uus2sizUn4H8zg6iU7Lkr

`,
  ]
  static flags = {
    help: flags.help({char: 'h'}),
    multisig: flags.string({char: 'm', description: 'multisig account (publicKey)'}),
  }
  static args = []

  async run() {
    const {args, flags} = this.parse(ListSigners)
    let multisig = initialState.common.network.multisigUpgradeAuthority
    if (flags.multisig) {
      multisig = new PublicKey(flags.multisig)
    }
    if (multisig === null) {
      this.error(`invalid multisig ${multisig}, specify the multisig pubkey as a flag -m/--multisig.`)
      this.exit(1)
    }
    const multisigInst = new MultisigInstance(multisig ? multisig : null)
    const signersList = await multisigInst.getSigners()

    this.log(`signers in this multisig are: \n  ${signersList.join("\n  ")}`)
  }
}
