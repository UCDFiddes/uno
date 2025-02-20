import { motion } from "framer-motion";
import { useStateContext } from "../../tools/StateManagerContext";
import { cn } from "../../utils";
import { useEffect, useState } from "react";
import { TIMEOUT } from "config/CONSTANTS";

interface ComponentProps {
  position: number;
  flip?: boolean;
}
// Show a card in each corner of the screen to show the players who is who.
export default function PlayerIdentifier({ position, flip }: ComponentProps) {
  const { game } = useStateContext();
  const [progress, setProgress] = useState(0);

  // Update the progress bar every 100ms based on the current players deadline.
  useEffect(() => {
    const interval = setInterval(() => {
      // Retrive the current player and check if they exist, have a deadline, and it is their turn.
      const player = game?.players.find((player) => player.position === position);
      if (!player || !player.deadline || game?.current_position !== position) return setProgress(0);

      // Calculate the time left and set the state.
      const timeLeft = player.deadline - Date.now();
      setProgress(1 - timeLeft / TIMEOUT);
    }, 100);

    return () => {
      clearInterval(interval);
    };
  }, [game?.players, position, game?.current_position]);

  if (!game) return null;
  const player = game?.players.find((player) => player.position === position);

  return (
    <motion.div
      className={cn(
        "px-2 md:px-3 py-1 md:py-2 flex gap-2 items-center absolute left-6 -bottom-0 hover:opacity-25 pointer-events-none",
        flip ? "rotate-180 rounded-b md:rounded-b-lg" : "rounded-t md:rounded-t-lg",
        !player && "opacity-25",
      )}
      animate={{
        background: `linear-gradient(90deg, rgba(255,105,0,1) 0%, rgba(255,105,0,1) ${progress * 100}%, rgba(255,255,255,1) ${progress * 100}%, rgba(255,255,255,1) 100%)`,
      }}
    >
      {/* Show the players avatar or a blank square. */}
      {player ? (
        <img
          alt="player avatar"
          src={`https://api.dicebear.com/9.x/avataaars/svg?seed=${player.name}&backgroundColor=65c9ff,b6e3f4,c0aede,ffd5dc,ffdfbf,d1d4f9&accessoriesProbability=25`}
          className="md:size-10 size-4 rounded md:rounded-lg"
        />
      ) : (
        <div className="md:size-10 size-4 bg-zinc-400 rounded md:rounded-lg" />
      )}

      {/* Show the players name, wins and card count. */}
      <div className="flex flex-col">
        <span className="font-bold leading-snug text-sm md:text-base">{player?.name ?? `Player ${position + 1}`}</span>
        {player && (
          <span className="text-sm leading-snug hidden md:block">
            {player?.wins ?? 0} Wins | {player?.deck.length ?? 0} Cards
          </span>
        )}
      </div>
    </motion.div>
  );
}
