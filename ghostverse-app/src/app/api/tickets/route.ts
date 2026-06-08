// GhostVerse — User Tickets API
import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../lib/firebase-admin";
import { getAuthUser } from "../../../lib/auth";
import type { ApiResponse } from "../../../types";
import { v4 as uuidv4 } from "uuid";

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { subject, description } = body;

    if (!subject || !description) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Subject and description are required" },
        { status: 400 }
      );
    }

    const ticketId = uuidv4();
    const ticketData = {
      id: ticketId,
      userId: authUser.userId,
      username: authUser.username,
      subject,
      description,
      status: "OPEN",
      reply: null,
      createdAt: new Date().toISOString(),
    };

    await db.collection("tickets").doc(ticketId).set(ticketData);

    return NextResponse.json<ApiResponse>({
      success: true,
      message: "Ticket submitted successfully",
      data: ticketData,
    });
  } catch (error) {
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
