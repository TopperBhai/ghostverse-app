// GhostVerse — Give Reputation API
// Decoupled from message upvotes — directly gives +1 rep to a user.
// Enforces the same 24-hour global limit per voter (lastUpvoteGivenAt).
import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../../../lib/firebase-admin";
import { getAuthUser } from "../../../../../lib/auth";
import { FieldValue } from "firebase-admin/firestore";
import type { ApiResponse } from "../../../../../types";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { username } = await params;

    // Find target user by username
    const targetQuery = await db
      .collection("users")
      .where("username", "==", username.toLowerCase())
      .limit(1)
      .get();

    if (targetQuery.empty) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    const targetDoc = targetQuery.docs[0];
    const targetData = targetDoc.data();
    const targetUserId = targetData.id;

    // Can't give rep to yourself
    if (authUser.userId === targetUserId) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "You cannot give reputation to yourself" },
        { status: 400 }
      );
    }

    // Check 24-hour rate limit on voter
    const voterDoc = await db.collection("users").doc(authUser.userId).get();
    const voterData = voterDoc.data();
    if (voterData?.lastUpvoteGivenAt) {
      const lastUpvote = new Date(voterData.lastUpvoteGivenAt).getTime();
      const msUntilNext = 24 * 60 * 60 * 1000 - (Date.now() - lastUpvote);
      if (msUntilNext > 0) {
        const hoursLeft = Math.ceil(msUntilNext / (1000 * 60 * 60));
        return NextResponse.json<ApiResponse>(
          { success: false, error: `You can give rep again in ${hoursLeft} hour${hoursLeft === 1 ? "" : "s"}` },
          { status: 429 }
        );
      }
    }

    // Atomic batch: update target reputation + voter lastUpvoteGivenAt
    const batch = db.batch();

    batch.update(db.collection("users").doc(targetUserId), {
      reputationScore: FieldValue.increment(1),
    });

    // Also update profile subcollection for compatibility
    try {
      batch.update(
        db.collection("users").doc(targetUserId).collection("data").doc("profile"),
        { reputationScore: FieldValue.increment(1) }
      );
    } catch {}

    batch.update(db.collection("users").doc(authUser.userId), {
      lastUpvoteGivenAt: new Date().toISOString(),
    });

    await batch.commit();

    return NextResponse.json<ApiResponse>(
      { success: true, message: "Reputation given successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Give rep error:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
