import {Command, flags} from '@oclif/command'
import {initialState} from "../multisig/types";
import {PublicKey} from "@solana/web3.js";
import {MultisigInstance} from "../multisig/multisigInstance";

export default class Execute extends Command {
  static description = 'Execute an existing transaction that is already signed by the minimum number of owners.'

  static examples = [
    `$ sol-multisig execute CqJTr3je2ENaenVtZDboVDTVPioFUmMuQNu4N5XeFWmh --fromWallet ~/.config/solana/id.json

`,
  ]

  static flags = {
    help: flags.help({char: 'h'}),
    fromWallet: flags.string({char: 's', description: 'path to wallet file of payer executing the transaction'}),
    multisig: flags.string({char: 'm', description: 'multisig account (publicKey)'}),
  }

  static args = [{name: 'transaction'}]

  async run() {
    const {args, flags} = this.parse(Execute)

    let multisig = initialState.common.network.multisigUpgradeAuthority
    if (flags.multisig) {
      multisig = new PublicKey(flags.multisig)
    }
    if (multisig === null) {
      this.error(`invalid multisig ${multisig}, specify the multisig pubkey as a flag -m/--multisig.`)
      this.exit(1)
    }

    const walletFile = flags.fromWallet
    const multisigInst = new MultisigInstance(multisig ? multisig : null, walletFile ? walletFile : "")
    const executeTx = await multisigInst.executeTransaction(args.transaction)
    this.log(`executed transaction: ${executeTx.toString()}`)
  }
}
