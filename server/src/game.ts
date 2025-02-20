import { Connection } from "config/connections";
import { MAX_PLAYERS, MIN_PLAYERS, TIMEOUT } from "config/CONSTANTS";
import { CardColour, Reaction } from "config/deck";
import { GameStatus, Player } from "config/game";
import { ServerType, SocketType } from "./app";
import DeckManager from "./deck";
import DatabaseManager from "./database";

// Class to manage the game.
export default class GameManager {
  io: ServerType;
  connections: Map<string, Connection>;

  status: GameStatus;
  current_position: number;
  current_direction: 1 | -1;
  players: Player[];

  database: DatabaseManager;
  deck_manager: DeckManager | null;

  constructor(io: ServerType) {
    // Handle the socket connectiosn and updates for new connections.
    this.io = io;
    this.connections = new Map();
    io.on("connection", (s) => this.onConnection(s));

    // Init the game state.
    this.status = GameStatus.Waiting;
    this.current_position = 0;
    this.current_direction = 1;
    this.players = [];

    // Init the database manager.
    this.database = new DatabaseManager();

    // Setup an interval that will be used to check if a player has not picked up a card in time.
    setInterval(() => {
      if (this.status !== GameStatus.Playing) return;
      const player = this.players.find((p) => p.position === this.current_position);

      // If the player has not picked up a card in time, make them pick up a card and move to the next player.
      if (!player || !player.deadline) return;
      if (player.deadline < Date.now()) {
        this.handleReactions([{ type: "PICKUP" }, { type: "NEXT_PLAYER" }]);
      }
    }, 1000);
  }

  // Handle a new connection.
  onConnection(socket: SocketType) {
    // Identify the connection using a session requesting them to save their user_id and session_id.
    socket.emit("session", socket.data.user_id, socket.data.session_id);
    console.log(`✔️: Connection identified as ${socket.data.user_id}/${socket.data.session_id}.`);

    // Save the connection and sync the game state.
    this.connections.set(socket.id, { user_id: socket.data.user_id, session_id: socket.data.session_id });
    this.sync();

    // Handle the socket events forwarding them to the respective functions.
    socket.on("game/join", () => this.joinRequest(socket.id));
    socket.on("game/toggle-ready", () => this.toggleReadyRequest(socket.id));
    socket.on("game/pickup-card", () => this.pickupCard(socket.id));
    socket.on("game/place-card", (card_id, selected_colour) => this.placeCard(socket.id, card_id, selected_colour));
    socket.on("user/update-name", (name) => this.updateName(socket.id, name));

    // Handle the disconnection event, removing connections from the state.
    socket.on("disconnect", () => {
      console.log(`❌: Disconnection identified as ${socket.data.user_id}/${socket.data.session_id}.`);
      this.connections.delete(socket.id);
      this.sync();
    });
  }

  // Get the database users for the current connections.
  async getDatabaseUsers() {
    return await this.database.getUsers(Array.from(this.connections.values()).map((p) => p.user_id));
  }

  // Used to sync all state with all connections.
  async sync() {
    // Syncs all online connections.
    this.io.emit("connections/sync", Array.from(this.connections.values()));

    // Used to order players by their positions, and remove any users that are not connected while in the lobby.
    if (this.status === GameStatus.Waiting) {
      this.players = this.players.filter((p) => Array.from(this.connections.values()).find((c) => c.user_id === p.user_id));
      this.reorganizePlayers();
    }

    // Send all state regarding the game to all connections.
    this.io.emit("game/state", {
      status: this.status,
      deck: this.deck_manager ? this.deck_manager.deck : [],
      current_position: this.current_position,
      current_direction: this.current_direction,
      players: await this.resolvePlayers(),
    });
  }

  // Used to resolve the players with the database users to include their names, wins and current decks
  async resolvePlayers() {
    const database_users = await this.getDatabaseUsers();
    return this.players.map((player) => {
      const user = database_users.find((u) => u.id === player.user_id);
      const deck = this.deck_manager ? this.deck_manager.player_decks[player.position] : [];

      return {
        ...player,
        name: user?.name ?? player.user_id,
        wins: user?.wins ?? 0,
        deck,
      };
    });
  }

  // Event handler used to update the name of a user.
  async updateName(socket_id: string, name: string) {
    // Check for the connection which is used to identify the user.
    const connection = this.connections.get(socket_id);
    if (!connection) {
      this.io.to(socket_id).emit("error", "Connection not found.");
      this.sync();
      return;
    }

    await this.database.updateName(connection.user_id, name);
    this.sync();
  }

  // Event handler used to join a user to the game.
  joinRequest(socket_id: string) {
    // Check for the connection which is used to identify the user.
    const connection = this.connections.get(socket_id);
    if (!connection) {
      this.io.to(socket_id).emit("error", "Connection not found.");
      this.sync();
      return;
    }

    // Check if the player has already joined the game.
    const existing_player = this.players.find((p) => p.user_id === connection.user_id);
    if (existing_player) {
      this.io.to(socket_id).emit("error", "Player already joined.");
      this.sync();
      return;
    }

    // Check if the game is already started.
    if (this.status !== GameStatus.Waiting) {
      this.io.to(socket_id).emit("error", "Game already started.");
      this.sync();
      return;
    }

    // Check if the game is full.
    if (this.players.length >= MAX_PLAYERS) {
      this.io.to(socket_id).emit("error", "Game is full.");
      this.sync();
      return;
    }

    // Add the player to the game and sync the state.
    this.players.push({
      user_id: connection.user_id,
      name: connection.user_id,
      wins: 0,
      position: 999,
      ready: false,
      deadline: null,
      deck: [],
    });
    this.reorganizePlayers();
    this.sync();
  }

  // Event handler used to toggle the ready state of a player.
  toggleReadyRequest(socket_id: string) {
    // Check if the game is already started.
    if (this.status !== GameStatus.Waiting) {
      this.io.to(socket_id).emit("error", "Game already started.");
      this.sync();
      return;
    }

    // Check for the connection which is used to identify the user.
    const connection = this.connections.get(socket_id);
    if (!connection) {
      this.io.to(socket_id).emit("error", "Connection not found.");
      this.sync();
      return;
    }

    // Check if the player has not joined the game.
    const existing_player = this.players.findIndex((p) => p.user_id === connection.user_id);
    if (existing_player === -1) {
      this.io.to(socket_id).emit("error", "Player has not joined.");
      this.sync();
      return;
    }

    // Update the players ready state.
    this.players[existing_player].ready = !this.players[existing_player].ready;
    this.sync();

    // If all players are ready and there are enough players, start the game.
    if (this.players.every((p) => p.ready) && this.players.length >= MIN_PLAYERS) this.startGame();
  }

  // Event handler used to pick up a card.
  pickupCard(socket_id: string) {
    // Check if the game has started.
    if (this.status !== GameStatus.Playing) {
      this.io.to(socket_id).emit("error", "Game not started.");
      this.sync();
      return;
    }

    // Check for the connection which is used to identify the user.
    const connection = this.connections.get(socket_id);
    if (!connection) {
      this.io.to(socket_id).emit("error", "Connection not found.");
      this.sync();
      return;
    }

    // Check if the player has not joined the game.
    const existing_player = this.players.findIndex((p) => p.user_id === connection.user_id);
    if (existing_player === -1) {
      this.io.to(socket_id).emit("error", "Player has not joined.");
      this.sync();
      return;
    }

    // Check if it is the players turn.
    if (this.current_position !== this.players[existing_player].position) {
      this.io.to(socket_id).emit("error", "Not your turn.");
      this.sync();
      return;
    }

    // Check if the deck is found. If it is not found then the game is in an invalid state.
    if (!this.deck_manager) {
      this.io.to(socket_id).emit("error", "Deck not found.");
      this.sync();
      return;
    }

    this._pickupCard(this.players[existing_player].position, socket_id);
  }

  // Backend function to pick up a card.
  _pickupCard(player_position: number, socket_id?: string) {
    const reactions = this.deck_manager.pickupCard(player_position);
    this.handleReactions(reactions, socket_id);
  }

  // Event handler used to place a card.
  placeCard(socket_id: string, card_id: string, selected_colour?: CardColour) {
    // Check if the game has started.
    if (this.status !== GameStatus.Playing) {
      this.io.to(socket_id).emit("error", "Game not started.");
      this.sync();
      return;
    }

    // Check for the connection which is used to identify the user.
    const connection = this.connections.get(socket_id);
    if (!connection) {
      this.io.to(socket_id).emit("error", "Connection not found.");
      this.sync();
      return;
    }

    // Check if the player has not joined the game.
    const existing_player = this.players.findIndex((p) => p.user_id === connection.user_id);
    if (existing_player === -1) {
      this.io.to(socket_id).emit("error", "Player has not joined.");
      this.sync();
      return;
    }

    // Check if it is the players turn.
    if (this.current_position !== this.players[existing_player].position) {
      this.io.to(socket_id).emit("error", "Not your turn.");
      this.sync();
      return;
    }

    // Check if the deck is found. If it is not found then the game is in an invalid state.
    if (!this.deck_manager) {
      this.io.to(socket_id).emit("error", "Deck not found.");
      this.sync();
      return;
    }

    this._placeCard(this.players[existing_player].position, card_id, selected_colour, socket_id);
  }

  // Backend function to place a card.
  _placeCard(player_position: number, card_id: string, selected_colour?: CardColour, socket_id?: string) {
    const reactions = this.deck_manager.placeCard(player_position, card_id, selected_colour);
    this.handleReactions(reactions, socket_id);

    // Since a win can only happen after a card is placed, we check for a win condition here.
    if (this.checkWinCondition()) this.handleWin();
  }

  // Sorts players in a leaderboard based on their deck length and increments the wins of the winner.
  async handleWin() {
    if (!this.checkWinCondition()) return;
    const players = await this.resolvePlayers();
    const win_leaderboard = players.sort(
      (a, b) => this.deck_manager.player_decks[a.position].length - this.deck_manager.player_decks[b.position].length,
    );
    this.database.incrementWins(win_leaderboard[0].user_id);
    win_leaderboard[0].wins++;

    // Emit the win event and reset the game so users can see who wins.
    this.io.emit("game/end", win_leaderboard);
    this.reset();
  }

  // Reset the game state.
  reset() {
    this.status = GameStatus.Waiting;
    this.current_position = 0;
    this.current_direction = 1;
    this.players = [];
    this.deck_manager = null;
    this.sync();
  }

  // Check for players with 0 cards left.
  checkWinCondition() {
    const winner_position = this.deck_manager.player_decks.findIndex((p) => p.length === 0);
    if (winner_position === -1) return false;
    return true;
  }

  // Handle reactions returned by the deck manager, this is used for state that isnt stored in the deck manager and requires updating for the game to work.
  handleReactions(reactions: Reaction[], socket_id?: string) {
    for (const reaction of reactions) {
      switch (reaction.type) {
        // Moves the current position to the next player.
        case "NEXT_PLAYER":
          const new_position = this.current_position + this.current_direction;
          this.current_position = new_position > this.players.length - 1 ? 0 : new_position < 0 ? this.players.length - 1 : new_position;

          // Increments the next players deadline, so its is fresh and they have a new 30s to place/pick a card.
          const next_player_index = this.players.findIndex((p) => p.position === this.current_position);
          if (next_player_index !== -1) this.players[next_player_index].deadline = Date.now() + TIMEOUT;
          break;

        // Picks up a card for the current player.
        case "PICKUP":
          this._pickupCard(this.current_position, socket_id);
          // Since the _pickupCard function skips to the next player this will reverse the direction to stay on the same player.
          this.handleReactions([{ type: "REVERSE" }, { type: "NEXT_PLAYER" }, { type: "REVERSE" }]);
          break;

        // Reverses the direction of the game.
        case "REVERSE":
          this.current_direction = (this.current_direction * -1) as -1 | 1;
          break;

        // Emits an error to the user, if the socket_id is not found it will emit to all connections.
        case "ERROR":
          if (socket_id) this.io.to(socket_id).emit("error", reaction.message);
          else this.io.emit("error", reaction.message);
          break;
      }
    }
    this.sync();
  }

  // Starts the game
  startGame() {
    this.status = GameStatus.Playing;
    this.deck_manager = new DeckManager(this.players.length);

    // Sets the first players deadline to place/pick a command.
    const next_player_index = this.players.findIndex((p) => p.position === this.current_position);
    if (next_player_index !== -1) this.players[next_player_index].deadline = Date.now() + TIMEOUT;

    this.sync();
  }

  // Sort players by their position and sets the position value to their index incase of duplicate positions.
  reorganizePlayers() {
    this.players = this.players.sort((a, b) => a.position - b.position).map((p, i) => ({ ...p, position: i }));
  }
}
