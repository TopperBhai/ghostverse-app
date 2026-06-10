// GhostVerse — Public Settings API
import { NextResponse } from "next/server";
import { db } from "../../../lib/firebase-admin";
import type { ApiResponse } from "../../../types";

export async function GET() {
  try {
    const settingsDoc = await db.collection("settings").doc("global").get();
    let data = { maintenanceMode: false };
    if (settingsDoc.exists) {
      data = settingsDoc.data() as any;
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data,
    });
  } catch (error) {
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
