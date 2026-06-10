"use client";

import { useState, useEffect } from "react";
import { getDailyChaosEvent, type ChaosEvent } from "../../lib/chaos-events";
import { X, Flame } from "lucide-react";

export function DailyChaosBanner() {
  const [event, setEvent] = useState<ChaosEvent | null>(null);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    setEvent(getDailyChaosEvent());
  }, []);

  if (!event || !visible) return null;

  return (
    <div className={`relative w-full border-b border-white/5 bg-gradient-to-r ${event.theme} px-4 py-3 flex items-start sm:items-center justify-between gap-4 animate-fade-in z-40`}>
      <div className="flex items-start sm:items-center gap-3">
        <div className={`w-10 h-10 rounded-xl bg-black/30 border border-white/10 flex items-center justify-center text-xl flex-shrink-0 shadow-inner ${event.color}`}>
          {event.icon}
        </div>
        <div>
          <h3 className="text-sm font-black text-white flex items-center gap-1.5 uppercase tracking-wider">
            <Flame className={`w-4 h-4 ${event.color}`} />
            Today's Chaos: {event.title}
          </h3>
          <p className="text-xs text-ghost-300 font-medium leading-relaxed mt-0.5">
            {event.description}
          </p>
        </div>
      </div>
      
      <button 
        onClick={() => setVisible(false)}
        className="p-1.5 rounded-lg hover:bg-black/20 text-ghost-400 hover:text-white transition-colors flex-shrink-0 mt-1 sm:mt-0"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
