import type { Metadata } from "next";
import "./globals.css";
import { WalletProvider } from "@/contexts/WalletContext";
import SmoothScrollProvider from "@/components/SmoothScrollProvider";
import ScrollProgress from "@/components/ScrollProgress";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "VeraFi — ZK Options on XRPL",
  description:
    "The first decentralized options protocol on XRPL. Black-Scholes pricing verified on-chain via Boundless ZK proofs. No vault, no intermediary, no trust assumption.",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-32.png", type: "image/png", sizes: "32x32" },
    ],
    apple: "/favicon-32.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-brand-bg text-brand-text antialiased">
        <WalletProvider>
          <Navbar />
          <ScrollProgress />
          <SmoothScrollProvider>
            <div className="pt-16">{children}</div>
          </SmoothScrollProvider>
        </WalletProvider>
      </body>
    </html>
  );
}
