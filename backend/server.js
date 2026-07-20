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

const PERGUNTAS_PALPITE = [
  // --- CIÊNCIA, CORPO HUMANO & NATUREZA ---
  { question: "Aproximadamente quantos ossos tem o corpo de um bebê recém-nascido?", answer: 300 },
  { question: "Quantos elementos da Tabela Periódica ocorrem naturalmente na Terra?", answer: 94 },
  { question: "Quantas luas confirmadas o planeta Saturno possui?", answer: 146 },
  { question: "Quantos minutos durou o histórico primeiro voo espacial de Yuri Gagarin em 1961?", answer: 108 },
  { question: "Aproximadamente quantos milissegundos leva um piscar de olhos humano médio?", answer: 300 },
  { question: "Quantas vértebras cervicais (no pescoço) tem uma girafa?", answer: 7 },
  { question: "Quantos dentes um tubarão-branco pode perder e substituir ao longo da vida (aprox)?", answer: 30000 },
  { question: "Qual a temperatura aproximada no núcleo do Sol em milhões de graus Celsius?", answer: 15 },
  { question: "Quantas garrafas de vinho de 750ml equivalem ao tamanho de um barril padrão (225L)?", answer: 300 },
  { question: "Quantos dias dura um ano no planeta Mercúrio?", answer: 88 },
  { question: "Quantos quilômetros por segundo é a velocidade de escape da Terra?", answer: 11 },
  { question: "Quantos pares de nervos cranianos o ser humano possui?", answer: 12 },
  { question: "Aproximadamente quantos neurônios existem no cérebro humano (em bilhões)?", answer: 86 },
  { question: "Quantos batimentos por minuto tem o coração de uma baleia-azul durante um mergulho profundo?", answer: 2 },
  { question: "Quantos cromossomos tem uma célula de um cão doméstico?", answer: 78 },
  { question: "Aproximadamente quantos quilos de bambu um panda gigante adulto come por dia?", answer: 38 },
  { question: "Quantos músculos o gato possui em cada orelha para poder movê-las?", answer: 32 },
  { question: "Qual a expectativa média de vida em anos de uma águia-careca na natureza?", answer: 20 },
  { question: "Quantas ventosas existem em média nos 8 braços de um polvo comum?", answer: 1600 },
  { question: "Qual o diâmetro aproximado do planeta Marte em quilômetros?", answer: 6779 },
  { question: "Qual a porcentagem de oxigênio presente na atmosfera terrestre atual?", answer: 21 },
  { question: "Aproximadamente quantos litros de saliva a boca humana produz por dia?", answer: 1 },
  { question: "Quantas pálpebras um camelo possui em cada olho para se proteger da areia?", answer: 3 },
  { question: "Qual a velocidade máxima (em km/h) do vento registrado no furacão mais forte da história?", answer: 345 },
  { question: "Quantas espécies conhecidas de cobras venenosas existem no mundo (aprox)?", answer: 600 },
  { question: "Quantas válvulas existem no coração humano?", answer: 4 },
  { question: "Quantos dias dura o período de gestação de um cachorro?", answer: 63 },
  { question: "Qual a profundidade média dos oceanos da Terra em metros (aprox)?", answer: 3688 },
  { question: "Quantas semanas dura o período de gestação de um ser humano em média?", answer: 40 },
  { question: "Quantos litros de sangue o coração humano bomba por minuto em repouso (aprox)?", answer: 5 },

  // --- GEOGRAFIA, PAÍSES & MONUMENTOS ---
  { question: "Quantos países existem no continente africano?", answer: 54 },
  { question: "Quantos países o Equador terrestre cruza oficialmente?", answer: 13 },
  { question: "Quantas pontes cruzam o Rio Amazonas em toda a sua extensão?", answer: 0 },
  { question: "Quantos degraus é preciso subir para ir a pé do térreo até o topo da Torre Eiffel?", answer: 1665 },
  { question: "Qual a altura em metros do Monte K2 (a segunda montanha mais alta do mundo)?", answer: 8611 },
  { question: "Quantos fusos horários a França possui (contando seus territórios ultramarinos)?", answer: 12 },
  { question: "Qual a altura do Cristo Redentor no Rio de Janeiro (apenas a estátua, sem o pedestal)?", answer: 30 },
  { question: "Quantos países no mundo fazem fronteira com apenas 1 outro país?", answer: 16 },
  { question: "Quantas ilhas formam o país da Indonésia (aprox em milhares)?", answer: 17 },
  { question: "Qual a distância aproximada em km entre o Ponto Nemo (local mais isolado do oceano) e a terra firme mais próxima?", answer: 2688 },
  { question: "Quantos países do mundo não possuem acesso direto ao mar (encravados)?", answer: 44 },
  { question: "Qual a extensão em quilômetros da rodovia Transamazônica (BR-230) planejada originalmente?", answer: 4260 },
  { question: "Quantos municípios existem no estado de São Paulo?", answer: 645 },
  { question: "Quantos municípios existem no Brasil no total?", answer: 5570 },
  { question: "Qual a área total da Floresta Amazônica em milhões de quilômetros quadrados (aprox)?", answer: 5 },
  { question: "Aproximadamente quantos metros abaixo do nível do mar fica as margens do Mar Morto?", answer: 430 },
  { question: "Quantos vulcões ativos existem no planeta Terra atualmente (aprox)?", answer: 1350 },
  { question: "Qual o comprimento da ferrovia Transiberiana na Rússia em quilômetros?", answer: 9289 },
  { question: "Quantos estados compõem o México?", answer: 31 },
  { question: "Qual a altura da Queda do Anjo na Venezuela (a cachoeira mais alta do mundo) em metros?", answer: 979 },
  { question: "Quantos países fazem parte da OTAN atualmente?", answer: 32 },
  { question: "Qual a população aproximada do menor país do mundo (Vaticano)?", answer: 800 },
  { question: "Quantos quilômetros de canal possui a cidade de Veneza na Itália (aprox)?", answer: 40 },
  { question: "Quantos cantões compõem a Confederação Suíça?", answer: 26 },
  { question: "Qual a largura mínima em metros do Estreito de Gibraltar?", answer: 14000 },
  { question: "Aproximadamente quantos ilhotas/corais compõem as Ilhas Maldivas?", answer: 1192 },
  { question: "Quantos países compõem o Reino Unido?", answer: 4 },
  { question: "Quantas estrelas tem a bandeira nacional da China?", answer: 5 },
  { question: "Qual a altura do Big Ben (Torre Elizabeth) em Londres em metros?", answer: 96 },
  { question: "Quantos parques nacionais existem no Brasil atualmente (aprox)?", answer: 74 },

  // --- HISTÓRIA, SOCIEDADE & EVENTOS ---
  { question: "Em que ano foram descobertos os destroços do Titanic no fundo do Atlântico?", answer: 1985 },
  { question: "Em que ano ocorreu a Queda de Constantinopla (Fim do Império Bizantino)?", answer: 1453 },
  { question: "Quantos dias durou a famosa Batalha de Stalingrado na 2ª Guerra Mundial?", answer: 162 },
  { question: "Em que ano a bomba atômica 'Tsar Bomba' (a mais potente da história) foi testada?", answer: 1961 },
  { question: "Em que ano começou a Guerra da Coreia?", answer: 1950 },
  { question: "Quantos Papas a Igreja Católica teve em toda a sua história até o Papa Francisco?", answer: 266 },
  { question: "Em que ano ocorreu a tragédia do Voo 19 no Triângulo das Bermudas?", answer: 1945 },
  { question: "Em que ano a erupção do Monte Vésuvo destruiu Pompeia?", answer: 79 },
  { question: "Quantos presidentes o Brasil teve desde a Proclamação da República até 2026?", answer: 39 },
  { question: "Em que ano foi assinado o armistício da Primeira Guerra Mundial?", answer: 1918 },
  { question: "Em que ano o Canal de Suez foi aberto ao tráfego marítimo?", answer: 1869 },
  { question: "Em que ano ocorreu o grande incêndio de Roma durante o reinado de Nero?", answer: 64 },
  { question: "Quantos dias durou a Guerra dos Seis Dias em 1967?", answer: 6 },
  { question: "Em que ano o primeiro voo do 14-Bis de Santos Dumont aconteceu em Paris?", answer: 1906 },
  { question: "Em que ano começou a construção da Grande Muralha da China (primeira fase unificada)?", answer: 221 },
  { question: "Em que ano a peste conhecida como Gripe Espanhola infectou um terço do mundo?", answer: 1918 },
  { question: "Em que ano os Jogos Olímpicos de Verão foram cancelados pela 1ª vez na história?", answer: 1916 },
  { question: "Em que ano Isaac Newton publicou sua obra 'Principia Mathematica'?", answer: 1687 },
  { question: "Em que ano foi inaugurada a Estátua da Liberdade em Nova York?", answer: 1886 },
  { question: "Em que ano foi assinado o Tratado de Versalhes?", answer: 1919 },
  { question: "Em que ano o Concorde fez seu último voo comercial de passageiros?", answer: 2003 },
  { question: "Em que ano aconteceu o desastre com o ônibus espacial Challenger?", answer: 1986 },
  { question: "Em que ano a moeda Euro entrou em circulação física de fato?", answer: 2002 },
  { question: "Em que ano Charles Darwin publicou 'A Origem das Espécies'?", answer: 1859 },
  { question: "Em que ano começou o processo da Inquisição Espanhola?", answer: 1478 },
  { question: "Em que ano Tutancâmon teve sua tumba descoberta por Howard Carter?", answer: 1922 },
  { question: "Quantos anos viveu a pessoa mais velha já documentada na história (Jeanne Calment)?", answer: 122 },
  { question: "Em que ano ocorreu o massacre de Tiananmen (Praça da Paz Celestial)?", answer: 1989 },
  { question: "Em que ano foi realizada a Semana de Arte Moderna no Brasil?", answer: 1922 },
  { question: "Em que ano Neil Armstrong faleceu?", answer: 2012 },

  // --- ENTRETENIMENTO, CINEMA, TV & MÚSICA ---
  { question: "Quantas peças de Lego são usadas para montar o set da Millennium Falcon Collector's Series?", answer: 7541 },
  { question: "Quantos minutos tem a versão estendida completa do filme 'O Senhor dos Anéis: O Retorno do Rei'?", answer: 263 },
  { question: "Em que ano estreou o primeiro filme da franquia 'O Exterminador do Futuro'?", answer: 1984 },
  { question: "Quantas palavras o personagem Arnold Schwarzenegger fala no filme 'O Exterminador do Futuro 2' (aprox)?", answer: 700 },
  { question: "Quantos prêmios Oscar foram dados ao filme 'La La Land' após a correção do erro do melhor filme?", answer: 6 },
  { question: "Em que ano foi lançado o clássico álbum 'Abbey Road' dos Beatles?", answer: 1969 },
  { question: "Quantos episódios no total possui a série animada 'Dragon Ball Z'?", answer: 291 },
  { question: "Qual a duração em minutos de 'O Chefão: Parte II'?", answer: 202 },
  { question: "Em que ano o canal MTV estreou nos Estados Unidos?", answer: 1981 },
  { question: "Quantos Oscars Walt Disney ganhou pessoalmente ao longo de sua vida?", answer: 22 },
  { question: "Em que ano estreou a série de comédia 'Seinfeld'?", answer: 1989 },
  { question: "Quantos minutos dura o clipe de 'Thriller' de Michael Jackson?", answer: 14 },
  { question: "Quantas páginas tem a edição original em inglês do livro 'Harry Potter e a Ordem da Fênix'?", answer: 766 },
  { question: "Em que ano foi lançado o filme 'De Volta Para o Futuro'?", answer: 1985 },
  { question: "Quantos episódios foram produzidos na série 'Lost'?", answer: 121 },
  { question: "Qual o orçamento em milhões de dólares do filme 'Titanic' (1997)?", answer: 200 },
  { question: "Em que ano o festival de Woodstock original aconteceu?", answer: 1969 },
  { question: "Quantos minutos dura a música 'Bohemian Rhapsody' do Queen (arredondado para o minuto mais próximo)?", answer: 6 },
  { question: "Quantos episódios tem a série 'Game of Thrones' no total?", answer: 73 },
  { question: "Em que ano estreou a primeira versão do reality show 'Survivor' nos EUA?", answer: 2000 },
  { question: "Quantos filmes oficiais de James Bond (007) foram produzidos pela EON Productions até 2026?", answer: 25 },
  { question: "Em que ano o primeiro filme do 'Harry Potter e a Pedra Filosofal' chegou aos cinemas?", answer: 2001 },
  { question: "Quantos atores diferentes já interpretaram o Batman em filmes live-action no cinema?", answer: 9 },
  { question: "Em que ano foi lançado o filme 'Jurassic Park' de Steven Spielberg?", answer: 1993 },
  { question: "Quantas canções estão no álbum 'Nevermind' do Nirvana?", answer: 12 },
  { question: "Quantos episódios teve a série 'Arquivo X' em suas temporadas originais?", answer: 218 },
  { question: "Em que ano a cantora Madonna lançou seu primeiro álbum de estúdio?", answer: 1983 },
  { question: "Qual a duração em minutos de 'Interestelar' de Christopher Nolan?", answer: 169 },
  { question: "Quantas temporadas durou a série 'How I Met Your Mother'?", answer: 9 },
  { question: "Em que ano foi exibido o último episódio da novela 'Avenida Brasil'?", answer: 2012 },

  // --- TECNOLOGIA, JOGOS & ENGENHARIA ---
  { question: "Qual o recorde mundial de velocidade (em km/h) alcançado pelo trem-bala Maglev L0 no Japão?", answer: 603 },
  { question: "Quantos minigames no total existiam no primeiro jogo 'Mario Party' para Nintendo 64?", answer: 50 },
  { question: "Em que ano o supercomputador Deep Blue da IBM derrotou o campeão Garry Kasparov no xadrez?", answer: 1997 },
  { question: "Quantos caracteres era o limite de um tweet no Twitter quando a rede foi lançada em 2006?", answer: 140 },
  { question: "Qual o peso aproximado em quilos de um lingote de ouro padrão armazenado por Bancos Centrais (400 oz)?", answer: 12 },
  { question: "Em que ano foi lançado o lendário jogo 'Grand Theft Auto: San Andreas'?", answer: 2004 },
  { question: "Quantos Pokémons existiam na primeira geração (Kanto)?", answer: 151 },
  { question: "Em que ano foi fundado o site de buscas Google?", answer: 1998 },
  { question: "Quantos pinos tem o soquete de processadores Intel LGA 1700?", answer: 1700 },
  { question: "Em que ano foi lançado o primeiro jogo da franquia 'The Legend of Zelda' no Japão?", answer: 1986 },
  { question: "Qual a capacidade de armazenamento original em Megabytes (MB) de um disquete de 3,5 polegadas HD?", answer: 1 },
  { question: "Em que ano o aplicativo TikTok foi lançado globalmente fora da China?", answer: 2017 },
  { question: "Quantos quilos de carga útil o foguete Saturn V conseguia levar para a órbita baixa (em milhares)?", answer: 140 },
  { question: "Em que ano o jogo 'World of Warcraft' foi lançado?", answer: 2004 },
  { question: "Quantas teclas tem um teclado de computador padrão ABNT2 no Brasil?", answer: 107 },
  { question: "Em que ano foi criado o protocolo de internet HTTP por Tim Berners-Lee?", answer: 1989 },
  { question: "Qual foi o ano de lançamento do console Game Boy original da Nintendo?", answer: 1989 },
  { question: "Quantos transistores (em bilhões) possui o chip Apple M1 original?", answer: 16 },
  { question: "Em que ano o primeiro vírus de computador para PC ('Brain') foi detectado?", answer: 1986 },
  { question: "Qual o peso em toneladas da Estação Espacial Internacional (ISS) em órbita (aprox)?", answer: 450 },
  { question: "Em que ano foi fundada a empresa Apple por Steve Jobs e Steve Wozniak?", answer: 1976 },
  { question: "Quantos milhões de cópias o jogo 'Tetris' vendeu em toda a história (aprox)?", answer: 520 },
  { question: "Em que ano o serviço de streaming Spotify foi lançado publicamente?", answer: 2008 },
  { question: "Quantas estrelas existem na constelação do Cruzeiro do Sul estampada na bandeira do Brasil?", answer: 5 },
  { question: "Em que ano o jogo 'Half-Life 2' foi lançado para PC?", answer: 2004 },
  { question: "Quantas portas de rede (RJs) possui um switch comercial padrão de rack pequeno?", answer: 24 },
  { question: "Em que ano foi aberta a primeira loja oficial da Apple Store?", answer: 2001 },
  { question: "Qual a velocidade aproximada de conexão (em Kbps) de um modem discado V.90 dos anos 90?", answer: 56 },
  { question: "Em que ano a linguagem JavaScript foi criada em apenas 10 dias por Brendan Eich?", answer: 1995 },
  { question: "Quantas variações de cores primárias de luz (RGB) são combinadas nos pixels de telas?", answer: 3 },

  // --- ESPORTES, RECORDES & JOGOS DE MESA ---
  { question: "Quantas pedras existem em um jogo completo de dominó do tipo 'Duplo Nove'?", answer: 55 },
  { question: "Qual a velocidade do saque de tênis mais rápido registrado na história (em km/h)?", answer: 263 },
  { question: "Quantas bolinhas numeradas existem em um jogo de bingo tradicional?", answer: 75 },
  { question: "Em que ano o Brasil sediou a sua primeira Copa do Mundo de Futebol?", answer: 1950 },
  { question: "Quantos pontos no total marcou o jogador LeBron James ao quebrar o recorde histórico da NBA (em milhares aprox)?", answer: 40 },
  { question: "Quantos metros tem a pista de atletismo oficial em uma volta completa na raia 1?", answer: 400 },
  { question: "Qual o peso exato da bola de basquete masculina oficial da NBA em gramas (aprox)?", answer: 624 },
  { question: "Quantas jogadas no mínimo são necessárias para dar um Xeque-Mate no xadrez (Mate do Louco)?", answer: 2 },
  { question: "Em que ano o piloto Lewis Hamilton venceu seu primeiro título mundial de Fórmula 1?", answer: 2008 },
  { question: "Qual a altura oficial da rede de vôlei masculino em centímetros em relação ao solo?", answer: 243 },
  { question: "Quantos países participaram dos Jogos Olímpicos de Verão de Atenas em 1896?", answer: 14 },
  { question: "Qual o tempo do recorde mundial dos 100 metros rasos de Usain Bolt em segundos (arredondado para o inteiro mais próximo)?", answer: 10 },
  { question: "Quantas faltas pessoais eliminam um jogador em uma partida da NBA?", answer: 6 },
  { question: "Quantos metros de distância fica a linha de 3 pontos na NBA (no topo do garrafão aprox)?", answer: 7 },
  { question: "Quantos cavalos de potência tem um carro de Fórmula 1 moderno com sistema híbrido (aprox)?", answer: 1000 },
  { question: "Em que ano o nadador Michael Phelps conquistou 8 medalhas de ouro em uma única Olimpíada?", answer: 2008 },
  { question: "Quantas penalidades (yards) são aplicadas em uma falta de 'Pass Interference' na NFL no ponto da falta?", answer: 15 },
  { question: "Quantas partidas no total são disputadas na fase de grupos de uma Copa do Mundo com 32 seleções?", answer: 48 },
  { question: "Qual a pontuação máxima possível de ser feita em uma única jogada de Scrabble (recorde de palavras)?", answer: 1782 },
  { question: "Qual a maior pontuação possível em uma única rodada de Darts (dardo tradicional)?", answer: 180 },
  { question: "Em que ano o surf se tornou uma modalidade olímpica oficial nos Jogos de Tóquio?", answer: 2021 },
  { question: "Quantas vezes a seleção da Argentina venceu a Copa do Mundo masculina até hoje?", answer: 3 },
  { question: "Qual a distância em metros da corrida de obstáculos com barreiras padrão nas Olimpíadas?", answer: 110 },
  { question: "Quantos segundos um lutador de boxe tem para se levantar antes de ser declarado nocauteado?", answer: 10 },
  { question: "Aproximadamente quantas plumas são usadas para fabricar uma peteca oficial de badminton?", answer: 16 },
  { question: "Em que ano Mike Tyson se tornou o campeão mundial dos pesos-pesados mais jovem da história?", answer: 1986 },
  { question: "Quantos baralhos completos são usados em uma mesa tradicional de Blackjack (21) de cassino em um 'Shoe'?", answer: 6 },
  { question: "Quantos metros mede uma trave de futebol profissional em largura (de poste a poste)?", answer: 7 },
  { question: "Qual o peso de uma bola de boliche profissional mais pesada permitida em quilos (aprox 16 lbs)?", answer: 7 },
  { question: "Em que ano ocorreu a famosa 'Luta do Século' entre Muhammad Ali e Joe Frazier?", answer: 1971 },

  // --- MATEMÁTICA, MEDIDAS & MEDIÇÕES ---
  { question: "Quantas faces possui um decaedro?", answer: 10 },
  { question: "Qual a soma dos ângulos internos de um hexágono regular em graus?", answer: 720 },
  { question: "Quantas polegadas equivalem a uma jarda?", answer: 36 },
  { question: "Quantos quilos de massa equivalente tem uma libra (lb) de peso (aprox em gramas)?", answer: 453 },
  { question: "Qual o valor do número Pi arredondado para duas casas decimais multiplicado por 100?", answer: 314 },
  { question: "Quantos bits formam exatamente um Byte?", answer: 8 },
  { question: "Quantas milhas terrestres equivalem a 100 quilômetros (aprox)?", answer: 62 },
  { question: "Quantos anos durou a Idade Média segundo a historiografia tradicional (476 d.C. a 1453 d.C.)?", answer: 977 },
  { question: "Quantas horas há em um ano comum de 365 dias?", answer: 8760 },
  { question: "Qual a raiz quadrada de 625?", answer: 25 },
  { question: "Quantos milímetros cúbicos existem em um centímetro cúbico?", answer: 1000 },
  { question: "Quantos vértices possui um cubo?", answer: 8 },
  { question: "Quantas arestas possui uma pirâmide de base quadrada?", answer: 8 },
  { question: "Qual o valor da constante gravitacional da Terra 'g' (m/s²) arredondado multiplicado por 10?", answer: 98 },
  { question: "Quantos zeros existem no número 1 Trilhão (escala curta)?", answer: 12 },
  { question: "Quantos minutos existem em um ano bissexto de 366 dias?", answer: 527040 },
  { question: "Qual o resultado de 2 elevado à décima potência (2^10)?", answer: 1024 },
  { question: "Quantos mililitros tem uma garrafa padrão de champanhe Magnum?", answer: 1500 },
  { question: "Quantos segundos tem um dia completo de 24 horas?", answer: 86400 },
  { question: "Quantas calorias (kcal) queimar é necessário aproximadamente para perder 1 kg de gordura?", answer: 7700 }
];

function generateRoomCode() {
  return Math.random().toString(36).substring(2, 6).toUpperCase();
}

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('createRoom', ({ name, mode, category, gameType, discussionType, maxRounds }) => {
    const roomId = generateRoomCode();
    
    rooms[roomId] = {
      id: roomId,
      gameType: gameType || 'quem_sou_eu',
      mode, // 'random'/'manual', 'cego'/'tradicional'
      discussionType: discussionType || 'livre',
      category: category || 'animais',
      host: socket.id,
      players: [socket.id],
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

    players[socket.id] = {
      id: socket.id,
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
    const player = players[socket.id];
    if (player && rooms[player.roomId] && rooms[player.roomId].host === socket.id) {
      const room = rooms[player.roomId];
      
      if (room.gameType === 'palpite') {
        room.currentRound = 1;
        room.usedQuestions = [];
        
        let initialQuestion = PERGUNTAS_PALPITE[Math.floor(Math.random() * PERGUNTAS_PALPITE.length)];
        room.currentPalpite = initialQuestion;
        room.usedQuestions.push(initialQuestion.question);
        
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
          let initialQuestion = PERGUNTAS_IMPOSTOR[Math.floor(Math.random() * PERGUNTAS_IMPOSTOR.length)];
          room.currentQuestion = initialQuestion;
          room.usedQuestions.push(initialQuestion);
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

  socket.on('submitPalpite', ({ guess }) => {
    const player = players[socket.id];
    if (player && rooms[player.roomId] && rooms[player.roomId].status === 'playing' && rooms[player.roomId].gameType === 'palpite') {
      const room = rooms[player.roomId];
      
      const numGuess = Number(guess);
      if (isNaN(numGuess)) return;
      
      room.palpites[socket.id] = {
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
    const player = players[socket.id];
    if (player && rooms[player.roomId] && rooms[player.roomId].host === socket.id) {
      const room = rooms[player.roomId];
      
      if (room.currentRound < room.maxRounds) {
        room.currentRound++;
        
        // Zera o registro se todas as perguntas esgotarem
        if (room.usedQuestions.length >= PERGUNTAS_PALPITE.length) {
          room.usedQuestions = [];
        }
        
        let newQuestion;
        let attempts = 0;
        do {
          newQuestion = PERGUNTAS_PALPITE[Math.floor(Math.random() * PERGUNTAS_PALPITE.length)];
          attempts++;
        } while (room.usedQuestions.includes(newQuestion.question) && attempts < 100);
        
        room.currentPalpite = newQuestion;
        room.usedQuestions.push(newQuestion.question);
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
    const player = players[socket.id];
    if (player && rooms[player.roomId] && rooms[player.roomId].host === socket.id && rooms[player.roomId].status === 'playing') {
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
          finishTime: p.finishTime,
          hasSubmittedPalpite: p.hasSubmittedPalpite,
          votedFor: p.votedFor
        };
      })
    };
  }
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
