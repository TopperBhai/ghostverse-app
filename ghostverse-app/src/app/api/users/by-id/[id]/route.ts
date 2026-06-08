import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../../../lib/firebase-admin";
import { getAuthUser } from "../../../../../lib/auth";
import type { ApiResponse, UserProfile } from "../../../../../types";

export async function GET(
  _request: NextRequest,
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

    const { id: userId } = await params;

    // Lookup by Firestore document ID (Firebase UID)
    const userDoc = await db.collection("users").doc(userId).get();

    if (!userDoc.exists) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    const userData = userDoc.data() as any;

    const userProfile: Partial<UserProfile> = {
      id: userData.id || userId,
      username: userData.username,
      displayName: userData.displayName,
      avatar: userData.avatar ?? null,
      bio: userData.bio ?? null,
      status: userData.status,
    };

    return NextResponse.json<ApiResponse<Partial<UserProfile>>>({
      success: true,
      data: userProfile,
    });
  } catch (error) {
    console.error("User by-id GET error:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
