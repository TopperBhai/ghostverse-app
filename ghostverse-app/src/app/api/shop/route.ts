import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../lib/firebase-admin";
import { getAuthUser } from "../../../lib/auth";
import type { ApiResponse } from "../../../types";

const SHOP_PRICES: Record<string, number> = {
  "neon-green": 50,
  "infernal-red": 150,
  "void-purple": 300,
  "golden-halo": 500,
  "halo": 100,
  "wizard-hat": 200,
  "demon-horns": 350,
  "crown": 1000,
  "cowboy": 250,
};

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json<ApiResponse>({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { itemId, type, action } = await request.json();

    const userRef = db.collection("users").doc(authUser.userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return NextResponse.json<ApiResponse>({ success: false, error: "User not found" }, { status: 404 });
    }

    const userData = userDoc.data();
    const profile = userData?.profile || {};
    const cosmetics = userData?.cosmetics || { activeHat: null, activeAura: null, unlockedItems: [] };
    const unlocked = cosmetics.unlockedItems || [];
    let rep = profile.reputationScore || 0;

    if (action === "buy") {
      if (!itemId || !type) return NextResponse.json<ApiResponse>({ success: false, error: "Invalid item" }, { status: 400 });
      if (unlocked.includes(itemId)) {
        return NextResponse.json<ApiResponse>({ success: false, error: "Item already owned" }, { status: 400 });
      }

      const price = SHOP_PRICES[itemId];
      if (price === undefined) {
        return NextResponse.json<ApiResponse>({ success: false, error: "Item not found" }, { status: 400 });
      }

      if (rep < price) {
        return NextResponse.json<ApiResponse>({ success: false, error: "Not enough Reputation Points" }, { status: 400 });
      }

      // Deduct rep and add to unlocked
      rep -= price;
      unlocked.push(itemId);
      
      // Auto-equip on buy
      if (type === "aura") cosmetics.activeAura = itemId;
      if (type === "hat") cosmetics.activeHat = itemId;

      cosmetics.unlockedItems = unlocked;

      await userRef.update({
        "profile.reputationScore": rep,
        cosmetics: cosmetics,
      });

      return NextResponse.json<ApiResponse>({ success: true, data: { rep, cosmetics } });
    }

    if (action === "equip") {
      if (!itemId || !type) return NextResponse.json<ApiResponse>({ success: false, error: "Invalid item" }, { status: 400 });
      if (!unlocked.includes(itemId)) {
        return NextResponse.json<ApiResponse>({ success: false, error: "Item not owned" }, { status: 400 });
      }

      if (type === "aura") cosmetics.activeAura = itemId;
      if (type === "hat") cosmetics.activeHat = itemId;

      await userRef.update({ cosmetics });

      return NextResponse.json<ApiResponse>({ success: true, data: { cosmetics } });
    }

    if (action === "unequip") {
      if (!type) return NextResponse.json<ApiResponse>({ success: false, error: "Invalid type" }, { status: 400 });
      
      if (type === "aura") cosmetics.activeAura = null;
      if (type === "hat") cosmetics.activeHat = null;

      await userRef.update({ cosmetics });

      return NextResponse.json<ApiResponse>({ success: true, data: { cosmetics } });
    }

    return NextResponse.json<ApiResponse>({ success: false, error: "Invalid action" }, { status: 400 });

  } catch (error) {
    console.error("Shop API error:", error);
    return NextResponse.json<ApiResponse>({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
