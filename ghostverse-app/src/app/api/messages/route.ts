import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";
import { getAuthUser } from "@/lib/auth";
import type { ApiResponse } from "@/types";

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Conversations where the user is a participant
    const snapshot = await db.collection("conversations")
      .where("participants", "array-contains", authUser.userId)
      .orderBy("updatedAt", "desc")
      .get();

    const conversations = await Promise.all(
      snapshot.docs.map(async (doc) => {
        const data = doc.data();
        const otherUserId = data.participants.find((id: string) => id !== authUser.userId);
        
        let otherUser = { id: otherUserId, username: "unknown", displayName: "Unknown", avatar: null, status: "offline" };
        if (otherUserId) {
          const userDoc = await db.collection("users").doc(otherUserId).get();
          if (userDoc.exists) {
            const userData = userDoc.data() as any;
            const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
            otherUser = {
              id: userData.id,
              username: userData.username,
              displayName: userData.displayName,
              avatar: userData.avatar,
              status: userData.lastSeen > fiveMinutesAgo ? "online" : "offline",
            };
          }
        }

        return {
          id: doc.id,
          otherUser,
          lastMessage: data.lastMessage || null,
          unreadCount: data.unreadCount?.[authUser.userId] || 0,
          updatedAt: data.updatedAt,
        };
      })
    );

    return NextResponse.json<ApiResponse>({
      success: true,
      data: conversations,
    });
  } catch (error) {
    console.error("Messages GET error:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
