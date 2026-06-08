// GhostVerse — Shared TypeScript Types
// These types are used across both client and server

export type UserRole = "USER" | "ADMIN" | "MODERATOR";
export type UserStatus = "ACTIVE" | "BANNED" | "MUTED";
export type FriendshipStatus = "PENDING" | "ACCEPTED" | "REJECTED";
export type ReactionType = "HELPFUL" | "FUNNY" | "SMART" | "LEGEND";
export type NotificationType = "FRIEND_REQUEST" | "FRIEND_ACCEPTED" | "NEW_MESSAGE" | "MENTION" | "COMMUNITY_ACTIVITY";
export type Mood = "HAPPY" | "BORED" | "LONELY" | "MOTIVATED" | "SAD" | "EXCITED";
export type Interest = "GAMING" | "CODING" | "STARTUPS" | "ANIME" | "MOVIES" | "MUSIC" | "FITNESS" | "RELATIONSHIPS" | "ART" | "TRAVEL" | "FOOD" | "SCIENCE" | "PHILOSOPHY" | "SPORTS" | "BOOKS";


// ============================================================
// AUTH TYPES
// ============================================================

export interface JWTPayload {
  userId: string;
  username: string;
  role: UserRole;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
  displayName: string;
}

export interface AuthResponse {
  user: SafeUser;
  token: string;
}

// ============================================================
// USER TYPES (safe — no password hash)
// ============================================================

export interface SafeUser {
  id: string;
  username: string;
  displayName: string;
  avatar: string | null;
  bio: string | null;
  role: UserRole;
  status: UserStatus;
  lastSeen: Date;
  createdAt: Date;
}

export interface UserProfile extends SafeUser {
  profile: {
    interests: Interest[];
    mood: Mood | null;
    country: string | null;
    reputationScore: number;
  } | null;
  friendsCount: number;
}

// ============================================================
// CHAT TYPES
// ============================================================

export interface ChatMessage {
  id: string;
  content: string;
  createdAt: Date;
  sender: {
    id: string;
    username: string;
    displayName: string;
    avatar: string | null;
  };
}

export interface WorldChatMessage extends ChatMessage {}

export interface DirectMessage extends ChatMessage {
  readAt: Date | null;
  replyTo?: {
    id: string;
    content: string;
    sender: {
      username: string;
    };
  } | null;
}

export interface Conversation {
  user: SafeUser;
  lastMessage: {
    content: string;
    createdAt: Date;
    senderId: string;
  } | null;
  unreadCount: number;
}

export interface Confession {
  id: string;
  content: string;
  likes: number;
  comments: number;
  createdAt: Date;
  authorId?: string; // Optional if truly anonymous
  likedBy?: string[]; // Array of user IDs who liked it
}

// ============================================================
// SOCKET EVENT TYPES
// ============================================================

export interface ServerToClientEvents {
  // World Chat
  "world:message": (message: WorldChatMessage) => void;
  "world:online-count": (count: number) => void;
  "world:user-joined": (user: { username: string; displayName: string }) => void;
  "world:user-left": (user: { username: string }) => void;

  // Direct Messages
  "dm:message": (message: DirectMessage) => void;
  "dm:typing": (data: { userId: string; username: string }) => void;
  "dm:stop-typing": (data: { userId: string }) => void;
  "dm:read": (data: { messageId: string; readAt: Date }) => void;

  // Random Chat
  "random:matched": (data: { partnerId: string; partnerUsername: string }) => void;
  "random:message": (message: { content: string; senderId: string }) => void;
  "random:typing": () => void;
  "random:stop-typing": () => void;
  "random:partner-left": () => void;
  "random:waiting": () => void;

  // Community Chat
  "community:message": (message: ChatMessage & { communityId: string }) => void;
  "community:user-joined": (data: { communityId: string; user: { username: string } }) => void;
  "community:user-left": (data: { communityId: string; user: { username: string } }) => void;

  // Notifications
  "notification:new": (notification: NotificationData) => void;
  "notification:count": (count: number) => void;

  // Mystery Chat
  "mystery:matched": (data: { matchId: string }) => void;
  "mystery:message": (message: { content: string; matchId: string }) => void;
  "mystery:revealed": (data: { matchId: string; user: SafeUser }) => void;

  // WebRTC Signaling
  "webrtc:call-request": (data: { callerId: string }) => void;
  "webrtc:call-accept": (data: { receiverId: string }) => void;
  "webrtc:call-decline": (data: { receiverId: string }) => void;
  "webrtc:end-call": () => void;
  "webrtc:offer": (data: { offer: any; senderId: string }) => void;
  "webrtc:answer": (data: { answer: any; senderId: string }) => void;
  "webrtc:ice-candidate": (data: { candidate: any; senderId: string }) => void;

  // Random Voice Matchmaking
  "random-voice:match": (data: { peerId: string; isCaller: boolean; roomId: string }) => void;
}

export interface ClientToServerEvents {
  // World Chat
  "world:join": () => void;
  "world:leave": () => void;
  "world:send-message": (data: { content: string }) => void;

  // Direct Messages
  "dm:send-message": (data: { receiverId: string; message: DirectMessage }) => void;
  "dm:typing": (data: { receiverId: string }) => void;
  "dm:stop-typing": (data: { receiverId: string }) => void;
  "dm:mark-read": (data: { messageId: string }) => void;

  // Random Chat
  "random:join-queue": (data: { filter: MatchFilter }) => void;
  "random:leave-queue": () => void;
  "random:send-message": (data: { content: string }) => void;
  "random:typing": () => void;
  "random:stop-typing": () => void;
  "random:next": () => void;
  "random:end": () => void;

  // Community Chat
  "community:join": (data: { communityId: string }) => void;
  "community:leave": (data: { communityId: string }) => void;
  "community:send-message": (data: { communityId: string; content: string }) => void;

  // Mystery Chat
  "mystery:send-message": (data: { matchId: string; content: string }) => void;
  "mystery:reveal": (data: { matchId: string }) => void;

  // User Status
  "user:online": (data?: { userId: string }) => void;
  "user:offline": (data?: { userId: string }) => void;

  // WebRTC Signaling
  "webrtc:call-request": (data: { receiverId: string; callerId: string }) => void;
  "webrtc:call-accept": (data: { callerId: string; receiverId: string }) => void;
  "webrtc:call-decline": (data: { callerId: string; receiverId: string }) => void;
  "webrtc:end-call": (data: { peerId: string }) => void;
  "webrtc:offer": (data: { receiverId: string; senderId: string; offer: any }) => void;
  "webrtc:answer": (data: { receiverId: string; senderId: string; answer: any }) => void;
  "webrtc:ice-candidate": (data: { receiverId: string; senderId: string; candidate: any }) => void;

  // Random Voice Matchmaking
  "random-voice:join": (data: { userId: string }) => void;
  "random-voice:leave": (data: { userId: string }) => void;
}

// ============================================================
// MATCHING TYPES
// ============================================================

export type MatchFilter = "random" | "country" | "interests" | "mood";

export interface QueueEntry {
  userId: string;
  username: string;
  socketId: string;
  filter: MatchFilter;
  interests?: Interest[];
  mood?: Mood | null;
  country?: string | null;
  joinedAt: Date;
}

// ============================================================
// NOTIFICATION TYPES
// ============================================================

export interface NotificationData {
  id: string;
  type: NotificationType;
  title: string;
  content: string;
  data?: Record<string, unknown>;
  read: boolean;
  createdAt: Date;
}

// ============================================================
// REPUTATION TYPES
// ============================================================

export interface ReputationSummary {
  helpful: number;
  funny: number;
  smart: number;
  legend: number;
  total: number;
}

export const REACTION_EMOJI: Record<ReactionType, string> = {
  HELPFUL: "⭐",
  FUNNY: "😂",
  SMART: "🧠",
  LEGEND: "👑",
};

export const MOOD_EMOJI: Record<Mood, string> = {
  HAPPY: "😊",
  BORED: "😐",
  LONELY: "😔",
  MOTIVATED: "💪",
  SAD: "😢",
  EXCITED: "🤩",
};

export const INTEREST_COLORS: Record<Interest, string> = {
  GAMING: "#8B5CF6",
  CODING: "#10B981",
  STARTUPS: "#F59E0B",
  ANIME: "#EC4899",
  MOVIES: "#EF4444",
  MUSIC: "#3B82F6",
  FITNESS: "#14B8A6",
  RELATIONSHIPS: "#F43F5E",
  ART: "#A855F7",
  TRAVEL: "#06B6D4",
  FOOD: "#F97316",
  SCIENCE: "#6366F1",
  PHILOSOPHY: "#8B5CF6",
  SPORTS: "#22C55E",
  BOOKS: "#D97706",
};

// ============================================================
// API RESPONSE TYPES
// ============================================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
