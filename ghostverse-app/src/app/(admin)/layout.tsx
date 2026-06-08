"use client";

import { useAuth } from "../../custom-hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Shield, LayoutDashboard, Users, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

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
    <div className="min-h-screen bg-ghost-950 flex flex-col md:flex-row">
      {/* Sidebar Navigation */}
      <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-white/5 bg-ghost-900/30 flex flex-col">
        <div className="p-6 border-b border-white/5 flex items-center gap-3">
          <Shield className="w-6 h-6 text-neon-red" />
          <span className="text-lg font-bold text-neon-red">Admin Panel</span>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <Link
            href="/dashboard"
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
              pathname === "/dashboard" 
                ? "bg-phantom-500/10 text-phantom-400 border border-phantom-500/20" 
                : "text-ghost-400 hover:bg-ghost-800 hover:text-ghost-200"
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            Dashboard
          </Link>
          <Link
            href="/users"
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
              pathname === "/users" 
                ? "bg-phantom-500/10 text-phantom-400 border border-phantom-500/20" 
                : "text-ghost-400 hover:bg-ghost-800 hover:text-ghost-200"
            }`}
          >
            <Users className="w-5 h-5" />
            Manage Users
          </Link>
        </nav>

        <div className="p-4 border-t border-white/5">
          <button onClick={() => router.push("/world-chat")} className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-ghost-800 text-ghost-300 hover:bg-ghost-700 hover:text-white transition-colors text-sm font-bold">
            <ArrowLeft className="w-4 h-4" />
            Back to App
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
