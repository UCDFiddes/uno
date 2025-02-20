import { useStateContext } from "../../tools/StateManagerContext";

interface ComponentProps {
  position: number;
}
// A component to show a player that is waiting in the lobby.
export default function LobbyPlayer({ position }: ComponentProps) {
  // Access the game state and select the player based on the position.
  const { game } = useStateContext();
  if (!game) return null;
  const player = game?.players.find((player) => player.position === position);

  return (
    <div>
      {player ? (
        <img
          alt="player avatar"
          src={`https://api.dicebear.com/9.x/avataaars/svg?seed=${player.name}&backgroundColor=65c9ff,b6e3f4,c0aede,ffd5dc,ffdfbf,d1d4f9&accessoriesProbability=25`}
          className="size-32 rounded-3xl"
        />
      ) : (
        <div className="size-32 bg-zinc-700 rounded-3xl" />
      )}

      {/* Show the players wins and name next to each other. */}
      <h3 className="font-bold text-zinc-300 mt-3 leading-tight">
        {typeof player?.wins === "number" && <span className="text-yellow-500 font-bold">{player.wins}</span>}{" "}
        {player ? player.name : `Player ${position + 1}`}{" "}
      </h3>

      {/* Show the players current ready state so other users can see. */}
      <span className="text-zinc-400 text-sm leading-tight">{(player as any)?.ready ? "Ready" : "Not Ready"}</span>
    </div>
  );
}
