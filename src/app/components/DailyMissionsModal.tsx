"use client";

import { useState } from "react";
import { X, Target, Zap, MessageSquare, Award, CheckCircle2, Sparkles, Loader2 } from "lucide-react";
import type { Gamification } from "../../types";

interface DailyMissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  gamification: Gamification;
  onClaimSuccess: (newGamification: Gamification) => void;
}

const MISSION_GOALS = {
  hauntsPosted: 1,
  echoesLeft: 3,
  repGiven: 1,
};
const REWARD_DUST = 250;

export function DailyMissionsModal({ isOpen, onClose, gamification, onClaimSuccess }: DailyMissionsModalProps) {
  const [claiming, setClaiming] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const missions = gamification.dailyMissions || {
    hauntsPosted: 0,
    echoesLeft: 0,
    repGiven: 0,
    claimed: false,
  };

  const progress = {
    hauntsPosted: Math.min(missions.hauntsPosted, MISSION_GOALS.hauntsPosted),
    echoesLeft: Math.min(missions.echoesLeft, MISSION_GOALS.echoesLeft),
    repGiven: Math.min(missions.repGiven, MISSION_GOALS.repGiven),
  };

  const isComplete = 
    progress.hauntsPosted === MISSION_GOALS.hauntsPosted &&
    progress.echoesLeft === MISSION_GOALS.echoesLeft &&
    progress.repGiven === MISSION_GOALS.repGiven;

  const handleClaim = async () => {
    if (claiming) return;
    setClaiming(true);
    setError("");
    try {
      const res = await fetch("/api/missions/claim", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        onClaimSuccess(data.data);
      } else {
        setError(data.error || "Failed to claim reward");
      }
    } catch {
      setError("Network error");
    } finally {
      setClaiming(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-md glass-card rounded-3xl border border-phantom-500/30 overflow-hidden shadow-[0_0_50px_rgba(168,85,247,0.15)] flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 border-b border-white/5 bg-gradient-to-br from-phantom-900/40 to-ghost-950 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-phantom-500/20 flex items-center justify-center border border-phantom-500/30">
              <Target className="w-5 h-5 text-phantom-400" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white tracking-tight">Daily Missions</h2>
              <p className="text-xs text-phantom-300 font-medium">Reset daily at Midnight (IST)</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-ghost-400 hover:text-white transition-colors bg-white/5 rounded-full hover:bg-white/10">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Mission 1 */}
          <MissionRow 
            icon={<Zap className="w-4 h-4 text-orange-400" />}
            title="Post a Haunt"
            current={progress.hauntsPosted}
            total={MISSION_GOALS.hauntsPosted}
            color="bg-orange-500"
          />
          {/* Mission 2 */}
          <MissionRow 
            icon={<MessageSquare className="w-4 h-4 text-blue-400" />}
            title="Leave Echoes (Replies)"
            current={progress.echoesLeft}
            total={MISSION_GOALS.echoesLeft}
            color="bg-blue-500"
          />
          {/* Mission 3 */}
          <MissionRow 
            icon={<Award className="w-4 h-4 text-emerald-400" />}
            title="Give +Rep to Someone"
            current={progress.repGiven}
            total={MISSION_GOALS.repGiven}
            color="bg-emerald-500"
          />

          {error && <p className="text-xs text-neon-red text-center font-bold bg-error/10 p-2 rounded-lg">{error}</p>}

          {/* Claim Button Area */}
          <div className="pt-4 border-t border-white/5 flex flex-col items-center">
            {missions.claimed ? (
              <div className="w-full py-3.5 rounded-xl bg-ghost-800/50 border border-white/5 flex items-center justify-center gap-2 text-ghost-400 font-bold">
                <CheckCircle2 className="w-5 h-5 text-success" />
                Reward Claimed Today
              </div>
            ) : (
              <button
                onClick={handleClaim}
                disabled={!isComplete || claiming}
                className={`w-full py-4 rounded-xl font-black tracking-widest uppercase transition-all duration-300 flex items-center justify-center gap-2 ${
                  isComplete
                    ? "bg-gradient-to-r from-phantom-600 to-phantom-500 text-white shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:scale-[1.02] active:scale-95 cursor-pointer"
                    : "bg-ghost-900 text-ghost-600 border border-white/5 cursor-not-allowed"
                }`}
              >
                {claiming ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Claim {REWARD_DUST} Ghost Dust 🟣
                  </>
                )}
              </button>
            )}
            {!missions.claimed && !isComplete && (
              <p className="text-[10px] text-ghost-500 mt-3 font-medium uppercase tracking-widest text-center">
                Complete all missions to unlock
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MissionRow({ icon, title, current, total, color }: { icon: React.ReactNode, title: string, current: number, total: number, color: string }) {
  const percent = Math.min(100, Math.round((current / total) * 100));
  const isDone = current >= total;

  return (
    <div className="bg-ghost-900/50 rounded-2xl p-4 border border-white/5 relative overflow-hidden group hover:border-white/10 transition-colors">
      <div className="flex items-center justify-between mb-3 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-ghost-800 flex items-center justify-center border border-white/5 shadow-inner">
            {isDone ? <CheckCircle2 className="w-4 h-4 text-success" /> : icon}
          </div>
          <span className={`font-bold text-sm ${isDone ? 'text-ghost-200' : 'text-ghost-100'}`}>{title}</span>
        </div>
        <span className="text-xs font-black text-ghost-400 font-mono tracking-widest bg-ghost-950 px-2 py-1 rounded-md border border-white/5">
          {current} / {total}
        </span>
      </div>
      <div className="h-1.5 w-full bg-ghost-950 rounded-full overflow-hidden relative z-10">
        <div 
          className={`h-full rounded-full transition-all duration-1000 ease-out ${isDone ? 'bg-success shadow-[0_0_10px_rgba(34,197,94,0.5)]' : color}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
