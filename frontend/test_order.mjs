import { io } from "socket.io-client";

const socket = io("http://localhost:3001");

socket.on('connect', () => {
    console.log("Connected:", socket.id);
    console.log("Emitting createRoom...");
    socket.emit('createRoom', { name: "TestPlayer", mode: "random", gameType: "nota", maxRounds: 10, sessionId: "sess123" });
});

socket.on('roomCreated', (id) => {
    console.log("Received roomCreated:", id);
});

socket.on('updateRoom', (data) => {
    console.log("Received updateRoom. players:", data.playersData.length);
    setTimeout(() => process.exit(0), 1000);
});

socket.on('error', (err) => {
    console.error("Error:", err);
});
