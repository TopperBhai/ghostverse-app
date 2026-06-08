import "dotenv/config";
import { db } from "./src/lib/firebase-admin";

async function test() {
  const users = await db.collection("users").get();
  console.log("Total users:", users.size);
  users.forEach(doc => {
    console.log(doc.id, "=>", doc.data().username);
  });
}

test().catch(console.error);
