import "dotenv/config";
import { db } from "./src/lib/firebase-admin";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";

async function testRegisterAndLogin() {
  const username = "test_login_bug_" + Date.now();
  const password = "TestPassword123";

  // Register
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  const newUser = {
    id: uuidv4(),
    username,
    displayName: "Test User",
    passwordHash,
    role: "USER",
    status: "ACTIVE",
    createdAt: new Date().toISOString(),
    lastSeen: new Date().toISOString(),
  };

  await db.collection("users").doc(newUser.id).set(newUser);
  console.log("Registered user:", username);

  // Login
  const snapshot = await db.collection("users").where("username", "==", username).limit(1).get();
  const user = snapshot.docs[0].data();
  
  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  console.log("Login valid?:", isPasswordValid);
}

testRegisterAndLogin().catch(console.error);
