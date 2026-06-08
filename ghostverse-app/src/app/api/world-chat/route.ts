// GhostVerse — World Chat API (In-Memory Optimized)
// World Chat messages are now stored in server RAM (socket server), NOT Firebase.
// This saves ~90% of Firebase reads and writes.
import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../lib/firebase-admin";
import { getAuthUser } from "../../../lib/auth";
import { v4 as uuidv4 } from "uuid";
import type { ApiResponse, WorldChatMessage } from "../../../types";
import { extractMentions, notifyMentionedUsers } from "../../../lib/mentions";
import { updateGamification } from "../../../lib/gamification";

// GET: Return empty — client now receives history via socket `world:history` event
export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }
    // History is delivered via socket (world:history event on world:join)
    return NextResponse.json<ApiResponse<WorldChatMessage[]>>({
      success: true,
      data: [],
    });
  } catch (error) {
    console.error("World chat GET error:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST: Build message object and return — socket.emit handles broadcast & in-memory storage
export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { content } = body;

    if (!content || content.trim().length === 0) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Message content is required" },
        { status: 400 }
      );
    }

    if (content.length > 500) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Message too long (max 500 characters)" },
        { status: 400 }
      );
    }

    // Only fetch user to check mute status + get display info (1 read per message, down from 2+)
    const userDoc = await db.collection("users").doc(authUser.userId).get();
    const user = userDoc.data() as any;

    if (user?.status === "MUTED") {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "You are currently muted" },
        { status: 403 }
      );
    }

    const messageId = uuidv4();
    const message: WorldChatMessage = {
      id: messageId,
      content: content.trim(),
      createdAt: new Date().toISOString() as any,
      sender: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        avatar: user.avatar,
        reputationScore: user.reputationScore || 0,
      },
    };

    // Parse mentions and send notifications asynchronously
    const mentions = extractMentions(content);
    if (mentions.length > 0) {
      // Don't await to not block the chat response
      notifyMentionedUsers(
        mentions,
        user.id,
        user.username,
        user.displayName,
        "/world-chat",
        content
      ).catch(err => console.error("Mention notification error in world-chat:", err));
    }

    // Update Gamification
    updateGamification(user.id, "CHAT").catch(err => console.error("Gamification error in world-chat:", err));

    // NOTE: No Firebase write! The message is stored in server RAM via socket event.
    return NextResponse.json<ApiResponse<WorldChatMessage>>(
      { success: true, data: message },
      { status: 201 }
    );
  } catch (error) {
    console.error("World chat POST error:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
