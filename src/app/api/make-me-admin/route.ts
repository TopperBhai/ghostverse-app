import { NextResponse } from "next/server";
import { db } from "../../../lib/firebase-admin";
import { getAuthUser, signToken, setAuthCookie } from "../../../lib/auth";

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Not logged in" });
    }

    await db.collection("users").doc(user.userId).update({ role: "ADMIN" });
    
    // Update the JWT cookie so the user doesn't have to log out
    const newToken = await signToken({
      userId: user.userId,
      username: user.username,
      role: "ADMIN"
    });
    await setAuthCookie(newToken);
    
    return NextResponse.json({ 
      success: true, 
      message: `Successfully made ${user.username} an ADMIN. You now have full admin access.`
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message });
  }
}
