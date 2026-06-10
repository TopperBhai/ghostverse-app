// GhostVerse — AI Icebreaker Prompts
// Curated database of conversation starters

export interface Icebreaker {
  category: "funny" | "deep" | "debate" | "icebreaker";
  text: string;
}

export const icebreakers: Icebreaker[] = [
  // ===== FUNNY =====
  { category: "funny", text: "If your pet could talk, what's the first complaint it would have about you?" },
  { category: "funny", text: "What's the most embarrassing song on your playlist?" },
  { category: "funny", text: "If you were a villain, what would your evil plan be?" },
  { category: "funny", text: "What's the weirdest food combo you secretly enjoy?" },
  { category: "funny", text: "If you had to survive on one fast food menu forever, which one?" },
  { category: "funny", text: "What's the most useless talent you have?" },
  { category: "funny", text: "If you could add one rule to everyday life, what would it be?" },
  { category: "funny", text: "What's the worst date you've ever been on?" },
  { category: "funny", text: "If you were a superhero, what would your lame power be?" },
  { category: "funny", text: "What's something everyone looks stupid doing?" },
  { category: "funny", text: "If your life had a theme song, what would it be?" },
  { category: "funny", text: "What's the worst advice you've ever received?" },
  { category: "funny", text: "If animals could run for president, which would win?" },
  { category: "funny", text: "What would your autobiography title be?" },
  { category: "funny", text: "If you could rename any color, which one and what name?" },
  { category: "funny", text: "What's the dumbest thing you believed as a kid?" },
  { category: "funny", text: "If you were a ghost, who would you haunt first?" },
  { category: "funny", text: "What's the most chaotic thing you've done out of boredom?" },
  { category: "funny", text: "If WiFi didn't exist, what would you actually be doing right now?" },
  { category: "funny", text: "What conspiracy theory do you low-key believe?" },

  // ===== DEEP =====
  { category: "deep", text: "What's something you wish you could tell your younger self?" },
  { category: "deep", text: "What's the loneliest you've ever felt, and how did you get through it?" },
  { category: "deep", text: "If you could master one skill overnight, what would it be and why?" },
  { category: "deep", text: "What's something that changed your worldview completely?" },
  { category: "deep", text: "What do you think happens after we die?" },
  { category: "deep", text: "What's a compliment you received that you'll never forget?" },
  { category: "deep", text: "If you could ask the world one question, what would it be?" },
  { category: "deep", text: "What's something you pretend to not care about but secretly do?" },
  { category: "deep", text: "Do you think people can truly change?" },
  { category: "deep", text: "What's the biggest risk you've ever taken?" },
  { category: "deep", text: "What would you do differently if nobody judged you?" },
  { category: "deep", text: "Is it better to be loved or respected?" },
  { category: "deep", text: "What's a lesson you had to learn the hard way?" },
  { category: "deep", text: "Do you believe in soulmates?" },
  { category: "deep", text: "What's the most important thing in a friendship?" },
  { category: "deep", text: "If you could live in any time period, which would you choose?" },
  { category: "deep", text: "What keeps you up at night?" },
  { category: "deep", text: "What's a belief you hold that most people disagree with?" },
  { category: "deep", text: "If you had 24 hours to live, what would you do?" },
  { category: "deep", text: "What's the meaning of life, in your opinion?" },

  // ===== DEBATE =====
  { category: "debate", text: "Is social media doing more harm or good to society?" },
  { category: "debate", text: "Should AI be allowed to create art?" },
  { category: "debate", text: "Is it better to be rich and lonely or poor and surrounded by love?" },
  { category: "debate", text: "Should everyone be required to vote?" },
  { category: "debate", text: "Is it okay to lie to protect someone's feelings?" },
  { category: "debate", text: "Should schools teach more life skills than academic subjects?" },
  { category: "debate", text: "Is cancel culture justified or toxic?" },
  { category: "debate", text: "Should billionaires exist?" },
  { category: "debate", text: "Is privacy dead in the digital age?" },
  { category: "debate", text: "Are online friendships as real as in-person ones?" },
  { category: "debate", text: "Should AI have rights if it becomes sentient?" },
  { category: "debate", text: "Is it ethical to eat meat?" },
  { category: "debate", text: "Hot take: pineapple on pizza — yes or no?" },
  { category: "debate", text: "Should college/university be free?" },
  { category: "debate", text: "Is hustle culture toxic or motivating?" },
  { category: "debate", text: "Should people be anonymous on the internet?" },
  { category: "debate", text: "Is true altruism possible or is everything selfish?" },
  { category: "debate", text: "Would you live forever if you could?" },
  { category: "debate", text: "Are we living in a simulation?" },
  { category: "debate", text: "Should kids be allowed to have smartphones?" },

  // ===== ICEBREAKER =====
  { category: "icebreaker", text: "What are you currently obsessed with?" },
  { category: "icebreaker", text: "What's the last show you binge-watched?" },
  { category: "icebreaker", text: "If you could teleport anywhere right now, where would you go?" },
  { category: "icebreaker", text: "What's a random fact about you that nobody would guess?" },
  { category: "icebreaker", text: "Are you a morning person or night owl?" },
  { category: "icebreaker", text: "What song are you listening to on repeat lately?" },
  { category: "icebreaker", text: "What's your comfort food?" },
  { category: "icebreaker", text: "If you had a day with zero responsibilities, what would you do?" },
  { category: "icebreaker", text: "What's the best book you've read recently?" },
  { category: "icebreaker", text: "Dogs or cats?" },
  { category: "icebreaker", text: "What's your go-to karaoke song?" },
  { category: "icebreaker", text: "If you could have dinner with anyone alive, who?" },
  { category: "icebreaker", text: "What's a hobby you've always wanted to try?" },
  { category: "icebreaker", text: "Beach vacation or mountain getaway?" },
  { category: "icebreaker", text: "What's the last thing that made you laugh really hard?" },
  { category: "icebreaker", text: "What's your dream job if money didn't matter?" },
  { category: "icebreaker", text: "Are you an introvert or extrovert?" },
  { category: "icebreaker", text: "What's the best gift you've ever received?" },
  { category: "icebreaker", text: "If you could learn any language fluently, which one?" },
  { category: "icebreaker", text: "What are your top 3 emojis?" },
];

export function getRandomIcebreaker(category?: Icebreaker["category"]): Icebreaker {
  const filtered = category
    ? icebreakers.filter((i) => i.category === category)
    : icebreakers;
  return filtered[Math.floor(Math.random() * filtered.length)];
}

export const CATEGORY_INFO = {
  funny: { emoji: "😂", label: "Funny", color: "#F59E0B" },
  deep: { emoji: "🤔", label: "Deep", color: "#8B5CF6" },
  debate: { emoji: "⚔️", label: "Debate", color: "#EF4444" },
  icebreaker: { emoji: "❄️", label: "Icebreaker", color: "#22D3EE" },
};
