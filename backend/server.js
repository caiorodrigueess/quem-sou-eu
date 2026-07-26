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
const players = {};
const socketIdToSessionId = {};

const fs = require('fs');
const path = require('path');
const HISTORY_FILE = path.join(__dirname, 'used_questions.json');
let globalUsedQuestions = { palpite: [], proibido: [], duvido: [], impostor: [] };
try {
  if (fs.existsSync(HISTORY_FILE)) {
    globalUsedQuestions = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));
  }
} catch (e) {
  console.error('Error reading history file', e);
}

function getNextQuestion(type, array, idField) {
  if (!globalUsedQuestions[type]) globalUsedQuestions[type] = [];
  let available = array.filter(q => {
    let id = idField ? q[idField] : q;
    return !globalUsedQuestions[type].includes(id);
  });
  if (available.length === 0) {
    globalUsedQuestions[type] = [];
    available = array;
  }
  let selected = available[Math.floor(Math.random() * available.length)];
  let selectedId = idField ? selected[idField] : selected;
  globalUsedQuestions[type].push(selectedId);
  try {
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(globalUsedQuestions));
  } catch (e) {}
  return selected;
}


function getPlayer(socketId) {
  const sessionId = socketIdToSessionId[socketId];
  return players[sessionId];
} // socketId -> { id, name, roomId, score, character, suggestedCharacter, finishTime: null }

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


const DATA_FILE = path.join(__dirname, 'data', 'perguntas.json');
let PERGUNTAS_IMPOSTOR = [];
let PERGUNTAS_PROIBIDO = [];
let PERGUNTAS_DUVIDO = [];
let PERGUNTAS_PALPITE = [];

try {
  if (fs.existsSync(DATA_FILE)) {
    const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    PERGUNTAS_IMPOSTOR = data.impostor || [];
    PERGUNTAS_PROIBIDO = data.proibido || [];
    PERGUNTAS_DUVIDO = data.duvido || [];
    PERGUNTAS_PALPITE = data.palpite || [];
  }
} catch (e) {
  console.error('Error loading questions data:', e);
}

function generateRoomCode() {
  return Math.random().toString(36).substring(2, 6).toUpperCase();
}

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('createRoom', ({ name, mode, category, gameType, discussionType, maxRounds , sessionId}) => {
    if (!sessionId) return;
    socketIdToSessionId[socket.id] = sessionId;
    const roomId = generateRoomCode();
    
    rooms[roomId] = {
      id: roomId,
      gameType: gameType || 'quem_sou_eu',
      mode, // 'random'/'manual', 'cego'/'tradicional'
      discussionType: discussionType || 'livre',
      category: category || 'animais',
      host: sessionId,
      players: [sessionId],
      status: 'lobby',
      startTime: null,
      votes: {}, // quem votou em quem (playerId -> targetId)
      impostorId: null,
      secretWord: null,
      currentQuestion: null,
      maxRounds: maxRounds || 10,
      currentRound: 0,
      palpites: {},
      usedQuestions: []
    };

    players[sessionId] = {
      id: sessionId,
      socketId: socket.id,
      connected: true,
      name,
      roomId,
      score: 0,
      character: null,
      suggestedCharacter: null,
      finishTime: null,
      votedFor: null,
      hasSubmittedPalpite: false
    };

    socket.join(roomId);
    socket.emit('roomCreated', roomId);
    io.to(roomId).emit('updateRoom', getRoomData(roomId));
  });

  socket.on('joinRoom', ({ name, roomId , sessionId}) => {
    if (!sessionId) return;
    socketIdToSessionId[socket.id] = sessionId;
    roomId = roomId.trim().toUpperCase();
    if (rooms[roomId] && rooms[roomId].status === 'lobby') {
      if (rooms[roomId].players.length >= 10) {
        return socket.emit('error', 'A sala está cheia (limite de 10 jogadores).');
      }
      
      if (!rooms[roomId].players.includes(sessionId)) rooms[roomId].players.push(sessionId);
      
      players[sessionId] = {
        id: sessionId,
        socketId: socket.id,
        connected: true,
        name,
        roomId,
        score: 0,
        character: null,
        suggestedCharacter: null,
        finishTime: null,
        votedFor: null,
        hasSubmittedPalpite: false
      };

      socket.join(roomId);
      socket.emit('roomJoined', roomId);
      io.to(roomId).emit('updateRoom', getRoomData(roomId));
    } else {
      socket.emit('error', 'Sala não encontrada ou jogo já iniciado.');
    }
  });

  socket.on('startGame', () => {
    const sessionId = socketIdToSessionId[socket.id];
    const player = players[sessionId];
    if (player && rooms[player.roomId] && rooms[player.roomId].host === sessionId) {
      const room = rooms[player.roomId];
      
      if (room.gameType === 'palpite') {
        room.currentRound = 1;
        room.usedQuestions = [];
        
        room.currentPalpite = getNextQuestion('palpite', PERGUNTAS_PALPITE, 'question');
        
        room.palpites = {};
        room.players.forEach(pId => {
          players[pId].hasSubmittedPalpite = false;
        });
        room.startTime = Date.now();
        room.status = 'playing';
        io.to(room.id).emit('updateRoom', getRoomData(room.id));
      } else if (room.gameType === 'impostor') {
        const impostorIndex = Math.floor(Math.random() * room.players.length);
        const impostorId = room.players[impostorIndex];
        room.impostorId = impostorId;
        room.votes = {};
        room.usedQuestions = [];
        
        if (room.discussionType === 'perguntas') {
          room.currentQuestion = getNextQuestion('impostor', PERGUNTAS_IMPOSTOR, null);
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
        room.startTime = Date.now();
        room.status = 'playing';
        io.to(room.id).emit('updateRoom', getRoomData(room.id));
      } else if (room.gameType === 'quem_sou_eu') {
        if (room.mode === 'random') {
          const chars = [...(CATEGORIES[room.category] || CATEGORIES['animais'])].sort(() => 0.5 - Math.random());
          
          room.players.forEach((playerId, index) => {
            players[playerId].character = chars[index % chars.length];
            players[playerId].finishTime = null;
          });
          
          room.players = room.players.sort(() => 0.5 - Math.random());
          
          room.startTime = Date.now();
          room.status = 'playing';
          io.to(room.id).emit('updateRoom', getRoomData(room.id));
        } else {
          room.status = 'assigning';
          io.to(room.id).emit('updateRoom', getRoomData(room.id));
        }
      } else if (room.gameType === 'proibido') {
        room.currentRound = 1;
        room.maxRounds = room.maxRounds || 10;
        room.usedQuestions = [];
        room.teamScores = [];
        room.teams = [];
        
        const shuffled = [...room.players].sort(() => 0.5 - Math.random());
        if (shuffled.length < 2) {
          room.teams.push([...shuffled]);
          room.teamScores.push(0);
        } else {
          for (let i = 0; i < shuffled.length; i += 2) {
            if (i === shuffled.length - 3) {
              room.teams.push([shuffled[i], shuffled[i+1], shuffled[i+2]]);
              room.teamScores.push(0);
              break;
            }
            if (i + 1 < shuffled.length) {
              room.teams.push([shuffled[i], shuffled[i+1]]);
              room.teamScores.push(0);
            }
          }
        }
        
        room.currentTeamIndex = 0;
        room.turnStatus = 'waiting'; 
        room.currentWord = null;
        room.turnEndTime = null;
        room.describerIndexByTeam = room.teams.map(() => 0); 
        
        room.startTime = Date.now();
        room.status = 'playing';
        io.to(room.id).emit('updateRoom', getRoomData(room.id));
      } else if (room.gameType === 'duvido') {
        room.currentRound = 1;
        room.maxRounds = room.maxRounds || 10;
        room.usedQuestions = [];
        room.teamScores = [];
        room.teams = [];
        
        const shuffled = [...room.players].sort(() => 0.5 - Math.random());
        if (shuffled.length < 2) {
          room.teams.push([...shuffled]);
          room.teamScores.push(0);
        } else {
          for (let i = 0; i < shuffled.length; i += 2) {
            if (i === shuffled.length - 3) {
              room.teams.push([shuffled[i], shuffled[i+1], shuffled[i+2]]);
              room.teamScores.push(0);
              break;
            }
            if (i + 1 < shuffled.length) {
              room.teams.push([shuffled[i], shuffled[i+1]]);
              room.teamScores.push(0);
            }
          }
        }
        
        room.rolesByTeam = room.teams.map(team => {
          if (team.length === 3) return { bettors: [team[0], team[1]], guessers: [team[2]] };
          if (team.length === 2) return { bettors: [team[0]], guessers: [team[1]] };
          return { bettors: [team[0]], guessers: [] };
        });
        
        room.duvidoState = 'betting';
        room.currentBet = 0;
        room.turnTeamIndex = 0;
        room.highestBidderTeamIndex = null;
        room.doubtingTeamIndex = null;
        
        room.currentQuestion = getNextQuestion('duvido', PERGUNTAS_DUVIDO, null);
        
        room.startTime = Date.now();
        room.status = 'playing';
        io.to(room.id).emit('updateRoom', getRoomData(room.id));
      }
    }
  });

  socket.on('submitCharacter', ({ character }) => {
    const sessionId = socketIdToSessionId[socket.id];
    const player = players[sessionId];
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
    const sessionId = socketIdToSessionId[socket.id];
    const player = players[sessionId];
    if (player && rooms[player.roomId] && rooms[player.roomId].status === 'playing' && rooms[player.roomId].gameType === 'impostor') {
      const room = rooms[player.roomId];
      // Impostor não vota
      if (sessionId === room.impostorId) return;
      
      room.votes[sessionId] = targetId;
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
    const sessionId = socketIdToSessionId[socket.id];
    const player = players[sessionId];
    if (player && rooms[player.roomId] && rooms[player.roomId].status === 'playing' && rooms[player.roomId].gameType === 'impostor') {
      const room = rooms[player.roomId];
      if (sessionId !== room.impostorId) return; // Apenas impostor pode chutar
      
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

  socket.on('submitPalpite', ({ guess }) => {
    const sessionId = socketIdToSessionId[socket.id];
    const player = players[sessionId];
    if (player && rooms[player.roomId] && rooms[player.roomId].status === 'playing' && rooms[player.roomId].gameType === 'palpite') {
      const room = rooms[player.roomId];
      
      const numGuess = Number(guess);
      if (isNaN(numGuess)) return;
      
      room.palpites[sessionId] = {
        guess: numGuess,
        diff: Math.abs(numGuess - room.currentPalpite.answer),
        pointsEarned: 0
      };
      player.hasSubmittedPalpite = true;
      
      if (Object.keys(room.palpites).length === room.players.length) {
        room.status = 'palpite_results';
        
        const sortedPalpites = Object.entries(room.palpites)
          .sort((a, b) => a[1].diff - b[1].diff);
          
        let currentRank = 0;
        let lastDiff = -1;
        const pointsAvailable = [100, 50, 20];
        let currentPointsIndex = 0;
        
        sortedPalpites.forEach(([pId, palpiteData], index) => {
          if (palpiteData.diff !== lastDiff) {
            currentRank++;
            if (index > 0) currentPointsIndex = index;
          }
          lastDiff = palpiteData.diff;
          
          if (currentPointsIndex < pointsAvailable.length) {
            palpiteData.pointsEarned = pointsAvailable[currentPointsIndex];
            players[pId].score += palpiteData.pointsEarned;
          }
          palpiteData.rank = currentRank;
        });
        
        room.sortedPalpites = sortedPalpites.map(([pId, data]) => ({ pId, ...data }));
      }
      io.to(room.id).emit('updateRoom', getRoomData(room.id));
    }
  });

  socket.on('nextPalpiteRound', () => {
    const sessionId = socketIdToSessionId[socket.id];
    const player = players[sessionId];
    if (player && rooms[player.roomId] && rooms[player.roomId].host === sessionId) {
      const room = rooms[player.roomId];
      
      if (room.currentRound < room.maxRounds) {
        room.currentRound++;
        
        // Zera o registro se todas as perguntas esgotarem
        let newQuestion = getNextQuestion('palpite', PERGUNTAS_PALPITE, 'question');
        room.palpites = {};
        room.sortedPalpites = null;
        room.players.forEach(pId => {
          players[pId].hasSubmittedPalpite = false;
        });
        room.status = 'playing';
        io.to(room.id).emit('updateRoom', getRoomData(room.id));
      } else {
        room.status = 'finished';
        room.sortedPalpites = null;
        io.to(room.id).emit('updateRoom', getRoomData(room.id));
      }
    }
  });

  socket.on('nextQuestion', () => {
    const sessionId = socketIdToSessionId[socket.id];
    const player = players[sessionId];
    if (player && rooms[player.roomId] && rooms[player.roomId].host === sessionId && rooms[player.roomId].status === 'playing') {
      const room = rooms[player.roomId];
      if (room.gameType === 'impostor' && room.discussionType === 'perguntas') {
        // Zera o registro se todas as perguntas esgotarem
        if (room.usedQuestions.length >= PERGUNTAS_IMPOSTOR.length) {
          room.usedQuestions = [];
        }
        
        let newQuestion;
        let attempts = 0;
        do {
          newQuestion = PERGUNTAS_IMPOSTOR[Math.floor(Math.random() * PERGUNTAS_IMPOSTOR.length)];
          attempts++;
        } while (room.usedQuestions.includes(newQuestion) && attempts < 100);
        
        room.currentQuestion = newQuestion;
        room.usedQuestions.push(newQuestion);
        io.to(room.id).emit('updateRoom', getRoomData(room.id));
      }
    }
  });

  socket.on('guessCorrect', ({ playerId }) => {
    // Quando alguém adivinha corretamente
    // O anfitrião ou o próprio jogador pode acionar isso
    const sessionId = socketIdToSessionId[socket.id];
    const player = players[sessionId];
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
    const sessionId = socketIdToSessionId[socket.id];
    const player = players[sessionId];
    if (player && rooms[player.roomId] && rooms[player.roomId].host === sessionId) {
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

  
  socket.on('startProibidoTurn', () => {
    const sessionId = socketIdToSessionId[socket.id];
    const player = players[sessionId];
    if (player && rooms[player.roomId] && rooms[player.roomId].gameType === 'proibido') {
      const room = rooms[player.roomId];
      if (room.turnStatus === 'waiting') {
        room.turnStatus = 'playing';
        room.turnEndTime = Date.now() + 60000;
        
        room.currentWord = getNextQuestion('proibido', PERGUNTAS_PROIBIDO, 'word');
        
        io.to(room.id).emit('updateRoom', getRoomData(room.id));
      }
    }
  });

  socket.on('proibidoCorrectGuess', () => {
    const sessionId = socketIdToSessionId[socket.id];
    const player = players[sessionId];
    if (player && rooms[player.roomId] && rooms[player.roomId].gameType === 'proibido') {
      const room = rooms[player.roomId];
      if (room.turnStatus === 'playing') {
        room.teamScores[room.currentTeamIndex] += 10;
        
        room.currentWord = getNextQuestion('proibido', PERGUNTAS_PROIBIDO, 'word');
        
        io.to(room.id).emit('updateRoom', getRoomData(room.id));
      }
    }
  });

  socket.on('nextProibidoTurn', () => {
    const sessionId = socketIdToSessionId[socket.id];
    const player = players[sessionId];
    if (player && rooms[player.roomId] && rooms[player.roomId].gameType === 'proibido') {
      const room = rooms[player.roomId];
      
      // Passa a vez
      room.turnStatus = 'waiting';
      room.currentWord = null;
      room.turnEndTime = null;
      
      // Atualiza quem vai descrever na próxima vez que essa equipe jogar
      const currentTeam = room.teams[room.currentTeamIndex];
      room.describerIndexByTeam[room.currentTeamIndex] = (room.describerIndexByTeam[room.currentTeamIndex] + 1) % currentTeam.length;
      
      room.currentTeamIndex++;
      
      if (room.currentTeamIndex >= room.teams.length) {
        room.currentTeamIndex = 0;
        room.currentRound++;
        if (room.currentRound > room.maxRounds) {
          room.status = 'finished';
        }
      }
      
      io.to(room.id).emit('updateRoom', getRoomData(room.id));
    }
  });

  socket.on('skipProibidoWord', () => {
    const sessionId = socketIdToSessionId[socket.id];
    const player = players[sessionId];
    if (player && rooms[player.roomId] && rooms[player.roomId].gameType === 'proibido') {
      const room = rooms[player.roomId];
      if (room.turnStatus === 'playing') {
        room.currentWord = getNextQuestion('proibido', PERGUNTAS_PROIBIDO, 'word');
        
        io.to(room.id).emit('updateRoom', getRoomData(room.id));
      }
    }
  });

  
  socket.on('placeDuvidoBet', ({ bet }) => {
    const sessionId = socketIdToSessionId[socket.id];
    const player = players[sessionId];
    if (player && rooms[player.roomId] && rooms[player.roomId].gameType === 'duvido') {
      const room = rooms[player.roomId];
      if (room.duvidoState === 'betting' && room.turnTeamIndex !== null && room.teams[room.turnTeamIndex].includes(sessionId)) {
        if (bet > room.currentBet) {
          room.currentBet = bet;
          room.highestBidderTeamIndex = room.turnTeamIndex;
          
          room.turnTeamIndex = (room.turnTeamIndex + 1) % room.teams.length;
          // If turn gets back to the only bidder, they win the bid immediately?
          // No, usually they keep betting against someone else. But if it's 2 teams, turn passes.
          
          io.to(room.id).emit('updateRoom', getRoomData(room.id));
        }
      }
    }
  });

  socket.on('callDuvido', () => {
    const sessionId = socketIdToSessionId[socket.id];
    const player = players[sessionId];
    if (player && rooms[player.roomId] && rooms[player.roomId].gameType === 'duvido') {
      const room = rooms[player.roomId];
      if (room.duvidoState === 'betting' && room.turnTeamIndex !== null && room.teams[room.turnTeamIndex].includes(sessionId)) {
        if (room.currentBet > 0 && room.highestBidderTeamIndex !== null) {
          room.doubtingTeamIndex = room.turnTeamIndex;
          room.duvidoState = 'answering';
          room.turnEndTime = Date.now() + 60000;
          io.to(room.id).emit('updateRoom', getRoomData(room.id));
        }
      }
    }
  });

  socket.on('duvidoChallengeResult', ({ success }) => {
    const sessionId = socketIdToSessionId[socket.id];
    const player = players[sessionId];
    if (player && rooms[player.roomId] && rooms[player.roomId].gameType === 'duvido') {
      const room = rooms[player.roomId];
      if (room.duvidoState === 'answering') {
        if (success) {
          room.teamScores[room.highestBidderTeamIndex] += 10;
        } else {
          room.teamScores[room.doubtingTeamIndex] += 10;
        }
        
        // Next round setup
        room.currentRound++;
        if (room.currentRound > room.maxRounds) {
          room.status = 'finished';
        } else {
          // Swap roles
          room.rolesByTeam = room.rolesByTeam.map(roles => {
            return { bettors: roles.guessers, guessers: roles.bettors };
          });
          
          room.duvidoState = 'betting';
          room.currentBet = 0;
          room.highestBidderTeamIndex = null;
          room.doubtingTeamIndex = null;
          room.turnTeamIndex = room.currentRound % room.teams.length; // Shift who starts
          room.turnEndTime = null;
          
          room.currentQuestion = getNextQuestion('duvido', PERGUNTAS_DUVIDO, null);
        }
        
        io.to(room.id).emit('updateRoom', getRoomData(room.id));
      }
    }
  });

  socket.on('disconnect', () => {
    handlePlayerLeave(socket);
  });

  socket.on('reconnectRoom', ({ roomId, sessionId }) => {
    roomId = roomId?.trim().toUpperCase();
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
          // Jogo já começou, apenas marca como desconectado
          player.connected = false;
          io.to(roomId).emit('updateRoom', getRoomData(roomId));
        }
      }
    }
    delete socketIdToSessionId[socket.id];
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
          finishTime: p.finishTime,
          hasSubmittedPalpite: p.hasSubmittedPalpite,
          votedFor: p.votedFor,
          connected: p.connected
        };
      })
    };
  }
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
