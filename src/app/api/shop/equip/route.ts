import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../../lib/firebase-admin";
import { getAuthUser } from "../../../../lib/auth";
import type { ApiResponse, GhostCosmetics } from "../../../../types";
import { SHOP_ITEMS } from "../../../../lib/shop-items";

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json<ApiResponse>({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { itemId } = await request.json();
    // if itemId is null, it means unequip
    
    let targetType: string | null = null;
    let targetValue: string | null = null;

    if (itemId) {
      const item = SHOP_ITEMS.find(i => i.id === itemId);
      if (!item) {
        return NextResponse.json<ApiResponse>({ success: false, error: "Invalid item" }, { status: 400 });
      }
      targetType = item.type;
      targetValue = item.value;
    } else {
      // Need a type to unequip, should be passed in body
      const { type } = await request.json(); // "color", "aura", "hat"
      targetType = type;
    }

    const userRef = db.collection("users").doc(authUser.userId);

    await db.runTransaction(async (t) => {
      const userDoc = await t.get(userRef);
      if (!userDoc.exists) throw new Error("User not found");

      const userData = userDoc.data()!;
      const cosmetics: GhostCosmetics = userData.cosmetics || { activeHat: null, activeAura: null, nameColor: null, unlockedItems: [] };

      if (itemId && !cosmetics.unlockedItems.includes(itemId)) {
        throw new Error("You do not own this item");
      }

      if (targetType === "color") cosmetics.nameColor = targetValue;
      if (targetType === "aura") cosmetics.activeAura = targetValue;
      if (targetType === "hat") cosmetics.activeHat = targetValue;

      t.update(userRef, { cosmetics });
    });

    return NextResponse.json<ApiResponse>({ success: true, message: `Successfully equipped item` });
  } catch (error: any) {
    console.error("Shop equip error:", error);
    return NextResponse.json<ApiResponse>({ success: false, error: error.message || "Internal server error" }, { status: 400 });
  }
}
