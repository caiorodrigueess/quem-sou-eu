import { io } from "socket.io-client";

const socket = io("http://localhost:3001");

socket.on("connect", () => {
  console.log("Connected:", socket.id);
  socket.emit('createRoom', { name: "TestUser", mode: "random", category: "animais", gameType: "nota", discussionType: "livre", maxRounds: 10, sessionId: "sess123" });
});

socket.on("roomCreated", (roomId) => {
  console.log("Room Created:", roomId);
});

socket.on("updateRoom", (data) => {
  console.log("Update Room:", data);
  process.exit(0);
});

socket.on("error", (err) => {
  console.error("Error:", err);
  process.exit(1);
});
