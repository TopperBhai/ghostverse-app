// GhostVerse — Login API (Firebase)
import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../../lib/firebase-admin";
import { signToken, setAuthCookie } from "../../../../lib/auth";
import bcrypt from "bcryptjs";
import type { ApiResponse } from "../../../../types";

export async function POST(request: NextRequest) {
  try {
    let body;
    try {
      body = await request.json();
    } catch (e) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Invalid JSON payload" },
        { status: 400 }
      );
    }
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Username and password are required" },
        { status: 400 }
      );
    }

    // Find user by username
    const usersRef = db.collection("users");
    const snapshot = await usersRef.where("username", "==", username.toLowerCase()).limit(1).get();

    if (snapshot.empty) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const userDoc = snapshot.docs[0];
    const user = userDoc.data() as any;

    if (user.status === "BANNED") {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "This account has been banned" },
        { status: 403 }
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Update last seen
    await userDoc.ref.update({
      lastSeen: new Date().toISOString()
    });

    // Create JWT
    const payload = {
      userId: user.id,
      username: user.username,
      role: user.role,
    };

    const token = await signToken(payload);

    // Set HTTP-only cookie robustly
    await setAuthCookie(token);

    // Avoid sending password hash to client
    const safeUser = { ...user };
    delete safeUser.passwordHash;

    return NextResponse.json<ApiResponse>({
      success: true,
      data: { user: safeUser },
      message: "Login successful",
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
