// GhostVerse — World Chat Upvote API
import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../../../lib/firebase-admin";
import { getAuthUser } from "../../../../../lib/auth";
import { FieldValue } from "firebase-admin/firestore";
import type { ApiResponse } from "../../../../../types";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { senderId } = body;

    if (!senderId) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Sender ID is required" },
        { status: 400 }
      );
    }

    if (authUser.userId === senderId) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "You cannot upvote your own message" },
        { status: 400 }
      );
    }

    // Update reputation score in the main user document for Leaderboard sorting
    await db.collection("users").doc(senderId).update({
      reputationScore: FieldValue.increment(1)
    });

    // Also update it in the profile subcollection for backward compatibility
    try {
      await db.collection("users").doc(senderId).collection("data").doc("profile").update({
        reputationScore: FieldValue.increment(1)
      });
    } catch (err) {
      // Ignore if profile doc doesn't exist yet
    }

    return NextResponse.json<ApiResponse>(
      { success: true, message: "Upvoted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("World chat upvote error:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
