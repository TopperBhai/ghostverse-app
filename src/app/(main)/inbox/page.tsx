"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../../custom-hooks/use-auth";
import Link from "next/link";
import { MessageSquare, Users, Inbox as InboxIcon, Send, Plus, X, Check, Ghost, Edit } from "lucide-react";
import { useSocket } from "../../../custom-hooks/use-socket";
import { UserAvatar } from "../../components/UserAvatar";
import type { ApiResponse, GhostCosmetics } from "../../../types";
import { UserProfileCard } from "../../components/UserProfileCard";

interface Conversation {
  id: string;
  otherUser: {
    id: string;
    username: string;
    displayName: string;
    avatar: string | null;
    status: string;
    cosmetics?: GhostCosmetics | null;
  };
  lastMessage: {
    content: string;
    createdAt: string;
    senderId: string;
  } | null;
  unreadCount: number;
  updatedAt: string;
}

interface FriendData {
  id: string;
  displayName: string;
  username: string;
  avatar: string | null;
  status: "online" | "offline";
  lastSeen: string;
  friendshipId: string;
}

export default function InboxPage() {
  const { user } = useAuth();
  
  // Segmented control state
  const [activeSection, setActiveSection] = useState<"chats" | "friends">("chats");
  
  // Data states
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [friends, setFriends] = useState<FriendData[]>([]);
  const [incoming, setIncoming] = useState<FriendData[]>([]);
  const [outgoing, setOutgoing] = useState<FriendData[]>([]);
  
  // Friends tab state
  const [activeFriendTab, setActiveFriendTab] = useState<"friends" | "pending" | "sent" | "add">("friends");
  const [friendSearchQuery, setFriendSearchQuery] = useState("");
  const [addUsername, setAddUsername] = useState("");
  const [friendMessage, setFriendMessage] = useState({ type: "", text: "" });
  
  // Chats search state
  const [chatSearchQuery, setChatSearchQuery] = useState("");
  
  // Loading & Selected User states
  const [loadingChats, setLoadingChats] = useState(true);
  const [loadingFriends, setLoadingFriends] = useState(true);
  const [selectedUser, setSelectedUser] = useState<{userId: string; username: string; displayName: string; avatar: string | null} | null>(null);

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        setLoadingChats(true);
        const res = await fetch("/api/messages");
        const data: ApiResponse<Conversation[]> = await res.json();
        if (data.success && data.data) {
          setConversations(data.data);
        }
      } catch (err) {
        console.error("Failed to fetch conversations:", err);
      } finally {
        setLoadingChats(false);
      }
    };

    const fetchFriendsData = async () => {
      try {
        setLoadingFriends(true);
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
        setLoadingFriends(false);
      }
    };

    if (user) {
      fetchConversations();
      fetchFriendsData();
    }
  }, [user]);

  // --- Handlers for Friends ---
  const handleFriendAction = async (friendshipId: string, action: "ACCEPT" | "REJECT" | "REMOVE" | "CANCEL") => {
    try {
      const res = await fetch("/api/friends/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ friendshipId, action })
      });
      const data = await res.json();
      if (data.success) {
        // Optimistically reload friends
        const fRes = await fetch("/api/friends");
        const fData = await fRes.json();
        if (fData.success && fData.data) {
          setFriends(fData.data.friends || []);
          setIncoming(fData.data.pendingIncoming || []);
          setOutgoing(fData.data.pendingOutgoing || []);
        }
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
    
    setFriendMessage({ type: "", text: "" });
    try {
      const res = await fetch("/api/friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: addUsername.trim() })
      });
      const data = await res.json();
      if (data.success) {
        setFriendMessage({ type: "success", text: "Friend request sent!" });
        setAddUsername("");
        // Optimistically reload
        const fRes = await fetch("/api/friends");
        const fData = await fRes.json();
        if (fData.success && fData.data) {
          setOutgoing(fData.data.pendingOutgoing || []);
        }
      } else {
        setFriendMessage({ type: "error", text: data.error || "Failed to send request" });
      }
    } catch (err) {
      setFriendMessage({ type: "error", text: "An error occurred" });
    }
  };

  // --- Formatting & Filtering ---
  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    const diffHours = (Date.now() - date.getTime()) / (1000 * 60 * 60);
    if (diffHours < 24) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const filteredChats = conversations.filter(c => 
    c.otherUser.displayName.toLowerCase().includes(chatSearchQuery.toLowerCase()) ||
    c.otherUser.username.toLowerCase().includes(chatSearchQuery.toLowerCase())
  );

  const getActiveFriendList = () => {
    if (activeFriendTab === "friends") return friends;
    if (activeFriendTab === "pending") return incoming;
    if (activeFriendTab === "sent") return outgoing;
    return [];
  };

  const filteredFriends = getActiveFriendList().filter(f => 
    f.username.toLowerCase().includes(friendSearchQuery.toLowerCase()) || 
    f.displayName.toLowerCase().includes(friendSearchQuery.toLowerCase())
  );

  const friendTabs = [
    { id: "friends" as const, label: "Friends", icon: <Users className="w-4 h-4" />, count: friends.length },
    { id: "pending" as const, label: "Pending", icon: <InboxIcon className="w-4 h-4" />, count: incoming.length },
    { id: "sent" as const, label: "Sent", icon: <Send className="w-4 h-4" />, count: outgoing.length },
    { id: "add" as const, label: "Add", icon: <Plus className="w-4 h-4" />, count: 0 },
  ];

  return (
    <div className="flex h-[calc(100vh-56px)] md:h-[calc(100vh-64px)] overflow-hidden">
      {/* Left Pane: Unified Inbox */}
      <div className="w-full md:w-80 lg:w-96 border-r border-white/5 flex flex-col bg-ghost-950">
        
        {/* Header with Segmented Control */}
        <div className="px-4 pt-4 pb-2 flex-shrink-0">
          <h1 className="text-xl font-bold text-ghost-100 mb-4 flex items-center gap-2">
            <InboxIcon className="w-6 h-6 text-phantom-400" />
            Inbox
          </h1>
          <div className="flex p-1 bg-ghost-900 rounded-xl border border-white/5">
            <button
              onClick={() => setActiveSection("chats")}
              className={`flex-1 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                activeSection === "chats" ? "bg-phantom-500 text-white shadow-sm" : "text-ghost-400 hover:text-ghost-200"
              }`}
            >
              Chats
            </button>
            <button
              onClick={() => setActiveSection("friends")}
              className={`flex-1 py-1.5 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
                activeSection === "friends" ? "bg-phantom-500 text-white shadow-sm" : "text-ghost-400 hover:text-ghost-200"
              }`}
            >
              Friends
              {incoming.length > 0 && activeSection !== "friends" && (
                <span className="w-2 h-2 rounded-full bg-neon-red" />
              )}
            </button>
          </div>
        </div>

        {/* ==================================================== */}
        {/* CHATS VIEW */}
        {/* ==================================================== */}
        {activeSection === "chats" && (
          <>
            <div className="px-4 py-2">
              <input
                type="text"
                value={chatSearchQuery}
                onChange={(e) => setChatSearchQuery(e.target.value)}
                className="glass-input focus-ring text-sm py-2 px-3"
                placeholder="Search chats..."
              />
            </div>
            <div className="flex-1 overflow-y-auto">
              {loadingChats ? (
                <div className="flex justify-center p-8"><div className="w-6 h-6 border-2 border-phantom-500 border-t-transparent rounded-full animate-spin" /></div>
              ) : filteredChats.length === 0 ? (
                <div className="p-8 text-center flex flex-col items-center justify-center h-full">
                  <MessageSquare className="w-12 h-12 text-ghost-800 mb-3" />
                  <p className="text-ghost-400 text-sm font-medium">No conversations found.</p>
                </div>
              ) : (
                filteredChats.map((conv) => (
                  <Link
                    href={`/messages/${conv.id}`}
                    key={conv.id}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left border-b border-white/[0.02]"
                  >
                    <UserAvatar 
                      avatarUrl={conv.otherUser.avatar}
                      displayName={conv.otherUser.displayName}
                      cosmetics={conv.otherUser.cosmetics}
                      size="w-12 h-12"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-sm font-medium text-ghost-100 truncate pr-2">
                          {conv.otherUser.displayName}
                        </span>
                        <span className="text-[10px] font-medium text-ghost-500 flex-shrink-0">
                          {conv.lastMessage ? formatTime(conv.lastMessage.createdAt) : ""}
                        </span>
                      </div>
                      <p className={`text-xs truncate ${conv.unreadCount > 0 ? "text-ghost-200 font-medium" : "text-ghost-500"}`}>
                        {conv.lastMessage ? conv.lastMessage.content : "Start chatting"}
                      </p>
                    </div>
                    {conv.unreadCount > 0 && (
                      <span className="w-5 h-5 rounded-full bg-phantom-500 text-white text-[10px] flex items-center justify-center font-bold flex-shrink-0 shadow-sm shadow-phantom-500/20">
                        {conv.unreadCount}
                      </span>
                    )}
                  </Link>
                ))
              )}
            </div>
          </>
        )}

        {/* ==================================================== */}
        {/* FRIENDS VIEW */}
        {/* ==================================================== */}
        {activeSection === "friends" && (
          <div className="flex flex-col flex-1 h-full">
            <div className="px-4 py-2 flex gap-1.5 overflow-x-auto no-scrollbar">
              {friendTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveFriendTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                    activeFriendTab === tab.id
                      ? "bg-phantom-500/15 text-phantom-400"
                      : "text-ghost-400 hover:bg-white/5"
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                  {tab.count > 0 && (
                    <span className="text-[9px] bg-ghost-800 text-ghost-200 px-1.5 py-0.5 rounded-full font-bold ml-1">
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {activeFriendTab !== "add" ? (
              <>
                <div className="px-4 py-2">
                  <input
                    type="text"
                    value={friendSearchQuery}
                    onChange={(e) => setFriendSearchQuery(e.target.value)}
                    className="glass-input focus-ring text-sm py-2 px-3"
                    placeholder="Filter list..."
                  />
                </div>
                <div className="flex-1 overflow-y-auto px-2">
                  {loadingFriends ? (
                    <div className="flex justify-center p-8"><div className="w-6 h-6 border-2 border-phantom-500 border-t-transparent rounded-full animate-spin" /></div>
                  ) : filteredFriends.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center p-8">
                      <Ghost className="w-12 h-12 mb-3 text-ghost-800" />
                      <h3 className="text-sm font-semibold text-ghost-300 mb-1">No users found</h3>
                      <p className="text-ghost-500 text-xs">
                        {activeFriendTab === "friends" && "You haven't added any friends yet."}
                        {activeFriendTab === "pending" && "No pending requests."}
                        {activeFriendTab === "sent" && "No requests sent."}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1 py-2">
                      {filteredFriends.map((friend) => (
                        <div key={friend.friendshipId} className="p-3 flex items-center gap-3 hover:bg-white/5 rounded-xl transition-colors">
                          <button 
                            onClick={() => setSelectedUser({ userId: friend.id, username: friend.username, displayName: friend.displayName, avatar: friend.avatar })}
                            className={`relative flex-shrink-0 hover:ring-2 hover:ring-phantom-500/60 transition-all rounded-full ${friend.status === "online" && activeFriendTab === "friends" ? "avatar-online" : ""}`}
                          >
                            <UserAvatar 
                              avatarUrl={friend.avatar}
                              displayName={friend.displayName}
                              size="w-10 h-10"
                            />
                          </button>
                          <div className="flex-1 min-w-0">
                            <button 
                              onClick={() => setSelectedUser({ userId: friend.id, username: friend.username, displayName: friend.displayName, avatar: friend.avatar })}
                              className="font-medium text-ghost-100 text-sm truncate hover:underline text-left block"
                            >
                              {friend.displayName}
                            </button>
                            <p className="text-xs text-ghost-500 truncate">@{friend.username}</p>
                          </div>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            {activeFriendTab === "friends" && (
                              <button 
                                onClick={() => {
                                  const conversationId = [user?.id, friend.id].sort().join("_");
                                  window.location.href = `/messages/${conversationId}`;
                                }}
                                className="w-8 h-8 rounded-full bg-phantom-500/10 text-phantom-400 hover:bg-phantom-500 hover:text-white flex items-center justify-center transition-colors"
                              >
                                <MessageSquare className="w-4 h-4" />
                              </button>
                            )}
                            {activeFriendTab === "pending" && (
                              <>
                                <button onClick={() => handleFriendAction(friend.friendshipId, "ACCEPT")} className="w-8 h-8 rounded-full bg-success/10 text-success hover:bg-success hover:text-white flex items-center justify-center transition-colors"><Check className="w-4 h-4" /></button>
                                <button onClick={() => handleFriendAction(friend.friendshipId, "REJECT")} className="w-8 h-8 rounded-full bg-error/10 text-neon-red hover:bg-error hover:text-white flex items-center justify-center transition-colors"><X className="w-4 h-4" /></button>
                              </>
                            )}
                            {activeFriendTab === "sent" && (
                              <button onClick={() => handleFriendAction(friend.friendshipId, "CANCEL")} className="w-8 h-8 rounded-full bg-ghost-800 text-ghost-400 hover:bg-ghost-700 hover:text-ghost-200 flex items-center justify-center transition-colors"><X className="w-4 h-4" /></button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 px-4 py-6">
                <div className="glass-card p-5">
                  <h2 className="text-base font-bold text-ghost-100 mb-1">Add a Friend</h2>
                  <p className="text-xs text-ghost-400 mb-4">Enter exact username to send a request.</p>
                  
                  <form onSubmit={handleAddFriend} className="space-y-3">
                    <div className="relative group">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ghost-500 font-medium">@</span>
                      <input
                        type="text"
                        value={addUsername}
                        onChange={(e) => setAddUsername(e.target.value.toLowerCase())}
                        className="w-full bg-ghost-900 border border-white/5 text-ghost-100 rounded-lg px-3 py-2.5 pl-8 outline-none focus:border-phantom-500 focus:ring-1 focus:ring-phantom-500 transition-all placeholder:text-ghost-600 text-sm"
                        placeholder="username"
                        required
                      />
                    </div>
                    
                    {friendMessage.text && (
                      <div className={`p-2 rounded-lg text-xs font-medium ${friendMessage.type === "success" ? "bg-success/10 text-success" : "bg-error/10 text-neon-red"}`}>
                        {friendMessage.text}
                      </div>
                    )}
                    
                    <button type="submit" disabled={!addUsername.trim()} className="w-full btn-primary py-2.5 text-sm">
                      Send Request
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right Pane: Desktop Empty State for Chats (Actual Chat loads in /messages/[id]) */}
      <div className="hidden md:flex flex-1 flex-col items-center justify-center px-6 bg-ghost-950/50">
        <div className="w-20 h-20 rounded-3xl bg-phantom-500/10 border border-phantom-500/20 flex items-center justify-center mb-5" style={{ animation: "float 3s ease-in-out infinite" }}>
          {activeSection === "chats" ? (
             <MessageSquare className="w-8 h-8 text-phantom-400" />
          ) : (
             <Users className="w-8 h-8 text-phantom-400" />
          )}
        </div>
        <h3 className="text-xl font-bold text-ghost-100 mb-2">
          {activeSection === "chats" ? "Your Messages" : "Your Friends"}
        </h3>
        <p className="text-ghost-400 text-sm max-w-xs text-center">
          {activeSection === "chats" 
            ? "Select a conversation from the list to start chatting." 
            : "Manage your connections, accept requests, or find new friends."}
        </p>
      </div>

      {/* Profile Modal */}
      {selectedUser && (
        <UserProfileCard 
          userId={selectedUser.userId} 
          username={selectedUser.username} 
          displayName={selectedUser.displayName} 
          avatar={selectedUser.avatar} 
          onClose={() => setSelectedUser(null)} 
        />
      )}
    </div>
  );
}
