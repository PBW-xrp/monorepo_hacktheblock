import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VeraFi — Verifiable Options Pricing",
  description:
    "The first options market maker that publishes a cryptographic proof of honest pricing on-chain with every single quote.",
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
      <body className="bg-brand-bg text-brand-text antialiased">{children}</body>
    </html>
  );
}
