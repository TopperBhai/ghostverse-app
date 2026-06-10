"use client";

import { useState, useEffect, useRef, type ReactElement } from "react";
import { Bell, Users, MessageSquare, Star, CheckCheck, Trash2, X } from "lucide-react";
import { useAuth } from "../../custom-hooks/use-auth";
import Link from "next/link";

interface Notification {
  id: string;
  type: string;
  title: string;
  content: string;
  read: boolean;
  createdAt: string;
  data?: Record<string, unknown>;
}

const TYPE_ICON: Record<string, ReactElement> = {
  FRIEND_REQUEST: <Users className="w-4 h-4 text-blue-400" />,
  FRIEND_ACCEPTED: <Users className="w-4 h-4 text-green-400" />,
  NEW_MESSAGE: <MessageSquare className="w-4 h-4 text-phantom-400" />,
  MENTION: <MessageSquare className="w-4 h-4 text-fuchsia-400" />,
  COMMUNITY_ACTIVITY: <Star className="w-4 h-4 text-yellow-400" />,
  default: <Bell className="w-4 h-4 text-ghost-400" />,
};

export function NotificationDropdown() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const res = await fetch("/api/notifications?limit=15");
      const data = await res.json();
      if (data.success && data.data) {
        setNotifications(data.data);
      }
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 60000);
      return () => clearInterval(interval);
    }
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleOpen = () => {
    if (!isOpen) {
      setLoading(true);
      fetchNotifications().finally(() => setLoading(false));
    }
    setIsOpen(!isOpen);
  };

  const markAllRead = async () => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAll: true }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      console.error("Failed to mark all read:", err);
    }
  };

  const markRead = async (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
    } catch (err) {}
  };

  const formatTime = (isoString: string) => {
    const diff = Date.now() - new Date(isoString).getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (mins < 1) return "now";
    if (mins < 60) return `${mins}m`;
    if (hours < 24) return `${hours}h`;
    return `${days}d`;
  };

  if (!user) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleOpen}
        className="relative p-2 text-ghost-400 hover:text-ghost-100 hover:bg-white/5 rounded-full transition-all"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-phantom-500 text-white text-[9px] flex items-center justify-center font-bold border-2 border-ghost-950">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 max-w-[calc(100vw-24px)] glass-card shadow-2xl z-50 overflow-hidden flex flex-col max-h-[80vh] border border-ghost-700/50 animate-in slide-in-from-top-2 duration-200">
          <div className="p-3 border-b border-white/5 flex items-center justify-between bg-ghost-900/50">
            <h3 className="font-bold text-ghost-100 text-sm">Notifications</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button onClick={markAllRead} className="text-xs text-phantom-400 hover:text-phantom-300 font-medium px-2 py-1 rounded hover:bg-phantom-500/10 transition-colors">
                  Mark all read
                </button>
              )}
            </div>
          </div>

          <div className="overflow-y-auto flex-1 min-h-[100px] max-h-[400px]">
            {loading ? (
              <div className="flex justify-center p-8">
                <div className="w-6 h-6 border-2 border-phantom-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <Bell className="w-8 h-8 text-ghost-700 mb-2" />
                <p className="text-sm text-ghost-400">All caught up!</p>
              </div>
            ) : (
              <div className="divide-y divide-white/[0.03]">
                {notifications.map((notif) => {
                  const icon = TYPE_ICON[notif.type] ?? TYPE_ICON.default;
                  return (
                    <div
                      key={notif.id}
                      onClick={() => !notif.read && markRead(notif.id)}
                      className={`p-3 flex gap-3 hover:bg-white/5 transition-colors cursor-pointer ${
                        notif.read ? "opacity-75" : "bg-phantom-500/5"
                      }`}
                    >
                      <div className="flex-shrink-0 mt-0.5 relative">
                        <div className="w-8 h-8 rounded-full bg-ghost-800 flex items-center justify-center border border-white/5">
                          {icon}
                        </div>
                        {!notif.read && (
                          <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-phantom-500 rounded-full border-2 border-ghost-950" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm ${notif.read ? "text-ghost-300" : "text-ghost-100 font-medium"}`}>
                          {notif.title}
                        </p>
                        <p className="text-xs text-ghost-400 line-clamp-2 mt-0.5 leading-snug">
                          {notif.content}
                        </p>
                        <p className="text-[10px] text-ghost-500 mt-1.5 font-medium">
                          {formatTime(notif.createdAt)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          
          <Link 
            href="/notifications" 
            onClick={() => setIsOpen(false)}
            className="p-2.5 text-center text-xs font-medium text-ghost-400 hover:text-ghost-200 border-t border-white/5 bg-white/[0.02] hover:bg-white/5 transition-colors"
          >
            View all history
          </Link>
        </div>
      )}
    </div>
  );
}
