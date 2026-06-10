import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../../../lib/firebase-admin";
import { getAuthUser } from "../../../../../lib/auth";
import type { ApiResponse } from "../../../../../types";

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const authUser = await getAuthUser();
    if (!authUser || authUser.role !== "ADMIN") {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Unauthorized: Admins only" },
        { status: 403 }
      );
    }

    const { userId } = params;
    const userDoc = await db.collection("users").doc(userId).get();

    if (!userDoc.exists) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    const userData = userDoc.data()!;
    const profileDoc = await db.collection("users").doc(userId).collection("data").doc("profile").get();
    
    let profileData = null;
    if (profileDoc.exists) {
      profileData = profileDoc.data();
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        ...userData,
        profile: profileData
      },
    });
  } catch (error) {
    console.error("Admin User Inspect GET error:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const authUser = await getAuthUser();
    if (!authUser || authUser.role !== "ADMIN") {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Unauthorized: Admins only" },
        { status: 403 }
      );
    }

    const { userId } = params;
    const body = await request.json();
    const { action } = body;

    const profileRef = db.collection("users").doc(userId).collection("data").doc("profile");
    const profileDoc = await profileRef.get();

    if (!profileDoc.exists) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "User profile not found" },
        { status: 404 }
      );
    }

    const currentProfile = profileDoc.data()!;

    if (action === "RESET_STREAK") {
      await profileRef.update({ currentStreak: 0 });
    } else if (action === "GRANT_XP") {
      const xpToAdd = body.amount || 1000;
      await profileRef.update({
        xp: (currentProfile.xp || 0) + xpToAdd,
      });
    } else if (action === "FORCE_EVOLVE") {
      await profileRef.update({
        ghostEvolutionLevel: (currentProfile.ghostEvolutionLevel || 1) + 1,
      });
    } else {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Invalid action" },
        { status: 400 }
      );
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      message: `Successfully executed ${action}`,
    });
  } catch (error) {
    console.error("Admin User Inspect PATCH error:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
