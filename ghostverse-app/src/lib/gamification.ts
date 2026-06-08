import { db } from "./firebase-admin";
import type { Gamification, PetStatus } from "../types";

const XP_PER_HAUNT = 50;
const XP_PER_CHAT = 10;
const XP_PER_REP_RECEIVED = 100;
const XP_PER_LEVEL = 500; // E.g., Level 2 requires 500 XP, Level 3 requires 1000 XP, etc.

export function calculatePetLevel(xp: number): number {
  return Math.floor(xp / XP_PER_LEVEL) + 1;
}

export function determinePetStatus(streak: number, lastActiveAt: Date | null): PetStatus {
  if (!lastActiveAt) return "HAPPY";

  const now = new Date();
  const diffHours = (now.getTime() - new Date(lastActiveAt).getTime()) / (1000 * 60 * 60);

  if (diffHours > 48 || streak === 0) return "FADED";
  if (diffHours > 24) return "HUNGRY";
  if (streak >= 7) return "RADIANT";
  return "HAPPY";
}

/**
 * Updates a user's gamification stats (streak, pet xp, level).
 * @param userId The user's ID
 * @param action "HAUNT" | "CHAT" | "REP"
 */
export async function updateGamification(userId: string, action: "HAUNT" | "CHAT" | "REP") {
  const userRef = db.collection("users").doc(userId);

  await db.runTransaction(async (transaction) => {
    const userDoc = await transaction.get(userRef);
    if (!userDoc.exists) return;

    const data = userDoc.data();
    let gamification: Gamification = data?.gamification || {
      hauntStreak: 0,
      lastActiveAt: null,
      pet: { level: 1, xp: 0, status: "HAPPY" }
    };

    const now = new Date();
    const lastActive = gamification.lastActiveAt ? new Date(gamification.lastActiveAt) : null;
    
    let isNewDay = false;
    let streakBroken = false;

    if (lastActive) {
      const msDiff = now.getTime() - lastActive.getTime();
      const hoursDiff = msDiff / (1000 * 60 * 60);
      
      // If action is HAUNT or CHAT, it affects the streak
      if (action === "HAUNT" || action === "CHAT") {
        if (hoursDiff >= 24 && hoursDiff < 48) {
          isNewDay = true;
        } else if (hoursDiff >= 48) {
          streakBroken = true;
          isNewDay = true; // Still a new active day, just broke previous streak
        }
      }
    } else {
      isNewDay = true;
    }

    // Update Streak
    if (action === "HAUNT" || action === "CHAT") {
      if (streakBroken) {
        gamification.hauntStreak = 1;
      } else if (isNewDay) {
        gamification.hauntStreak += 1;
      } else if (gamification.hauntStreak === 0) {
        gamification.hauntStreak = 1;
      }
      gamification.lastActiveAt = now.toISOString();
    }

    // Add XP
    let xpToAdd = 0;
    if (action === "HAUNT") xpToAdd = XP_PER_HAUNT;
    if (action === "CHAT") xpToAdd = XP_PER_CHAT;
    if (action === "REP") xpToAdd = XP_PER_REP_RECEIVED;

    // Apply XP to Pet
    gamification.pet.xp += xpToAdd;
    gamification.pet.level = calculatePetLevel(gamification.pet.xp);
    gamification.pet.status = determinePetStatus(gamification.hauntStreak, now); // Update status instantly

    transaction.update(userRef, { gamification });
  });
}
