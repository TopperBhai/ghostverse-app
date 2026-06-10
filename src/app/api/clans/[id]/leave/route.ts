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
      if (userData.clanId !== id) {
        throw new Error("You are not in this clan.");
      }

      const clanDoc = await t.get(clanRef);
      if (!clanDoc.exists) {
        // Fallback: cleanup user if clan was deleted somehow
        t.update(userRef, { clanId: FieldValue.delete(), clanTag: FieldValue.delete() });
        return;
      }

      const clanData = clanDoc.data() as Clan;
      
      if (clanData.leaderId === authUser.userId) {
        if (clanData.members.length > 1) {
          throw new Error("You must pass leadership to someone else before leaving, or kick everyone to disband.");
        } else {
          // Disband clan if leader is the only one
          t.delete(clanRef);
        }
      } else {
        // Remove member
        t.update(clanRef, {
          members: FieldValue.arrayRemove(authUser.userId)
        });
      }

      // Update user
      t.update(userRef, {
        clanId: FieldValue.delete(),
        clanTag: FieldValue.delete()
      });
    });

    return NextResponse.json<ApiResponse>({ success: true, message: "Successfully left clan." });
  } catch (error: any) {
    console.error("Clan leave error:", error);
    return NextResponse.json<ApiResponse>({ success: false, error: error.message || "Internal server error" }, { status: 400 });
  }
}
