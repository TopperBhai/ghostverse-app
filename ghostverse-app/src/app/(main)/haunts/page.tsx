"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "../../../custom-hooks/use-auth";
import type { HauntPost, HauntReply, HauntReactionType } from "../../../types";
import { getGhostLevel } from "../../../lib/levels";
import { UserProfileCard } from "../../components/UserProfileCard";
import { GhostPet } from "../../components/GhostPet";
import {
  Ghost, MessageCircle, Send, X, Plus,
  Loader2, Sparkles, RefreshCw, Trash2
} from "lucide-react";
import Link from "next/link";
import { MentionInput } from "../../components/MentionInput";
import { FormattedText } from "../../components/FormattedText";

const REACTIONS: { type: HauntReactionType; emoji: string; label: string; glow: string; text: string }[] = [
  { type: "SPOOKY", emoji: "👻", label: "Spooky", glow: "shadow-[0_0_15px_rgba(168,85,247,0.5)]", text: "text-purple-400" },
  { type: "FIRE",   emoji: "🔥", label: "Fire", glow: "shadow-[0_0_15px_rgba(239,68,68,0.5)]", text: "text-orange-400" },
  { type: "DEAD",   emoji: "💀", label: "Dead", glow: "shadow-[0_0_15px_rgba(255,255,255,0.4)]", text: "text-gray-300" },
  { type: "ICONIC", emoji: "✨", label: "Iconic", glow: "shadow-[0_0_15px_rgba(250,204,21,0.5)]", text: "text-yellow-300" },
];

function formatRelativeTime(date: Date | string): string {
  const d = new Date(date);
  const diff = Date.now() - d.getTime();
  const secs = Math.floor(diff / 1000);
  if (secs < 60) return "just now";
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ─── Haunt Card ─────────────────────────────────────────────────────────────
function HauntCard({
  haunt,
  currentUserId,
  currentUserRole,
  onInspect,
  onReactionUpdate,
  onDelete,
}: {
  haunt: HauntPost;
  currentUserId: string;
  currentUserRole?: string;
  onInspect: (user: { userId: string; username: string; displayName: string; avatar: string | null }) => void;
  onReactionUpdate: (hauntId: string, reactions: HauntPost["reactions"]) => void;
  onDelete?: (hauntId: string) => void;
}) {
  const [showReplies, setShowReplies] = useState(false);
  const [replies, setReplies] = useState<HauntReply[]>([]);
  const [loadingReplies, setLoadingReplies] = useState(false);
  const [replyInput, setReplyInput] = useState("");
  const [submittingReply, setSubmittingReply] = useState(false);
  const [pendingReaction, setPendingReaction] = useState<HauntReactionType | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this haunt?")) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/haunts/${haunt.id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success && onDelete) {
        onDelete(haunt.id);
      } else {
        alert(data.error || "Failed to delete haunt");
        setIsDeleting(false);
      }
    } catch {
      alert("Network error");
      setIsDeleting(false);
    }
  };

  const level = getGhostLevel(haunt.author.reputationScore || 0);

  const getUserReaction = () =>
    haunt.reactions.find((r: HauntPost["reactions"][0]) => r.reactedBy.includes(currentUserId))?.type || null;

  const userReaction = getUserReaction();

  const handleReact = async (type: HauntReactionType) => {
    if (pendingReaction) return;
    setPendingReaction(type);
    try {
      const res = await fetch(`/api/haunts/${haunt.id}/react`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
      const data = await res.json();
      if (data.success) {
        onReactionUpdate(haunt.id, data.data);
      }
    } catch {}
    finally { setPendingReaction(null); }
  };

  const loadReplies = async () => {
    if (loadingReplies || replies.length > 0) return;
    setLoadingReplies(true);
    try {
      const res = await fetch(`/api/haunts/${haunt.id}/replies`);
      const data = await res.json();
      if (data.success) setReplies(data.data);
    } catch {}
    finally { setLoadingReplies(false); }
  };

  const toggleReplies = () => {
    const next = !showReplies;
    setShowReplies(next);
    if (next) loadReplies();
  };

  const submitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyInput.trim() || submittingReply) return;
    setSubmittingReply(true);
    try {
      const res = await fetch(`/api/haunts/${haunt.id}/replies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: replyInput.trim() }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setReplies((prev) => [...prev, data.data]);
        setReplyInput("");
        // Optimistically increment reply count locally if needed
        haunt.replyCount++;
      }
    } catch {}
    finally { setSubmittingReply(false); }
  };

  const totalReactions = haunt.reactions.reduce((s: number, r: HauntPost["reactions"][0]) => s + r.count, 0);

  return (
    <article className="relative bg-gradient-to-br from-ghost-900/80 to-ghost-950/40 backdrop-blur-xl border border-white/5 rounded-3xl p-5 md:p-6 group hover:border-phantom-500/30 hover:shadow-[0_0_30px_rgba(139,92,246,0.1)] transition-all duration-500 animate-fade-in">
      {/* Premium Glow effect behind card on hover */}
      <div className="absolute inset-0 bg-phantom-500/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

      {/* Author row */}
      <div className="relative flex items-start gap-4 mb-4">
        <button
          onClick={() => onInspect({ userId: haunt.author.id, username: haunt.author.username, displayName: haunt.author.displayName, avatar: haunt.author.avatar })}
          className={`relative flex-shrink-0 w-12 h-12 rounded-full overflow-hidden hover:scale-105 transition-transform shadow-lg ${level.color.includes('cyan') ? 'shadow-cyan-500/20 ring-2 ring-cyan-500/30' : level.color.includes('phantom') ? 'shadow-phantom-500/20 ring-2 ring-phantom-500/30' : level.color.includes('orange') ? 'shadow-orange-500/20 ring-2 ring-orange-500/30' : 'border border-white/10'}`}
        >
          {haunt.author.avatar ? (
            <img src={haunt.author.avatar} alt={haunt.author.displayName} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-ghost-800 flex items-center justify-center text-ghost-300 font-black text-lg">
              {haunt.author.displayName.charAt(0).toUpperCase()}
            </div>
          )}
        </button>
        <div className="flex-1 min-w-0 pt-0.5">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => onInspect({ userId: haunt.author.id, username: haunt.author.username, displayName: haunt.author.displayName, avatar: haunt.author.avatar })}
              className={`text-base font-black hover:underline transition-colors tracking-tight ${level.color}`}
            >
              {haunt.author.displayName}
            </button>
            {level.badge && <span className="flex-shrink-0 scale-110 drop-shadow-sm">{level.badge}</span>}
            <span className="text-xs text-ghost-500 font-medium">@{haunt.author.username}</span>
            <span className="text-ghost-600 text-xs hidden sm:inline">·</span>
            <span className="text-[11px] text-ghost-500 uppercase tracking-widest font-semibold">{formatRelativeTime(haunt.createdAt)}</span>
          </div>
        </div>
        
        {/* DELETE BUTTON */}
        {(currentUserId === haunt.author.id || currentUserRole === "ADMIN") && (
          <button 
            onClick={handleDelete} 
            disabled={isDeleting}
            className="text-ghost-600 hover:text-neon-red transition-all duration-300 p-2 rounded-full hover:bg-neon-red/10 flex-shrink-0 opacity-0 group-hover:opacity-100"
            title="Delete Haunt"
          >
            {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
          </button>
        )}
      </div>

      {/* Content */}
      <p className="relative text-ghost-100 text-[15px] leading-relaxed mb-5 pl-16 pr-4 tracking-wide">
        <FormattedText content={haunt.content} onInspect={onInspect} />
      </p>

      {/* Reactions row */}
      <div className="relative flex items-center gap-3 flex-wrap mb-4 pl-16">
        {REACTIONS.map(({ type, emoji, label, glow, text }) => {
          const reaction = haunt.reactions.find((r) => r.type === type);
          const isActive = userReaction === type;
          return (
            <button
              key={type}
              onClick={() => handleReact(type)}
              disabled={pendingReaction !== null}
              className={`group/react flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-300 active:scale-90 ${
                isActive
                  ? `bg-white/10 ${text} ${glow} border border-white/20 scale-105`
                  : "bg-ghost-900/60 border border-ghost-800/80 text-ghost-500 hover:border-white/20 hover:text-white hover:bg-ghost-800/60 hover:scale-105"
              } ${pendingReaction === type ? "opacity-50" : ""}`}
              title={label}
            >
              <span className={`text-base leading-none transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover/react:scale-110 group-hover/react:-rotate-6'}`}>{emoji}</span>
              {reaction && reaction.count > 0 && (
                <span className={isActive ? text : "text-ghost-400"}>{reaction.count}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Action Row */}
      <div className="relative flex items-center justify-between pt-3 pl-16 pr-4 border-t border-white/5">
        <button
          onClick={toggleReplies}
          className="flex items-center gap-2 text-xs font-bold text-ghost-500 hover:text-phantom-300 transition-colors group/reply"
        >
          <div className="w-7 h-7 rounded-full bg-ghost-900 flex items-center justify-center group-hover/reply:bg-phantom-500/20 transition-colors">
            <MessageCircle className="w-3.5 h-3.5" />
          </div>
          {haunt.replyCount > 0
            ? `${haunt.replyCount} Echo${haunt.replyCount !== 1 ? "es" : ""}`
            : "Write an Echo..."}
        </button>
        <Link href={`/profile/${haunt.author.username}`} className="text-[10px] uppercase tracking-widest font-bold text-ghost-600 hover:text-phantom-400 transition-colors">
          View Profile →
        </Link>
      </div>

      {/* Replies Threading (Inline) */}
      {showReplies && (
        <div className="relative mt-4 pl-16 pr-4 space-y-4 animate-slide-up">
          <div className="absolute left-8 top-0 bottom-8 w-px bg-gradient-to-b from-white/10 to-transparent" />
          
          {loadingReplies ? (
            <div className="flex justify-center py-4">
              <Loader2 className="w-5 h-5 text-phantom-500 animate-spin" />
            </div>
          ) : replies.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6 gap-2">
              <Ghost className="w-8 h-8 text-ghost-800" />
              <p className="text-xs font-medium text-ghost-500 text-center">It's quiet in here. Start the echo.</p>
            </div>
          ) : (
            <div className="space-y-4 pt-2">
              {replies.map((reply) => (
                <div key={reply.id} className="relative flex items-start gap-3">
                  <button
                    onClick={() => onInspect({ userId: reply.author.id, username: reply.author.username, displayName: reply.author.displayName, avatar: reply.author.avatar })}
                    className="relative z-10 flex-shrink-0 w-8 h-8 rounded-full overflow-hidden border border-white/10 hover:ring-2 hover:ring-phantom-500/50 transition-all shadow-md bg-ghost-900"
                  >
                    {reply.author.avatar ? (
                      <img src={reply.author.avatar} alt={reply.author.displayName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-ghost-400 text-xs font-black">
                        {reply.author.displayName.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </button>
                  <div className="flex-1 min-w-0 bg-ghost-900/40 rounded-2xl p-3 border border-white/5">
                    <div className="flex items-baseline gap-2 mb-1">
                      <button
                        onClick={() => onInspect({ userId: reply.author.id, username: reply.author.username, displayName: reply.author.displayName, avatar: reply.author.avatar })}
                        className={`text-sm font-bold hover:underline ${getGhostLevel(reply.author.reputationScore || 0).color}`}
                      >
                        {reply.author.displayName}
                      </button>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-ghost-600">{formatRelativeTime(reply.createdAt)}</span>
                    </div>
                    <p className="text-[13px] text-ghost-200 leading-relaxed">
                      <FormattedText content={reply.content} onInspect={onInspect} />
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Inline Reply Input */}
          <form onSubmit={submitReply} className="relative flex items-start gap-3 pt-2">
            <div className="relative z-10 flex-shrink-0 w-8 h-8 rounded-full overflow-hidden border border-white/10 bg-ghost-800 flex items-center justify-center">
               <Ghost className="w-4 h-4 text-ghost-400" />
            </div>
            <div className="flex-1 relative">
              <MentionInput
                value={replyInput}
                onChange={setReplyInput}
                maxLength={280}
                placeholder="Write an echo..."
                className="w-full bg-ghost-900/60 border border-ghost-800 text-ghost-100 text-sm rounded-2xl pl-4 pr-12 py-3 focus:outline-none focus:border-phantom-500/50 focus:ring-1 focus:ring-phantom-500/50 transition-all placeholder:text-ghost-600"
                onSubmit={() => {
                  const e = { preventDefault: () => {} } as React.FormEvent;
                  submitReply(e);
                }}
              />
              <button
                type="submit"
                disabled={!replyInput.trim() || submittingReply}
                className="absolute right-1.5 top-1.5 bottom-1.5 aspect-square rounded-xl bg-phantom-600 text-white hover:bg-phantom-500 disabled:bg-ghost-800 disabled:text-ghost-500 transition-all flex items-center justify-center"
              >
                {submittingReply ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 -ml-0.5" />}
              </button>
            </div>
          </form>
        </div>
      )}
    </article>
  );
}

// ─── Compose Modal ───────────────────────────────────────────────────────────
function ComposeModal({ onClose, onPost }: { onClose: () => void; onPost: (haunt: HauntPost) => void }) {
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { textareaRef.current?.focus(); }, []);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || submitting) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/haunts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: content.trim() }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        onPost(data.data);
        onClose();
      } else {
        setError(data.error || "Failed to post haunt");
      }
    } catch {
      setError("Something went wrong. Try again.");
    }
    finally { setSubmitting(false); }
  };

  const charsLeft = 280 - content.length;
  const isNearLimit = charsLeft <= 40;

  return (
    <div className="fixed inset-0 z-[300] flex items-end md:items-center justify-center p-0 md:p-6">
      <div className="absolute inset-0 bg-ghost-950/80 backdrop-blur-md animate-fade-in" onClick={onClose} />
      <div className="relative w-full max-w-xl bg-gradient-to-b from-ghost-900 to-ghost-950 md:border border-white/10 md:rounded-3xl rounded-t-3xl shadow-2xl overflow-hidden animate-slide-up">
        {/* Glow Effects */}
        <div className="absolute -top-32 -right-32 w-64 h-64 bg-phantom-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="relative flex items-center justify-between px-6 pt-6 pb-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-phantom-500/20 flex items-center justify-center border border-phantom-400/30">
              <Sparkles className="w-5 h-5 text-phantom-300" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tight">Summon Haunt</h2>
              <p className="text-[11px] font-semibold text-ghost-400 uppercase tracking-widest mt-0.5">Share your spirit</p>
            </div>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-ghost-800/50 flex items-center justify-center text-ghost-400 hover:text-white hover:bg-white/10 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={submit} className="relative p-6 space-y-5">
          <div className="w-full relative">
            <MentionInput
              isTextArea
              value={content}
              onChange={setContent}
              maxLength={280}
              rows={5}
              placeholder="What's haunting your thoughts?"
              className="w-full bg-black/20 border border-white/5 text-white text-lg md:text-xl rounded-2xl px-5 py-4 focus:outline-none focus:border-phantom-500/50 focus:bg-black/40 transition-all resize-none placeholder:text-ghost-600 leading-relaxed font-medium"
              onSubmit={() => {
                const e = { preventDefault: () => {} } as React.FormEvent;
                submit(e);
              }}
            />
          </div>

          {error && (
            <p className="text-sm font-bold text-neon-red bg-error/10 border border-error/20 px-4 py-3 rounded-xl">{error}</p>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-white/5">
            <span className={`text-sm font-black tabular-nums ${isNearLimit ? (charsLeft <= 0 ? "text-neon-red" : "text-amber-400") : "text-ghost-600"}`}>
              {charsLeft}
            </span>
            <div className="flex items-center gap-3">
              <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-bold text-ghost-400 hover:text-white transition-colors">
                Cancel
              </button>
              <button
                type="submit"
                disabled={!content.trim() || charsLeft < 0 || submitting}
                className="btn-primary text-sm px-6 py-2.5 gap-2 shadow-lg shadow-phantom-500/25 disabled:opacity-50 disabled:shadow-none transition-all hover:scale-105 active:scale-95"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {submitting ? "Summoning..." : "Post Haunt"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function HauntsPage() {
  const { user, refreshUser } = useAuth();
  const [haunts, setHaunts] = useState<HauntPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [composeOpen, setComposeOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<{
    userId: string; username: string; displayName: string; avatar: string | null;
  } | null>(null);

  const fetchHaunts = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await fetch("/api/haunts?limit=30");
      const data = await res.json();
      if (data.success) setHaunts(data.data);
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchHaunts(); }, [fetchHaunts]);

  const handleNewHaunt = (haunt: HauntPost) => {
    setHaunts((prev) => [haunt, ...prev]);
    refreshUser(); // Update XP & Streak locally
  };

  const handleReactionUpdate = (hauntId: string, reactions: HauntPost["reactions"]) => {
    setHaunts((prev) => prev.map((h) => h.id === hauntId ? { ...h, reactions } : h));
  };

  const handleDeleteHaunt = (hauntId: string) => {
    setHaunts((prev) => prev.filter((h) => h.id !== hauntId));
  };

  return (
    <div className="flex-1 overflow-y-auto w-full relative">
      {/* Sticky Premium Header */}
      <div className="sticky top-0 z-20 bg-ghost-950/80 backdrop-blur-2xl border-b border-white/5 px-4 md:px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-phantom-500/10 flex items-center justify-center border border-phantom-500/20 shadow-[0_0_15px_rgba(139,92,246,0.1)]">
            <Ghost className="w-5 h-5 text-phantom-400" />
          </div>
          <div>
            <h1 className="text-lg font-black text-white leading-none tracking-tight">The Haunts</h1>
            <p className="text-[10px] font-bold text-ghost-400 uppercase tracking-widest mt-1">Global Ghost Feed</p>
          </div>
        </div>
        <button
          onClick={() => fetchHaunts(true)}
          disabled={refreshing}
          className="p-2.5 rounded-full bg-white/5 hover:bg-white/10 text-ghost-300 transition-all hover:rotate-180 duration-500"
          title="Refresh Feed"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin text-phantom-400" : ""}`} />
        </button>
      </div>

      {/* Feed Container */}
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <div className="relative">
              <div className="w-12 h-12 border-4 border-phantom-500/20 border-t-phantom-500 rounded-full animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-2 h-2 bg-phantom-400 rounded-full animate-pulse" />
              </div>
            </div>
            <p className="text-ghost-400 text-sm font-semibold uppercase tracking-widest animate-pulse">Summoning spirits...</p>
          </div>
        ) : haunts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center animate-fade-in relative">
            <div className="absolute inset-0 bg-phantom-500/5 rounded-full blur-3xl scale-150 pointer-events-none" />
            <div className="relative z-10 mb-6 drop-shadow-[0_0_20px_rgba(139,92,246,0.2)]">
              <GhostPet status="HAPPY" level={10} size="xl" />
            </div>
            <h3 className="text-3xl font-black text-white mb-2 tracking-tight">It's Dead Quiet.</h3>
            <p className="text-base text-ghost-400 max-w-sm mb-8 leading-relaxed">
              Be the first ghost to haunt the feed. Share your thoughts, code, or just say boo.
            </p>
            <button onClick={() => setComposeOpen(true)} className="btn-primary text-base px-8 py-3.5 gap-2 shadow-lg shadow-phantom-500/30 hover:scale-105 active:scale-95 transition-all">
              <Sparkles className="w-5 h-5" /> Summon the First Haunt
            </button>
          </div>
        ) : (
          haunts.map((haunt) => (
            <HauntCard
              key={haunt.id}
              haunt={haunt}
              currentUserId={user?.id || ""}
              currentUserRole={user?.role}
              onInspect={setSelectedUser}
              onReactionUpdate={handleReactionUpdate}
              onDelete={handleDeleteHaunt}
            />
          ))
        )}
      </div>

      {/* Magical Floating Compose Button */}
      {user && !composeOpen && (
        <button
          onClick={() => setComposeOpen(true)}
          className="fixed bottom-24 md:bottom-8 right-6 md:right-8 w-16 h-16 rounded-full bg-gradient-to-br from-phantom-500 to-purple-600 text-white shadow-[0_0_30px_rgba(139,92,246,0.4)] hover:shadow-[0_0_40px_rgba(139,92,246,0.6)] hover:scale-110 active:scale-95 transition-all duration-300 flex items-center justify-center z-40 group"
          title="Summon Haunt"
        >
          {/* Outer pulsing ring */}
          <div className="absolute inset-0 rounded-full border-2 border-phantom-300 opacity-50 animate-ping" style={{ animationDuration: '3s' }} />
          <Plus className="w-8 h-8 group-hover:rotate-90 transition-transform duration-300 drop-shadow-md" />
        </button>
      )}

      {/* Compose modal */}
      {composeOpen && (
        <ComposeModal onClose={() => setComposeOpen(false)} onPost={handleNewHaunt} />
      )}

      {/* Profile inspect card */}
      {selectedUser && (
        <UserProfileCard
          {...selectedUser}
          onClose={() => setSelectedUser(null)}
        />
      )}
    </div>
  );
}
