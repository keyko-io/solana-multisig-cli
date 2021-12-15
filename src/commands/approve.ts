import {Command, flags} from '@oclif/command'
import {initialState} from "../multisig/types";
import {PublicKey} from "@solana/web3.js";
import {MultisigInstance} from "../multisig/multisigInstance";
import {getNetwork} from "../multisig/util";

export default class Approve extends Command {
  static description = 'Approve (sign) an existing transaction.'

  static examples = [
    `$ sol-multisig approve DbnEfsCR6gSk2Doqr8chiS8Uus2sizUn4H8zg6iU7Lkr CqJTr3je2ENaenVtZDboVDTVPioFUmMuQNu4N5XeFWmh

`,
  ]

  static flags = {
    help: flags.help({char: 'h'}),
    signerWallet: flags.string({char: 's', description: 'path to wallet file of signer approving the transaction'}),
    multisig: flags.string({char: 'm', description: 'multisig account (publicKey)'}),
  }

  static args = [{name: 'transaction'}]

  async run() {
    const {args, flags} = this.parse(Approve)

    let multisig = getNetwork().multisigUpgradeAuthority
    if (flags.multisig) {
      multisig = new PublicKey(flags.multisig)
    }
    if (multisig === null) {
      this.error(`invalid multisig ${multisig}, specify the multisig pubkey as a flag -m/--multisig.`)
      this.exit(1)
    }
    const walletFile = flags.signerWallet
    if (!walletFile) {
      this.log(`signerWallet is not specified, transaction will be approved using the default client wallet.`)
    }
    const multisigInst = new MultisigInstance(multisig ? multisig : null, walletFile ? walletFile : "")
    const approveTx = await multisigInst.approveTransaction(args.transaction)
    this.log(`approved transaction: ${approveTx.toString()}`)
  }
}
