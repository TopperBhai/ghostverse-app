import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../../lib/firebase-admin";
import { getAuthUser } from "../../../../lib/auth";
import { FieldValue } from "firebase-admin/firestore";
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
    const { token, action } = body; // action: 'register' | 'unregister'

    if (!token) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Token is required" },
        { status: 400 }
      );
    }

    const userRef = db.collection("users").doc(authUser.userId);

    if (action === "register") {
      await userRef.update({
        fcmTokens: FieldValue.arrayUnion(token)
      });
    } else if (action === "unregister") {
      await userRef.update({
        fcmTokens: FieldValue.arrayRemove(token)
      });
    } else {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Invalid action" },
        { status: 400 }
      );
    }

    return NextResponse.json<ApiResponse>(
      { success: true, message: `Token ${action}ed successfully` },
      { status: 200 }
    );
  } catch (error) {
    console.error("FCM device token error:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
