import { createContext, useContext, useEffect, useState } from "react";
import { Socket, io } from "socket.io-client";
import { ClientToServerEvents, ServerToClientEvents } from "config/socket";
import { Connection } from "config/connections";
import { GameState, Player } from "config/game";
import { CardColour } from "config/deck";

// Retirve the server url from the query parameters, this can be used to connect to a different server when localhost is not accessible.
const searchParams = new URLSearchParams(window.location.search);

// Handle socket authentication and connection with persistant session_id.
const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(searchParams.get("server") ?? "", {
  autoConnect: false,
});

// Retirve the user_id and session_id from local storage and connect to the server.
const current_user_id = searchParams.get("user_id") ?? localStorage.getItem("user_id");
const current_session_id = sessionStorage.getItem("session_id");
socket.auth = { user_id: current_user_id, session_id: current_session_id };
socket.connect();

// When the server sends a session event it means it has accepted the user_id and session_id or created a new one and we are required to save it to storage.
socket.on("session", (user_id, session_id) => {
  socket.auth = { user_id, session_id };

  // user_id is saved to local storage which is consistent between tabs, session_id is saved to session storage which is unique to each tab.
  localStorage.setItem("user_id", user_id);
  sessionStorage.setItem("session_id", session_id);

  console.log(`Identified as ${user_id}/${session_id}.`);
});

// Log errors to the console.
socket.on("error", (message) => console.error(message));

// Create a react context and provider to share the socket instance across the webpage.
interface StateContextProps {
  socket: Socket<ServerToClientEvents, ClientToServerEvents>;
  connections: Connection[];
  game: GameState | null;
  actions: {
    joinGame: () => void;
    toggleReady: () => void;
    pickupCard: () => void;
    placeCard: (card_id: string, selected_colour?: CardColour) => void;
    updateName: (name: string) => void;
  };
  winner_leaderboard: Player[];
}
export const StateContext = createContext<StateContextProps>(null!);

interface StateContextProviderProps {
  children: React.ReactNode;
}
// A parent component that provides the state context to all child components.
export function StateContextProvider({ children }: StateContextProviderProps) {
  // Store all connections, game state and winner leaderboards received from the server.
  const [connections, setConnections] = useState<Connection[]>([]);
  const [game, setGame] = useState<GameState | null>(null);
  const [winnerLeaderboard, setWinnerLeaderboard] = useState<Player[]>([]);

  // Listen for events from the server and update the state accordingly.
  useEffect(() => {
    function onConnectionSync(conns: Connection[]) {
      setConnections(conns);
    }
    socket.on("connections/sync", onConnectionSync);

    function onGameState(state: GameState) {
      setGame(state);
    }
    socket.on("game/state", onGameState);

    function onWin(leaderboard: Player[]) {
      setWinnerLeaderboard(leaderboard);
      console.log(leaderboard);
    }
    socket.on("game/end", onWin);

    return () => {
      socket.removeListener("connections/sync", onConnectionSync);
      socket.removeListener("game/state", onGameState);
      socket.removeListener("game/end", onWin);
    };
  }, []);

  // A set of actions that can be called to interact with the server.
  const actions: StateContextProps["actions"] = {
    joinGame: () => {
      socket.emit("game/join");
    },
    toggleReady: () => {
      socket.emit("game/toggle-ready");
    },
    pickupCard: () => {
      socket.emit("game/pickup-card");
    },
    placeCard: (card_id: string, selected_colour?: CardColour) => {
      socket.emit("game/place-card", card_id, selected_colour);
    },
    updateName: (name: string) => {
      socket.emit("user/update-name", name);
    },
  };

  return (
    <StateContext.Provider value={{ socket, connections, game, actions, winner_leaderboard: winnerLeaderboard }}>
      {children}
    </StateContext.Provider>
  );
}

export function useStateContext() {
  return useContext(StateContext);
}
