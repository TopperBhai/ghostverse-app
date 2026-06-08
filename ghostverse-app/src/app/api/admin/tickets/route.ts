// GhostVerse — Admin Tickets API
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

    const snapshot = await db.collection("tickets").orderBy("createdAt", "desc").get();
    const tickets = snapshot.docs.map(doc => doc.data());

    return NextResponse.json<ApiResponse>({
      success: true,
      data: tickets,
    });
  } catch (error) {
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const authUser = await getAuthUser();
    if (!authUser || authUser.role !== "ADMIN") {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Unauthorized: Admins only" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { ticketId, reply, action } = body;

    if (!ticketId || !action) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "ticketId and action are required" },
        { status: 400 }
      );
    }

    const updates: any = { status: action };
    if (reply !== undefined) {
      updates.reply = reply;
    }

    await db.collection("tickets").doc(ticketId).update(updates);

    return NextResponse.json<ApiResponse>({
      success: true,
      message: "Ticket updated successfully",
    });
  } catch (error) {
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
