// GhostVerse — Haunt Reactions API
import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../../../lib/firebase-admin";
import { getAuthUser } from "../../../../../lib/auth";
import { FieldValue } from "firebase-admin/firestore";
import type { ApiResponse, HauntReaction, HauntReactionType } from "../../../../../types";

const VALID_REACTIONS: HauntReactionType[] = ["SPOOKY", "FIRE", "DEAD", "ICONIC"];

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
    const body = await request.json();
    const { type }: { type: HauntReactionType } = body;

    if (!type || !VALID_REACTIONS.includes(type)) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Invalid reaction type" },
        { status: 400 }
      );
    }

    const hauntRef = db.collection("haunts").doc(id);
    const hauntDoc = await hauntRef.get();

    if (!hauntDoc.exists) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Haunt not found" },
        { status: 404 }
      );
    }

    const hauntData = hauntDoc.data()!;
    const reactions: HauntReaction[] = hauntData.reactions || [];

    const userId = authUser.userId;
    const existingReaction = reactions.find((r) => r.type === type);
    const hasReacted = existingReaction?.reactedBy?.includes(userId);

    // Toggle reaction
    let updatedReactions: HauntReaction[];
    if (hasReacted) {
      // Remove reaction
      updatedReactions = reactions.map((r) => {
        if (r.type !== type) return r;
        const newReactedBy = r.reactedBy.filter((uid) => uid !== userId);
        return { ...r, count: Math.max(0, r.count - 1), reactedBy: newReactedBy };
      }).filter((r) => r.count > 0 || r.type !== type);
    } else {
      // Add reaction
      if (existingReaction) {
        updatedReactions = reactions.map((r) => {
          if (r.type !== type) return r;
          return { ...r, count: r.count + 1, reactedBy: [...r.reactedBy, userId] };
        });
      } else {
        updatedReactions = [...reactions, { type, count: 1, reactedBy: [userId] }];
      }
    }

    await hauntRef.update({ reactions: updatedReactions });

    return NextResponse.json<ApiResponse<HauntReaction[]>>({
      success: true,
      data: updatedReactions,
    });
  } catch (error) {
    console.error("Haunt react error:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
