import React, { useState, useEffect } from 'react';
import { socket } from './socket';
import { Users, Crown, Play, Hash, Check, Trophy, Timer } from 'lucide-react';

function App() {
  const [view, setView] = useState('home'); // home, lobby, assigning, playing, finished
  const [name, setName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [mode, setMode] = useState('random');
  const [category, setCategory] = useState('animais');
  
  const [roomData, setRoomData] = useState(null);
  const [myId, setMyId] = useState('');
  const [suggestedChar, setSuggestedChar] = useState('');

  useEffect(() => {
    socket.on('connect', () => {
      setMyId(socket.id);
    });

    socket.on('roomCreated', (id) => {
      setRoomCode(id);
      setView('lobby');
    });

    socket.on('roomJoined', (id) => {
      setRoomCode(id);
      setView('lobby');
    });

    socket.on('updateRoom', (data) => {
      setRoomData(data);
      if (data.status === 'lobby') setView('lobby');
      if (data.status === 'assigning') setView('assigning');
      if (data.status === 'playing') setView('playing');
      if (data.status === 'finished') setView('finished');
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
    };
  }, []);

  const handleCreateRoom = (e) => {
    e.preventDefault();
    if (!name) return alert('Digite seu nome!');
    socket.emit('createRoom', { name, mode, category });
  };

  const handleJoinRoom = (e) => {
    e.preventDefault();
    if (!name || !roomCode) return alert('Digite seu nome e o código da sala!');
    socket.emit('joinRoom', { name, roomId: roomCode });
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
    setView('home');
    setRoomData(null);
    setRoomCode('');
    setSuggestedChar('');
  };

  if (view === 'home') {
    return (
      <div className="container">
        <div className="glass-panel">
          <h1>Quem Sou Eu? 🤔</h1>
          
          <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '250px' }}>
              <h3>Criar Sala</h3>
              <form onSubmit={handleCreateRoom}>
                <div className="form-group">
                  <label>Seu Nome</label>
                  <input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: João" />
                </div>
                <div className="form-group">
                  <label>Modo de Jogo</label>
                  <select value={mode} onChange={e => setMode(e.target.value)}>
                    <option value="random">Sorteio Automático</option>
                    <option value="manual">Nós escolhemos!</option>
                  </select>
                </div>
                {mode === 'random' && (
                  <div className="form-group">
                    <label>Categoria</label>
                    <select value={category} onChange={e => setCategory(e.target.value)}>
                      <option value="animais">Animais</option>
                      <option value="filmes">Filmes & Séries</option>
                      <option value="celebridades">Celebridades</option>
                    </select>
                  </div>
                )}
                <button type="submit"><Crown size={18} style={{ marginRight: '8px', verticalAlign: 'middle' }}/> Criar Sala</button>
              </form>
            </div>

            <div style={{ flex: 1, minWidth: '250px', borderLeft: '1px solid var(--glass-border)', paddingLeft: '2rem' }}>
              <h3>Entrar em Sala</h3>
              <form onSubmit={handleJoinRoom}>
                <div className="form-group">
                  <label>Seu Nome</label>
                  <input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Maria" />
                </div>
                <div className="form-group">
                  <label>Código da Sala</label>
                  <input value={roomCode} onChange={e => setRoomCode(e.target.value)} placeholder="Ex: ABCD" style={{ textTransform: 'uppercase' }} maxLength={4} />
                </div>
                <button type="submit" style={{ background: 'var(--bg-card)', border: '1px solid var(--primary)' }}>
                  <Users size={18} style={{ marginRight: '8px', verticalAlign: 'middle' }}/> Entrar
                </button>
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
            <div className="badge">{roomData.mode === 'random' ? 'Modo: Automático' : 'Modo: Manual'}</div>
          </div>
          
          <h3>Jogadores na Sala ({roomData.playersData.length})</h3>
          <ul className="lobby-list">
            {roomData.playersData.map(p => (
              <li key={p.id}>
                <span>{p.name} {p.id === roomData.host ? '👑' : ''} {p.id === myId ? '(Você)' : ''}</span>
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
        <div className="glass-panel" style={{ textAlign: 'center' }}>
          <h2>Escolha um personagem!</h2>
          <p style={{ marginBottom: '2rem', color: 'var(--text-muted)' }}>Escreva o nome de um personagem. Ele será sorteado para outro jogador da sala.</p>
          
          {me?.hasSubmitted ? (
            <div>
              <Check size={48} color="var(--primary)" style={{ margin: '0 auto', display: 'block' }}/>
              <p style={{ marginTop: '1rem' }}>Personagem enviado! Aguardando outros jogadores...</p>
              <ul className="lobby-list" style={{ textAlign: 'left', marginTop: '2rem' }}>
                {roomData.playersData.map(p => (
                  <li key={p.id}>
                    {p.name} {p.hasSubmitted ? '✅' : '⏳'}
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
    return (
      <div className="container" style={{ maxWidth: '1000px' }}>
        <div className="flex-row">
          <h2>Sala: {roomData.id}</h2>
        </div>
        
        <div className="players-grid">
          {roomData.playersData.map((p, index) => {
            const isMe = p.id === myId;
            return (
              <div key={p.id} className={`player-card ${isMe ? 'my-card' : ''}`}>
                <div className="score">{p.score}</div>
                <div className="player-name">{p.name} {p.id === roomData.host ? '👑' : ''} {isMe ? '(Você)' : ''}</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--secondary)', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                  {index === 0 ? '🎯 1º a jogar' : `${index + 1}º a jogar`}
                </div>
                
                <div className="player-character">
                  {p.character}
                </div>
                
                {!p.finishTime ? (
                  isHost && (
                    <button className="correct-btn" onClick={() => handleCorrectGuess(p.id)}>
                      +10 Pontos (Acertou)
                    </button>
                  )
                ) : (
                  <div style={{ marginTop: '1rem', color: '#10b981', fontWeight: 'bold' }}>
                    <Check size={18} style={{ verticalAlign: 'middle', marginRight: '5px' }}/>
                    Terminou!
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (view === 'finished' && roomData) {
    // Math.max can return -Infinity if array is empty, but playersData shouldn't be empty
    const finishTimes = roomData.playersData.map(p => p.finishTime).filter(t => t);
    const maxTime = finishTimes.length ? Math.max(...finishTimes) : Date.now();
    const totalTime = Math.round((maxTime - roomData.startTime) / 1000);
    const sortedPlayers = [...roomData.playersData].sort((a, b) => ((a.finishTime || Infinity) - (b.finishTime || Infinity)));
    
    return (
      <div className="container">
        <div className="glass-panel" style={{ textAlign: 'center' }}>
          <h2><Trophy size={32} style={{ verticalAlign: 'middle', color: '#fbbf24' }}/> Resumo do Jogo</h2>
          <p style={{ fontSize: '1.2rem', marginBottom: '2rem', color: 'var(--text-muted)' }}>Tempo Total da Partida: {totalTime} segundos</p>
          
          <ul className="lobby-list" style={{ textAlign: 'left' }}>
            {sortedPlayers.map((p, index) => {
              const timeTaken = p.finishTime ? Math.round((p.finishTime - roomData.startTime) / 1000) : 'N/A';
              return (
                <li key={p.id}>
                  <span><strong>#{index + 1} {p.name}</strong></span>
                  <span style={{ color: 'var(--secondary)' }}>
                    <Timer size={16} style={{ verticalAlign: 'text-bottom', marginRight: '5px' }}/> 
                    {timeTaken}s (Era: {p.character})
                  </span>
                </li>
              );
            })}
          </ul>
          
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '2rem', flexWrap: 'wrap' }}>
            {roomData.host === myId ? (
              <button onClick={handleRestartGame} style={{ background: 'linear-gradient(135deg, #10b981, #059669)', margin: 0, flex: 1, minWidth: '200px' }}>
                <Play size={18} style={{ verticalAlign: 'middle', marginRight: '8px' }}/> Nova Rodada
              </button>
            ) : (
              <p style={{ color: 'var(--text-muted)', flex: '1 1 100%', marginBottom: '1rem' }}>Aguardando anfitrião para uma nova rodada...</p>
            )}
            <button onClick={handleLeaveRoom} style={{ background: 'rgba(236, 72, 153, 0.1)', border: '1px solid var(--secondary)', margin: 0, flex: 1, minWidth: '200px' }}>
              Sair da Sala
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

export default App;
