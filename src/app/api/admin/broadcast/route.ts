import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../../lib/firebase-admin";
import { getAuthUser } from "../../../../lib/auth";
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

    // Check if admin
    const userDoc = await db.collection("users").doc(authUser.userId).get();
    if (!userDoc.exists || userDoc.data()?.role !== "ADMIN") {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Forbidden: Admin access required" },
        { status: 403 }
      );
    }

    const { title, body, imageUrl } = await request.json();

    if (!title || !body) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Title and body are required" },
        { status: 400 }
      );
    }

    // Fetch all users who have fcmTokens
    const usersSnapshot = await db.collection("users")
      .where("fcmTokens", "!=", [])
      .get();

    const tokens: string[] = [];
    usersSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.fcmTokens && Array.isArray(data.fcmTokens)) {
        tokens.push(...data.fcmTokens);
      }
    });

    if (tokens.length === 0) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "No users have registered devices for notifications" },
        { status: 400 }
      );
    }

    // Send multicast message
    const { getMessaging } = require('firebase-admin/messaging');
    const message = {
      notification: {
        title,
        body,
        ...(imageUrl && { imageUrl }),
      },
      tokens: tokens,
    };

    const response = await getMessaging().sendEachForMulticast(message);
    
    // Optional: We can cleanup invalid tokens here by inspecting response.responses

    return NextResponse.json<ApiResponse>(
      { 
        success: true, 
        message: `Broadcast sent! Success: ${response.successCount}, Failed: ${response.failureCount}` 
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Admin broadcast error:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
