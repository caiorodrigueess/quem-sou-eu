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

const PARES_IMPOSTOR = [
  ["Praia", "Piscina"],
  ["Cachorro", "Gato"],
  ["Hamburguer", "Pizza"],
  ["Leão", "Tigre"],
  ["Vampiro", "Zumbi"],
  ["Batman", "Superman"],
  ["Carro", "Moto"],
  ["Celular", "Computador"]
];

const PERGUNTAS_IMPOSTOR = [
  "Qual é a sua relação com isso?",
  "Onde você costuma encontrar isso?",
  "Quando foi a última vez que você viu ou usou isso?",
  "Que cor ou forma isso costuma ter?",
  "Se você pudesse descrever isso em uma palavra, qual seria?",
  "Como isso faz você se sentir?",
  "Isso é mais útil de dia ou de noite?"
];

function generateRoomCode() {
  return Math.random().toString(36).substring(2, 6).toUpperCase();
}

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('createRoom', ({ name, mode, category, gameType, discussionType }) => {
    const roomId = generateRoomCode();
    
    rooms[roomId] = {
      id: roomId,
      gameType: gameType || 'quem_sou_eu',
      mode, // 'random' ou 'manual' para QSE, 'cego' ou 'tradicional' para Impostor
      discussionType: discussionType || 'livre',
      category: category || 'animais',
      host: socket.id,
      players: [socket.id],
      status: 'lobby',
      startTime: null,
      votes: {}, // quem votou em quem (playerId -> targetId)
      impostorId: null,
      secretWord: null,
      currentQuestion: null
    };

    players[socket.id] = {
      id: socket.id,
      name,
      roomId,
      score: 0,
      character: null,
      suggestedCharacter: null,
      finishTime: null,
      votedFor: null
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
        finishTime: null,
        votedFor: null
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
      
      if (room.gameType === 'impostor') {
        const impostorIndex = Math.floor(Math.random() * room.players.length);
        const impostorId = room.players[impostorIndex];
        room.impostorId = impostorId;
        room.votes = {};
        
        if (room.discussionType === 'perguntas') {
          room.currentQuestion = PERGUNTAS_IMPOSTOR[Math.floor(Math.random() * PERGUNTAS_IMPOSTOR.length)];
        } else {
          room.currentQuestion = null;
        }
        
        if (room.mode === 'tradicional') {
          const chars = CATEGORIES[room.category] || CATEGORIES['animais'];
          const secretWord = chars[Math.floor(Math.random() * chars.length)];
          room.secretWord = secretWord;
          
          room.players.forEach(pId => {
            players[pId].character = pId === impostorId ? 'IMPOSTOR' : secretWord;
            players[pId].finishTime = null;
            players[pId].votedFor = null;
          });
        } else {
          // Impostor Cego
          const pair = PARES_IMPOSTOR[Math.floor(Math.random() * PARES_IMPOSTOR.length)];
          const isReversed = Math.random() > 0.5;
          const crewWord = isReversed ? pair[1] : pair[0];
          const impWord = isReversed ? pair[0] : pair[1];
          room.secretWord = crewWord; // to show at the end
          room.impostorWord = impWord;
          
          room.players.forEach(pId => {
            players[pId].character = pId === impostorId ? impWord : crewWord;
            players[pId].finishTime = null;
            players[pId].votedFor = null;
          });
        }
        
        room.players = room.players.sort(() => 0.5 - Math.random());
        room.startTime = Date.now();
        room.status = 'playing';
        io.to(room.id).emit('updateRoom', getRoomData(room.id));
      } else {
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

  socket.on('submitVote', ({ targetId }) => {
    const player = players[socket.id];
    if (player && rooms[player.roomId] && rooms[player.roomId].status === 'playing' && rooms[player.roomId].gameType === 'impostor') {
      const room = rooms[player.roomId];
      // Impostor não vota
      if (socket.id === room.impostorId) return;
      
      room.votes[socket.id] = targetId;
      player.votedFor = targetId;
      
      const votesCount = Object.keys(room.votes).length;
      if (votesCount === room.players.length - 1) { // Todos menos o impostor votaram
        room.status = 'voting_results';
        
        // Contar votos
        const voteTally = {};
        Object.values(room.votes).forEach(vId => {
          voteTally[vId] = (voteTally[vId] || 0) + 1;
        });
        
        // Descobrir o mais votado
        let maxVotes = 0;
        let mostVotedPlayers = [];
        for (const [vId, count] of Object.entries(voteTally)) {
          if (count > maxVotes) {
            maxVotes = count;
            mostVotedPlayers = [vId];
          } else if (count === maxVotes) {
            mostVotedPlayers.push(vId);
          }
        }
        
        // Se o impostor está entre os mais votados, os tripulantes ganham
        const impostorCaught = mostVotedPlayers.includes(room.impostorId);
        if (impostorCaught) {
          room.players.forEach(pId => {
            if (pId !== room.impostorId) players[pId].score += 100;
          });
        } else {
          players[room.impostorId].score += 100;
        }
        room.impostorCaught = impostorCaught;
        room.voteTally = voteTally;
      }
      
      io.to(room.id).emit('updateRoom', getRoomData(room.id));
    }
  });

  socket.on('guessImpostorWord', ({ word }) => {
    const player = players[socket.id];
    if (player && rooms[player.roomId] && rooms[player.roomId].status === 'playing' && rooms[player.roomId].gameType === 'impostor') {
      const room = rooms[player.roomId];
      if (socket.id !== room.impostorId) return; // Apenas impostor pode chutar
      
      room.status = 'voting_results';
      const isCorrect = word && room.secretWord && word.toLowerCase().trim() === room.secretWord.toLowerCase().trim();
      
      if (isCorrect) {
        player.score += 100;
      } else {
        room.players.forEach(pId => {
          if (pId !== room.impostorId) players[pId].score += 100;
        });
      }
      
      room.impostorCaught = !isCorrect;
      room.impostorGuessed = { word, isCorrect };
      io.to(room.id).emit('updateRoom', getRoomData(room.id));
    }
  });

  socket.on('nextQuestion', () => {
    const player = players[socket.id];
    if (player && rooms[player.roomId] && rooms[player.roomId].host === socket.id && rooms[player.roomId].status === 'playing') {
      const room = rooms[player.roomId];
      if (room.gameType === 'impostor' && room.discussionType === 'perguntas') {
        let newQuestion;
        do {
          newQuestion = PERGUNTAS_IMPOSTOR[Math.floor(Math.random() * PERGUNTAS_IMPOSTOR.length)];
        } while (newQuestion === room.currentQuestion && PERGUNTAS_IMPOSTOR.length > 1);
        room.currentQuestion = newQuestion;
        io.to(room.id).emit('updateRoom', getRoomData(room.id));
      }
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
      room.votes = {};
      room.impostorId = null;
      room.secretWord = null;
      room.impostorWord = null;
      room.impostorCaught = undefined;
      room.impostorGuessed = undefined;
      room.voteTally = undefined;
      room.currentQuestion = null;
      
      room.players.forEach(pId => {
        if (players[pId]) {
          players[pId].character = null;
          players[pId].suggestedCharacter = null;
          players[pId].finishTime = null;
          players[pId].votedFor = null;
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
