// GhostVerse — Admin Stats API
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

    // Get total registered users
    const usersCountQuery = await db.collection("users").count().get();
    const totalUsers = usersCountQuery.data().count;

    // Get online users from server RAM (Socket.io map)
    const getOnlineUsersCount = (globalThis as any).__getOnlineUsersCount as (() => number) | undefined;
    const onlineUsers = getOnlineUsersCount ? getOnlineUsersCount() : 0;

    const hauntsCountQuery = await db.collection("haunts").count().get();
    const totalHaunts = hauntsCountQuery.data().count;

    const friendshipsQuery = await db.collection("friendships").count().get();
    const totalFriendships = friendshipsQuery.data().count;

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        totalUsers,
        onlineUsers,
        totalHaunts,
        totalFriendships,
      },
    });
  } catch (error) {
    console.error("Admin Stats GET error:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
