"use client";

import { useAuth } from "@/custom-hooks/useAuth";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Globe, Dices, MessageSquare, Users, VenetianMask, Bell, Ghost, Settings, User as UserIcon, LogOut, Menu } from "lucide-react";

const NAV_ITEMS = [
  { href: "/world-chat", icon: <Globe className="w-5 h-5" />, label: "World Chat" },
  { href: "/random-chat", icon: <Dices className="w-5 h-5" />, label: "Random Voice" },
  { href: "/messages", icon: <MessageSquare className="w-5 h-5" />, label: "Messages" },
  { href: "/friends", icon: <Users className="w-5 h-5" />, label: "Friends" },
  { href: "/confessions", icon: <VenetianMask className="w-5 h-5" />, label: "Confessions" },
  { href: "/notifications", icon: <Bell className="w-5 h-5" />, label: "Notifications" },
];

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ghost-950">
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-12 h-12 border-2 border-phantom-500 border-t-transparent rounded-full"
            style={{ animation: "spin 1s linear infinite" }}
          />
          <p className="text-ghost-400 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-ghost-950 flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:sticky top-0 left-0 h-screen w-[260px] glass-sidebar z-50 flex flex-col transition-transform duration-300 ease-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Logo */}
        <div className="px-5 py-5 flex items-center gap-3 border-b border-white/5">
          <div className="w-8 h-8 rounded-xl bg-phantom-600/20 border border-phantom-500/30 flex items-center justify-center">
            <Ghost className="w-5 h-5 text-phantom-400" />
          </div>
          <span className="text-lg font-black gradient-text tracking-tight">GhostVerse</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-3">
          <div className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 relative ${
                    isActive
                      ? "bg-phantom-500/12 text-phantom-300"
                      : "text-ghost-400 hover:text-ghost-200 hover:bg-white/5"
                  }`}
                >
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-phantom-400 rounded-r-full" />
                  )}
                  <span className={`flex items-center justify-center w-6 transition-colors ${isActive ? "text-phantom-400" : ""}`}>{item.icon}</span>
                  <span>{item.label}</span>
                  {item.href === "/notifications" && (
                    <span className="ml-auto w-5 h-5 rounded-full bg-phantom-500 text-white text-xs flex items-center justify-center font-bold">
                      3
                    </span>
                  )}
                </Link>
              );
            })}
          </div>


        </nav>

        {/* User Section */}
        <div className="p-3 border-t border-white/5 relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/5 transition-all duration-200"
          >
            <div className="relative">
              <div className="avatar avatar-sm">
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.displayName}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <span className="gradient-text font-black">{user.displayName.charAt(0)}</span>
                )}
              </div>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-success rounded-full border-2 border-ghost-950" />
            </div>
            <div className="flex-1 text-left min-w-0">
              <p className="text-sm font-medium text-ghost-100 truncate">
                {user.displayName}
              </p>
              <p className="text-xs text-ghost-500 truncate">@{user.username}</p>
            </div>
            <Settings className="w-4 h-4 text-ghost-500" />
          </button>

          {/* User dropdown menu */}
          {showUserMenu && (
            <div className="absolute bottom-full left-3 right-3 mb-2 glass-card p-2 z-50 animate-slide-up shadow-2xl border border-ghost-700/50">
              <div className="px-3 py-2 mb-1 border-b border-ghost-800">
                <p className="text-xs font-semibold text-ghost-200 truncate">{user.displayName}</p>
                <p className="text-[10px] text-ghost-500 truncate">@{user.username}</p>
              </div>
              <Link
                href={`/profile/${user.username}`}
                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 text-sm text-ghost-300 transition-colors"
                onClick={() => setShowUserMenu(false)}
              >
                <UserIcon className="w-4 h-4" /> My Profile
              </Link>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-error/10 text-sm text-neon-red transition-colors mt-1 border-t border-ghost-800"
              >
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-h-screen">
        {/* Mobile top bar */}
        <header className="glass-nav sticky top-0 z-30 md:hidden px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-ghost-300 hover:text-ghost-100 transition-colors p-1"
            aria-label="Open menu"
          >
            <Menu className="w-6 h-6" />
          </button>
          <Ghost className="w-5 h-5 text-phantom-400" />
          <span className="font-bold gradient-text text-sm">GhostVerse</span>
        </header>

        {/* Page content */}
        <div className="flex-1 page-enter">{children}</div>
      </main>
    </div>
  );
}
