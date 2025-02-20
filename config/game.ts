import { Card } from "./deck";

// The statuses a game can be in.
export enum GameStatus {
  Waiting = "waiting",
  Playing = "playing",
}

// Data stored for each player.
export interface Player {
  user_id: string;
  name: string;
  wins: number;

  position: number;
  ready: boolean;
  deadline: number | null;

  deck: Card[];
}

// Data stored for each game.
export interface GameState {
  status: GameStatus;
  deck: Card[];
  current_position: number;
  current_direction: 1 | -1;
  players: Player[];
}
