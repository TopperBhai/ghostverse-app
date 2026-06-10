// GhostVerse — Give Reputation API
// Decoupled from message upvotes — directly gives +1 rep to a user.
// Enforces the same 24-hour global limit per voter (lastUpvoteGivenAt).
import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../../../lib/firebase-admin";
import { getAuthUser } from "../../../../../lib/auth";
import { getISTDateString } from "../../../../../lib/gamification";
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

    // Check 8-hour rate limit on voter
    const voterDoc = await db.collection("users").doc(authUser.userId).get();
    const voterData = voterDoc.data();
    if (voterData?.lastUpvoteGivenAt) {
      const EIGHT_HOURS_MS = 8 * 60 * 60 * 1000;
      const timeSinceLastVote = Date.now() - new Date(voterData.lastUpvoteGivenAt).getTime();
      
      if (timeSinceLastVote < EIGHT_HOURS_MS) {
        const remainingHours = Math.ceil((EIGHT_HOURS_MS - timeSinceLastVote) / (1000 * 60 * 60));
        return NextResponse.json<ApiResponse>(
          { success: false, error: `You can give reputation again in ${remainingHours} hour(s).` },
          { status: 429 }
        );
      }
    }

    const batch = db.batch();

    batch.update(db.collection("users").doc(targetUserId), {
      reputationScore: FieldValue.increment(1),
    });

    batch.update(db.collection("users").doc(authUser.userId), {
      lastUpvoteGivenAt: new Date().toISOString(),
    });

    await batch.commit();

    // Call Gamification logic so they receive the XP for getting Rep
    const { updateGamification } = require("../../../../../lib/gamification");
    await updateGamification(targetUserId, "REP");
    // And giver gets mission progress
    await updateGamification(authUser.userId, "GIVE_REP");

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
