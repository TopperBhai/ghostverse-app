// GhostVerse — Friends API (Firebase)
import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../lib/firebase-admin";
import { getAuthUser } from "../../../lib/auth";
import { v4 as uuidv4 } from "uuid";
import type { ApiResponse } from "../../../types";

export async function GET() {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get all friendships involving the user
    const sentQuery = await db.collection("friendships")
      .where("senderId", "==", authUser.userId)
      .get();
      
    const recvQuery = await db.collection("friendships")
      .where("receiverId", "==", authUser.userId)
      .get();

    const allFriendships = [...sentQuery.docs, ...recvQuery.docs];
    
    const friends: any[] = [];
    const pendingIncoming: any[] = [];
    const pendingOutgoing: any[] = [];
    
    // Fetch user details for each relationship
    await Promise.all(
      allFriendships.map(async (doc) => {
        const data = doc.data();
        const friendId = data.senderId === authUser.userId ? data.receiverId : data.senderId;
        
        const friendDoc = await db.collection("users").doc(friendId).get();
        if (!friendDoc.exists) return;
        
        const friend = friendDoc.data() as any;
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
        const isOnline = friend.lastSeen > fiveMinutesAgo;
        
        const result = {
          id: friend.id,
          username: friend.username,
          displayName: friend.displayName,
          avatar: friend.avatar,
          status: isOnline ? "online" : "offline",
          lastSeen: friend.lastSeen,
          friendshipId: doc.id,
        };

        if (data.status === "ACCEPTED") {
          friends.push(result);
        } else if (data.status === "PENDING") {
          if (data.receiverId === authUser.userId) {
            pendingIncoming.push(result);
          } else {
            pendingOutgoing.push(result);
          }
        }
      })
    );

    return NextResponse.json<ApiResponse>({
      success: true,
      data: { friends, pendingIncoming, pendingOutgoing },
    });
  } catch (error) {
    console.error("Friends GET error:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

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
    const { username } = body;

    if (!username) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Username is required" },
        { status: 400 }
      );
    }

    const lowercaseUsername = username.toLowerCase();

    if (lowercaseUsername === authUser.username) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Cannot friend yourself" },
        { status: 400 }
      );
    }

    const targetUserQuery = await db.collection("users").where("username", "==", lowercaseUsername).limit(1).get();
    if (targetUserQuery.empty) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    const targetUserDoc = targetUserQuery.docs[0];
    const userId = targetUserDoc.id;

    // Check if friendship exists
    const sentCheck = await db.collection("friendships")
      .where("senderId", "==", authUser.userId)
      .where("receiverId", "==", userId)
      .get();
      
    const recvCheck = await db.collection("friendships")
      .where("senderId", "==", userId)
      .where("receiverId", "==", authUser.userId)
      .get();

    if (!sentCheck.empty || !recvCheck.empty) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Friend request already exists" },
        { status: 409 }
      );
    }

    const friendshipId = uuidv4();
    const friendship = {
      id: friendshipId,
      senderId: authUser.userId,
      receiverId: userId,
      status: "PENDING",
      createdAt: new Date().toISOString(),
    };

    await db.collection("friendships").doc(friendshipId).set(friendship);

    // Create notification
    const notifId = uuidv4();
    await db.collection("notifications").doc(notifId).set({
      id: notifId,
      userId: userId,
      type: "FRIEND_REQUEST",
      title: "New Friend Request",
      content: `@${authUser.username} wants to be your friend`,
      data: { friendshipId, fromUserId: authUser.userId },
      read: false,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json<ApiResponse>(
      { success: true, data: friendship, message: "Friend request sent!" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Friends POST error:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
