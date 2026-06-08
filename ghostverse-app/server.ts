// GhostVerse — Custom Server with Socket.io
// Entry point: replaces `next dev` with custom HTTP server + Socket.io

import { createServer } from "http";
import next from "next";
import { Server } from "socket.io";
import type { ServerToClientEvents, ClientToServerEvents, WorldChatMessage } from "./src/types/index.js";

const port = parseInt(process.env.PORT || "3000", 10);
const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

// Track online users
const onlineUsers = new Map<string, { socketId: string; username: string }>();

// Random Voice Queue
const randomVoiceQueue = new Set<string>(); // stores socketIds

// ── In-Memory World Chat History (max 100 messages) ──
const MAX_WORLD_HISTORY = 100;
const worldChatHistory: WorldChatMessage[] = [];

function addToWorldHistory(msg: WorldChatMessage) {
  worldChatHistory.push(msg);
  if (worldChatHistory.length > MAX_WORLD_HISTORY) {
    worldChatHistory.shift(); // Remove oldest message
  }
}

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    handle(req, res);
  });

  const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
    path: "/api/socketio",
    addTrailingSlash: false,
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
    },
  });

  // Make io accessible to API routes via global
  (globalThis as Record<string, unknown>).__socketIO = io;
  // Make online users count accessible to API routes
  (globalThis as Record<string, unknown>).__getOnlineUsersCount = () => onlineUsers.size;

  io.on("connection", (socket) => {
    console.log(`👻 User connected: ${socket.id}`);

    // ── User Online/Offline ──
    socket.on("user:online", (data?: { userId: string }) => {
      if (data && data.userId) {
        socket.join(`user:${data.userId}`);
        onlineUsers.set(data.userId, { socketId: socket.id, username: "unknown" });
        console.log(`✅ User online: ${data.userId} (${socket.id})`);
      }
    });

    socket.on("user:offline", (data?: { userId: string }) => {
      if (data && data.userId) {
        socket.leave(`user:${data.userId}`);
        onlineUsers.delete(data.userId);
      }
      console.log(`❌ User offline: ${socket.id}`);
    });

    socket.on("user:profile-update", (data) => {
      // Update in-memory history so new joiners get fresh avatars/names
      for (let i = 0; i < worldChatHistory.length; i++) {
        if (worldChatHistory[i].sender.id === data.userId) {
          worldChatHistory[i] = {
            ...worldChatHistory[i],
            sender: {
              ...worldChatHistory[i].sender,
              avatar: data.avatar,
              displayName: data.displayName,
            },
          };
        }
      }
      // Broadcast to all other users
      socket.broadcast.emit("user:profile-update", data);
    });

    // ── World Chat ──
    socket.on("world:join", () => {
      socket.join("world-chat");
      const onlineCount = io.sockets.adapter.rooms.get("world-chat")?.size || 0;
      io.to("world-chat").emit("world:online-count", onlineCount);

      // Send message history to this socket only (not broadcast)
      socket.emit("world:history" as any, worldChatHistory);
    });

    socket.on("world:leave", () => {
      socket.leave("world-chat");
      const onlineCount = io.sockets.adapter.rooms.get("world-chat")?.size || 0;
      io.to("world-chat").emit("world:online-count", onlineCount);
    });

    socket.on("world:send-message", (data) => {
      // Save to in-memory history
      addToWorldHistory(data);
      // Broadcast to everyone else in the room
      socket.broadcast.to("world-chat").emit("world:message", data);
    });

    socket.on("world:edit-message", (data) => {
      // Update in-memory history
      const idx = worldChatHistory.findIndex(m => m.id === data.messageId);
      if (idx !== -1) {
        worldChatHistory[idx] = {
          ...worldChatHistory[idx],
          content: data.content,
          isEdited: true,
        };
      }
      // Broadcast the edit to everyone else
      socket.broadcast.to("world-chat").emit("world:message-edited", {
        messageId: data.messageId,
        content: data.content,
      });
    });

    // World chat delete (new event handled server-side)
    socket.on("world:delete-message" as any, (data: { messageId: string }) => {
      // Remove from in-memory history
      const idx = worldChatHistory.findIndex(m => m.id === data.messageId);
      if (idx !== -1) {
        worldChatHistory.splice(idx, 1);
      }
      // Broadcast delete to everyone else
      socket.broadcast.to("world-chat").emit("world:message-deleted" as any, { messageId: data.messageId });
    });

    // ── Direct Messages ──
    socket.on("dm:send-message", (data) => {
      // Send to the specific user's room using the provided full message
      io.to(`user:${data.receiverId}`).emit("dm:message", data.message);
    });

    socket.on("dm:edit-message", (data) => {
      io.to(`user:${data.receiverId}`).emit("dm:message-edited", {
        messageId: data.messageId,
        content: data.content,
      });
    });

    socket.on("dm:typing", (data) => {
      io.to(`user:${data.receiverId}`).emit("dm:typing", {
        userId: socket.id,
        username: "unknown",
      });
    });

    socket.on("dm:stop-typing", (data) => {
      io.to(`user:${data.receiverId}`).emit("dm:stop-typing", {
        userId: socket.id,
      });
    });

    // ── WebRTC Signaling ──
    socket.on("webrtc:call-request", (data) => {
      io.to(`user:${data.receiverId}`).emit("webrtc:call-request", { callerId: data.callerId });
    });
    socket.on("webrtc:call-accept", (data) => {
      io.to(`user:${data.callerId}`).emit("webrtc:call-accept", { receiverId: data.receiverId });
    });
    socket.on("webrtc:call-decline", (data) => {
      io.to(`user:${data.callerId}`).emit("webrtc:call-decline", { receiverId: data.receiverId });
    });
    socket.on("webrtc:end-call", (data) => {
      io.to(`user:${data.peerId}`).emit("webrtc:end-call");
    });
    socket.on("webrtc:offer", (data) => {
      io.to(`user:${data.receiverId}`).emit("webrtc:offer", { offer: data.offer, senderId: data.senderId });
    });
    socket.on("webrtc:answer", (data) => {
      io.to(`user:${data.receiverId}`).emit("webrtc:answer", { answer: data.answer, senderId: data.senderId });
    });
    socket.on("webrtc:ice-candidate", (data) => {
      io.to(`user:${data.receiverId}`).emit("webrtc:ice-candidate", { candidate: data.candidate, senderId: data.senderId });
    });

    // ── Random Voice Chat Matchmaking ──
    socket.on("random-voice:join", (data) => {
      if (!data?.userId) return;
      const myUserId = data.userId;

      // Find another user in queue
      if (randomVoiceQueue.size > 0 && !randomVoiceQueue.has(myUserId)) {
        // We have a match!
        const matchedUserId = Array.from(randomVoiceQueue)[0];
        randomVoiceQueue.delete(matchedUserId);
        
        const roomId = `random-${Date.now()}`;
        
        socket.join(roomId);
        const matchedSocketInfo = onlineUsers.get(matchedUserId);
        if (matchedSocketInfo) {
          io.sockets.sockets.get(matchedSocketInfo.socketId)?.join(roomId);
        }
        
        // Tell both they are matched. One will be designated as caller.
        io.to(`user:${myUserId}`).emit("random-voice:match", { peerId: matchedUserId, isCaller: true, roomId });
        io.to(`user:${matchedUserId}`).emit("random-voice:match", { peerId: myUserId, isCaller: false, roomId });
      } else {
        // Join queue
        randomVoiceQueue.add(myUserId);
      }
    });

    socket.on("random-voice:leave", (data) => {
      if (data?.userId) {
        randomVoiceQueue.delete(data.userId);
      }
    });

    // ── Disconnect ──
    socket.on("disconnect", () => {
      console.log(`👻 User disconnected: ${socket.id}`);
      
      // Remove from online mapping
      for (const [userId, info] of onlineUsers.entries()) {
        if (info.socketId === socket.id) {
          onlineUsers.delete(userId);
          break;
        }
      }

      // Clean up from world chat
      const worldRoom = io.sockets.adapter.rooms.get("world-chat");
      if (worldRoom) {
        const onlineCount = worldRoom.size;
        io.to("world-chat").emit("world:online-count", onlineCount);
      }

      // Clean up from random voice queue
      randomVoiceQueue.delete(socket.id);
    });
  });

  httpServer.listen(port, () => {
    console.log(`
    ╔══════════════════════════════════════╗
    ║     👻 GhostVerse is running!       ║
    ║     http://localhost:${port}            ║
    ╚══════════════════════════════════════╝
    `);
  });
});
