import { PublicKey } from "@solana/web3.js";
import * as saber from "@saberhq/stableswap-sdk";
import * as splToken from "@solana/spl-token";

export const DEFAULT_PUB_KEY = new PublicKey("11111111111111111111111111111111");

export type State = {
  common: CommonState;
};

export type CommonState = {
  walletProvider?: string;
  isWalletConnected: boolean;
  network: Network;
};

export const networks: Networks = {
  mainnet: {
    // Cluster.
    label: "Mainnet Beta",
    url: "https://solana-api.projectserum.com",
    explorerClusterSuffix: "",
    multisigProgramId: new PublicKey(
      "msigmtwzgXJHj2ext4XJjCDmpbcMuufFb5cHuwg6Xdt"
    ),
    multisigUpgradeAuthority: new PublicKey(
      "3uztpEgUmvirDBYRXgDamUDZiU5EcgTwArQ2pULtHJPC"
    ),
  },
  devnet: {
    // Cluster.
    label: "Devnet",
    url: "https://api.devnet.solana.com",
    explorerClusterSuffix: "devnet",
    multisigProgramId: new PublicKey(
      "81u91ekry3qovR9Pn7tAYKBRRYffkgnK3hS4ygq3bbHo"
    ),
    multisigUpgradeAuthority: new PublicKey(
      "EPJ42Bi719xTVB2T2v2NfJQSkdPdL3WmRXpX877FZVf5"
      // "D1gcX4mCZo5aB2WAKmyC4a5ZWyN8yB9GfuXBkH9K9P2z"
    ),
  },
  // Fill in with your local cluster addresses.
  localhost: {
    // Cluster.
    label: "Localhost",
    url: "http://localhost:8899",
    explorerClusterSuffix: "localhost",
    multisigProgramId: new PublicKey(
      "9z7Pq56To96qbVLzuBcf47Lc7u8uUWZh6k5rhcaTsDjz"
    ),
  },
};

export const saberSwapIds = {
  program_id: "SSwpkEEcbUqx4vtoEByFjSkhKdCT862DNVb52nZg1UZ",
  admin_account: "GSmjrpT8zNtp6Ke8y2xS5P1kREEjqZCjwxF8VbxDJAV8",
  upgrade_authority: "GSmjrpT8zNtp6Ke8y2xS5P1kREEjqZCjwxF8VbxDJAV8",
  mints: {
    usdc: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    usdt:"Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
    wusdc:"FVsXUnbhifqJ4LiXQEbpUtXVdB8T5ADLKqSs5t1oc54F",
    wusdt:"9w97GdWUYYaamGwdKMKZgGzPduZJkiFizq4rz5CPXRv2",

  }
}

export const stableSwapConfig: saber.StableSwapConfig = {
  swapAccount: new PublicKey("VeNkoB1HvSP6bSeGybQDnx9wTWFsQb2NBCemeCDSuKL"),
  /**
   * Authority
   */
  authority: new PublicKey("72E8LfHqoxQCxnxmBbDG6WSHnDx1rWPUHNKwYvoL5qDm"),
  /**
   * Program Identifier for the Swap program
   */
  swapProgramID: new PublicKey("SSwpkEEcbUqx4vtoEByFjSkhKdCT862DNVb52nZg1UZ"),
  /**
   * Program Identifier for the Token program
   */
  tokenProgramID: splToken.TOKEN_PROGRAM_ID

}

export const poolTokens = {
  usdc_usdt: {
    swapAccount: "VeNkoB1HvSP6bSeGybQDnx9wTWFsQb2NBCemeCDSuKL",
    authority: "72E8LfHqoxQCxnxmBbDG6WSHnDx1rWPUHNKwYvoL5qDm",
    poolToken: "YakofBo4X3zMxa823THQJwZ8QeoU8pxPdFdxJs7JW57",
    tokenA: "2tWC4JAdL4AxEFJySziYJfsAnW2MHKRo98vbAPiRDSk8", // USDC
    tokenB: "EJwZgeZrdC8TXTQbQBoL6bfuAnFUUy1PVCMB4DYPzVaS", // USDT

  },

}

export const initialState: State = {
  common: {
    isWalletConnected: false,
    walletProvider: "https://www.sollet.io",
    network: networks.devnet,
  },
};

type Networks = { [label: string]: Network };

export type Network = {
  // Cluster.
  label: string;
  url: string;
  explorerClusterSuffix: string;
  multisigProgramId: PublicKey;
  multisigUpgradeAuthority?: PublicKey;
};

