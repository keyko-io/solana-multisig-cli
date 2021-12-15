import {Command, flags} from '@oclif/command'
import {PublicKey} from "@solana/web3.js";
import {initialState} from "../multisig/types";
import {MultisigInstance} from "../multisig/multisigInstance";
// @ts-ignore
import * as BufferLayout from "buffer-layout";
import * as splToken from "@solana/spl-token";
import {getNetwork} from "../multisig/util";

const uint64 = (property = 'uint64') => {
  return BufferLayout.blob(8, property);
};

export default class ListTx extends Command {
  static description = 'List all pending transactions for the given multisig account.'

  static examples = [
    `$ sol-multisig listTx
tx: 0x....

`,
  ]

  static flags = {
    help: flags.help({char: 'h'}),
    // flag with a value (-n, --name=VALUE)
    // name: flags.string({char: 'n', description: ''}),
  }

  static args = [{name: 'multisig'}]

  async run() {
    const {args, flags} = this.parse(ListTx)

    // const name = flags.name ?? 'world'
    if (args.multisig === null) {
      this.log('"multisig" argument is required and should be the multisig account.')
    }
    const env_programId = ''
    const programId = getNetwork().multisigProgramId.toString()
    const multisig = args.multisig ? args.multisig : getNetwork().multisigUpgradeAuthority
    this.log(`getting transactions list from multisig "${multisig}" at program "${programId}"`)

    const multisigInst = new MultisigInstance(new PublicKey(multisig))
    const txs = await multisigInst.getPendingTransactions()
    const dataLayout = BufferLayout.struct([
      BufferLayout.u8('instruction'),
      uint64('amount'),
    ]);

    // const info = txs.map((tx: any) => {
    //   const _data = dataLayout.decode(tx.account.data)
    //   return `${tx.account.programId.toString()}, ${_data.instruction}, ${splToken.u64.fromBuffer(_data.amount)}, ${tx.account.accounts}, ${tx.account.didExecute}`
    // })
    // this.log(`transactions: ${info}`)
    const getTransferTxData = (tx: any, data: any) => {
      return {instruction: data.instruction, amount: splToken.u64.fromBuffer(data.amount)}
    }
    const _txs = txs.map((tx: any) => {
      const _data = dataLayout.decode(tx.account.data)
      const { instruction, amount } = (_data.instruction && _data.instruction === 3) ? getTransferTxData(tx, _data) : {instruction:null, amount:null}
      const acc_info =''.concat(...tx.account.accounts.map((acc: any) => {
        return `(pubkey=${acc.pubkey.toString()}, isSigner=${acc.isSigner}) `
      }))
      const info = `programId=${tx.account.programId.toString()}, instruction=${instruction}, data=${amount}, accounts=${acc_info}, didExecute=${tx.account.didExecute}, didSign=${tx.account.signers}`
      return `${tx.publicKey.toString()}: ${info}\n`
    })
    const txsStr = '\n'.concat(..._txs)
    this.log(`got the following txs (total of ${txs.length}): `)
    this.log(txsStr)
  }
}
