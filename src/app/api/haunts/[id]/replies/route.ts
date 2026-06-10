// GhostVerse — Haunt Replies API
import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../../../lib/firebase-admin";
import { getAuthUser } from "../../../../../lib/auth";
import { FieldValue } from "firebase-admin/firestore";
import { v4 as uuidv4 } from "uuid";
import type { ApiResponse, HauntReply } from "../../../../../types";
import { extractMentions, notifyMentionedUsers } from "../../../../../lib/mentions";
import { updateGamification } from "../../../../../lib/gamification";

// GET: Fetch replies for a haunt
export async function GET(
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
    const snapshot = await db
      .collection("haunts")
      .doc(id)
      .collection("replies")
      .orderBy("createdAt", "asc")
      .limit(50)
      .get();

    const replies: HauntReply[] = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        content: data.content,
        createdAt: data.createdAt,
        author: data.author,
      };
    });

    return NextResponse.json<ApiResponse<HauntReply[]>>({
      success: true,
      data: replies,
    });
  } catch (error) {
    console.error("Haunt replies GET error:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST: Add a reply to a haunt
export async function POST(
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
    const { content } = body;

    if (!content || content.trim().length === 0) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Reply content is required" },
        { status: 400 }
      );
    }

    if (content.length > 280) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Reply too long (max 280 characters)" },
        { status: 400 }
      );
    }

    // Verify haunt exists
    const hauntRef = db.collection("haunts").doc(id);
    const hauntDoc = await hauntRef.get();
    if (!hauntDoc.exists) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Haunt not found" },
        { status: 404 }
      );
    }

    // Get author info
    const userDoc = await db.collection("users").doc(authUser.userId).get();
    const userData = userDoc.data()!;

    const replyId = uuidv4();
    const now = new Date().toISOString();

    const reply: HauntReply = {
      id: replyId,
      content: content.trim(),
      createdAt: now as any,
      author: {
        id: userData.id,
        username: userData.username,
        displayName: userData.displayName,
        avatar: userData.avatar || null,
        reputationScore: userData.reputationScore || 0,
        clanTag: userData.clanTag || null,
      },
    };

    // Save reply + increment replyCount atomically
    const batch = db.batch();
    batch.set(hauntRef.collection("replies").doc(replyId), reply);
    batch.update(hauntRef, { replyCount: FieldValue.increment(1) });
    await batch.commit();

    // Parse mentions and send notifications asynchronously
    const mentions = extractMentions(content);
    if (mentions.length > 0) {
      notifyMentionedUsers(
        mentions,
        userData.id,
        userData.username,
        userData.displayName,
        "/haunts",
        content
      ).catch(err => console.error("Mention notification error in haunt replies:", err));
    }

    // Update gamification for the echo
    await updateGamification(userData.id, "ECHO");

    return NextResponse.json<ApiResponse<HauntReply>>({
      success: true,
      data: reply,
    }, { status: 201 });
  } catch (error) {
    console.error("Haunt reply POST error:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
