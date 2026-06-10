import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../../lib/firebase-admin";
import { getAuthUser } from "../../../../lib/auth";
import { getISTDateString } from "../../../../lib/gamification";
import type { ApiResponse, Gamification } from "../../../../types";

const MISSION_GOALS = {
  hauntsPosted: 1,
  echoesLeft: 3,
  repGiven: 1,
};
const REWARD_DUST = 250;

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userRef = db.collection("users").doc(authUser.userId);

    const result = await db.runTransaction(async (transaction) => {
      const userDoc = await transaction.get(userRef);
      if (!userDoc.exists) return null;

      const data = userDoc.data();
      let gamification: Gamification = data?.gamification;

      if (!gamification || !gamification.dailyMissions) {
        throw new Error("No missions data found. Perform an action first.");
      }

      const missions = gamification.dailyMissions;
      const todayStr = getISTDateString(new Date());

      if (missions.date !== todayStr) {
        throw new Error("Missions expired. Please perform an action to reset.");
      }

      if (missions.claimed) {
        throw new Error("Missions already claimed for today.");
      }

      const isComplete = 
        missions.hauntsPosted >= MISSION_GOALS.hauntsPosted &&
        missions.echoesLeft >= MISSION_GOALS.echoesLeft &&
        missions.repGiven >= MISSION_GOALS.repGiven;

      if (!isComplete) {
        throw new Error("Missions are not complete yet.");
      }

      // Apply reward
      gamification.dailyMissions.claimed = true;
      if (gamification.ghostDust === undefined) gamification.ghostDust = 0;
      gamification.ghostDust += REWARD_DUST;

      transaction.update(userRef, { gamification });
      return gamification;
    });

    if (!result) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse<Gamification>>({
      success: true,
      data: result,
      message: `You claimed ${REWARD_DUST} Ghost Dust!`
    });
  } catch (error: any) {
    console.error("Mission claim error:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: error.message || "Internal server error" },
      { status: 400 }
    );
  }
}
