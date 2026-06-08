"use client";

import { useAuth } from "../../../../custom-hooks/use-auth";
import { useSocket } from "../../../../custom-hooks/use-socket";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Bell, Users, MessageSquare, Star, Check, CheckCheck, Ghost, Search, MapPin, CalendarDays, ExternalLink, Activity, ArrowLeft, MoreHorizontal, MessageCircle, Map, Sparkles, Zap, Image as ImageIcon, Camera, Pencil, X, ShieldCheck, UserPlus, Clock, Smile, Loader2, Save } from "lucide-react";
import type { UserProfile, ApiResponse } from "../../../../types";
import { getGhostLevel } from "../../../../lib/levels";

const MOOD_ICONS: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  HAPPY: { icon: <Smile className="w-5 h-5" />, label: "Happy", color: "text-yellow-400" },
  BORED: { icon: <Ghost className="w-5 h-5" />, label: "Bored", color: "text-ghost-400" },
  LONELY: { icon: <Ghost className="w-5 h-5" />, label: "Lonely", color: "text-blue-400" },
  MOTIVATED: { icon: <Sparkles className="w-5 h-5" />, label: "Motivated", color: "text-orange-400" },
  SAD: { icon: <Ghost className="w-5 h-5" />, label: "Sad", color: "text-blue-500" },
  EXCITED: { icon: <Sparkles className="w-5 h-5" />, label: "Excited", color: "text-fuchsia-400" },
};

const INTEREST_COLORS: Record<string, string> = {
  GAMING: "#8B5CF6", CODING: "#10B981", STARTUPS: "#F59E0B",
  ANIME: "#EC4899", MOVIES: "#EF4444", MUSIC: "#3B82F6",
  FITNESS: "#14B8A6", RELATIONSHIPS: "#F43F5E", ART: "#A855F7",
  TRAVEL: "#06B6D4", FOOD: "#F97316", SCIENCE: "#6366F1",
  PHILOSOPHY: "#8B5CF6", SPORTS: "#22C55E", BOOKS: "#D97706",
};

const ALL_INTERESTS = Object.keys(INTEREST_COLORS);

export default function ProfilePage() {
  const { user: authUser, refreshUser } = useAuth();
  const { socket } = useSocket();
  const params = useParams();
  const router = useRouter();
  const username = params.username as string;

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarHover, setAvatarHover] = useState(false);
  const [friendState, setFriendState] = useState<"none" | "loading" | "sent" | "accepted" | "pending" | "rejected" | "friends" | "received">("none");
  const [friendMsg, setFriendMsg] = useState<{ type: string; text: string } | null>(null);

  // Edit modal state
  const [editOpen, setEditOpen] = useState(false);
  const [editDisplayName, setEditDisplayName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editMood, setEditMood] = useState("");
  const [editInterests, setEditInterests] = useState<string[]>([]);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState("");

  const isOwnProfile = authUser?.username === username;

  useEffect(() => {
    if (isOwnProfile && authUser) {
      setProfile(authUser);
      setLoading(false);
    } else {
      const fetchProfile = async () => {
        try {
          const res = await fetch(`/api/users/${username}`);
          const data = await res.json();
          if (data.success) {
            setProfile(data.data);
            if (data.data.viewerFriendshipStatus && data.data.viewerFriendshipStatus !== "NONE") {
              setFriendState(data.data.viewerFriendshipStatus.toLowerCase() as any);
            }
          }
        } catch (err) {
          console.error("Failed to fetch profile:", err);
        } finally {
          setLoading(false);
        }
      };
      fetchProfile();
    }
  }, [username, isOwnProfile, authUser]);

  const openEditModal = () => {
    if (!profile) return;
    setEditDisplayName(profile.displayName || "");
    setEditBio(profile.bio || "");
    setEditMood(profile.profile?.mood || "");
    setEditInterests(profile.profile?.interests || []);
    setEditError("");
    setEditOpen(true);
  };

  const toggleInterest = (interest: string) => {
    setEditInterests(prev =>
      prev.includes(interest) ? prev.filter(i => i !== interest) : [...prev, interest]
    );
  };

  const saveProfile = async () => {
    if (!editDisplayName.trim()) {
      setEditError("Display name cannot be empty.");
      return;
    }
    setEditSaving(true);
    setEditError("");
    try {
      const userRes = await fetch("/api/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: editDisplayName.trim(),
          bio: editBio.trim() || null,
        }),
      });

      const profileRes = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mood: editMood || null,
          interests: editInterests,
        }),
      });

      if (userRes.ok) {
        await refreshUser();
        setProfile(prev => prev ? {
          ...prev,
          displayName: editDisplayName.trim(),
          bio: editBio.trim() || null,
          profile: {
            ...(prev.profile || {}),
            mood: editMood || undefined,
            interests: editInterests,
          } as any,
        } : prev);

        if (socket && authUser) {
          socket.emit("user:profile-update", {
            userId: authUser.id,
            avatar: authUser.avatar,
            displayName: editDisplayName.trim(),
          });
        }
        setEditOpen(false);
      } else {
        const data = await userRes.json();
        setEditError(data.error || "Failed to save profile.");
      }
    } catch {
      setEditError("An error occurred. Please try again.");
    } finally {
      setEditSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploadingAvatar(true);
      const formData = new FormData();
      formData.append("image", file);
      const imgbbRes = await fetch(
        `https://api.imgbb.com/1/upload?key=${process.env.NEXT_PUBLIC_IMGBB_API_KEY}`,
        { method: "POST", body: formData }
      );
      const imgbbData = await imgbbRes.json();
      if (imgbbData.success) {
        const avatarUrl = imgbbData.data.url;
        const updateRes = await fetch("/api/auth/me", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ avatar: avatarUrl }),
        });
        if (updateRes.ok) {
          setProfile((prev) => (prev ? { ...prev, avatar: avatarUrl } : prev));
          await refreshUser();
          if (socket && authUser) {
            socket.emit("user:profile-update", {
              userId: authUser.id,
              avatar: avatarUrl,
              displayName: authUser.displayName,
            });
          }
        }
      }
    } catch (err) {
      console.error("Failed to upload avatar:", err);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleAddFriend = async () => {
    if (!profile) return;
    setFriendState("loading");
    try {
      const res = await fetch("/api/friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: profile.username }),
      });
      const data = await res.json();
      if (data.success) {
        setFriendState("sent");
        setFriendMsg({ type: "success", text: "Friend request sent!" });
      } else {
        setFriendState("none");
        setFriendMsg({ type: "error", text: data.error || "Failed to send request" });
      }
    } catch {
      setFriendState("none");
      setFriendMsg({ type: "error", text: "An error occurred" });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-56px)] md:h-screen bg-ghost-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-phantom-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-ghost-500 text-sm">Loading profile…</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-56px)] md:h-screen gap-4 text-center px-6">
        <Ghost className="w-16 h-16 text-ghost-700" />
        <h2 className="text-xl font-bold text-ghost-200">User not found</h2>
        <p className="text-ghost-500 text-sm">@{username} doesn&apos;t exist in GhostVerse</p>
        <button onClick={() => router.back()} className="btn-secondary mt-2 px-4 py-2 text-sm gap-2">
          <ArrowLeft className="w-4 h-4" /> Go back
        </button>
      </div>
    );
  }

  const mood = profile.profile?.mood ? MOOD_ICONS[profile.profile.mood] : null;
  const joinDate = new Date(profile.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" });

  return (
    <div className="min-h-[calc(100vh-56px)] md:min-h-screen overflow-y-auto bg-ghost-950">

      {/* ── Edit Profile Modal ── */}
      {editOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="glass-card w-full max-w-md max-h-[90vh] overflow-y-auto p-6 animate-slide-up">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-ghost-100 flex items-center gap-2">
                <Pencil className="w-5 h-5 text-phantom-400" /> Edit Profile
              </h2>
              <button onClick={() => setEditOpen(false)} className="btn-ghost w-8 h-8 rounded-full">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-5">
              {/* Display Name */}
              <div>
                <label className="block text-xs font-bold text-ghost-400 uppercase tracking-widest mb-2">Display Name</label>
                <input
                  type="text"
                  value={editDisplayName}
                  onChange={e => setEditDisplayName(e.target.value)}
                  maxLength={30}
                  className="glass-input text-sm py-2.5"
                  placeholder="Your display name"
                />
              </div>

              {/* Bio */}
              <div>
                <label className="block text-xs font-bold text-ghost-400 uppercase tracking-widest mb-2">Bio</label>
                <textarea
                  value={editBio}
                  onChange={e => setEditBio(e.target.value)}
                  maxLength={160}
                  rows={3}
                  className="glass-input text-sm py-2.5 resize-none"
                  placeholder="Tell the world about yourself..."
                />
                <p className="text-right text-xs text-ghost-600 mt-1">{editBio.length}/160</p>
              </div>

              {/* Mood */}
              <div>
                <label className="block text-xs font-bold text-ghost-400 uppercase tracking-widest mb-2">Mood</label>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(MOOD_ICONS).map(([key, val]) => (
                    <button
                      key={key}
                      onClick={() => setEditMood(editMood === key ? "" : key)}
                      className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border text-xs font-medium transition-all ${
                        editMood === key
                          ? "bg-phantom-500/20 border-phantom-500/60 text-phantom-300"
                          : "bg-ghost-900/40 border-ghost-800 text-ghost-400 hover:border-ghost-600"
                      }`}
                    >
                      <span className={val.color}>{val.icon}</span>
                      {val.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Interests */}
              <div>
                <label className="block text-xs font-bold text-ghost-400 uppercase tracking-widest mb-2">
                  Interests ({editInterests.length} selected)
                </label>
                <div className="flex flex-wrap gap-2">
                  {ALL_INTERESTS.map(interest => {
                    const selected = editInterests.includes(interest);
                    const color = INTEREST_COLORS[interest];
                    return (
                      <button
                        key={interest}
                        onClick={() => toggleInterest(interest)}
                        className="text-xs font-semibold px-3 py-1.5 rounded-full border transition-all"
                        style={{
                          borderColor: selected ? `${color}80` : "#3f3f46",
                          backgroundColor: selected ? `${color}20` : "transparent",
                          color: selected ? color : "#71717a",
                        }}
                      >
                        {interest.charAt(0) + interest.slice(1).toLowerCase()}
                      </button>
                    );
                  })}
                </div>
              </div>

              {editError && (
                <p className="text-sm text-neon-red bg-error/10 px-3 py-2 rounded-lg">{editError}</p>
              )}

              <button
                onClick={saveProfile}
                disabled={editSaving}
                className="btn-primary w-full py-3 gap-2"
              >
                {editSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {editSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Hero Banner ── */}
      <div className="relative h-36 md:h-52 w-full overflow-hidden">
        {/* Animated gradient banner */}
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(135deg, #4c1d95 0%, #7c3aed 30%, #ec4899 60%, #06b6d4 100%)",
            backgroundSize: "300% 300%",
            animation: "gradientShift 8s ease infinite",
          }}
        />
        {/* Noise texture overlay */}
        <div className="absolute inset-0 opacity-20 mix-blend-overlay"
          style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")" }}
        />
        {/* Radial glow */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-ghost-950" />
      </div>

      {/* ── Profile Header ── */}
      <div className="relative px-4 sm:px-6 pb-6 -mt-16 md:-mt-20 z-10">
        <div className="flex flex-col sm:flex-row sm:items-end gap-4 mb-5">

          {/* Avatar */}
          <div
            className="relative flex-shrink-0 self-start sm:self-auto"
            onMouseEnter={() => setAvatarHover(true)}
            onMouseLeave={() => setAvatarHover(false)}
          >
            <div className="w-24 h-24 md:w-28 md:h-28 rounded-full border-4 border-ghost-950 shadow-2xl overflow-hidden bg-ghost-800 flex items-center justify-center text-3xl md:text-4xl font-black text-ghost-300 relative"
              style={{ boxShadow: "0 0 0 4px #09090b, 0 0 30px rgba(139,92,246,0.4)" }}>
              {profile.avatar ? (
                <img src={profile.avatar} alt={profile.displayName} className="w-full h-full object-cover" />
              ) : (
                <span className="gradient-text">{profile.displayName.charAt(0)}</span>
              )}

              {/* Upload overlay */}
              {isOwnProfile && (
                <label className={`absolute inset-0 bg-black/70 flex flex-col items-center justify-center cursor-pointer transition-all duration-200 rounded-full ${avatarHover ? "opacity-100" : "opacity-0"}`}>
                  {isUploadingAvatar ? (
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Camera className="w-6 h-6 text-white mb-1" />
                      <span className="text-[9px] font-bold text-white tracking-widest uppercase">Change</span>
                    </>
                  )}
                  <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={isUploadingAvatar} />
                </label>
              )}
            </div>

            {/* Online indicator */}
            <div className="absolute bottom-1 right-1 w-4 h-4 bg-success rounded-full border-2 border-ghost-950 shadow-lg" />
          </div>

          {/* Name + actions */}
          <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl md:text-2xl font-black text-ghost-100 truncate">{profile.displayName}</h1>
                {isOwnProfile && (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-phantom-500/15 border border-phantom-500/30 text-phantom-400 text-[10px] font-bold tracking-wider uppercase">
                    <ShieldCheck className="w-3 h-3" /> You
                  </span>
                )}
              </div>
              <p className="text-phantom-400 text-sm font-medium mt-0.5">@{profile.username}</p>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 flex-wrap">
              {isOwnProfile ? (
                <button onClick={openEditModal} className="btn-secondary text-sm px-4 py-2 gap-2 whitespace-nowrap">
                  <Pencil className="w-4 h-4" /> Edit Profile
                </button>
              ) : (
                <>
                  {friendState === "accepted" ? (
                    <button className="btn-secondary text-sm px-4 py-2 gap-2 whitespace-nowrap cursor-default pointer-events-none opacity-80">
                      <CheckCheck className="w-4 h-4 text-success" /> Friends
                    </button>
                  ) : friendState === "pending" || friendState === "sent" || friendState === "received" ? (
                    <button className="btn-secondary text-sm px-4 py-2 gap-2 whitespace-nowrap cursor-default pointer-events-none opacity-80">
                      <Clock className="w-4 h-4 text-warning" /> Pending
                    </button>
                  ) : (
                    <button
                      onClick={handleAddFriend}
                      disabled={friendState === "loading"}
                      className="btn-primary text-sm px-4 py-2 gap-2 whitespace-nowrap disabled:opacity-70"
                    >
                      <UserPlus className="w-4 h-4" />
                      {friendState === "loading" ? "Sending..." : "Add Friend"}
                    </button>
                  )}
                  <button
                    className="btn-secondary text-sm px-4 py-2 gap-2 whitespace-nowrap"
                    onClick={() => {
                      if (authUser) {
                        const convId = [authUser.id, profile.id].sort().join("_");
                        router.push(`/messages/${convId}`);
                      }
                    }}
                  >
                    <MessageSquare className="w-4 h-4" /> Message
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {friendMsg && (
          <p className={`text-xs mb-3 font-medium ${friendMsg.type === "success" ? "text-success" : "text-neon-red"}`}>
            {friendMsg.text}
          </p>
        )}

        {/* Bio */}
        {profile.bio && (
          <p className="text-ghost-300 text-sm leading-relaxed mb-5 max-w-2xl">{profile.bio}</p>
        )}

        {/* Quick stats grid */}
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-3 sm:gap-4 mt-6">
          {/* Reputation Stat */}
          <div className="bg-ghost-900/50 border border-ghost-800/60 rounded-xl px-4 py-2.5 flex flex-col justify-center min-w-[120px]">
            <span className="text-[10px] uppercase tracking-wider text-ghost-500 font-bold mb-0.5">Reputation</span>
            <div className={`flex items-center gap-1.5 font-black text-lg ${getGhostLevel(profile.profile?.reputationScore || 0).color}`}>
              <Zap className="w-4 h-4 fill-current opacity-80" />
              <span>{profile.profile?.reputationScore || 0}</span>
              {getGhostLevel(profile.profile?.reputationScore || 0).badge && (
                <div className="ml-1 scale-90 origin-left">
                  {getGhostLevel(profile.profile?.reputationScore || 0).badge}
                </div>
              )}
            </div>
          </div>

          {/* Friends Stat */}
          <div className="bg-ghost-900/50 border border-ghost-800/60 rounded-xl px-4 py-2.5 flex flex-col justify-center min-w-[120px]">
            <span className="text-[10px] uppercase tracking-wider text-ghost-500 font-bold mb-0.5">Network</span>
            <div className="flex items-center gap-1.5 font-black text-lg text-ghost-100">
              <Users className="w-4 h-4 text-phantom-400" />
              <span>{profile.friendsCount}</span>
              <span className="text-xs font-semibold text-ghost-500 ml-0.5">friends</span>
            </div>
          </div>

          {/* Join Date */}
          <div className="bg-ghost-900/50 border border-ghost-800/60 rounded-xl px-4 py-2.5 flex flex-col justify-center min-w-[120px]">
            <span className="text-[10px] uppercase tracking-wider text-ghost-500 font-bold mb-0.5">Joined</span>
            <div className="flex items-center gap-1.5 font-black text-sm text-ghost-300 mt-0.5">
              <CalendarDays className="w-4 h-4 text-ghost-500" />
              <span>{joinDate}</span>
            </div>
          </div>
        </div>
        {mood && (
          <div className="mt-4">
            <span className="text-[10px] uppercase tracking-wider text-ghost-500 font-bold mb-1.5 block">Current Mood</span>
            <div className={`inline-flex items-center gap-1.5 bg-ghost-800/40 border border-ghost-700/50 px-3 py-1.5 rounded-lg text-sm ${mood.color}`}>
              {mood.icon}
              <span className="font-medium text-sm">{mood.label}</span>
            </div>
          </div>
        )}
        </div>
      </div>

      {/* ── Divider ── */}
      <div className="h-px bg-gradient-to-r from-transparent via-ghost-800 to-transparent mx-4 sm:mx-6" />

      {/* ── Content Grid ── */}
      <div className="px-4 sm:px-6 py-6 grid grid-cols-1 lg:grid-cols-2 gap-4 max-w-4xl">

        {/* Interests Card */}
        {profile.profile?.interests && profile.profile.interests.length > 0 && (
          <div className="glass-card p-5 col-span-1 lg:col-span-2">
            <h3 className="text-xs font-bold text-ghost-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-phantom-400" /> Interests
            </h3>
            <div className="flex flex-wrap gap-2">
              {profile.profile.interests.map((interest) => (
                <span
                  key={interest}
                  className="interest-pill text-xs font-semibold px-3 py-1.5 transition-transform hover:scale-105 cursor-default"
                  style={{
                    borderColor: `${INTEREST_COLORS[interest] ?? "#8B5CF6"}40`,
                    backgroundColor: `${INTEREST_COLORS[interest] ?? "#8B5CF6"}12`,
                    color: INTEREST_COLORS[interest] ?? "#8B5CF6",
                  }}
                >
                  {interest.charAt(0) + interest.slice(1).toLowerCase()}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Activity / Account Info */}
        <div className="glass-card p-5 col-span-1 lg:col-span-2">
          <h3 className="text-xs font-bold text-ghost-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-success" /> Account Info
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-ghost-800/50">
              <span className="text-ghost-500 text-sm">Username</span>
              <span className="text-ghost-200 text-sm font-mono font-medium">@{profile.username}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-ghost-800/50">
              <span className="text-ghost-500 text-sm">Member since</span>
              <span className="text-ghost-200 text-sm">{joinDate}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-ghost-800/50">
              <span className="text-ghost-500 text-sm">Status</span>
              <span className="flex items-center gap-1.5 text-success text-sm font-medium">
                <span className="w-2 h-2 rounded-full bg-success animate-pulse inline-block" />
                Online
              </span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-ghost-500 text-sm">Friends</span>
              <span className="text-ghost-200 text-sm font-bold">{profile.friendsCount}</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
