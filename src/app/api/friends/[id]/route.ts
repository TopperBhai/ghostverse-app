// GhostVerse — Friend Action API (Firebase)
import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../../lib/firebase-admin";
import { getAuthUser } from "../../../../lib/auth";
import type { ApiResponse } from "../../../../types";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { action } = body;

    if (!["accept", "reject"].includes(action)) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Action must be 'accept' or 'reject'" },
        { status: 400 }
      );
    }

    const friendshipRef = db.collection("friendships").doc(id);
    const friendshipDoc = await friendshipRef.get();

    if (!friendshipDoc.exists) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Friend request not found" },
        { status: 404 }
      );
    }

    const friendship = friendshipDoc.data() as any;

    if (friendship.receiverId !== authUser.userId) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Not authorized to modify this request" },
        { status: 403 }
      );
    }

    const newStatus = action === "accept" ? "ACCEPTED" : "REJECTED";
    await friendshipRef.update({ status: newStatus });

    if (action === "accept") {
      // Create notification
      const notifRef = db.collection("notifications").doc();
      await notifRef.set({
        id: notifRef.id,
        userId: friendship.senderId,
        type: "FRIEND_ACCEPTED",
        title: "Friend Request Accepted!",
        content: `@${authUser.username} accepted your friend request`,
        data: { friendshipId: friendship.id },
        read: false,
        createdAt: new Date().toISOString()
      });
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: { id, status: newStatus },
      message: action === "accept" ? "Friend request accepted!" : "Friend request rejected",
    });
  } catch (error) {
    console.error("Friend action error:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const friendshipRef = db.collection("friendships").doc(id);
    const friendshipDoc = await friendshipRef.get();

    if (!friendshipDoc.exists) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Friendship not found" },
        { status: 404 }
      );
    }

    const friendship = friendshipDoc.data() as any;

    if (
      friendship.senderId !== authUser.userId &&
      friendship.receiverId !== authUser.userId
    ) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Not authorized" },
        { status: 403 }
      );
    }

    await friendshipRef.delete();

    return NextResponse.json<ApiResponse>({
      success: true,
      message: "Friend removed",
    });
  } catch (error) {
    console.error("Friend delete error:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
