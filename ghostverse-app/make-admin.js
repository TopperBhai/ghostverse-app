const admin = require("firebase-admin");
const serviceAccount = require("./firebase.json");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function makeAdmin(username) {
  try {
    const snapshot = await db.collection("users").where("username", "==", username.toLowerCase()).get();
    if (snapshot.empty) {
      console.log("User not found!");
      return;
    }
    const doc = snapshot.docs[0];
    await doc.ref.update({ role: "ADMIN" });
    console.log(`Successfully made ${username} an ADMIN!`);
  } catch (error) {
    console.error("Error:", error);
  }
}

// Assuming the user's username is 'danny01' from the screenshot!
makeAdmin("danny01");
