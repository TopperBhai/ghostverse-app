"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useAuth } from "../../../custom-hooks/use-auth";
import { useSocket } from "../../../custom-hooks/use-socket";
import { Globe, Hand, Trash2, Send, Pencil } from "lucide-react";
import type { WorldChatMessage } from "../../../types";
import { UserProfileCard } from "../../components/UserProfileCard";

export default function WorldChatPage() {
  const { user } = useAuth();
  const { socket, isConnected } = useSocket();
  const [messages, setMessages] = useState<WorldChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [onlineCount, setOnlineCount] = useState(0);
  const [hoveredMsg, setHoveredMsg] = useState<string | null>(null);
  const [editingMsg, setEditingMsg] = useState<{ id: string; content: string } | null>(null);
  const [selectedUser, setSelectedUser] = useState<{
    userId: string; username: string; displayName: string; avatar: string | null;
  } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Load message history
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await fetch("/api/world-chat?limit=50");
        const data = await res.json();
        if (data.success) setMessages(data.data || []);
      } catch (err) {
        console.error("Failed to load messages:", err);
      }
    };
    fetchMessages();
  }, []);

  // Socket listeners
  useEffect(() => {
    if (!socket) return;
    socket.emit("world:join");

    socket.on("world:message", (message) => {
      setMessages((prev) => [...prev, message]);
    });

    socket.on("world:online-count", (count) => {
      setOnlineCount(count);
    });

    socket.on("world:message-edited", (data) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === data.messageId ? { ...m, content: data.content, isEdited: true } : m
        )
      );
    });

    socket.on("user:profile-update", (data) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.sender.id === data.userId
            ? { ...m, sender: { ...m.sender, avatar: data.avatar, displayName: data.displayName } }
            : m
        )
      );
      setSelectedUser((prev) => {
        if (prev && prev.userId === data.userId) {
          return { ...prev, avatar: data.avatar, displayName: data.displayName };
        }
        return prev;
      });
    });

    return () => {
      socket.off("world:message");
      socket.off("world:online-count");
      socket.off("world:message-edited");
      socket.off("user:profile-update");
      socket.emit("world:leave");
    };
  }, [socket]);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || !user) return;

    const content = inputValue.trim();
    setInputValue("");

    // Optimistic message
    const optimisticMsg: WorldChatMessage = {
      id: `local-${Date.now()}`,
      content,
      createdAt: new Date(),
      sender: { id: user.id, username: user.username, displayName: user.displayName, avatar: user.avatar },
    };
    setMessages((prev) => [...prev, optimisticMsg]);

    try {
      const res = await fetch("/api/world-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const data = await res.json();
      // Replace optimistic with real ID
      if (data.success && data.data) {
        setMessages((prev) => prev.map((m) => m.id === optimisticMsg.id ? data.data : m));
        if (socket) socket.emit("world:send-message", data.data);
      }
    } catch (err) {
      console.error("Failed to send message:", err);
    }
  };

  const saveEdit = async () => {
    if (!editingMsg || !editingMsg.content.trim()) return;
    const { id, content } = editingMsg;
    setEditingMsg(null);

    // Optimistic update
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, content, isEdited: true } : m))
    );

    try {
      await fetch(`/api/world-chat/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (socket) socket.emit("world:edit-message", { messageId: id, content });
    } catch {
      console.error("Failed to edit message");
    }
  };

  const deleteMessage = async (msgId: string) => {
    // Optimistic remove
    setMessages((prev) => prev.filter((m) => m.id !== msgId));
    try {
      await fetch(`/api/world-chat/${msgId}`, { method: "DELETE" });
    } catch {
      console.error("Failed to delete message");
    }
  };

  const formatTime = (date: Date | string) =>
    new Date(date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="flex flex-col h-[calc(100vh-112px)] md:h-screen relative">
      {/* Profile card overlay */}
      {selectedUser && (
        <UserProfileCard
          {...selectedUser}
          onClose={() => setSelectedUser(null)}
        />
      )}

      {/* Header */}
      <div className="glass-nav px-4 md:px-6 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-phantom-600/20 border border-phantom-500/30 flex items-center justify-center">
            <Globe className="w-5 h-5 text-phantom-400" />
          </div>
          <div>
            <h1 className="text-base font-bold text-ghost-100">World Chat</h1>
            <p className="text-xs text-ghost-500">Everyone&apos;s talking here</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? "bg-success animate-pulse" : "bg-error"}`} />
          <span className="text-xs text-ghost-400">{onlineCount} online</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 md:px-4 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Globe className="w-14 h-14 mb-4 text-phantom-500" style={{ animation: "float 3s ease-in-out infinite" }} />
            <h3 className="text-base font-semibold text-ghost-200 mb-2">Welcome to World Chat</h3>
            <p className="text-ghost-500 text-sm max-w-sm">
              This is the global chat room. Everyone online can see your messages. Say hello! <Hand className="w-4 h-4 inline" />
            </p>
          </div>
        )}

        {messages.map((msg) => {
          const isOwn = msg.sender.id === user?.id;
          return (
            <div
              key={msg.id}
              className={`flex items-start gap-2.5 group ${isOwn ? "flex-row-reverse" : ""} animate-fade-in`}
              onMouseEnter={() => setHoveredMsg(msg.id)}
              onMouseLeave={() => setHoveredMsg(null)}
            >
              {/* Avatar — clickable for profile card */}
              <button
                className="avatar avatar-sm flex-shrink-0 cursor-pointer hover:ring-2 hover:ring-phantom-500/60 transition-all"
                title={`@${msg.sender.username} — view profile`}
                onClick={() => setSelectedUser({
                  userId: msg.sender.id,
                  username: msg.sender.username,
                  displayName: msg.sender.displayName,
                  avatar: msg.sender.avatar,
                })}
              >
                {msg.sender.avatar ? (
                  <img src={msg.sender.avatar} alt={msg.sender.displayName} className="w-full h-full rounded-full object-cover" />
                ) : (
                  msg.sender.displayName.charAt(0)
                )}
              </button>

              {/* Message bubble */}
              <div className={`max-w-[75%] md:max-w-[65%] ${isOwn ? "items-end" : "items-start"} flex flex-col`}>
                {/* Sender name + time */}
                <div className={`flex items-baseline gap-2 mb-1 ${isOwn ? "flex-row-reverse" : ""}`}>
                  <button
                    className="text-xs font-semibold text-phantom-400 hover:underline cursor-pointer"
                    onClick={() => setSelectedUser({
                      userId: msg.sender.id,
                      username: msg.sender.username,
                      displayName: msg.sender.displayName,
                      avatar: msg.sender.avatar,
                    })}
                  >
                    {msg.sender.displayName}
                  </button>
                  <span className="text-[10px] text-ghost-600 hidden sm:inline">@{msg.sender.username}</span>
                  <span className="text-[10px] text-ghost-600 flex items-center">
                    {formatTime(msg.createdAt)}
                    {msg.isEdited && <span className="ml-1 text-[9px] text-ghost-500">(edited)</span>}
                  </span>
                </div>

                <div className="flex items-end gap-2">
                  {/* Delete button (own messages only) */}
                  {isOwn && (
                    <div className={`flex items-center gap-1 transition-opacity duration-200 ${hoveredMsg === msg.id ? "opacity-100" : "opacity-0"}`}>
                      <button
                        onClick={() => setEditingMsg({ id: msg.id, content: msg.content })}
                        className="flex-shrink-0 p-1 rounded-lg text-ghost-600 hover:text-phantom-400 hover:bg-phantom-500/10 transition-all"
                        title="Edit message"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => deleteMessage(msg.id)}
                        className="flex-shrink-0 p-1 rounded-lg text-ghost-600 hover:text-neon-red hover:bg-error/10 transition-all"
                        title="Delete message"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {editingMsg?.id === msg.id ? (
                    <div className="flex flex-col gap-2 min-w-[200px] bg-ghost-800 p-2 rounded-xl border border-white/10">
                      <input
                        type="text"
                        value={editingMsg.content}
                        onChange={(e) => setEditingMsg({ ...editingMsg, content: e.target.value })}
                        className="bg-ghost-900 border border-ghost-700 text-ghost-100 text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-phantom-500"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveEdit();
                          if (e.key === "Escape") setEditingMsg(null);
                        }}
                        autoFocus
                      />
                      <div className="flex justify-end gap-2">
                        <button onClick={() => setEditingMsg(null)} className="text-[10px] text-ghost-400 hover:text-ghost-200">Cancel</button>
                        <button onClick={saveEdit} className="text-[10px] text-phantom-400 hover:text-phantom-300 font-bold">Save</button>
                      </div>
                    </div>
                  ) : (
                    <div className={`message-bubble ${isOwn ? "message-bubble-sent" : "message-bubble-received"}`}>
                      {msg.content}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-3 md:px-4 pb-3 pt-2 flex-shrink-0">
        <form onSubmit={sendMessage} className="flex items-center gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="glass-input focus-ring flex-1 text-sm py-3"
            placeholder="Type a message to the world..."
            maxLength={500}
          />
          <button
            type="submit"
            disabled={!inputValue.trim()}
            className="btn-primary px-4 py-3 flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Send</span>
          </button>
        </form>
      </div>
    </div>
  );
}
