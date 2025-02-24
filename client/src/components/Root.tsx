import { useStateContext } from "../tools/StateManagerContext";
import Game from "./game/Game";
import Lobby from "./lobby/Lobby";

// Main function to handle the routing between the lobby and the game and show a loading state while the socket is connecting.
export default function Root() {
  const { game } = useStateContext();

  if (!game)
    return (
      <div className="flex items-center justify-center flex-col min-h-dvh text-center text-zinc-300 bg-zinc-800">
        <div className="size-10 mb-3 rounded-full border-6 border-t-transparent border-l-transparent border-white animate-spin" />
        <h2 className="text-xl font-bold">Loading...</h2>
        <span className="text-sm">This shouldn't take long.</span>
      </div>
    );

  if (game.status === "waiting") return <Lobby />;
  return <Game />;
}
