"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useAuth } from "../../../custom-hooks/use-auth";
import { useSocket } from "../../../custom-hooks/use-socket";
import { Globe, Hand, Trash2, Send, Pencil } from "lucide-react";
import type { WorldChatMessage } from "../../../types";
import { UserProfileCard } from "../../components/UserProfileCard";
import { getGhostLevel } from "../../../lib/levels";
import { MentionInput } from "../../components/MentionInput";
import { FormattedText } from "../../components/FormattedText";

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

  // Messages now arrive via socket `world:history` event on join — no HTTP fetch needed

  // Socket listeners
  useEffect(() => {
    if (!socket) return;
    socket.emit("world:join");

    // Receive full message history on join (from server RAM)
    socket.on("world:history" as any, (history: WorldChatMessage[]) => {
      setMessages(history);
    });

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

    socket.on("world:message-deleted" as any, (data: { messageId: string }) => {
      setMessages((prev) => prev.filter((m) => m.id !== data.messageId));
    });

    socket.on("world:message-upvoted" as any, (data: { messageId: string, upvotes: number, upvotedBy: string[] }) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === data.messageId ? { ...m, upvotes: data.upvotes, upvotedBy: data.upvotedBy } : m
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
      socket.off("world:history" as any);
      socket.off("world:message");
      socket.off("world:online-count");
      socket.off("world:message-edited");
      socket.off("world:message-deleted" as any);
      socket.off("world:message-upvoted" as any);
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
      sender: { id: user.id, username: user.username, displayName: user.displayName, avatar: user.avatar, reputationScore: user.profile?.reputationScore },
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

  const deleteMessage = (msgId: string) => {
    // Optimistic remove locally
    setMessages((prev) => prev.filter((m) => m.id !== msgId));
    // Tell server to remove from RAM and broadcast to others
    if (socket) socket.emit("world:delete-message" as any, { messageId: msgId });
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

        {messages.map((msg, index) => {
          const isOwn = msg.sender.id === user?.id;
          const level = getGhostLevel(msg.sender.reputationScore || 0);
          
          // Check if previous message is from same user within 5 mins
          const prevMsg = index > 0 ? messages[index - 1] : null;
          const isSequential = prevMsg 
            ? prevMsg.sender.id === msg.sender.id && 
              (new Date(msg.createdAt).getTime() - new Date(prevMsg.createdAt).getTime()) < 5 * 60 * 1000
            : false;

          return (
            <div
              key={msg.id}
              className={`flex items-end gap-2.5 group ${isOwn ? "flex-row-reverse" : ""} animate-fade-in ${isSequential ? "mt-1" : "mt-4"}`}
              onMouseEnter={() => setHoveredMsg(msg.id)}
              onMouseLeave={() => setHoveredMsg(null)}
            >
              {/* Avatar or Spacer */}
              {!isSequential ? (
                <button
                  className="avatar avatar-sm flex-shrink-0 mb-1 cursor-pointer hover:ring-2 hover:ring-phantom-500/60 transition-all"
                  title={`@${msg.sender.username}`}
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
              ) : (
                <div className="w-8 h-8 flex-shrink-0" />
              )}

              {/* Column: header + bubble + actions */}
              <div className={`flex flex-col max-w-[70%] md:max-w-[60%] ${isOwn ? "items-end" : "items-start"} gap-1`}>
                
                {/* Header: name + rank badge + time (Hidden if sequential) */}
                {!isSequential && (
                  <div className={`flex items-center gap-1.5 px-1 ${isOwn ? "flex-row-reverse" : ""}`}>
                    <button
                      className={`text-xs font-bold leading-none hover:underline cursor-pointer transition-colors ${level.color}`}
                      onClick={() => setSelectedUser({
                        userId: msg.sender.id,
                        username: msg.sender.username,
                        displayName: msg.sender.displayName,
                        avatar: msg.sender.avatar,
                      })}
                    >
                      {msg.sender.displayName}
                    </button>
                    <span className={`flex items-center ${level.color} opacity-80`} title={level.title}>
                      {level.badge}
                    </span>
                    <span className="text-[10px] text-ghost-600 leading-none">
                      {formatTime(msg.createdAt)}
                    </span>
                    {msg.isEdited && <span className="text-[9px] text-ghost-600 italic">(edited)</span>}
                  </div>
                )}

                {/* Bubble row: actions + bubble */}
                <div className={`flex items-center gap-1.5 ${isOwn ? "flex-row-reverse" : ""}`}>

                  {/* Edit/Delete for own messages — shown on hover */}
                  {isOwn && hoveredMsg === msg.id && (
                    <div className="flex items-center gap-0.5 bg-ghost-900/80 backdrop-blur-sm border border-white/5 rounded-lg px-1 py-0.5 animate-fade-in">
                      <button
                        onClick={() => setEditingMsg({ id: msg.id, content: msg.content })}
                        className="p-1 rounded text-ghost-500 hover:text-phantom-400 hover:bg-phantom-500/10 transition-all"
                        title="Edit"
                      >
                        <Pencil className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => deleteMessage(msg.id)}
                        className="p-1 rounded text-ghost-500 hover:text-neon-red hover:bg-error/10 transition-all"
                        title="Delete"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}

                  {/* Bubble / Edit input */}
                  {editingMsg?.id === msg.id ? (
                    <div className="flex flex-col gap-2 min-w-[200px] max-w-xs bg-ghost-800 p-2.5 rounded-2xl border border-white/10 shadow-lg">
                      <MentionInput
                        value={editingMsg.content}
                        onChange={(val) => setEditingMsg({ ...editingMsg, content: val })}
                        className="bg-ghost-900/80 border border-ghost-700 text-ghost-100 text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-phantom-500 transition-colors"
                        onSubmit={saveEdit}
                        autoFocus
                      />
                      <div className="flex justify-end gap-2">
                        <button onClick={() => setEditingMsg(null)} className="text-[10px] px-2 py-0.5 rounded text-ghost-400 hover:text-ghost-200 hover:bg-ghost-700 transition-all">Cancel</button>
                        <button onClick={saveEdit} className="text-[10px] px-2 py-0.5 rounded text-white bg-phantom-600 hover:bg-phantom-500 font-bold transition-all">Save</button>
                      </div>
                    </div>
                  ) : (
                    <div className={`message-bubble ${isOwn ? "message-bubble-sent" : "message-bubble-received"}`}>
                      <FormattedText content={msg.content} onInspect={setSelectedUser} />
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
        <form onSubmit={sendMessage} className="flex items-end gap-2">
          <MentionInput
            value={inputValue}
            onChange={setInputValue}
            className="glass-input focus-ring flex-1 text-sm py-3 px-4 w-full"
            placeholder="Type a message to the world..."
            maxLength={500}
            onSubmit={() => {
              const e = { preventDefault: () => {} } as React.FormEvent;
              sendMessage(e);
            }}
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
