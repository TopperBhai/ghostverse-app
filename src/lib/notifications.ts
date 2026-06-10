import { db } from "./firebase-admin";

export async function sendPushNotification(
  userId: string,
  title: string,
  body: string,
  url: string = "/",
  imageUrl?: string
) {
  try {
    const userDoc = await db.collection("users").doc(userId).get();
    const userData = userDoc.data();

    if (!userData || !userData.fcmTokens || !Array.isArray(userData.fcmTokens) || userData.fcmTokens.length === 0) {
      return false; // User has no registered devices
    }

    const tokens = userData.fcmTokens;

    const { getMessaging } = require('firebase-admin/messaging');
    const message = {
      notification: {
        title,
        body,
        ...(imageUrl && { imageUrl }),
      },
      data: {
        url, // The URL to open when notification is clicked
      },
      tokens: tokens,
    };

    const response = await getMessaging().sendEachForMulticast(message);
    
    // Optional: Clean up invalid tokens from the array here using response details
    if (response.failureCount > 0) {
      // Clean up logic...
    }

    return response.successCount > 0;
  } catch (error) {
    console.error(`Failed to send push notification to user ${userId}:`, error);
    return false;
  }
}
