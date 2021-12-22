import {MultisigInstance} from '../multisig-instance'
import * as BufferLayout from 'buffer-layout'
import * as splToken from '@solana/spl-token'
import {BaseCommand} from '../common/base-command'

const uint64 = (property = 'uint64') => {
  return BufferLayout.blob(8, property)
}

export default class ListTx extends BaseCommand {
  static description = 'List all transactions for the given multisig account.'

  static examples = [
    `$ sol-multisig listTx -m DbnEfsCR6gSk2Doqr8chiS8Uus2sizUn4H8zg6iU7Lkr
`,
  ]

  static flags = {
    ...BaseCommand.allFlags,
  }

  static args = []

  static getTransferTxData = (tx: any, data: any) => {
    return {instruction: data.instruction, amount: splToken.u64.fromBuffer(data.amount)}
  }

  async run() {
    const {args, flags} = this.parse(ListTx)

    const multisigInst: MultisigInstance = await this.getMultisigInstance(flags, args)
    this.log(`getting transactions list from multisig \
      "${multisigInst.multisig}" at program "${multisigInst.multisigClient.programId}"`)
    const txs = await multisigInst.getPendingTransactions()
    const dataLayout = BufferLayout.struct([
      BufferLayout.u8('instruction'),
      uint64('amount'),
    ])

    const _txs = txs.map((tx: any, i: number) => {
      const _data = dataLayout.decode(tx.account.data)
      const {instruction, amount} = (_data.instruction && _data.instruction === 3) ?
        ListTx.getTransferTxData(tx, _data) : {instruction: null, amount: null}
      const accInfo = ''.concat(...tx.account.accounts.map((acc: any) => {
        return `(pubkey=${acc.pubkey.toString()}, isSigner=${acc.isSigner}) `
      }))
      const info = `programId=${tx.account.programId.toString()}, instruction=${instruction}, \
        data=${amount}, accounts=${accInfo}, didExecute=${tx.account.didExecute}, \
        didSign=${tx.account.signers}`
      return `${i + 1} -- ${tx.publicKey.toString()} : ${info}\n`
    })
    const txsStr = '\n######## ' + _txs.join('\n######## ')
    this.log(`got the following txs (total of ${txs.length}): `)
    this.log(txsStr)
  }
}
