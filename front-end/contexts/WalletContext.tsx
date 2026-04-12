"use client";

import { createContext, useContext, useState, useCallback, useRef, useEffect, ReactNode } from "react";
import type { WalletManager, NetworkInfo } from "xrpl-connect";

const GROTH5: NetworkInfo = {
  id: "groth5",
  name: "Groth5 Devnet",
  wss: "wss://groth5.devnet.rippletest.net:51233",
  rpc: "https://groth5.devnet.rippletest.net",
  walletConnectId: "xrpl:groth5",
};

const STORAGE_KEY = "verafi_wallet";

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

function saveToStorage(wallet: WalletId, address: string) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ wallet, address, ts: Date.now() }));
  } catch {}
}

function loadFromStorage(): { wallet: WalletId; address: string } | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    // Expire after 24h
    if (Date.now() - data.ts > 86400000) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return { wallet: data.wallet, address: data.address };
  } catch {
    return null;
  }
}

function clearStorage() {
  try { localStorage.removeItem(STORAGE_KEY); } catch {}
}

const WalletContext = createContext<WalletContextValue | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<WalletState>({ status: "idle" });
  const managerRef = useRef<WalletManager | null>(null);
  const didAutoReconnect = useRef(false);

  useEffect(() => {
    let manager: WalletManager;

    (async () => {
      const { WalletManager, CrossmarkAdapter } = await import("xrpl-connect");
      manager = new WalletManager({
        adapters: [new CrossmarkAdapter()],
        network: GROTH5,
        autoConnect: false,
      });

      manager.on("disconnect", () => {
        setState({ status: "idle" });
        clearStorage();
      });

      managerRef.current = manager;

      // Auto-reconnect from localStorage
      if (!didAutoReconnect.current) {
        didAutoReconnect.current = true;
        const saved = loadFromStorage();
        if (saved) {
          // For Otsu, verify extension is still connected
          if (saved.wallet === "otsu") {
            const provider = (window as any).xrpl;
            if (provider?.isOtsu) {
              try {
                const result = await provider.getAddress();
                const addr = result?.address;
                if (addr) {
                  setState({ status: "connected", wallet: "otsu", address: addr });
                  saveToStorage("otsu", addr);
                  return;
                }
              } catch {
                // Extension lost session, try reconnecting
                try {
                  const result = await provider.connect({ scopes: ["read", "sign", "submit"] });
                  if (result?.address) {
                    setState({ status: "connected", wallet: "otsu", address: result.address });
                    saveToStorage("otsu", result.address);
                    return;
                  }
                } catch {}
              }
            }
          }
          // For Crossmark, just restore the address — signAndSubmit will prompt anyway
          if (saved.wallet === "crossmark") {
            setState({ status: "connected", wallet: "crossmark", address: saved.address });
            return;
          }
          // Fallback: clear stale session
          clearStorage();
        }
      }
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
        saveToStorage("otsu", address);

      } else if (walletId === "crossmark") {
        if (!managerRef.current) throw new Error("WalletManager not initialized.");
        const account = await managerRef.current.connect("crossmark");
        setState({ status: "connected", wallet: "crossmark", address: account.address });
        saveToStorage("crossmark", account.address);

      } else if (walletId === "xaman") {
        throw new Error("Xaman requires API key setup. Use Otsu or Crossmark.");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Connection failed.";
      setState({ status: "error", wallet: walletId, message });
    }
  }, []);

  const disconnect = useCallback(() => {
    managerRef.current?.disconnect();
    clearStorage();
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
