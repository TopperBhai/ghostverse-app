"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../custom-hooks/use-auth";
import { useRouter } from "next/navigation";
import {
  UserPlus, MessageSquare, X, Users, CalendarDays,
  Sparkles, Ghost, ShieldCheck, UserCheck, Clock, Zap
} from "lucide-react";
import Link from "next/link";
import { getGhostLevel } from "../../lib/levels";

interface ProfileCardProps {
  username: string;
  displayName: string;
  avatar: string | null;
  userId: string;
  onClose: () => void;
  anchorRef?: React.RefObject<HTMLElement | null>;
}

interface FullProfile {
  id: string;
  username: string;
  displayName: string;
  avatar: string | null;
  bio: string | null;
  friendsCount: number;
  createdAt: string;
  status?: string;
  profile?: {
    interests: string[];
    mood: string | null;
    reputationScore: number;
  } | null;
}

const INTEREST_COLORS: Record<string, string> = {
  GAMING: "#8B5CF6", CODING: "#10B981", STARTUPS: "#F59E0B",
  ANIME: "#EC4899", MOVIES: "#EF4444", MUSIC: "#3B82F6",
  FITNESS: "#14B8A6", RELATIONSHIPS: "#F43F5E", ART: "#A855F7",
  TRAVEL: "#06B6D4", FOOD: "#F97316", SCIENCE: "#6366F1",
  PHILOSOPHY: "#8B5CF6", SPORTS: "#22C55E", BOOKS: "#D97706",
};

export function UserProfileCard({
  username,
  displayName,
  avatar,
  userId,
  onClose,
}: ProfileCardProps) {
  const { user: authUser } = useAuth();
  const router = useRouter();
  const cardRef = useRef<HTMLDivElement>(null);
  const [profile, setProfile] = useState<FullProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [friendState, setFriendState] = useState<"none" | "loading" | "sent" | "friends">("none");
  const [repState, setRepState] = useState<"idle" | "loading" | "given" | "error">("idle");
  const [repError, setRepError] = useState<string | null>(null);
  const [canGiveRep, setCanGiveRep] = useState(true);

  const isOwnProfile = authUser?.id === userId;

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleEsc = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleEsc);
    };
  }, [onClose]);

  // Fetch full profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch(`/api/users/${username}`);
        const data = await res.json();
        if (data.success && data.data) {
          setProfile(data.data);
          if (data.data.viewerFriendshipStatus && data.data.viewerFriendshipStatus !== "NONE") {
            const status = data.data.viewerFriendshipStatus.toLowerCase();
            if (status === "sent" || status === "received" || status === "pending") {
              setFriendState("sent");
            } else if (status === "accepted") {
              setFriendState("friends");
            }
          }
        }
      } catch {}
      finally { setLoading(false); };
    };
    fetchProfile();
  }, [username]);

  // Check if viewer can give rep (24h limit)
  useEffect(() => {
    if (!authUser?.lastUpvoteGivenAt) { setCanGiveRep(true); return; }
    const last = new Date(authUser.lastUpvoteGivenAt).getTime();
    const diff = Date.now() - last;
    setCanGiveRep(diff >= 24 * 60 * 60 * 1000);
  }, [authUser]);

  const handleAddFriend = async () => {
    if (!authUser) return;
    setFriendState("loading");
    try {
      const res = await fetch("/api/friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });
      const data = await res.json();
      setFriendState(data.success ? "sent" : "none");
    } catch {
      setFriendState("none");
    }
  };

  const handleMessage = () => {
    if (!authUser) return;
    const convId = [authUser.id, userId].sort().join("_");
    router.push(`/messages/${convId}`);
    onClose();
  };

  const handleGiveRep = async () => {
    if (!authUser || repState !== "idle" || !canGiveRep) return;
    setRepState("loading");
    setRepError(null);
    try {
      const res = await fetch(`/api/users/${username}/give-rep`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setRepState("given");
        setCanGiveRep(false);
      } else {
        setRepState("error");
        setRepError(data.error || "Failed to give rep");
        setTimeout(() => { setRepState("idle"); setRepError(null); }, 3000);
      }
    } catch {
      setRepState("error");
      setTimeout(() => { setRepState("idle"); }, 3000);
    }
  };

  const joinDate = profile
    ? new Date(profile.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:items-end md:justify-end md:p-6 animate-fade-in">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Card */}
      <div
        ref={cardRef}
        className="relative z-10 w-full max-w-sm bg-ghost-900 border border-ghost-800/70 rounded-2xl shadow-2xl overflow-hidden animate-slide-up"
      >
        {/* Banner */}
        <div
          className="h-20 w-full"
          style={{
            background: `linear-gradient(135deg, hsl(${(userId.charCodeAt(0) * 37) % 360}, 60%, 25%) 0%, hsl(${(userId.charCodeAt(1) * 53) % 360}, 70%, 35%) 100%)`,
          }}
        />

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/40 flex items-center justify-center text-white/70 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Avatar */}
        <div className="px-4 -mt-10 mb-3 flex items-end justify-between">
          <div className="w-20 h-20 rounded-full border-4 border-ghost-900 bg-ghost-800 flex items-center justify-center text-2xl font-black text-ghost-300 overflow-hidden shadow-xl">
            {avatar ? (
              <img src={avatar} alt={displayName} className="w-full h-full object-cover" />
            ) : (
              <span className="gradient-text">{displayName.charAt(0)}</span>
            )}
          </div>
          {/* Action buttons */}
          {!isOwnProfile && authUser && (
            <div className="flex flex-wrap gap-2 mt-10">
              <button
                onClick={handleMessage}
                className="btn-secondary text-xs px-3 py-1.5 gap-1.5"
              >
                <MessageSquare className="w-3.5 h-3.5" /> Message
              </button>
              <button
                onClick={handleAddFriend}
                disabled={friendState === "loading" || friendState === "sent" || friendState === "friends"}
                className="btn-primary text-xs px-3 py-1.5 gap-1.5 disabled:opacity-60"
              >
                {friendState === "sent" ? (
                  <><UserCheck className="w-3.5 h-3.5" /> Pending</>
                ) : friendState === "friends" ? (
                  <><UserCheck className="w-3.5 h-3.5" /> Friends</>
                ) : (
                  <><UserPlus className="w-3.5 h-3.5" /> Add</>
                )}
              </button>
              <button
                onClick={handleGiveRep}
                disabled={!canGiveRep || repState !== "idle"}
                title={!canGiveRep ? "You already gave rep today — come back in 24h" : repError || "Give Reputation"}
                className={`text-xs px-3 py-1.5 gap-1.5 rounded-xl font-bold border transition-all flex items-center ${
                  repState === "given"
                    ? "bg-success/10 border-success/30 text-success cursor-default"
                    : repState === "error"
                    ? "bg-error/10 border-error/30 text-neon-red cursor-default"
                    : !canGiveRep
                    ? "bg-ghost-800/30 border-ghost-700/30 text-ghost-600 cursor-not-allowed opacity-60"
                    : "bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20"
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                {repState === "given" ? "Rep Given!" : repState === "loading" ? "..." : !canGiveRep ? "Repped" : "Give Rep"}
              </button>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="px-4 pb-4">
          <div className="mb-3">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-ghost-100">{displayName}</h2>
              {isOwnProfile && (
                <span className="text-[10px] bg-phantom-500/15 text-phantom-400 border border-phantom-500/30 px-1.5 py-0.5 rounded-full font-bold">You</span>
              )}
            </div>
            <p className="text-xs text-phantom-400">@{username}</p>
          </div>

          {loading ? (
            <div className="h-12 flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-phantom-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : profile ? (
            <>
              {profile.bio && (
                <p className="text-xs text-ghost-400 leading-relaxed mb-3 line-clamp-3">
                  {profile.bio}
                </p>
              )}

              <div className="h-px bg-ghost-800 mb-3" />

              {/* Stats row */}
              <div className="flex flex-wrap items-center gap-4 text-xs text-ghost-500 mb-3">
                <span className="flex items-center gap-1" title="Reputation Score">
                  <span className={`flex items-center gap-1 ${getGhostLevel(profile.profile?.reputationScore || 0).color}`}>
                    {getGhostLevel(profile.profile?.reputationScore || 0).badge}
                    <strong className="font-bold text-xs">{profile.profile?.reputationScore || 0}</strong>
                  </span>
                </span>
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" />
                  <strong className="text-ghost-300">{profile.friendsCount}</strong> friends
                </span>
                {joinDate && (
                  <span className="flex items-center gap-1">
                    <CalendarDays className="w-3.5 h-3.5" />
                    {joinDate}
                  </span>
                )}
              </div>

              {/* Interests */}
              {profile.profile?.interests && profile.profile.interests.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {profile.profile.interests.slice(0, 5).map((interest) => (
                    <span
                      key={interest}
                      className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: `${INTEREST_COLORS[interest] ?? "#8B5CF6"}18`,
                        color: INTEREST_COLORS[interest] ?? "#8B5CF6",
                        border: `1px solid ${INTEREST_COLORS[interest] ?? "#8B5CF6"}30`,
                      }}
                    >
                      {interest.charAt(0) + interest.slice(1).toLowerCase()}
                    </span>
                  ))}
                </div>
              )}
            </>
          ) : (
            <p className="text-xs text-ghost-600">Could not load profile info.</p>
          )}

          {/* View full profile */}
          <Link
            href={`/profile/${username}`}
            onClick={onClose}
            className="mt-4 w-full flex items-center justify-center gap-1.5 text-xs text-ghost-500 hover:text-phantom-400 transition-colors py-2 border border-ghost-800 rounded-xl hover:border-phantom-500/40"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            View Full Profile
          </Link>
        </div>
      </div>
    </div>
  );
}
