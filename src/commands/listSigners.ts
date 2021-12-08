import {Command, flags} from '@oclif/command'
import {initialState} from "../multisig/types";
import {PublicKey, Keypair} from "@solana/web3.js";
import {MultisigInstance} from "../multisig/multisigInstance";
// @ts-ignore
import * as bs58 from "bs58";
// @ts-ignore
import * as bip39 from "bip39";

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
  static args = [{name: "token"}]

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
    this.log(`multisig PDA: ${await multisigInst.getMultisigPDA()}`)
    if (args.token !== null && args.token !== undefined) {
      const tokenAccount = await multisigInst.getAssociatedTokenAccount(new PublicKey(args.token))
      this.log(`multisig PDA token account is: ${tokenAccount}`)
    }
    // const keypair = Keypair.fromSecretKey(
    //     // bs58.decode("5MaiiCavjCmn9Hs1o3eznqDEhRwxo7pXiAYez7keQUviUkauRiTMD8DrESdrNjN8zd9mTmVhRvBJeg5vhyvgrAhG")
    //     bs58.decode("zhpJA9hz7tBNbFEu8nqvsFqt6wA44sF8aEuPxjdxwr8wczgmTddac8C7WvahiwaeSVLvfXz6qahYzjp1QDwh3Nt")
    // )
    // this.log(`pubkey is:  ${keypair.publicKey.toString()}`)
    //
    // const mnemonic = "dynamic pony come still couple donkey case vessel hybrid bundle hour drip"
    // const seed = bip39.mnemonicToSeedSync(mnemonic, "")
    // const _keypair = Keypair.fromSeed(seed.slice(0, 32))
    // console.log(`${_keypair.publicKey.toBase58()}`)

  }
}
