// GhostVerse — Haunt Item API
import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../../lib/firebase-admin";
import { getAuthUser } from "../../../../lib/auth";
import type { ApiResponse } from "../../../../types";

export async function DELETE(
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

    const hauntData = hauntDoc.data();

    // Only allow deletion if the user is the author OR is an admin
    if (hauntData?.author?.id !== authUser.userId && authUser.role !== "ADMIN") {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "You can only delete your own haunts" },
        { status: 403 }
      );
    }

    // Delete all replies associated with this haunt first
    const repliesSnapshot = await db.collection("haunts").doc(id).collection("replies").get();
    const batch = db.batch();
    
    repliesSnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    
    // Delete the haunt document itself
    batch.delete(hauntRef);

    await batch.commit();

    return NextResponse.json<ApiResponse>({
      success: true,
      message: "Haunt deleted successfully",
    });
  } catch (error) {
    console.error("Haunt DELETE error:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
