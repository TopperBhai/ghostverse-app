import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../../lib/firebase-admin";
import { getAuthUser } from "../../../../lib/auth";
import type { ApiResponse } from "../../../../types";

export async function PATCH(request: NextRequest) {
  try {
    const authUser = await getAuthUser();

    if (!authUser) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { mood, interests } = body;

    const updates: Record<string, any> = {};
    if (mood !== undefined) updates.mood = mood;
    if (interests !== undefined) updates.interests = interests;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "No fields to update" },
        { status: 400 }
      );
    }

    const profileRef = db.collection("users").doc(authUser.userId).collection("data").doc("profile");
    
    // Use set with merge to create the document if it doesn't exist
    await profileRef.set(updates, { merge: true });

    return NextResponse.json<ApiResponse>({
      success: true,
      message: "Profile updated successfully",
    });
  } catch (error) {
    console.error("Profile Update API error:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
