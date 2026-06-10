// GhostVerse — Haunt Like API
import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../../../lib/firebase-admin";
import { getAuthUser } from "../../../../../lib/auth";
import { FieldValue } from "firebase-admin/firestore";
import type { ApiResponse } from "../../../../../types";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;

    const hauntRef = db.collection("haunts").doc(id);
    const hauntDoc = await hauntRef.get();

    if (!hauntDoc.exists) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Haunt not found" },
        { status: 404 }
      );
    }

    const hauntData = hauntDoc.data()!;
    const likedBy: string[] = hauntData.likedBy || [];
    const userId = authUser.userId;
    const hasLiked = likedBy.includes(userId);

    let updatedLikedBy: string[];
    let updatedLikes: number;

    if (hasLiked) {
      // Remove like atomically
      await hauntRef.update({
        likes: FieldValue.increment(-1),
        likedBy: FieldValue.arrayRemove(userId),
      });
      updatedLikedBy = likedBy.filter((uid) => uid !== userId);
      updatedLikes = Math.max(0, (hauntData.likes || 0) - 1);
    } else {
      // Add like atomically
      await hauntRef.update({
        likes: FieldValue.increment(1),
        likedBy: FieldValue.arrayUnion(userId),
      });
      updatedLikedBy = [...likedBy, userId];
      updatedLikes = (hauntData.likes || 0) + 1;
    }

    return NextResponse.json<ApiResponse<{likes: number, likedBy: string[]}>>({
      success: true,
      data: {
        likes: updatedLikes,
        likedBy: updatedLikedBy
      },
    });
  } catch (error) {
    console.error("Haunt like error:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
