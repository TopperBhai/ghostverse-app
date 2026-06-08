// GhostVerse — Admin Settings API
import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../../lib/firebase-admin";
import { getAuthUser } from "../../../../lib/auth";
import type { ApiResponse } from "../../../../types";

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser();
    if (!authUser || authUser.role !== "ADMIN") {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Unauthorized: Admins only" },
        { status: 403 }
      );
    }

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

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser();
    if (!authUser || authUser.role !== "ADMIN") {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Unauthorized: Admins only" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { maintenanceMode } = body;

    await db.collection("settings").doc("global").set({ maintenanceMode }, { merge: true });

    return NextResponse.json<ApiResponse>({
      success: true,
      message: "Settings updated successfully",
    });
  } catch (error) {
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
