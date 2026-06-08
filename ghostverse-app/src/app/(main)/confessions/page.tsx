"use client";

import { useState } from "react";
import { VenetianMask, SquarePen, Ghost, Heart, MessageSquare, Flag } from "lucide-react";

const SAMPLE_CONFESSIONS: any[] = [];

export default function ConfessionsPage() {
  const [confessions, setConfessions] = useState(SAMPLE_CONFESSIONS);
  const [newConfession, setNewConfession] = useState("");
  const [showForm, setShowForm] = useState(false);

  const toggleLike = (id: string) => {
    setConfessions((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, liked: !c.liked, likes: c.liked ? c.likes - 1 : c.likes + 1 }
          : c
      )
    );
  };

  const submitConfession = () => {
    if (!newConfession.trim()) return;
    const newItem = {
      id: `new-${Date.now()}`,
      content: newConfession.trim(),
      likes: 0,
      comments: 0,
      time: "Just now",
      liked: false,
    };
    setConfessions([newItem, ...confessions]);
    setNewConfession("");
    setShowForm(false);
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
                  disabled={!newConfession.trim()}
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
        {confessions.map((confession, i) => (
          <div
            key={confession.id}
            className="glass-card p-5 page-enter"
            style={{ animationDelay: `${i * 0.05}s` }}
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="avatar avatar-sm flex items-center justify-center" style={{ background: `hsl(${parseInt(confession.id) * 60}, 60%, 50%)` }}>
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
        ))}
      </div>
    </div>
  );
}
