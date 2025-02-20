// Config variables that are used throughout the game
export const MAX_PLAYERS = 4;
export const MIN_PLAYERS = 2;
export const TIMEOUT = 30_500;

// A list of names that can be used to generate a random name for a player, we capitalize the first letter of each name
export const NAME_PARTS = [
  "spiteful",
  "earth",
  "frightening",
  "annoyed",
  "curve",
  "cow",
  "heady",
  "nonchalant",
  "vase",
  "stale",
  "bizarre",
  "uppity",
  "optimal",
  "clammy",
  "story",
  "lake",
  "theory",
  "bloody",
  "paltry",
  "watery",
  "puncture",
  "obnoxious",
  "whimsical",
  "ice",
  "animal",
  "jumpy",
  "drawer",
  "staking",
  "afford",
  "note",
  "second",
  "awful",
].map((part) => part.charAt(0).toUpperCase() + part.slice(1));
