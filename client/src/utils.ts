import { MAX_PLAYERS } from "config/CONSTANTS";
import { Card } from "config/deck";
import { twMerge } from "tailwind-merge";

// A function that merges tailwind classes together. Basically concatenates multiple strings.
export const cn = twMerge;

// A function that loops the player position so it doesn't go out of bounds.
export function loopPlayer(position: number) {
  return position % MAX_PLAYERS;
}

// Splits a array into chunks of a specified size.
export function chunkArray(array: any[], chunkSize: number) {
  let output = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    output.push(array.slice(i, i + chunkSize));
  }
  return output;
}

// Checks against a top card if a card is placeable. Should be the same as the server side check.
export function cardIsPlaceable(card: Card, top_card: Card | null) {
  if (!top_card) return true;

  if ((top_card.ability === "wild" || top_card.ability === "collect4") && !top_card.colour) return true;
  if (card.colour === top_card.colour) return true;
  if (typeof card.number === "number" && card.number === top_card.number) return true;
  if (card.ability && card.ability === top_card.ability) return true;
  if (card.ability === "wild") return true;
  if (card.ability === "collect4") return true;

  return false;
}
