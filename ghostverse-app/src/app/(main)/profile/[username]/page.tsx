"use client";

import { useAuth } from "../../../../custom-hooks/use-auth";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  Camera,
  UserPlus,
  MessageSquare,
  Pencil,
  Ghost,
  CalendarDays,
  Users,
  Smile,
  ArrowLeft,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import type { UserProfile, ApiResponse } from "../../../../types";

const MOOD_ICONS: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  HAPPY:     { icon: <Smile className="w-5 h-5" />,   label: "Happy",     color: "text-yellow-400" },
  BORED:     { icon: <Ghost className="w-5 h-5" />,   label: "Bored",     color: "text-ghost-400"  },
  LONELY:    { icon: <Ghost className="w-5 h-5" />,   label: "Lonely",    color: "text-blue-400"   },
  MOTIVATED: { icon: <Sparkles className="w-5 h-5" />,label: "Motivated", color: "text-orange-400" },
  SAD:       { icon: <Ghost className="w-5 h-5" />,   label: "Sad",       color: "text-blue-500"   },
  EXCITED:   { icon: <Sparkles className="w-5 h-5" />,label: "Excited",   color: "text-fuchsia-400"},
};

const INTEREST_COLORS: Record<string, string> = {
  GAMING: "#8B5CF6", CODING: "#10B981", STARTUPS: "#F59E0B",
  ANIME: "#EC4899",  MOVIES: "#EF4444", MUSIC: "#3B82F6",
  FITNESS: "#14B8A6",RELATIONSHIPS: "#F43F5E", ART: "#A855F7",
  TRAVEL: "#06B6D4", FOOD: "#F97316", SCIENCE: "#6366F1",
  PHILOSOPHY: "#8B5CF6", SPORTS: "#22C55E", BOOKS: "#D97706",
};

export default function ProfilePage() {
  const { user: authUser, refreshUser } = useAuth();
  const params = useParams();
  const router = useRouter();
  const username = params.username as string;
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarHover, setAvatarHover] = useState(false);
  const [friendState, setFriendState] = useState<"none" | "loading" | "sent">("none");
  const [friendMsg, setFriendMsg] = useState<{ type: string; text: string } | null>(null);

  const isOwnProfile = authUser?.username === username;

  useEffect(() => {
    if (isOwnProfile && authUser) {
      setProfile(authUser);
      setLoading(false);
    } else {
      const fetchProfile = async () => {
        try {
          const res = await fetch(`/api/users/${username}`);
          const data: ApiResponse<UserProfile> = await res.json();
          if (data.success && data.data) setProfile(data.data);
        } catch (err) {
          console.error("Failed to fetch profile:", err);
        } finally {
          setLoading(false);
        }
      };
      fetchProfile();
    }
  }, [username, isOwnProfile, authUser]);

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
                <button className="btn-secondary text-sm px-4 py-2 gap-2 whitespace-nowrap">
                  <Pencil className="w-4 h-4" /> Edit Profile
                </button>
              ) : (
                <>
                  <button
                    onClick={handleAddFriend}
                    disabled={friendState === "loading" || friendState === "sent"}
                    className="btn-primary text-sm px-4 py-2 gap-2 whitespace-nowrap disabled:opacity-70"
                  >
                    <UserPlus className="w-4 h-4" />
                    {friendState === "sent" ? "Request Sent!" : friendState === "loading" ? "Sending..." : "Add Friend"}
                  </button>
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

        {/* Bio */}
        {profile.bio && (
          <p className="text-ghost-300 text-sm leading-relaxed mb-5 max-w-2xl">{profile.bio}</p>
        )}

        {/* Quick stats bar */}
        <div className="flex items-center gap-4 sm:gap-6 flex-wrap text-sm">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-phantom-400" />
            <span className="font-bold text-ghost-100">{profile.friendsCount}</span>
            <span className="text-ghost-500">Friends</span>
          </div>
          <div className="w-px h-4 bg-ghost-800 hidden sm:block" />
          <div className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-ghost-500" />
            <span className="text-ghost-500">Joined {joinDate}</span>
          </div>
          {mood && (
            <>
              <div className="w-px h-4 bg-ghost-800 hidden sm:block" />
              <div className={`flex items-center gap-2 ${mood.color}`}>
                {mood.icon}
                <span className="font-medium text-sm">{mood.label}</span>
              </div>
            </>
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
