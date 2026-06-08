// GhostVerse — Leaderboard API
import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../lib/firebase-admin";
import type { ApiResponse } from "../../../types";

export async function GET(request: NextRequest) {
  try {
    // Fetch top 50 users ranked by reputationScore
    const snapshot = await db.collection("users")
      .orderBy("reputationScore", "desc")
      .limit(50)
      .get();

    const users = snapshot.docs.map((doc: any) => {
      const data = doc.data();
      return {
        id: doc.id,
        username: data.username,
        displayName: data.displayName,
        avatar: data.avatar || null,
        reputationScore: data.reputationScore || 0,
      };
    });

    return NextResponse.json<ApiResponse>({
      success: true,
      data: users
    });
  } catch (error) {
    console.error("Leaderboard GET error:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
