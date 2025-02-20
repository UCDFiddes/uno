// The different colours of cards.
export enum CardColour {
  Red = "red",
  Green = "green",
  Blue = "blue",
  Yellow = "yellow",
}

// The different abilities of cards.
export enum CardAbility {
  Wild = "wild",
  Collect4 = "collect4",
  Skip = "skip",
  Reverse = "reverse",
  Collect2 = "collect2",
}

// Data stored for each card.
export interface Card {
  id: string;
  colour: CardColour | null;
  number?: number;
  ability?: CardAbility;
}

// The different types of reactions the deck manager can return.
export type Reaction =
  | {
      type: "NEXT_PLAYER" | "REVERSE" | "PICKUP";
    }
  | {
      type: "ERROR";
      message: string;
    };
