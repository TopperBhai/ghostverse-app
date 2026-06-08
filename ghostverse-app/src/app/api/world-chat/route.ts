// GhostVerse — World Chat API (Firebase)
import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../lib/firebase-admin";
import { getAuthUser } from "../../../lib/auth";
import { v4 as uuidv4 } from "uuid";
import type { ApiResponse, WorldChatMessage } from "../../../types";

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);

    const snapshot = await db.collection("world_messages")
      .orderBy("createdAt", "desc")
      .limit(limit)
      .get();

    const messages = snapshot.docs.map(doc => doc.data() as WorldChatMessage);
    
    // Sort chronologically for the frontend
    messages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    return NextResponse.json<ApiResponse<WorldChatMessage[]>>({
      success: true,
      data: messages,
    });
  } catch (error) {
    console.error("World chat GET error:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

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
      createdAt: new Date().toISOString() as any, // TypeScript expects Date but JSON serializes to string, interface allows it if we cast
      sender: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        avatar: user.avatar,
      },
    };

    await db.collection("world_messages").doc(messageId).set(message);

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
