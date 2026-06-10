"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../../custom-hooks/use-auth";
import { GhostPet } from "../../components/GhostPet";
import { Ghost, Shield, Zap, Check, Lock, Star } from "lucide-react";

interface ShopItem {
  id: string;
  name: string;
  type: "hat" | "aura";
  price: number;
  icon: string;
  color: string;
}

const SHOP_ITEMS: ShopItem[] = [
  { id: "neon-green", name: "Neon Glow", type: "aura", price: 50, icon: "✨", color: "bg-green-500/20 text-green-400 border-green-500/30" },
  { id: "infernal-red", name: "Infernal Aura", type: "aura", price: 150, icon: "🔥", color: "bg-red-500/20 text-red-400 border-red-500/30" },
  { id: "void-purple", name: "Void Energy", type: "aura", price: 300, icon: "🌌", color: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
  { id: "golden-halo", name: "Golden Halo", type: "aura", price: 500, icon: "😇", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
  
  { id: "halo", name: "Halo Ring", type: "hat", price: 100, icon: "⭕", color: "bg-yellow-500/10 text-yellow-200 border-yellow-500/20" },
  { id: "wizard-hat", name: "Wizard Hat", type: "hat", price: 200, icon: "🧙‍♂️", color: "bg-indigo-500/10 text-indigo-300 border-indigo-500/30" },
  { id: "demon-horns", name: "Demon Horns", type: "hat", price: 350, icon: "😈", color: "bg-red-900/30 text-red-400 border-red-900/50" },
  { id: "crown", name: "King's Crown", type: "hat", price: 1000, icon: "👑", color: "bg-amber-500/20 text-amber-400 border-amber-500/40" },
  { id: "cowboy", name: "Cowboy Hat", type: "hat", price: 250, icon: "🤠", color: "bg-amber-900/20 text-amber-600 border-amber-900/40" },
];

export default function SoulShopPage() {
  const { user, refreshUser } = useAuth();
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  
  // Local state for instant preview without waiting for API
  const [previewAura, setPreviewAura] = useState<string | null>(null);
  const [previewHat, setPreviewHat] = useState<string | null>(null);

  useEffect(() => {
    if (user?.cosmetics) {
      setPreviewAura(user.cosmetics.activeAura || null);
      setPreviewHat(user.cosmetics.activeHat || null);
    }
  }, [user]);

  if (!user) return null;

  const rep = user.profile?.reputationScore || 0;
  const cosmetics = user.cosmetics || { activeHat: null, activeAura: null, unlockedItems: [] };
  const unlocked = cosmetics.unlockedItems || [];

  const handleAction = async (item: ShopItem) => {
    const isUnlocked = unlocked.includes(item.id);
    const action = isUnlocked ? "equip" : "buy";
    
    // Prevent buying if not enough rep
    if (action === "buy" && rep < item.price) return;

    setLoadingAction(item.id);
    try {
      const res = await fetch("/api/shop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId: item.id, type: item.type, action })
      });
      const data = await res.json();
      if (data.success) {
        if (action === "equip") {
          if (item.type === "aura") setPreviewAura(item.id);
          if (item.type === "hat") setPreviewHat(item.id);
        }
        await refreshUser();
      } else {
        alert(data.error);
      }
    } catch (err) {
      alert("Something went wrong");
    } finally {
      setLoadingAction(null);
    }
  };

  const handleUnequip = async (type: "hat" | "aura") => {
    setLoadingAction(`unequip-${type}`);
    try {
      const res = await fetch("/api/shop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, action: "unequip" })
      });
      const data = await res.json();
      if (data.success) {
        if (type === "aura") setPreviewAura(null);
        if (type === "hat") setPreviewHat(null);
        await refreshUser();
      }
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Header */}
      <div className="glass-nav px-6 py-8 relative overflow-hidden flex-shrink-0">
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-phantom-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Ghost className="w-8 h-8 text-phantom-400" />
              <h1 className="text-3xl font-black text-white tracking-tight drop-shadow-md">The Soul Shop</h1>
            </div>
            <p className="text-ghost-300 max-w-md text-sm leading-relaxed">
              Spend your hard-earned Reputation Points to customize your Ghost Pet with exclusive Auras and Hats. Stand out in the World Chat!
            </p>
          </div>

          <div className="glass-card p-4 flex items-center gap-4 border border-phantom-500/30 bg-phantom-500/5 w-full md:w-auto">
            <div className="w-12 h-12 rounded-xl bg-phantom-500/20 flex items-center justify-center border border-phantom-400/40">
              <Star className="w-6 h-6 text-phantom-300" />
            </div>
            <div>
              <p className="text-xs font-bold text-phantom-400 tracking-wider uppercase">Your Balance</p>
              <p className="text-2xl font-black text-white">{rep} <span className="text-sm font-medium text-ghost-400">Rep</span></p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 flex-1 flex flex-col lg:flex-row gap-8 max-w-7xl mx-auto w-full">
        {/* Left Col: Preview */}
        <div className="w-full lg:w-80 flex-shrink-0 flex flex-col gap-4">
          <div className="glass-card p-8 flex flex-col items-center justify-center aspect-square relative overflow-hidden border border-white/10 group">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-ghost-900/50 pointer-events-none" />
            
            <div className="relative z-10">
              <GhostPet 
                status={user.gamification?.pet?.status || "HAPPY"} 
                level={user.gamification?.pet?.level || 1} 
                size="xl" 
                aura={previewAura}
                hat={previewHat}
              />
            </div>
            
            <div className="absolute bottom-4 left-0 right-0 text-center z-10">
              <p className="text-sm font-bold text-ghost-100">{user.displayName}'s Ghost</p>
              <p className="text-[10px] text-ghost-400 uppercase tracking-widest mt-0.5">Lv. {user.gamification?.pet?.level || 1}</p>
            </div>
          </div>

          <div className="flex gap-2">
            <button 
              disabled={!previewAura || loadingAction === "unequip-aura"}
              onClick={() => handleUnequip("aura")}
              className="flex-1 py-2 text-xs font-semibold rounded-lg bg-ghost-900 border border-white/5 text-ghost-400 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-50"
            >
              Unequip Aura
            </button>
            <button 
              disabled={!previewHat || loadingAction === "unequip-hat"}
              onClick={() => handleUnequip("hat")}
              className="flex-1 py-2 text-xs font-semibold rounded-lg bg-ghost-900 border border-white/5 text-ghost-400 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-50"
            >
              Unequip Hat
            </button>
          </div>
        </div>

        {/* Right Col: Store */}
        <div className="flex-1 space-y-8">
          
          {/* Auras Section */}
          <section>
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-400" />
              Legendary Auras
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {SHOP_ITEMS.filter(i => i.type === "aura").map((item) => {
                const isUnlocked = unlocked.includes(item.id);
                const isEquipped = previewAura === item.id;
                const canAfford = rep >= item.price;
                const isLoading = loadingAction === item.id;

                return (
                  <div key={item.id} className={`rounded-2xl border p-4 transition-all duration-300 flex flex-col ${item.color} ${isEquipped ? "ring-2 ring-white/50" : "hover:scale-[1.02]"}`}>
                    <div className="flex justify-between items-start mb-3">
                      <div className="text-3xl filter drop-shadow-md">{item.icon}</div>
                      {!isUnlocked && (
                        <div className="flex items-center gap-1 bg-black/40 px-2 py-1 rounded-md">
                          <Star className="w-3 h-3 text-phantom-400" />
                          <span className="text-xs font-bold text-white">{item.price}</span>
                        </div>
                      )}
                    </div>
                    <h3 className="text-base font-bold text-white mb-1">{item.name}</h3>
                    <p className="text-xs opacity-80 mb-4 flex-1">Cosmetic glow effect for your pet.</p>
                    
                    <button
                      onClick={() => handleAction(item)}
                      disabled={isLoading || (!isUnlocked && !canAfford) || isEquipped}
                      className={`w-full py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                        isEquipped 
                          ? "bg-white/20 text-white cursor-default"
                          : isUnlocked 
                            ? "bg-white text-black hover:bg-gray-200" 
                            : canAfford 
                              ? "bg-phantom-500 text-white hover:bg-phantom-400" 
                              : "bg-black/30 text-white/50 cursor-not-allowed"
                      }`}
                    >
                      {isLoading ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> : null}
                      {isEquipped ? <><Check className="w-4 h-4" /> Equipped</> : isUnlocked ? "Equip" : canAfford ? "Purchase" : <><Lock className="w-4 h-4" /> Need Rep</>}
                    </button>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Hats Section */}
          <section>
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-400" />
              Exclusive Hats
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {SHOP_ITEMS.filter(i => i.type === "hat").map((item) => {
                const isUnlocked = unlocked.includes(item.id);
                const isEquipped = previewHat === item.id;
                const canAfford = rep >= item.price;
                const isLoading = loadingAction === item.id;

                return (
                  <div key={item.id} className={`rounded-2xl border p-4 transition-all duration-300 flex flex-col ${item.color} ${isEquipped ? "ring-2 ring-white/50" : "hover:scale-[1.02]"}`}>
                    <div className="flex justify-between items-start mb-3">
                      <div className="text-3xl filter drop-shadow-md">{item.icon}</div>
                      {!isUnlocked && (
                        <div className="flex items-center gap-1 bg-black/40 px-2 py-1 rounded-md">
                          <Star className="w-3 h-3 text-phantom-400" />
                          <span className="text-xs font-bold text-white">{item.price}</span>
                        </div>
                      )}
                    </div>
                    <h3 className="text-base font-bold text-white mb-1">{item.name}</h3>
                    <p className="text-xs opacity-80 mb-4 flex-1">Unique headwear for your pet.</p>
                    
                    <button
                      onClick={() => handleAction(item)}
                      disabled={isLoading || (!isUnlocked && !canAfford) || isEquipped}
                      className={`w-full py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                        isEquipped 
                          ? "bg-white/20 text-white cursor-default"
                          : isUnlocked 
                            ? "bg-white text-black hover:bg-gray-200" 
                            : canAfford 
                              ? "bg-phantom-500 text-white hover:bg-phantom-400" 
                              : "bg-black/30 text-white/50 cursor-not-allowed"
                      }`}
                    >
                      {isLoading ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> : null}
                      {isEquipped ? <><Check className="w-4 h-4" /> Equipped</> : isUnlocked ? "Equip" : canAfford ? "Purchase" : <><Lock className="w-4 h-4" /> Need Rep</>}
                    </button>
                  </div>
                );
              })}
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
