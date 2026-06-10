import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../../../lib/firebase-admin";
import { getAuthUser } from "../../../../../lib/auth";
import type { ApiResponse, Clan } from "../../../../../types";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json<ApiResponse>({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const userRef = db.collection("users").doc(authUser.userId);
    const clanRef = db.collection("clans").doc(id);

    await db.runTransaction(async (t) => {
      const userDoc = await t.get(userRef);
      if (!userDoc.exists) throw new Error("User not found");

      const userData = userDoc.data()!;
      if (userData.clanId) {
        throw new Error("You are already in a clan. Leave it first.");
      }

      const clanDoc = await t.get(clanRef);
      if (!clanDoc.exists) throw new Error("Clan not found");

      const clanData = clanDoc.data() as Clan;
      if (clanData.members.length >= 50) {
        throw new Error("Clan is full (max 50 members).");
      }

      // Add to clan
      t.update(clanRef, {
        members: FieldValue.arrayUnion(authUser.userId)
      });

      // Update user
      t.update(userRef, {
        clanId: clanData.id,
        clanTag: clanData.tag
      });
    });

    return NextResponse.json<ApiResponse>({ success: true, message: "Successfully joined clan!" });
  } catch (error: any) {
    console.error("Clan join error:", error);
    return NextResponse.json<ApiResponse>({ success: false, error: error.message || "Internal server error" }, { status: 400 });
  }
}
