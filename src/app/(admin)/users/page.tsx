"use client";

import { useState, useEffect } from "react";
import { Users, Ban, VolumeX, Trash2, CheckCircle, Loader2, Sparkles } from "lucide-react";
import { useAuth } from "../../../custom-hooks/use-auth";

type AdminUser = {
  id: string;
  username: string;
  displayName: string;
  role: string;
  status: string;
  createdAt: string;
  lastSeen?: string;
};

export default function AdminUsersPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch("/api/admin/users");
        const data = await res.json();
        if (data.success) {
          setUsers(data.data);
        }
      } catch (err) {
        console.error("Failed to fetch users:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const handleAction = async (userId: string, action: string) => {
    if (action === "DELETE" && !confirm("Are you sure you want to permanently delete this user? This cannot be undone.")) {
      return;
    }
    
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

    setActionLoading(userId);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action, amount }),
      });
      const data = await res.json();
      
      if (data.success) {
        if (action === "DELETE") {
          setUsers(prev => prev.filter(u => u.id !== userId));
        } else if (action === "ADD_DUST") {
          alert(data.message);
        } else {
          setUsers(prev => prev.map(u => {
            if (u.id === userId) {
              return { ...u, status: action === "BAN" ? "BANNED" : action === "MUTE" ? "MUTED" : "ACTIVE" };
            }
            return u;
          }));
        }
      } else {
        alert(data.error || "Failed to perform action");
      }
    } catch (err) {
      alert("Network error");
    } finally {
      setActionLoading(null);
    }
  };

  if (user?.role !== "ADMIN") return null;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-ghost-100 flex items-center gap-2">
        <Users className="w-6 h-6 text-phantom-400" />
        Manage Users
      </h1>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-ghost-300">
            <thead className="bg-ghost-900/50 text-xs uppercase text-ghost-500 font-bold border-b border-white/5">
              <tr>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Joined</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-phantom-500" />
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-ghost-500">
                    No users found.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-ghost-100">{u.displayName}</span>
                        <span className="text-xs text-ghost-500">@{u.username}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold tracking-wider uppercase ${u.role === "ADMIN" ? "bg-phantom-500/20 text-phantom-400 border border-phantom-500/30" : "bg-ghost-800 text-ghost-400"}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold tracking-wider uppercase ${u.status === "BANNED" ? "bg-neon-red/20 text-neon-red border border-neon-red/30" : u.status === "MUTED" ? "bg-amber-500/20 text-amber-500 border border-amber-500/30" : "bg-success/20 text-success border border-success/30"}`}>
                        {u.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-ghost-500">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      {u.role !== "ADMIN" && (
                        <>
                          <button
                            onClick={() => handleAction(u.id, "ADD_DUST")}
                            disabled={actionLoading === u.id}
                            className="p-2 rounded-lg bg-phantom-500/10 text-phantom-400 hover:bg-phantom-500/20 transition-colors"
                            title="Add Ghost Dust"
                          >
                            <Sparkles className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleAction(u.id, u.status === "MUTED" ? "UNMUTE" : "MUTE")}
                            disabled={actionLoading === u.id}
                            className={`p-2 rounded-lg transition-colors ${u.status === "MUTED" ? "bg-success/10 text-success hover:bg-success/20" : "bg-amber-500/10 text-amber-500 hover:bg-amber-500/20"}`}
                            title={u.status === "MUTED" ? "Unmute" : "Mute"}
                          >
                            {actionLoading === u.id ? <Loader2 className="w-4 h-4 animate-spin" /> : u.status === "MUTED" ? <CheckCircle className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => handleAction(u.id, u.status === "BANNED" ? "UNBAN" : "BAN")}
                            disabled={actionLoading === u.id}
                            className={`p-2 rounded-lg transition-colors ${u.status === "BANNED" ? "bg-success/10 text-success hover:bg-success/20" : "bg-neon-red/10 text-neon-red hover:bg-neon-red/20"}`}
                            title={u.status === "BANNED" ? "Unban" : "Ban"}
                          >
                            {actionLoading === u.id ? <Loader2 className="w-4 h-4 animate-spin" /> : u.status === "BANNED" ? <CheckCircle className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => handleAction(u.id, "DELETE")}
                            disabled={actionLoading === u.id}
                            className="p-2 rounded-lg bg-ghost-800 text-ghost-400 hover:text-neon-red hover:bg-neon-red/10 transition-colors"
                            title="Delete Permanently"
                          >
                            {actionLoading === u.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
