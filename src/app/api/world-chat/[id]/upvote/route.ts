// GhostVerse — World Chat Upvote API
import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../../../lib/firebase-admin";
import { getAuthUser } from "../../../../../lib/auth";
import { getISTDateString } from "../../../../../lib/gamification";
import { FieldValue } from "firebase-admin/firestore";
import type { ApiResponse } from "../../../../../types";

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

    // Check Daily (IST Midnight) rate limit on voter
    const voterDoc = await db.collection("users").doc(authUser.userId).get();
    const voterData = voterDoc.data();
    if (voterData?.lastUpvoteGivenAt) {
      const todayStr = getISTDateString(Date.now());
      const lastVoteStr = getISTDateString(voterData.lastUpvoteGivenAt);
      
      if (todayStr === lastVoteStr) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: "You can only give 1 reputation point per day. Resets at midnight (IST)." },
          { status: 429 }
        );
      }
    }

    const batch = db.batch();

    // Update reputation score in the main user document for Leaderboard sorting
    batch.update(db.collection("users").doc(senderId), {
      reputationScore: FieldValue.increment(1)
    });

    // Update lastUpvoteGivenAt for the voter
    batch.update(db.collection("users").doc(authUser.userId), {
      lastUpvoteGivenAt: new Date().toISOString()
    });

    await batch.commit();

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
