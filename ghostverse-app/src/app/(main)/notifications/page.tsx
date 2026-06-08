"use client";

import { useState, useEffect, type ReactElement } from "react";
import { Bell, Users, MessageSquare, Star, Check, CheckCheck } from "lucide-react";
import { useAuth } from "../../../custom-hooks/use-auth";

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

export default function NotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await fetch("/api/notifications?limit=30");
        const data = await res.json();
        if (data.success && data.data) {
          setNotifications(data.data);
        }
      } catch (err) {
        console.error("Failed to fetch notifications:", err);
      } finally {
        setLoading(false);
      }
    };

    if (user) fetchNotifications();
  }, [user]);

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
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
    } catch (err) {
      console.error("Failed to mark read:", err);
    }
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <div className="flex flex-col h-[calc(100vh-56px)] md:h-screen">
      {/* Header */}
      <div className="glass-nav px-4 md:px-6 py-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-phantom-600/20 border border-phantom-500/30 flex items-center justify-center">
            <Bell className="w-5 h-5 text-phantom-400" />
          </div>
          <div>
            <h1 className="text-base md:text-lg font-bold text-ghost-100">Notifications</h1>
            <p className="text-xs text-ghost-500">
              {loading ? "Loading..." : unreadCount > 0 ? `${unreadCount} unread` : "All caught up!"}
            </p>
          </div>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="flex items-center gap-1.5 text-xs text-ghost-400 hover:text-phantom-400 transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Mark all read</span>
          </button>
        )}
      </div>

      {/* Notification List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center p-12">
            <div className="w-7 h-7 border-2 border-phantom-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-6 py-16">
            <div className="w-16 h-16 rounded-2xl bg-ghost-900/80 border border-ghost-800 flex items-center justify-center mb-4">
              <Bell className="w-8 h-8 text-ghost-600" />
            </div>
            <h3 className="text-base font-semibold text-ghost-300 mb-1">No notifications yet</h3>
            <p className="text-sm text-ghost-600 max-w-xs">
              Friend requests, messages, and updates will appear here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.03]">
            {notifications.map((notif, i) => {
              const icon = TYPE_ICON[notif.type] ?? TYPE_ICON.default;
              return (
                <button
                  key={notif.id}
                  onClick={() => markRead(notif.id)}
                  className={`w-full flex items-start gap-3 px-4 md:px-6 py-4 text-left transition-all hover:bg-white/[0.025] page-enter ${
                    !notif.read ? "bg-phantom-500/[0.04]" : ""
                  }`}
                  style={{ animationDelay: `${Math.min(i, 15) * 0.03}s` }}
                >
                  <div className={`w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center mt-0.5 border ${
                    !notif.read 
                      ? "bg-phantom-500/15 border-phantom-500/30" 
                      : "bg-ghost-900/80 border-ghost-800"
                  }`}>
                    {icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className={`text-sm font-semibold truncate ${!notif.read ? "text-ghost-100" : "text-ghost-300"}`}>
                        {notif.title}
                      </p>
                      {!notif.read && (
                        <span className="w-1.5 h-1.5 rounded-full bg-phantom-400 flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-ghost-500 line-clamp-2 leading-relaxed">
                      {notif.content}
                    </p>
                  </div>
                  <span className="text-[10px] text-ghost-600 flex-shrink-0 mt-1 whitespace-nowrap">
                    {formatTime(notif.createdAt)}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
