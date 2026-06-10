import React from "react";
import { CosmeticHat } from "./CosmeticHat";
import { GhostCosmetics } from "../../types";

interface UserAvatarProps {
  avatarUrl: string | null | undefined;
  displayName: string;
  cosmetics?: GhostCosmetics | null;
  size?: string; // Tailwind width and height class (e.g., "w-10 h-10")
  className?: string; // Additional classes for the wrapper
  showHat?: boolean;
  showAura?: boolean;
}

export function UserAvatar({
  avatarUrl,
  displayName,
  cosmetics,
  size = "w-10 h-10",
  className = "",
  showHat = true,
  showAura = true,
}: UserAvatarProps) {
  const activeAura = showAura && cosmetics?.activeAura ? cosmetics.activeAura : "";
  const activeHat = showHat && cosmetics?.activeHat ? cosmetics.activeHat : null;

  return (
    <div className={`relative flex items-center justify-center shrink-0 ${size} ${className}`}>
      {/* Active Hat */}
      {activeHat && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-20 drop-shadow-md pointer-events-none">
          <CosmeticHat value={activeHat} className="w-[1.2em] h-[1.2em] text-yellow-400" />
        </div>
      )}

      {/* Avatar Wrapper with Aura */}
      <div
        className={`w-full h-full rounded-full border border-ghost-800 bg-ghost-900 flex items-center justify-center text-sm font-bold text-ghost-400 shadow-sm relative z-10 ${activeAura}`}
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={displayName}
            className="w-full h-full rounded-full object-cover"
          />
        ) : (
          <span className="gradient-text">{displayName?.charAt(0).toUpperCase() || "?"}</span>
        )}
      </div>
    </div>
  );
}
