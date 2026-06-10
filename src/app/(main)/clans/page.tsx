"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../../custom-hooks/use-auth";
import { Users, Plus, ShieldAlert, Sparkles, Loader2, ArrowRight } from "lucide-react";
import type { Clan } from "../../../types";

const CLAN_CREATE_COST = 500;

export default function ClansPage() {
  const { user } = useAuth();
  const [clans, setClans] = useState<Clan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [processing, setProcessing] = useState<string | null>(null);

  const fetchClans = async () => {
    try {
      const res = await fetch("/api/clans");
      const data = await res.json();
      if (data.success) {
        setClans(data.data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClans();
  }, []);

  const handleJoin = async (id: string) => {
    if (processing) return;
    setProcessing(`join-${id}`);
    try {
      const res = await fetch(`/api/clans/${id}/join`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        window.location.reload(); // Quick refresh to update global state
      } else {
        alert(data.error);
      }
    } finally {
      setProcessing(null);
    }
  };

  const handleLeave = async (id: string) => {
    if (processing) return;
    if (!confirm("Are you sure you want to leave this clan?")) return;
    setProcessing(`leave-${id}`);
    try {
      const res = await fetch(`/api/clans/${id}/leave`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        window.location.reload();
      } else {
        alert(data.error);
      }
    } finally {
      setProcessing(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 pb-32">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <Users className="w-8 h-8 text-phantom-500" />
            Ghost Families
          </h1>
          <p className="text-sm text-ghost-400 mt-1">Join a clan or create your own legacy.</p>
        </div>
        
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary py-2.5 px-4 shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:shadow-[0_0_30px_rgba(168,85,247,0.5)] transition-all flex items-center gap-2 font-bold"
        >
          <Plus className="w-5 h-5" />
          <span className="hidden sm:inline">Create Clan</span>
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="w-8 h-8 text-phantom-500 animate-spin" />
        </div>
      ) : clans.length === 0 ? (
        <div className="text-center p-12 glass-card rounded-3xl border border-white/5">
          <ShieldAlert className="w-12 h-12 text-ghost-500 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-ghost-300">No clans found</h3>
          <p className="text-sm text-ghost-500">Be the first to create a ghost family!</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {clans.map((clan, idx) => {
            const isMember = clan.members.includes(user?.id || "");
            return (
              <div key={clan.id} className={`glass-card rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border ${isMember ? 'border-phantom-500/50 shadow-[0_0_20px_rgba(168,85,247,0.1)]' : 'border-white/5 hover:border-white/10'}`}>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-ghost-900 border border-white/5 flex items-center justify-center font-black text-lg text-phantom-400 shadow-inner">
                    #{idx + 1}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      {clan.name}
                      <span className="text-xs bg-phantom-500/20 text-phantom-400 border border-phantom-500/30 px-2 py-0.5 rounded-md font-mono tracking-wider">
                        [{clan.tag}]
                      </span>
                    </h3>
                    <p className="text-sm text-ghost-400 max-w-md truncate mt-0.5">{clan.description || "No description provided."}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs font-medium">
                      <span className="text-ghost-300 flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" /> {clan.members.length}/50
                      </span>
                      <span className="text-phantom-300 flex items-center gap-1">
                        🟣 {clan.clanDust} Dust
                      </span>
                    </div>
                  </div>
                </div>

                <div className="w-full md:w-auto flex justify-end">
                  {isMember ? (
                    <button 
                      onClick={() => handleLeave(clan.id)}
                      disabled={processing === `leave-${clan.id}`}
                      className="px-4 py-2 rounded-xl text-sm font-bold border border-neon-red/30 text-neon-red hover:bg-neon-red/10 transition-colors flex items-center gap-2"
                    >
                      {processing === `leave-${clan.id}` ? <Loader2 className="w-4 h-4 animate-spin" /> : "Leave Clan"}
                    </button>
                  ) : user?.clanId ? (
                    <button disabled className="px-4 py-2 rounded-xl text-sm font-bold border border-ghost-700/50 text-ghost-600 cursor-not-allowed">
                      Already in a clan
                    </button>
                  ) : (
                    <button 
                      onClick={() => handleJoin(clan.id)}
                      disabled={processing === `join-${clan.id}`}
                      className="px-4 py-2 rounded-xl text-sm font-bold bg-ghost-800 text-ghost-200 border border-white/5 hover:bg-ghost-700 hover:text-white transition-colors flex items-center gap-2"
                    >
                      {processing === `join-${clan.id}` ? <Loader2 className="w-4 h-4 animate-spin" /> : "Join"} <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <CreateClanModal 
          onClose={() => setShowCreateModal(false)} 
          onSuccess={() => window.location.reload()}
          userDust={user?.gamification?.ghostDust || 0}
        />
      )}
    </div>
  );
}

function CreateClanModal({ onClose, onSuccess, userDust }: { onClose: () => void, onSuccess: () => void, userDust: number }) {
  const [name, setName] = useState("");
  const [tag, setTag] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (userDust < CLAN_CREATE_COST) {
      setError(`You need ${CLAN_CREATE_COST} Ghost Dust to create a clan.`);
      return;
    }

    setCreating(true);
    setError("");
    try {
      const res = await fetch("/api/clans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, tag, description })
      });
      const data = await res.json();
      if (data.success) {
        onSuccess();
      } else {
        setError(data.error);
      }
    } catch {
      setError("Network error");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-md glass-card rounded-3xl border border-phantom-500/30 overflow-hidden shadow-[0_0_50px_rgba(168,85,247,0.15)] flex flex-col">
        <div className="px-6 py-5 border-b border-white/5 bg-gradient-to-br from-phantom-900/40 to-ghost-950 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-phantom-500/20 flex items-center justify-center border border-phantom-500/30">
              <Sparkles className="w-5 h-5 text-phantom-400" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white tracking-tight">Create Clan</h2>
              <p className="text-xs text-phantom-300 font-medium">Cost: {CLAN_CREATE_COST} Ghost Dust 🟣</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleCreate} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-ghost-400 uppercase tracking-wider mb-1">Clan Name</label>
            <input 
              type="text" 
              required
              minLength={3}
              maxLength={20}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-ghost-900/50 border border-white/5 rounded-xl px-4 py-3 text-white placeholder:text-ghost-600 focus:outline-none focus:border-phantom-500/50 transition-colors"
              placeholder="e.g. Night Owls"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-ghost-400 uppercase tracking-wider mb-1">Clan Tag (2-4 chars)</label>
            <input 
              type="text" 
              required
              minLength={2}
              maxLength={4}
              value={tag}
              onChange={(e) => setTag(e.target.value.toUpperCase())}
              className="w-full bg-ghost-900/50 border border-white/5 rounded-xl px-4 py-3 text-white placeholder:text-ghost-600 focus:outline-none focus:border-phantom-500/50 transition-colors font-mono"
              placeholder="e.g. OWL"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-ghost-400 uppercase tracking-wider mb-1">Description (Optional)</label>
            <textarea 
              maxLength={100}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-ghost-900/50 border border-white/5 rounded-xl px-4 py-3 text-white placeholder:text-ghost-600 focus:outline-none focus:border-phantom-500/50 transition-colors resize-none h-20"
              placeholder="What is your family about?"
            />
          </div>

          {error && <p className="text-xs text-neon-red text-center font-bold bg-error/10 p-2 rounded-lg">{error}</p>}

          <div className="pt-4 flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-3.5 rounded-xl text-ghost-300 font-bold bg-white/5 hover:bg-white/10 transition-colors">
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={creating || userDust < CLAN_CREATE_COST}
              className="flex-[2] py-3.5 rounded-xl font-black tracking-widest uppercase transition-all flex items-center justify-center gap-2 bg-gradient-to-r from-phantom-600 to-phantom-500 text-white shadow-[0_0_20px_rgba(168,85,247,0.4)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {creating ? <Loader2 className="w-5 h-5 animate-spin" /> : "Create Family"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
