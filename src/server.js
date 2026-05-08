import dotenv from "dotenv";
import app from "./app.js";
import connectDB from "./configs/db.js";
import { Server } from "socket.io";
import http from "http";

dotenv.config();

// Connect DB
connectDB();

const PORT = process.env.PORT || 5000;

// ⛔ Do NOT do: app.listen(PORT)
// ⬇ Use http server instead
const server = http.createServer(app);

export const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
  },
});

// Listen for websocket connections
io.on("connection", (socket) => {
  console.log("🟢 WS Client connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("🔴 WS Client disconnected:", socket.id);
  });
});

// Change this line
server.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});