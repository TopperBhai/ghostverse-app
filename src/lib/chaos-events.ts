export interface ChaosEvent {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string; // Tailwind text color class
  theme: string; // Tailwind background gradient class
}

export const CHAOS_EVENTS: ChaosEvent[] = [
  {
    id: "truth",
    title: "Truth Day",
    description: "Only true confessions allowed today. Lies will be cursed.",
    icon: "👁️",
    color: "text-blue-400",
    theme: "from-blue-900/40 to-blue-950",
  },
  {
    id: "roast",
    title: "Roast Day",
    description: "World Chat is a roast battle. Don't hold back. Thick skin required.",
    icon: "🔥",
    color: "text-orange-500",
    theme: "from-orange-900/40 to-orange-950",
  },
  {
    id: "ghost",
    title: "Ghost Day",
    description: "Everyone's name is hidden in World Chat today. Complete anonymity.",
    icon: "👻",
    color: "text-ghost-300",
    theme: "from-ghost-800/40 to-ghost-950",
  },
  {
    id: "purge",
    title: "The Purge",
    description: "No moderation in World Chat for the next 24 hours. Survive.",
    icon: "🩸",
    color: "text-neon-red",
    theme: "from-red-900/40 to-red-950",
  },
  {
    id: "compliment",
    title: "Compliment Day",
    description: "Say something nice about a stranger. Spread the light.",
    icon: "✨",
    color: "text-yellow-400",
    theme: "from-yellow-900/40 to-yellow-950",
  },
  {
    id: "meme",
    title: "Meme Day",
    description: "Only memes and jokes. Keep it light, keep it funny.",
    icon: "🤡",
    color: "text-green-400",
    theme: "from-green-900/40 to-green-950",
  },
  {
    id: "secret",
    title: "Secret Day",
    description: "Post your darkest secret on the Truth Board. No one will know.",
    icon: "🤫",
    color: "text-purple-400",
    theme: "from-purple-900/40 to-purple-950",
  }
];

/**
 * Deterministically pick an event based on the current date in IST.
 * This ensures everyone sees the same event without needing a database.
 */
export function getDailyChaosEvent(): ChaosEvent {
  // Get date in IST
  const now = new Date();
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const istDate = new Date(utc + (3600000 * 5.5));
  
  // Create a unique integer for the day
  const dayOfYear = Math.floor((istDate.getTime() - new Date(istDate.getFullYear(), 0, 0).getTime()) / 1000 / 60 / 60 / 24);
  
  // Use dayOfYear to deterministically pick an event index
  const eventIndex = dayOfYear % CHAOS_EVENTS.length;
  
  return CHAOS_EVENTS[eventIndex];
}
