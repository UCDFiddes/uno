import { useStateContext } from "../../tools/StateManagerContext";
import { loopPlayer } from "../../utils";
import PlayerIdentifier from "./PlayerIdentifier";
import PlayerDeck from "./PlayerDeck";

// A parent function to handle grouping the player components together and positioning them around the screen.
export default function Players() {
  const { game } = useStateContext();
  if (!game) return null;

  // Find the local players position and offset the other players based on that so that the local player is always at the bottom of the screen.
  const offset = game.players.find((player) => player.user_id === localStorage.getItem("user_id"))?.position ?? 0;

  // loopPlayer will make sure the player position is always between 0 and 3.
  return (
    <div className="fixed inset-0 pointer-events-none">
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2">
        <div className="w-[100dvw] relative">
          <PlayerDeck position={loopPlayer(0 + offset)} />
          <PlayerIdentifier position={loopPlayer(0 + offset)} />
        </div>
      </div>
      <div className="fixed left-0 origin-bottom-left -translate-y-full rotate-90">
        <div className="w-[100dvh] relative">
          <PlayerDeck position={loopPlayer(1 + offset)} />
          <PlayerIdentifier position={loopPlayer(1 + offset)} />
        </div>
      </div>
      <div className="fixed top-0 left-1/2 -translate-x-1/2 rotate-180">
        <div className="w-[100dvw] relative">
          <PlayerDeck position={loopPlayer(2 + offset)} />
          <PlayerIdentifier position={loopPlayer(2 + offset)} flip />
        </div>
      </div>
      <div className="fixed right-0 origin-bottom-right -translate-y-full -rotate-90">
        <div className="w-[100dvh] relative">
          <PlayerDeck position={loopPlayer(3 + offset)} />
          <PlayerIdentifier position={loopPlayer(3 + offset)} />
        </div>
      </div>
    </div>
  );
}
