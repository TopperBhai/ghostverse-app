// GhostVerse — Change Username API
import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../../lib/firebase-admin";
import { getAuthUser, signToken, setAuthCookie, validateUsername } from "../../../../lib/auth";
import type { ApiResponse } from "../../../../types";

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
    const { newUsername } = body;

    if (!newUsername || typeof newUsername !== "string") {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "New username is required" },
        { status: 400 }
      );
    }

    const cleanUsername = newUsername.trim().toLowerCase();

    if (!validateUsername(cleanUsername)) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Username must be 3-20 characters long and can only contain letters, numbers, and underscores." },
        { status: 400 }
      );
    }

    if (cleanUsername === authUser.username.toLowerCase()) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "This is already your username." },
        { status: 400 }
      );
    }

    // Check if the username is already taken
    const existingUserQuery = await db
      .collection("users")
      .where("username", "==", cleanUsername)
      .limit(1)
      .get();

    if (!existingUserQuery.empty) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "This username is already taken. Please choose another." },
        { status: 400 }
      );
    }

    // Update username in the database
    await db.collection("users").doc(authUser.userId).update({
      username: cleanUsername
    });

    // Generate a new token with the updated username
    const newToken = await signToken({
      userId: authUser.userId,
      username: cleanUsername,
      role: authUser.role
    });

    await setAuthCookie(newToken);

    return NextResponse.json<ApiResponse>({
      success: true,
      message: "Username updated successfully",
      data: { username: cleanUsername }
    });
  } catch (error) {
    console.error("Change username error:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
