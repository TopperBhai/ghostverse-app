import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../lib/firebase-admin";
import { getAuthUser } from "../../../lib/auth";
import type { ApiResponse, Clan, Gamification } from "../../../types";

const CLAN_CREATE_COST = 500;

// GET: Fetch top clans
export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json<ApiResponse>({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);

    const snapshot = await db.collection("clans").orderBy("clanDust", "desc").limit(limit).get();

    const clans: Clan[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Clan));

    return NextResponse.json<ApiResponse<Clan[]>>({ success: true, data: clans });
  } catch (error) {
    console.error("Clans GET error:", error);
    return NextResponse.json<ApiResponse>({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

// POST: Create a new clan
export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json<ApiResponse>({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, tag, description } = body;

    if (!name || name.trim().length < 3 || name.length > 20) {
      return NextResponse.json<ApiResponse>({ success: false, error: "Name must be 3-20 chars" }, { status: 400 });
    }
    if (!tag || tag.trim().length < 2 || tag.length > 4) {
      return NextResponse.json<ApiResponse>({ success: false, error: "Tag must be 2-4 chars" }, { status: 400 });
    }
    if (description && description.length > 100) {
      return NextResponse.json<ApiResponse>({ success: false, error: "Description must be under 100 chars" }, { status: 400 });
    }

    const upperTag = tag.trim().toUpperCase();
    const clanName = name.trim();

    const userRef = db.collection("users").doc(authUser.userId);

    const newClan = await db.runTransaction(async (t) => {
      const userDoc = await t.get(userRef);
      if (!userDoc.exists) throw new Error("User not found");

      const userData = userDoc.data()!;
      if (userData.clanId) {
        throw new Error("You are already in a clan. Leave it first.");
      }

      const gamification: Gamification = userData.gamification;
      if (!gamification || gamification.ghostDust < CLAN_CREATE_COST) {
        throw new Error(`You need ${CLAN_CREATE_COST} Ghost Dust to create a clan.`);
      }

      // Check if tag exists
      const tagQuery = await t.get(db.collection("clans").where("tag", "==", upperTag).limit(1));
      if (!tagQuery.empty) throw new Error(`Tag [${upperTag}] is already taken.`);

      // Check if name exists
      const nameQuery = await t.get(db.collection("clans").where("name", "==", clanName).limit(1));
      if (!nameQuery.empty) throw new Error(`Name ${clanName} is already taken.`);

      // Deduct dust
      gamification.ghostDust -= CLAN_CREATE_COST;
      
      const newClanRef = db.collection("clans").doc();
      const clanData: Clan = {
        id: newClanRef.id,
        name: clanName,
        tag: upperTag,
        description: description?.trim() || "",
        leaderId: authUser.userId,
        members: [authUser.userId],
        clanDust: 0,
        createdAt: new Date().toISOString()
      };

      t.set(newClanRef, clanData);
      t.update(userRef, { 
        gamification,
        clanId: newClanRef.id,
        clanTag: upperTag
      });

      return clanData;
    });

    return NextResponse.json<ApiResponse<Clan>>({ success: true, data: newClan }, { status: 201 });
  } catch (error: any) {
    console.error("Clan create error:", error);
    return NextResponse.json<ApiResponse>({ success: false, error: error.message || "Internal server error" }, { status: 400 });
  }
}
