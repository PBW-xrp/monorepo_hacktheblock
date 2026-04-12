declare module "xrpl-connect" {
  export interface NetworkInfo {
    id: string;
    name: string;
    wss: string;
    rpc?: string;
    walletConnectId?: string;
  }

  export interface AccountInfo {
    address: string;
    publicKey?: string;
    network: NetworkInfo;
  }

  export interface WalletManagerOptions {
    adapters: WalletAdapter[];
    network: NetworkInfo | string;
    autoConnect?: boolean;
    logger?: { level: string };
  }

  export interface WalletAdapter {}

  export class CrossmarkAdapter implements WalletAdapter {}

  export class WalletManager {
    constructor(options: WalletManagerOptions);
    connect(walletId: string, options?: Record<string, unknown>): Promise<AccountInfo>;
    disconnect(): void;
    on(event: "connect", handler: (account: AccountInfo) => void): void;
    on(event: "disconnect", handler: () => void): void;
    on(event: "error", handler: (err: Error) => void): void;
    account: AccountInfo | null;
    connected: boolean;
  }

  export const STANDARD_NETWORKS: {
    mainnet: NetworkInfo;
    testnet: NetworkInfo;
    devnet: NetworkInfo;
  };
}
