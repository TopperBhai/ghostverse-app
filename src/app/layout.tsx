import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "../custom-hooks/use-auth";
import { ThemeProvider } from "../custom-hooks/use-theme";

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
            <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
              <h1 className="text-4xl font-bold text-phantom-500 mb-4">Under Maintenance</h1>
              <p className="text-ghost-400 max-w-md">
                GhostVerse is currently undergoing scheduled maintenance and upgrades. 
                We&apos;ll be back shortly! Thanks for your patience.
              </p>
            </div>
          ) : (
            <AuthProvider>{children}</AuthProvider>
          )}
        </ThemeProvider>
      </body>
    </html>
  );
}
