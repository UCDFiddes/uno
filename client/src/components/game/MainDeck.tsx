import { AnimatePresence, motion } from "framer-motion";
import { useStateContext } from "../../tools/StateManagerContext";
import Card from "./Card";
import Rand from "rand-seed";
import { useEffect, useState } from "react";

// The main deck that shows the top cards, handles picking up cards, and shows the players remaining time at the top of the screen.
export default function MainDeck() {
  // Access the game state and store the time left.
  const { game, actions } = useStateContext();
  const [timeLeft, setTimeLeft] = useState(-1); // -1 means hide the countdown.

  // Update the time left every 100ms based on the current players deadline.
  useEffect(() => {
    const interval = setInterval(() => {
      // Retrive the current player and check if they exist, have a deadline, and it is their turn.
      const player = game?.players.find((player) => player.user_id === localStorage.getItem("user_id"));
      if (!player || !player.deadline || player?.position !== game?.current_position) return setTimeLeft(-1);

      // Calculate the time left and set the state.
      const timeLeft = player.deadline - Date.now();
      setTimeLeft(parseInt(`${timeLeft / 1000}`));
    }, 100);

    return () => {
      clearInterval(interval);
    };
  }, [game?.players, game?.current_position]);

  if (!game) return null;

  return (
    <div>
      {/* Display a spinning loading circle to show the players what direction the game is being played in. */}
      <motion.div
        className="size-[50vw] md:size-[30vw] border-8 md:border-12 rounded-full border-l-white border-transparent fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        style={{ animation: `spin 1s linear infinite ${game.current_direction === 1 ? "normal" : "reverse"}` }}
      />

      {/* Show the stack of cards in the middle of the screen. (only the top 7 are overlayed to stop them looking like a circle.)  */}
      {game.deck.slice(game.deck.length - 7, game.deck.length).map((card) => (
        <motion.div
          onClick={actions.pickupCard}
          key={card.id}
          className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
          initial={{ scale: 0, rotate: new Rand(card.id + "alt").next() * 360 }}
          animate={{ rotate: new Rand(card.id).next() * 360, scale: 1.5 }}
          transition={{ duration: 0.5 }}
        >
          <Card colour={card.colour} ability={card.ability} number={card.number} />
        </motion.div>
      ))}

      {/* Display a countdown at the top of the screen. */}
      <AnimatePresence>
        {timeLeft !== -1 && (
          <motion.div
            initial={{ translateY: "-100%" }}
            animate={{ translateY: "0" }}
            exit={{ translateY: "-100%" }}
            className="fixed top-0 left-1/2 -translate-x-1/2 -translate-y-9 flex flex-col gap-3 items-center px-3 pt-12 pb-6 bg-white rounded-b-xl justify-center drop-shadow-2xl"
          >
            <span className="whitespace-nowrap font-bold text-orange-500">ITS YOUR TURN</span>
            <span className="text-zinc-800 font-black text-5xl leading-7">{timeLeft}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
