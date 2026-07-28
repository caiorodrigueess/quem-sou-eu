    const isHost = roomData.host === myId;
    
    if (roomData.gameType === 'palpite') {
      const myData = roomData.playersData?.find(p => p.id === myId);
      return (
        <div className="container" style={{ maxWidth: '800px', textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2>Sala: {roomData.id}</h2>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <div className="badge" style={{ background: 'var(--primary)', color: 'white' }}>Rodada {roomData.currentRound} / {roomData.maxRounds}</div>
              <button onClick={handleLeaveRoom} style={{ padding: '0.5rem 1rem', margin: 0, background: 'transparent', border: '1px solid #ef4444', color: '#ef4444' }}>Sair</button>
            </div>
          </div>
          
          <div className="glass-panel" style={{ marginTop: '2rem', padding: '4rem 2rem' }}>
            <h3 style={{ color: 'var(--secondary)', marginBottom: '2rem', fontSize: '1.5rem' }}>Pergunta:</h3>
            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '3rem' }}>
              {roomData.currentPalpite?.question}
            </div>
            
            {!myData?.hasSubmittedPalpite ? (
              <div style={{ maxWidth: '400px', margin: '0 auto' }}>
                <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>Qual o seu palpite exato (apenas números)?</p>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <input 
                    type="number"
                    value={palpiteGuess} 
                    onChange={e => setPalpiteGuess(e.target.value)} 
                    placeholder="Ex: 100"
                    style={{ fontSize: '1.5rem', textAlign: 'center' }}
                  />
                  <button onClick={submitPalpite} style={{ margin: 0, width: 'auto', background: 'var(--primary)' }}>Enviar</button>
                </div>
              </div>
            ) : (
              <div style={{ padding: '2rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '12px', border: '1px solid #10b981' }}>
                <Check size={48} style={{ color: '#10b981', margin: '0 auto 1rem' }} />
                <h3 style={{ color: '#10b981' }}>Palpite Registrado!</h3>
                <p>Aguardando os outros jogadores...</p>
              </div>
            )}
            
            <div style={{ marginTop: '4rem', paddingTop: '2rem', borderTop: '1px solid var(--glass-border)' }}>
              <h4 style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Status dos Jogadores:</h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'center' }}>
                {roomData.playersData.map(p => (
                  <div key={p.id} style={{ 
                    padding: '0.5rem 1rem', 
                    borderRadius: '20px', 
                    background: p.hasSubmittedPalpite ? 'rgba(16, 185, 129, 0.2)' : 'var(--bg-card)',
                    border: p.hasSubmittedPalpite ? '1px solid #10b981' : '1px solid var(--glass-border)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    {p.name} {p.connected === false ? '(Off)' : ''} {p.id === myId ? '(Você)' : ''} {p.hasSubmittedPalpite ? <Check size={16} color="#10b981" /> : <Timer size={16} color="var(--text-muted)" />}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      );
    }
    
    
    if (roomData.gameType === 'proibido') {
      const myData = roomData.playersData.find(p => p.id === myId);
      const isMyTeam = roomData.teams[roomData.currentTeamIndex]?.includes(myId);
      const currentTeam = roomData.teams[roomData.currentTeamIndex];
      const describerId = currentTeam?.[roomData.describerIndexByTeam[roomData.currentTeamIndex]];
      const amIDescriber = myId === describerId;
      const amIGuesser = isMyTeam && !amIDescriber;
      
      const formatTime = (ms) => {
        if (!ms) return '01:00';
        const remaining = Math.max(0, Math.ceil((ms - Date.now()) / 1000));
        const m = Math.floor(remaining / 60).toString().padStart(2, '0');
        const s = (remaining % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
      };
      
      const getPlayerName = (id) => roomData.playersData.find(p => p.id === id)?.name;

      return (
        <div className="container" style={{ maxWidth: '800px', textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2>Sala: {roomData.id}</h2>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <div className="badge" style={{ background: 'var(--primary)', color: 'white' }}>Rodada {roomData.currentRound} / {roomData.maxRounds}</div>
              <button onClick={handleLeaveRoom} style={{ padding: '0.5rem 1rem', margin: 0, background: 'transparent', border: '1px solid #ef4444', color: '#ef4444' }}>Sair</button>
            </div>
          </div>
          
          <div className="glass-panel" style={{ marginTop: '2rem', padding: '3rem 2rem' }}>
            {roomData.turnStatus === 'waiting' ? (
              <div>
                <h3 style={{ color: 'var(--secondary)', marginBottom: '1rem' }}>Aguardando início do turno...</h3>
                <h4 style={{ fontSize: '1.5rem', marginBottom: '2rem' }}>
                  Vez da Equipe {roomData.currentTeamIndex + 1}
                </h4>
                <p style={{ color: 'var(--text-muted)' }}>
                  <strong>{getPlayerName(describerId)}</strong> vai dar as dicas para: 
                  {currentTeam?.filter(id => id !== describerId)?.map(getPlayerName).join(', ')}.
                </p>
                
                {isMyTeam && (
                  <button onClick={() => socket.emit('startProibidoTurn')} style={{ marginTop: '3rem', fontSize: '1.5rem', padding: '1rem 3rem' }}>
                    Iniciar Tempo
                  </button>
                )}
                {!isMyTeam && (
                  <p style={{ marginTop: '3rem', color: 'var(--text-muted)' }}>Aguardando a equipe {roomData.currentTeamIndex + 1} iniciar...</p>
                )}
              </div>
            ) : (
              <div>
                <div style={{ fontSize: '3rem', fontWeight: 'bold', color: 'var(--primary)', margin: '1rem 0' }}>
                  ⏱️ {formatTime(roomData.turnEndTime)}
                </div>
                
                {!amIGuesser ? (
                  <div style={{ marginTop: '2rem' }}>
                    <h3 style={{ color: 'var(--text-muted)' }}>
                      {amIDescriber ? 'Sua Palavra Secreta:' : `Adivinhando: ${getPlayerName(describerId)}`}
                    </h3>
                    <div style={{ fontSize: '3rem', fontWeight: 'bold', margin: '1rem 0', color: 'white' }}>
                      {roomData.currentWord?.word}
                    </div>
                    
                    <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '1.5rem', borderRadius: '12px', border: '1px solid #ef4444', maxWidth: '400px', margin: '0 auto 2rem' }}>
                      <h4 style={{ color: '#ef4444', marginBottom: '1rem' }}>NÃO DIGA:</h4>
                      <ul style={{ listStyle: 'none', padding: 0, fontSize: '1.2rem', fontWeight: 'bold', color: '#ef4444' }}>
                        {roomData.currentWord?.forbidden?.map((f, i) => (
                          <li key={i} style={{ marginBottom: '0.5rem' }}>❌ {f}</li>
                        ))}
                      </ul>
                    </div>
                    
                    {amIDescriber && (
                      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                        <button onClick={() => socket.emit('skipProibidoWord')} style={{ background: 'transparent', border: '1px solid var(--secondary)', margin: 0 }}>Pular</button>
                        <button onClick={() => socket.emit('proibidoCorrectGuess')} style={{ margin: 0, background: '#10b981' }}>Acertou!</button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ marginTop: '2rem' }}>
                    <h3 style={{ color: 'white' }}>Tente adivinhar o que o(a) {getPlayerName(describerId)} está descrevendo!</h3>
                  </div>
                )}
                
                {(isHost || amIDescriber) && (
                  <button onClick={() => socket.emit('nextProibidoTurn')} style={{ marginTop: '3rem', background: 'transparent', border: '1px solid #ef4444', color: '#ef4444', padding: '0.5rem 1rem' }}>
                    Encerrar Turno / Tempo Acabou
                  </button>
                )}
              </div>
            )}
            
            <div style={{ marginTop: '4rem', paddingTop: '2rem', borderTop: '1px solid var(--glass-border)' }}>
              <h4 style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Placar:</h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'center' }}>
                {roomData.teams.map((t, index) => (
                  <div key={index} style={{ 
                    padding: '1rem', 
                    borderRadius: '12px', 
                    background: 'var(--bg-card)',
                    border: index === roomData.currentTeamIndex ? '2px solid var(--primary)' : '1px solid var(--glass-border)',
                  }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>Equipe {index + 1}</div>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                      {t.map(getPlayerName).join(' & ')}
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary)', marginTop: '0.5rem' }}>
                      {roomData.teamScores[index]} pts
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      );
    }

    
    if (roomData.gameType === 'duvido') {
      const myData = roomData.playersData?.find(p => p.id === myId);
      const isMyTeam = roomData.teams[roomData.turnTeamIndex]?.includes(myId);
      
      let myTeamIndex = -1;
      roomData.teams.forEach((t, i) => { if (t.includes(myId)) myTeamIndex = i; });
      
      const amIBettor = myTeamIndex !== -1 && roomData.rolesByTeam[myTeamIndex]?.bettors.includes(myId);
      const amIGuesser = myTeamIndex !== -1 && roomData.rolesByTeam[myTeamIndex]?.guessers.includes(myId);
      
      const isMyTurnToBet = roomData.duvidoState === 'betting' && roomData.turnTeamIndex === myTeamIndex;
      
      const getPlayerName = (id) => roomData.playersData.find(p => p.id === id)?.name;
      
      const formatTime = (ms) => {
        if (!ms) return '01:00';
        const remaining = Math.max(0, Math.ceil((ms - Date.now()) / 1000));
        const m = Math.floor(remaining / 60).toString().padStart(2, '0');
        const s = (remaining % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
      };

      return (
        <div className="container" style={{ maxWidth: '800px', textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2>Sala: {roomData.id}</h2>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <div className="badge" style={{ background: 'var(--primary)', color: 'white' }}>Rodada {roomData.currentRound} / {roomData.maxRounds}</div>
              <button onClick={handleLeaveRoom} style={{ padding: '0.5rem 1rem', margin: 0, background: 'transparent', border: '1px solid #ef4444', color: '#ef4444' }}>Sair</button>
            </div>
          </div>
          
          <div className="glass-panel" style={{ marginTop: '2rem', padding: '3rem 2rem' }}>
            
            {myTeamIndex !== -1 && (
              <div style={{ marginBottom: '2rem', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '12px' }}>
                Você é: <strong>{amIBettor ? 'Apostador 👀' : 'Adivinhador 🙈'}</strong> da Equipe {myTeamIndex + 1}
              </div>
            )}

            {roomData.duvidoState === 'betting' ? (
              <div>
                <h3 style={{ color: 'var(--secondary)', marginBottom: '1rem' }}>Fase de Apostas (Leilão)</h3>
                
                {amIGuesser ? (
                  <div style={{ marginTop: '3rem', padding: '2rem', border: '1px dashed var(--text-muted)', borderRadius: '12px' }}>
                    <h2 style={{ color: 'var(--text-muted)' }}>Você está às cegas! 🙈</h2>
                    <p>Aguarde enquanto os apostadores debatem sobre a pergunta da rodada...</p>
                  </div>
                ) : (
                  <div style={{ marginTop: '2rem' }}>
                    <h4 style={{ color: 'var(--text-muted)' }}>Pergunta da Rodada:</h4>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', margin: '1rem 0', color: 'white' }}>
                      {roomData.currentQuestion}
                    </div>
                  </div>
                )}
                
                <div style={{ margin: '3rem 0', padding: '1.5rem', background: 'var(--bg-card)', borderRadius: '12px' }}>
                  <h3 style={{ color: '#fbbf24' }}>
                    Aposta Atual: {roomData.currentBet > 0 ? `${roomData.currentBet} itens` : 'Nenhuma aposta ainda'}
                  </h3>
                  {roomData.highestBidderTeamIndex !== null && (
                    <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                      Feita pela Equipe {roomData.highestBidderTeamIndex + 1}
                    </p>
                  )}
                </div>
                
                {isMyTurnToBet && amIBettor ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                    <h4>Sua vez de apostar!</h4>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                      <input 
                        type="number" 
                        min={roomData.currentBet + 1} 
                        value={betInput} 
                        onChange={e => setBetInput(e.target.value)} 
                        placeholder={roomData.currentBet + 1}
                        style={{ width: '100px', fontSize: '1.5rem', textAlign: 'center' }} 
                      />
                      <button onClick={() => socket.emit('placeDuvidoBet', { bet: parseInt(betInput) || (roomData.currentBet + 1) })} style={{ margin: 0 }}>
                        Apostar
                      </button>
                    </div>
                    {roomData.currentBet > 0 && (
                      <button onClick={() => socket.emit('callDuvido')} style={{ background: '#ef4444', marginTop: '1rem' }}>
                        Duvido!
                      </button>
                    )}
                  </div>
                ) : (
                  <h4 style={{ color: 'var(--text-muted)' }}>
                    Vez da Equipe {roomData.turnTeamIndex + 1} apostar...
                  </h4>
                )}
              </div>
            ) : (
              <div>
                <h3 style={{ color: '#ef4444', marginBottom: '1rem' }}>ALGUÉM DUVIDOU! 🚨</h3>
                <div style={{ fontSize: '3rem', fontWeight: 'bold', color: 'var(--primary)', margin: '1rem 0' }}>
                  ⏱️ {formatTime(roomData.turnEndTime)}
                </div>
                
                <h4 style={{ color: 'var(--text-muted)', marginTop: '2rem' }}>A Equipe {roomData.highestBidderTeamIndex + 1} precisa listar:</h4>
                <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#fbbf24', margin: '1rem 0' }}>
                  {roomData.currentBet} itens
                </div>
                
                <div style={{ marginTop: '2rem', padding: '2rem', background: 'rgba(255,255,255,0.05)', borderRadius: '12px' }}>
                  <h4 style={{ color: 'var(--text-muted)' }}>Pergunta:</h4>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', margin: '1rem 0', color: 'white' }}>
                    {roomData.currentQuestion}
                  </div>
                </div>

                {roomData.highestBidderTeamIndex === myTeamIndex ? (
                  amIGuesser ? (
                    <h3 style={{ color: '#10b981', marginTop: '2rem' }}>🗣️ RESPONDA EM VOZ ALTA!</h3>
                  ) : (
                    <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
                      <h4 style={{ color: 'var(--text-muted)' }}>O seu adivinhador falou {roomData.currentBet} itens corretos?</h4>
                      <div style={{ display: 'flex', gap: '1rem' }}>
                        <button onClick={() => socket.emit('duvidoChallengeResult', { success: false })} style={{ background: 'transparent', border: '1px solid #ef4444', color: '#ef4444', margin: 0 }}>Falhou</button>
                        <button onClick={() => socket.emit('duvidoChallengeResult', { success: true })} style={{ background: '#10b981', margin: 0 }}>Conseguiu!</button>
                      </div>
                    </div>
                  )
                ) : (
                  <h4 style={{ color: 'var(--text-muted)', marginTop: '2rem' }}>
                    Avaliando o desempenho da Equipe {roomData.highestBidderTeamIndex + 1}...
                  </h4>
                )}
              </div>
            )}
            
            <div style={{ marginTop: '4rem', paddingTop: '2rem', borderTop: '1px solid var(--glass-border)' }}>
              <h4 style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Placar:</h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'center' }}>
                {roomData.teams?.map((t, index) => (
                  <div key={index} style={{ 
                    padding: '1rem', 
                    borderRadius: '12px', 
                    background: 'var(--bg-card)',
                    border: index === roomData.turnTeamIndex && roomData.duvidoState === 'betting' ? '2px solid var(--primary)' : '1px solid var(--glass-border)',
                  }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>Equipe {index + 1}</div>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                      {t.map(getPlayerName).join(' & ')}
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary)', marginTop: '0.5rem' }}>
                      {roomData.teamScores[index]} pts
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (roomData.gameType === 'impostor') {
      const myData = roomData.playersData.find(p => p.id === myId);
      const iAmImpostor = myId === roomData.impostorId;
      
      return (
        <div className="container" style={{ maxWidth: '800px', textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2>Sala: {roomData.id}</h2>
            <button onClick={handleLeaveRoom} style={{ padding: '0.5rem 1rem', margin: 0, background: 'transparent', border: '1px solid #ef4444', color: '#ef4444' }}>Sair</button>
          </div>
          
          <div className="glass-panel" style={{ marginTop: '2rem', padding: '3rem 1rem' }}>
            {roomData.currentQuestion && (
              <div style={{ marginBottom: '2rem', padding: '1.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', border: '1px dashed var(--secondary)' }}>
                <h4 style={{ color: 'var(--secondary)', marginBottom: '0.5rem' }}>Pergunta da Rodada:</h4>
                <p style={{ fontSize: '1.3rem', fontWeight: 'bold' }}>"{roomData.currentQuestion}"</p>
                {isHost && (
                  <button onClick={handleNextQuestion} style={{ marginTop: '1rem', background: 'var(--bg-card)', border: '1px solid var(--primary)', padding: '0.5rem 1rem', fontSize: '0.9rem', width: 'auto' }}>
                    Sorteia Nova Pergunta
                  </button>
                )}
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
                    <span style={{ fontWeight: 'bold', marginRight: '0.5rem', color: index === 0 ? 'var(--primary)' : 'inherit' }}>{index + 1}º</span> {p.name} {p.connected === false ? '(Off)' : ''} {p.id === myId ? '(Você)' : ''} {p.votedFor ? '✅' : ''}
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
                      {p.name} {p.connected === false ? '(Off)' : ''}
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

    if (roomData.gameType === 'nota') {
      const isAvaliador = roomData.players[roomData.turnIndex % roomData.players.length] === myId;
      const avaliadorName = roomData.playersData.find(p => p.id === roomData.players[roomData.turnIndex % roomData.players.length])?.name;
      const myData = roomData.playersData.find(p => p.id === myId);

      return (
        <div className="container" style={{ maxWidth: '800px', textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2>Sala: {roomData.id}</h2>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <div className="badge" style={{ background: 'var(--primary)', color: 'white' }}>Rodada {roomData.currentRound} / {roomData.maxRounds}</div>
              <button onClick={handleLeaveRoom} style={{ padding: '0.5rem 1rem', margin: 0, background: 'transparent', border: '1px solid #ef4444', color: '#ef4444' }}>Sair</button>
            </div>
          </div>
          
          <div className="glass-panel" style={{ marginTop: '2rem', padding: '3rem 2rem' }}>
            {roomData.notaState === 'answering' && (
              <>
                {isAvaliador ? (
                  <>
                    <h3 style={{ marginBottom: '1rem' }}>Sua vez de avaliar!</h3>
                    <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: '12px', marginBottom: '2rem' }}>
                      <p style={{ fontSize: '1.2rem', color: '#aaa', marginBottom: '0.5rem' }}>O tema é:</p>
                      <h2 style={{ fontSize: '2rem', color: '#ec4899' }}>{roomData.currentQuestion}</h2>
                    </div>
                    <div style={{ marginBottom: '2rem' }}>
                      <p style={{ fontSize: '1.2rem' }}>Sua nota secreta é:</p>
                      <h1 style={{ fontSize: '4rem', margin: '1rem 0', color: '#10b981' }}>{roomData.currentNota} / 10</h1>
                    </div>
                    <p style={{ marginBottom: '1rem' }}>Dê uma dica para os outros adivinharem a sua nota:</p>
                    <input 
                      type="text" 
                      value={notaAnswer} 
                      onChange={e => setNotaAnswer(e.target.value)} 
                      placeholder="Sua resposta / dica..." 
                      style={{ fontSize: '1.2rem', padding: '1rem', width: '100%', marginBottom: '1rem' }} 
                    />
                    <button 
                      onClick={() => { socket.emit('submitNotaAnswer', { answer: notaAnswer }); setNotaAnswer(''); }}
                      disabled={!notaAnswer}
                      style={{ background: 'linear-gradient(135deg, #ec4899, #be185d)' }}
                    >
                      Enviar Dica
                    </button>
                  </>
                ) : (
                  <>
                    <h3 style={{ marginBottom: '1rem' }}>Aguarde...</h3>
                    <div className="pulse" style={{ fontSize: '1.5rem', margin: '3rem 0' }}>
                      ⏳ {avaliadorName} está pensando em uma dica...
                    </div>
                    <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: '12px' }}>
                      <p style={{ fontSize: '1.2rem', color: '#aaa', marginBottom: '0.5rem' }}>O tema da rodada é:</p>
                      <h2 style={{ fontSize: '2rem', color: '#ec4899' }}>{roomData.currentQuestion}</h2>
                    </div>
                  </>
                )}
              </>
            )}

            {roomData.notaState === 'guessing' && (
              <>
                <h3 style={{ marginBottom: '1rem' }}>Adivinhe a Nota!</h3>
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: '12px', marginBottom: '2rem' }}>
                  <p style={{ fontSize: '1.2rem', color: '#aaa', marginBottom: '0.5rem' }}>O tema é: <strong>{roomData.currentQuestion}</strong></p>
                  <p style={{ fontSize: '1.2rem', color: '#aaa', marginTop: '1rem' }}>A dica de {avaliadorName} foi:</p>
                  <h2 style={{ fontSize: '2rem', color: '#3b82f6', marginTop: '0.5rem' }}>"{roomData.notaAnswer}"</h2>
                </div>
                
                {isAvaliador ? (
                  <div className="pulse" style={{ fontSize: '1.2rem', margin: '2rem 0' }}>
                    Aguardando os outros jogadores palpitarem...
                  </div>
                ) : myData.hasSubmittedNotaGuess ? (
                  <div style={{ fontSize: '1.2rem', margin: '2rem 0', color: '#10b981' }}>
                    ✅ Palpite enviado! Aguardando outros jogadores...
                  </div>
                ) : (
                  <>
                    <p style={{ marginBottom: '1.5rem', fontSize: '1.1rem' }}>Qual foi a nota que ele(a) recebeu de 1 a 10?</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'center' }}>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                        <button 
                          key={num} 
                          onClick={() => socket.emit('submitNotaGuess', { guess: num })}
                          style={{ 
                            width: '60px', 
                            height: '60px', 
                            fontSize: '1.5rem', 
                            background: 'rgba(255,255,255,0.1)', 
                            border: '2px solid rgba(255,255,255,0.2)',
                            margin: 0,
                            padding: 0
                          }}
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </>
            )}

            {roomData.notaState === 'revealed' && (
              <>
                <h3 style={{ marginBottom: '1rem' }}>Resultado da Rodada</h3>
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '2rem', borderRadius: '12px', marginBottom: '2rem' }}>
                  <p style={{ fontSize: '1.2rem' }}>A nota secreta de {avaliadorName} era:</p>
                  <h1 style={{ fontSize: '5rem', margin: '1rem 0', color: '#10b981' }}>{roomData.currentNota}</h1>
                  <p style={{ fontSize: '1.2rem', color: '#aaa' }}>Tema: {roomData.currentQuestion}</p>
                  <p style={{ fontSize: '1.5rem', color: '#3b82f6', marginTop: '1rem' }}>"{roomData.notaAnswer}"</p>
                </div>

                <div style={{ textAlign: 'left', background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '8px', marginBottom: '2rem' }}>
                  <h4 style={{ marginBottom: '1rem' }}>Palpites:</h4>
                  {roomData.players.map(pId => {
                    if (pId === roomData.players[roomData.turnIndex % roomData.players.length]) return null;
                    const p = roomData.playersData.find(x => x.id === pId);
                    const guess = roomData.notaGuesses[pId];
                    const isCorrect = guess === roomData.currentNota;
                    return (
                      <div key={pId} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                        <span>{p.name}</span>
                        <span style={{ color: isCorrect ? '#10b981' : '#ef4444', fontWeight: 'bold' }}>
                          Chutou: {guess} {isCorrect && '(+10 pts)'}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {isAvaliador ? (
                  <button onClick={() => socket.emit('nextNotaRound')} style={{ background: 'linear-gradient(135deg, #10b981, #047857)', fontSize: '1.2rem', padding: '1rem 2rem' }}>
                    Próxima Rodada
                  </button>
                ) : (
                  <p style={{ color: '#aaa' }}>Aguardando {avaliadorName} iniciar a próxima rodada...</p>
                )}
              </>
            )}
          </div>
        </div>
      );
    }


  return (
      <div className="container" style={{ maxWidth: '1000px' }}>
        <div className="flex-row">
          <h2>Sala: {roomData.id}</h2>
          <button onClick={handleLeaveRoom} style={{ padding: '0.5rem 1rem', margin: 0, background: 'transparent', border: '1px solid #ef4444', color: '#ef4444' }}>Sair</button>
        </div>
        
        <div className="players-grid">
          {roomData.playersData.map((p, index) => {
            const isMe = p.id === myId;
            return (
              <div key={p.id} className={`player-card ${isMe ? 'my-card' : ''}`}>
                <div className="score">{p.score}</div>
                <div className="player-name">{p.name} {p.connected === false ? '(Off)' : ''} {p.id === roomData.host ? '👑' : ''} {isMe ? '(Você)' : ''}</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--secondary)', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                  {index === 0 ? '🎯 1º a jogar' : `${index + 1}º a jogar`}
                </div>
                
                <div className="player-character" style={{ fontSize: isMe ? '3rem' : '1.5rem' }}>
                  {isMe ? '?' : p.character}
                </div>
                {isMe && <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Descubra quem você é!</p>}
                
                {!p.finishTime ? (
                  isHost && !roomData.impostorCaught ? (
                    <button className="correct-btn" onClick={() => handleCorrectGuess(p.id)}>
                      Marcar Acerto
                    </button>
                  ) : null
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

  if (view === 'palpite_results' && roomData) {
    const isHost = roomData.host === myId;
    return (
      <div className="container" style={{ maxWidth: '800px', textAlign: 'center' }}>
        <h2>Fim da Rodada {roomData.currentRound}</h2>
        
        <div className="glass-panel" style={{ marginTop: '2rem', padding: '3rem 1rem' }}>
          <h3 style={{ color: 'var(--text-muted)' }}>A resposta correta era:</h3>
          <div style={{ fontSize: '4rem', fontWeight: 'bold', color: '#10b981', margin: '1rem 0 3rem' }}>
            {roomData.currentPalpite?.answer}
          </div>
          
          <div style={{ textAlign: 'left', maxWidth: '600px', margin: '0 auto' }}>
            <h4 style={{ marginBottom: '1rem', color: 'var(--secondary)' }}>Ranking da Rodada:</h4>
            {roomData.sortedPalpites && roomData.sortedPalpites.map((sp, index) => {
              const pData = roomData.playersData.find(p => p.id === sp.pId);
              return (
                <div key={sp.pId} style={{ 
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '1rem', background: sp.pId === myId ? 'rgba(255,255,255,0.1)' : 'var(--bg-card)',
                  border: '1px solid var(--glass-border)', borderRadius: '8px', marginBottom: '0.5rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', width: '30px' }}>#{sp.rank}</div>
                    <div>
                      <div style={{ fontWeight: 'bold' }}>{pData?.name} {sp.pId === myId ? '(Você)' : ''}</div>
                      <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Palpite: {sp.guess} (Erro: {sp.diff})</div>
                    </div>
                  </div>
                  {sp.pointsEarned > 0 && (
                    <div style={{ background: 'var(--primary)', color: 'white', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 'bold' }}>
                      +{sp.pointsEarned} pts
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          
          {isHost && (
            <div style={{ marginTop: '3rem' }}>
              <button onClick={handleNextPalpiteRound} style={{ padding: '1rem 2rem', fontSize: '1.2rem' }}>
                {roomData.currentRound < roomData.maxRounds ? 'Próxima Pergunta ➡' : 'Ver Ranking Final 🏆'}
              </button>
            </div>
          )}
          {!isHost && (
            <p style={{ marginTop: '3rem', color: 'var(--text-muted)' }}>Aguardando anfitrião...</p>
          )}
        </div>
      </div>
    );
  }

  if (view === 'finished' && roomData) {
    if (roomData.gameType === 'palpite') {
      const sortedPlayers = [...roomData.playersData].sort((a, b) => b.score - a.score);
      return (
        <div className="container" style={{ maxWidth: '800px', textAlign: 'center' }}>
          <div className="glass-panel">
            <h2><Trophy size={48} style={{ color: '#fbbf24', display: 'block', margin: '0 auto 1rem' }}/> Ranking Final (Palpite)</h2>
            <p style={{ fontSize: '1.2rem', marginBottom: '2rem', color: 'var(--text-muted)' }}>Fim das {roomData.maxRounds} rodadas!</p>
            
            <div style={{ textAlign: 'left', maxWidth: '600px', margin: '0 auto' }}>
              {sortedPlayers.map((p, index) => (
                <div key={p.id} style={{ 
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '1.5rem', background: p.id === myId ? 'rgba(255,255,255,0.1)' : 'var(--bg-card)',
                  border: '1px solid var(--glass-border)', borderRadius: '12px', marginBottom: '1rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', width: '40px', color: index === 0 ? '#fbbf24' : index === 1 ? '#9ca3af' : index === 2 ? '#b45309' : 'inherit' }}>
                      #{index + 1}
                    </div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{p.name} {p.connected === false ? '(Off)' : ''} {p.id === myId ? '(Você)' : ''}</div>
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary)' }}>
                    {p.score} pts
                  </div>
                </div>
              ))}
            </div>
            
            {roomData.host === myId && (
              <button onClick={() => socket.emit('restartGame')} style={{ marginTop: '2rem' }}>Voltar ao Lobby</button>
            )}
          </div>
        </div>
      );
    }
    
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
                  <span><strong>#{index + 1} {p.name} {p.connected === false ? '(Off)' : ''}</strong></span>
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
import React, { useState, useEffect } from 'react';
import { socket } from './socket';
import { Users, Crown, Play, Hash, Check, Trophy, Timer } from 'lucide-react';

