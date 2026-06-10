import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../lib/firebase-admin";
import { getAuthUser } from "../../../lib/auth";
import type { ApiResponse } from "../../../types";

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "30"), 50);

    const snapshot = await db.collection("notifications")
      .where("userId", "==", authUser.userId)
      .orderBy("createdAt", "desc")
      .limit(limit)
      .get();

    const notifications = snapshot.docs.map(doc => doc.data());

    return NextResponse.json<ApiResponse>({
      success: true,
      data: notifications,
    });
  } catch (error) {
    console.error("Notifications GET error:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Mark a notification as read
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
    const { id, markAll } = body;

    if (markAll) {
      // Mark all notifications for this user as read
      const batch = db.batch();
      const snapshot = await db.collection("notifications")
        .where("userId", "==", authUser.userId)
        .where("read", "==", false)
        .get();

      snapshot.docs.forEach(doc => {
        batch.update(doc.ref, { read: true });
      });
      await batch.commit();
    } else if (id) {
      await db.collection("notifications").doc(id).update({ read: true });
    }

    return NextResponse.json<ApiResponse>({ success: true });
  } catch (error) {
    console.error("Notifications PATCH error:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Notification ID required" },
        { status: 400 }
      );
    }

    const docRef = db.collection("notifications").doc(id);
    const doc = await docRef.get();

    if (!doc.exists || doc.data()?.userId !== authUser.userId) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Not found or unauthorized" },
        { status: 404 }
      );
    }

    await docRef.delete();

    return NextResponse.json<ApiResponse>({ success: true });
  } catch (error) {
    console.error("Notifications DELETE error:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
