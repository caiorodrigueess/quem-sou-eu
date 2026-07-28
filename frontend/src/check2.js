import React, { useState, useEffect } from 'react';
import { socket } from './socket';
import { Users, Crown, Play, Hash, Check, Trophy, Timer } from 'lucide-react';

function App() {
  const [view, setView] = useState('home'); // home, lobby, assigning, playing, finished, voting_results
  const [gameType, setGameType] = useState(''); // 'quem_sou_eu' ou 'impostor'
  const [name, setName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [mode, setMode] = useState('random');
  const [discussionType, setDiscussionType] = useState('livre');
  const [category, setCategory] = useState('animais');
  const [maxRounds, setMaxRounds] = useState(10);
  const [palpiteGuess, setPalpiteGuess] = useState('');
  
  const [roomData, setRoomData] = useState(null);
  const [sessionId] = useState(() => {
    let id = localStorage.getItem('sessionId');
    if (!id) {
      id = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      localStorage.setItem('sessionId', id);
    }
    return id;
  });
  const [myId, setMyId] = useState('');
  const [suggestedChar, setSuggestedChar] = useState('');
  const [tick, setTick] = useState(0);
  const [betInput, setBetInput] = useState('');
  const [notaAnswer, setNotaAnswer] = useState('');

  useEffect(() => {
    if (view === 'playing') {
      const timer = setInterval(() => setTick(t => t + 1), 1000);
      return () => clearInterval(timer);
    }
  }, [view]);

  useEffect(() => {
    const savedRoomId = localStorage.getItem('roomId');
    if (savedRoomId && sessionId) {
      socket.emit('reconnectRoom', { roomId: savedRoomId, sessionId });
    }

    socket.on('connect', () => {
      setMyId(sessionId);
    });

    socket.on('roomCreated', (id) => {
      setRoomCode(id);
      localStorage.setItem('roomId', id);
      setView('lobby');
    });

    socket.on('roomJoined', (id) => {
      setRoomCode(id);
      localStorage.setItem('roomId', id);
      setView('lobby');
    });

    socket.on('updateRoom', (data) => {
      setRoomData(data);
      if (data.status === 'lobby') setView('lobby');
      if (data.status === 'assigning') setView('assigning');
      if (data.status === 'playing') setView('playing');
      if (data.status === 'finished') setView('finished');
      if (data.status === 'voting_results') setView('voting_results');
      if (data.status === 'palpite_results') setView('palpite_results');
    });

    socket.on('reconnectFailed', () => {
      localStorage.removeItem('roomId');
      setView('home');
    });

    socket.on('error', (msg) => {
      alert(msg);
    });
    
    socket.on('playerGuessed', ({ name }) => {
      // Opcional: mostrar toast
      console.log(`${name} pontuou!`);
    });

    return () => {
      socket.off('connect');
      socket.off('roomCreated');
      socket.off('roomJoined');
      socket.off('updateRoom');
      socket.off('error');
      socket.off('playerGuessed');
      socket.off('reconnectFailed');
    };
  }, []);

  const handleCreateRoom = (e) => {
    e.preventDefault();
    if (!name) return alert('Digite seu nome!');
    socket.emit('createRoom', { name, mode, category, gameType, discussionType, maxRounds, sessionId });
  };

  const handleJoinRoom = (e) => {
    e.preventDefault();
    if (!name || !roomCode) return alert('Digite seu nome e o código da sala!');
    socket.emit('joinRoom', { name, roomId: roomCode.trim(), sessionId });
  };

  const handleStartGame = () => {
    socket.emit('startGame');
  };

  const handleSubmitChar = (e) => {
    e.preventDefault();
    if (!suggestedChar) return;
    socket.emit('submitCharacter', { character: suggestedChar });
  };

  const handleCorrectGuess = (playerId) => {
    socket.emit('guessCorrect', { playerId });
  };

  const handleRestartGame = () => {
    socket.emit('restartGame');
  };

  const handleLeaveRoom = () => {
    socket.emit('leaveRoom');
    localStorage.removeItem('roomId');
    setView('home');
    setGameType('');
    setRoomData(null);
    setRoomCode('');
    setSuggestedChar('');
  };

  const [voteTarget, setVoteTarget] = useState('');
  const [showVoteModal, setShowVoteModal] = useState(false);
  const [guessWord, setGuessWord] = useState('');
  
  const submitVote = () => {
    if (!voteTarget) return alert('Selecione um jogador!');
    socket.emit('submitVote', { targetId: voteTarget });
    setShowVoteModal(false);
  };
  
  const submitImpostorGuess = () => {
    if (!guessWord) return;
    socket.emit('guessImpostorWord', { word: guessWord });
  };
  
  const handleNextQuestion = () => {
    socket.emit('nextQuestion');
  };

  const submitPalpite = () => {
    if (!palpiteGuess) return;
    socket.emit('submitPalpite', { guess: palpiteGuess });
  };
  
  const handleNextPalpiteRound = () => {
    socket.emit('nextPalpiteRound');
  };

  if (view === 'home') {
    if (!gameType) {
      return (
        <div className="container" style={{ maxWidth: '900px', display: 'flex', gap: '2rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <div className="glass-panel" style={{ textAlign: 'center', flex: '1 1 300px' }}>
            <h2>Criar Nova Partida 🎮</h2>
            <div style={{ display: 'flex', gap: '1rem', flexDirection: 'column', marginTop: '1.5rem' }}>
              <button onClick={() => { setGameType('quem_sou_eu'); setMode('random'); }} style={{ padding: '1rem', fontSize: '1.1rem' }}>
                🤔 Quem Sou Eu?
              </button>
              <button onClick={() => { setGameType('impostor'); setMode('cego'); }} style={{ padding: '1rem', fontSize: '1.1rem', background: 'linear-gradient(135deg, #ef4444, #b91c1c)' }}>
                🕵️ Impostor
              </button>
              <button onClick={() => { setGameType('palpite'); setMode('random'); }} style={{ padding: '1rem', fontSize: '1.1rem', background: 'linear-gradient(135deg, #10b981, #047857)' }}>
                🔢 Palpite
              </button>

              <button onClick={() => { setGameType('proibido'); setMode('random'); }} style={{ padding: '1rem', fontSize: '1.1rem', background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
                🚫 Proibido
              </button>

              <button onClick={() => { setGameType('duvido'); setMode('random'); }} style={{ padding: '1rem', fontSize: '1.1rem', background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)' }}>
                🤨 Duvido
              </button>
              <button onClick={() => { setGameType('nota'); setMode('random'); }} style={{ padding: '1rem', fontSize: '1.1rem', background: 'linear-gradient(135deg, #ec4899, #be185d)' }}>
                💯 Nota
              </button>

            </div>
          </div>

          <div className="glass-panel" style={{ flex: '1 1 300px' }}>
            <h3 style={{ textAlign: 'center' }}>Entrar em Sala Existente</h3>
            <form onSubmit={handleJoinRoom} style={{ marginTop: '1.5rem' }}>
              <div className="form-group">
                <label>Seu Nome</label>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Maria" />
              </div>
              <div className="form-group">
                <label>Código da Sala</label>
                <input value={roomCode} onChange={e => setRoomCode(e.target.value)} placeholder="Ex: A1B2" style={{ textTransform: 'uppercase' }} maxLength={6} />
              </div>
              <button type="submit"><Users size={18} style={{ marginRight: '8px', verticalAlign: 'middle' }}/> Entrar na Sala</button>
            </form>
          </div>
        </div>
      );
    }
    
    return (
      <div className="container">
        <div className="glass-panel">
          <div className="flex-row">
            <h1>{gameType === 'nota' ? '💯 Nota' : gameType === 'impostor' ? '🕵️ Impostor' : gameType === 'palpite' ? '🔢 Palpite' : gameType === 'proibido' ? '🚫 Proibido' : gameType === 'duvido' ? '🤨 Duvido' : '🤔 Quem Sou Eu?'}</h1>
            <button onClick={() => setGameType('')} style={{ background: 'transparent', width: 'auto', margin: 0, padding: '0.5rem' }}>Voltar</button>
          </div>
          
          <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '250px' }}>
              <h3>Criar Sala</h3>
              <form onSubmit={handleCreateRoom}>
                <div className="form-group">
                  <label>Seu Nome</label>
                  <input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: João" />
                </div>
                {gameType !== 'palpite' && gameType !== 'proibido' && gameType !== 'duvido' && gameType !== 'nota' && (
                  <div className="form-group">
                    <label>Modo de Jogo</label>
                    <select value={mode} onChange={e => setMode(e.target.value)}>
                      {gameType === 'quem_sou_eu' ? (
                        <>
                          <option value="random">Sorteio Automático</option>
                          <option value="manual">Nós escolhemos!</option>
                        </>
                      ) : (
                        <>
                          <option value="cego">Impostor Cego (Palavras Parecidas)</option>
                          <option value="tradicional">Impostor Tradicional</option>
                        </>
                      )}
                    </select>
                  </div>
                )}
                
                {(gameType === 'palpite' || gameType === 'proibido' || gameType === 'duvido' || gameType === 'nota') && (
                  <div className="form-group">
                    <label>Número de Rodadas</label>
                    <select value={maxRounds} onChange={e => setMaxRounds(Number(e.target.value))}>
                      <option value={10}>10 Rodadas</option>
                      <option value={15}>15 Rodadas</option>
                      <option value={20}>20 Rodadas</option>
                    </select>
                  </div>
                )}
                
                {gameType !== 'palpite' && gameType !== 'proibido' && gameType !== 'duvido' && (mode === 'random' || mode === 'tradicional') && (
                  <div className="form-group">
                    <label>Categoria</label>
                    <select value={category} onChange={e => setCategory(e.target.value)}>
                      <option value="animais">Animais</option>
                      <option value="filmes">Filmes & Séries</option>
                      <option value="celebridades">Celebridades</option>
                    </select>
                  </div>
                )}
                {gameType === 'impostor' && (
                  <div className="form-group">
                    <label>Tipo de Discussão</label>
                    <select value={discussionType} onChange={e => setDiscussionType(e.target.value)}>
                      <option value="livre">Conversa Livre</option>
                      <option value="perguntas">Responder Perguntas</option>
                    </select>
                  </div>
                )}
                <button type="submit"><Crown size={18} style={{ marginRight: '8px', verticalAlign: 'middle' }}/> Criar Sala</button>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'lobby' && roomData) {
    const isHost = roomData.host === myId;
    return (
      <div className="container">
        <div className="glass-panel">
          <div className="flex-row">
            <h2>Sala: {roomData.id} <Hash size={24} style={{ verticalAlign: 'middle', color: 'var(--secondary)' }}/></h2>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <div className="badge">{roomData.mode === 'random' ? 'Modo: Automático' : 'Modo: Manual'}</div>
              <button onClick={handleLeaveRoom} style={{ padding: '0.5rem 1rem', margin: 0, background: 'transparent', border: '1px solid #ef4444', color: '#ef4444' }}>Sair</button>
            </div>
          </div>
          
          <h3>Jogadores na Sala ({roomData.playersData.length})</h3>
          <ul className="lobby-list">
            {roomData.playersData.map(p => (
              <li key={p.id}>
                <span>{p.name} {p.connected === false ? '(Off)' : ''} {p.id === roomData.host ? '👑' : ''} {p.id === myId ? '(Você)' : ''}</span>
              </li>
            ))}
          </ul>

          {isHost ? (
            <button onClick={handleStartGame} style={{ marginTop: '2rem' }}>
              <Play size={18} style={{ marginRight: '8px', verticalAlign: 'middle' }}/> Iniciar Jogo
            </button>
          ) : (
            <p style={{ textAlign: 'center', marginTop: '2rem', color: 'var(--text-muted)' }}>Aguardando o anfitrião iniciar...</p>
          )}
        </div>
      </div>
    );
  }

  if (view === 'assigning' && roomData) {
    const me = roomData.playersData.find(p => p.id === myId);
    return (
      <div className="container">
        <div className="glass-panel" style={{ textAlign: 'center', position: 'relative' }}>
          <button onClick={handleLeaveRoom} style={{ position: 'absolute', top: '1rem', right: '1rem', padding: '0.5rem 1rem', background: 'transparent', border: '1px solid #ef4444', color: '#ef4444' }}>Sair</button>
          <h2>Escolha um personagem!</h2>
          <p style={{ marginBottom: '2rem', color: 'var(--text-muted)' }}>Escreva o nome de um personagem. Ele será sorteado para outro jogador da sala.</p>
          
          {me?.hasSubmitted ? (
            <div>
              <Check size={48} color="var(--primary)" style={{ margin: '0 auto', display: 'block' }}/>
              <p style={{ marginTop: '1rem' }}>Personagem enviado! Aguardando outros jogadores...</p>
              <ul className="lobby-list" style={{ textAlign: 'left', marginTop: '2rem' }}>
                {roomData.playersData.map(p => (
                  <li key={p.id}>
                    {p.name} {p.connected === false ? '(Off)' : ''} {p.hasSubmitted ? '✅' : '⏳'}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <form onSubmit={handleSubmitChar} style={{ maxWidth: '400px', margin: '0 auto' }}>
              <input 
                value={suggestedChar} 
                onChange={e => setSuggestedChar(e.target.value)} 
                placeholder="Ex: Batman, Faustão..." 
                autoFocus
              />
              <button type="submit">Enviar Personagem</button>
            </form>
          )}
        </div>
      </div>
    );
  }

  if (view === 'playing' && roomData) {
    const isHost = roomData.host === myId;
