// GhostVerse — Streak System Utilities

export interface StreakInfo {
  count: number;
  emoji: string;
  label: string;
  level: number;
}

export function getStreakInfo(count: number): StreakInfo {
  if (count >= 30) {
    return { count, emoji: "🔥🔥🔥", label: "Inferno", level: 3 };
  }
  if (count >= 7) {
    return { count, emoji: "🔥🔥", label: "On Fire", level: 2 };
  }
  if (count >= 1) {
    return { count, emoji: "🔥", label: "Warming Up", level: 1 };
  }
  return { count: 0, emoji: "❄️", label: "No Streak", level: 0 };
}

export function getStreakBadgeColor(level: number): string {
  switch (level) {
    case 3: return "#EF4444"; // Red
    case 2: return "#F97316"; // Orange
    case 1: return "#F59E0B"; // Amber
    default: return "#64748B"; // Slate
  }
}

export function isStreakActive(lastChatDate: Date): boolean {
  const now = new Date();
  const diff = now.getTime() - lastChatDate.getTime();
  const hoursDiff = diff / (1000 * 60 * 60);
  // Streak is active if last chat was within 48 hours (some grace)
  return hoursDiff <= 48;
}

export function shouldIncrementStreak(lastChatDate: Date): boolean {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const lastDate = new Date(
    lastChatDate.getFullYear(),
    lastChatDate.getMonth(),
    lastChatDate.getDate()
  );
  // Different calendar day
  return today.getTime() !== lastDate.getTime();
}

export const STREAK_MILESTONES = [
  { day: 1, emoji: "🔥", reward: "First spark!" },
  { day: 3, emoji: "🔥", reward: "Getting warmer!" },
  { day: 7, emoji: "🔥🔥", reward: "One week streak!" },
  { day: 14, emoji: "🔥🔥", reward: "Two weeks strong!" },
  { day: 30, emoji: "🔥🔥🔥", reward: "Monthly legend!" },
  { day: 60, emoji: "🔥🔥🔥", reward: "Two month titan!" },
  { day: 100, emoji: "💎", reward: "Century streak!" },
  { day: 365, emoji: "👑", reward: "Year-long legend!" },
];
