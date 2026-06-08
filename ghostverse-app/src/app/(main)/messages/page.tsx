"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import { MessageSquare, Edit } from "lucide-react";
import type { ApiResponse } from "@/types";

interface Conversation {
  id: string;
  otherUser: {
    id: string;
    username: string;
    displayName: string;
    avatar: string | null;
    status: string;
  };
  lastMessage: {
    content: string;
    createdAt: string;
  } | null;
  unreadCount: number;
  updatedAt: string;
}

export default function MessagesPage() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const res = await fetch("/api/messages");
        const data: ApiResponse<Conversation[]> = await res.json();
        if (data.success && data.data) {
          setConversations(data.data);
        }
      } catch (err) {
        console.error("Failed to fetch conversations:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchConversations();
  }, []);

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    const now = new Date();
    const diffHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const filtered = conversations.filter(c => 
    c.otherUser.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.otherUser.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-[calc(100vh-56px)] md:h-screen">
      {/* Conversations List */}
      <div className="w-full md:w-80 border-r border-white/5 flex flex-col">
        <div className="glass-nav px-4 py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <MessageSquare className="w-6 h-6 text-phantom-400" />
            <h1 className="text-lg font-bold text-ghost-100">Messages</h1>
          </div>
          <button className="btn-ghost text-xs px-2 py-1"><Edit className="w-4 h-4" /></button>
        </div>

        {/* Search */}
        <div className="px-3 py-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="glass-input focus-ring text-sm py-2"
            placeholder="Search conversations..."
          />
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
             <div className="flex justify-center p-8"><div className="w-6 h-6 border-2 border-phantom-500 border-t-transparent rounded-full animate-spin" /></div>
          ) : filtered.length === 0 ? (
            <div className="p-6 text-center text-ghost-500 text-sm">
              No conversations found.
            </div>
          ) : (
            filtered.map((conv) => (
              <Link
                href={`/messages/${conv.id}`}
                key={conv.id}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left border-b border-white/5"
              >
                <div className={`avatar avatar-sm ${conv.otherUser.status === "online" ? "avatar-online" : ""}`}>
                  {conv.otherUser.avatar ? (
                    <img src={conv.otherUser.avatar} alt={conv.otherUser.displayName} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    conv.otherUser.displayName.charAt(0)
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-ghost-100 truncate">
                      {conv.otherUser.displayName}
                    </span>
                    <span className="text-[10px] text-ghost-500 flex-shrink-0">
                      {conv.lastMessage ? formatTime(conv.lastMessage.createdAt) : ""}
                    </span>
                  </div>
                  <p className="text-xs text-ghost-500 truncate">
                    {conv.lastMessage ? conv.lastMessage.content : "Start chatting"}
                  </p>
                </div>
                {conv.unreadCount > 0 && (
                  <span className="w-5 h-5 rounded-full bg-phantom-500 text-white text-[10px] flex items-center justify-center font-bold flex-shrink-0">
                    {conv.unreadCount}
                  </span>
                )}
              </Link>
            ))
          )}
        </div>
      </div>

      {/* Chat Area - Empty State */}
      <div className="hidden md:flex flex-1 flex-col items-center justify-center px-6">
        <MessageSquare className="w-16 h-16 text-phantom-500 mb-4" style={{ animation: "float 3s ease-in-out infinite" }} />
        <h3 className="text-lg font-semibold text-ghost-200 mb-2">Select a conversation</h3>
        <p className="text-ghost-500 text-sm">Choose a friend to start chatting</p>
      </div>
    </div>
  );
}
