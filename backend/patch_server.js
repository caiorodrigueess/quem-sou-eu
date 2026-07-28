const fs = require('fs');

let serverCode = fs.readFileSync('server.js', 'utf8');

// 1. Add PERGUNTAS_NOTA
serverCode = serverCode.replace(
  "let PERGUNTAS_PALPITE = [];",
  "let PERGUNTAS_PALPITE = [];\nlet PERGUNTAS_NOTA = [];"
);

serverCode = serverCode.replace(
  "PERGUNTAS_PALPITE = data.palpite || [];",
  "PERGUNTAS_PALPITE = data.palpite || [];\n    PERGUNTAS_NOTA = data.nota || [];"
);

// 2. Add 'nota' branch to startGame
const palpiteBranch = `      if (room.gameType === 'palpite') {`;
const notaBranch = `      if (room.gameType === 'nota') {
        room.currentRound = 1;
        room.maxRounds = room.maxRounds || 10;
        room.usedQuestions = [];
        room.turnIndex = 0;
        room.notaState = 'answering';
        room.currentNota = Math.floor(Math.random() * 10) + 1;
        room.currentQuestion = getNextQuestion('nota', PERGUNTAS_NOTA, null);
        room.notaAnswer = '';
        room.notaGuesses = {};
        
        room.players.forEach(pId => {
          players[pId].hasSubmittedNotaGuess = false;
        });
        
        room.startTime = Date.now();
        room.status = 'playing';
        io.to(room.id).emit('updateRoom', getRoomData(room.id));
      } else if (room.gameType === 'palpite') {`;

serverCode = serverCode.replace(palpiteBranch, notaBranch);

// 3. Add socket events for nota
const disconnectEvent = `  socket.on('disconnect', () => {`;
const notaEvents = `
  socket.on('submitNotaAnswer', ({ answer }) => {
    const sessionId = socketIdToSessionId[socket.id];
    const player = players[sessionId];
    if (player && rooms[player.roomId] && rooms[player.roomId].gameType === 'nota') {
      const room = rooms[player.roomId];
      const avaliadorId = room.players[room.turnIndex % room.players.length];
      if (sessionId === avaliadorId && room.notaState === 'answering') {
        room.notaAnswer = answer;
        room.notaState = 'guessing';
        io.to(room.id).emit('updateRoom', getRoomData(room.id));
      }
    }
  });

  socket.on('submitNotaGuess', ({ guess }) => {
    const sessionId = socketIdToSessionId[socket.id];
    const player = players[sessionId];
    if (player && rooms[player.roomId] && rooms[player.roomId].gameType === 'nota') {
      const room = rooms[player.roomId];
      const avaliadorId = room.players[room.turnIndex % room.players.length];
      
      if (room.notaState === 'guessing' && sessionId !== avaliadorId && !room.notaGuesses[sessionId]) {
        room.notaGuesses[sessionId] = guess;
        player.hasSubmittedNotaGuess = true;
        
        const totalGuessers = room.players.length - 1;
        const totalSubmitted = Object.keys(room.notaGuesses).length;
        
        if (totalSubmitted >= totalGuessers) {
          room.notaState = 'revealed';
          
          let correctCount = 0;
          Object.keys(room.notaGuesses).forEach(pId => {
            if (room.notaGuesses[pId] === room.currentNota) {
              players[pId].score += 10;
              correctCount++;
            }
          });
          players[avaliadorId].score += (correctCount * 10);
        }
        io.to(room.id).emit('updateRoom', getRoomData(room.id));
      }
    }
  });

  socket.on('nextNotaRound', () => {
    const sessionId = socketIdToSessionId[socket.id];
    const player = players[sessionId];
    if (player && rooms[player.roomId] && rooms[player.roomId].gameType === 'nota') {
      const room = rooms[player.roomId];
      const avaliadorId = room.players[room.turnIndex % room.players.length];
      
      if (room.notaState === 'revealed' && sessionId === avaliadorId) {
        room.currentRound++;
        if (room.currentRound > room.maxRounds) {
          room.status = 'finished';
        } else {
          room.turnIndex++;
          room.notaState = 'answering';
          room.currentNota = Math.floor(Math.random() * 10) + 1;
          room.currentQuestion = getNextQuestion('nota', PERGUNTAS_NOTA, null);
          room.notaAnswer = '';
          room.notaGuesses = {};
          
          room.players.forEach(pId => {
            players[pId].hasSubmittedNotaGuess = false;
          });
        }
        io.to(room.id).emit('updateRoom', getRoomData(room.id));
      }
    }
  });

  socket.on('disconnect', () => {`;

serverCode = serverCode.replace(disconnectEvent, notaEvents);

// 4. Update getRoomData
serverCode = serverCode.replace(
  "hasSubmittedPalpite: p.hasSubmittedPalpite,",
  "hasSubmittedPalpite: p.hasSubmittedPalpite,\n          hasSubmittedNotaGuess: p.hasSubmittedNotaGuess,"
);

fs.writeFileSync('server.js', serverCode, 'utf8');
console.log('Patched server.js with nota game mode logic');
