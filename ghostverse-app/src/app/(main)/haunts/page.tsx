"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "../../../custom-hooks/use-auth";
import type { HauntPost, HauntReply, HauntReactionType } from "../../../types";
import { getGhostLevel } from "../../../lib/levels";
import { UserProfileCard } from "../../components/UserProfileCard";
import {
  Ghost, MessageCircle, Send, X, Plus, ChevronDown, ChevronUp,
  Loader2, Sparkles, RefreshCw
} from "lucide-react";
import Link from "next/link";
import { MentionInput } from "../../components/MentionInput";
import { FormattedText } from "../../components/FormattedText";

const REACTIONS: { type: HauntReactionType; emoji: string; label: string }[] = [
  { type: "SPOOKY", emoji: "👻", label: "Spooky" },
  { type: "FIRE",   emoji: "🔥", label: "Fire" },
  { type: "DEAD",   emoji: "💀", label: "Dead" },
  { type: "ICONIC", emoji: "✨", label: "Iconic" },
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
  onInspect,
  onReactionUpdate,
}: {
  haunt: HauntPost;
  currentUserId: string;
  onInspect: (user: { userId: string; username: string; displayName: string; avatar: string | null }) => void;
  onReactionUpdate: (hauntId: string, reactions: HauntPost["reactions"]) => void;
}) {
  const [showReplies, setShowReplies] = useState(false);
  const [replies, setReplies] = useState<HauntReply[]>([]);
  const [loadingReplies, setLoadingReplies] = useState(false);
  const [replyInput, setReplyInput] = useState("");
  const [submittingReply, setSubmittingReply] = useState(false);
  const [pendingReaction, setPendingReaction] = useState<HauntReactionType | null>(null);

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
      }
    } catch {}
    finally { setSubmittingReply(false); }
  };

  const totalReactions = haunt.reactions.reduce((s: number, r: HauntPost["reactions"][0]) => s + r.count, 0);

  return (
    <article className="glass-card p-5 group hover:border-white/10 transition-all duration-300 animate-fade-in">
      {/* Author row */}
      <div className="flex items-start gap-3 mb-4">
        <button
          onClick={() => onInspect({ userId: haunt.author.id, username: haunt.author.username, displayName: haunt.author.displayName, avatar: haunt.author.avatar })}
          className="flex-shrink-0 w-10 h-10 rounded-full overflow-hidden border border-white/10 hover:ring-2 hover:ring-phantom-500/60 transition-all"
        >
          {haunt.author.avatar ? (
            <img src={haunt.author.avatar} alt={haunt.author.displayName} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-ghost-800 flex items-center justify-center text-ghost-300 font-bold text-sm">
              {haunt.author.displayName.charAt(0).toUpperCase()}
            </div>
          )}
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => onInspect({ userId: haunt.author.id, username: haunt.author.username, displayName: haunt.author.displayName, avatar: haunt.author.avatar })}
              className={`text-sm font-bold hover:underline transition-colors ${level.color}`}
            >
              {haunt.author.displayName}
            </button>
            {level.badge && <span className="flex-shrink-0">{level.badge}</span>}
            <span className="text-xs text-ghost-500">@{haunt.author.username}</span>
          </div>
          <span className="text-[11px] text-ghost-600">{formatRelativeTime(haunt.createdAt)}</span>
        </div>
      </div>

      {/* Content */}
      <p className="text-ghost-100 text-sm leading-relaxed mb-4">
        <FormattedText content={haunt.content} onInspect={onInspect} />
      </p>

      {/* Reactions row */}
      <div className="flex items-center gap-2 flex-wrap mb-3">
        {REACTIONS.map(({ type, emoji, label }) => {
          const reaction = haunt.reactions.find((r) => r.type === type);
          const isActive = userReaction === type;
          return (
            <button
              key={type}
              onClick={() => handleReact(type)}
              disabled={pendingReaction !== null}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all duration-200 ${
                isActive
                  ? "bg-phantom-500/20 border-phantom-500/40 text-phantom-300 scale-105"
                  : "bg-ghost-900/50 border-ghost-800/60 text-ghost-500 hover:border-ghost-700 hover:text-ghost-300 hover:bg-ghost-800/50"
              } ${pendingReaction === type ? "opacity-50" : ""}`}
              title={label}
            >
              <span className="text-base leading-none">{emoji}</span>
              {reaction && reaction.count > 0 && (
                <span className={isActive ? "text-phantom-300" : "text-ghost-400"}>{reaction.count}</span>
              )}
            </button>
          );
        })}
        {totalReactions > 0 && (
          <span className="text-xs text-ghost-600 ml-1">{totalReactions} reaction{totalReactions !== 1 ? "s" : ""}</span>
        )}
      </div>

      {/* Divider + Echo (reply) toggle */}
      <div className="flex items-center justify-between pt-2 border-t border-white/5">
        <button
          onClick={toggleReplies}
          className="flex items-center gap-1.5 text-xs text-ghost-500 hover:text-ghost-300 transition-colors"
        >
          <MessageCircle className="w-3.5 h-3.5" />
          {haunt.replyCount > 0
            ? `${haunt.replyCount} Echo${haunt.replyCount !== 1 ? "es" : ""}`
            : "Echo"}
          {showReplies ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
        <Link href={`/profile/${haunt.author.username}`} className="text-[10px] text-ghost-600 hover:text-phantom-400 transition-colors">
          View Profile →
        </Link>
      </div>

      {/* Replies section */}
      {showReplies && (
        <div className="mt-3 pt-3 border-t border-white/5 space-y-3">
          {loadingReplies ? (
            <div className="flex justify-center py-3">
              <Loader2 className="w-4 h-4 text-phantom-500 animate-spin" />
            </div>
          ) : replies.length === 0 ? (
            <p className="text-xs text-ghost-600 text-center py-2">No echoes yet. Be the first!</p>
          ) : (
            replies.map((reply) => (
              <div key={reply.id} className="flex items-start gap-2.5 pl-2 border-l-2 border-ghost-800">
                <button
                  onClick={() => onInspect({ userId: reply.author.id, username: reply.author.username, displayName: reply.author.displayName, avatar: reply.author.avatar })}
                  className="flex-shrink-0 w-7 h-7 rounded-full overflow-hidden border border-white/10 hover:ring-1 hover:ring-phantom-500/50 transition-all"
                >
                  {reply.author.avatar ? (
                    <img src={reply.author.avatar} alt={reply.author.displayName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-ghost-800 flex items-center justify-center text-ghost-400 text-[10px] font-bold">
                      {reply.author.displayName.charAt(0).toUpperCase()}
                    </div>
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-1.5 mb-0.5">
                    <button
                      onClick={() => onInspect({ userId: reply.author.id, username: reply.author.username, displayName: reply.author.displayName, avatar: reply.author.avatar })}
                      className={`text-xs font-bold hover:underline ${getGhostLevel(reply.author.reputationScore || 0).color}`}
                    >
                      {reply.author.displayName}
                    </button>
                    <span className="text-[10px] text-ghost-600">{formatRelativeTime(reply.createdAt)}</span>
                  </div>
                  <p className="text-xs text-ghost-300 leading-relaxed">
                    <FormattedText content={reply.content} onInspect={onInspect} />
                  </p>
                </div>
              </div>
            ))
          )}

          {/* Reply input */}
          <form onSubmit={submitReply} className="flex items-center gap-2 mt-2">
            <div className="flex-1">
              <MentionInput
                value={replyInput}
                onChange={setReplyInput}
                maxLength={280}
                placeholder="Write an echo..."
                className="w-full bg-ghost-900/60 border border-ghost-800 text-ghost-100 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-phantom-500/60 transition-colors placeholder:text-ghost-600"
                onSubmit={() => {
                  const e = { preventDefault: () => {} } as React.FormEvent;
                  submitReply(e);
                }}
              />
            </div>
            <button
              type="submit"
              disabled={!replyInput.trim() || submittingReply}
              className="flex-shrink-0 p-2 rounded-xl bg-phantom-600 text-white hover:bg-phantom-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              {submittingReply ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            </button>
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
    <div className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center p-4 sm:p-6 animate-fade-in">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg bg-ghost-900 border border-ghost-800/70 rounded-2xl shadow-2xl overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-white/5">
          <div className="flex items-center gap-2">
            <Ghost className="w-5 h-5 text-phantom-400" />
            <h2 className="font-bold text-ghost-100">New Haunt</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-ghost-800/60 flex items-center justify-center text-ghost-500 hover:text-ghost-200 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={submit} className="p-5 space-y-4">
          <div className="w-full">
            <MentionInput
              isTextArea
              value={content}
              onChange={setContent}
              maxLength={280}
              rows={5}
              placeholder="What's haunting you right now?"
              className="w-full bg-ghost-950/50 border border-ghost-800/50 text-ghost-100 text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-phantom-500/60 transition-colors resize-none placeholder:text-ghost-600 leading-relaxed"
              onSubmit={() => {
                const e = { preventDefault: () => {} } as React.FormEvent;
                submit(e);
              }}
            />
          </div>

          {error && (
            <p className="text-xs text-neon-red bg-error/10 px-3 py-2 rounded-lg">{error}</p>
          )}

          <div className="flex items-center justify-between">
            <span className={`text-xs font-medium tabular-nums ${isNearLimit ? (charsLeft <= 0 ? "text-neon-red" : "text-amber-400") : "text-ghost-600"}`}>
              {charsLeft} chars left
            </span>
            <div className="flex items-center gap-2">
              <button type="button" onClick={onClose} className="btn-ghost text-sm px-4 py-2">
                Cancel
              </button>
              <button
                type="submit"
                disabled={!content.trim() || charsLeft < 0 || submitting}
                className="btn-primary text-sm px-5 py-2 gap-2 disabled:opacity-50"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {submitting ? "Haunting..." : "Haunt"}
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
  const { user } = useAuth();
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
  };

  const handleReactionUpdate = (hauntId: string, reactions: HauntPost["reactions"]) => {
    setHaunts((prev) => prev.map((h) => h.id === hauntId ? { ...h, reactions } : h));
  };

  return (
    <div className="flex-1 overflow-y-auto w-full">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-ghost-950/80 backdrop-blur-xl border-b border-white/5 px-4 md:px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Ghost className="w-5 h-5 text-phantom-400" />
          <div>
            <h1 className="text-base font-bold text-ghost-100 leading-none">Haunts</h1>
            <p className="text-[11px] text-ghost-500 mt-0.5">The ghost feed</p>
          </div>
        </div>
        <button
          onClick={() => fetchHaunts(true)}
          disabled={refreshing}
          className="p-2 rounded-xl text-ghost-500 hover:text-ghost-300 hover:bg-ghost-800/50 transition-all"
          title="Refresh"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Feed */}
      <div className="max-w-2xl mx-auto px-4 py-5 space-y-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-8 h-8 border-2 border-phantom-500/30 border-t-phantom-500 rounded-full animate-spin" />
            <p className="text-ghost-500 text-sm">Summoning haunts...</p>
          </div>
        ) : haunts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
            <Ghost className="w-14 h-14 text-ghost-700" />
            <h3 className="text-lg font-bold text-ghost-400">No haunts yet</h3>
            <p className="text-sm text-ghost-600 max-w-xs">Be the first ghost to haunt the feed. Your words echo here.</p>
            <button onClick={() => setComposeOpen(true)} className="btn-primary mt-2 px-5 py-2.5 gap-2">
              <Plus className="w-4 h-4" /> Post First Haunt
            </button>
          </div>
        ) : (
          haunts.map((haunt) => (
            <HauntCard
              key={haunt.id}
              haunt={haunt}
              currentUserId={user?.id || ""}
              onInspect={setSelectedUser}
              onReactionUpdate={handleReactionUpdate}
            />
          ))
        )}
      </div>

      {/* Floating compose button */}
      {user && (
        <button
          onClick={() => setComposeOpen(true)}
          className="fixed bottom-20 md:bottom-6 right-4 md:right-6 w-14 h-14 rounded-full bg-phantom-600 hover:bg-phantom-500 text-white shadow-xl hover:shadow-phantom-500/30 hover:scale-105 active:scale-95 transition-all duration-200 flex items-center justify-center z-30"
          title="New Haunt"
        >
          <Plus className="w-6 h-6" />
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
