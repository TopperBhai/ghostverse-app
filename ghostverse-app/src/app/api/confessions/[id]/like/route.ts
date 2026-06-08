import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../../../lib/firebase-admin";
import { getAuthUser } from "../../../../../lib/auth";
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

    const { id: confessionId } = await params;
    const docRef = db.collection("confessions").doc(confessionId);
    
    // Run in a transaction to safely toggle the like
    const newLikesCount = await db.runTransaction(async (t) => {
      const doc = await t.get(docRef);
      if (!doc.exists) {
        throw new Error("Confession not found");
      }
      
      const data = doc.data() as any;
      const likedBy = data.likedBy || [];
      const hasLiked = likedBy.includes(authUser.userId);
      
      let newLikes = data.likes || 0;
      let newLikedBy = [...likedBy];
      
      if (hasLiked) {
        // Unlike
        newLikes = Math.max(0, newLikes - 1);
        newLikedBy = newLikedBy.filter((id) => id !== authUser.userId);
      } else {
        // Like
        newLikes += 1;
        newLikedBy.push(authUser.userId);
      }
      
      t.update(docRef, {
        likes: newLikes,
        likedBy: newLikedBy
      });
      
      return newLikes;
    });

    return NextResponse.json<ApiResponse<{ likes: number }>>(
      { success: true, data: { likes: newLikesCount } }
    );
  } catch (error: any) {
    console.error("Confessions Like error:", error);
    if (error.message === "Confession not found") {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Confession not found" },
        { status: 404 }
      );
    }
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
