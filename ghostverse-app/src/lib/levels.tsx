import { Crown, Swords, Flame, Sparkles, Ghost, CircleDot } from "lucide-react";

export interface GhostLevel {
  title: string;
  color: string;
  badgeIcon: React.ReactNode;
}

export function getGhostLevel(reputation: number): GhostLevel {
  const iconProps = { className: "w-3.5 h-3.5" };
  
  if (reputation >= 1000) {
    return { title: "Ghost King", color: "text-neon-red", badgeIcon: <Crown {...iconProps} /> };
  }
  if (reputation >= 500) {
    return { title: "Spectral Knight", color: "text-yellow-400", badgeIcon: <Swords {...iconProps} /> };
  }
  if (reputation >= 200) {
    return { title: "Banshee", color: "text-orange-400", badgeIcon: <Flame {...iconProps} /> };
  }
  if (reputation >= 50) {
    return { title: "Wraith", color: "text-fuchsia-400", badgeIcon: <Sparkles {...iconProps} /> };
  }
  if (reputation >= 10) {
    return { title: "Phantom", color: "text-blue-400", badgeIcon: <Ghost {...iconProps} /> };
  }
  return { title: "Novice Ghost", color: "text-ghost-400", badgeIcon: <CircleDot {...iconProps} /> };
}
