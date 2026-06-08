"use client";

import { useState, useEffect } from "react";
import { Users, Activity, MessageSquare, Flag, Ghost, HeartHandshake } from "lucide-react";
import { useAuth } from "../../../custom-hooks/use-auth";

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    onlineUsers: 0,
    totalHaunts: 0,
    totalFriendships: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch("/api/admin/stats");
        const data = await res.json();
        if (data.success) {
          setStats(data.data);
        }
      } catch (err) {
        console.error("Failed to fetch admin stats:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const STATS = [
    { label: "Total Users", value: stats.totalUsers, icon: <Users className="w-6 h-6" />, color: "text-phantom-400" },
    { label: "Online Now", value: stats.onlineUsers, icon: <Activity className="w-6 h-6" />, color: "text-success" },
    { label: "Total Haunts", value: stats.totalHaunts, icon: <Ghost className="w-6 h-6" />, color: "text-neon-cyan" },
    { label: "Friendships", value: stats.totalFriendships, icon: <HeartHandshake className="w-6 h-6" />, color: "text-neon-red" },
  ];

  if (user?.role !== "ADMIN") return null;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-ghost-100">Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map((stat) => (
          <div key={stat.label} className="glass-card p-5">
            <div className="flex items-center justify-between mb-3 text-ghost-300">
              {stat.icon}
            </div>
            <p className={`text-3xl font-black ${stat.color}`}>
              {loading ? <span className="animate-pulse">--</span> : stat.value}
            </p>
            <p className="text-xs text-ghost-500 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
