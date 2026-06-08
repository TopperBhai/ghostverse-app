"use client";

import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Shield } from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || user.role !== "ADMIN")) {
      router.push("/world-chat");
    }
  }, [user, loading, router]);

  if (loading || !user || user.role !== "ADMIN") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ghost-950">
        <div className="w-10 h-10 border-2 border-phantom-500 border-t-transparent rounded-full" style={{ animation: "spin 1s linear infinite" }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ghost-950">
      {/* Admin top bar */}
      <div className="glass-nav px-6 py-3 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <Shield className="w-6 h-6 text-neon-red" />
          <span className="text-lg font-bold text-neon-red">Admin Panel</span>
        </div>
        <button onClick={() => router.push("/world-chat")} className="btn-ghost text-sm">
          ← Back to App
        </button>
      </div>
      {children}
    </div>
  );
}
