import {Command, flags} from '@oclif/command'
import {PublicKey, Keypair} from "@solana/web3.js";
import {MultisigInstance} from "../multisigInstance";
import {getNetwork} from "./util";
import * as Parser from '@oclif/parser';

export abstract class BaseCommand extends Command {
  static baseFlags = {
    help: flags.help({char: 'h'}),
    signer: flags.string({char: 's', description: 'path to wallet file of payer for the transaction'}),
  }
  static optionalFlags = {
    multisig: flags.string({char: 'm', description: 'multisig account (publicKey)'}),
  }
  static allFlags = {
    ...BaseCommand.baseFlags,
    ...BaseCommand.optionalFlags
  }

  async getMultisigInstance(flags: any, args: Parser.OutputFlags<any>): Promise<MultisigInstance> {
    let multisig = getNetwork().multisigUpgradeAuthority
    if (flags.multisig) {
      multisig = new PublicKey(flags.multisig)
    }
    if (multisig === null) {
      this.error(`invalid multisig ${multisig}, specify the multisig pubkey as a flag -m/--multisig.`)
      this.exit(1)
    }
    const walletFile = flags.signer
    if (!!walletFile) {
      this.log(`using signer "${walletFile}" for this transaction.`)
    }

    const msi = new MultisigInstance(multisig ? multisig : null, walletFile ? walletFile : "")
    this.log(
      `using multisigInstnace: ` +
      `  programId: ${msi.multisigClient.programId}` +
      `  multisig account: ${msi.multisig.toString()}` +
      `  multisig PDA: ${await msi.getMultisigPDA()}`
    )
    return msi
  }
}
