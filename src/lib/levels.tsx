export interface GhostLevel {
  title: string;
  color: string;
  gradient: string;
  dotColor: string;
  badge: React.ReactNode;
}

export function getGhostLevel(reputation: number): GhostLevel {
  if (reputation >= 1000) {
    return {
      title: "Ghost King",
      color: "text-rose-400",
      gradient: "from-rose-500 to-orange-400",
      dotColor: "bg-rose-400",
      badge: (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border"
          style={{ background: "linear-gradient(135deg, rgba(244,63,94,0.15), rgba(251,146,60,0.15))", borderColor: "rgba(244,63,94,0.4)", color: "#fb7185" }}>
          <span className="w-1.5 h-1.5 rounded-full bg-rose-400 inline-block" />
          Ghost King
        </span>
      ),
    };
  }
  if (reputation >= 500) {
    return {
      title: "Spectral Knight",
      color: "text-amber-400",
      gradient: "from-amber-400 to-yellow-300",
      dotColor: "bg-amber-400",
      badge: (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border"
          style={{ background: "linear-gradient(135deg, rgba(251,191,36,0.15), rgba(234,179,8,0.15))", borderColor: "rgba(251,191,36,0.4)", color: "#fbbf24" }}>
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
          Spectral Knight
        </span>
      ),
    };
  }
  if (reputation >= 200) {
    return {
      title: "Banshee",
      color: "text-orange-400",
      gradient: "from-orange-500 to-red-400",
      dotColor: "bg-orange-400",
      badge: (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border"
          style={{ background: "linear-gradient(135deg, rgba(249,115,22,0.15), rgba(239,68,68,0.15))", borderColor: "rgba(249,115,22,0.4)", color: "#fb923c" }}>
          <span className="w-1.5 h-1.5 rounded-full bg-orange-400 inline-block" />
          Banshee
        </span>
      ),
    };
  }
  if (reputation >= 50) {
    return {
      title: "Wraith",
      color: "text-fuchsia-400",
      gradient: "from-fuchsia-500 to-purple-400",
      dotColor: "bg-fuchsia-400",
      badge: (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border"
          style={{ background: "linear-gradient(135deg, rgba(232,121,249,0.15), rgba(168,85,247,0.15))", borderColor: "rgba(232,121,249,0.4)", color: "#e879f9" }}>
          <span className="w-1.5 h-1.5 rounded-full bg-fuchsia-400 inline-block" />
          Wraith
        </span>
      ),
    };
  }
  if (reputation >= 10) {
    return {
      title: "Phantom",
      color: "text-blue-400",
      gradient: "from-blue-500 to-cyan-400",
      dotColor: "bg-blue-400",
      badge: (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border"
          style={{ background: "linear-gradient(135deg, rgba(96,165,250,0.15), rgba(34,211,238,0.15))", borderColor: "rgba(96,165,250,0.4)", color: "#60a5fa" }}>
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 inline-block" />
          Phantom
        </span>
      ),
    };
  }
  return {
    title: "Novice",
    color: "text-ghost-400",
    gradient: "from-ghost-500 to-ghost-400",
    dotColor: "bg-ghost-500",
    badge: null, // No badge for novices to keep it clean
  };
}
