import cors from "cors";
import express from "express";
import { createServer } from "node:https";
import { Server, Socket } from "socket.io";
import { ServerToClientEvents, ClientToServerEvents, InterServerEvents, SocketData } from "config/socket";
import { uid } from "uid";
import GameManager from "./game";
import { readFileSync } from "node:fs";
import path from "node:path";

// Add reusable types for the server and socket.
export type ServerType = Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
export type SocketType = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

// Read SSL certificate and key files
const options = {
  key: readFileSync(path.join(__dirname, "../keys/private.key")),
  cert: readFileSync(path.join(__dirname, "../keys/certificate.crt")),
};

// Initialize the server and websocket.
const app = express();
const server = createServer(options, app);
const io: ServerType = new Server(server, {
  cors: {
    origin: "*",
  },
});

// Enable CORS.
app.use(cors());

// Use for the build of the frontend.
app.use(express.static("build"));

// Identify the connection with a session ID.
io.use((socket, next) => {
  const user_id = socket.handshake.auth.user_id;
  const session_id = socket.handshake.auth.session_id;
  socket.data.user_id = user_id || uid();
  socket.data.session_id = session_id || uid();
  next();
});

// State and game management.
new GameManager(io);

// Start the server.
const PORT = 4000;
server.listen(PORT, () => {
  console.log(`🔥: Server listening on ${PORT}.`);
});
