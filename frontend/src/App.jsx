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
      if (data.status === 'voting_results') setView('voting_results');
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
    socket.emit('createRoom', { name, mode, category, gameType, discussionType });
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

  if (view === 'home') {
    if (!gameType) {
      return (
        <div className="container">
          <div className="glass-panel" style={{ textAlign: 'center' }}>
            <h1>Escolha o Jogo 🎮</h1>
            <div style={{ display: 'flex', gap: '1rem', flexDirection: 'column', marginTop: '2rem' }}>
              <button onClick={() => { setGameType('quem_sou_eu'); setMode('random'); }} style={{ padding: '1.5rem', fontSize: '1.2rem' }}>
                🤔 Quem Sou Eu?
              </button>
              <button onClick={() => { setGameType('impostor'); setMode('cego'); }} style={{ padding: '1.5rem', fontSize: '1.2rem', background: 'linear-gradient(135deg, #ef4444, #b91c1c)' }}>
                🕵️ Impostor
              </button>
            </div>
          </div>
        </div>
      );
    }
    
    return (
      <div className="container">
        <div className="glass-panel">
          <div className="flex-row">
            <h1>{gameType === 'impostor' ? '🕵️ Impostor' : '🤔 Quem Sou Eu?'}</h1>
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
                {(mode === 'random' || mode === 'tradicional') && (
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
    
    if (roomData.gameType === 'impostor') {
      const myData = roomData.playersData.find(p => p.id === myId);
      const iAmImpostor = myId === roomData.impostorId;
      
      return (
        <div className="container" style={{ maxWidth: '800px', textAlign: 'center' }}>
          <h2>Sala: {roomData.id}</h2>
          
          <div className="glass-panel" style={{ marginTop: '2rem', padding: '3rem 1rem' }}>
            {roomData.currentQuestion && (
              <div style={{ marginBottom: '2rem', padding: '1.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', border: '1px dashed var(--secondary)' }}>
                <h4 style={{ color: 'var(--secondary)', marginBottom: '0.5rem' }}>Pergunta da Rodada:</h4>
                <p style={{ fontSize: '1.3rem', fontWeight: 'bold' }}>"{roomData.currentQuestion}"</p>
              </div>
            )}
            
            <h3 style={{ color: 'var(--text-muted)' }}>{iAmImpostor && roomData.mode === 'tradicional' ? 'Seu Papel:' : 'Sua Palavra:'}</h3>
            <div style={{ fontSize: '3rem', fontWeight: 'bold', color: iAmImpostor && roomData.mode === 'tradicional' ? '#ef4444' : 'var(--primary)', margin: '1rem 0' }}>
              {myData?.character}
            </div>
            
            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
              Descubra quem tem a palavra diferente conversando com o grupo!
            </p>
            
            {!iAmImpostor && !myData?.votedFor && (
              <button onClick={() => setShowVoteModal(true)} style={{ maxWidth: '300px', margin: '0 auto' }}>
                Votar no Impostor
              </button>
            )}
            
            {!iAmImpostor && myData?.votedFor && (
              <p style={{ color: '#10b981', fontWeight: 'bold' }}>Voto registrado! Aguardando os outros...</p>
            )}
            
            {iAmImpostor && (
              <p style={{ color: '#fbbf24', fontWeight: 'bold' }}>Tente disfarçar! Os outros tentarão te descobrir.</p>
            )}
            
            {iAmImpostor && roomData.mode === 'tradicional' && (
              <div style={{ marginTop: '2rem', borderTop: '1px solid var(--glass-border)', paddingTop: '2rem' }}>
                <p>Já sabe qual é a palavra deles?</p>
                <div style={{ display: 'flex', gap: '1rem', maxWidth: '400px', margin: '1rem auto 0' }}>
                  <input 
                    value={guessWord} 
                    onChange={e => setGuessWord(e.target.value)} 
                    placeholder="Digite a palavra secreta..."
                  />
                  <button onClick={submitImpostorGuess} style={{ margin: 0, width: 'auto' }}>Chutar</button>
                </div>
              </div>
            )}
            
            <div style={{ marginTop: '3rem', paddingTop: '1rem', borderTop: '1px solid var(--glass-border)', textAlign: 'left' }}>
              <h4 style={{ color: 'var(--text-muted)', marginBottom: '1rem', textAlign: 'center' }}>Ordem de Jogada (Sorteada):</h4>
              <ul style={{ listStyle: 'none', display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'center' }}>
                {roomData.playersData.map((p, index) => (
                  <li key={p.id} style={{ background: 'var(--bg-card)', padding: '0.5rem 1rem', borderRadius: '20px', border: index === 0 ? '1px solid var(--primary)' : '1px solid var(--glass-border)', opacity: p.votedFor ? 0.5 : 1 }}>
                    <span style={{ fontWeight: 'bold', marginRight: '0.5rem', color: index === 0 ? 'var(--primary)' : 'inherit' }}>{index + 1}º</span> {p.name} {p.id === myId ? '(Você)' : ''} {p.votedFor ? '✅' : ''}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          
          {showVoteModal && (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
              <div className="glass-panel" style={{ width: '90%', maxWidth: '400px' }}>
                <h2>Quem é o Impostor?</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', margin: '2rem 0' }}>
                  {roomData.playersData.filter(p => p.id !== myId).map(p => (
                    <button 
                      key={p.id} 
                      onClick={() => setVoteTarget(p.id)}
                      style={{ 
                        background: voteTarget === p.id ? 'var(--primary)' : 'rgba(255,255,255,0.1)',
                        border: '1px solid var(--glass-border)'
                      }}
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button onClick={() => setShowVoteModal(false)} style={{ background: 'transparent', border: '1px solid var(--secondary)', margin: 0 }}>Cancelar</button>
                  <button onClick={submitVote} style={{ margin: 0 }}>Confirmar Voto</button>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }

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
                      Marcar Acerto
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

  if (view === 'voting_results' && roomData) {
    const isHost = roomData.host === myId;
    const impostorPlayer = roomData.playersData.find(p => p.id === roomData.impostorId);
    const impostorName = impostorPlayer?.name || 'Desconhecido';
    
    return (
      <div className="container" style={{ textAlign: 'center' }}>
        <div className="glass-panel">
          <h1>Fim de Jogo!</h1>
          
          <div style={{ margin: '2rem 0' }}>
            <h2 style={{ color: roomData.impostorCaught ? '#10b981' : '#ef4444' }}>
              {roomData.impostorCaught ? 'Tripulantes Venceram!' : 'O Impostor Venceu!'}
            </h2>
            <p style={{ fontSize: '1.2rem', marginTop: '1rem' }}>
              O impostor era: <strong>{impostorName}</strong>
            </p>
            {roomData.secretWord && (
              <p style={{ fontSize: '1.2rem' }}>
                A palavra secreta era: <strong>{roomData.secretWord}</strong>
              </p>
            )}
            {roomData.impostorGuessed && (
              <p style={{ fontSize: '1.2rem', marginTop: '1rem', color: '#fbbf24' }}>
                O impostor chutou a palavra "{roomData.impostorGuessed.word}" e {roomData.impostorGuessed.isCorrect ? 'acertou!' : 'errou!'}
              </p>
            )}
          </div>
          
          {roomData.voteTally && (
            <div style={{ margin: '2rem 0', background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '10px' }}>
              <h3>Votos Recebidos</h3>
              <ul style={{ listStyle: 'none', marginTop: '1rem' }}>
                {Object.entries(roomData.voteTally).map(([vId, count]) => {
                  const pName = roomData.playersData.find(p => p.id === vId)?.name || 'Desconhecido';
                  return (
                    <li key={vId} style={{ marginBottom: '0.5rem', fontSize: '1.1rem' }}>
                      <strong>{pName}:</strong> {count} voto(s) {vId === roomData.impostorId ? '😈' : ''}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
          
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '2rem', flexWrap: 'wrap' }}>
            {isHost ? (
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
