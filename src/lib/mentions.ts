import { db } from "./firebase-admin";
import { v4 as uuidv4 } from "uuid";

// Extract unique lowercase usernames from a text string
export function extractMentions(text: string): string[] {
  const mentionRegex = /@([a-zA-Z0-9_]+)/g;
  const matches = [...text.matchAll(mentionRegex)];
  const usernames = matches.map(match => match[1].toLowerCase());
  return Array.from(new Set(usernames));
}

export async function notifyMentionedUsers(
  usernames: string[],
  senderId: string,
  senderUsername: string,
  senderDisplayName: string,
  contextUrl: string,
  messagePreview: string
) {
  if (usernames.length === 0) return;

  const batch = db.batch();
  let notificationsCreated = 0;

  for (const username of usernames) {
    // 1. Find user by username
    const userQuery = await db.collection("users")
      .where("username", "==", username)
      .limit(1)
      .get();

    if (userQuery.empty) continue;

    const targetUser = userQuery.docs[0];
    const targetUserId = targetUser.id;

    // Don't notify if user mentions themselves
    if (targetUserId === senderId) continue;

    // 2. Create notification
    const notificationId = uuidv4();
    const notificationRef = db.collection("notifications").doc(notificationId);
    
    batch.set(notificationRef, {
      id: notificationId,
      userId: targetUserId,
      type: "MENTION",
      title: `${senderDisplayName} mentioned you`,
      body: messagePreview.length > 50 ? messagePreview.substring(0, 47) + "..." : messagePreview,
      actionUrl: contextUrl,
      read: false,
      createdAt: new Date().toISOString(),
      metadata: {
        senderId,
        senderUsername
      }
    });
    
    notificationsCreated++;
  }

  if (notificationsCreated > 0) {
    await batch.commit();
  }
}
