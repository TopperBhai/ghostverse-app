// GhostVerse — User Search API for Mentions/Tags
import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../../lib/firebase-admin";
import { getAuthUser } from "../../../../lib/auth";
import type { ApiResponse } from "../../../../types";

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
    const query = searchParams.get("q")?.toLowerCase();

    if (!query) {
      return NextResponse.json<ApiResponse>(
        { success: true, data: [] },
        { status: 200 }
      );
    }

    // Prefix search on username (since usernames are stored lowercase)
    // The \uf8ff character is a very high code point in the Unicode range
    const snapshot = await db.collection("users")
      .where("username", ">=", query)
      .where("username", "<=", query + "\uf8ff")
      .limit(5)
      .get();

    const users = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        username: data.username,
        displayName: data.displayName,
        avatar: data.avatar || null,
        reputationScore: data.reputationScore || 0,
      };
    });

    // Remove the calling user from the results (can't tag yourself, or maybe you can, but let's exclude)
    const filteredUsers = users.filter(u => u.id !== authUser.userId);

    return NextResponse.json<ApiResponse>({
      success: true,
      data: filteredUsers,
    });
  } catch (error) {
    console.error("User search API error:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
