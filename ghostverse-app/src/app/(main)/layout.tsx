"use client";

import { useAuth } from "../../custom-hooks/use-auth";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Globe, Dices, MessageSquare, Users, VenetianMask, Bell, Ghost, Settings, User as UserIcon, LogOut, Menu, X } from "lucide-react";

const NAV_ITEMS = [
  { href: "/world-chat", icon: Globe, label: "World Chat" },
  { href: "/random-chat", icon: Dices, label: "Random Voice" },
  { href: "/messages", icon: MessageSquare, label: "Messages" },
  { href: "/friends", icon: Users, label: "Friends" },
  { href: "/confessions", icon: VenetianMask, label: "Confessions" },
  { href: "/notifications", icon: Bell, label: "Notifications" },
  { href: "/support", icon: MessageSquare, label: "Support & Report" },
];

// Mobile bottom nav shows only top 5 (most used)
const MOBILE_NAV = [
  { href: "/world-chat", icon: Globe, label: "World" },
  { href: "/messages", icon: MessageSquare, label: "Messages" },
  { href: "/friends", icon: Users, label: "Friends" },
  { href: "/confessions", icon: VenetianMask, label: "Confessions" },
  { href: "/notifications", icon: Bell, label: "Alerts" },
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
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  // Close sidebar and user menu on route change
  useEffect(() => {
    setSidebarOpen(false);
    setShowUserMenu(false);
  }, [pathname]);

  // Fetch real notification count
  const fetchNotifCount = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch("/api/notifications?limit=50");
      const data = await res.json();
      if (data.success && data.data) {
        const unread = data.data.filter((n: any) => !n.read).length;
        setUnreadNotifCount(unread);
      }
    } catch {}
  }, [user]);

  useEffect(() => {
    fetchNotifCount();
    // Refresh count every 60s
    const interval = setInterval(fetchNotifCount, 60000);
    return () => clearInterval(interval);
  }, [fetchNotifCount]);

  // Clear count when visiting notifications
  useEffect(() => {
    if (pathname === "/notifications") {
      setUnreadNotifCount(0);
    }
  }, [pathname]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ghost-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-phantom-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-ghost-400 text-sm">Loading GhostVerse...</p>
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
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar (desktop always visible, mobile as drawer) */}
      <aside
        className={`fixed md:sticky top-0 left-0 h-screen w-[260px] glass-sidebar z-50 flex flex-col transition-transform duration-300 ease-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Logo */}
        <div className="px-5 py-5 flex items-center justify-between border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-phantom-600/20 border border-phantom-500/30 flex items-center justify-center">
              <Ghost className="w-5 h-5 text-phantom-400" />
            </div>
            <span className="text-lg font-black gradient-text tracking-tight">GhostVerse</span>
          </div>
          {/* Close button on mobile */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden text-ghost-500 hover:text-ghost-200 transition-colors p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-3">
          <div className="space-y-0.5">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 relative group ${
                    isActive
                      ? "bg-phantom-500/12 text-phantom-300"
                      : "text-ghost-400 hover:text-ghost-200 hover:bg-white/5"
                  }`}
                >
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-phantom-400 rounded-r-full" />
                  )}
                  <span className={`flex items-center justify-center w-6 transition-colors ${isActive ? "text-phantom-400" : "group-hover:text-ghost-200"}`}>
                    <Icon className="w-5 h-5" />
                  </span>
                  <span className="flex-1">{item.label}</span>
                  {item.href === "/notifications" && unreadNotifCount > 0 && (
                    <span className="ml-auto min-w-[20px] h-5 rounded-full bg-phantom-500 text-white text-[10px] flex items-center justify-center font-bold px-1.5">
                      {unreadNotifCount > 99 ? "99+" : unreadNotifCount}
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
            <Settings className="w-4 h-4 text-ghost-500 flex-shrink-0" />
          </button>

          {/* User dropdown menu */}
          {showUserMenu && (
            <div className="absolute bottom-full left-3 right-3 mb-2 glass-card p-2 z-50 shadow-2xl border border-ghost-700/50 animate-fade-in">
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
              <Link
                href={`/settings`}
                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 text-sm text-ghost-300 transition-colors mt-1"
                onClick={() => setShowUserMenu(false)}
              >
                <Settings className="w-4 h-4" /> Account Settings
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
      <main className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Mobile top bar */}
        <header className="glass-nav sticky top-0 z-30 md:hidden px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-ghost-400 hover:text-ghost-100 transition-colors p-1"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <Ghost className="w-5 h-5 text-phantom-400" />
          <span className="font-bold gradient-text text-sm flex-1">GhostVerse</span>
          {/* Notification bell shortcut on mobile */}
          <Link href="/notifications" className="relative p-1 text-ghost-400 hover:text-ghost-200 transition-colors">
            <Bell className="w-5 h-5" />
            {unreadNotifCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-phantom-500 text-white text-[9px] flex items-center justify-center font-bold">
                {unreadNotifCount > 9 ? "9+" : unreadNotifCount}
              </span>
            )}
          </Link>
        </header>

        {/* Page content — extra bottom padding on mobile for bottom nav */}
        <div className="flex-1 pb-16 md:pb-0 overflow-hidden">{children}</div>

        {/* Mobile Bottom Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 z-30 md:hidden bg-ghost-950/95 backdrop-blur-xl border-t border-white/5">
          <div className="flex items-stretch">
            {MOBILE_NAV.map((item) => {
              const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex-1 flex flex-col items-center justify-center pt-2.5 pb-3 gap-1 relative transition-colors ${
                    isActive ? "text-phantom-400" : "text-ghost-500 hover:text-ghost-300"
                  }`}
                >
                  {isActive && (
                    <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-phantom-400 rounded-full" />
                  )}
                  <div className="relative">
                    <Icon className="w-5 h-5" />
                    {item.href === "/notifications" && unreadNotifCount > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 rounded-full bg-phantom-500 text-white text-[8px] flex items-center justify-center font-bold">
                        {unreadNotifCount > 9 ? "9+" : unreadNotifCount}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-medium">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </main>
    </div>
  );
}
