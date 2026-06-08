import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../lib/firebase-admin";
import { getAuthUser } from "../../../lib/auth";
import { v4 as uuidv4 } from "uuid";
import type { ApiResponse, Confession } from "../../../types";

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
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);

    const snapshot = await db.collection("confessions")
      .orderBy("createdAt", "desc")
      .limit(limit)
      .get();

    const confessions = snapshot.docs.map(doc => doc.data() as Confession);

    return NextResponse.json<ApiResponse<Confession[]>>({
      success: true,
      data: confessions,
    });
  } catch (error) {
    console.error("Confessions GET error:", error);
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
    const { content } = body;

    if (!content || content.trim().length === 0) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Content is required" },
        { status: 400 }
      );
    }

    if (content.length > 500) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Confession too long (max 500 characters)" },
        { status: 400 }
      );
    }

    const confessionId = uuidv4();
    const confession: Confession = {
      id: confessionId,
      content: content.trim(),
      likes: 0,
      comments: 0,
      createdAt: new Date().toISOString() as any,
      authorId: authUser.userId, // Stored but not exposed to UI usually
      likedBy: [],
    };

    await db.collection("confessions").doc(confessionId).set(confession);

    return NextResponse.json<ApiResponse<Confession>>(
      { success: true, data: confession },
      { status: 201 }
    );
  } catch (error) {
    console.error("Confessions POST error:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
