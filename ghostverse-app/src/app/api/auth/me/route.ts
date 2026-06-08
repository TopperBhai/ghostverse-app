// GhostVerse — Me API (Firebase)
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

    const userDoc = await db.collection("users").doc(authUser.userId).get();

    if (!userDoc.exists) {
      // Token is valid but user no longer exists
      const response = NextResponse.json<ApiResponse>(
        { success: false, error: "User not found" },
        { status: 404 }
      );
      response.cookies.delete("ghostverse-token");
      return response;
    }

    const user = userDoc.data() as any;

    if (user.status === "BANNED") {
      const response = NextResponse.json<ApiResponse>(
        { success: false, error: "Account banned" },
        { status: 403 }
      );
      response.cookies.delete("ghostverse-token");
      return response;
    }

    // Update last seen
    await userDoc.ref.update({
      lastSeen: new Date().toISOString()
    });

    // Get Profile data
    const profileDoc = await userDoc.ref.collection("data").doc("profile").get();
    const profileData = profileDoc.exists ? profileDoc.data() : { interests: [], reputationScore: 0 };

    // Get Friends count
    const sentFriends = await db.collection("friendships")
      .where("senderId", "==", user.id)
      .where("status", "==", "ACCEPTED")
      .count()
      .get();
      
    const recvFriends = await db.collection("friendships")
      .where("receiverId", "==", user.id)
      .where("status", "==", "ACCEPTED")
      .count()
      .get();

    const friendsCount = sentFriends.data().count + recvFriends.data().count;

    const userProfile = {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      avatar: user.avatar,
      bio: user.bio,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt,
      lastSeen: user.lastSeen,
      lastUpvoteGivenAt: user.lastUpvoteGivenAt,
      profile: profileData,
      friendsCount,
      gamification: user.gamification,
    };

    return NextResponse.json<ApiResponse>({
      success: true,
      data: userProfile,
    });
  } catch (error) {
    console.error("Me API error:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

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
    const { avatar, bio, displayName } = body;

    const updates: Record<string, any> = {};
    if (avatar !== undefined) updates.avatar = avatar;
    if (bio !== undefined) updates.bio = bio;
    if (displayName !== undefined) updates.displayName = displayName;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "No fields to update" },
        { status: 400 }
      );
    }

    const userRef = db.collection("users").doc(authUser.userId);
    await userRef.update(updates);

    return NextResponse.json<ApiResponse>({
      success: true,
      message: "Profile updated successfully",
    });
  } catch (error) {
    console.error("Update API error:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
