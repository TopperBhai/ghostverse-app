export type CosmeticType = "color" | "aura" | "hat";

export interface ShopItem {
  id: string;
  name: string;
  type: CosmeticType;
  price: number;
  value: string; // The CSS color/class or image URL
}

export const SHOP_ITEMS: ShopItem[] = [
  // COLORS
  { id: "color_phantom", name: "Phantom Purple", type: "color", price: 100, value: "text-phantom-500" },
  { id: "color_neon_red", name: "Blood Red", type: "color", price: 200, value: "text-neon-red" },
  { id: "color_gold", name: "Divine Gold", type: "color", price: 500, value: "text-yellow-400 drop-shadow-[0_0_5px_rgba(250,204,21,0.8)]" },
  { id: "color_matrix", name: "Matrix Green", type: "color", price: 150, value: "text-green-500" },
  { id: "color_ice", name: "Ice Blue", type: "color", price: 150, value: "text-cyan-400" },

  // AURAS
  { id: "aura_shadow", name: "Shadow Aura", type: "aura", price: 300, value: "shadow-[0_0_30px_rgba(0,0,0,0.8)] ring-1 ring-black" },
  { id: "aura_holy", name: "Holy Glow", type: "aura", price: 800, value: "shadow-[0_0_40px_rgba(250,204,21,0.5)] ring-2 ring-yellow-400/50" },
  { id: "aura_cursed", name: "Cursed Flames", type: "aura", price: 600, value: "shadow-[0_0_30px_rgba(239,68,68,0.5)] ring-2 ring-red-500/50" },
  { id: "aura_void", name: "Void Resonance", type: "aura", price: 1000, value: "shadow-[0_0_50px_rgba(168,85,247,0.6)] ring-2 ring-phantom-500/80 animate-pulse" },

  // HATS (Emojis mapped to Lucide SVGs)
  { id: "hat_crown", name: "King's Crown", type: "hat", price: 1500, value: "crown" },
  { id: "hat_halo", name: "Angel Halo", type: "hat", price: 1200, value: "halo" },
  { id: "hat_horns", name: "Devil Horns", type: "hat", price: 1200, value: "demon-horns" },
  { id: "hat_wizard", name: "Wizard Hat", type: "hat", price: 900, value: "wizard-hat" },
  { id: "hat_cowboy", name: "Cowboy Hat", type: "hat", price: 500, value: "cowboy" },
];
