"use client";

import { createContext, useContext, useState, useCallback, useRef, useEffect, ReactNode } from "react";
import type { WalletManager, NetworkInfo } from "xrpl-connect";

// ---------------------------------------------------------------------------
// Groth5 devnet — custom network
// ---------------------------------------------------------------------------
const GROTH5: NetworkInfo = {
  id: "groth5",
  name: "Groth5 Devnet",
  wss: "wss://groth5.devnet.rippletest.net:51233",
  rpc: "https://groth5.devnet.rippletest.net",
  walletConnectId: "xrpl:groth5",
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export type WalletId = "otsu" | "crossmark" | "xaman";

export type WalletState =
  | { status: "idle" }
  | { status: "connecting"; wallet: WalletId }
  | { status: "connected"; wallet: WalletId; address: string }
  | { status: "error"; wallet: WalletId; message: string };

interface WalletContextValue {
  state: WalletState;
  connect: (walletId: WalletId) => Promise<void>;
  disconnect: () => void;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------
const WalletContext = createContext<WalletContextValue | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<WalletState>({ status: "idle" });
  const managerRef = useRef<WalletManager | null>(null);

  useEffect(() => {
    let manager: WalletManager;

    (async () => {
      const { WalletManager, CrossmarkAdapter } = await import("xrpl-connect");
      manager = new WalletManager({
        adapters: [new CrossmarkAdapter()],
        network: GROTH5,
        autoConnect: false,
      });

    manager.on("connect", (account) => {
      setState({ status: "connected", wallet: "crossmark", address: account.address });
    });

    manager.on("disconnect", () => {
      setState({ status: "idle" });
    });

    manager.on("error", (err: Error) => {
      setState((prev) => ({
        status: "error",
        wallet: prev.status === "connecting" ? prev.wallet : "crossmark",
        message: err.message,
      }));
    });

      managerRef.current = manager;
    })();

    return () => {
      managerRef.current?.disconnect();
    };
  }, []);

  const connect = useCallback(async (walletId: WalletId) => {
    setState({ status: "connecting", wallet: walletId });

    try {
      if (walletId === "otsu") {
        const provider = (window as any).xrpl;
        if (!provider?.isOtsu) {
          throw new Error("Otsu Wallet extension not found.");
        }
        const result = await provider.connect({ scopes: ["read", "sign", "submit"] });
        const address = result?.address;
        if (!address) throw new Error("Otsu did not return an address.");
        setState({ status: "connected", wallet: "otsu", address });

      } else if (walletId === "crossmark") {
        if (!managerRef.current) throw new Error("WalletManager not initialized.");
        const account = await managerRef.current.connect("crossmark");
        setState({ status: "connected", wallet: "crossmark", address: account.address });

      } else if (walletId === "xaman") {
        throw new Error("Xaman requires API key setup. Use Otsu or Crossmark for the demo.");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Connection failed.";
      setState({ status: "error", wallet: walletId, message });
    }
  }, []);

  const disconnect = useCallback(() => {
    managerRef.current?.disconnect();
    setState({ status: "idle" });
  }, []);

  return (
    <WalletContext.Provider value={{ state, connect, disconnect }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used inside <WalletProvider>");
  return ctx;
}
