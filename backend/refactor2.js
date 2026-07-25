const fs = require('fs');
let code = fs.readFileSync('server2.js', 'utf8');

// Replace handlePlayerLeave
const oldHandlePlayerLeave = `  function handlePlayerLeave(socket) {
    const sessionId = socketIdToSessionId[socket.id];
    const player = players[sessionId];
    if (player) {
      const roomId = player.roomId;
      const room = rooms[roomId];
      
      if (room) {
        room.players = room.players.filter(pId => pId !== socket.id);
        socket.leave(roomId);
        
        if (room.players.length === 0) {
          delete rooms[roomId];
        } else {
          if (room.host === socket.id) {
            room.host = room.players[0]; // Passa o host
          }
          io.to(roomId).emit('updateRoom', getRoomData(roomId));
        }
      }
      delete players[socket.id];
    }
  }`;

const newHandlePlayerLeave = `  socket.on('reconnectRoom', ({ roomId, sessionId }) => {
    roomId = roomId?.toUpperCase();
    if (rooms[roomId] && players[sessionId] && players[sessionId].roomId === roomId) {
      socketIdToSessionId[socket.id] = sessionId;
      players[sessionId].socketId = socket.id;
      players[sessionId].connected = true;
      socket.join(roomId);
      io.to(roomId).emit('updateRoom', getRoomData(roomId));
    } else {
      socket.emit('reconnectFailed');
    }
  });

  function handlePlayerLeave(socket) {
    const sessionId = socketIdToSessionId[socket.id];
    const player = players[sessionId];
    if (player) {
      const roomId = player.roomId;
      const room = rooms[roomId];
      
      if (room) {
        if (room.status === 'lobby') {
          room.players = room.players.filter(pId => pId !== sessionId);
          socket.leave(roomId);
          if (room.players.length === 0) {
            delete rooms[roomId];
          } else {
            if (room.host === sessionId) {
              room.host = room.players[0]; // Passa o host
            }
            io.to(roomId).emit('updateRoom', getRoomData(roomId));
          }
          delete players[sessionId];
        } else {
          // If game started, just mark as disconnected
          player.connected = false;
          io.to(roomId).emit('updateRoom', getRoomData(roomId));
        }
      }
    }
    delete socketIdToSessionId[socket.id];
  }`;

code = code.replace(oldHandlePlayerLeave, newHandlePlayerLeave);

fs.writeFileSync('server3.js', code);
