"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useAuth } from "@/custom-hooks/useAuth";
import { useSocket } from "@/custom-hooks/useSocket";
import { Globe, Hand } from "lucide-react";
import type { WorldChatMessage } from "@/types";

export default function WorldChatPage() {
  const { user } = useAuth();
  const { socket, isConnected } = useSocket();
  const [messages, setMessages] = useState<WorldChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [onlineCount, setOnlineCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Load message history
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await fetch("/api/world-chat?limit=50");
        const data = await res.json();
        if (data.success) {
          setMessages(data.data || []);
        }
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

    return () => {
      socket.off("world:message");
      socket.off("world:online-count");
      socket.emit("world:leave");
    };
  }, [socket]);

  // Auto-scroll on new messages
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

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
      sender: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        avatar: user.avatar,
      },
    };
    setMessages((prev) => [...prev, optimisticMsg]);

    // Send via API (persists) and socket (broadcasts)
    try {
      await fetch("/api/world-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
    } catch (err) {
      console.error("Failed to send message:", err);
    }

    if (socket) {
      socket.emit("world:send-message", { content });
    }
  };

  const formatTime = (date: Date | string) => {
    return new Date(date).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-56px)] md:h-screen">
      {/* Header */}
      <div className="glass-nav px-6 py-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <Globe className="w-8 h-8 text-phantom-400" />
          <div>
            <h1 className="text-lg font-bold text-ghost-100">World Chat</h1>
            <p className="text-xs text-ghost-500">Everyone&apos;s talking here</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? "bg-success animate-pulse" : "bg-error"}`} />
          <span className="text-sm text-ghost-400">
            {onlineCount} online
          </span>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-3"
      >
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Globe className="w-16 h-16 mb-4 text-phantom-500" style={{ animation: "float 3s ease-in-out infinite" }} />
            <h3 className="text-lg font-semibold text-ghost-200 mb-2">
              Welcome to World Chat
            </h3>
            <p className="text-ghost-500 text-sm max-w-sm">
              This is the global chat room. Everyone online can see your messages.
              Say hello! <Hand className="w-4 h-4 inline" />
            </p>
          </div>
        )}

        {messages.map((msg) => {
          const isOwn = msg.sender.id === user?.id;
          return (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${isOwn ? "flex-row-reverse" : ""} animate-fade-in`}
            >
              {/* Avatar */}
              <div
                className="avatar avatar-sm flex-shrink-0"
                title={`@${msg.sender.username}`}
              >
                {msg.sender.avatar ? (
                  <img
                    src={msg.sender.avatar}
                    alt={msg.sender.displayName}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  msg.sender.displayName.charAt(0)
                )}
              </div>

              {/* Message */}
              <div className={`max-w-[70%] ${isOwn ? "text-right" : ""}`}>
                <div className={`flex items-baseline gap-2 mb-1 ${isOwn ? "flex-row-reverse" : ""}`}>
                  <span className="text-xs font-semibold text-phantom-400">
                    {msg.sender.displayName}
                  </span>
                  <span className="text-[10px] text-ghost-600">
                    @{msg.sender.username}
                  </span>
                  <span className="text-[10px] text-ghost-600">
                    {formatTime(msg.createdAt)}
                  </span>
                </div>
                <div
                  className={`message-bubble ${
                    isOwn ? "message-bubble-sent" : "message-bubble-received"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-4 pb-4 pt-2 flex-shrink-0">
        <form onSubmit={sendMessage} className="flex items-center gap-3">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="glass-input focus-ring flex-1"
            placeholder="Type a message to the world..."
            maxLength={500}
            autoFocus
          />
          <button
            type="submit"
            disabled={!inputValue.trim()}
            className="btn-primary px-6 py-3"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
