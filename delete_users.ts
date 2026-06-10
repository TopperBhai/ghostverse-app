import "dotenv/config";
import { db } from "./src/lib/firebase-admin";

async function deleteAll() {
  console.log("Starting deletion of fake accounts...");

  // Delete users
  const usersSnapshot = await db.collection("users").get();
  let deletedUsers = 0;
  for (const doc of usersSnapshot.docs) {
    await doc.ref.collection("data").doc("profile").delete();
    await doc.ref.delete();
    deletedUsers++;
  }
  console.log(`Deleted ${deletedUsers} users.`);

  // Delete friendships
  const friendshipsSnapshot = await db.collection("friendships").get();
  let deletedFriendships = 0;
  for (const doc of friendshipsSnapshot.docs) {
    await doc.ref.delete();
    deletedFriendships++;
  }
  console.log(`Deleted ${deletedFriendships} friendships.`);

  // Delete world chat
  const worldChatSnapshot = await db.collection("world_chat").get();
  let deletedMessages = 0;
  for (const doc of worldChatSnapshot.docs) {
    await doc.ref.delete();
    deletedMessages++;
  }
  console.log(`Deleted ${deletedMessages} world chat messages.`);

  console.log("All fake data deleted successfully.");
}

deleteAll()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
