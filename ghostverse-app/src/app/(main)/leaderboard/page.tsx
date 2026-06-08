"use client";

import { useState, useEffect } from "react";
import { Trophy, Flame, Ghost, Medal } from "lucide-react";
import { getGhostLevel } from "../../../lib/levels";
import Link from "next/link";

interface LeaderboardUser {
  id: string;
  username: string;
  displayName: string;
  avatar: string | null;
  reputationScore: number;
  hauntStreak: number;
}

type Tab = "reputation" | "streak";

export default function LeaderboardPage() {
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("reputation");

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/leaderboard?type=${activeTab}`);
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
  }, [activeTab]);

  const isRep = activeTab === "reputation";
  const Icon = isRep ? Ghost : Flame;
  const TopIcon = isRep ? Trophy : Flame;

  return (
    <div className="flex-1 overflow-y-auto w-full p-4 md:p-8">
      <div className="max-w-4xl mx-auto mt-4 animate-fade-in">
        
        {/* Header & Tabs */}
        <div className="text-center mb-10 relative">
          <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-6 border transition-colors duration-500 ${isRep ? 'bg-yellow-500/20 border-yellow-500/30' : 'bg-orange-500/20 border-orange-500/30'}`}>
            <TopIcon className={`w-10 h-10 ${isRep ? 'text-yellow-400' : 'text-orange-500'}`} />
          </div>
          <h1 className="text-4xl font-black text-white mb-6 tracking-tight">Ghost Leaderboard</h1>
          
          {/* Segmented Control */}
          <div className="inline-flex items-center p-1 bg-ghost-900 border border-white/10 rounded-full mb-4 shadow-inner">
            <button 
              onClick={() => setActiveTab("reputation")}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-300 ${isRep ? 'bg-yellow-500 text-yellow-950 shadow-[0_0_15px_rgba(234,179,8,0.4)]' : 'text-ghost-400 hover:text-white'}`}
            >
              <Trophy className="w-4 h-4" /> Top Reputation
            </button>
            <button 
              onClick={() => setActiveTab("streak")}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-300 ${!isRep ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-[0_0_15px_rgba(249,115,22,0.4)]' : 'text-ghost-400 hover:text-white'}`}
            >
              <Flame className="w-4 h-4" /> Top Streaks
            </button>
          </div>
          
          <p className="text-ghost-400 max-w-lg mx-auto mt-2 h-10 text-sm">
            {isRep 
              ? "Ranked by total Reputation. Upvote helpful or funny messages in the World Chat to boost your friends' scores."
              : "Ranked by Haunt Streak. Maintain your daily activity by chatting or posting haunts to stay on top."}
          </p>
        </div>

        {/* Top 3 Podium */}
        {!loading && users.length > 0 && (
          <div className="flex items-end justify-center gap-2 md:gap-6 mb-16 min-h-[16rem] transition-all duration-500">
            {/* 2nd Place */}
            {users[1] ? (
              <div className="flex flex-col items-center w-1/3 animate-slide-up" style={{ animationDelay: "100ms" }}>
                <div className="relative mb-4">
                  <div className="absolute -inset-1 bg-gradient-to-b from-gray-300 to-transparent rounded-full opacity-50 blur-sm" />
                  <img src={users[1]?.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=fallback"} alt={users[1]?.displayName} className="w-20 h-20 rounded-full border-4 border-gray-300 object-cover relative z-10" />
                  <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-gray-300 text-gray-900 w-8 h-8 rounded-full flex items-center justify-center font-bold border-2 border-ghost-950 z-20 shadow-lg">2</div>
                </div>
                <Link href={`/profile/${users[1]?.username}`} className="font-bold text-white text-lg hover:underline truncate w-full text-center">{users[1]?.displayName}</Link>
                <span className="text-sm text-gray-300 flex items-center gap-1 font-semibold mt-1">
                  <Icon className="w-3.5 h-3.5" /> {isRep ? users[1]?.reputationScore : users[1]?.hauntStreak} {isRep ? "" : "Days"}
                </span>
              </div>
            ) : <div className="w-1/3" />}

            {/* 1st Place */}
            <div className="flex flex-col items-center w-1/3 animate-slide-up z-10" style={{ transform: "translateY(-2rem)" }}>
              <div className="relative mb-4">
                <div className={`absolute -inset-2 bg-gradient-to-b ${isRep ? 'from-yellow-400' : 'from-orange-500'} to-transparent rounded-full opacity-60 blur-md animate-pulse`} />
                <img src={users[0]?.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=fallback"} alt={users[0]?.displayName} className={`w-28 h-28 rounded-full border-4 ${isRep ? 'border-yellow-400' : 'border-orange-500'} object-cover relative z-10`} />
                <div className={`absolute -bottom-4 left-1/2 -translate-x-1/2 ${isRep ? 'bg-yellow-400 text-yellow-950 border-yellow-400' : 'bg-gradient-to-br from-orange-500 to-red-600 text-white border-orange-500'} w-10 h-10 rounded-full flex items-center justify-center font-black text-xl border-4 border-ghost-950 z-20 shadow-[0_0_15px_rgba(250,204,21,0.5)]`}>1</div>
              </div>
              <Link href={`/profile/${users[0]?.username}`} className={`font-bold text-xl hover:underline truncate w-full text-center ${isRep ? 'text-yellow-400' : 'text-orange-400'}`}>{users[0]?.displayName}</Link>
              <div className="flex flex-col items-center mt-1">
                {isRep && <span className="text-sm font-bold text-yellow-400">{getGhostLevel(users[0]?.reputationScore || 0).title}</span>}
                <span className={`text-base flex items-center gap-1 font-black mt-1 px-3 py-1 rounded-full border ${isRep ? 'text-yellow-200 bg-yellow-900/40 border-yellow-500/30' : 'text-orange-100 bg-orange-900/40 border-orange-500/30'}`}>
                  <Icon className="w-4 h-4" /> {isRep ? users[0]?.reputationScore : users[0]?.hauntStreak} {isRep ? "" : "Days"}
                </span>
              </div>
            </div>

            {/* 3rd Place */}
            {users[2] ? (
              <div className="flex flex-col items-center w-1/3 animate-slide-up" style={{ animationDelay: "200ms" }}>
                <div className="relative mb-4">
                  <div className="absolute -inset-1 bg-gradient-to-b from-amber-700 to-transparent rounded-full opacity-50 blur-sm" />
                  <img src={users[2]?.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=fallback"} alt={users[2]?.displayName} className="w-20 h-20 rounded-full border-4 border-amber-700 object-cover relative z-10" />
                  <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-amber-700 text-amber-50 w-8 h-8 rounded-full flex items-center justify-center font-bold border-2 border-ghost-950 z-20 shadow-lg">3</div>
                </div>
                <Link href={`/profile/${users[2]?.username}`} className="font-bold text-white text-lg hover:underline truncate w-full text-center">{users[2]?.displayName}</Link>
                <span className="text-sm text-amber-600 flex items-center gap-1 font-semibold mt-1">
                  <Icon className="w-3.5 h-3.5" /> {isRep ? users[2]?.reputationScore : users[2]?.hauntStreak} {isRep ? "" : "Days"}
                </span>
              </div>
            ) : <div className="w-1/3" />}
          </div>
        )}

        {/* List */}
        <div className="glass-panel rounded-2xl overflow-hidden border border-white/5 relative min-h-[300px]">
          {loading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center py-20 z-10 bg-ghost-950/50 backdrop-blur-sm animate-fade-in">
              <div className={`w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mb-4 ${isRep ? 'border-yellow-500/30 border-t-yellow-500' : 'border-orange-500/30 border-t-orange-500'}`} />
              <p className="text-ghost-400 font-medium">Loading {isRep ? "Reputation" : "Streaks"}...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-20 text-ghost-400">
              No users found in this category.
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {users.slice(3).map((u, i) => {
                const rank = i + 4;
                const level = isRep ? getGhostLevel(u.reputationScore) : null;
                const value = isRep ? u.reputationScore : u.hauntStreak;
                
                return (
                  <div key={u.id} className="flex items-center gap-4 p-4 hover:bg-white/5 transition-colors group animate-fade-in" style={{ animationDelay: `${Math.min(i * 30, 500)}ms` }}>
                    <div className="w-8 text-center font-bold text-ghost-500">{rank}</div>
                    
                    <Link href={`/profile/${u.username}`} className="flex items-center gap-4 flex-1 min-w-0">
                      <img src={u.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=fallback"} alt={u.displayName} className={`w-12 h-12 rounded-full object-cover group-hover:ring-2 transition-all ${isRep ? 'ring-yellow-500' : 'ring-orange-500'}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2">
                          <h3 className={`text-white font-bold truncate transition-colors ${isRep ? 'group-hover:text-yellow-400' : 'group-hover:text-orange-400'}`}>{u.displayName}</h3>
                          <span className="text-xs text-ghost-500 truncate">@{u.username}</span>
                        </div>
                        {isRep && level && (
                          <p className={`text-xs font-semibold ${level.color} flex items-center gap-1.5 mt-0.5`}>
                            {level.badge ?? <span className="text-ghost-500 text-[10px]">{level.title}</span>}
                          </p>
                        )}
                      </div>
                    </Link>

                    <div className="text-right">
                      <div className={`text-lg font-black text-white flex items-center justify-end gap-1.5`}>
                        {value} <Icon className={`w-4 h-4 ${isRep ? 'text-yellow-500' : 'text-orange-500'}`} />
                      </div>
                      <p className="text-[10px] uppercase tracking-wider text-ghost-500 font-bold">
                        {isRep ? "Reputation" : "Days Streak"}
                      </p>
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
