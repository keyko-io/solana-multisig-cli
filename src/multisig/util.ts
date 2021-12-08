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
import {initialState} from "./types";
import {NodeWallet} from "./NodeWallet";
const path = require('path');
// Based on this solution: https://www.reddit.com/r/KinFoundation/comments/j7qejf/quick_guide_on_converting_kin_keypair_ready_for/
// @ts-ignore
import hexTo32 from 'hex-to-32'
// @ts-ignore
import atob from 'atob'
// @ts-ignore
import bs58 from 'bs58'


export function resolveHome(filepath: string) : string {
  return (filepath[0] === '~') ? path.join(process.env.HOME, filepath.slice(1)) : filepath
}

export function getNetwork(): any {
  return initialState.common.network

}

export function getWallet(walletFile: string | null) : NodeWallet {
  if (walletFile === null) {
    return new NodeWallet(Keypair.generate())
  }

  let secretKeyStr = fs.readFileSync(walletFile, 'utf8');
  return new NodeWallet(Keypair.fromSecretKey(Uint8Array.from(JSON.parse(secretKeyStr))));
}

export function getConnection() : Connection {
  const opts: ConfirmOptions = {
    preflightCommitment: "recent",
    commitment: "recent",
  };
  return new Connection(initialState.common.network.url, opts.preflightCommitment);
}

export function getProvider(walletFile: string | null) : Provider {
  const opts: ConfirmOptions = {
    preflightCommitment: "recent",
    commitment: "recent",
  };

  const network = getNetwork();
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
