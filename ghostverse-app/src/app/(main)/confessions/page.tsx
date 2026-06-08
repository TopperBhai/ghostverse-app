"use client";

import { useState, useEffect } from "react";
import { VenetianMask, SquarePen, Ghost, Heart, MessageSquare, Flag } from "lucide-react";
import { useAuth } from "../../../custom-hooks/use-auth";

export default function ConfessionsPage() {
  const { user } = useAuth();
  const [confessions, setConfessions] = useState<any[]>([]);
  const [newConfession, setNewConfession] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchConfessions = async () => {
      try {
        const res = await fetch("/api/confessions?limit=50");
        const data = await res.json();
        if (data.success && data.data) {
          // Map to the format the UI expects, adding `liked` state based on `likedBy` array
          const mapped = data.data.map((c: any) => ({
            ...c,
            liked: user ? (c.likedBy || []).includes(user.id) : false,
            time: formatTime(c.createdAt)
          }));
          setConfessions(mapped);
        }
      } catch (err) {
        console.error("Failed to fetch confessions:", err);
      } finally {
        setLoading(false);
      }
    };
    
    if (user) fetchConfessions();
  }, [user]);

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  const toggleLike = async (id: string) => {
    // Optimistic update
    setConfessions((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, liked: !c.liked, likes: c.liked ? c.likes - 1 : c.likes + 1 }
          : c
      )
    );

    try {
      await fetch(`/api/confessions/${id}/like`, { method: "POST" });
    } catch (err) {
      console.error("Failed to toggle like:", err);
      // Revert on error could be added here
    }
  };

  const submitConfession = async () => {
    if (!newConfession.trim() || !user) return;
    
    const content = newConfession.trim();
    setNewConfession("");
    setShowForm(false);
    
    // Optimistic insert
    const tempId = `temp-${Date.now()}`;
    const newItem = {
      id: tempId,
      content: content,
      likes: 0,
      comments: 0,
      time: "Just now",
      liked: false,
    };
    setConfessions([newItem, ...confessions]);

    try {
      const res = await fetch("/api/confessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const data = await res.json();
      
      if (data.success) {
        setConfessions((prev) => 
          prev.map((c) => c.id === tempId ? {
            ...data.data,
            liked: false,
            time: "Just now"
          } : c)
        );
      } else {
        // Remove temp if failed
        setConfessions((prev) => prev.filter(c => c.id !== tempId));
        alert("Failed to post confession.");
      }
    } catch (err) {
      console.error("Failed to post:", err);
      setConfessions((prev) => prev.filter(c => c.id !== tempId));
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-56px)] md:h-screen">
      {/* Header */}
      <div className="glass-nav px-6 py-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <VenetianMask className="w-8 h-8 text-phantom-400" />
          <div>
            <h1 className="text-lg font-bold text-ghost-100">Confessions</h1>
            <p className="text-xs text-ghost-500">Share your secrets anonymously</p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-primary text-sm px-4 py-2"
        >
          <SquarePen className="w-4 h-4 inline mr-1" /> Confess
        </button>
      </div>

      {/* New confession form */}
      {showForm && (
        <div className="px-4 pt-4 animate-slide-down">
          <div className="glass-card p-4">
            <textarea
              value={newConfession}
              onChange={(e) => setNewConfession(e.target.value)}
              className="glass-input focus-ring resize-none h-24 text-sm"
              placeholder="What's on your mind? Nobody will know it's you... 👻"
              maxLength={500}
            />
            <div className="flex items-center justify-between mt-3">
              <span className="text-xs text-ghost-600">
                {newConfession.length}/500
              </span>
              <div className="flex gap-2">
                <button onClick={() => setShowForm(false)} className="btn-ghost text-xs">
                  Cancel
                </button>
                <button
                  onClick={submitConfession}
                  disabled={!newConfession.trim() || !user}
                  className="btn-primary text-xs px-4"
                >
                  Post Anonymously
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confessions Feed */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {loading ? (
          <div className="flex justify-center p-8"><div className="w-6 h-6 border-2 border-phantom-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : confessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-20">
            <VenetianMask className="w-12 h-12 mb-4 text-ghost-600" />
            <p className="text-ghost-500 text-sm">No confessions yet. Be the first to share a secret!</p>
          </div>
        ) : (
          confessions.map((confession, i) => (
            <div
              key={confession.id}
              className="glass-card p-5 page-enter"
              style={{ animationDelay: `${Math.min(i, 20) * 0.05}s` }}
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="avatar avatar-sm flex items-center justify-center" style={{ background: `hsl(${Math.abs(confession.id.hashCode?.() || parseInt(confession.id.slice(0,8), 16)) % 360}, 60%, 50%)` }}>
                  <Ghost className="w-4 h-4 text-white" />
                </div>
                <span className="text-xs text-ghost-500">Anonymous • {confession.time}</span>
              </div>

              <p className="text-ghost-200 text-sm leading-relaxed mb-4">
                {confession.content}
              </p>

              <div className="flex items-center gap-4">
                <button
                  onClick={() => toggleLike(confession.id)}
                  className={`flex items-center gap-1.5 text-sm transition-all ${
                    confession.liked
                      ? "text-neon-pink"
                      : "text-ghost-500 hover:text-neon-pink"
                  }`}
                >
                  <span>{confession.liked ? <Heart className="w-4 h-4 fill-current" /> : <Heart className="w-4 h-4" />}</span>
                  <span className="text-xs">{confession.likes}</span>
                </button>
                <button className="flex items-center gap-1.5 text-sm text-ghost-500 hover:text-ghost-300 transition-colors">
                  <MessageSquare className="w-4 h-4" />
                  <span className="text-xs">{confession.comments}</span>
                </button>
                <button className="flex items-center gap-1.5 text-sm text-ghost-500 hover:text-neon-red transition-colors ml-auto">
                  <span className="text-xs"><Flag className="w-3 h-3 inline mr-1" /> Report</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
