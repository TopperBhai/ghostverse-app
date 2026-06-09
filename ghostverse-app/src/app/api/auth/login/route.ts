// GhostVerse — Login API (Firebase)
import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../../lib/firebase-admin";
import { signToken, setAuthCookie } from "../../../../lib/auth";
import bcrypt from "bcryptjs";
import { rateLimit } from "../../../../lib/rate-limit";
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
    
    // Rate Limiting: Max 20 login attempts per 15 minutes per IP
    const isAllowed = rateLimit(request, 20, 15 * 60 * 1000);
    if (!isAllowed) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Too many login attempts. Please try again later." },
        { status: 429 }
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

    // Account Lockout Check
    const now = Date.now();
    if (user.lockUntil && user.lockUntil > now) {
      const minutesLeft = Math.ceil((user.lockUntil - now) / 60000);
      return NextResponse.json<ApiResponse>(
        { success: false, error: `Account locked due to too many failed attempts. Try again in ${minutesLeft} minutes.` },
        { status: 423 } // 423 Locked
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      // Increment failed login attempts
      const failedAttempts = (user.failedLoginAttempts || 0) + 1;
      const updates: any = { failedLoginAttempts: failedAttempts };
      
      // If 5 or more failed attempts, lock for 15 minutes
      if (failedAttempts >= 5) {
        updates.lockUntil = now + 15 * 60 * 1000;
        updates.failedLoginAttempts = 0; // Reset attempts after lock
      }
      
      await userDoc.ref.update(updates);

      return NextResponse.json<ApiResponse>(
        { success: false, error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Update last seen and reset failed attempts on successful login
    await userDoc.ref.update({
      lastSeen: new Date().toISOString(),
      failedLoginAttempts: 0,
      lockUntil: null
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
