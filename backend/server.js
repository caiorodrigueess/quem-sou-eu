const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3001;

// Database em memória
const rooms = {}; // roomId -> { id, mode, category, host, players: [], status: 'lobby'|'assigning'|'playing'|'finished', startTime: null }
const players = {}; // socketId -> { id, name, roomId, score, character, suggestedCharacter, finishTime: null }

const CATEGORIES = {
  animais: ["Leão", "Elefante", "Cachorro", "Gato", "Girafa", "Tigre", "Pinguim", "Canguru"],
  filmes: ["Darth Vader", "Harry Potter", "Homem de Ferro", "Coringa", "Jack Sparrow", "Indiana Jones"],
  celebridades: ["Silvio Santos", "Neymar", "Anitta", "Elon Musk", "Beyoncé", "Faustão"]
};

function generateRoomCode() {
  return Math.random().toString(36).substring(2, 6).toUpperCase();
}

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('createRoom', ({ name, mode, category }) => {
    const roomId = generateRoomCode();
    
    rooms[roomId] = {
      id: roomId,
      mode, // 'random' ou 'manual'
      category: category || 'animais',
      host: socket.id,
      players: [socket.id],
      status: 'lobby',
      startTime: null
    };

    players[socket.id] = {
      id: socket.id,
      name,
      roomId,
      score: 0,
      character: null,
      suggestedCharacter: null,
      finishTime: null
    };

    socket.join(roomId);
    socket.emit('roomCreated', roomId);
    io.to(roomId).emit('updateRoom', getRoomData(roomId));
  });

  socket.on('joinRoom', ({ name, roomId }) => {
    roomId = roomId.toUpperCase();
    if (rooms[roomId] && rooms[roomId].status === 'lobby') {
      if (rooms[roomId].players.length >= 10) {
        return socket.emit('error', 'A sala está cheia (limite de 10 jogadores).');
      }
      
      rooms[roomId].players.push(socket.id);
      
      players[socket.id] = {
        id: socket.id,
        name,
        roomId,
        score: 0,
        character: null,
        suggestedCharacter: null,
        finishTime: null
      };

      socket.join(roomId);
      socket.emit('roomJoined', roomId);
      io.to(roomId).emit('updateRoom', getRoomData(roomId));
    } else {
      socket.emit('error', 'Sala não encontrada ou jogo já iniciado.');
    }
  });

  socket.on('startGame', () => {
    const player = players[socket.id];
    if (player && rooms[player.roomId] && rooms[player.roomId].host === socket.id) {
      const room = rooms[player.roomId];
      
      if (room.mode === 'random') {
        // Distribuir aleatoriamente da categoria
        const chars = [...(CATEGORIES[room.category] || CATEGORIES['animais'])].sort(() => 0.5 - Math.random());
        
        room.players.forEach((playerId, index) => {
          players[playerId].character = chars[index % chars.length];
          players[playerId].finishTime = null;
        });
        
        // Sorteia a ordem dos jogadores na sala
        room.players = room.players.sort(() => 0.5 - Math.random());
        
        room.startTime = Date.now();
        room.status = 'playing';
        io.to(room.id).emit('updateRoom', getRoomData(room.id));
      } else {
        // Modo manual: precisa que cada um sugira um personagem
        room.status = 'assigning';
        io.to(room.id).emit('updateRoom', getRoomData(room.id));
      }
    }
  });

  socket.on('submitCharacter', ({ character }) => {
    const player = players[socket.id];
    if (player && rooms[player.roomId] && rooms[player.roomId].status === 'assigning') {
      player.suggestedCharacter = character;
      
      const room = rooms[player.roomId];
      const allSubmitted = room.players.every(pId => players[pId].suggestedCharacter);
      
      if (allSubmitted) {
        // Embaralha os jogadores para criar um ciclo aleatório
        let shuffledPlayers = [...room.players].sort(() => 0.5 - Math.random());
        
        // Garante que ninguém pegue o que sugeriu: cada jogador passa sua sugestão para o próximo do ciclo
        for (let i = 0; i < shuffledPlayers.length; i++) {
          let currentPlayer = shuffledPlayers[i];
          let nextPlayer = shuffledPlayers[(i + 1) % shuffledPlayers.length];
          
          players[nextPlayer].character = players[currentPlayer].suggestedCharacter;
          players[nextPlayer].finishTime = null;
        }
        
        // Sorteia a ordem dos jogadores (podemos apenas reusar a lista embaralhada)
        room.players = shuffledPlayers;
        
        room.startTime = Date.now();
        room.status = 'playing';
      }
      
      io.to(room.id).emit('updateRoom', getRoomData(room.id));
    }
  });

  socket.on('guessCorrect', ({ playerId }) => {
    // Quando alguém adivinha corretamente
    // O anfitrião ou o próprio jogador pode acionar isso
    const player = players[socket.id];
    if (player && rooms[player.roomId] && rooms[player.roomId].status === 'playing') {
      const targetPlayer = players[playerId];
      const room = rooms[player.roomId];
      
      if (targetPlayer && !targetPlayer.finishTime) {
        // Conta quantos já terminaram para calcular a pontuação
        const alreadyFinishedCount = room.players.filter(pId => players[pId].finishTime).length;
        const pointsEarned = Math.max(10, 100 - (alreadyFinishedCount * 10)); // 100, 90, 80...
        
        targetPlayer.score += pointsEarned;
        targetPlayer.finishTime = Date.now();
        
        const allFinished = room.players.every(pId => players[pId].finishTime);
        if (allFinished) {
          room.status = 'finished';
        }
        
        io.to(player.roomId).emit('updateRoom', getRoomData(player.roomId));
        io.to(player.roomId).emit('playerGuessed', { name: targetPlayer.name });
      }
    }
  });

  socket.on('restartGame', () => {
    const player = players[socket.id];
    if (player && rooms[player.roomId] && rooms[player.roomId].host === socket.id) {
      const room = rooms[player.roomId];
      room.status = 'lobby';
      room.startTime = null;
      
      room.players.forEach(pId => {
        if (players[pId]) {
          players[pId].character = null;
          players[pId].suggestedCharacter = null;
          players[pId].finishTime = null;
        }
      });
      
      io.to(room.id).emit('updateRoom', getRoomData(room.id));
    }
  });

  socket.on('leaveRoom', () => {
    handlePlayerLeave(socket);
  });

  socket.on('disconnect', () => {
    handlePlayerLeave(socket);
  });

  function handlePlayerLeave(socket) {
    const player = players[socket.id];
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
  }

  function getRoomData(roomId) {
    const room = rooms[roomId];
    if (!room) return null;
    return {
      ...room,
      playersData: room.players.map(pId => {
        const p = players[pId];
        return {
          id: p.id,
          name: p.name,
          score: p.score,
          character: p.character,
          hasSubmitted: !!p.suggestedCharacter,
          finishTime: p.finishTime
        };
      })
    };
  }
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
