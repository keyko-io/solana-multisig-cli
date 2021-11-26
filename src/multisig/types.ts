import { PublicKey } from "@solana/web3.js";

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
      "D1gcX4mCZo5aB2WAKmyC4a5ZWyN8yB9GfuXBkH9K9P2z"
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

