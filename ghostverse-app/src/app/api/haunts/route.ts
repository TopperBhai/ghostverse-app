// GhostVerse — Haunts Feed API
// Public feed of Haunt posts stored in Firestore.
import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../lib/firebase-admin";
import { getAuthUser } from "../../../lib/auth";
import { v4 as uuidv4 } from "uuid";
import type { ApiResponse, HauntPost } from "../../../types";
import { extractMentions, notifyMentionedUsers } from "../../../lib/mentions";
import { updateGamification } from "../../../lib/gamification";

// GET: Fetch latest haunts
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
    const limit = Math.min(parseInt(searchParams.get("limit") || "30"), 50);
    const cursor = searchParams.get("cursor") || null;

    let query = db
      .collection("haunts")
      .orderBy("createdAt", "desc")
      .limit(limit);

    if (cursor) {
      const cursorDoc = await db.collection("haunts").doc(cursor).get();
      if (cursorDoc.exists) {
        query = query.startAfter(cursorDoc);
      }
    }

    const snapshot = await query.get();

    const haunts: HauntPost[] = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        content: data.content,
        createdAt: data.createdAt,
        author: data.author,
        reactions: data.reactions || [],
        replyCount: data.replyCount || 0,
      };
    });

    return NextResponse.json<ApiResponse<HauntPost[]>>({
      success: true,
      data: haunts,
    });
  } catch (error) {
    console.error("Haunts GET error:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST: Create a new haunt
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
        { success: false, error: "Content is required" },
        { status: 400 }
      );
    }

    if (content.length > 280) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Haunts can be at most 280 characters" },
        { status: 400 }
      );
    }

    // Get author info
    const userDoc = await db.collection("users").doc(authUser.userId).get();
    if (!userDoc.exists) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    const userData = userDoc.data()!;
    const profileDoc = await userDoc.ref.collection("data").doc("profile").get();
    const profileData = profileDoc.exists ? profileDoc.data() : {};

    const hauntId = uuidv4();
    const now = new Date().toISOString();

    const haunt: HauntPost = {
      id: hauntId,
      content: content.trim(),
      createdAt: now as any,
      author: {
        id: userData.id,
        username: userData.username,
        displayName: userData.displayName,
        avatar: userData.avatar || null,
        reputationScore: userData.reputationScore || profileData?.reputationScore || 0,
      },
      reactions: [],
      replyCount: 0,
    };

    await db.collection("haunts").doc(hauntId).set(haunt);

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
      ).catch(err => console.error("Mention notification error in haunts:", err));
    }

    // Update Gamification
    updateGamification(userData.id, "HAUNT").catch(err => console.error("Gamification error in haunts:", err));

    return NextResponse.json<ApiResponse<HauntPost>>({
      success: true,
      data: haunt,
    }, { status: 201 });
  } catch (error) {
    console.error("Haunts POST error:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
