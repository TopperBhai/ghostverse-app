"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Users, Inbox, Send, Plus, Ghost, MessageSquare, X, Check } from "lucide-react";
import type { ApiResponse } from "@/types";

interface FriendData {
  id: string;
  displayName: string;
  username: string;
  avatar: string | null;
  status: "online" | "offline";
  lastSeen: string;
  friendshipId: string;
}

export default function FriendsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"friends" | "pending" | "sent" | "add">("friends");
  const [friends, setFriends] = useState<FriendData[]>([]);
  const [incoming, setIncoming] = useState<FriendData[]>([]);
  const [outgoing, setOutgoing] = useState<FriendData[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [addUsername, setAddUsername] = useState("");
  const [message, setMessage] = useState({ type: "", text: "" });
  const [loading, setLoading] = useState(true);

  const fetchFriends = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/friends");
      const data = await res.json();
      if (data.success && data.data) {
        setFriends(data.data.friends || []);
        setIncoming(data.data.pendingIncoming || []);
        setOutgoing(data.data.pendingOutgoing || []);
      }
    } catch (err) {
      console.error("Failed to fetch friends:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFriends();
  }, []);

  const handleAction = async (friendshipId: string, action: "ACCEPT" | "REJECT" | "REMOVE" | "CANCEL") => {
    try {
      const res = await fetch("/api/friends/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ friendshipId, action })
      });
      const data = await res.json();
      if (data.success) {
        fetchFriends();
      } else {
        alert(data.error || "Action failed");
      }
    } catch (err) {
      console.error("Action error:", err);
    }
  };

  const handleAddFriend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addUsername.trim()) return;
    
    setMessage({ type: "", text: "" });
    try {
      const res = await fetch("/api/friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: addUsername.trim() })
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: "success", text: "Friend request sent!" });
        setAddUsername("");
        fetchFriends();
      } else {
        setMessage({ type: "error", text: data.error || "Failed to send request" });
      }
    } catch (err) {
      setMessage({ type: "error", text: "An error occurred" });
    }
  };

  const tabs = [
    { id: "friends" as const, label: "Friends", icon: <Users className="w-4 h-4" />, count: friends.length },
    { id: "pending" as const, label: "Pending", icon: <Inbox className="w-4 h-4" />, count: incoming.length },
    { id: "sent" as const, label: "Sent", icon: <Send className="w-4 h-4" />, count: outgoing.length },
    { id: "add" as const, label: "Add Friend", icon: <Plus className="w-4 h-4" />, count: 0 },
  ];

  const getActiveList = () => {
    if (activeTab === "friends") return friends;
    if (activeTab === "pending") return incoming;
    if (activeTab === "sent") return outgoing;
    return [];
  };

  const activeList = getActiveList().filter(f => 
    f.username.toLowerCase().includes(searchQuery.toLowerCase()) || 
    f.displayName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-[calc(100vh-56px)] md:h-screen">
      <div className="glass-nav px-6 py-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <Users className="w-8 h-8 text-phantom-400" />
          <div>
            <h1 className="text-lg font-bold text-ghost-100">Friends</h1>
            <p className="text-xs text-ghost-500">Manage your connections</p>
          </div>
        </div>
      </div>

      <div className="px-4 pt-4 flex gap-2 overflow-x-auto no-scrollbar">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? "bg-phantom-500/15 text-phantom-400"
                : "text-ghost-400 hover:bg-white/5"
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
            {tab.count > 0 && (
              <span className="text-[10px] bg-ghost-700 text-ghost-200 px-1.5 py-0.5 rounded-full font-bold">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {activeTab !== "add" ? (
        <>
          <div className="px-4 py-3">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="glass-input focus-ring text-sm py-2.5"
              placeholder="Filter list..."
            />
          </div>

          <div className="flex-1 overflow-y-auto px-4 pb-4">
            {loading ? (
              <div className="flex justify-center p-8"><div className="w-8 h-8 border-2 border-phantom-500 border-t-transparent rounded-full animate-spin" /></div>
            ) : activeList.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <Ghost className="w-16 h-16 mb-4 text-ghost-700" />
                <h3 className="text-lg font-semibold text-ghost-200 mb-2">No users found</h3>
                <p className="text-ghost-500 text-sm max-w-sm">
                  {activeTab === "friends" && "You haven't added any friends yet."}
                  {activeTab === "pending" && "No pending friend requests."}
                  {activeTab === "sent" && "No friend requests sent."}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {activeList.map((friend) => (
                  <div key={friend.friendshipId} className="glass-card p-4 flex items-center gap-4 animate-fade-in">
                    <div className={`avatar ${friend.status === "online" && activeTab === "friends" ? "avatar-online" : ""}`}>
                      {friend.avatar ? (
                        <img src={friend.avatar} alt={friend.displayName} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        friend.displayName.charAt(0)
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-ghost-100 text-sm truncate">{friend.displayName}</p>
                      <p className="text-xs text-ghost-500 truncate">@{friend.username}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {activeTab === "friends" && (
                        <>
                          <button 
                            onClick={() => {
                              const conversationId = [user?.id, friend.id].sort().join("_");
                              window.location.href = `/messages/${conversationId}`;
                            }}
                            className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-2"
                          >
                            <MessageSquare className="w-4 h-4" /> Message
                          </button>
                          <button onClick={() => handleAction(friend.friendshipId, "REMOVE")} className="btn-ghost text-xs px-2 py-1.5 text-neon-red hover:bg-error/10"><X className="w-4 h-4" /></button>
                        </>
                      )}
                      {activeTab === "pending" && (
                        <>
                          <button onClick={() => handleAction(friend.friendshipId, "ACCEPT")} className="btn-primary text-xs px-3 py-1.5 flex items-center gap-2"><Check className="w-4 h-4" /> Accept</button>
                          <button onClick={() => handleAction(friend.friendshipId, "REJECT")} className="btn-ghost text-xs px-3 py-1.5 text-neon-red hover:bg-error/10">Reject</button>
                        </>
                      )}
                      {activeTab === "sent" && (
                        <button onClick={() => handleAction(friend.friendshipId, "CANCEL")} className="btn-ghost text-xs px-3 py-1.5 text-ghost-400 hover:text-ghost-200 hover:bg-white/5">Cancel Request</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="flex-1 px-4 py-8 max-w-md mx-auto w-full">
          <div className="glass-card p-6">
            <h2 className="text-lg font-bold text-ghost-100 mb-2">Add a Friend</h2>
            <p className="text-sm text-ghost-400 mb-6">Enter their exact username to send a friend request.</p>
            
            <form onSubmit={handleAddFriend} className="space-y-4">
              <div>
                <div className="relative group">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 font-medium">@</span>
                  <input
                    type="text"
                    value={addUsername}
                    onChange={(e) => setAddUsername(e.target.value.toLowerCase())}
                    className="w-full bg-zinc-900/50 border border-zinc-800 text-zinc-100 rounded-xl px-4 py-3 pl-9 outline-none focus:border-phantom-500 focus:ring-1 focus:ring-phantom-500 transition-all placeholder:text-zinc-600"
                    placeholder="username"
                    required
                  />
                </div>
              </div>
              
              {message.text && (
                <div className={`p-3 rounded-lg text-sm font-medium ${message.type === "success" ? "bg-success/10 text-success" : "bg-error/10 text-neon-red"}`}>
                  {message.text}
                </div>
              )}
              
              <button type="submit" disabled={!addUsername.trim()} className="w-full btn-primary py-3">
                Send Request
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
