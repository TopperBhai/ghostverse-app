// GhostVerse — Change Password API
import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../../lib/firebase-admin";
import { getAuthUser } from "../../../../lib/auth";
import type { ApiResponse } from "../../../../types";
import bcrypt from "bcryptjs";

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
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Current password and new password are required" },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "New password must be at least 6 characters long" },
        { status: 400 }
      );
    }

    const userDoc = await db.collection("users").doc(authUser.userId).get();
    if (!userDoc.exists) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    const userData = userDoc.data() as any;

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, userData.passwordHash);
    if (!isPasswordValid) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Incorrect current password" },
        { status: 401 }
      );
    }

    // Hash the new password
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    // Update password in the database
    await db.collection("users").doc(authUser.userId).update({
      passwordHash: newPasswordHash
    });

    return NextResponse.json<ApiResponse>({
      success: true,
      message: "Password updated successfully"
    });
  } catch (error) {
    console.error("Change password error:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
