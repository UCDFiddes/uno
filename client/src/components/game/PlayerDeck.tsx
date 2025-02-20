import { useStateContext } from "../../tools/StateManagerContext";
import Card, { CARD_COLOURS } from "./Card";
import { cardIsPlaceable, chunkArray } from "../../utils";
import { motion } from "framer-motion";
import { useState } from "react";
import Portal from "../Portal";
import { CardColour } from "config/deck";
import useOutsideAlerter from "../../tools/ClickOutsideHook";

interface ComponentProps {
  position: number;
}
// A interactive deck of cards that the player can place cards from.
export default function PlayerDeck({ position }: ComponentProps) {
  // Access the game state and select the player based on the position.
  const { game, actions } = useStateContext();
  const player = game?.players.find((player) => player.position === position);

  // Used to show the colour selector when a wild or collect4 card is clicked.
  const [colourSelectorCardID, setColourSelectorCardID] = useState<string | null>(null);
  const modalRef = useOutsideAlerter(() => setColourSelectorCardID(null));

  if (!game || !player) return null;

  // Check if its the players current turn and if they are the local player allowing them to control the deck.
  const isLocalPlayer = player.user_id === localStorage.getItem("user_id");
  const isTurn = game.current_position === player.position;

  // If it is the local player show an interactive deck of cards.
  if (isLocalPlayer) {
    // Split the players deck into rows of 7 cards.
    const card_rows = chunkArray(player.deck, 7);

    return (
      <div className="flex flex-col gap-2 items-center justify-center absolute inset-x-0 -bottom-0 -translate-y-[4rem] pointer-events-auto">
        {/* Setup for a modal for when a collect4 or wild card is selected. */}
        {colourSelectorCardID && (
          <Portal>
            <div className="fixed inset-0 z-50 bg-black/50">
              <div
                ref={modalRef as any}
                className="p-3 bg-white w-fit top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-xl shadow-lg absolute"
              >
                <p className="mb-1 font-medium">Select a colour</p>
                <div className="flex gap-2">
                  {["red", "green", "blue", "yellow"].map((colour) => (
                    <button
                      key={colour}
                      onClick={() => {
                        actions.placeCard(colourSelectorCardID, colour as CardColour);
                        setColourSelectorCardID(null);
                      }}
                      className="size-12 rounded-xl"
                      style={{ backgroundColor: CARD_COLOURS[(colour as CardColour) ?? "wild"] }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </Portal>
        )}

        {/* Show a white background to signify its the players turn. */}
        {isTurn && (
          <motion.div
            initial={{ scaleX: 0, scaleY: 0 }}
            animate={{ scaleX: 1.5, scaleY: 1.25 }}
            className="absolute inset-x-0 aspect-[5/3] bg-radial from-white/50 via-transparent md:translate-y-1/8 pointer-events-none"
          />
        )}

        {/* Show the players deck of cards, inital loop for each row and then each card. */}
        <motion.div className="flex flex-col gap-2 items-center justify-center" animate={{ opacity: isTurn ? 1 : 0.5 }}>
          {card_rows.map((row, row_index) => (
            <motion.div key={row_index} className="flex h-10 md:h-14 scale-115">
              {row.map((card, card_index) => (
                <motion.button
                  onClick={() => {
                    // If it is a wild or collect4 show the colour selector modal, otherwise place the card.
                    if (["wild", "collect4"].includes(card.ability)) {
                      setColourSelectorCardID(card.id);
                    } else actions.placeCard(card.id);
                  }}
                  key={card.id}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1.4, translateY: Math.abs(card_index - row.length / 2) * 8, rotate: (card_index - row.length / 2) * 4 }}
                  whileHover={{ scale: 1.6, translateY: Math.abs(card_index - row.length / 2) * 8 - 32 }}
                  whileTap={{ scale: 1.3, translateY: Math.abs(card_index - row.length / 2) * 8 - 32 }}
                  style={{
                    width: "clamp(32px, calc(100vw / 9), 128px)",
                  }}
                  className="cursor-pointer"
                >
                  <Card
                    colour={card.colour}
                    number={card.number}
                    ability={card.ability}
                    disabled={!cardIsPlaceable(card, game.deck.at(-1) ?? null)}
                  />
                </motion.button>
              ))}
            </motion.div>
          ))}
        </motion.div>
      </div>
    );
  }

  // If it is a remote player show a static deck of cards.
  return (
    <div className="flex gap-2 items-center justify-center absolute inset-x-0 md:-translate-y-1/2 -bottom-0 flex-wrap max-w-72 mx-auto">
      {/* Show a white background to signify its the players turn. */}
      {isTurn && (
        <motion.div
          initial={{ scaleX: 0, scaleY: 0 }}
          animate={{ scaleX: 2, scaleY: 1.25 }}
          className="absolute inset-x-0 aspect-[5/3] bg-radial from-white/50 via-transparent md:translate-y-1/8"
        />
      )}

      {player.deck.map((card) => (
        <div key={card.id} className="w-6 h-5 -translate-x-full">
          <Card />
        </div>
      ))}
    </div>
  );
}
