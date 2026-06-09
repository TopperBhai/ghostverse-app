// GhostVerse — User Profile API (Firebase)
import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../../lib/firebase-admin";
import { getAuthUser } from "../../../../lib/auth";
import type { ApiResponse, UserProfile } from "../../../../types";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { username } = await params;

    const userQuery = await db.collection("users").where("username", "==", username.toLowerCase()).limit(1).get();
    
    if (userQuery.empty) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    const userDoc = userQuery.docs[0];
    const userData = userDoc.data() as any;

    // Get Profile data
    const profileDoc = await userDoc.ref.collection("data").doc("profile").get();
    const profileData = profileDoc.exists ? profileDoc.data() : { interests: [], reputationScore: 0 };

    // Get Friends count
    const sentFriends = await db.collection("friendships")
      .where("senderId", "==", userData.id)
      .where("status", "==", "ACCEPTED")
      .count()
      .get();
      
    const recvFriends = await db.collection("friendships")
      .where("receiverId", "==", userData.id)
      .where("status", "==", "ACCEPTED")
      .count()
      .get();

    const friendsCount = sentFriends.data().count + recvFriends.data().count;

    // Check viewer friendship status
    let viewerFriendshipStatus: "NONE" | "SENT" | "RECEIVED" | "ACCEPTED" | "REJECTED" = "NONE";
    if (authUser.userId !== userData.id) {
      // Look for a friendship document where the logged in user is either sender or receiver
      const friendshipQuery1 = await db.collection("friendships")
        .where("senderId", "==", authUser.userId)
        .where("receiverId", "==", userData.id)
        .get();
        
      const friendshipQuery2 = await db.collection("friendships")
        .where("senderId", "==", userData.id)
        .where("receiverId", "==", authUser.userId)
        .get();

      if (!friendshipQuery1.empty) {
        const docData = friendshipQuery1.docs[0].data();
        viewerFriendshipStatus = docData.status === "PENDING" ? "SENT" : docData.status;
      } else if (!friendshipQuery2.empty) {
        const docData = friendshipQuery2.docs[0].data();
        viewerFriendshipStatus = docData.status === "PENDING" ? "RECEIVED" : docData.status;
      }
    }

    const userProfile: UserProfile = {
      id: userData.id,
      username: userData.username,
      displayName: userData.displayName,
      avatar: userData.avatar,
      bio: userData.bio,
      role: userData.role,
      status: userData.status,
      createdAt: userData.createdAt,
      lastSeen: userData.lastSeen,
      profile: profileData as any,
      friendsCount,
      viewerFriendshipStatus,
      gamification: userData.gamification,
      cosmetics: userData.cosmetics,
    };


    return NextResponse.json<ApiResponse<UserProfile>>({
      success: true,
      data: userProfile,
    });
  } catch (error) {
    console.error("User profile GET error:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
