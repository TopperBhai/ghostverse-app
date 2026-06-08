import { NextResponse } from "next/server";
import { db } from "../../../lib/firebase-admin";
import { getAuthUser } from "../../../lib/auth";

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Not logged in" });
    }

    await db.collection("users").doc(user.userId).update({ role: "ADMIN" });
    
    return NextResponse.json({ 
      success: true, 
      message: `Successfully made ${user.username} an ADMIN. Please log out and log back in to get your new Admin token!`
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message });
  }
}
