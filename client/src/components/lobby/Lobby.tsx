import { MAX_PLAYERS, MIN_PLAYERS } from "config/CONSTANTS";
import { useStateContext } from "../../tools/StateManagerContext";
import LobbyPlayer from "./LobbyPlayer";
import { useEffect, useState } from "react";
import { useDebouncedCallback } from "use-debounce";

// Show a lobby page where players can join and leave the game.
export default function Lobby() {
  // Access the game state and store the local player.
  const { game, actions, winner_leaderboard } = useStateContext();

  // Find the local player and the last winner.
  const localPlayer = game?.players.find((player) => player.user_id === localStorage.getItem("user_id"));
  const winner = winner_leaderboard[0];

  // Logic to show loading state and values for updating the players name.
  const [loading, setLoading] = useState(false);
  const [value, setValue] = useState<string>(localPlayer?.name ?? "");

  // Update the players name on the server when the user stops typing for 1 second.
  const updateName = useDebouncedCallback(async (value) => {
    // Check the name is atleast 3 characters long.
    if (value.length < 3) return setLoading(false);
    actions.updateName(value);
    setLoading(false);
  }, 1000);

  // If the player name is updated by the server update the local state.
  useEffect(() => {
    setValue(localPlayer?.name ?? "");
  }, [localPlayer?.name]);

  return (
    <div className="flex flex-col items-center justify-center min-h-dvh relative">
      {/* If a winner is stored, then display at the top of the lobby to show the winner of the last game. */}
      {winner && (
        <div className="absolute top-6 flex gap-2">
          <img
            alt="player avatar"
            src={`https://api.dicebear.com/9.x/avataaars/svg?seed=${winner_leaderboard[0].name}&backgroundColor=65c9ff,b6e3f4,c0aede,ffd5dc,ffdfbf,d1d4f9&accessoriesProbability=25`}
            className="size-10 rounded-lg"
          />
          <div className="flex flex-col">
            <span className="font-bold leading-snug text-sm md:text-base text-yellow-500">Last Winner</span>
            <span className="leading-snug md:text-base text-zinc-200">
              {typeof winner?.wins === "number" && <span className="text-yellow-500 font-bold">{winner.wins}</span>} {winner.name}
            </span>
          </div>
        </div>
      )}

      {/* If the player is local and they have joined the lobby show a input to change their name. */}
      {localPlayer && (
        <div className="flex items-center gap-3 mb-6 border-b-2 pb-6 border-zinc-500">
          <img
            alt="player avatar"
            src={`https://api.dicebear.com/9.x/avataaars/svg?seed=${value}&backgroundColor=65c9ff,b6e3f4,c0aede,ffd5dc,ffdfbf,d1d4f9&accessoriesProbability=25`}
            className="size-18 rounded-2xl"
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-zinc-300 text-sm">Name{loading && "..."}</label>
            <input
              placeholder="Name..."
              className="p-3 bg-zinc-700 text-zinc-200 rounded-xl shadow w-52"
              value={value}
              maxLength={12}
              onChange={(v) => {
                setLoading(true);
                setValue(v.target.value);
                updateName(v.target.value);
              }}
            />
          </div>
        </div>
      )}

      {/* Show all joined players in a grid. */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {Array.from(new Array(MAX_PLAYERS)).map((_, index) => (
          <LobbyPlayer key={index} position={index} />
        ))}
      </div>

      {/* Show the number of players joined and the required maximum and minimums to play. */}
      <span className="mt-6 text-zinc-300 text-sm">
        {game?.players.length ?? 0}/{MAX_PLAYERS} Players, {MIN_PLAYERS} Required
      </span>

      {/* Depending if the player has joined or not show a join button or a ready/unready button. */}
      <div className="absolute flex flex-col items-center bottom-6 gap-3">
        {localPlayer ? (
          <button
            onClick={actions.toggleReady}
            className="px-5 py-2 bg-red-600/50 w-fit hover:bg-red-500/50 data-[ready=true]:bg-green-600/50 data-[ready=true]:hover:bg-green-500/50 text-zinc-300 rounded-xl font-bold drop-shadow cursor-pointer"
            data-ready={localPlayer.ready}
          >
            {localPlayer.ready ? "Ready" : "Not Ready"}
          </button>
        ) : (
          <button
            onClick={actions.joinGame}
            className="px-5 py-2 bg-green-600/50 w-fit hover:bg-green-500/50 text-zinc-300 rounded-xl font-bold drop-shadow cursor-pointer"
          >
            Join Game
          </button>
        )}
      </div>
    </div>
  );
}
