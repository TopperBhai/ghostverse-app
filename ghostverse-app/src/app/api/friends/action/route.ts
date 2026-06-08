import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";
import { getAuthUser } from "@/lib/auth";
import type { ApiResponse } from "@/types";

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
    const { friendshipId, action } = body; 
    // action: "ACCEPT", "REJECT", "REMOVE"

    if (!friendshipId || !action) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Missing friendshipId or action" },
        { status: 400 }
      );
    }

    const docRef = db.collection("friendships").doc(friendshipId);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Friendship not found" },
        { status: 404 }
      );
    }

    const data = docSnap.data() as any;

    // Verify permissions
    if (data.senderId !== authUser.userId && data.receiverId !== authUser.userId) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Unauthorized for this friendship" },
        { status: 403 }
      );
    }

    if (action === "ACCEPT") {
      if (data.receiverId !== authUser.userId) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: "Only the receiver can accept" },
          { status: 403 }
        );
      }
      await docRef.update({ status: "ACCEPTED", updatedAt: new Date().toISOString() });
      return NextResponse.json<ApiResponse>({ success: true, message: "Friend request accepted" });
    }

    if (action === "REJECT" || action === "REMOVE" || action === "CANCEL") {
      // CANCEL means sender cancels pending request
      // REJECT means receiver rejects pending request
      // REMOVE means removing an accepted friend
      await docRef.delete();
      return NextResponse.json<ApiResponse>({ success: true, message: "Friendship removed/cancelled" });
    }

    return NextResponse.json<ApiResponse>(
      { success: false, error: "Invalid action" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Friends action error:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
