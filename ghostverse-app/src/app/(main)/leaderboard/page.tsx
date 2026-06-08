"use client";

import { useState, useEffect } from "react";
import { Trophy, Medal, Award, TrendingUp, Ghost } from "lucide-react";
import { getGhostLevel } from "../../../lib/levels";
import Link from "next/link";

interface LeaderboardUser {
  id: string;
  username: string;
  displayName: string;
  avatar: string | null;
  reputationScore: number;
}

export default function LeaderboardPage() {
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const res = await fetch("/api/leaderboard");
        const data = await res.json();
        if (data.success) {
          setUsers(data.data);
        }
      } catch (err) {
        console.error("Failed to fetch leaderboard", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

  return (
    <div className="flex-1 overflow-y-auto w-full p-4 md:p-8">
      <div className="max-w-4xl mx-auto mt-4 animate-fade-in">
        
        {/* Header */}
        <div className="text-center mb-12 relative">
          <div className="w-20 h-20 mx-auto bg-phantom-500/20 rounded-full flex items-center justify-center mb-4 border border-phantom-500/30">
            <Trophy className="w-10 h-10 text-phantom-400" />
          </div>
          <h1 className="text-4xl font-black text-white mb-3 tracking-tight">Ghost Leaderboard</h1>
          <p className="text-ghost-400 max-w-lg mx-auto">
            Top players ranked by Reputation. Upvote helpful or funny messages in the World Chat to boost your friends' scores.
          </p>
        </div>

        {/* Top 3 Podium */}
        {!loading && users.length >= 3 && (
          <div className="flex items-end justify-center gap-2 md:gap-6 mb-16 h-64">
            {/* 2nd Place */}
            <div className="flex flex-col items-center w-1/3 animate-fade-in" style={{ animationDelay: "100ms" }}>
              <div className="relative mb-4">
                <div className="absolute -inset-1 bg-gradient-to-b from-gray-300 to-transparent rounded-full opacity-50 blur-sm" />
                <img src={users[1]?.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=fallback"} alt={users[1]?.displayName} className="w-20 h-20 rounded-full border-4 border-gray-300 object-cover relative z-10" />
                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-gray-300 text-gray-900 w-8 h-8 rounded-full flex items-center justify-center font-bold border-2 border-ghost-950 z-20">2</div>
              </div>
              <Link href={`/profile/${users[1]?.username}`} className="font-bold text-white text-lg hover:underline truncate w-full text-center">{users[1]?.displayName}</Link>
              <span className="text-sm text-gray-300 flex items-center gap-1 font-semibold mt-1">
                <Ghost className="w-3.5 h-3.5" /> {users[1]?.reputationScore}
              </span>
            </div>

            {/* 1st Place */}
            <div className="flex flex-col items-center w-1/3 animate-fade-in z-10" style={{ transform: "translateY(-2rem)" }}>
              <div className="relative mb-4">
                <div className="absolute -inset-2 bg-gradient-to-b from-yellow-400 to-transparent rounded-full opacity-60 blur-md animate-pulse" />
                <img src={users[0]?.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=fallback"} alt={users[0]?.displayName} className="w-28 h-28 rounded-full border-4 border-yellow-400 object-cover relative z-10" />
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-yellow-400 text-yellow-950 w-10 h-10 rounded-full flex items-center justify-center font-black text-xl border-4 border-ghost-950 z-20 shadow-[0_0_15px_rgba(250,204,21,0.5)]">1</div>
              </div>
              <Link href={`/profile/${users[0]?.username}`} className="font-bold text-white text-xl hover:underline truncate w-full text-center text-yellow-400">{users[0]?.displayName}</Link>
              <div className="flex flex-col items-center mt-1">
                <span className="text-sm font-bold text-yellow-400">{getGhostLevel(users[0]?.reputationScore || 0).title}</span>
                <span className="text-base text-yellow-200 flex items-center gap-1 font-black mt-1 bg-yellow-900/40 px-3 py-1 rounded-full border border-yellow-500/30">
                  <Ghost className="w-4 h-4" /> {users[0]?.reputationScore}
                </span>
              </div>
            </div>

            {/* 3rd Place */}
            <div className="flex flex-col items-center w-1/3 animate-fade-in" style={{ animationDelay: "200ms" }}>
              <div className="relative mb-4">
                <div className="absolute -inset-1 bg-gradient-to-b from-amber-600 to-transparent rounded-full opacity-50 blur-sm" />
                <img src={users[2]?.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=fallback"} alt={users[2]?.displayName} className="w-20 h-20 rounded-full border-4 border-amber-600 object-cover relative z-10" />
                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-amber-600 text-amber-950 w-8 h-8 rounded-full flex items-center justify-center font-bold border-2 border-ghost-950 z-20">3</div>
              </div>
              <Link href={`/profile/${users[2]?.username}`} className="font-bold text-white text-lg hover:underline truncate w-full text-center">{users[2]?.displayName}</Link>
              <span className="text-sm text-amber-500 flex items-center gap-1 font-semibold mt-1">
                <Ghost className="w-3.5 h-3.5" /> {users[2]?.reputationScore}
              </span>
            </div>
          </div>
        )}

        {/* List */}
        <div className="glass-panel rounded-2xl overflow-hidden border border-white/5">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-phantom-500/30 border-t-phantom-500 rounded-full animate-spin mb-4" />
              <p className="text-ghost-400 font-medium">Summoning spirits...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-20 text-ghost-400">
              No users found. Be the first to earn reputation!
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {users.slice(3).map((u, i) => {
                const rank = i + 4;
                const level = getGhostLevel(u.reputationScore);
                return (
                  <div key={u.id} className="flex items-center gap-4 p-4 hover:bg-white/5 transition-colors group">
                    <div className="w-8 text-center font-bold text-ghost-500">{rank}</div>
                    
                    <Link href={`/profile/${u.username}`} className="flex items-center gap-4 flex-1 min-w-0">
                      <img src={u.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=fallback"} alt={u.displayName} className="w-12 h-12 rounded-full object-cover group-hover:ring-2 ring-phantom-500 transition-all" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2">
                          <h3 className="text-white font-bold truncate group-hover:text-phantom-400 transition-colors">{u.displayName}</h3>
                          <span className="text-xs text-ghost-500 truncate">@{u.username}</span>
                        </div>
                        <p className={`text-xs font-semibold ${level.color} flex items-center gap-1`}>
                          {level.badgeIcon} {level.title}
                        </p>
                      </div>
                    </Link>

                    <div className="text-right">
                      <div className="text-lg font-black text-white flex items-center justify-end gap-1.5">
                        {u.reputationScore} <Ghost className="w-4 h-4 text-phantom-500" />
                      </div>
                      <p className="text-[10px] uppercase tracking-wider text-ghost-500 font-bold">Reputation</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
