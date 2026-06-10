import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "../custom-hooks/use-auth";
import { ThemeProvider } from "../custom-hooks/use-theme";
import type { Viewport } from "next";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#000000",
};

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

import { db } from "../lib/firebase-admin";
import { getAuthUser } from "../lib/auth";

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let isMaintenance = false;
  let isAdmin = false;

  try {
    const settingsDoc = await db.collection("settings").doc("global").get();
    if (settingsDoc.exists) {
      isMaintenance = settingsDoc.data()?.maintenanceMode || false;
    }
    if (isMaintenance) {
      const user = await getAuthUser();
      if (user && user.role === "ADMIN") {
        isAdmin = true;
      }
    }
  } catch (e) {
    console.error("Layout auth/settings fetch error", e);
  }

  const showMaintenance = isMaintenance && !isAdmin;

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var storedTheme = localStorage.getItem('theme');
                  var theme = storedTheme || 'dark';
                  document.documentElement.className = theme;
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="bg-ghost-950 text-ghost-100 antialiased">
        <ThemeProvider>
          {showMaintenance ? (
            <div className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center p-6 text-center animate-[fadeIn_0.5s_ease-out]">
              <div className="absolute inset-0 bg-grid opacity-20 pointer-events-none" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-500/10 blur-[150px] rounded-full pointer-events-none" />

              <div className="relative z-10 animate-[slideUp_0.5s_ease-out]">
                <div className="w-24 h-24 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/30 mx-auto mb-8 shadow-[0_0_50px_rgba(239,68,68,0.3)]">
                  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500 animate-pulse"><path d="M9 10h.01" /><path d="M15 10h.01" /><path d="M12 2a8 8 0 0 0-8 8v12l3-3 2.5 2.5L12 19l2.5 2.5L17 19l3 3V10a8 8 0 0 0-8-8z" /></svg>
                </div>
                <h1 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">GhostVerse is Offline</h1>
                <p className="text-xl text-gray-400 mb-8 max-w-lg mx-auto font-medium">
                  We are currently upgrading the realm with "God Mode" features. The servers will be back online shortly.
                </p>
                <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-zinc-900 border border-zinc-800 shadow-xl">
                  <span className="w-3 h-3 rounded-full bg-yellow-500 animate-pulse" />
                  <span className="text-sm font-bold text-gray-300 uppercase tracking-widest">Maintenance Mode Active</span>
                </div>
              </div>
            </div>
          ) : (
            <AuthProvider>{children}</AuthProvider>
          )}
        </ThemeProvider>
      </body>
    </html>
  );
}
