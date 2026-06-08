"use client";

import { Users, Activity, MessageSquare, Flag, ClipboardList, CheckCircle, Zap, VolumeX, Ban, Trash2 } from "lucide-react";

const STATS = [
  { label: "Total Users", value: "0", icon: <Users className="w-6 h-6" />, color: "text-phantom-400" },
  { label: "Online Now", value: "0", icon: <Activity className="w-6 h-6" />, color: "text-success" },
  { label: "Messages Today", value: "0", icon: <MessageSquare className="w-6 h-6" />, color: "text-neon-cyan" },
  { label: "Open Reports", value: "0", icon: <Flag className="w-6 h-6" />, color: "text-neon-red" },
];

export default function AdminDashboard() {
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
            <p className={`text-3xl font-black ${stat.color}`}>{stat.value}</p>
            <p className="text-xs text-ghost-500 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Recent Reports */}
      <div className="glass-card p-6">
        <h2 className="text-lg font-semibold text-ghost-100 mb-4 flex items-center"><ClipboardList className="inline mr-2 w-5 h-5" /> Recent Reports</h2>
        <div className="text-center py-8">
          <CheckCircle className="w-10 h-10 mx-auto text-success mb-3" />
          <p className="text-ghost-400 text-sm">No open reports</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="glass-card p-6">
        <h2 className="text-lg font-semibold text-ghost-100 mb-4 flex items-center"><Zap className="inline mr-2 w-5 h-5 text-yellow-400" /> Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button className="btn-secondary text-sm py-3 flex items-center justify-center">
            <VolumeX className="inline mr-2 w-4 h-4" /> Mute User
          </button>
          <button className="btn-danger text-sm py-3 flex items-center justify-center">
            <Ban className="inline mr-2 w-4 h-4" /> Ban User
          </button>
          <button className="btn-secondary text-sm py-3 flex items-center justify-center">
            <Trash2 className="inline mr-2 w-4 h-4" /> Remove Message
          </button>
          <button className="btn-secondary text-sm py-3 flex items-center justify-center">
            <Users className="inline mr-2 w-4 h-4" /> Manage Communities
          </button>
        </div>
      </div>
    </div>
  );
}
