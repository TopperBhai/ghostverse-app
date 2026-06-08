// GhostVerse — Admin Users API
import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../../lib/firebase-admin";
import { getAuthUser } from "../../../../lib/auth";
import type { ApiResponse } from "../../../../types";

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser();
    if (!authUser || authUser.role !== "ADMIN") {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Unauthorized: Admins only" },
        { status: 403 }
      );
    }

    const snapshot = await db.collection("users").orderBy("createdAt", "desc").get();
    const users = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: data.id,
        username: data.username,
        displayName: data.displayName,
        role: data.role,
        status: data.status,
        createdAt: data.createdAt,
        lastSeen: data.lastSeen,
      };
    });

    return NextResponse.json<ApiResponse>({
      success: true,
      data: users,
    });
  } catch (error) {
    console.error("Admin Users GET error:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const authUser = await getAuthUser();
    if (!authUser || authUser.role !== "ADMIN") {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Unauthorized: Admins only" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { userId, action } = body;

    if (!userId || !action) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "userId and action are required" },
        { status: 400 }
      );
    }

    let newStatus = "ACTIVE";
    if (action === "BAN") newStatus = "BANNED";
    if (action === "MUTE") newStatus = "MUTED";

    await db.collection("users").doc(userId).update({ status: newStatus });

    return NextResponse.json<ApiResponse>({
      success: true,
      message: `User status updated to ${newStatus}`,
    });
  } catch (error) {
    console.error("Admin Users PATCH error:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
