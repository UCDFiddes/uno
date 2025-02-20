import { Connection } from "./connections";
import { CardColour } from "./deck";
import { GameState, Player } from "./game";

// Types required by socket.io for typing the events.

export interface ServerToClientEvents {
  session: (user_id: string, session_id: string) => void;
  error: (message: string) => void;

  "connections/sync": (connections: Connection[]) => void;

  "game/state": (state: GameState) => void;
  "game/end": (podium: Player[]) => void;
}
export interface ClientToServerEvents {
  "game/join": () => void;
  "game/toggle-ready": () => void;
  "game/pickup-card": () => void;
  "game/place-card": (card_id: string, selected_colour?: CardColour) => void;
  "user/update-name": (name: string) => void;
}
export interface InterServerEvents {}
export interface SocketData {
  user_id: string;
  session_id: string;
}
