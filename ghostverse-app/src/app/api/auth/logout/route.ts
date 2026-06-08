// GhostVerse — Logout API
import { NextResponse } from "next/server";
import type { ApiResponse } from "@/types";

export async function POST() {
  const response = NextResponse.json<ApiResponse>({
    success: true,
    message: "Logged out successfully",
  });

  // Clear the cookie
  response.cookies.delete("ghostverse-token");

  return response;
}
