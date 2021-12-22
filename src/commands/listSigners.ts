import {flags} from '@oclif/command'
import {PublicKey, Keypair} from "@solana/web3.js";
import * as splToken from "@solana/spl-token";
import {MultisigInstance} from "../multisigInstance";
import {Token} from "../instructions/token";
import {getConnection} from "../common/util";
import {BaseCommand} from "../common/baseCommand";

export default class ListSigners extends BaseCommand {
  static description = 'List the signers of the specified multisig wallet.'

  static examples = [
    `$ sol-multisig listSigners -m DbnEfsCR6gSk2Doqr8chiS8Uus2sizUn4H8zg6iU7Lkr
`,
  ]
  static flags = {
    ...BaseCommand.allFlags,
    token: flags.string({char: 't', description: 'token mint (publicKey)'}),
  }
  static args = []

  async run() {
    const {args, flags} = this.parse(ListSigners)
    const multisigInst: MultisigInstance = await this.getMultisigInstance(flags, args)
    const signersList: string[] = await multisigInst.getSigners()
    this.log(`signers in this multisig are: \n  ${signersList.join("\n  ")}`)
    if (flags.token !== null && flags.token !== undefined) {
      const mint = new PublicKey(flags.token)
      const tokenInst = new Token(multisigInst, multisigInst.signer(), getConnection())
      const tokenAccount = await tokenInst.getAssociatedTokenAccount(mint, new PublicKey(multisigInst.getMultisigPDA()))
      this.log(`multisig PDA token account is: ${tokenAccount}`)
      // @ts-ignore
      const mintInst = new splToken.Token(getConnection(), mint, splToken.TOKEN_PROGRAM_ID, multisigInst.multisigClient.provider.wallet.signer())
      let mintInfo = await mintInst.getMintInfo()
      if (!!mintInfo) {
        this.log(`mint account info: 
          mint authority: ${mintInfo.mintAuthority ? mintInfo.mintAuthority.toString() : 'no authority'}, 
          supply: ${mintInfo.supply.toString()}, 
          decimals: ${mintInfo.decimals.toString()}
          1 token: == ${Math.pow(10, mintInfo.decimals)} (with decimals)`)
      }
    }
  }
}
