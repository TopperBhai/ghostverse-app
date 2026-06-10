import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../../lib/firebase-admin";
import { getAuthUser } from "../../../../lib/auth";
import type { ApiResponse, GhostCosmetics, Gamification } from "../../../../types";
import { SHOP_ITEMS } from "../../../../lib/shop-items";

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json<ApiResponse>({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { itemId } = await request.json();
    if (!itemId) {
      return NextResponse.json<ApiResponse>({ success: false, error: "Missing itemId" }, { status: 400 });
    }

    const item = SHOP_ITEMS.find(i => i.id === itemId);
    if (!item) {
      return NextResponse.json<ApiResponse>({ success: false, error: "Invalid item" }, { status: 400 });
    }

    const userRef = db.collection("users").doc(authUser.userId);

    await db.runTransaction(async (t) => {
      const userDoc = await t.get(userRef);
      if (!userDoc.exists) throw new Error("User not found");

      const userData = userDoc.data()!;
      const gamification: Gamification = userData.gamification || { ghostDust: 0 };
      const cosmetics: GhostCosmetics = userData.cosmetics || { activeHat: null, activeAura: null, nameColor: null, unlockedItems: [] };

      if (cosmetics.unlockedItems.includes(itemId)) {
        throw new Error("You already own this item");
      }

      if (gamification.ghostDust < item.price) {
        throw new Error(`Insufficient Ghost Dust. Need ${item.price} 🟣`);
      }

      // Deduct dust and add item
      gamification.ghostDust -= item.price;
      cosmetics.unlockedItems.push(itemId);

      t.update(userRef, { gamification, cosmetics });
    });

    return NextResponse.json<ApiResponse>({ success: true, message: `Successfully purchased ${item.name}` });
  } catch (error: any) {
    console.error("Shop buy error:", error);
    return NextResponse.json<ApiResponse>({ success: false, error: error.message || "Internal server error" }, { status: 400 });
  }
}
