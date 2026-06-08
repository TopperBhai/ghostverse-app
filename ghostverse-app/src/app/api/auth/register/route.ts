// GhostVerse — Register API (Firebase)
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";
import { signToken, setAuthCookie } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import type { ApiResponse } from "@/types";
import type { UserRole } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { password, username, displayName } = body;

    if (!password || !username || !displayName) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    const lowercaseUsername = username.toLowerCase();
    
    // Check if username is taken (requires querying all users)
    const usernameQuery = await db.collection("users").where("username", "==", lowercaseUsername).limit(1).get();
    if (!usernameQuery.empty) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Username is already taken" },
        { status: 409 }
      );
    }



    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Is this the first user? If so, make them admin
    const allUsers = await db.collection("users").limit(1).get();
    const isFirstUser = allUsers.empty;

    const userId = uuidv4();
    const now = new Date().toISOString();

    const newUser = {
      id: userId,
      username: lowercaseUsername,
      displayName,
      passwordHash,
      role: isFirstUser ? "ADMIN" : "USER",
      status: "ACTIVE",
      createdAt: now,
      lastSeen: now,
    };

    // Create user in Firestore
    await db.collection("users").doc(userId).set(newUser);
    
    // Create initial empty profile
    await db.collection("users").doc(userId).collection("data").doc("profile").set({
      reputationScore: 0,
      interests: [],
    });

    // Create JWT payload
    const payload = {
      userId: newUser.id,
      username: newUser.username,
      role: newUser.role as UserRole,
    };

    const token = await signToken(payload);

    // Set HTTP-only cookie
    await setAuthCookie(token);

    return NextResponse.json<ApiResponse>(
      { success: true, data: { user: newUser }, message: "Registration successful" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
