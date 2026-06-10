import { db } from "./firebase-admin";
import type { Gamification, PetStatus } from "../types";

const XP_PER_HAUNT = 50;
const XP_PER_CHAT = 10;
const XP_PER_REP_RECEIVED = 100;
const XP_PER_LEVEL = 500; // E.g., Level 2 requires 500 XP, Level 3 requires 1000 XP, etc.

export function calculatePetLevel(xp: number): number {
  return Math.floor(xp / XP_PER_LEVEL) + 1;
}

export function getISTDateString(date: Date | string | number) {
  const d = new Date(date);
  d.setMinutes(d.getMinutes() + 330);
  return d.toISOString().split("T")[0];
}

export function determinePetStatus(streak: number, lastActiveAt: Date | null): PetStatus {
  if (!lastActiveAt) return "HAPPY";

  const now = new Date();
  const diffHours = (now.getTime() - new Date(lastActiveAt).getTime()) / (1000 * 60 * 60);

  if (diffHours > 48 || streak === 0) return "FADED";
  if (diffHours > 24) return "HUNGRY";
  if (streak >= 100) return "CELESTIAL";
  if (streak >= 30) return "BLAZING";
  if (streak >= 7) return "RADIANT";
  return "HAPPY";
}

/**
 * Updates a user's gamification stats (streak, pet xp, level, daily missions).
 * @param userId The user's ID
 * @param action "HAUNT" | "CHAT" | "REP" | "ECHO" | "GIVE_REP"
 */
export async function updateGamification(userId: string, action: "HAUNT" | "CHAT" | "REP" | "ECHO" | "GIVE_REP") {
  const userRef = db.collection("users").doc(userId);

  await db.runTransaction(async (transaction) => {
    const userDoc = await transaction.get(userRef);
    if (!userDoc.exists) return;

    const data = userDoc.data();
    let gamification: Gamification = data?.gamification || {
      hauntStreak: 0,
      lastActiveAt: null,
      pet: { level: 1, xp: 0, status: "HAPPY" },
      ghostDust: 0,
      dailyMissions: { date: getISTDateString(new Date()), hauntsPosted: 0, echoesLeft: 0, repGiven: 0, claimed: false }
    };

    // Ensure ghostDust exists for legacy users
    if (gamification.ghostDust === undefined) gamification.ghostDust = 0;
    
    const now = new Date();
    const todayStr = getISTDateString(now);

    // Reset Daily Missions if it's a new day
    if (!gamification.dailyMissions || gamification.dailyMissions.date !== todayStr) {
      gamification.dailyMissions = {
        date: todayStr,
        hauntsPosted: 0,
        echoesLeft: 0,
        repGiven: 0,
        claimed: false
      };
    }

    const lastActive = gamification.lastActiveAt ? new Date(gamification.lastActiveAt) : null;
    
    let isNewDay = false;
    let streakBroken = false;

    if (lastActive) {
      const todayStr = getISTDateString(now);
      const lastActiveStr = getISTDateString(lastActive);
      
      if (todayStr !== lastActiveStr) {
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = getISTDateString(yesterday);

        if (lastActiveStr === yesterdayStr) {
          isNewDay = true; // It was yesterday
        } else {
          streakBroken = true; // More than 1 day ago
          isNewDay = true;
        }
      }
    } else {
      isNewDay = true;
    }

    // Update Streak
    if (action === "HAUNT" || action === "CHAT" || action === "ECHO") {
      if (streakBroken) {
        gamification.hauntStreak = 1;
      } else if (isNewDay) {
        gamification.hauntStreak += 1;
      } else if (gamification.hauntStreak === 0) {
        gamification.hauntStreak = 1;
      }
      gamification.lastActiveAt = now.toISOString();
    }

    // Update Missions
    if (action === "HAUNT") gamification.dailyMissions.hauntsPosted += 1;
    if (action === "ECHO") gamification.dailyMissions.echoesLeft += 1;
    if (action === "GIVE_REP") gamification.dailyMissions.repGiven += 1;

    // Add XP
    let xpToAdd = 0;
    if (action === "HAUNT") xpToAdd = XP_PER_HAUNT;
    if (action === "CHAT") xpToAdd = XP_PER_CHAT;
    if (action === "ECHO") xpToAdd = XP_PER_CHAT; // Echo counts as chat XP
    if (action === "REP") xpToAdd = XP_PER_REP_RECEIVED;

    // Apply XP to Pet
    gamification.pet.xp += xpToAdd;
    gamification.pet.level = calculatePetLevel(gamification.pet.xp);
    gamification.pet.status = determinePetStatus(gamification.hauntStreak, now); // Update status instantly

    transaction.update(userRef, { gamification });
  });
}

/**
 * Evaluates streak on app open (called by auth/me).
 */
export async function evaluateStreakOnLogin(userId: string) {
  // We can just call updateGamification with a mock action, or create a specific login action
  // To keep it simple, we'll create an "APP_OPEN" action or just use HAUNT logic.
  // Wait, I will just call updateGamification(userId, "LOGIN" as any) but avoid adding XP.
  // Let's just write the transaction directly here to be clean.
  const userRef = db.collection("users").doc(userId);

  await db.runTransaction(async (transaction) => {
    const userDoc = await transaction.get(userRef);
    if (!userDoc.exists) return;

    const data = userDoc.data();
    let gamification: Gamification = data?.gamification || {
      hauntStreak: 0,
      lastActiveAt: null,
      pet: { level: 1, xp: 0, status: "HAPPY" },
      ghostDust: 0,
      dailyMissions: { date: getISTDateString(new Date()), hauntsPosted: 0, echoesLeft: 0, repGiven: 0, claimed: false }
    };

    // Ensure ghostDust exists for legacy users
    if (gamification.ghostDust === undefined) gamification.ghostDust = 0;
    
    const now = new Date();
    const todayStr = getISTDateString(now);
    let modified = false;

    // Reset Daily Missions if it's a new day
    if (!gamification.dailyMissions || gamification.dailyMissions.date !== todayStr) {
      gamification.dailyMissions = {
        date: todayStr,
        hauntsPosted: 0,
        echoesLeft: 0,
        repGiven: 0,
        claimed: false
      };
      modified = true;
    }

    const lastActive = gamification.lastActiveAt ? new Date(gamification.lastActiveAt) : null;

    if (lastActive) {
      const todayStr = getISTDateString(now);
      const lastActiveStr = getISTDateString(lastActive);
      
      if (todayStr !== lastActiveStr) {
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = getISTDateString(yesterday);

        if (lastActiveStr === yesterdayStr) {
          gamification.hauntStreak += 1;
        } else {
          gamification.hauntStreak = 1;
        }
        gamification.lastActiveAt = now.toISOString();
        modified = true;
      }
    } else {
      gamification.hauntStreak = 1;
      gamification.lastActiveAt = now.toISOString();
      modified = true;
    }

    if (modified) {
      gamification.pet.status = determinePetStatus(gamification.hauntStreak, now);
      transaction.update(userRef, { gamification });
    }
  });
}
