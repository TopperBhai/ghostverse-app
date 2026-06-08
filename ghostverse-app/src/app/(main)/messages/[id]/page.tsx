"use client";

import { useEffect, useState, useRef, useCallback, use } from "react";
import { useAuth } from "../../../../custom-hooks/use-auth";
import { useSocket } from "../../../../custom-hooks/use-socket";
import { useWebRTC } from "../../../../custom-hooks/use-webrtc";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Phone, User, MessageSquare, Check, CheckCheck, Mic, Trash2, Send } from "lucide-react";
import type { ApiResponse } from "../../../../types";
import { UserProfileCard } from "../../../components/UserProfileCard";

interface Message {
  id: string;
  senderId: string;
  content: string;
  createdAt: string;
  read: boolean;
}

export default function MessageThreadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: conversationId } = use(params);
  const { user } = useAuth();
  const { socket } = useSocket();
  const {
    localStream,
    remoteStream,
    isCalling,
    isReceivingCall,
    callAccepted,
    callUser,
    answerCall,
    declineCall,
    endCall,
  } = useWebRTC();
  const router = useRouter();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [hoveredMsg, setHoveredMsg] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<{ userId: string; username: string; displayName: string; avatar: string | null } | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const otherUserId = conversationId.split("_").find(id => id !== user?.id);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (audioRef.current && remoteStream) {
      audioRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await fetch(`/api/messages/${conversationId}`);
        if (res.status === 403 || res.status === 401) {
          router.push("/messages");
          return;
        }
        const data: ApiResponse<Message[]> = await res.json();
        if (data.success && data.data) {
          setMessages(data.data);
        }
      } catch (err) {
        console.error("Failed to load messages:", err);
      } finally {
        setLoading(false);
      }
    };
    if (user && conversationId) {
      fetchMessages();
    }
  }, [user, conversationId, router]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Socket setup
  useEffect(() => {
    if (!socket || !otherUserId) return;

    socket.on("dm:message", (message) => {
      setMessages((prev) => [...prev, message as unknown as Message]);
    });

    socket.on("dm:typing", (data) => {
      if (data.userId === otherUserId) {
        setIsTyping(true);
      }
    });

    socket.on("dm:stop-typing", (data) => {
      if (data.userId === otherUserId) {
        setIsTyping(false);
      }
    });

    return () => {
      socket.off("dm:message");
      socket.off("dm:typing");
      socket.off("dm:stop-typing");
    };
  }, [socket, otherUserId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    
    if (socket && otherUserId) {
      socket.emit("dm:typing", { receiverId: otherUserId });
      
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit("dm:stop-typing", { receiverId: otherUserId });
      }, 1500);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || !user || !otherUserId) return;

    const content = inputValue.trim();
    setInputValue("");
    if (socket) {
      socket.emit("dm:stop-typing", { receiverId: otherUserId });
    }

    const tempId = `temp-${Date.now()}`;
    const newMsg: Message = {
      id: tempId,
      senderId: user.id,
      content,
      createdAt: new Date().toISOString(),
      read: false,
    };
    setMessages((prev) => [...prev, newMsg]);

    try {
      const res = await fetch(`/api/messages/${conversationId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const data = await res.json();
      if (!data.success) {
        setMessages((prev) => prev.filter(m => m.id !== tempId));
        alert("Failed to send message");
      } else {
        setMessages((prev) => prev.map(m => m.id === tempId ? data.data : m));
        if (socket) {
          socket.emit("dm:send-message", { receiverId: otherUserId, message: data.data });
        }
      }
    } catch (err) {
      setMessages((prev) => prev.filter(m => m.id !== tempId));
    }
  };

  const deleteMessage = async (msgId: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== msgId));
    try {
      await fetch(`/api/messages/${conversationId}/${msgId}`, { method: "DELETE" });
    } catch {
      console.error("Failed to delete message");
    }
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-112px)] md:h-screen w-full relative">
      {/* Profile card popup */}
      {selectedUser && (
        <UserProfileCard {...selectedUser} onClose={() => setSelectedUser(null)} />
      )}
      {/* Remote Audio Player */}
      <audio ref={audioRef} autoPlay />

      {/* Ringing Overlay */}
      {isReceivingCall && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-6 animate-fade-in">
          <div className="w-24 h-24 bg-phantom-500/20 rounded-full flex items-center justify-center mb-6 animate-pulse">
            <Phone className="w-12 h-12 text-phantom-300" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Incoming Call...</h2>
          <p className="text-ghost-400 mb-10">Someone is calling you</p>
          <div className="flex gap-6">
            <button onClick={declineCall} className="w-16 h-16 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-[0_0_20px_rgba(239,68,68,0.3)]">
              <Phone className="w-6 h-6 rotate-[135deg]" />
            </button>
            <button onClick={answerCall} className="w-16 h-16 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center hover:bg-green-500 hover:text-white transition-all shadow-[0_0_20px_rgba(34,197,94,0.3)]">
              <Phone className="w-6 h-6 animate-bounce" />
            </button>
          </div>
        </div>
      )}

      {/* Active Call / Calling Overlay */}
      {(isCalling || callAccepted) && !isReceivingCall && (
        <div className="absolute top-0 left-0 right-0 bg-phantom-900/90 backdrop-blur-md border-b border-phantom-500/30 z-40 p-4 flex items-center justify-between animate-slide-down shadow-xl">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${callAccepted ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`} />
            <div>
              <p className="text-sm font-bold text-white">
                {callAccepted ? "Call in progress" : "Calling..."}
              </p>
              <p className="text-[10px] text-phantom-200">
                {callAccepted ? "Connected securely via WebRTC" : "Waiting for answer"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {callAccepted && (
              <button className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                <Mic className="w-5 h-5 text-white" />
              </button>
            )}
            <button onClick={endCall} className="px-4 py-2 bg-red-500/20 text-red-500 hover:bg-red-500 hover:text-white rounded-lg text-sm font-bold transition-colors">
              End Call
            </button>
          </div>
        </div>
      )}

      <div className="glass-nav px-4 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <Link href="/messages" className="text-ghost-400 hover:text-ghost-200 p-2 md:hidden">
            ←
          </Link>
          <div className="avatar avatar-sm bg-ghost-800 flex items-center justify-center">
            <User className="w-4 h-4 text-ghost-400" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-ghost-100">Private Chat</h1>
            {isTyping && <p className="text-[10px] text-phantom-400 italic">Typing...</p>}
          </div>
        </div>
        {!isCalling && !callAccepted && otherUserId && (
          <button onClick={() => callUser(otherUserId)} className="btn-secondary px-3 py-1.5 text-xs flex items-center gap-2">
            <Phone className="w-4 h-4" /> Call
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {loading ? (
          <div className="flex justify-center p-8"><div className="w-6 h-6 border-2 border-phantom-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <MessageSquare className="w-10 h-10 mb-4 text-ghost-600" />
            <p className="text-ghost-500 text-sm">No messages yet. Say hi or start a voice call!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isOwn = msg.senderId === user?.id;
            return (
              <div
                key={msg.id}
                className={`flex items-end gap-2 ${isOwn ? "justify-end" : "justify-start"} animate-fade-in group`}
                onMouseEnter={() => setHoveredMsg(msg.id)}
                onMouseLeave={() => setHoveredMsg(null)}
              >
                {/* Other user avatar */}
                {!isOwn && (
                  <button
                    className="avatar avatar-sm flex-shrink-0 cursor-pointer hover:ring-2 hover:ring-phantom-500/60 transition-all mb-4"
                    onClick={() => {
                      if (otherUserId) {
                        const parts = conversationId.split("_");
                        const otherId = parts.find(id => id !== user?.id) || "";
                        setSelectedUser({ userId: otherId, username: otherId, displayName: "User", avatar: null });
                      }
                    }}
                  >
                    <User className="w-4 h-4 text-ghost-400" />
                  </button>
                )}
                <div className={`max-w-[75%] ${isOwn ? "items-end" : "items-start"} flex flex-col`}>
                  <div className={`message-bubble text-sm py-2 px-3 ${isOwn ? "message-bubble-sent" : "message-bubble-received"}`}>
                    {msg.content}
                  </div>
                  <div className={`flex items-center gap-1 mt-1 px-1 ${isOwn ? "flex-row-reverse" : ""}`}>
                    <span className="text-[9px] text-ghost-600 flex items-center">
                      {formatTime(msg.createdAt)} {isOwn && (msg.read ? <CheckCheck className="w-3 h-3 ml-1" /> : <Check className="w-3 h-3 ml-1" />)}
                    </span>
                    {isOwn && (
                      <button
                        onClick={() => deleteMessage(msg.id)}
                        className={`p-0.5 rounded text-ghost-600 hover:text-neon-red hover:bg-error/10 transition-all ${hoveredMsg === msg.id ? "opacity-100" : "opacity-0"}`}
                        title="Delete message"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="px-4 pb-4 pt-2 flex-shrink-0">
        <form onSubmit={sendMessage} className="flex items-center gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            className="glass-input focus-ring flex-1 text-sm py-3"
            placeholder="Type a message..."
            maxLength={1000}
            autoFocus
          />
          <button type="submit" disabled={!inputValue.trim()} className="btn-primary px-5 py-3 text-sm">
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
