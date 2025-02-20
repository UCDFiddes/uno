import { uid } from "uid";
import { Card, CardAbility, CardColour, Reaction } from "config/deck";

// Class to manage the deck of cards.
export default class DeckManager {
  player_decks: Card[][];
  deck: Card[];

  constructor(players_count: number) {
    // Create an array of player decks.
    this.player_decks = Array.from({ length: players_count }, () => []);

    // Generate and shuffle the deck.
    this.deck = this.generateDeck();
    this.shuffleDeck();

    // Deal 7 cards to each player.
    for (let i = 0; i < players_count; i++) {
      for (let j = 0; j < 7; j++) {
        this.player_decks[i].push(this.deck.pop());
      }
    }
  }

  // Generate a deck of cards.
  generateDeck() {
    let deck: Card[] = [];

    // Add each colour to the deck
    for (let colour of Object.values(CardColour)) {
      // Add numbers to the deck (0 only once)
      for (let i = 0; i < 10; i++) {
        if (i !== 0) deck.push({ id: uid(), colour, number: i });
        deck.push({ id: uid(), colour, number: i });
      }

      // Add abilities to the deck
      for (let ability of Object.values(CardAbility).filter((x) => ![CardAbility.Wild, CardAbility.Collect4].includes(x))) {
        deck.push({ id: uid(), colour, ability });
        deck.push({ id: uid(), colour, ability });
      }
    }

    // Add wild cards to the deck
    for (let ability of Object.values(CardAbility).filter((x) => [CardAbility.Wild, CardAbility.Collect4].includes(x))) {
      deck.push({ id: uid(), colour: null, ability });
      deck.push({ id: uid(), colour: null, ability });
    }

    return deck;
  }

  // Shuffle the deck of cards.
  shuffleDeck() {
    for (let i = this.deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * i);
      const temp = this.deck[i];
      this.deck[i] = this.deck[j];
      this.deck[j] = temp;
    }
  }

  // Get the player's deck.
  pickupCard(player_position: number): Reaction[] {
    if (this.deck.length > 1) {
      let new_card = this.deck.shift();
      if ([CardAbility.Wild, CardAbility.Collect4].includes(new_card.ability)) new_card.colour = null;
      this.player_decks[player_position].push(new_card);
    }
    // Returns a list of 'actions' that the game should handle.
    return [{ type: "NEXT_PLAYER" }];
  }

  // Get the top card of the deck.
  get top_card() {
    return this.deck.at(-1);
  }

  // Check if the card is placeable against the top card.
  isPlaceable(card: Card) {
    if (!this.top_card) return true;

    // If the top card is a wild or collect 4 card without a specified colour, any card can be placed.
    if ((this.top_card.ability === "wild" || this.top_card.ability === "collect4") && !this.top_card.colour) return true;

    if (card.colour === this.top_card.colour) return true;
    if (typeof card.number === "number" && card.number === this.top_card.number) return true;
    if (card.ability && card.ability === this.top_card.ability) return true;
    if (card.ability === CardAbility.Wild) return true;
    if (card.ability === CardAbility.Collect4) return true;

    return false;
  }

  // Place a card on the deck.
  placeCard(player_position: number, card_id: string, selected_colour?: CardColour): Reaction[] {
    // CHeck if the user has the selected card in their deck.
    const selected_card = this.player_decks[player_position].find((card) => card.id === card_id);
    if (!selected_card) return [{ type: "ERROR", message: "Card not found." }];

    // Check if the card is placeable.
    const card_placeable = this.isPlaceable(selected_card);
    if (!card_placeable) return [{ type: "ERROR", message: "Card not placeable." }];

    // Check if the colour is selected for wild or collect 4 cards.
    if ([CardAbility.Wild, CardAbility.Collect4].includes(selected_card.ability) && !selected_colour)
      return [{ type: "ERROR", message: "Colour not selected." }];

    // Place the card on the deck and remove it from the player's deck.
    this.deck.push(selected_card);
    this.player_decks[player_position] = this.player_decks[player_position].filter((card) => card.id !== selected_card.id);

    // If is a number card move to the next player.
    if ("number" in selected_card) return [{ type: "NEXT_PLAYER" }];

    // If is a collect2 move to the next player, pickup 2 cards and move to the next player after that.
    if (selected_card.ability === CardAbility.Collect2)
      return [{ type: "NEXT_PLAYER" }, { type: "PICKUP" }, { type: "PICKUP" }, { type: "NEXT_PLAYER" }];

    // If is a skip move to the next player twice.
    if (selected_card.ability === CardAbility.Skip) return [{ type: "NEXT_PLAYER" }, { type: "NEXT_PLAYER" }];

    // If is a reverse move to the previous player.
    if (selected_card.ability === CardAbility.Reverse) {
      // If there are only two players, the reverse card will act as a skip card.
      if (this.player_decks.length > 2) return [{ type: "REVERSE" }, { type: "NEXT_PLAYER" }];
      return [{ type: "REVERSE" }, { type: "NEXT_PLAYER" }, { type: "NEXT_PLAYER" }];
    }

    // If is a wild card set the colour and move to the next player.
    if (selected_card.ability === CardAbility.Wild) {
      this.deck.at(-1).colour = selected_colour;
      return [{ type: "NEXT_PLAYER" }];
    }

    // If is a collect4 card set the colour, move to the next player, pickup 4 cards and move to the next player after that.
    if (selected_card.ability === CardAbility.Collect4) {
      this.deck.at(-1).colour = selected_colour;
      return [
        { type: "NEXT_PLAYER" },
        { type: "PICKUP" },
        { type: "PICKUP" },
        { type: "PICKUP" },
        { type: "PICKUP" },
        { type: "NEXT_PLAYER" },
      ];
    }

    return [];
  }
}
