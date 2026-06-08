import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";
import { getAuthUser } from "@/lib/auth";
import { v4 as uuidv4 } from "uuid";
import type { ApiResponse } from "@/types";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json<ApiResponse>({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id: conversationId } = await params;
    
    // Security check: Make sure user is part of conversation
    const parts = conversationId.split("_");
    if (!parts.includes(authUser.userId)) {
      return NextResponse.json<ApiResponse>({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);

    const snapshot = await db.collection("conversations")
      .doc(conversationId)
      .collection("messages")
      .orderBy("createdAt", "desc")
      .limit(limit)
      .get();

    const messages = snapshot.docs.map(doc => doc.data());
    
    // Sort chronologically for frontend
    messages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    return NextResponse.json<ApiResponse>({
      success: true,
      data: messages,
    });
  } catch (error) {
    console.error("Messages GET [id] error:", error);
    return NextResponse.json<ApiResponse>({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json<ApiResponse>({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id: conversationId } = await params;
    const parts = conversationId.split("_");
    if (!parts.includes(authUser.userId)) {
      return NextResponse.json<ApiResponse>({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const { content } = body;

    if (!content || !content.trim()) {
      return NextResponse.json<ApiResponse>({ success: false, error: "Message cannot be empty" }, { status: 400 });
    }

    const messageId = uuidv4();
    const now = new Date().toISOString();
    
    const message = {
      id: messageId,
      senderId: authUser.userId,
      content: content.trim(),
      createdAt: now,
      read: false,
    };

    const convRef = db.collection("conversations").doc(conversationId);
    const msgsRef = convRef.collection("messages");

    // Start a batch or just set them
    await msgsRef.doc(messageId).set(message);

    const otherUserId = parts.find(id => id !== authUser.userId);

    // Update conversation metadata
    await convRef.set({
      id: conversationId,
      participants: parts,
      lastMessage: {
        content: message.content,
        senderId: message.senderId,
        createdAt: message.createdAt,
      },
      updatedAt: now,
    }, { merge: true });

    // Optional: create notification for the other user
    // (omitted for brevity, can be added later)

    return NextResponse.json<ApiResponse>({
      success: true,
      data: message,
    }, { status: 201 });
  } catch (error) {
    console.error("Messages POST [id] error:", error);
    return NextResponse.json<ApiResponse>({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
