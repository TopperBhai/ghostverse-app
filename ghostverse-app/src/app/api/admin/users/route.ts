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
    let { userId, action, targetUsername } = body;

    if (!action) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Action is required" },
        { status: 400 }
      );
    }

    if (targetUsername) {
      const userQuery = await db.collection("users").where("username", "==", targetUsername.toLowerCase()).limit(1).get();
      if (userQuery.empty) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: "User not found by username" },
          { status: 404 }
        );
      }
      userId = userQuery.docs[0].id;
    }

    if (!userId) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "userId or targetUsername is required" },
        { status: 400 }
      );
    }

    let newStatus = "ACTIVE";
    if (action === "BAN") newStatus = "BANNED";
    if (action === "MUTE") newStatus = "MUTED";

    if (action === "DELETE") {
      // Clean up the user entirely
      const userRef = db.collection("users").doc(userId);
      
      // Delete profile data subcollection
      const profileDoc = await userRef.collection("data").doc("profile").get();
      if (profileDoc.exists) await profileDoc.ref.delete();
      
      // Delete friendships (where sender or receiver)
      const sentFriends = await db.collection("friendships").where("senderId", "==", userId).get();
      const recvFriends = await db.collection("friendships").where("receiverId", "==", userId).get();
      const batch = db.batch();
      sentFriends.docs.forEach(doc => batch.delete(doc.ref));
      recvFriends.docs.forEach(doc => batch.delete(doc.ref));
      
      // Delete user
      batch.delete(userRef);
      await batch.commit();

      return NextResponse.json<ApiResponse>({
        success: true,
        message: `User deleted permanently`,
      });
    }

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
