"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../../custom-hooks/use-auth";
import { useSocket } from "../../../custom-hooks/use-socket";
import type { WorldChatMessage } from "../../../types";

type AdminUser = {
  id: string;
  username: string;
  displayName: string;
  role: string;
  status: string;
  createdAt: string;
};

type Tab = "USERS" | "TICKETS";

export default function AdminDashboard() {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [activeTab, setActiveTab] = useState<Tab>("USERS");
  const [stats, setStats] = useState({ totalUsers: 0, onlineUsers: 0, totalTickets: 0 });
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [messages, setMessages] = useState<WorldChatMessage[]>([]);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch stats and users
  useEffect(() => {
    const loadData = async () => {
      try {
        const [statsRes, usersRes] = await Promise.all([
          fetch("/api/admin/stats"),
          fetch("/api/admin/users")
        ]);
        const statsData = await statsRes.json();
        const usersData = await usersRes.json();
        if (statsData.success) setStats(prev => ({ ...prev, totalUsers: statsData.data.totalUsers }));
        if (usersData.success) setUsers(usersData.data);
      } catch (err) {
        console.error(err);
      }
    };
    loadData();
  }, []);

  // Socket
  useEffect(() => {
    if (!socket) return;
    socket.emit("world:join");
    socket.on("world:history" as any, (history: WorldChatMessage[]) => setMessages(history));
    socket.on("world:message", (msg) => setMessages(prev => [...prev, msg]));
    socket.on("world:online-count", (count) => setStats(prev => ({ ...prev, onlineUsers: count })));
    socket.on("world:message-deleted" as any, (data: any) => setMessages(prev => prev.filter(m => m.id !== data.messageId)));
    return () => {
      socket.off("world:history" as any);
      socket.off("world:message");
      socket.off("world:online-count");
      socket.off("world:message-deleted" as any);
      socket.emit("world:leave");
    };
  }, [socket]);

  const handleAction = async (userId: string, action: string) => {
    if (action === "DELETE" && !confirm("Are you sure you want to delete this user?")) return;
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action }),
      });
      const data = await res.json();
      if (data.success) {
        if (action === "DELETE") {
          setUsers(prev => prev.filter(u => u.id !== userId));
        } else {
          setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: action === "BAN" ? "BANNED" : action === "MUTE" ? "MUTED" : "ACTIVE" } : u));
        }
      }
    } catch {}
  };

  const handleDeleteMessage = (msgId: string) => {
    if (socket) socket.emit("world:delete-message" as any, { messageId: msgId });
    setMessages(prev => prev.filter(m => m.id !== msgId));
  };

  if (user?.role !== "ADMIN") return null;

  const filteredUsers = users.filter(u => u.username.toLowerCase().includes(searchQuery.toLowerCase()) || u.displayName.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="min-h-screen bg-[#09090b] text-gray-200 p-8 font-sans">
      {/* Top Nav */}
      <div className="flex items-center justify-between mb-8 max-w-7xl mx-auto">
        <h1 className="text-xl font-black tracking-tight">
          <span className="text-[#a78bfa]">GhostVerse</span> <span className="text-white">Admin Panel</span>
        </h1>
        <div className="flex items-center gap-6">
          <button 
            onClick={() => setMaintenanceMode(!maintenanceMode)}
            className="flex items-center gap-2 px-4 py-2 rounded bg-[#064e3b] text-[#34d399] text-xs font-bold transition-all hover:bg-[#047857]"
          >
            Maintenance Mode: {maintenanceMode ? "ON (Turn OFF)" : "OFF (Turn ON)"}
          </button>
          <div className="text-sm flex items-center">
            <span className="text-gray-400">Welcome, </span>
            <span className="font-bold text-white ml-1">{user.username}</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#4c1d95] text-[#ddd6fe] uppercase ml-3">ADMIN</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          <div className="bg-[#18181b] rounded-lg p-8 flex flex-col items-center justify-center shadow-lg">
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-2">Total Users</span>
            <span className="text-4xl font-black text-[#a78bfa]">{stats.totalUsers || "0"}</span>
          </div>
          <div className="bg-[#18181b] rounded-lg p-8 flex flex-col items-center justify-center shadow-lg">
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-2">Online Users</span>
            <span className="text-4xl font-black text-[#a78bfa]">{stats.onlineUsers || "0"}</span>
          </div>
          <div className="bg-[#18181b] rounded-lg p-8 flex flex-col items-center justify-center shadow-lg">
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-2">Total Tickets</span>
            <span className="text-4xl font-black text-white">{stats.totalTickets || "-"}</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-4 border-b border-[#27272a] mb-6 pb-2">
          <button 
            onClick={() => setActiveTab("USERS")}
            className={`px-4 py-2 text-sm font-bold rounded transition-colors ${activeTab === "USERS" ? "bg-[#8b5cf6] text-white" : "text-gray-500 hover:text-gray-300"}`}
          >
            Users & Settings
          </button>
          <button 
            onClick={() => setActiveTab("TICKETS")}
            className={`px-4 py-2 text-sm font-bold rounded transition-colors ${activeTab === "TICKETS" ? "bg-[#8b5cf6] text-white" : "text-gray-500 hover:text-gray-300"}`}
          >
            Support Tickets
          </button>
        </div>

        {/* Content */}
        {activeTab === "USERS" && (
          <div className="grid grid-cols-[1fr_400px] gap-6 h-[600px]">
            {/* Manage Users */}
            <div className="bg-[#18181b] rounded-lg flex flex-col overflow-hidden shadow-lg">
              <div className="p-4 border-b border-[#27272a] flex items-center justify-between">
                <h2 className="font-bold text-white text-lg">Manage Users</h2>
                <button onClick={() => window.location.reload()} className="px-3 py-1.5 bg-[#27272a] hover:bg-[#3f3f46] text-xs font-bold rounded text-gray-300 transition-colors">Refresh</button>
              </div>
              
              <div className="p-4 border-b border-[#27272a] flex items-center gap-3">
                <input 
                  type="text" 
                  placeholder="Enter username..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 bg-[#09090b] border border-[#27272a] rounded px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#a78bfa] placeholder-gray-600"
                />
                <button className="px-5 py-2.5 bg-[#3f3f46] hover:bg-[#52525b] text-red-500 text-sm font-bold rounded transition-colors">Ban</button>
                <div className="w-10 h-10 bg-[#ef4444] rounded flex-shrink-0 hover:bg-red-600 cursor-pointer transition-colors" title="Quick Action" />
              </div>

              <div className="flex-1 overflow-y-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[#18181b] text-gray-400 text-xs font-medium border-b border-[#27272a]">
                    <tr>
                      <th className="px-6 py-4 font-bold">User</th>
                      <th className="px-4 py-4 font-bold">Role</th>
                      <th className="px-4 py-4 font-bold">Status</th>
                      <th className="px-4 py-4 font-bold">Joined</th>
                      <th className="px-6 py-4 font-bold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#27272a]">
                    {filteredUsers.map(u => (
                      <tr key={u.id} className="hover:bg-[#27272a]/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-bold text-white text-sm">{u.displayName}</div>
                          <div className="text-[10px] text-gray-500 mt-0.5">@{u.username}</div>
                        </td>
                        <td className="px-4 py-4">
                          <span className={`px-2.5 py-1 rounded text-[10px] font-bold ${u.role === "ADMIN" ? "bg-[#4c1d95] text-[#ddd6fe]" : "bg-[#27272a] text-gray-400"}`}>{u.role}</span>
                        </td>
                        <td className="px-4 py-4">
                          <span className={`px-2.5 py-1 rounded text-[10px] font-bold ${u.status === "ACTIVE" ? "bg-[#064e3b] text-[#34d399]" : u.status === "MUTED" ? "bg-[#78350f] text-[#fbbf24]" : "bg-[#7f1d1d] text-[#f87171]"}`}>{u.status}</span>
                        </td>
                        <td className="px-4 py-4 text-xs text-gray-400 font-medium">
                          {new Date(u.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button onClick={() => handleAction(u.id, u.status === "BANNED" ? "UNBAN" : "BAN")} className="px-3 py-1.5 text-[10px] font-bold rounded bg-[#78350f] text-[#fbbf24] hover:bg-[#92400e] transition-colors uppercase">Ban</button>
                            <button onClick={() => handleAction(u.id, u.status === "MUTED" ? "UNMUTE" : "MUTE")} className="px-3 py-1.5 text-[10px] font-bold rounded bg-[#78350f] text-[#fbbf24] hover:bg-[#92400e] transition-colors uppercase">Mute</button>
                            <button onClick={() => handleAction(u.id, "DELETE")} className="px-3 py-1.5 text-[10px] font-bold rounded bg-[#7f1d1d] text-[#f87171] hover:bg-[#991b1b] transition-colors uppercase">Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* World Chat Monitor */}
            <div className="bg-[#18181b] rounded-lg flex flex-col overflow-hidden shadow-lg">
              <div className="p-4 border-b border-[#27272a] flex items-center justify-between">
                <h2 className="font-bold text-white text-lg">World Chat Monitor</h2>
                <button onClick={() => window.location.reload()} className="px-3 py-1.5 bg-[#27272a] hover:bg-[#3f3f46] text-xs font-bold rounded text-gray-300 transition-colors">Refresh</button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.slice().reverse().map(msg => (
                  <div key={msg.id} className="bg-[#09090b] border border-[#27272a] rounded p-3 hover:border-[#3f3f46] transition-colors group">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-white">{msg.sender.displayName}</span>
                        <span className="text-[10px] text-gray-500">@{msg.sender.username}</span>
                      </div>
                      <button onClick={() => handleDeleteMessage(msg.id)} className="text-[10px] font-bold bg-[#7f1d1d] text-[#f87171] px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[#991b1b]">Delete</button>
                    </div>
                    <p className="text-sm text-gray-300 break-words">{msg.content}</p>
                  </div>
                ))}
                {messages.length === 0 && <p className="text-center text-sm text-gray-500 mt-10 font-medium">No messages in history.</p>}
              </div>
            </div>
          </div>
        )}

        {activeTab === "TICKETS" && (
          <div className="bg-[#18181b] rounded-lg p-20 flex flex-col items-center justify-center text-center shadow-lg">
            <h2 className="text-xl font-bold text-white mb-2">Support Tickets</h2>
            <p className="text-gray-500 text-sm">No active support tickets found in the database.</p>
          </div>
        )}
      </div>
    </div>
  );
}
