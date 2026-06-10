import { Crown, Sun, Flame, Star, Orbit, Sparkles, LucideIcon } from "lucide-react";

interface CosmeticHatProps {
  value: string | null | undefined;
  className?: string;
}

const ICON_MAP: Record<string, LucideIcon> = {
  "👑": Crown,
  "crown": Crown,
  "😇": Sun,
  "halo": Sun,
  "😈": Flame,
  "demon-horns": Flame,
  "🤠": Star,
  "cowboy": Star,
  "👽": Orbit,
  "alien": Orbit,
  "wizard-hat": Sparkles,
};

export function CosmeticHat({ value, className = "w-6 h-6 text-yellow-400" }: CosmeticHatProps) {
  if (!value) return null;

  const IconComponent = ICON_MAP[value];

  if (IconComponent) {
    return <IconComponent className={className} />;
  }

  // Fallback if not an icon (e.g., if it's still an unrecognized emoji)
  return <span className={className}>{value}</span>;
}
