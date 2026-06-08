import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/custom-hooks/use-auth";

export const metadata: Metadata = {
  title: "GhostVerse — Anonymous Social Platform",
  description:
    "Meet strangers, make friends, and chat privately without revealing your identity. Join the most engaging anonymous social network.",
  keywords: [
    "anonymous chat",
    "random chat",
    "social network",
    "anonymous",
    "ghostverse",
    "meet strangers",
    "private messaging",
  ],
  authors: [{ name: "GhostVerse" }],
  openGraph: {
    title: "GhostVerse — Anonymous Social Platform",
    description: "Meet strangers, make friends, chat anonymously.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-ghost-950 text-ghost-100 antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
