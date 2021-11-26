// import {getMultisigClient} from "./util";
// import {Transaction} from "@solana/web3.js";
//
// const BPF_LOADER_UPGRADEABLE_PID = new PublicKey(
//   "BPFLoaderUpgradeab1e11111111111111111111111"
// );
//
//
// export function getTokenTransferSighash() : string {
//
//   return createTxSighash('Transfer', 'global')
// }
//
// export function createTxSighash(name: string, scope: string) : string {
//   const txSighash = getMultisigClient().coder.sighash(
//     "global",
//     "set_owners"
//   );
//   return txSighash.toString()
// }
//
// export function getTxSighash(transaction: any) : string {
//   return transaction.account.data.slice(0, 8).toString()
// }
