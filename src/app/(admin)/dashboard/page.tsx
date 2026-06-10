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

type Tab = "USERS" | "TICKETS" | "BROADCAST" | "CONFESSIONS";

export default function AdminDashboard() {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [activeTab, setActiveTab] = useState<Tab>("USERS");
  const [stats, setStats] = useState({ totalUsers: 0, onlineUsers: 0, totalTickets: 0 });
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [messages, setMessages] = useState<WorldChatMessage[]>([]);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [pushTitle, setPushTitle] = useState("");
  const [pushBody, setPushBody] = useState("");
  const [pushImage, setPushImage] = useState("");
  const [isPushing, setIsPushing] = useState(false);
  const [inspectUser, setInspectUser] = useState<any>(null);
  const [isInspecting, setIsInspecting] = useState(false);
  const [confessions, setConfessions] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [statsRes, usersRes, settingsRes] = await Promise.all([
          fetch("/api/admin/stats"),
          fetch("/api/admin/users"),
          fetch("/api/admin/settings")
        ]);
        const statsData = await statsRes.json();
        const usersData = await usersRes.json();
        const settingsData = await settingsRes.json();
        
        if (statsData.success) setStats(prev => ({ ...prev, totalUsers: statsData.data.totalUsers }));
        if (usersData.success) setUsers(usersData.data);
        if (settingsData.success) setMaintenanceMode(settingsData.data.maintenanceMode);
      } catch (err) {
        console.error(err);
      }
    };
    loadData();
  }, []);

  const toggleMaintenance = async () => {
    const newState = !maintenanceMode;
    setMaintenanceMode(newState);
    try {
      await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ maintenanceMode: newState })
      });
      alert(`Maintenance Mode is now ${newState ? 'ON' : 'OFF'}`);
    } catch (err) {
      console.error(err);
      setMaintenanceMode(!newState);
    }
  };

  useEffect(() => {
    if (activeTab === "CONFESSIONS") {
      fetch("/api/confessions?limit=100")
        .then(res => res.json())
        .then(data => {
          if (data.success) setConfessions(data.data);
        });
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === "TICKETS") {
      fetch("/api/admin/tickets")
        .then(res => res.json())
        .then(data => {
          if (data.success) setTickets(data.data);
        });
    }
  }, [activeTab]);

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

  const handleBroadcast = () => {
    if (!broadcastMessage.trim() || !socket || !user) return;
    socket.emit("world:send-message", {
      id: crypto.randomUUID(),
      content: `[SYSTEM_ALERT] ${broadcastMessage}`,
      createdAt: new Date(),
      sender: {
        id: user.id,
        username: "SYSTEM",
        displayName: "GhostVerse System",
        avatar: null,
      }
    });
    setBroadcastMessage("");
    alert("Broadcast sent to all online users!");
  };

  const handlePushBroadcast = async () => {
    if (!pushTitle.trim() || !pushBody.trim()) {
      alert("Push Title and Body are required.");
      return;
    }
    
    setIsPushing(true);
    try {
      const res = await fetch("/api/admin/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          title: pushTitle, 
          body: pushBody, 
          imageUrl: pushImage || undefined 
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        setPushTitle("");
        setPushBody("");
        setPushImage("");
      } else {
        alert("Push failed: " + data.error);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to send push broadcast");
    } finally {
      setIsPushing(false);
    }
  };

  const handleInspectUser = async (userId: string) => {
    setIsInspecting(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}`);
      const data = await res.json();
      if (data.success) {
        setInspectUser(data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleGamificationOverride = async (action: string) => {
    if (!inspectUser) return;
    
    let amount;
    if (action === "ADD_DUST") {
      const input = prompt("Enter amount of Ghost Dust to add:");
      if (!input) return;
      amount = parseInt(input, 10);
      if (isNaN(amount) || amount <= 0) {
        alert("Invalid amount");
        return;
      }
    }

    try {
      // If it's ADD_DUST, we route it to the general users API since it's on the root user doc
      const url = action === "ADD_DUST" ? "/api/admin/users" : `/api/admin/users/${inspectUser.id}`;
      const payload = action === "ADD_DUST" 
        ? { userId: inspectUser.id, action, amount }
        : { action };

      const res = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        alert(`Success: ${data.message}`);
        handleInspectUser(inspectUser.id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteConfession = async (id: string) => {
    if (!confirm("Nuke this confession?")) return;
    try {
      const res = await fetch(`/api/admin/confessions/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setConfessions(prev => prev.filter(c => c.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleResolveTicket = async (ticketId: string, action: string) => {
    try {
      const res = await fetch("/api/admin/tickets", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketId, action })
      });
      const data = await res.json();
      if (data.success) {
        setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status: action } : t));
      }
    } catch (err) {
      console.error(err);
    }
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
            onClick={toggleMaintenance}
            className={`flex items-center gap-2 px-4 py-2 rounded text-xs font-bold transition-all ${maintenanceMode ? "bg-red-500 hover:bg-red-600 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)]" : "bg-[#064e3b] hover:bg-[#047857] text-[#34d399]"}`}
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
            onClick={() => setActiveTab("CONFESSIONS")}
            className={`px-4 py-2 text-sm font-bold rounded transition-colors ${activeTab === "CONFESSIONS" ? "bg-[#8b5cf6] text-white" : "text-gray-500 hover:text-gray-300"}`}
          >
            Confessions Mod
          </button>
          <button 
            onClick={() => setActiveTab("TICKETS")}
            className={`px-4 py-2 text-sm font-bold rounded transition-colors ${activeTab === "TICKETS" ? "bg-[#8b5cf6] text-white" : "text-gray-500 hover:text-gray-300"}`}
          >
            Support Tickets
          </button>
          <button 
            onClick={() => setActiveTab("BROADCAST")}
            className={`px-4 py-2 text-sm font-bold rounded transition-colors ${activeTab === "BROADCAST" ? "bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.3)]" : "text-gray-500 hover:text-red-400"}`}
          >
            Broadcast
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
                            <button onClick={() => handleInspectUser(u.id)} className="px-3 py-1.5 text-[10px] font-bold rounded bg-[#4c1d95] text-[#ddd6fe] hover:bg-[#5b21b6] transition-colors uppercase">Inspect</button>
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
          <div className="bg-[#18181b] rounded-lg shadow-lg border border-[#27272a] overflow-hidden flex flex-col min-h-[600px]">
            <div className="p-4 border-b border-[#27272a] flex items-center justify-between">
              <h2 className="font-bold text-white text-lg">Support & Report Tickets</h2>
              <button onClick={() => setActiveTab("TICKETS")} className="px-3 py-1.5 bg-[#27272a] hover:bg-[#3f3f46] text-xs font-bold rounded text-gray-300 transition-colors">Refresh</button>
            </div>
            
            <div className="p-6 grid gap-4">
              {tickets.map(ticket => (
                <div key={ticket.id} className="bg-[#09090b] border border-[#27272a] rounded-lg p-5 flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${ticket.status === 'RESOLVED' ? 'bg-[#064e3b] text-[#34d399]' : ticket.status === 'REJECTED' ? 'bg-[#7f1d1d] text-[#f87171]' : 'bg-[#78350f] text-[#fbbf24]'}`}>
                        {ticket.status || 'OPEN'}
                      </span>
                      <span className="text-gray-500 text-xs font-bold uppercase">{ticket.category || "General"}</span>
                      <span className="text-gray-600 text-xs">{new Date(ticket.createdAt).toLocaleString()}</span>
                    </div>
                    <h3 className="text-white font-bold text-lg mb-2">{ticket.subject || "No Subject"}</h3>
                    <p className="text-gray-400 text-sm mb-4 leading-relaxed bg-[#18181b] p-3 rounded-md border border-[#27272a]">{ticket.description}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>Reported By: <span className="text-white font-mono">{ticket.reporterId || "Unknown"}</span></span>
                      {ticket.targetId && (
                        <>
                          <span>•</span>
                          <span>Target User: <span className="text-red-400 font-mono">{ticket.targetId}</span></span>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex md:flex-col gap-2 min-w-[140px]">
                    {ticket.status !== 'RESOLVED' && (
                      <button 
                        onClick={() => handleResolveTicket(ticket.id, 'RESOLVED')}
                        className="flex-1 px-4 py-2 bg-[#064e3b] hover:bg-[#047857] text-[#34d399] hover:text-white text-xs font-bold rounded transition-colors shadow-lg"
                      >
                        Resolve
                      </button>
                    )}
                    {ticket.status !== 'REJECTED' && (
                      <button 
                        onClick={() => handleResolveTicket(ticket.id, 'REJECTED')}
                        className="flex-1 px-4 py-2 bg-[#27272a] hover:bg-[#3f3f46] text-gray-400 hover:text-white text-xs font-bold rounded transition-colors"
                      >
                        Reject
                      </button>
                    )}
                    {ticket.targetId && (
                      <button 
                        onClick={() => handleInspectUser(ticket.targetId)}
                        className="flex-1 px-4 py-2 mt-2 border border-[#4c1d95] bg-[#4c1d95]/10 hover:bg-[#4c1d95] text-[#a78bfa] hover:text-white text-xs font-bold rounded transition-all"
                      >
                        Inspect Target
                      </button>
                    )}
                  </div>
                </div>
              ))}
              
              {tickets.length === 0 && (
                <div className="text-center text-gray-500 font-medium py-20 flex flex-col items-center">
                  <div className="w-16 h-16 rounded-full bg-[#18181b] flex items-center justify-center mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-600"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
                  </div>
                  <p>No active support tickets found.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "BROADCAST" && (
          <div className="flex flex-col gap-8 max-w-2xl mx-auto">
            {/* World Chat Broadcast */}
            <div className="bg-[#18181b] rounded-lg p-10 shadow-lg border border-red-500/20">
              <h2 className="text-2xl font-black text-white mb-2 flex items-center gap-3">
                <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></span>
                World Chat System Alert
              </h2>
              <p className="text-gray-400 text-sm mb-8">Send an overriding system alert to all online users. This will appear as a highly visible [SYSTEM_ALERT] in the World Chat.</p>
              
              <textarea 
                value={broadcastMessage}
                onChange={(e) => setBroadcastMessage(e.target.value)}
                placeholder="Enter your system announcement here..."
                className="w-full h-32 bg-[#09090b] border border-[#27272a] rounded-lg p-4 text-white focus:outline-none focus:border-red-500 resize-none mb-6"
              />
              
              <button 
                onClick={handleBroadcast}
                className="w-full py-4 bg-red-500 hover:bg-red-600 text-white font-black rounded-lg transition-all shadow-[0_0_20px_rgba(239,68,68,0.3)] active:scale-[0.98]"
              >
                SEND CHAT BROADCAST
              </button>
            </div>

            {/* Push Notification Broadcast */}
            <div className="bg-[#18181b] rounded-lg p-10 shadow-lg border border-phantom-500/20">
              <h2 className="text-2xl font-black text-white mb-2 flex items-center gap-3">
                <span className="w-3 h-3 rounded-full bg-phantom-500 animate-pulse"></span>
                Global Push Notification
              </h2>
              <p className="text-gray-400 text-sm mb-8">Send a real system push notification (lock screen / desktop) to all users who have enabled notifications.</p>
              
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Notification Title</label>
                  <input 
                    type="text"
                    value={pushTitle}
                    onChange={(e) => setPushTitle(e.target.value)}
                    placeholder="e.g., Massive GhostVerse Update!"
                    className="w-full bg-[#09090b] border border-[#27272a] rounded-lg p-3 text-white focus:outline-none focus:border-phantom-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Message Body</label>
                  <textarea 
                    value={pushBody}
                    onChange={(e) => setPushBody(e.target.value)}
                    placeholder="e.g., Check out the new avatar decorations in the shop!"
                    className="w-full h-24 bg-[#09090b] border border-[#27272a] rounded-lg p-3 text-white focus:outline-none focus:border-phantom-500 resize-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Image URL (Optional)</label>
                  <input 
                    type="text"
                    value={pushImage}
                    onChange={(e) => setPushImage(e.target.value)}
                    placeholder="https://..."
                    className="w-full bg-[#09090b] border border-[#27272a] rounded-lg p-3 text-white focus:outline-none focus:border-phantom-500"
                  />
                </div>
              </div>
              
              <button 
                onClick={handlePushBroadcast}
                disabled={isPushing}
                className="w-full py-4 bg-phantom-500 hover:bg-phantom-600 text-white font-black rounded-lg transition-all shadow-[0_0_20px_rgba(168,85,247,0.3)] active:scale-[0.98] disabled:opacity-50"
              >
                {isPushing ? "SENDING..." : "SEND PUSH NOTIFICATION"}
              </button>
            </div>
          </div>
        )}

        {activeTab === "CONFESSIONS" && (
          <div className="bg-[#18181b] rounded-lg shadow-lg border border-[#27272a] overflow-hidden flex flex-col h-[600px]">
            <div className="p-4 border-b border-[#27272a] flex items-center justify-between">
              <h2 className="font-bold text-white text-lg">Confessions Moderation Feed</h2>
              <span className="text-xs font-bold text-gray-500 bg-[#27272a] px-3 py-1 rounded">Latest 100</span>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {confessions.map((c) => (
                <div key={c.id} className="bg-[#09090b] border border-[#27272a] rounded-lg p-5 hover:border-[#3f3f46] transition-colors relative group">
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => handleDeleteConfession(c.id)}
                      className="px-4 py-1.5 bg-[#7f1d1d] hover:bg-[#991b1b] text-[#f87171] hover:text-white text-xs font-bold rounded shadow-lg transition-colors uppercase tracking-wider"
                    >
                      Nuke
                    </button>
                  </div>
                  <p className="text-gray-300 font-medium pr-20 leading-relaxed">{c.content}</p>
                  <div className="flex items-center gap-4 mt-4 text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                    <span>{new Date(c.createdAt).toLocaleString()}</span>
                    <span>♥ {c.likes} Likes</span>
                    <span className="font-mono text-[#a78bfa]">Author: {c.authorId || "Unknown"}</span>
                  </div>
                </div>
              ))}
              {confessions.length === 0 && (
                <div className="text-center text-gray-500 font-medium py-10">No confessions found.</div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Inspect User Modal */}
      {isInspecting && inspectUser && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-8 max-w-2xl w-full shadow-2xl relative animate-[slideUp_0.2s_ease-out]">
            <button onClick={() => setIsInspecting(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors">✕</button>
            <h2 className="text-2xl font-black text-white mb-6 flex items-center gap-2">
              Inspect User: <span className="text-[#a78bfa]">@{inspectUser.username}</span>
            </h2>
            
            <div className="grid grid-cols-2 gap-6 mb-8">
              <div className="bg-[#09090b] p-5 rounded-lg border border-[#27272a]">
                <h3 className="text-[#a78bfa] font-bold text-sm mb-4 border-b border-[#27272a] pb-2">Core Info</h3>
                <p className="text-sm text-gray-400 mb-2">Display Name: <span className="text-white ml-2">{inspectUser.displayName}</span></p>
                <p className="text-sm text-gray-400 mb-2">ID: <span className="text-white ml-2 text-[10px] font-mono">{inspectUser.id}</span></p>
                <p className="text-sm text-gray-400 mb-2">Role: <span className="text-white ml-2">{inspectUser.role}</span></p>
                <p className="text-sm text-gray-400">Status: <span className="text-white ml-2">{inspectUser.status}</span></p>
              </div>
              
              <div className="bg-[#09090b] p-5 rounded-lg border border-[#27272a]">
                <h3 className="text-[#34d399] font-bold text-sm mb-4 border-b border-[#27272a] pb-2">Gamification Profile</h3>
                <p className="text-sm text-gray-400 mb-2">XP: <span className="text-white ml-2 font-bold">{inspectUser.profile?.xp || 0}</span></p>
                <p className="text-sm text-gray-400 mb-2">Current Streak: <span className="text-white ml-2 font-bold">{inspectUser.profile?.currentStreak || 0}</span></p>
                <p className="text-sm text-gray-400 mb-2">Ghost Level: <span className="text-white ml-2 font-bold">{inspectUser.profile?.ghostEvolutionLevel || 1}</span></p>
                <p className="text-sm text-gray-400">Karma: <span className="text-white ml-2 font-bold">{inspectUser.profile?.karma || 0}</span></p>
              </div>
            </div>
            
            <h3 className="text-white font-bold text-sm mb-4">God Mode Actions</h3>
            <div className="flex gap-4 mb-4">
              <button onClick={() => handleGamificationOverride("GRANT_XP")} className="flex-1 py-3 bg-[#4c1d95] hover:bg-[#5b21b6] text-white font-bold rounded-lg shadow-lg text-sm transition-colors">Grant 1000 XP</button>
              <button onClick={() => handleGamificationOverride("FORCE_EVOLVE")} className="flex-1 py-3 bg-[#064e3b] hover:bg-[#047857] text-white font-bold rounded-lg shadow-lg text-sm transition-colors">Force Evolve Pet</button>
              <button onClick={() => handleGamificationOverride("RESET_STREAK")} className="flex-1 py-3 bg-[#7f1d1d] hover:bg-[#991b1b] text-white font-bold rounded-lg shadow-lg text-sm transition-colors">Reset Streak</button>
            </div>
            <div className="flex gap-4">
              <button onClick={() => handleGamificationOverride("ADD_DUST")} className="flex-1 py-3 bg-[#1e1b4b] border border-[#a78bfa] hover:bg-[#2e1065] text-[#ddd6fe] font-bold rounded-lg shadow-lg text-sm transition-colors flex items-center justify-center gap-2">
                <span>✦</span> Add Ghost Dust
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
