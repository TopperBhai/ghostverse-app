"use client";

import { useTheme } from "../../custom-hooks/use-theme";
import { Sun, Moon } from "lucide-react";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch by waiting until mounted on client
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-10 h-10 rounded-full bg-ghost-900/50 border border-ghost-800/50" />
    );
  }

  return (
    <button
      onClick={toggleTheme}
      className="relative w-10 h-10 rounded-full bg-ghost-900/80 border border-ghost-800 flex items-center justify-center text-ghost-400 hover:text-phantom-400 hover:border-phantom-500/30 hover:shadow-[0_0_15px_rgba(59,130,246,0.15)] transition-all shadow-md active:scale-95 group overflow-hidden cursor-pointer"
      title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
      aria-label="Toggle theme"
    >
      <div className="relative w-5 h-5 flex items-center justify-center">
        {/* Sun Icon */}
        <Sun className={`w-5 h-5 absolute transition-all duration-500 ease-out transform ${
          theme === "dark"
            ? "rotate-0 scale-100 opacity-100"
            : "rotate-90 scale-0 opacity-0"
        }`} />
        {/* Moon Icon */}
        <Moon className={`w-5 h-5 absolute transition-all duration-500 ease-out transform ${
          theme === "light"
            ? "rotate-0 scale-100 opacity-100"
            : "-rotate-90 scale-0 opacity-0"
        }`} />
      </div>
    </button>
  );
}
