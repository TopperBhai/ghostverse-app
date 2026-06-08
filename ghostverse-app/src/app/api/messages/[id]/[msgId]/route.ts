import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../../../lib/firebase-admin";
import { getAuthUser } from "../../../../../lib/auth";
import type { ApiResponse } from "../../../../../types";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; msgId: string }> }
) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id: conversationId, msgId } = await params;

    // Security check: user must be part of the conversation
    const parts = conversationId.split("_");
    if (!parts.includes(authUser.userId)) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    const msgRef = db
      .collection("conversations")
      .doc(conversationId)
      .collection("messages")
      .doc(msgId);

    const msgDoc = await msgRef.get();
    if (!msgDoc.exists) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Message not found" },
        { status: 404 }
      );
    }

    const data = msgDoc.data() as any;
    if (data.senderId !== authUser.userId) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Cannot delete another user's message" },
        { status: 403 }
      );
    }

    await msgRef.delete();

    return NextResponse.json<ApiResponse>({ success: true });
  } catch (error) {
    console.error("DM DELETE error:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; msgId: string }> }
) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id: conversationId, msgId } = await params;
    const body = await request.json();
    const { content } = body;

    if (!content || content.trim().length === 0) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Message content is required" },
        { status: 400 }
      );
    }

    // Security check: user must be part of the conversation
    const parts = conversationId.split("_");
    if (!parts.includes(authUser.userId)) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    const msgRef = db
      .collection("conversations")
      .doc(conversationId)
      .collection("messages")
      .doc(msgId);

    const msgDoc = await msgRef.get();
    if (!msgDoc.exists) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Message not found" },
        { status: 404 }
      );
    }

    const data = msgDoc.data() as any;
    if (data.senderId !== authUser.userId) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Cannot edit another user's message" },
        { status: 403 }
      );
    }

    await msgRef.update({
      content: content.trim(),
      isEdited: true,
    });

    return NextResponse.json<ApiResponse>({ success: true });
  } catch (error) {
    console.error("DM PATCH error:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

