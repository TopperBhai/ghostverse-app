export interface GhostLevel {
  title: string;
  color: string;
  badgeIcon?: string;
}

export function getGhostLevel(reputation: number): GhostLevel {
  if (reputation >= 1000) {
    return { title: "Ghost King", color: "text-neon-red", badgeIcon: "👑" };
  }
  if (reputation >= 500) {
    return { title: "Spectral Knight", color: "text-yellow-400", badgeIcon: "⚔️" };
  }
  if (reputation >= 200) {
    return { title: "Banshee", color: "text-orange-400", badgeIcon: "🔥" };
  }
  if (reputation >= 50) {
    return { title: "Wraith", color: "text-fuchsia-400", badgeIcon: "🔮" };
  }
  if (reputation >= 10) {
    return { title: "Phantom", color: "text-blue-400", badgeIcon: "👻" };
  }
  return { title: "Novice Ghost", color: "text-ghost-400", badgeIcon: "⬜" };
}
