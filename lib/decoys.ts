/** Purely decorative idea titles: what the reel flicks through while the real idea is generated,
 *  and what the hero's backdrop drifts. Mirrors WhatToDo/lib/decoyIdeas.ts. Never submitted. */
export const DECOY_TITLES = [
  "Plant Doctor",
  "Chore Wars",
  "Split The Bill",
  "Gig Radar",
  "Pantry Chef",
  "Study Buddy",
  "Habit Forge",
  "Pet Passport",
  "Rent Pulse",
  "Mood Journal",
  "Trail Mates",
  "Invoice Nudge",
  "Crate Digger",
  "Lease Lens",
  "Swap Shelf",
  "Focus Den",
  "Garage Band",
  "Meal Roulette",
  "Tab Tamer",
  "Side Quest",
  "Closet Swap",
  "Bug Bounty",
  "Night Owl",
  "Recipe Remix",
  "Commute Pal",
  "Tool Library",
  "Book Club",
  "Budget Buddy",
];

/**
 * Font size (points) that lets `text` sit at poster scale in Anton without a single word
 * overflowing the screen: sized off the longest word (Anton's uppercase glyphs average about half
 * an em wide) and capped by screen height by overall length, so short titles go huge and long
 * ones still fit. The native twin of the web's posterFontSize().
 */
export function posterSize(text: string, width: number, height: number): number {
  const longestWord = Math.max(...text.split(/\s+/).map((w) => w.length), 1);
  const byWidth = (width * 0.84) / (longestWord * 0.6);
  const byHeight = height * (text.length > 26 ? 0.1 : text.length > 16 ? 0.13 : 0.17);
  return Math.floor(Math.min(byWidth, byHeight, 150));
}

/** Headline size that fits "WHAT TO DO?" on one line of this screen (Anton ≈ 4.8em wide). */
export function headlineSize(width: number): number {
  return Math.min(84, Math.floor((width - 40) / 5.2));
}
