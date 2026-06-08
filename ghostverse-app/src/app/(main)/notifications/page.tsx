"use client";

import { useState } from "react";

const SAMPLE_NOTIFICATIONS = [
  { id: "1", type: "friend_request", title: "New Friend Request", content: "ShadowKing wants to be your friend", time: "2m ago", read: false, icon: "👥" },
  { id: "2", type: "mention", title: "You were mentioned", content: "NeonDreamer mentioned you in World Chat", time: "15m ago", read: false, icon: "💬" },
  { id: "3", type: "reputation", title: "New Badge!", content: "MysticFox gave you ⭐ Helpful", time: "1h ago", read: false, icon: "⭐" },
  { id: "4", type: "friend_accepted", title: "Request Accepted", content: "CyberGhost accepted your friend request", time: "3h ago", read: true, icon: "✅" },
  { id: "5", type: "streak", title: "Streak Milestone!", content: "🔥 7-day streak with NightOwl!", time: "1d ago", read: true, icon: "🔥" },
  { id: "6", type: "community", title: "Community Activity", content: "New message in Gamers Lounge", time: "2d ago", read: true, icon: "🏠" },
];

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState(SAMPLE_NOTIFICATIONS);

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="flex flex-col h-[calc(100vh-56px)] md:h-screen">
      {/* Header */}
      <div className="glass-nav px-6 py-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🔔</span>
          <div>
            <h1 className="text-lg font-bold text-ghost-100">Notifications</h1>
            <p className="text-xs text-ghost-500">
              {unreadCount > 0 ? `${unreadCount} unread` : "All caught up!"}
            </p>
          </div>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="btn-ghost text-xs">
            Mark all read
          </button>
        )}
      </div>

      {/* Notification List */}
      <div className="flex-1 overflow-y-auto">
        {notifications.map((notif, i) => (
          <div
            key={notif.id}
            className={`flex items-start gap-4 px-6 py-4 border-b border-white/3 transition-colors hover:bg-white/3 page-enter ${
              !notif.read ? "bg-phantom-500/5" : ""
            }`}
            style={{ animationDelay: `${i * 0.03}s` }}
          >
            <span className="text-2xl flex-shrink-0 mt-0.5">{notif.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className={`text-sm font-medium ${!notif.read ? "text-ghost-100" : "text-ghost-300"}`}>
                  {notif.title}
                </p>
                {!notif.read && (
                  <span className="w-2 h-2 rounded-full bg-phantom-500 flex-shrink-0" />
                )}
              </div>
              <p className="text-xs text-ghost-500 mt-0.5">{notif.content}</p>
            </div>
            <span className="text-[10px] text-ghost-600 flex-shrink-0 mt-1">
              {notif.time}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
