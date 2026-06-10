"use client";

import { useState } from "react";
import { useAuth } from "../../../custom-hooks/use-auth";
import { Store, Sparkles, Loader2, Palette, Zap, Crown } from "lucide-react";
import { SHOP_ITEMS, type CosmeticType } from "../../../lib/shop-items";

export default function ShopPage() {
  const { user, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState<CosmeticType>("color");
  const [processing, setProcessing] = useState<string | null>(null);

  const ghostDust = user?.gamification?.ghostDust || 0;
  const unlockedItems = user?.cosmetics?.unlockedItems || [];
  const activeCosmetics = user?.cosmetics || { activeHat: null, activeAura: null, nameColor: null };

  const handleBuy = async (itemId: string, price: number) => {
    if (ghostDust < price) {
      alert("Not enough Ghost Dust!");
      return;
    }
    setProcessing(`buy-${itemId}`);
    try {
      const res = await fetch("/api/shop/buy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId }),
      });
      const data = await res.json();
      if (data.success) {
        refreshUser();
      } else {
        alert(data.error);
      }
    } finally {
      setProcessing(null);
    }
  };

  const handleEquip = async (itemId: string | null, type: CosmeticType) => {
    setProcessing(`equip-${itemId || type}`);
    try {
      const res = await fetch("/api/shop/equip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId, type }), // If itemId is null, it's an unequip
      });
      const data = await res.json();
      if (data.success) {
        refreshUser();
      } else {
        alert(data.error);
      }
    } finally {
      setProcessing(null);
    }
  };

  const tabs: { id: CosmeticType, label: string, icon: React.ElementType }[] = [
    { id: "color", label: "Name Colors", icon: Palette },
    { id: "aura", label: "Auras", icon: Zap },
    { id: "hat", label: "Hats", icon: Crown },
  ];

  const filteredItems = SHOP_ITEMS.filter(item => item.type === activeTab);

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 pb-32">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <Store className="w-8 h-8 text-phantom-500" />
            The Soul Shop
          </h1>
          <p className="text-sm text-ghost-400 mt-1">Spend your Ghost Dust to stand out.</p>
        </div>
        
        <div className="glass-card px-5 py-3 rounded-2xl flex items-center gap-3 border border-phantom-500/30 shadow-[0_0_20px_rgba(168,85,247,0.15)]">
          <Sparkles className="w-5 h-5 text-phantom-400" />
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-ghost-400 uppercase tracking-wider">Your Balance</span>
            <span className="text-lg font-black text-white">{ghostDust} 🟣</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
                isActive 
                  ? "bg-phantom-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]" 
                  : "bg-ghost-900 border border-white/5 text-ghost-400 hover:text-white hover:bg-ghost-800"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Unequip Card (if they have something equipped) */}
        {((activeTab === "color" && activeCosmetics.nameColor) || 
          (activeTab === "aura" && activeCosmetics.activeAura) || 
          (activeTab === "hat" && activeCosmetics.activeHat)) && (
          <div className="glass-card rounded-2xl p-5 border border-white/5 hover:border-white/10 flex flex-col items-center justify-center text-center gap-3 min-h-[160px]">
            <p className="text-sm font-bold text-ghost-300">Default Style</p>
            <button
              onClick={() => handleEquip(null, activeTab)}
              disabled={processing !== null}
              className="px-4 py-2 w-full rounded-xl text-sm font-bold bg-ghost-800 text-white hover:bg-ghost-700 transition-colors"
            >
              Unequip Current
            </button>
          </div>
        )}

        {filteredItems.map(item => {
          const isOwned = unlockedItems.includes(item.id);
          const isEquipped = 
            (item.type === "color" && activeCosmetics.nameColor === item.value) ||
            (item.type === "aura" && activeCosmetics.activeAura === item.value) ||
            (item.type === "hat" && activeCosmetics.activeHat === item.value);

          return (
            <div key={item.id} className={`glass-card rounded-2xl p-5 border flex flex-col gap-4 relative overflow-hidden transition-all ${isEquipped ? 'border-phantom-500 shadow-[0_0_20px_rgba(168,85,247,0.2)]' : 'border-white/5 hover:border-white/10'}`}>
              
              {/* Preview Box */}
              <div className="h-20 rounded-xl bg-ghost-950 border border-white/5 flex items-center justify-center relative">
                {item.type === "color" && (
                  <span className={`text-lg font-black tracking-tight ${item.value}`}>Preview Name</span>
                )}
                {item.type === "aura" && (
                  <div className={`w-10 h-10 rounded-full bg-ghost-800 ${item.value}`} />
                )}
                {item.type === "hat" && (
                  <div className="text-4xl drop-shadow-lg">{item.value}</div>
                )}
              </div>

              <div>
                <h3 className="font-bold text-white text-lg leading-tight">{item.name}</h3>
                <p className="text-phantom-300 font-semibold text-sm mt-0.5">{item.price} 🟣</p>
              </div>

              <div className="mt-auto">
                {isEquipped ? (
                  <button disabled className="w-full py-2.5 rounded-xl font-bold bg-phantom-500/20 text-phantom-400 border border-phantom-500/30 cursor-default">
                    Equipped
                  </button>
                ) : isOwned ? (
                  <button 
                    onClick={() => handleEquip(item.id, item.type)}
                    disabled={processing !== null}
                    className="w-full py-2.5 rounded-xl font-bold bg-ghost-800 text-white hover:bg-ghost-700 transition-colors"
                  >
                    {processing === `equip-${item.id}` ? <Loader2 className="w-5 h-5 mx-auto animate-spin" /> : "Equip"}
                  </button>
                ) : (
                  <button 
                    onClick={() => handleBuy(item.id, item.price)}
                    disabled={processing !== null || ghostDust < item.price}
                    className="w-full py-2.5 rounded-xl font-bold bg-white text-black hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {processing === `buy-${item.id}` ? <Loader2 className="w-5 h-5 mx-auto text-black animate-spin" /> : "Buy Item"}
                  </button>
                )}
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
}
