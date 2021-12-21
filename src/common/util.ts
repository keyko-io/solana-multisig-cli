import * as fs from 'fs';
import {
  Account,
  Connection,
  Keypair,
  Signer,
  PublicKey,
  Transaction,
  TransactionSignature,
  ConfirmOptions,
  RpcResponseAndContext,
  SimulatedTransactionResponse,
  sendAndConfirmTransaction } from "@solana/web3.js";
import { Program, Provider } from "@project-serum/anchor";
import MultisigIdl from "../idl";
import {initialState, networks} from "./types";
import {NodeWallet} from "./NodeWallet";
const path = require('path');
// @ts-ignore
import * as bs58 from "bs58";
// @ts-ignore
import * as bip39 from "bip39";
import { derivePath } from "ed25519-hd-key";

export function resolveHome(filepath: string) : string {
  return (filepath[0] === '~') ? path.join(process.env.HOME, filepath.slice(1)) : filepath
}

export function getNetwork(): any {
  if (process.env.SOL_NETWORK === "mainnet") {
    return networks.mainnet
  }
  if (process.env.SOL_NETWORK === "devnet") {
    return networks.devnet
  }
  if (process.env.SOL_NETWORK === "localhost") {
    return networks.localhost
  }

  return initialState.network

}

export function getWallet(walletFile: string | null) : NodeWallet {
  if (walletFile === null) {
    return new NodeWallet(Keypair.generate())
  }

  let secretKeyStr = fs.readFileSync(walletFile, 'utf8');
  return new NodeWallet(Keypair.fromSecretKey(Uint8Array.from(JSON.parse(secretKeyStr))));
}

export function getConnection() : Connection {
  const opts: ConfirmOptions = {preflightCommitment: "recent",commitment: "recent",};
  return new Connection(getNetwork().url, opts.preflightCommitment);
}

export function getProvider(walletFile: string | null) : Provider {
  const opts: ConfirmOptions = {
    preflightCommitment: "recent",
    commitment: "recent",
  };

  const connection = getConnection();
  const wallet = getWallet(walletFile);
  return new Provider(connection, wallet, opts);
}

export function getMultisigClient(walletFile: string | null) : Program {
  const multisigClient = new Program(
    MultisigIdl,
    getNetwork().multisigProgramId,
    getProvider(walletFile)
  );

  return multisigClient;
}

export function getWalletFromPhantomSeedWords(seedWords: string): NodeWallet {
  const seed = bip39.mnemonicToSeedSync(seedWords, "")
  const path = `m/44'/501'/0'/0'`;
  const keypair = Keypair.fromSeed(derivePath(path, seed.toString("hex")).key);
  // console.log(`${path} => ${keypair.publicKey.toBase58()}`);
  // console.log(`${keypair.publicKey.toBase58()}`)
  return new NodeWallet(keypair);
}

export function getWalletFromPhantomKey(privateKey: string): NodeWallet {
  const keypair = Keypair.fromSecretKey(bs58.decode(privateKey))
  // console.log(`pubkey is:  ${keypair.publicKey.toString()}`)
  return new NodeWallet(keypair);
}
