import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../../lib/firebase-admin";
import { getAuthUser } from "../../../../lib/auth";
import type { ApiResponse } from "../../../../types";

export async function DELETE(
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

    const { id: messageId } = await params;
    const docRef = db.collection("world_messages").doc(messageId);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Message not found" },
        { status: 404 }
      );
    }

    const data = doc.data() as any;

    // Only allow deletion of own messages (unless admin)
    if (data.sender?.id !== authUser.userId && authUser.role !== "ADMIN") {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Cannot delete another user's message" },
        { status: 403 }
      );
    }

    await docRef.delete();

    return NextResponse.json<ApiResponse>({ success: true });
  } catch (error) {
    console.error("World chat DELETE error:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
